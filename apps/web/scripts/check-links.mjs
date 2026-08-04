#!/usr/bin/env node
// Internal link-integrity gate. Scans every prerendered page in .next for
// internal hrefs and verifies each resolves to a generated page or a known
// dynamic route. Catches the "board got deleted but pages still link to it"
// class (the dental-hygienist lesson applied to links). Run after `npm run
// build`; exits non-zero on broken links so it can gate a publish.
import fs from 'node:fs';
import path from 'node:path';

const APP = path.join(process.cwd(), '.next', 'server', 'app');
if (!fs.existsSync(APP)) { console.error('check-links: run `npm run build` first'); process.exit(1); }

// 1. Collect every generated page path.
const pages = new Set(['/']);
(function walk(dir, prefix) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) walk(path.join(dir, e.name), `${prefix}/${e.name}`);
    else if (e.name.endsWith('.html')) {
      const p = e.name === 'index.html' ? prefix || '/' : `${prefix}/${e.name.slice(0, -5)}`;
      pages.add(p || '/');
    }
  }
})(APP, '');

// 1b. Sitemap coverage: every URL the sitemap advertises must exist as a built
// page — a sitemap entry with no page is a crawlable 404 (the curated-route
// class: generateStaticParams minted the param but the render notFound()'d).
try {
  const sm = fs.readFileSync(path.join(APP, 'sitemap.xml.body'), 'utf8');
  const missing = [];
  for (const m of sm.matchAll(/<loc>https:\/\/www\.pivothop\.com([^<]*)<\/loc>/g)) {
    const p = m[1] === '' ? '/' : m[1].replace(/\/$/, '');
    if (p === '/' || pages.has(p)) continue;
    missing.push(p);
  }
  if (missing.length) {
    console.error(`check-links: ${missing.length} sitemap URL(s) have no built page:`);
    missing.slice(0, 20).forEach((p) => console.error('  ' + p));
    process.exit(1);
  }
} catch { /* no sitemap in this build */ }

// 2. Non-HTML targets that are legitimately linkable.
const PASS = [/^\/api\//, /^\/data\//, /^\/_next\//, /^\/feed\.xml$/, /^\/sitemap\.xml$/, /^\/robots\.txt$/, /^\/llms\.txt$/, /^\/llms-full\.txt$/, /^\/[0-9a-f]{32}\.txt$/, /\.(png|svg|ico|pdf|jpg|webp)(\?|$)/];

// 2b. Job detail pages render ON DEMAND since 2026-08-04 (prebuilding 14.5k
// noindexed pages crashed Vercel's deploy walker), so there is no HTML file to
// find. The check stays REAL: a /jobs/<occ>/<id> link resolves only if that id
// actually exists in that occupation's published board JSON — a link to a
// removed job still fails the gate.
const jobIds = new Map();
{
  const dir = path.join(process.cwd(), 'public', 'data', 'jobs');
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
    if (!f.endsWith('.json')) continue;
    try {
      const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      const jobs = Array.isArray(d) ? d : d.jobs ?? [];
      jobIds.set(f.slice(0, -5), new Set(jobs.map((j) => j.id)));
    } catch { /* malformed board file surfaces elsewhere */ }
  }
}
function dynamicJobPage(target) {
  const m = target.match(/^\/jobs\/([a-z0-9-]+)\/([a-z0-9]+)$/);
  return !!m && (jobIds.get(m[1])?.has(m[2]) ?? false);
}

// 3. Scan every page's hrefs.
const broken = new Map();
let scanned = 0, checked = 0;
(function scan(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { scan(path.join(dir, e.name)); continue; }
    if (!e.name.endsWith('.html')) continue;
    scanned++;
    const html = fs.readFileSync(path.join(dir, e.name), 'utf8');
    for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
      const target = decodeURIComponent(m[1].replace(/\/$/, '')) || '/';
      checked++;
      if (PASS.some((re) => re.test(target))) continue;
      if (pages.has(target)) continue;
      if (dynamicJobPage(target)) continue;
      if (!broken.has(target)) broken.set(target, []);
      const from = path.join(dir, e.name).slice(APP.length, -5);
      if (broken.get(target).length < 3) broken.get(target).push(from);
    }
  }
})(APP);

if (broken.size) {
  console.error(`check-links: ${broken.size} broken internal link target(s) across ${scanned} pages:`);
  for (const [t, from] of [...broken.entries()].slice(0, 25)) console.error(`  ✗ ${t}  (from ${from.join(', ')})`);
  process.exit(1);
}
console.log(`check-links: ${scanned} pages, ${checked} internal hrefs — all resolve`);
