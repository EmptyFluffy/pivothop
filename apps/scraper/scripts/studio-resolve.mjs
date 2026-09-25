#!/usr/bin/env node
/* studio-resolve: go to the studio's OWN website, find its careers page, and
 * read what hiring system that page actually uses (2026-09-25).
 *
 * The name probe (ats-probe) guesses slugs and misses every firm whose tenant
 * is not its name; the prospector admits careers pages but leaves ATS pages
 * unresolved ("ats-candidate", manual verification) and everything else to an
 * LLM that has no credits. This resolver closes both gaps without a model:
 * the ATS link is taken from the firm's own careers page, so the namesake risk
 * the probe guards against does not exist here, and the slug is read, not
 * guessed.
 *
 * Per firm: home page (or the careers URL when known) -> careers link on the
 * firm's own domain -> one more hop to an "open positions" page when the
 * careers page is a landing -> scan html, frames, links and scripts for ATS
 * signatures (17 systems) + JSON-LD JobPosting + job links whose label maps to
 * an occupation in our taxonomy.
 *
 *   node apps/scraper/scripts/studio-resolve.mjs --fleet           # every careers page already in the direct fleet
 *   node apps/scraper/scripts/studio-resolve.mjs --list FILE       # "Name | https://site" lines
 *   ... --dry                                                       # report only, no config writes
 *
 * Writes: supported ATS boards into config/*-companies.json (verified by the
 * board's own API answering); unsupported ones into config/studio-ats-pending.json
 * (the reader backlog, ranked by count); newly found careers pages without an
 * ATS into config/direct-companies-auto.json; the full report into
 * data/studio-resolve.json. */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapTitle } from '../src/normalize/titles.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = path.join(ROOT, 'config');
const REPORT = path.join(ROOT, 'data', 'studio-resolve.json');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const DRY = args.includes('--dry');
const WORKERS = Number(opt('--workers', 6));
const UA = 'Mozilla/5.0 (compatible; PivotHopScraper/0.1; contact: hello@pivothop.com)';
const BUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const readJson = (f, fb) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fb; } };

function regDomain(url) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '');
    const parts = h.split('.');
    const twoLevel = /^(co|com|org|net|ac|gov)\.[a-z]{2}$/.test(parts.slice(-2).join('.'));
    return parts.slice(twoLevel ? -3 : -2).join('.');
  } catch { return ''; }
}

/* ── inputs ── */
const firms = [];
if (args.includes('--fleet')) {
  const cur = readJson(path.join(CONFIG, 'direct-companies.json'), { companies: [] }).companies;
  const auto = readJson(path.join(CONFIG, 'direct-companies-auto.json'), { companies: [] }).companies;
  for (const c of [...cur, ...auto]) firms.push({ name: c.name, url: c.careers, careers: true });
  const st = readJson(path.join(CONFIG, 'prospect-state.json'), { tried: {} }).tried;
  for (const [name, v] of Object.entries(st)) if (v.outcome === 'ats-candidate' && /^https?:/.test(v.detail || '')) firms.push({ name, url: v.detail.split(' ')[0], careers: true });
}
const listFile = opt('--list', null);
if (listFile) {
  for (const line of fs.readFileSync(listFile, 'utf8').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const [name, url] = line.split('|').map((s) => s.trim());
    if (name && url) firms.push({ name, url: /^https?:/.test(url) ? url : `https://${url}`, careers: false });
  }
}
// one visit per registrable domain
const seenDom = new Set();
const todo = firms.filter((f) => { const d = regDomain(f.url); if (!d || seenDom.has(d)) return false; seenDom.add(d); return true; });
console.log(`studio-resolve: ${todo.length} firms (${firms.length} before domain dedupe)${DRY ? ', dry run' : ''}`);

