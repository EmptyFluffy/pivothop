#!/usr/bin/env node
// Company logos for the whole board (not just featured). Resolution ladder, best
// source first:
//   1. A logo URL the job feed itself provided (Himalayas/Remotive/Jobicy expose
//      companyLogo — captured at ingest as company_logo_url in the raw store).
//   2. The ATS slug baked into the job URL (greenhouse.io/figma -> figma.com).
//   3. Clearbit's keyless autocomplete (company name -> real domain — the only
//      resolver that knows "Oura Health Ltd" is ouraring.com and "Veterans
//      Health Administration" is va.gov).
//   4. The slugified company name as a .com guess (legal suffixes stripped).
// Domains resolve to a favicon via Google's favicon service; Google returns a
// generic globe for unknown domains, so we fingerprint that globe and reject it.
//
// Incremental + polite: companies that already have a PNG are skipped; failures
// are remembered for 30 days (logo-tried.json). The memory is VERSIONED: when
// the resolver ladder improves (bump RESOLVER_V), previously-failed companies
// are retried once under the new ladder instead of staying parked for a month.
// Everything unresolvable falls back to a monogram in the UI.
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..');
const LOGOS = path.join(REPO, 'apps/web/public/data/logos');
const JOBS = path.join(REPO, 'apps/web/public/data/jobs');
const RAW = path.join(REPO, 'apps/scraper/data/postings_raw.ndjson');
const TRIED = path.join(REPO, 'apps/scraper/data/logo-tried.json');
const LIMIT = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity;
const SPACING = 250; // ms between favicon requests
const RETRY_DAYS = 30;
const RESOLVER_V = 3; // bump when the ladder improves -> parked misses retry once

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
// "Oura Health Ltd" -> "oura health" -> ourahealth.com; suffix strip helps the guess.
// ag/sarl/sagl are the Swiss legal forms — the corpus's biggest company pool is
// Swiss since 2026-08-04 and virtually every company there is "Something AG".
const LEGAL = /\b(ltd|llc|inc|corp|corporation|gmbh|s\.?a\.?|b\.?v\.?|plc|co|company|group|holdings|limited|ag|sarl|s\.?\u00e0\.?r\.?l\.?|sagl|kg|cie|stiftung|genossenschaft)\b\.?/gi;
// German umlauts transliterate for DOMAINS (Bühler -> buehler.ch); slugify just
// deleted the character and guessed a domain no registrar has ever seen.
const translit = (s) => String(s).toLowerCase()
  .replace(/\u00e4/g, 'ae').replace(/\u00f6/g, 'oe').replace(/\u00fc/g, 'ue').replace(/\u00df/g, 'ss')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
// Market-aware TLD ladder: a Swiss company lives on .ch far more often than
// .com; both are tried, .ch first when the company's postings say CH.
const nameDomains = (s, country) => {
  const g = translit(s).replace(/&/g, 'and').replace(LEGAL, '').replace(/[^a-z0-9]/g, '');
  if (!g) return [];
  return country === 'CH' ? [g + '.ch', g + '.com'] : country === 'DE' ? [g + '.de', g + '.com'] : [g + '.com'];
};

