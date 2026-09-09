#!/usr/bin/env node
/* The copy gate (2026-09-08). House style has no em dashes and no exclamation
   marks in anything a reader sees, and the founder kept finding them: in the
   category blurbs (2,700 pages), the employer form, the blog, quoted company
   text. Cleaning them by hand does not stay clean. This scans:

     - src/app **.ts,.tsx   rendered string literals and JSX text, skipping
                            code comments, the '—' numeric placeholder, and
                            regex character classes
     - packages/data/career-guides/*.json   the guide prose
     - the blog posts (src/app/blog/posts.tsx is covered by the first rule)

   and exits non-zero with every offending line, so the nightly build refuses
   to publish them. Run: npm run check:copy. */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const APP = path.join(ROOT, 'src', 'app');
const GUIDES = path.join(ROOT, '..', '..', 'packages', 'data', 'career-guides');

const COMMENT = /^\s*(\/\/|\/\*|\*|\{\/\*)/;
const PLACEHOLDER = /(\?\?|\?|\|\||:)\s*'—'|\[-–—\]|'—'\s*:|=> '—'|return '—'|'—'\)/;
const BAD = /—|&mdash;/;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'admin' || e.name === 'design-lab' || e.name === 'node_modules') continue;
      walk(p, out);
    } else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

const hits = [];
for (const f of walk(APP)) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (!BAD.test(line) || COMMENT.test(line) || PLACEHOLDER.test(line)) return;
    hits.push(`${path.relative(ROOT, f)}:${i + 1}: ${line.trim().slice(0, 120)}`);
  });
}
if (fs.existsSync(GUIDES)) {
  for (const f of fs.readdirSync(GUIDES)) {
    if (!f.endsWith('.json')) continue;
    const g = JSON.parse(fs.readFileSync(path.join(GUIDES, f), 'utf8'));
    const text = JSON.stringify(g.prose ?? g);
    if (BAD.test(text) || /!/.test(text.replace(/!=/g, ''))) hits.push(`packages/data/career-guides/${f}: em dash or exclamation mark in prose`);
  }
}

if (hits.length) {
  console.error(`check-copy: ${hits.length} line(s) carry an em dash (or an exclamation mark in guide prose). House style: none.\n`);
  for (const h of hits) console.error('  ' + h);
  process.exit(1);
}
console.log('check-copy: clean');
