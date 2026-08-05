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
console.log(`search-index: ${out.length} entries (${Object.entries(out.reduce((m, e) => ((m[e.k] = (m[e.k] ?? 0) + 1), m), {})).map(([k, n]) => `${k}:${n}`).join(' ')})`);
