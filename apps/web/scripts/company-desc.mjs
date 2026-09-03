#!/usr/bin/env node
/* What each company actually does, from a source a reader can check.

   The posting-mined "in its own words" blurb described OpenAI as a hardware
   shop because the paragraph came from one team's job ad (2026-09-02). This
   script asks Wikipedia instead: for every company with three or more live
   postings it searches the title index, keeps a hit only when the article
   title matches the company name (suffixes like AG, Inc, GmbH stripped) AND
   the article describes an organization, and stores the first two sentences
   with the article URL for attribution (CC BY-SA). Misses are recorded so
   the next run skips them for 90 days. Output: public/data/company-desc.json,
   read by companies-data.ts at build time. Never exits non-zero: a network
   failure leaves the previous file in place. */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const OUT = path.join(ROOT, 'public', 'data', 'company-desc.json');
const JOBS = path.join(ROOT, 'public', 'data', 'all-jobs.json');
const UA = 'PivotHop/1.0 (https://www.pivothop.com; hello@pivothop.com)';
const FLOOR = 3;
const RECHECK_DAYS = 90;
const EXCLUDE = new Set(['Name', 'Jobup']);

const ORG_RE = /\b(company|corporation|firm|organi[sz]ation|manufacturer|bank|agency|start-?up|brand|retailer|provider|studio|conglomerate|business|enterprise|platform|developer|publisher|airline|hospital|university|college|consultancy|consulting|insurer|insurance|subsidiary|multinational|operator|producer|maker|institution|non-?profit|foundation|department|command|authority|ministry|school|laboratory|practice|automaker|carrier|exchange|marketplace|software|website|chain|holding|utility|contractor|builder|distributor|supplier|cooperative|association|federation|institute|clinic|health system|newspaper|broadcaster|government agency|federal agency)\b/i;

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\b(inc|corp|corporation|co|ltd|limited|llc|ag|gmbh|sa|sas|srl|plc|pty|bv|nv|oy|ab|the|group|holdings?|technologies|technology|company|companies|international|global|worldwide|usa|us|uk)\b\.?/g, '')
  .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();

/* Exact match after normalization, and nothing looser. The prefix rules of
   the first run matched "Sunrise" to an anime studio, "Manpower" to a UK
   commission, "RUAG AG" to a drone and "FullStack" to a bootcamp: a wrong
   description is worse than none. Suffixes that norm() strips ("Stripe,
   Inc.", "Amazon (company)", "Microsoft Corporation") still resolve. */
function titleMatches(name, title) {
  const a = norm(name); const b = norm(title);
  return !!a && a.length >= 3 && a === b;
}

function firstSentences(extract, max = 340) {
  const parts = extract.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+(\s|$)/g) ?? [extract];
  let out = '';
  for (const p of parts) { if ((out + p).length > max && out) break; out += p; }
  return out.trim();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
class Throttled extends Error {}
/* Wikimedia rate-limits anonymous bursts: the first run at concurrency 5 got
   throttled on most requests and recorded 2,000 false misses. Retry 429/5xx
   with backoff; a request that never succeeds throws, and the caller leaves
   the company unchecked rather than marking a miss. */
async function get(url) {
  for (let i = 0; i < 5; i++) {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' } });
    if (r.ok) return r.json();
    if (r.status === 404) return null;
    if (r.status === 429 || r.status >= 500) { await sleep(800 * 2 ** i); continue; }
    return null;
  }
  throw new Throttled(url);
}

async function lookup(name) {
  const q = encodeURIComponent(name);
  const s = await get(`https://en.wikipedia.org/w/rest.php/v1/search/title?q=${q}&limit=5`);
  const pages = s?.pages ?? [];
  for (const p of pages) {
    if (!titleMatches(name, p.title)) continue;
    const sum = await get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(p.title.replace(/ /g, '_'))}`);
    if (!sum || sum.type === 'disambiguation') continue;
    const extract = (sum.extract ?? '').trim();
    const desc = sum.description ?? '';
    if (!extract || /may refer to/i.test(extract)) continue;
    const head = extract.slice(0, 220);
    if (!(ORG_RE.test(desc) || (/\b(is|was|are) (a|an|the)\b/.test(head) && ORG_RE.test(head)))) continue;
    return { t: sum.title, d: desc, x: firstSentences(extract), u: sum.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}` };
  }
  return null;
}

async function main() {
  const jobs = JSON.parse(fs.readFileSync(JOBS, 'utf8'));
  const counts = new Map();
  for (const j of jobs) if (j.company && !EXCLUDE.has(j.company)) counts.set(j.company, (counts.get(j.company) ?? 0) + 1);
  const names = [...counts.entries()].filter(([, n]) => n >= FLOOR).sort((a, b) => b[1] - a[1]).map(([n]) => n);
  let prev = {};
  try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch { /* first run */ }
  const today = new Date().toISOString().slice(0, 10);
  const fresh = (rec) => rec && (Date.now() - Date.parse(rec.at)) < RECHECK_DAYS * 864e5;
  const out = {};
  for (const n of names) if (fresh(prev[n])) out[n] = prev[n];
  const todo = names.filter((n) => !out[n]);
  console.log(`companies >= ${FLOOR}: ${names.length}; cached ${names.length - todo.length}; looking up ${todo.length}`);
  let hits = 0, done = 0;
  const pool = Array.from({ length: 2 }, async () => {
    while (todo.length) {
      const n = todo.shift();
      try {
        const r = await lookup(n);
        out[n] = r ? { ...r, at: today } : { miss: true, at: today };
        if (r) hits++;
      } catch { if (prev[n]) out[n] = prev[n]; /* unchecked: try again next run */ }
      await sleep(120);
      if (++done % 200 === 0) console.log(`  ${done} looked up, ${hits} described`);
    }
  });
  await Promise.all(pool);
  const described = Object.values(out).filter((r) => !r.miss).length;
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log(`described ${described} of ${names.length} companies (${hits} new); wrote ${path.relative(ROOT, OUT)}`);
}

main().catch((e) => { console.error('company-desc: skipped,', e.message); });
