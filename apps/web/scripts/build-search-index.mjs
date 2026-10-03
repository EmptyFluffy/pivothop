#!/usr/bin/env node
/* Global search index for the nav search overlay. One compact JSON with every
 * searchable surface: job boards, salary pages, route origins, glossary
 * skills, blog posts, core pages. Built from the SAME published data the
 * pages read, so search can never offer a page that does not exist — the
 * link-integrity rule applied to search. Runs as npm prebuild. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(HERE, '..');
const DATA = path.join(WEB, 'public', 'data');
const read = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };

const out = [];
const push = (kind, title, sub, href) => out.push({ k: kind, t: title, s: sub, h: href });

// Occupation job boards (with live counts) — jobs-index is [slug, title, count]-ish; adapt to its real shape.
// jobs-index.json is { slug: count }. Titles come from the taxonomy.
const jobsIndex = read(path.join(DATA, 'jobs-index.json')) ?? {};
const TAX = read(path.resolve(WEB, '..', '..', 'packages', 'data', 'taxonomy', 'occupations.json'));
const TITLE = Object.fromEntries((TAX?.occupations ?? []).map((o) => [o.slug, o.title]));
for (const [slug, n] of Object.entries(jobsIndex)) {
  push('jobs', `${TITLE[slug] ?? slug} jobs`, n ? `${n} open roles` : 'job board', `/jobs/${slug}`);
}

// Salary pages
const salDir = path.join(DATA, 'salaries');
if (fs.existsSync(salDir)) {
  for (const f of fs.readdirSync(salDir)) {
    if (!f.endsWith('.json')) continue;
    const d = read(path.join(salDir, f));
    if (d?.slug && d?.title) push('salary', `${d.title} salary`, d.global?.p50 ? `median $${Math.round(d.global.p50 / 1000)}k` : 'salary page', `/salary/${d.slug}`);
  }
}

// Route origins ("careers for an X")
const origins = read(path.join(DATA, 'origins.json'));
for (const o of origins?.origins ?? []) {
  if (o.ok) push('routes', `Routes out of ${o.title.toLowerCase()}`, 'every measured career change', `/routes/${o.slug}`);
}

// Glossary skills
const skills = read(path.join(DATA, 'skills-glossary.json'));
for (const s of skills ?? []) {
  push('skill', s.term, s.field || 'skill', `/glossary#skill-${s.slug}`);
}

// Blog posts (regex over posts.tsx — the data is TS, the index is not)
try {
  const posts = fs.readFileSync(path.join(WEB, 'src', 'app', 'blog', 'posts.tsx'), 'utf8');
  for (const m of posts.matchAll(/slug:\s*'([a-z0-9-]+)'[\s\S]{0,200}?title:\s*'([^']+)'/g)) {
    push('blog', m[2], 'from the blog', `/blog/${m[1]}`);
  }
} catch { /* blog optional */ }

// Core pages
push('page', 'The instrument', 'the career graph', '/');
push('page', 'Job board', 'every live listing', '/jobs');
push('page', 'Browse jobs', 'by field, place, level and pay', '/jobs/browse');
push('page', 'Career routes', 'every measured route', '/routes');
push('page', 'Compare careers', 'side-by-side verdicts', '/compare');
push('page', 'Salaries', 'measured, not scraped once', '/salary');
push('page', 'License gates', 'US and Switzerland, stated plainly', '/licenses');
push('page', 'Glossary & sources', 'every term and dataset', '/glossary');
push('page', 'Adjacency Index', 'the headline numbers, citable', '/adjacency-index');
push('page', 'Jobs in Switzerland', 'the Swiss board', '/jobs/in-switzerland');

fs.writeFileSync(path.join(DATA, 'search-index.json'), JSON.stringify(out));

// License summary sheet data: per occupation, its US gate (primary) and the
// Swiss entry when one exists — the in-page sheet reads this instead of
// navigating to /licenses. Same source file as the page, so they cannot drift.
const GATES = read(path.resolve(WEB, '..', '..', 'packages', 'data', 'taxonomy', 'license-gates.json'));
const OCC_LIC = Object.fromEntries((TAX?.occupations ?? []).filter((o) => o.license).map((o) => [o.slug, { req: o.license.req, label: o.license.label, title: o.title }]));
const sheet = {};
for (const g of GATES?.us ?? []) {
  for (const slug of g.occupations) {
    sheet[slug] = { gate: g.name, market: 'US', path: g.path, time: g.time, note: g.note || '', body: g.body, anchor: `occ-${slug}`, ...OCC_LIC[slug] };
  }
}
for (const g of GATES?.ch ?? []) {
  for (const slug of g.occupations) {
    if (sheet[slug]) sheet[slug].ch = { gate: g.name, path: g.path, time: g.time, url: g.body.url };
    else sheet[slug] = { gate: g.name, market: 'CH', path: g.path, time: g.time, note: g.note || '', body: g.body, anchor: `ch-occ-${slug}`, ...OCC_LIC[slug] };
  }
}
fs.writeFileSync(path.join(DATA, 'license-sheet.json'), JSON.stringify(sheet));
console.log(`license-sheet: ${Object.keys(sheet).length} occupations`);
console.log(`search-index: ${out.length} entries (${Object.entries(out.reduce((m, e) => ((m[e.k] = (m[e.k] ?? 0) + 1), m), {})).map(([k, n]) => `${k}:${n}`).join(' ')})`);

// Logo index: the slugs that have a local logo, one small JSON. companyLogo()
// reads this instead of listing public/data/logos (19k files), so no function
// has to carry the logo directory to know which logos exist (2026-09-30: the
// directory was 113MB inside every function bundle; see next.config.ts).
try {
  const logos = fs.readdirSync(path.join(DATA, 'logos')).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)).sort();
  fs.writeFileSync(path.join(DATA, 'logo-index.json'), JSON.stringify(logos));
  console.log(`logo-index: ${logos.length} logos`);
} catch (err) { console.warn(`logo-index: skipped (${err.message})`); }

// The sealed direct-jobs vault, published as static files at /data/vault/:
// /api/direct and /api/direct/peek fetch one occupation's shard instead of
// carrying ~370MB inside a function (2026-10-03: past Vercel's 250MB limit the
// deploy failed twice in "Deploying outputs"). Ciphertext only, already public
// in git; DIRECT_KEY stays in the env. Gitignored: rebuilt from private/direct.
try {
  const src = path.join(WEB, 'private', 'direct');
  const dst = path.join(DATA, 'vault');
  fs.rmSync(dst, { recursive: true, force: true });
  fs.mkdirSync(dst, { recursive: true });
  let n = 0, bytes = 0;
  for (const f of fs.readdirSync(src)) {
    if (!/^[a-z0-9-]+\.enc$/.test(f)) continue;
    fs.copyFileSync(path.join(src, f), path.join(dst, f));
    n++; bytes += fs.statSync(path.join(dst, f)).size;
  }
  console.log(`vault: ${n} sealed shards published (${(bytes / 1048576).toFixed(0)}MB)`);
} catch (err) { console.warn(`vault: skipped (${err.message})`); }
