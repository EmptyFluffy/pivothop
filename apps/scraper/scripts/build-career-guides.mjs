#!/usr/bin/env node
/* Career guides: the judgement layer over our own measurements.
 *
 * The competitor version of this surface (see /admin/research) is an LLM's
 * recollection of an occupation, written once against a template and never
 * checked. This is the inverse. The split is the whole design:
 *
 *   NUMBERS  are never written by the model. They are computed at render time
 *            from the live corpus, so a guide re-prices itself with the nightly
 *            scrape and can never quote a figure the board does not hold.
 *   PROSE    is generated once per occupation from a facts packet, and holds
 *            only what a number cannot say: what the role actually is, the
 *            honest read on it, who already qualifies, and what the data misses.
 *
 * The model is given the packet and forbidden to invent a figure. Anything it
 * states that is checkable must be traceable to the packet it was handed.
 *
 * Usage:
 *   node apps/scraper/scripts/build-career-guides.mjs                 # all
 *   node apps/scraper/scripts/build-career-guides.mjs architect nurse # some
 *   LIMIT=5 node apps/scraper/scripts/build-career-guides.mjs         # first N
 *   DRY=1   node ...                                                  # packet only
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..');
const WEB = path.join(REPO, 'apps', 'web', 'public', 'data');
const GEN = path.join(REPO, 'packages', 'data', 'generated');
const OUT = path.join(REPO, 'packages', 'data', 'career-guides');
const MODEL = process.env.GUIDE_MODEL || 'claude-sonnet-5';

const readJson = (p, fb = null) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fb; } };
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
const k = (v) => (v == null ? null : '$' + Math.round(v / 1000) + 'k');

/* ---------------------------------------------------------------- the packet */

function reverseRoutes(occs) {
  // Who reaches THIS occupation. Built once across every origin file, because
  // "who already qualifies" is the section no competitor can generate and it
  // only exists in the reverse direction.
  const into = new Map();
  for (const o of occs) {
    const g = readJson(path.join(GEN, `${o}.json`));
    for (const r of g?.roles ?? []) {
      if (r.match == null) continue;
      if (!into.has(r.id)) into.set(r.id, []);
      into.get(r.id).push({ from: o, fromTitle: g.origin?.title ?? o, match: r.match });
    }
  }
  for (const [, list] of into) list.sort((a, b) => b.match - a.match);
  return into;
}

function packet(occ, into) {
  const gen = readJson(path.join(GEN, `${occ}.json`));
  if (!gen?.origin) return null;
  const jobs = readJson(path.join(WEB, 'jobs', `${occ}.json`), []);
  const detail = readJson(path.join(WEB, 'jobs-detail', `${occ}.json`), {});
  const sal = readJson(path.join(WEB, 'salaries', `${occ}.json`));
  const rows = Object.values(detail);

  const tally = (get) => {
    const m = new Map();
    for (const d of rows) for (const v of get(d) ?? []) m.set(v, (m.get(v) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const skills = tally((d) => d.k).slice(0, 12);
  const benefits = tally((d) => d.b).slice(0, 8);

  const gates = rows.map((d) => d.r).filter(Boolean);
  const exps = gates.map((g) => g.exp).filter((n) => n != null).sort((a, b) => a - b);
  const eduStates = {};
  for (const g of gates) if (g.edu) eduStates[g.edu.state] = (eduStates[g.edu.state] ?? 0) + 1;
  const langs = {};
  for (const g of gates) for (const l of g.lang ?? []) langs[l] = (langs[l] ?? 0) + 1;

  const countries = {};
  for (const j of jobs) if (j.c) countries[j.c] = (countries[j.c] ?? 0) + 1;

  const band = sal ? (sal.by_country?.US?.blended || sal.by_country?.US?.posted || sal.global) : null;

  return {
    slug: occ,
    title: gen.origin.title,
    field: gen.origin.field,
    live_openings: jobs.length,
    remote_share_pct: pct(jobs.filter((j) => j.remote).length, jobs.length),
    postings_read: gen.origin.postings ?? null,
    salary: band ? { p25: k(band.p25), p50: k(band.p50), p75: k(band.p75), n: band.n ?? null } : null,
    yearly_switch_rate_pct: gen.origin.separations?.transfer ?? null,
    top_skills: skills.map(([s, n]) => ({ skill: s, share_pct: pct(n, rows.length) })),
    top_benefits: benefits.map(([b, n]) => ({ benefit: b, share_pct: pct(n, rows.length) })),
    gates: {
      experience_median_years: exps.length ? exps[Math.floor(exps.length / 2)] : null,
      experience_stated_share_pct: pct(exps.length, rows.length),
      education: eduStates,
      languages: Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l, n]) => ({ language: l, n })),
    },
    hiring_countries: Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c, n]) => ({ country: c, n })),
    routes_out: (gen.roles ?? []).filter((r) => r.match != null).slice(0, 6)
      .map((r) => ({ to: r.title, match_pct: r.match, salary: r.salary, time: r.time, licensed: r.license?.req === 'required' })),
    routes_in: (into.get(occ) ?? []).slice(0, 6).map((r) => ({ from: r.fromTitle, match_pct: r.match })),
  };
}

