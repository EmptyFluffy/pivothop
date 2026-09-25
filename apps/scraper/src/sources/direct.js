import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { stripHtml } from '../lib/text.js';
import { readJson } from '../lib/store.js';
import { CONFIG_DIR, CACHE_DIR } from '../lib/paths.js';
import { mapTitle } from '../normalize/titles.js';

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

/* ── The model layer (2026-09-11): provider adapter, cost meter, budget ──
 * Gemini Flash-Lite first (about a quarter of Haiku's price for the same
 * JSON-extraction job), Anthropic as fallback or when only that key exists.
 * Every call is metered from the provider's own usage counts and priced from
 * the table below, so the nightly log states what the fleet cost and the run
 * stops itself at DIRECT_BUDGET_USD instead of at an exhausted balance. */
const GEMINI_MODEL = process.env.DIRECT_GEMINI_MODEL || 'gemini-2.5-flash-lite';
const PROVIDER = process.env.DIRECT_PROVIDER || (process.env.GEMINI_API_KEY ? 'gemini' : 'anthropic');
const BUDGET_USD = Number(process.env.DIRECT_BUDGET_USD) || 4; // per run
// USD per million tokens, in/out. Override with DIRECT_PRICE_IN / DIRECT_PRICE_OUT.
const PRICES = {
  'gemini-2.5-flash-lite': [0.25, 1.5], 'gemini-2.5-flash': [0.3, 2.5],
  'claude-haiku-4-5': [1, 5], 'claude-sonnet-4-5': [3, 15],
};
const meter = { calls: 0, cached: 0, tokensIn: 0, tokensOut: 0, usd: 0, schema: 0, heuristic: 0, provider: PROVIDER };
function price(model) {
  const p = PRICES[model] || [Number(process.env.DIRECT_PRICE_IN) || 1, Number(process.env.DIRECT_PRICE_OUT) || 5];
  return p;
}
function charge(model, tin, tout) {
  const [pi, po] = price(model);
  meter.calls++; meter.tokensIn += tin; meter.tokensOut += tout;
  meter.usd += (tin * pi + tout * po) / 1e6;
}
export function meterSummary() {
  return `direct: LLM ${meter.provider}, ${meter.calls} calls, ${meter.cached} cache hits, ${meter.schema} pages read from JobPosting schema, ${meter.heuristic} studios read by the no-model path, ${meter.tokensIn.toLocaleString()} tokens in / ${meter.tokensOut.toLocaleString()} out, est. $${meter.usd.toFixed(3)} (budget $${BUDGET_USD})`;
}

async function callGemini(prompt) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 4000, temperature: 0, responseMimeType: 'application/json' } }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    if (res.status === 429 || (res.status === 403 && /billing|quota/i.test(errBody))) {
      const e = new Error(`gemini ${res.status}: quota or billing`); e.creditsExhausted = true; throw e;
    }
    throw new Error(`gemini ${res.status}`);
  }
  const body = await res.json();
  const text = (body.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
  const u = body.usageMetadata || {};
  charge(GEMINI_MODEL, u.promptTokenCount || 0, u.candidatesTokenCount || 0);
  return text;
}

