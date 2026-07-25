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

// 2. Non-HTML targets that are legitimately linkable.
const PASS = [/^\/api\//, /^\/data\//, /^\/_next\//, /^\/feed\.xml$/, /^\/sitemap\.xml$/, /^\/robots\.txt$/, /^\/llms\.txt$/, /^\/[0-9a-f]{32}\.txt$/, /\.(png|svg|ico|pdf|jpg|webp)(\?|$)/];

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
