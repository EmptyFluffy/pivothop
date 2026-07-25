#!/usr/bin/env node
// Company logos for the whole board (not just featured). For each company on the
// board we derive a candidate domain — preferring the ATS slug baked into the job
// URL (greenhouse.io/figma -> figma.com), else the slugified company name — and
// pull a favicon into public/data/logos/<slug>.png via Google's favicon service
// (the same source the original 40 came from). Google returns a generic globe for
// unknown domains, so we fingerprint that globe once and reject any match.
//
// Incremental + polite: companies that already have a PNG are skipped; failures are
// remembered for 30 days (logo-tried.json) so the nightly run doesn't re-hammer
// them. Everything the fetch can't resolve falls back to a monogram in the UI.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..');
const LOGOS = path.join(REPO, 'apps/web/public/data/logos');
const JOBS = path.join(REPO, 'apps/web/public/data/jobs');
const TRIED = path.join(REPO, 'apps/scraper/data/logo-tried.json');
const LIMIT = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity;
const SPACING = 250; // ms between favicon requests
const RETRY_DAYS = 30;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const nameDomain = (s) => { const g = String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, ''); return g ? g + '.com' : null; };

// ATS slug -> the brand's likely domain roots. The slug is usually the company.
function candidateDomains(company, url, source) {
  const u = url || '';
  const pat = {
    greenhouse: /greenhouse\.io\/([^/?#]+)/, lever: /lever\.co\/([^/?#]+)/,
    ashby: /ashbyhq\.com\/([^/?#]+)/, smartrecruiters: /smartrecruiters\.com\/([^/?#]+)/,
    recruitee: /\/\/([^.]+)\.recruitee\.com/, workable: /apply\.workable\.com\/([^/?#]+)/,
  }[source];
  let slug = pat ? (u.match(pat) || [])[1] : null;
  if (slug && /^(jobs|careers|www|apply|boards|job-boards|company|en)$/i.test(slug)) slug = null;
  const out = [];
  if (slug) { const s = slug.toLowerCase(); out.push(`${s}.com`, `${s}.io`, `${s}.ai`); }
  const nd = nameDomain(company);
  if (nd && !out.includes(nd)) out.push(nd);
  return out.slice(0, 3);
}

async function favicon(domain, ua) {
  try {
    const res = await fetch(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`,
      { headers: { 'user-agent': ua }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch { return null; }
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

// Collect board companies with a representative URL (prefer an ATS source).
const RANK = { greenhouse: 5, lever: 5, ashby: 5, smartrecruiters: 4, recruitee: 4, workable: 4 };
const byCompany = new Map(); // slug -> {company, url, source, n}
for (const f of fs.readdirSync(JOBS)) {
  if (!f.endsWith('.json')) continue;
  for (const j of JSON.parse(fs.readFileSync(path.join(JOBS, f), 'utf8'))) {
    const slug = slugify(j.company);
    if (!slug) continue;
    const cur = byCompany.get(slug);
    const rank = RANK[j.source] || 1;
    if (!cur) byCompany.set(slug, { company: j.company, url: j.url, source: j.source, rank, n: 1 });
    else { cur.n++; if (rank > cur.rank) { cur.url = j.url; cur.source = j.source; cur.rank = rank; } }
  }
}

fs.mkdirSync(LOGOS, { recursive: true });
const have = new Set(fs.readdirSync(LOGOS).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)));
const tried = fs.existsSync(TRIED) ? JSON.parse(fs.readFileSync(TRIED, 'utf8')) : {};
const today = new Date().toISOString().slice(0, 10);
const staleBefore = new Date(Date.now() - RETRY_DAYS * 864e5).toISOString().slice(0, 10);

// Fingerprint the "unknown domain" globe so we can reject it.
const globe = await favicon(`no-such-domain-${crypto.randomBytes(4).toString('hex')}.invalid`, UA);
const globeHash = globe ? crypto.createHash('sha1').update(globe).digest('hex') : null;

// Work list: most-postings first, skip companies we already have or recently failed.
const work = [...byCompany.entries()]
  .filter(([slug]) => !have.has(slug) && !(tried[slug] && tried[slug] > staleBefore))
  .sort((a, b) => b[1].n - a[1].n)
  .slice(0, LIMIT);

console.log(`fetch-logos: ${byCompany.size} companies, ${have.size} already have logos, ${work.length} to try`);
let saved = 0, failed = 0, i = 0;
for (const [slug, meta] of work) {
  i++;
  let done = false;
  for (const domain of candidateDomains(meta.company, meta.url, meta.source)) {
    const png = await favicon(domain, UA);
    await sleep(SPACING);
    if (!png || png.length < 70) continue;
    if (globeHash && crypto.createHash('sha1').update(png).digest('hex') === globeHash) continue;
    fs.writeFileSync(path.join(LOGOS, `${slug}.png`), png);
    saved++; done = true;
    break;
  }
  if (!done) { tried[slug] = today; failed++; }
  if (i % 100 === 0) { console.log(`  ${i}/${work.length} · ${saved} saved · ${failed} miss`); fs.writeFileSync(TRIED, JSON.stringify(tried)); }
}
fs.writeFileSync(TRIED, JSON.stringify(tried));
console.log(`fetch-logos: done — ${saved} new logos saved, ${failed} fell back to monogram. Total logos: ${have.size + saved}`);