async function callAnthropic(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    // 4000: a studio with 30 openings overflowed 2000 and returned a truncated
    // array, which threw and lost the whole site (BIG, 2026-08-03).
    body: JSON.stringify({ model: MODEL, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    if (res.status === 400 && /credit balance/i.test(errBody)) {
      const e = new Error('anthropic credits exhausted'); e.creditsExhausted = true; throw e;
    }
    throw new Error(`anthropic ${res.status}`);
  }
  const body = await res.json();
  charge(MODEL, body.usage?.input_tokens || 0, body.usage?.output_tokens || 0);
  return (body.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
}

/* Cached model call: an unchanged page never pays twice. The cache key names
 * the model, so switching providers re-reads the fleet once (about $5 on
 * Flash-Lite for 900 pages) and then settles. */
async function extract(prompt, cacheKeyParts) {
  const model = PROVIDER === 'gemini' ? GEMINI_MODEL : MODEL;
  const key = crypto.createHash('sha1').update(['direct-v2', model, ...cacheKeyParts].join('|')).digest('hex');
  const cacheFile = path.join(CACHE_DIR, `llm-${key}.json`);
  if (fs.existsSync(cacheFile)) { meter.cached++; return JSON.parse(fs.readFileSync(cacheFile, 'utf8')); }
  if (meter.usd >= BUDGET_USD) {
    const e = new Error(`direct budget of $${BUDGET_USD} reached`); e.budgetReached = true; throw e;
  }
  let text;
  if (PROVIDER === 'gemini') {
    try { text = await callGemini(prompt); }
    catch (err) {
      // a quota wall on Gemini falls back to Anthropic when that key exists
      if (err.creditsExhausted && process.env.ANTHROPIC_API_KEY) text = await callAnthropic(prompt); else throw err;
    }
  } else {
    text = await callAnthropic(prompt);
  }
  const parsed = parseLoose(text);
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(parsed));
  return parsed;
}

/* ── schema.org JobPosting, read for free ──────────────────────────────────
 * Many careers pages and most ATS-hosted postings embed JobPosting JSON-LD.
 * When it is there, it is the employer's own structured statement and beats
 * a model reading prose: no tokens, no guessing. Returns [] when absent. */
function jobPostingsFromHtml(html, baseUrl) {
  const out = [];
  if (!html) return out;
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data; try { data = JSON.parse(m[1].trim()); } catch { continue; }
    const nodes = [];
    const walk = (n) => {
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n)) { n.forEach(walk); return; }
      const t = n['@type']; const types = Array.isArray(t) ? t : [t];
      if (types.includes('JobPosting')) nodes.push(n);
      if (n['@graph']) walk(n['@graph']);
      if (n.itemListElement) walk(n.itemListElement.map((x) => x.item || x));
    };
    walk(data);
    for (const n of nodes) {
      const title = typeof n.title === 'string' ? n.title.trim() : '';
      if (!title) continue;
      let url = n.url || n.mainEntityOfPage?.['@id'] || n.mainEntityOfPage || baseUrl;
      try { url = new URL(typeof url === 'string' ? url : baseUrl, baseUrl).toString(); } catch { url = baseUrl; }
      const loc = n.jobLocation;
      const addr = (Array.isArray(loc) ? loc[0] : loc)?.address;
      const location = addr ? [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean).join(', ') : (n.jobLocationType === 'TELECOMMUTE' ? 'Remote' : null);
      const sal = n.baseSalary?.value;
      const min = sal ? Number(sal.minValue ?? sal.value) || null : null;
      const max = sal ? Number(sal.maxValue ?? sal.value) || null : null;
      const unit = String(sal?.unitText || '').toUpperCase();
      out.push({
        title, url, location,
        description: stripHtml(String(n.description || '')),
        posted: typeof n.datePosted === 'string' ? n.datePosted.slice(0, 10) : null,
        salary_min: min, salary_max: max, currency: n.baseSalary?.currency || null,
        salary_period: unit === 'HOUR' ? 'hour' : unit === 'MONTH' ? 'month' : min ? 'year' : null,
        remote: n.jobLocationType === 'TELECOMMUTE' || /remote/i.test(location || ''),
      });
    }
  }
  return out;
}

