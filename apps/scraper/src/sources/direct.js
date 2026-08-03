import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { stripHtml } from '../lib/text.js';
import { readJson } from '../lib/store.js';
import { CONFIG_DIR, CACHE_DIR } from '../lib/paths.js';

// Direct careers pages — the hidden-jobs source. The 2026-08-03 studio probe
// showed that most name-brand architecture and design studios (Foster +
// Partners, BIG, Gensler, Herzog & de Meuron...) hire only through their own
// websites: no hosted ATS with a public API, so their openings never reach any
// aggregator. This adapter reads those pages the way HiringCafe reads employer
// sites — fetch, then let a model do the parsing — because 30 bespoke HTML
// parsers is team-scale maintenance and one extraction prompt is not.
//
// Flow per firm: robots.txt check -> fetch careers page (one same-host hop to
// a careers/jobs link if the entry URL is a homepage) -> Claude Haiku lists the
// open positions and their URLs -> each posting page is fetched and Haiku
// extracts title/location/salary. The description_text stored is the REAL
// stripped page text, never model prose: the skill miner must read what the
// employer wrote. Extractions are disk-cached by content hash, so an unchanged
// page costs zero tokens on later nights.
//
// Honesty and posture:
//   - robots.txt Disallow is respected; blocked pages are logged and skipped.
//   - No key, no silent nothing: without ANTHROPIC_API_KEY the source logs
//     loudly and returns empty.
//   - posted_at is null — these pages rarely date postings; the first-seen
//     ledger keeps ages honest, same as every other undated source.
//   - Any hosted-ATS URL seen on a page is logged as a discovered tenant so it
//     can graduate to the cheaper deterministic adapter (workday etc.).
export const name = 'direct';

const UA = 'Mozilla/5.0 (compatible; PivotHopScraper/0.1; contact: hello@pivothop.com)';
const MODEL = process.env.DIRECT_MODEL || 'claude-haiku-4-5';
const MAX_JOBS_PER_SITE = Number(process.env.DIRECT_MAX_JOBS) || 30;
const lastHit = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function politeGet(url) {
  const host = new URL(url).host;
  const wait = (lastHit.get(host) ?? 0) + 1500 - Date.now();
  if (wait > 0) await sleep(wait);
  lastHit.set(host, Date.now());
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    return res.ok ? await res.text() : null;
  } catch { return null; }
}

/* RENDERING IS NOT OPTIONAL HERE. Measured 2026-08-03: a raw fetch of
 * fosterandpartners.com/careers returns 73KB of app shell with zero job words —
 * the listings arrive from a JS content API after load, so static HTML can never
 * contain them. Every studio site in this list is a modern JS app; this is the
 * difference between the adapter finding jobs and reporting a confident zero.
 *
 * One browser for the whole run, one page per site, closed in a finally. If
 * Chromium cannot launch (a CI image without it), renderGet returns null and the
 * caller falls back to politeGet — logged loudly, never a silent downgrade. */
let browserPromise = null;
async function getBrowser() {
  if (browserPromise === null) {
    browserPromise = (async () => {
      try {
        const { chromium } = await import('playwright');
        return await chromium.launch();
      } catch { return false; }
    })();
  }
  return browserPromise;
}

async function renderGet(url) {
  const browser = await getBrowser();
  if (!browser) return null;
  const host = new URL(url).host;
  const wait = (lastHit.get(host) ?? 0) + 1500 - Date.now();
  if (wait > 0) await sleep(wait);
  lastHit.set(host, Date.now());
  let page;
  try {
    page = await browser.newPage({ userAgent: UA });
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (!res || res.status() >= 400) return null;
    await page.waitForTimeout(2500); // let the client-side job list paint
    const text = await page.evaluate(() => document.body.innerText);
    // Links come from the LIVE DOM, so client-rendered anchors are included.
    const links = await page.evaluate(() =>
      [...document.querySelectorAll('a[href]')]
        .map((a) => ({ href: a.href, label: (a.innerText || '').trim().slice(0, 120) }))
        .filter((l) => /^https?:/.test(l.href)));
    const html = await page.content();
    return { text, links, html, url: page.url() };
  } catch { return null; } finally { if (page) await page.close().catch(() => {}); }
}

export async function closeBrowser() {
  const b = await (browserPromise ?? Promise.resolve(false));
  if (b) await b.close().catch(() => {});
  browserPromise = null;
}