/* ----------------------------------------------------------------- the prose */

const SYSTEM = `You write for PivotHop, a career-navigation instrument that measures career moves from live job postings.

HOUSE VOICE, absolute:
- Deadpan, editorial. The register of a careful trade journalist who happens to own the dataset.
- Numbers over adjectives. No motivational vocabulary, no exclamation points, no rhetorical questions.
- NEVER use em dashes or en dashes. Use periods, commas, colons or parentheses.
- No "in today's fast-paced world", no "landscape", no "delve", no "testament", no "vibrant".
- Do not open consecutive sentences with the same word. Vary sentence length.
- If a sentence could appear on any other career site, delete it.

THE RULE THAT MATTERS MOST:
You are given a FACTS packet measured from live job postings. You may ONLY state figures that appear in that packet. Never invent, round differently, estimate, or import a number from your training data. If you do not have a figure, write around it or say the data does not show it. The page renders the numbers itself, so you rarely need to repeat them; reference them sparingly and only where the sentence needs one to make sense.

NEVER refer to the mechanics of your own input. The words "packet", "dataset provided", "the data given", "our data shows" are forbidden. Refer to the evidence the way a reader understands it: "postings", "live postings", "the board", "measured routes".

You are writing the judgement a human expert would add on top of the measurements, not a summary of them.`;

function userPrompt(p) {
  return `Write the prose sections for the ${p.title} career guide.

FACTS PACKET (the only figures you may use):
${JSON.stringify(p, null, 1)}

Return ONLY valid JSON, no markdown fence, with exactly these keys:

{
  "summary": "2 to 3 sentences. What this job actually is, in plain words, and what distinguishes it from the roles next to it. No preamble.",
  "judgement": "3 to 4 sentences. THE honest read on this occupation right now, the thing a friend in the trade would tell you. Use the packet: what the pay, the gates, the switch rate or the route data actually imply for someone considering it. Say the uncomfortable part if the data supports one.",
  "who_qualifies": "3 to 4 sentences. Who already has most of what this role asks for, grounded in routes_in. Name the origin occupations and what specifically carries over. If routes_in is empty, say plainly that no measured route into it exists yet and why that might be.",
  "what_the_numbers_miss": "2 to 3 sentences. The honest limitation. What this measurement cannot see about the job (a posting states requirements, not what the work feels like, what the team is, whether the pay is negotiable). Be specific to THIS occupation, not generic.",
  "faq": [
    { "q": "a real question someone considering this role asks", "a": "2 to 3 sentences, grounded in the packet" }
  ]
}

Write 4 FAQ entries. Make at least one of them about the gap or the gate (experience, degree, licence, language) if the packet shows one.`;
}

async function generate(p, key, attempt = 1) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{ role: 'user', content: userPrompt(p) }],
    }),
  }).catch(async (e) => {
    // transient network failures are common over a long batch; back off twice
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 1500 * attempt));
      return { __retry: true };
    }
    throw e;
  });
  if (res.__retry) return generate(p, key, attempt + 1);
  const j = await res.json();
  if (res.status === 429 || res.status >= 500) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      return generate(p, key, attempt + 1);
    }
  }
  if (res.status !== 200) {
    const msg = j?.error?.message || JSON.stringify(j).slice(0, 200);
    const err = new Error(`${res.status} ${msg}`);
    err.creditsExhausted = /credit|billing|quota/i.test(msg);
    throw err;
  }
  const text = (j.content ?? []).map((c) => c.text ?? '').join('').trim();
  const clean = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const parsed = JSON.parse(clean);
  return { parsed, usage: j.usage ?? {} };
}