/* ── ATS signatures: name -> regex with the identifying groups ── */
const BAD = /^(embed|js|v1|api|www|jobs|careers|career|static|assets|cdn|app|apply|boards|job-boards|widget|widgets|en|en-us|de|fr|es|search|login|index|oneclick-ui)$/i;
const SIGS = [
  ['greenhouse', /(?:boards|job-boards)(?:\.eu)?\.greenhouse\.io\/(?:embed\/job_board(?:\/js)?\?for=)?([A-Za-z0-9_-]+)/g],
  ['greenhouse', /boards-api\.greenhouse\.io\/v1\/boards\/([A-Za-z0-9_-]+)/g],
  ['greenhouse', /greenhouse\.io\/embed\/job_board\/js\?for=([A-Za-z0-9_-]+)/g],
  ['lever', /jobs\.(?:eu\.)?lever\.co\/([A-Za-z0-9_.-]+)/g],
  ['ashby', /jobs\.ashbyhq\.com\/([A-Za-z0-9_.%-]+)/g],
  ['workable', /apply\.workable\.com\/([A-Za-z0-9_-]+)/g],
  ['workable', /\/\/([a-z0-9-]+)\.workable\.com/g],
  ['recruitee', /\/\/([a-z0-9-]+)\.recruitee\.com/g],
  ['smartrecruiters', /(?:careers|jobs)\.smartrecruiters\.com\/([A-Za-z0-9_-]+)/g],
  ['personio', /\/\/([a-z0-9-]+)\.jobs\.personio\.(?:de|com)/g],
  ['workday', /\/\/([a-z0-9-]+)\.(wd\d+)\.myworkdayjobs\.com\/(?:[a-z]{2}-[A-Z]{2}\/)?([A-Za-z0-9_-]+)/g],
  ['bamboohr', /\/\/([a-z0-9-]+)\.bamboohr\.com/g],
  ['breezy', /\/\/([a-z0-9-]+)\.breezy\.hr/g],
  ['jazzhr', /\/\/([a-z0-9-]+)\.applytojob\.com/g],
  ['teamtailor', /\/\/([a-z0-9-]+)\.teamtailor\.com/g],
  ['homerun', /\/\/([a-z0-9-]+)\.homerun\.co/g],
  ['pinpoint', /\/\/([a-z0-9-]+)\.pinpointhq\.com/g],
  ['rippling', /ats\.rippling\.com\/([A-Za-z0-9_-]+)/g],
  ['paylocity', /recruiting\.paylocity\.com\/recruiting\/jobs\/(?:All|Details\/\d+)\/([0-9a-fA-F-]{36})/g],
  ['icims', /\/\/((?:careers|jobs)-[a-z0-9-]+|[a-z0-9-]+)\.icims\.com/g],
  ['jobvite', /jobs\.jobvite\.com\/([A-Za-z0-9_-]+)/g],
  ['ukg', /recruiting2?\.ultipro\.com\/([A-Z0-9]+)\/JobBoard\/([0-9a-f-]{36})/gi],
  ['adp', /workforcenow\.adp\.com\/[^"'\s]*cid=([0-9a-f-]{36})/gi],
  ['hibob', /\/\/([a-z0-9-]+)\.careers\.hibob\.com/g],
  ['dayforce', /jobs\.dayforcehcm\.com\/(?:[a-z]{2}-[A-Z]{2}\/)?([A-Za-z0-9_-]+)/g],
  ['taleo', /\/\/([a-z0-9-]+)\.taleo\.net/g],
  ['avature', /\/\/([a-z0-9-]+)\.avature\.net\/([A-Za-z0-9_-]+)/g],
  ['reachmee', /\/\/(web\d+)\.reachmee\.com\/ext\/([A-Z0-9]+)\/(\d+)/g],
  ['zoho', /\/\/([a-z0-9-]+)\.zohorecruit\.(?:com|eu|in)/g],
  ['jobscore', /careers\.jobscore\.com\/careers\/([a-z0-9-]+)/g],
  ['trakstar', /\/\/([a-z0-9-]+)\.hire\.trakstar\.com/g],
  ['recruiterbox', /\/\/([a-z0-9-]+)\.recruiterbox\.com/g],
  ['comeet', /comeet\.(?:com|co)\/jobs\/([a-z0-9-]+)/g],
  ['freshteam', /\/\/([a-z0-9-]+)\.freshteam\.com/g],
  ['paycom', /paycomonline\.net\/v4\/ats\/web\.php\/jobs\?clientkey=([A-Z0-9]+)/gi],
  ['paycor', /recruitingbypaycor\.com\/career\/CareerHome\.action\?clientId=([0-9a-f]+)/gi],
  ['applicantpro', /\/\/([a-z0-9-]+)\.applicantpro\.com/g],
  ['gusto', /jobs\.gusto\.com\/boards\/([a-z0-9-]+)/g],
  ['clearcompany', /\/\/([a-z0-9-]+)\.clearcompany\.com/g],
  ['isolved', /\/\/([a-z0-9-]+)\.isolvedhire\.com/g],
  ['join', /join\.com\/companies\/([a-z0-9-]+)/g],
  ['softgarden', /\/\/([a-z0-9-]+)\.softgarden\.io/g],
];
function scanAts(blob) {
  const out = new Map();
  for (const [ats, re] of SIGS) {
    re.lastIndex = 0;
    for (let m = re.exec(blob); m; m = re.exec(blob)) {
      const slug = ats === 'workday' || ats === 'reachmee' ? `${m[1]}|${m[2]}|${m[3]}` : ats === 'ukg' || ats === 'avature' ? `${m[1]}|${m[2]}` : decodeURIComponent(m[1]);
      if (!slug || BAD.test(slug.split('|')[0])) continue;
      const k = `${ats}:${slug}`;
      out.set(k, (out.get(k) ?? 0) + 1);
    }
  }
  return [...out.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
}

/* ── verification against each supported ATS's own API ── */
const gj = async (u, o = {}) => { try { const r = await fetch(u, { ...o, headers: { 'user-agent': UA, accept: 'application/json', ...(o.headers || {}) }, signal: AbortSignal.timeout(15000) }); return r.ok ? await r.json() : null; } catch { return null; } };
const VERIFY = {
  greenhouse: async (s) => { const b = await gj(`https://boards-api.greenhouse.io/v1/boards/${s}/jobs`); return b?.jobs ? b.jobs.length : null; },
  lever: async (s) => { const b = await gj(`https://api.lever.co/v0/postings/${s}?mode=json`); return Array.isArray(b) ? b.length : null; },
  ashby: async (s) => { const b = await gj(`https://api.ashbyhq.com/posting-api/job-board/${s}`); return b?.jobs ? b.jobs.length : null; },
  smartrecruiters: async (s) => { const b = await gj(`https://api.smartrecruiters.com/v1/companies/${s}/postings?limit=1`); return typeof b?.totalFound === 'number' ? b.totalFound : null; },
  workable: async (s) => { const b = await gj(`https://apply.workable.com/api/v1/widget/accounts/${s}`); return b?.jobs ? b.jobs.length : null; },
  recruitee: async (s) => { const b = await gj(`https://${s}.recruitee.com/api/offers/`); return b?.offers ? b.offers.length : null; },
  personio: async (s) => { try { const r = await fetch(`https://${s}.jobs.personio.com/xml`, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) }); if (!r.ok) return null; const x = await r.text(); return /<workzag-jobs|<position>/.test(x) ? (x.match(/<position>/g) ?? []).length : null; } catch { return null; } },
  workday: async (s) => { const [t, wd, site] = s.split('|'); const b = await gj(`https://${t}.${wd}.myworkdayjobs.com/wday/cxs/${t}/${site}/jobs`, { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': BUA }, body: JSON.stringify({ limit: 1, offset: 0, searchText: '' }) }); return typeof b?.total === 'number' ? b.total : null; },
};
const CONFIG_OF = {
  greenhouse: ['greenhouse-companies.json', 'boards'], lever: ['lever-companies.json', 'companies'], ashby: ['ashby-companies.json', 'companies'],
  smartrecruiters: ['smartrecruiters-companies.json', 'companies'], workable: ['workable-companies.json', 'companies'], recruitee: ['recruitee-companies.json', 'companies'],
  personio: ['personio-companies.json', 'tenants'], workday: ['workday-companies.json', 'tenants'],
};

/* ── the crawl ── */
const CAREER_WORDS = /career|vacan|job|join|hiring|opportunit|work-with|workwith|work with|work for|work here|stellen|karriere|recruit|employ|openings|open position|talent|life at|we're hiring|emploi|lavora|trabaja|empleo|vagas|internship/i;
const OPENINGS_WORDS = /open (?:roles|positions)|current (?:openings|vacancies|positions)|view (?:all )?(?:jobs|openings|positions|roles)|see (?:all )?(?:jobs|openings|positions|roles)|job openings|all jobs|vacancies|offene stellen|postes ouverts|apply now|browse jobs|explore (?:jobs|roles)/i;
const JOB_PATH = /career|job|position|opening|vacanc|stellen|emploi|role|posting|apply|lavor|empleo|vaga/i;

const browser = await chromium.launch();
const report = [];
async function visit(page, url) {
  try {
    const r = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 28000 });
    if (!r || r.status() >= 400) return null;
  } catch {
    const alt = url.replace(/^https?:\/\/(?!www\.)/, 'https://www.');
    if (alt === url) return null;
    try { const r = await page.goto(alt, { waitUntil: 'domcontentloaded', timeout: 28000 }); if (!r || r.status() >= 400) return null; } catch { return null; }
  }
  await page.waitForTimeout(2200);
  const html = await page.content().catch(() => '');
  const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => ({ href: a.href, label: (a.innerText || a.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 120) }))).catch(() => []);
  const frames = page.frames().map((f) => f.url()).join(' ');
  const scripts = await page.evaluate(() => [...document.querySelectorAll('script[src]')].map((s) => s.src).join(' ')).catch(() => '');
  const heads = await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3,h4,h5,summary,button,dt,[class*=title],[class*=job],[class*=position],[class*=role],[class*=vacan],[class*=opening]')].map((e) => (e.innerText || '').trim().split('\n')[0]).filter((t) => t.length >= 5 && t.length <= 80)).catch(() => []);
  return { url: page.url(), html, links, heads, blob: `${page.url()} ${frames} ${scripts} ${links.map((l) => l.href).join(' ')} ${html.slice(0, 400000)}` };
}
function schemaCount(html) {
  let n = 0;
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    const t = m[1];
    n += (t.match(/"@type"\s*:\s*"JobPosting"/g) || []).length;
  }
  return n;
}
function jobLinks(links, base) {
  const dom = regDomain(base);
  const out = [];
  const seen = new Set();
  for (const l of links) {
    if (!l.label || l.label.length < 5 || l.label.length > 90 || seen.has(l.href)) continue;
    if (regDomain(l.href) !== dom) continue;
    let p = ''; try { p = new URL(l.href).pathname; } catch { continue; }
    if (!JOB_PATH.test(p) || p.replace(/\/$/, '') === new URL(base).pathname.replace(/\/$/, '')) continue;
    const label = l.label.split(/\n| \| | – | - /)[0];
    const hit = mapTitle(label);
    if (!hit) continue;
    seen.add(l.href);
    out.push({ title: label, url: l.href, occ: hit.slug });
  }
  return out;
}