// ATS slug -> the brand's likely domain roots. The slug is usually the company.
function atsDomains(url, source) {
  const u = url || '';
  const pat = {
    greenhouse: /greenhouse\.io\/([^/?#]+)/, lever: /lever\.co\/([^/?#]+)/,
    ashby: /ashbyhq\.com\/([^/?#]+)/, smartrecruiters: /smartrecruiters\.com\/([^/?#]+)/,
    recruitee: /\/\/([^.]+)\.recruitee\.com/, workable: /apply\.workable\.com\/([^/?#]+)/,
  }[source];
  let slug = pat ? (u.match(pat) || [])[1] : null;
  if (slug && /^(jobs|careers|www|apply|boards|job-boards|company|en)$/i.test(slug)) slug = null;
  if (!slug) return [];
  const s = slug.toLowerCase();
  return [`${s}.com`, `${s}.io`, `${s}.ai`];
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

async function fetchBytes(url) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000), redirect: 'follow' });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch { return null; }
}
const favicon = (domain) => fetchBytes(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`);

// Accept only real raster/vector image bytes (feed logo URLs can 200 an HTML error page).
function looksLikeImage(buf) {
  if (!buf || buf.length < 70) return false;
  const h = buf.subarray(0, 12).toString('latin1');
  return h.startsWith('\x89PNG') || h.startsWith('\xff\xd8\xff') || h.startsWith('GIF8')
    || h.includes('WEBP') || h.startsWith('<svg') || h.startsWith('<?xml') || buf.subarray(0, 64).toString('utf8').includes('<svg');
}

// Clearbit keyless name->domain suggest. Only trust a hit whose name overlaps
// the query (guards against "Acme Ltd" resolving to some unrelated brand).
async function clearbitDomain(company) {
  try {
    const q = String(company).replace(LEGAL, '').trim();
    if (q.length < 3) return null;
    const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(q.slice(0, 60))}`,
      { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const hits = await res.json();
    if (!Array.isArray(hits) || !hits.length) return null;
    const qt = new Set(q.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
    for (const h of hits.slice(0, 3)) {
      const ht = String(h.name || '').toLowerCase().split(/\s+/);
      if (ht.some((w) => qt.has(w)) || slugify(h.name) === slugify(q)) return h.domain || null;
    }
    return null;
  } catch { return null; }
}

// ── Collect board companies (representative URL, prefer an ATS source) ─────────
const RANK = { greenhouse: 5, lever: 5, ashby: 5, smartrecruiters: 4, recruitee: 4, workable: 4 };
const byCompany = new Map(); // slug -> {company, url, source, n}
for (const f of fs.readdirSync(JOBS)) {
  if (!f.endsWith('.json')) continue;
  for (const j of JSON.parse(fs.readFileSync(path.join(JOBS, f), 'utf8'))) {
    const slug = slugify(j.company);
    if (!slug) continue;
    const cur = byCompany.get(slug);
    const rank = RANK[j.source] || 1;
    if (!cur) byCompany.set(slug, { company: j.company, url: j.url, source: j.source, country: j.country, rank, n: 1 });
    else { cur.n++; if (rank > cur.rank) { cur.url = j.url; cur.source = j.source; cur.rank = rank; } if (!cur.country && j.country) cur.country = j.country; }
  }
}

// ── Feed-provided logo URLs from the raw store (streamed; file is large) ───────
const feedLogo = new Map(); // company slug -> logo URL
if (fs.existsSync(RAW)) {
  const rl = readline.createInterface({ input: fs.createReadStream(RAW, 'utf8'), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line || !line.includes('company_logo_url')) continue;
    try {
      const j = JSON.parse(line);
      if (!j.company_logo_url || !/^https?:/.test(j.company_logo_url)) continue;
      const slug = slugify(j.company);
      if (slug && !feedLogo.has(slug)) feedLogo.set(slug, j.company_logo_url);
    } catch { /* skip bad line */ }
  }
}

fs.mkdirSync(LOGOS, { recursive: true });
const have = new Set(fs.readdirSync(LOGOS).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)));
// tried[slug] = "YYYY-MM-DD" (legacy, resolver v1) or "YYYY-MM-DD|v" (versioned)
const tried = fs.existsSync(TRIED) ? JSON.parse(fs.readFileSync(TRIED, 'utf8')) : {};
const today = new Date().toISOString().slice(0, 10);
const staleBefore = new Date(Date.now() - RETRY_DAYS * 864e5).toISOString().slice(0, 10);
const parked = (slug) => {
  const t = tried[slug];
  if (!t) return false;
  const [date, v] = String(t).split('|');
  if (Number(v || 1) < RESOLVER_V) return false;   // older ladder -> retry now
  return date > staleBefore;
};

// Fingerprint the "unknown domain" globe so we can reject it.
const globe = await favicon(`no-such-domain-${crypto.randomBytes(4).toString('hex')}.invalid`);
const globeHash = globe ? crypto.createHash('sha1').update(globe).digest('hex') : null;

// Work list: most-postings first.
const work = [...byCompany.entries()]
  .filter(([slug]) => !have.has(slug) && !parked(slug))
  .sort((a, b) => b[1].n - a[1].n)
  .slice(0, LIMIT);

console.log(`fetch-logos: ${byCompany.size} companies, ${have.size} have logos, ${feedLogo.size} feed-provided URLs known, ${work.length} to try (resolver v${RESOLVER_V})`);
let saved = 0, failed = 0, viaFeed = 0, viaClearbit = 0, i = 0;
for (const [slug, meta] of work) {
  i++;
  let done = false;

  // 1. the feed's own logo URL
  const fl = feedLogo.get(slug);
  if (fl) {
    const img = await fetchBytes(fl);
    await sleep(SPACING);
    if (looksLikeImage(img)) {
      fs.writeFileSync(path.join(LOGOS, `${slug}.png`), img);
      saved++; viaFeed++; done = true;
    }
  }

  // 2-4. domain ladder -> Google favicon
  if (!done) {
    const domains = atsDomains(meta.url, meta.source);
    const cb = await clearbitDomain(meta.company);
    if (cb && !domains.includes(cb)) domains.push(cb);
    for (const nd of nameDomains(meta.company, meta.country)) {
      if (!domains.includes(nd)) domains.push(nd);
    }
    for (const domain of domains.slice(0, 5)) {
      const png = await favicon(domain);
      await sleep(SPACING);
      if (!png || png.length < 70) continue;
      if (globeHash && crypto.createHash('sha1').update(png).digest('hex') === globeHash) continue;
      fs.writeFileSync(path.join(LOGOS, `${slug}.png`), png);
      saved++; if (domain === cb) viaClearbit++;
      done = true;
      break;
    }
  }

  if (!done) { tried[slug] = `${today}|${RESOLVER_V}`; failed++; }
  if (i % 100 === 0) { console.log(`  ${i}/${work.length} · ${saved} saved (${viaFeed} feed, ${viaClearbit} clearbit) · ${failed} miss`); fs.writeFileSync(TRIED, JSON.stringify(tried)); }
}
fs.writeFileSync(TRIED, JSON.stringify(tried));
console.log(`fetch-logos: done — ${saved} new (${viaFeed} from feeds, ${viaClearbit} via clearbit), ${failed} to monogram. Total logos: ${have.size + saved}`);