/* A generated guide has to survive the same scrutiny as a scraped number. */
function audit(prose, p) {
  const problems = [];
  const blob = [prose.summary, prose.judgement, prose.who_qualifies, prose.what_the_numbers_miss,
    ...(prose.faq ?? []).flatMap((f) => [f.q, f.a])].join(' ');
  if (/[—–]/.test(blob)) problems.push('contains an em or en dash');
  if (/!/.test(blob)) problems.push('contains an exclamation point');
  if (/\bpacket\b|dataset provided|data (?:given|provided)/i.test(blob)) problems.push('leaks input vocabulary');
  // every $ figure and percentage must exist in the packet
  const allowed = new Set(JSON.stringify(p).match(/\d+/g) ?? []);
  for (const m of blob.matchAll(/\$\s?([\d,]+)k?/gi)) {
    const n = m[1].replace(/,/g, '');
    if (!allowed.has(n) && !allowed.has(String(Number(n)))) problems.push(`unsourced money figure ${m[0]}`);
  }
  for (const m of blob.matchAll(/(\d[\d.]*)\s?(?:percent|%)/gi)) {
    if (!allowed.has(m[1].replace(/\..*/, ''))) problems.push(`unsourced percentage ${m[0]}`);
  }
  for (const key of ['summary', 'judgement', 'who_qualifies', 'what_the_numbers_miss']) {
    if (!prose[key] || prose[key].length < 60) problems.push(`${key} missing or too short`);
  }
  if (!Array.isArray(prose.faq) || prose.faq.length < 3) problems.push('fewer than 3 FAQ entries');
  return problems;
}

/* -------------------------------------------------------------------- driver */

const key = (() => {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  // .env is gitignored, so a linked worktree reads the main checkout's copy
  for (const p of [path.join(REPO, '.env'), path.join(process.env.HOME ?? '', 'PivotHop', '.env')]) {
    try {
      const m = fs.readFileSync(p, 'utf8').match(/ANTHROPIC_API_KEY=(.+)/);
      if (m) return m[1].trim();
    } catch { /* next */ }
  }
  return null;
})();

const index = readJson(path.join(WEB, 'jobs-index.json'), {});
const all = Object.keys(index).filter((o) => fs.existsSync(path.join(GEN, `${o}.json`)));
const args = process.argv.slice(2).filter((a) => !a.startsWith('-'));
let targets = args.length ? args.filter((a) => all.includes(a)) : all;
if (process.env.LIMIT) targets = targets.slice(0, Number(process.env.LIMIT));

console.log(`career guides: ${targets.length} of ${all.length} occupations, model ${MODEL}`);
fs.mkdirSync(OUT, { recursive: true });
const into = reverseRoutes(all);

let wrote = 0, skipped = 0, failed = 0, inTok = 0, outTok = 0;
for (const occ of targets) {
  const p = packet(occ, into);
  if (!p) { console.log(`  skip ${occ}: no route data`); skipped++; continue; }
  if (process.env.DRY) { console.log(JSON.stringify(p, null, 1)); break; }
  const dest = path.join(OUT, `${occ}.json`);
  if (fs.existsSync(dest) && !process.env.FORCE) { skipped++; continue; }
  try {
    const { parsed, usage } = await generate(p, key);
    inTok += usage.input_tokens ?? 0; outTok += usage.output_tokens ?? 0;
    const problems = audit(parsed, p);
    if (problems.length) {
      console.log(`  FAIL ${occ}: ${problems.join('; ')}`);
      failed++;
      continue;
    }
    fs.writeFileSync(dest, JSON.stringify({
      slug: occ, title: p.title, model: MODEL,
      generated: new Date().toISOString().slice(0, 10),
      prose: parsed,
    }, null, 1));
    wrote++;
    console.log(`  ok   ${occ}`);
  } catch (e) {
    failed++;
    console.log(`  ERR  ${occ}: ${e.message}`);
    if (e.creditsExhausted) { console.log('CREDITS EXHAUSTED, stopping.'); break; }
  }
}
const cost = (inTok / 1e6) * 3 + (outTok / 1e6) * 15;  // sonnet list price
console.log(`\nwrote ${wrote}, skipped ${skipped}, failed ${failed}`);
console.log(`tokens in ${inTok.toLocaleString()}, out ${outTok.toLocaleString()} (~$${cost.toFixed(2)} at Sonnet list)`);