async function resolve(f) {
  const rec = { name: f.name, input: f.url, careers: null, ats: [], schema: 0, jobLinks: 0, outcome: 'failed' };
  const page = await browser.newPage({ userAgent: UA });
  try {
    let v = await visit(page, f.url);
    if (!v) { rec.outcome = 'unreachable'; return rec; }
    // from a home page: find the careers link on the firm's own domain
    if (!f.careers) {
      const home = v.url;
      const atsHome = scanAts(v.blob);
      const segOk = (u) => { try { return new URL(u).pathname.split('/').filter(Boolean).every((sg) => sg.length <= 40); } catch { return false; } };
      const cands = v.links.filter((l) => CAREER_WORDS.test(`${l.href} ${l.label}`) && segOk(l.href) && (regDomain(l.href) === regDomain(home) || scanAts(l.href).length));
      const rank = (l) => {
        if (scanAts(l.href).length) return 4;
        let p = ''; try { p = new URL(l.href).pathname; } catch { /* keep */ }
        if (/^\/?(careers?|jobs|join(-us)?|work-with-us|vacancies|opportunities|karriere|stellen|jobs-and-careers)\/?$/i.test(p)) return 3;
        return /career|vacan|job|stellen|karriere|hiring|position|opening|employ/i.test(l.href) ? 2 : 1;
      };
      const best = cands.sort((a, b) => rank(b) - rank(a))[0];
      if (!best && !atsHome.length) { rec.outcome = 'no-careers-link'; return rec; }
      if (best) { const v2 = await visit(page, best.href); if (v2) v = v2; }
    }
    rec.careers = v.url;
    let ats = scanAts(v.blob);
    let schema = schemaCount(v.html);
    let jl = jobLinks(v.links, v.url);
    // a careers landing: one more hop to the openings list
    if (!ats.length && !schema && jl.length < 2 && !(v.heads || []).some((t) => mapTitle(t))) {
      const next = v.links.find((l) => OPENINGS_WORDS.test(l.label) && (regDomain(l.href) === regDomain(v.url) || scanAts(l.href).length) && l.href !== v.url);
      if (next) {
        const v3 = await visit(page, next.href);
        if (v3) { rec.careers = v3.url; ats = scanAts(v3.blob); schema = schemaCount(v3.html); jl = jobLinks(v3.links, v3.url); }
      }
    }
    const inline = [...new Set((v.heads || []).filter((t) => mapTitle(t)))];
    rec.ats = ats.slice(0, 3); rec.schema = schema; rec.jobLinks = jl.length; rec.inline = inline.length;
    rec.sample = (jl.length ? jl.map((j) => j.title) : inline).slice(0, 3);
    rec.outcome = ats.length ? 'ats' : schema ? 'schema' : jl.length ? 'links' : inline.length ? 'inline' : 'careers-no-openings';
    return rec;
  } catch (e) {
    rec.detail = String(e.message).slice(0, 80);
    return rec;
  } finally {
    await page.close().catch(() => {});
  }
}