// Hosted ATS platforms these studios actually use. Measured 2026-08-03: a big
// practice's "careers page" is nearly always a MARKETING page that links out to
// one of these — Gensler to Avature, HOK to Dayforce, Mecanoo to Homerun, Olson
// Kundig to JazzHR, NBBJ to Jobvite. The job list is never on the page we were
// pointed at, which is why extraction kept returning an honest zero. So when a
// careers page names one of these, the adapter FOLLOWS it and reads there.
const ATS_HINT = /myworkdayjobs\.com|teamtailor\.com|jobs\.personio|bamboohr\.com|homerun\.co|pinpointhq\.com|applytojob\.com|jobvite\.com|icims\.com|breezy\.hr|avature\.net|dayforcehcm\.com|successfactors\.|sapsf\.|taleo\.net|eploy\.net|hirehive\.com|smartrecruiters\.com|greenhouse\.io|lever\.co|ashbyhq\.com|recruitee\.com|workable\.com|recruiting\.paylocity\.com|careers\.hibob\.com|recruitingbypaycor\.com|ultipro\.com|workforcenow\.adp\.com|isolvedhire\.com|applicantpro\.com|recruiterbox\.com|zohorecruit\.|hire\.trakstar\.com|jobscore\.com|freshteam\.com|paycomonline\.net|rippling\.com|softgarden\.io|join\.com\/companies|reachmee\.com|clearcompany\.com|jobs\.gusto\.com/;

/* ── the no-model reader ────────────────────────────────────────────────────
 * A job is a link on the careers page (or the ATS page it points at) whose
 * label maps to an occupation and whose path looks like a posting; or, for the
 * boutique studios that list openings inline, a short line of page text that
 * maps to an occupation and names a role noun. The taxonomy does the judging a
 * model would: "Interior Design" (a service) has no role noun and is ignored,
 * "Project Architect" is a job. Inline postings take the text between their
 * line and the next one as the ad. */