/* Minimal robots.txt: collect Disallow prefixes under User-agent: * (and our
 * token), block on prefix match. Conservative — Allow overrides are ignored. */
const robotsCache = new Map();
async function allowed(url) {
  const u = new URL(url);
  if (!robotsCache.has(u.origin)) {
    const txt = (await politeGet(`${u.origin}/robots.txt`)) || '';
    const dis = [];
    let applies = false;
    for (const raw of txt.split('\n')) {
      const line = raw.replace(/#.*/, '').trim();
      const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
      if (!m) continue;
      const [, field, value] = m;
      if (/^user-agent$/i.test(field)) applies = value === '*' || /pivothop/i.test(value);
      else if (/^disallow$/i.test(field) && applies && value) dis.push(value);
    }
    robotsCache.set(u.origin, dis);
  }
  return !robotsCache.get(u.origin).some((p) => u.pathname.startsWith(p));
}

/* Truncation-tolerant JSON. A response cut off mid-array is still worth every
 * complete object it managed to emit — throwing away a whole studio because the
 * 30th job was clipped is the wrong trade. Falls back to salvaging balanced
 * {...} objects, which is exactly what a truncated {"jobs":[...]} leaves behind. */
function parseLoose(text) {
  const whole = text.match(/\{[\s\S]*\}/);
  if (whole) { try { return JSON.parse(whole[0]); } catch { /* fall through to salvage */ } }
  const objs = [];
  for (const m of text.matchAll(/\{[^{}]*\}/g)) {
    try { objs.push(JSON.parse(m[0])); } catch { /* skip the clipped one */ }
  }
  const jobs = objs.filter((o) => o && o.title && o.url);
  if (jobs.length) return { jobs };
  return objs.length === 1 ? objs[0] : null;
}

/* Cached model call: an unchanged page never pays twice. */
async function extract(prompt, cacheKeyParts) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const key = crypto.createHash('sha1').update(['direct-v1', MODEL, ...cacheKeyParts].join('|')).digest('hex');
  const cacheFile = path.join(CACHE_DIR, `llm-${key}.json`);
  if (fs.existsSync(cacheFile)) return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    // 4000: a studio with 30 openings overflowed 2000 and returned a truncated
    // array, which threw and lost the whole site (BIG, 2026-08-03).
    body: JSON.stringify({ model: MODEL, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}`);
  const body = await res.json();
  const text = (body.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  const parsed = parseLoose(text);
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(parsed));
  return parsed;
}

// Hosted ATS platforms these studios actually use. Measured 2026-08-03: a big
// practice's "careers page" is nearly always a MARKETING page that links out to
// one of these — Gensler to Avature, HOK to Dayforce, Mecanoo to Homerun, Olson
// Kundig to JazzHR, NBBJ to Jobvite. The job list is never on the page we were
// pointed at, which is why extraction kept returning an honest zero. So when a
// careers page names one of these, the adapter FOLLOWS it and reads there.
const ATS_HINT = /myworkdayjobs\.com|teamtailor\.com|jobs\.personio|bamboohr\.com|homerun\.co|pinpointhq\.com|applytojob\.com|jobvite\.com|icims\.com|breezy\.hr|avature\.net|dayforcehcm\.com|successfactors\.|sapsf\.|taleo\.net|eploy\.net|hirehive\.com|smartrecruiters\.com|greenhouse\.io|lever\.co|ashbyhq\.com|recruitee\.com|workable\.com|recruiting\.paylocity\.com|careers\.hibob\.com/;

function links(html, baseUrl) {
  const out = [];
  for (const m of html.matchAll(/<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const href = new URL(m[1], baseUrl).toString();
      const label = stripHtml(m[2]).trim().slice(0, 120);
      if (/^https?:/.test(href)) out.push({ href, label });
    } catch { /* malformed href */ }
  }
  return out;
}

export async function fetchRaw({ log }) {
  const companies = readJson(path.join(CONFIG_DIR, 'direct-companies.json'))?.companies ?? [];
  if (!process.env.ANTHROPIC_API_KEY) {
    log(`direct: ANTHROPIC_API_KEY not set — ${companies.length} studio careers pages NOT read (add the key to .env / Actions secrets)`);
    return [];
  }
  const rows = [];
  try {
    for (const { name: company, careers } of companies) {
    try {
      if (!(await allowed(careers))) { log(`direct:${company} — robots.txt disallows, skipped`); continue; }

      // Render first — these are JS apps whose listings never appear in raw
      // HTML. Static fetch is the fallback, and it says so when it is used.
      let pageUrl = careers, all, pageText;
      const rendered = await renderGet(careers);
      if (rendered) {
        pageUrl = rendered.url;
        all = rendered.links;
        pageText = rendered.text.slice(0, 12000);
      } else {
        const html = await politeGet(careers);
        if (!html) { log(`direct:${company} — page unreachable (bot wall or dead URL), skipped`); continue; }
        log(`direct:${company} — NOT RENDERED, static HTML only (JS-loaded jobs will be missed)`);
        all = links(html, careers);
        pageText = stripHtml(html).slice(0, 12000);
      }

      // Follow the ATS the careers page points at — that is where the openings
      // are. Only when the current page is not already on it, and only one hop.
      const atsUrl = all.find((l) => ATS_HINT.test(l.href));
      if (atsUrl && !ATS_HINT.test(pageUrl)) {
        log(`direct:${company} — careers page links to a hosted ATS, following: ${atsUrl.href.slice(0, 80)}`);
        if (await allowed(atsUrl.href)) {
          const atsPage = await renderGet(atsUrl.href);
          if (atsPage) {
            pageUrl = atsPage.url;
            all = atsPage.links;
            pageText = atsPage.text.slice(0, 12000);
          } else {
            log(`direct:${company} — ATS page did not render, reading the careers page instead`);
          }
        } else {
          log(`direct:${company} — ATS page disallowed by robots.txt, reading the careers page instead`);
        }
      }

      const linkList = all.filter((l) => l.label).slice(0, 150).map((l) => `${l.label} -> ${l.href}`).join('\n').slice(0, 8000);
      const listing = await extract(
        `This is the careers page of ${company}, a design/architecture studio. From the page text and link list, return ONLY currently-open job positions as JSON: {"jobs":[{"title":"...","url":"..."}]}. Rules: real openings only (no "general application" catch-alls, no news, no projects); url must come from the link list; empty array if none. No prose, JSON only.\n\nPAGE TEXT:\n${pageText}\n\nLINKS:\n${linkList}`,
        [pageUrl, pageText.slice(0, 4000), linkList],
      );
      const jobs = (listing?.jobs ?? []).slice(0, MAX_JOBS_PER_SITE);
      if (!jobs.length) { log(`direct:${company} — 0 open positions found`); continue; }

      let kept = 0;
      for (const j of jobs) {
        if (!j.url || !j.title) continue;
        // The listing page is not a posting. When a studio renders all its
        // openings inline, the model has no per-job URL to give and hands back
        // the page it was shown; that row would key its external_id to a URL
        // that changes meaning every time the page changes.
        if (j.url.replace(/\/$/, '') === pageUrl.replace(/\/$/, '')) continue;
        if (!(await allowed(j.url))) continue;
        const jobPage = await renderGet(j.url);
        const jobText = jobPage ? jobPage.text.slice(0, 20000) : stripHtml((await politeGet(j.url)) || '').slice(0, 20000);
        if (jobText.length < 200) continue; // a shell, not a posting
        const meta = await extract(
          `Job posting page for "${j.title}" at ${company}. Extract as JSON: {"title":"...","location":"city, country or null","salary_min":number|null,"salary_max":number|null,"currency":"USD/GBP/EUR/CHF/...or null","is_job_posting":true|false}. is_job_posting is false if this page is not actually a single job posting. JSON only.\n\n${jobText.slice(0, 10000)}`,
          [j.url, jobText.slice(0, 4000)],
        );
        if (!meta || meta.is_job_posting === false) continue;
        rows.push({
          source: name,
          external_id: j.url,
          title: meta.title || j.title,
          company,
          location: meta.location || null,
          remote_flag: /\bremote\b/i.test(`${j.title} ${jobText.slice(0, 2000)}`),
          salary_min: meta.salary_min ?? null,
          salary_max: meta.salary_max ?? null,
          currency: meta.salary_min ? meta.currency || null : null,
          salary_period: meta.salary_min ? 'year' : null,
          description_text: jobText, // the employer's words, never the model's
          posted_at: null, // first-seen ledger keeps ages honest
          url: j.url,
        });
        kept++;
      }
      log(`direct:${company} — ${kept} postings`);
    } catch (err) {
      log(`direct:${company} — failed: ${String(err.message).slice(0, 120)}`);
    }
    }
    return rows;
  } finally {
    // A leaked Chromium would keep the nightly alive forever after the run.
    await closeBrowser();
  }
}