let cursor = 0; let done = 0;
await Promise.all(Array.from({ length: WORKERS }, async () => {
  while (cursor < todo.length) {
    const f = todo[cursor++];
    const r = await resolve(f);
    report.push(r);
    done++;
    console.log(`${String(done).padStart(4)} ${r.outcome.padEnd(20)} ${f.name.slice(0, 34).padEnd(34)} ${(r.ats[0] || (r.schema ? `schema:${r.schema}` : r.jobLinks ? `links:${r.jobLinks}` : r.inline ? `inline:${r.inline}` : '')).slice(0, 60)}`);
  }
}));
await browser.close();

/* ── verify supported ATS and write ── */
fs.mkdirSync(path.dirname(REPORT), { recursive: true });
const slugOf = (x) => (typeof x === 'string' ? x : x?.tenant ?? '').toLowerCase();
const known = {};
for (const [ats, [file, key]] of Object.entries(CONFIG_OF)) known[ats] = new Set((readJson(path.join(CONFIG, file), {})[key] ?? []).map(slugOf));
const adds = {}; const pending = new Map(); let verified = 0, postings = 0;
for (const r of report) {
  for (const k of r.ats) {
    const [ats, slug] = [k.slice(0, k.indexOf(':')), k.slice(k.indexOf(':') + 1)];
    if (VERIFY[ats]) {
      const id = ats === 'workday' ? slug.split('|')[0].toLowerCase() : slug.toLowerCase();
      if (known[ats].has(id)) { r.status = `${ats}:${id} already listed`; break; }
      const n = await VERIFY[ats](slug);
      if (n === null) continue;
      verified++; postings += n;
      // A tenant can belong to a parent (Lippincott -> Marsh McLennan's 'mmc',
      // Carmichael Lynch -> 'interpublic'): the label is the studio name only
      // when the tenant looks like it; otherwise it is flagged for a hand label.
      const looksLike = (t) => { const a = t.toLowerCase().replace(/[^a-z0-9]/g, ''); const b = r.name.toLowerCase().replace(/[^a-z0-9]/g, ''); return a.length >= 3 && (b.includes(a) || a.includes(b.slice(0, 5))); };
      const entry = ats === 'workday' ? (() => { const [tenant, wd, site] = slug.split('|'); return { tenant, wd, site, company: looksLike(tenant) ? r.name : `${tenant} (parent of ${r.name}; relabel)` }; })()
        : ats === 'personio' ? { tenant: slug, company: r.name } : slug;
      (adds[ats] ??= []).push(entry); known[ats].add(id);
      r.status = `${ats}:${id} +${n}`;
      break;
    } else {
      const p = pending.get(ats) ?? []; p.push({ name: r.name, slug, careers: r.careers }); pending.set(ats, p);
      r.status = `${ats} (no reader yet)`;
      break;
    }
  }
}
fs.writeFileSync(REPORT, JSON.stringify(report, null, 1));
const counts = report.reduce((m, r) => { m[r.outcome] = (m[r.outcome] ?? 0) + 1; return m; }, {});
console.log(`\nstudio-resolve: ${JSON.stringify(counts)}`);
console.log(`supported ATS verified: ${verified} boards, ${postings} postings`);
console.log(`unsupported ATS: ${[...pending.entries()].map(([k, v]) => `${k} ${v.length}`).sort((a, b) => Number(b.split(' ')[1]) - Number(a.split(' ')[1])).join(', ')}`);
if (!DRY) {
  for (const [ats, list] of Object.entries(adds)) {
    const [file, key] = CONFIG_OF[ats];
    const p = path.join(CONFIG, file); const d = readJson(p, { [key]: [] });
    d[key] = [...(d[key] ?? []), ...list];
    fs.writeFileSync(p, JSON.stringify(d, null, 1) + '\n');
    console.log(`config: ${file} +${list.length}`);
  }
  const pf = path.join(CONFIG, 'studio-ats-pending.json');
  const prev = readJson(pf, {});
  for (const [ats, list] of pending) {
    const have = new Set((prev[ats] ?? []).map((x) => x.slug));
    prev[ats] = [...(prev[ats] ?? []), ...list.filter((x) => !have.has(x.slug))];
  }
  fs.writeFileSync(pf, JSON.stringify(prev, null, 1) + '\n');
  // careers pages found from a home page (no ATS) join the direct fleet
  const autoP = path.join(CONFIG, 'direct-companies-auto.json');
  const auto = readJson(autoP, { companies: [] });
  const cur = readJson(path.join(CONFIG, 'direct-companies.json'), { companies: [] });
  const fleet = new Set([...cur.companies, ...auto.companies].map((c) => regDomain(c.careers)));
  let joined = 0;
  for (const r of report) {
    // careers pages without an ATS we read natively join the direct fleet; the
    // direct source follows the ATS link and reads it without a model
    const native = r.ats.length && CONFIG_OF[r.ats[0].slice(0, r.ats[0].indexOf(':'))];
    if (!r.careers || native || !['ats', 'schema', 'links', 'inline', 'careers-no-openings'].includes(r.outcome)) continue;
    if (fleet.has(regDomain(r.careers))) continue;
    auto.companies.push({ name: r.name, careers: r.careers.replace(/[?#].*$/, ''), admitted: new Date().toISOString().slice(0, 10), jobsSignal: r.jobLinks, via: 'studio-resolve' });
    fleet.add(regDomain(r.careers)); joined++;
  }
  fs.writeFileSync(autoP, JSON.stringify(auto, null, 1));
  console.log(`direct fleet: +${joined} careers pages (no ATS; read by the direct source)`);
}