const ROLE_NOUN = /\b(architects?|designers?|engineer|manager|director|intern|internship|assistant|coordinator|specialist|lead|developer|planner|technician|administrator|artist|producer|strategist|writer|researcher|analyst|consultant|associate|drafter|draughtsperson|modell?er|visuali[sz]er|estimator|surveyor|officer|accountant|bookkeeper|receptionist|principal|architekt(?:in)?|zeichner(?:in)?|praktikant(?:in)?|praktikum|projektleiter(?:in)?|bauleiter(?:in)?|stagiaire|architecte|dessinat(?:eur|rice)|projeteu(?:r|se)|arquitect[oa]|diseñador[a]?|progettista)\b/i;
const POSTING_PATH = /career|job|position|opening|vacanc|stellen|emploi|role|posting|apply|lavor|empleo|vaga|join|offre/i;
function atsListingRoot(href) {
  try {
    const u = new URL(href);
    const h = u.hostname;
    if (/\.careers\.hibob\.com$/.test(h)) return `${u.origin}/jobs`;
    if (/\.bamboohr\.com$/.test(h)) return `${u.origin}/careers`;
    if (/\.(breezy\.hr|homerun\.co|applytojob\.com|pinpointhq\.com|teamtailor\.com|recruitee\.com|isolvedhire\.com|applicantpro\.com|recruiterbox\.com|freshteam\.com)$/.test(h)) return `${u.origin}/`;
    return href;
  } catch { return href; }
}
const POSTING_SIGNALS = /\b(apply|application|requirements?|qualifications?|responsibilit\w*|experience|we are looking|we're looking|you will|salary|full[- ]time|part[- ]time|contract|deadline|start date|bewerb\w*|anforderung\w*|aufgaben|ihr profil|pensum|stellenantritt|postuler|profil recherch\w*|missions?|requisitos|responsabilidades)\b|\b\d{2,3}\s?[-–]?\s?\d{0,3}\s?%/gi;
// catch-alls are not openings
const NOT_OPENING = /spontaneous|unsolicited|general application|open application|initiativbewerbung|spontanbewerbung|candidature spontan|candidatura espont|talent (?:pool|community)|future opportunit|no (?:current )?(?:openings|vacancies|positions)|keine offenen/i;
// "Basel: Project Architect (100%)" -> location Basel, title Project Architect (100%)
function splitPlace(t) {
  const m = /^([A-ZÀ-Ý][\p{L} .'-]{1,30}):\s+(.{4,})$/u.exec(t);
  return m && m[1].split(/\s+/).length <= 3 ? { place: m[1].trim(), title: m[2].trim() } : { place: null, title: t };
}
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
function heuristicJobs(pageUrl, all, text) {
  const out = []; const seenT = new Set();
  const host = hostOf(pageUrl);
  const base = (() => { try { return new URL(pageUrl).pathname.replace(/\/$/, ''); } catch { return ''; } })();
  for (const l of all) {
    const label = (l.label || '').split('\n')[0].trim();
    if (label.length < 5 || label.length > 90 || NOT_OPENING.test(label) || !ROLE_NOUN.test(label) || !mapTitle(label)) continue;
    if (hostOf(l.href) !== host) continue;
    let p = ''; try { p = new URL(l.href).pathname.replace(/\/$/, ''); } catch { continue; }
    // on a hosted ATS page every deeper link is a posting (breezy /p/..., jazz /apply/...)
    if (p === base || (!ATS_HINT.test(pageUrl) && !POSTING_PATH.test(p))) continue;
    const k = label.toLowerCase(); if (seenT.has(k)) continue; seenT.add(k);
    out.push({ title: label, url: l.href.replace(/#.*$/, ''), id: l.href.replace(/#.*$/, ''), inline: false });
  }
  if (out.length) return out;
  const lines = String(text || '').split('\n').map((t) => t.trim());
  const pageOpen = /(current|open) (openings|positions|roles|vacancies|opportunities)|job openings|we'?re hiring|we are hiring|now hiring|vacancies|offene stellen|stellenangebote|postes (ouverts|à pourvoir)|vacantes|job opportunities|career opportunities|available positions/i.test(String(text || ''));
  const idx = [];
  lines.forEach((t, i) => {
    if (t.length < 5 || t.length > 80 || /[.!?:]$/.test(t) || t.split(/\s+/).length > 10) return;
    if (/^(proven|experience|knowledge|ability|strong|excellent|good|minimum|at least|you|we|our|the|a|an|must|should|working|degree|previous|demonstrated|familiarity|proficien)/i.test(t)) return;
    if (NOT_OPENING.test(t) || !ROLE_NOUN.test(t) || !mapTitle(t)) return;
    const k = t.toLowerCase(); if (seenT.has(k)) return; seenT.add(k);
    idx.push(i);
  });
  idx.forEach((i, n) => {
    const end = n + 1 < idx.length ? idx[n + 1] : Math.min(lines.length, i + 60);
    const body = lines.slice(i, end).join('\n').slice(0, 8000);
    const t = lines[i];
    // A heading is an opening only when its block reads like an ad: two
    // distinct posting signals. A careers page that tiles its disciplines
    // ("Structural Engineer", "Transport Planner") names roles it hires, not
    // roles open today.
    const sig = new Set((body.match(POSTING_SIGNALS) || []).map((x) => x.toLowerCase().slice(0, 6)));
    // a listing page (announces openings) needs less per block: titles there
    // often carry only a location and a "view" link
    const ok = sig.size >= 2 || (pageOpen && (sig.size >= 1 || /\b(read more|learn more|view|details|apply|more info|mehr|en savoir plus|ver más)\b/i.test(body)));
    if (!ok) return;
    out.push({ title: t, url: pageUrl, id: `${pageUrl.replace(/[#?].*$/, '')}#${t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`, inline: true, text: body.length >= 200 ? body : String(text).slice(0, 20000) });
  });
  return out;
}

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
  // Two fleets, one scrape: the hand-curated file plus the prospector's
  // auto-admitted firms (scripts/prospect.mjs, nightly). Domain-deduped here
  // so a firm promoted into the curated file doesn't get read twice.
  const curated = readJson(path.join(CONFIG_DIR, 'direct-companies.json'))?.companies ?? [];
  const auto = readJson(path.join(CONFIG_DIR, 'direct-companies-auto.json'))?.companies ?? [];
  const seen = new Set(curated.map((c) => c.careers.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]));
  let companies = curated.concat(auto.filter((c) => !seen.has(c.careers.replace(/^https?:\/\/(www\.)?/, '').split('/')[0])));
  // DIRECT_ONLY="Name|Name": read just these (debugging a reader change)
  if (process.env.DIRECT_ONLY) { const only = new Set(process.env.DIRECT_ONLY.split('|')); companies = companies.filter((c) => only.has(c.name)); }
  // No model, no stop (2026-09-25). The fleet used to return nothing without a
  // key and to abandon the whole run the moment credits ran out, so for weeks
  // 880 studios were read by nobody. Now the model is an upgrade, not a gate:
  // JobPosting schema, then job links and inline headings whose text maps to an
  // occupation in our taxonomy, read deterministically.
  let llmDead = !process.env.GEMINI_API_KEY && !process.env.ANTHROPIC_API_KEY;
  if (llmDead) log(`direct: no GEMINI_API_KEY or ANTHROPIC_API_KEY — ${companies.length} careers pages read WITHOUT a model (schema, job links, inline headings)`);
  log(`direct: ${companies.length} careers pages, model layer ${PROVIDER} (${PROVIDER === 'gemini' ? GEMINI_MODEL : MODEL}), budget $${BUDGET_USD} per run`);
  const rows = [];
  try {
    const readFirm = async ({ name: company, careers }) => {
    try {
      if (!(await allowed(careers))) { log(`direct:${company} — robots.txt disallows, skipped`); return; }

      // Render first — these are JS apps whose listings never appear in raw
      // HTML. Static fetch is the fallback, and it says so when it is used.
      let pageUrl = careers, all, pageText, fullText = '';
      const rendered = await renderGet(careers);
      if (rendered) {
        pageUrl = rendered.url;
        all = rendered.links;
        fullText = rendered.text.slice(0, 20000);
        pageText = rendered.text.slice(0, 12000);
      } else {
        const html = await politeGet(careers);
        if (!html) { log(`direct:${company} — page unreachable (bot wall or dead URL), skipped`); return; }
        log(`direct:${company} — NOT RENDERED, static HTML only (JS-loaded jobs will be missed)`);
        all = links(html, careers);
        fullText = stripHtml(html).slice(0, 20000);
        pageText = fullText.slice(0, 12000);
      }

      // Follow the ATS the careers page points at — that is where the openings
      // are. Only when the current page is not already on it, and only one hop.
      const atsUrl0 = all.find((l) => ATS_HINT.test(l.href));
      // a link to ONE posting (BIG -> hibob/jobs/<id>, Mecanoo -> homerun/<job>)
      // is followed to the board's listing root instead, where every opening is
      const atsUrl = atsUrl0 ? { ...atsUrl0, href: atsListingRoot(atsUrl0.href) } : null;
      if (atsUrl && !ATS_HINT.test(pageUrl)) {
        log(`direct:${company} — careers page links to a hosted ATS, following: ${atsUrl.href.slice(0, 80)}`);
        if (await allowed(atsUrl.href)) {
          const atsPage = await renderGet(atsUrl.href);
          if (atsPage) {
            pageUrl = atsPage.url;
            all = atsPage.links;
            fullText = atsPage.text.slice(0, 20000);
            pageText = atsPage.text.slice(0, 12000);
          } else {
            log(`direct:${company} — ATS page did not render, reading the careers page instead`);
          }
        } else {
          log(`direct:${company} — ATS page disallowed by robots.txt, reading the careers page instead`);
        }
      }

      // Free path first: JobPosting schema on the page itself.
      const schemaJobs = jobPostingsFromHtml(rendered?.html ?? null, pageUrl);
      if (schemaJobs.length) {
        meter.schema++;
        let kept = 0;
        for (const sj of schemaJobs.slice(0, MAX_JOBS_PER_SITE)) {
          const text = sj.description && sj.description.length >= 200 ? sj.description : null;
          rows.push({
            source: name, external_id: sj.url === pageUrl ? `${pageUrl}#${sj.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : sj.url,
            title: sj.title, company, location: sj.location, remote_flag: sj.remote,
            salary_min: sj.salary_min, salary_max: sj.salary_max, currency: sj.salary_min ? sj.currency : null,
            salary_period: sj.salary_min ? sj.salary_period : null,
            description_text: text || fullText, posted_at: sj.posted, url: sj.url,
          });
          kept++;
        }
        log(`direct:${company} — ${kept} postings from JobPosting schema (no LLM)`);
        return;
      }

      if (llmDead) {
        const found = heuristicJobs(pageUrl, all, fullText).slice(0, MAX_JOBS_PER_SITE);
        let kept = 0;
        for (const hj of found) {
          let jobText = hj.text, sj = null;
          if (!hj.inline) {
            if (!(await allowed(hj.url))) continue;
            // static first: most posting pages (ATS ones especially) are server
            // rendered, and a browser render costs ten times the time
            const staticHtml = await politeGet(hj.url);
            const staticText = staticHtml ? stripHtml(staticHtml) : '';
            if (staticText.length >= 400) {
              jobText = staticText.slice(0, 20000);
              sj = jobPostingsFromHtml(staticHtml, hj.url)[0] ?? null;
            } else {
              const jp = await renderGet(hj.url);
              jobText = jp ? jp.text.slice(0, 20000) : staticText;
              sj = jobPostingsFromHtml(jp?.html ?? null, hj.url)[0] ?? null;
            }
          }
          if (!jobText || jobText.length < 200) continue;
          const sp = splitPlace(hj.title);
          rows.push({
            source: name, external_id: hj.id, title: sj?.title || sp.title, company,
            location: sj?.location ?? sp.place, remote_flag: sj?.remote || /\bremote\b/i.test(`${hj.title} ${jobText.slice(0, 2000)}`),
            salary_min: sj?.salary_min ?? null, salary_max: sj?.salary_max ?? null, currency: sj?.salary_min ? sj.currency : null,
            salary_period: sj?.salary_min ? sj.salary_period : null,
            description_text: jobText, posted_at: sj?.posted ?? null, url: hj.url,
          });
          kept++;
        }
        meter.heuristic = (meter.heuristic ?? 0) + (kept ? 1 : 0);
        log(`direct:${company} — ${kept} postings (no model: ${found.filter((f) => f.inline).length} inline, ${found.filter((f) => !f.inline).length} linked)`);
        return;
      }

      const linkList = all.filter((l) => l.label).slice(0, 150).map((l) => `${l.label} -> ${l.href}`).join('\n').slice(0, 8000);
      const listing = await extract(
        `This is the careers page of ${company}, a design/architecture studio. From the page text and link list, return ONLY currently-open job positions as JSON: {"jobs":[{"title":"...","url":"..."}]}. Rules: real openings only (no "general application" catch-alls, no news, no projects); url must come from the link list; empty array if none. No prose, JSON only.\n\nPAGE TEXT:\n${pageText}\n\nLINKS:\n${linkList}`,
        [pageUrl, pageText.slice(0, 4000), linkList],
      );
      const jobs = (listing?.jobs ?? []).slice(0, MAX_JOBS_PER_SITE);
      if (!jobs.length) { log(`direct:${company} — 0 open positions found`); return; }

      let kept = 0;
      for (const j of jobs) {
        if (!j.url || !j.title) continue;
        // INLINE LISTINGS. Boutique studios (EM2N, Lake|Flato...) render every
        // opening on the jobs page itself with no per-job URL; the model then
        // returns the page it was shown. Yesterday's guard dropped those rows
        // because a bare listing URL is an unstable identity — the right fix is
        // a stable one: page + title. The listing page IS the posting there,
        // its text carries the ad, and the apply route lives on it.
        const inline = j.url.replace(/[#?].*$/, '').replace(/\/$/, '') === pageUrl.replace(/[#?].*$/, '').replace(/\/$/, '');
        let jobText, jobUrl = j.url, jobId = j.url, jobHtml = null;
        if (inline) {
          jobText = fullText;
          jobUrl = pageUrl;
          jobId = `${pageUrl}#${String(j.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
        } else {
          if (!(await allowed(j.url))) continue;
          const jobPage = await renderGet(j.url);
          jobHtml = jobPage?.html ?? null;
          jobText = jobPage ? jobPage.text.slice(0, 20000) : stripHtml((await politeGet(j.url)) || '').slice(0, 20000);
        }
        if (jobText.length < 200) continue; // a shell, not a posting
        // Free path: the posting page carries its own JobPosting schema.
        const sj = jobPostingsFromHtml(jobHtml, jobUrl)[0];
        if (sj) {
          meter.schema++;
          rows.push({
            source: name, external_id: jobId, title: sj.title || j.title, company,
            location: sj.location, remote_flag: sj.remote || /\bremote\b/i.test(`${j.title} ${jobText.slice(0, 2000)}`),
            salary_min: sj.salary_min, salary_max: sj.salary_max, currency: sj.salary_min ? sj.currency : null,
            salary_period: sj.salary_min ? sj.salary_period : null,
            description_text: jobText, posted_at: sj.posted, url: jobUrl,
          });
          kept++;
          continue;
        }
        // Two different sanity questions. A dedicated posting page must BE a
        // posting; an inline listing page must CONTAIN the named opening — the
        // first question asked of the second kind vetoed every inline job.
        const metaPrompt = inline
          ? `Careers page of ${company}; it lists one or more openings inline. For the opening titled "${j.title}", extract as JSON: {"title":"...","location":"city, country or null","salary_min":number|null,"salary_max":number|null,"currency":"USD/GBP/EUR/CHF/...or null","is_job_posting":true|false}. is_job_posting is false ONLY if no opening with (approximately) this title appears in the text. JSON only.\n\n${jobText.slice(0, 10000)}`
          : `Job posting page for "${j.title}" at ${company}. Extract as JSON: {"title":"...","location":"city, country or null","salary_min":number|null,"salary_max":number|null,"currency":"USD/GBP/EUR/CHF/...or null","is_job_posting":true|false}. is_job_posting is false if this page is not actually a single job posting. JSON only.\n\n${jobText.slice(0, 10000)}`;
        const meta = await extract(metaPrompt, [jobId, jobText.slice(0, 4000)]);
        if (!meta || meta.is_job_posting === false) continue;
        rows.push({
          source: name,
          external_id: jobId,
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
          url: jobUrl,
        });
        kept++;
      }
      log(`direct:${company} — ${kept} postings`);
    } catch (err) {
      if (err.creditsExhausted) {
        log(`direct: MODEL QUOTA OR CREDITS EXHAUSTED (${err.message}) at ${company}; the rest of the fleet is read without a model`);
        llmDead = true;
        return;
      }
      if (err.budgetReached) {
        log(`direct: BUDGET REACHED ($${BUDGET_USD} this run) at ${company}; the rest of the fleet is read without a model`);
        llmDead = true;
        return;
      }
      log(`direct:${company} — failed: ${String(err.message).slice(0, 120)}`);
    }
    };
    // Firms read concurrently (2026-09-25): the fleet is 1,000+ studios and the
    // no-model path renders every one; in series it would outlast the nightly.
    // Politeness stays per host (lastHit), and each firm is its own host.
    const queue = [...companies];
    const CONC = Number(process.env.DIRECT_CONCURRENCY) || 8;
    await Promise.all(Array.from({ length: Math.min(CONC, queue.length) }, async () => {
      for (let c = queue.shift(); c; c = queue.shift()) await readFirm(c);
    }));
    log(meterSummary());
    return rows;
  } finally {
    // A leaked Chromium would keep the nightly alive forever after the run.
    await closeBrowser();
  }
}
