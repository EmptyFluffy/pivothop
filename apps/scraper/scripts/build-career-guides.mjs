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
 *            only what a number cannot say: what the role is day to day, the
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
  const lic = readJson(path.join(WEB, 'license-sheet.json'), {})[occ] ?? null;

  return {
    slug: occ,
    title: gen.origin.title,
    field: gen.origin.field,
    live_openings: jobs.length,
    remote_share_pct: pct(jobs.filter((j) => j.remote).length, jobs.length),
    postings_read: gen.origin.postings ?? null,
    salary: band ? { p25: k(band.p25), p50: k(band.p50), p75: k(band.p75), n: band.n ?? null } : null,
    yearly_switch_rate_pct: gen.origin.separations?.transfer ?? null,
    license: lic ? { gate: lic.gate, path: lic.path, time: lic.time, note: lic.note, body: lic.body?.name } : null,
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

const SYSTEM = `You write for PivotHop, a career-navigation instrument built from live job postings.

You are a thoughtful PivotHop editor speaking directly to someone who is considering this career. Sound informed, candid and human. You are not a recruiter, and you are not pretending to have personally worked in every profession.

Write in plain English. Use contractions when they fit. Vary sentence length and let the rhythm change from one section to the next. Concrete details are useful when the evidence supports them, but never manufacture a personal anecdote, a weekly ritual, an emotion or a precise workplace scene. Do not force a clever closer or make every paragraph follow the same shape.

Warmth should come from understanding what the reader is deciding. Explain what is appealing, what is difficult and what would make someone a good fit without turning the page into a sales pitch.

Only use figures found in the measurements. Never invent, import or differently round a number. Most figures appear elsewhere on the page, so repeat them only when they improve the answer. Never mention prompts, packets, datasets or generation mechanics.

Avoid the word "actually". Never use an em dash. Use a comma, colon or full stop instead.`;

function userPrompt(p) {
  return `Write the editorial prose for the ${p.title} career guide.

MEASUREMENTS:
${JSON.stringify(p)}

Call the career_guide tool. Keep the guide natural. Different careers can need different amounts of explanation, so do not force every section into the same cadence.

- summary: 2 or 3 direct sentences that explain the work, its responsibility and the closest role people confuse it with.
- day_to_day: 3 to 5 sentences about the work and its outputs. No invented personal stories or precise weekly schedule.
- work_environment: 2 to 4 sentences about setting, hours, travel or remote feasibility when relevant.
- getting_in: 3 to 5 sentences describing the realistic route in. Use the license path exactly when one exists.
- ladder: 2 to 4 sentences about how responsibility grows and where the path branches.
- suits: 2 to 4 sentences that help the reader decide whether the work fits them.
- misconceptions: 1 to 3 sentences correcting one useful misconception.
- who_qualifies: 2 to 4 sentences grounded in measured routes in.
- what_the_numbers_miss: 1 or 2 restrained sentences about a factor current listings cannot reveal.
- steps: 3 to 6 real actions. Use only as many as the path needs.
- tools: 2 to 4 sentences grounded in listed skills.
- industries: 2 to 4 genuinely distinct settings.
- specializations: 0 to 4 meaningful paths. Use an empty array instead of filler.
- pros and cons: 2 to 4 concise, role-specific points each.
- faq: 3 to 6 questions written the way a person searches. Give the useful answer in the first sentence, then qualify it. For a timeline question, start with a supported number or range. For a yes-or-no question, begin with Yes, No, Usually or Rarely. Never answer only with "it depends" or "it varies".

Lead with the "how to become a ${p.title.toLowerCase()}" intent. Then answer what the work is like, what employers ask for and how it differs from the closest adjacent role. Only discuss remote work, AI risk or specializations when the evidence makes the answer useful.`;
}


/* The guide's shape, enforced by the API. Asking for JSON in the prompt cost 11
   of the first 16 failures in the first batch: long responses came back with an
   unterminated string or a missing brace, and a whole paid generation was lost
   to a syntax error. A forced tool call cannot come back malformed. */
const TOOL = {
  name: 'career_guide',
  description: 'The written sections of one career guide.',
  input_schema: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      day_to_day: { type: 'string' },
      work_environment: { type: 'string' },
      getting_in: { type: 'string' },
      steps: {
        type: 'array', minItems: 3, maxItems: 6,
        items: {
          type: 'object',
          properties: { do: { type: 'string' }, how: { type: 'string' } },
          required: ['do', 'how'],
        },
      },
      ladder: { type: 'string' },
      suits: { type: 'string' },
      misconceptions: { type: 'string' },
      tools: { type: 'string' },
      industries: {
        type: 'array', minItems: 2, maxItems: 4,
        items: {
          type: 'object',
          properties: { name: { type: 'string' }, note: { type: 'string' } },
          required: ['name', 'note'],
        },
      },
      specializations: {
        type: 'array', minItems: 0, maxItems: 4,
        items: {
          type: 'object',
          properties: { name: { type: 'string' }, why: { type: 'string' } },
          required: ['name', 'why'],
        },
      },
      pros: { type: 'array', minItems: 2, maxItems: 4, items: { type: 'string' } },
      cons: { type: 'array', minItems: 2, maxItems: 4, items: { type: 'string' } },
      who_qualifies: { type: 'string' },
      what_the_numbers_miss: { type: 'string' },
      faq: {
        type: 'array', minItems: 3, maxItems: 6,
        items: {
          type: 'object',
          properties: { q: { type: 'string' }, a: { type: 'string' } },
          required: ['q', 'a'],
        },
      },
    },
    required: ['summary', 'day_to_day', 'work_environment', 'getting_in', 'steps', 'ladder',
      'suits', 'misconceptions', 'tools', 'industries', 'specializations', 'pros', 'cons',
      'who_qualifies', 'what_the_numbers_miss', 'faq'],
  },
};

async function generate(p, key, attempt = 1, fixes = null) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: Number(process.env.GUIDE_MAX_TOKENS || 6000),
      // Thinking is OFF by default. Measured on the architect guide: with it on,
      // 17,203 of 25,312 output tokens were thinking and the call cost $0.41;
      // with it off the same guide cost $0.08 and read better, being more
      // concrete. Set GUIDE_THINKING=on to compare again.
      ...(process.env.GUIDE_THINKING === 'on' ? {} : { thinking: { type: 'disabled' } }),
      tools: [TOOL],
      tool_choice: { type: 'tool', name: TOOL.name },
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: fixes
          ? `${userPrompt(p)}\n\nA previous draft was rejected for: ${fixes.join('; ')}. Rewrite the whole thing without those faults.`
          : userPrompt(p),
      }],
    }),
  }).catch(async (e) => {
    // transient network failures are common over a long batch; back off twice
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 1500 * attempt));
      return { __retry: true };
    }
    throw e;
  });
  if (res.__retry) return generate(p, key, attempt + 1, fixes);
  const raw = await res.text();
  let j;
  try {
    j = JSON.parse(raw);
  } catch {
    // gateways sometimes answer with an HTML error page; that is retryable
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      return generate(p, key, attempt + 1, fixes);
    }
    throw new Error(`${res.status} non-JSON response from the API`);
  }
  if (res.status === 429 || res.status >= 500) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      return generate(p, key, attempt + 1, fixes);
    }
  }
  if (res.status !== 200) {
    const msg = j?.error?.message || JSON.stringify(j).slice(0, 200);
    const err = new Error(`${res.status} ${msg}`);
    err.creditsExhausted = /credit|billing|quota/i.test(msg);
    throw err;
  }
  if (j.stop_reason === 'max_tokens') throw new Error('response hit the token ceiling');
  const call = (j.content ?? []).find((c) => c.type === 'tool_use' && c.name === TOOL.name);
  if (!call) throw new Error(`no ${TOOL.name} call in the response`);
  if (process.env.DEBUG_RAW) {
    fs.writeFileSync('/tmp/guide-raw.txt', JSON.stringify(call.input, null, 1));
    console.log(`  [debug] stop=${j.stop_reason}, out=${j.usage?.output_tokens}`);
  }
  return { parsed: call.input, usage: j.usage ?? {} };
}

/* Models occasionally emit a literal newline inside a JSON string, which is
   invalid and would throw away a whole generation. Escape control characters
   that sit INSIDE string literals (structural whitespace is left alone) and
   parse again. */
function parseLoose(text) {
  try { return JSON.parse(text); } catch { /* repair below */ }
  let out = '', inStr = false, esc = false;
  for (const ch of text) {
    if (esc) { out += ch; esc = false; continue; }
    if (ch === '\\' && inStr) { out += ch; esc = true; continue; }
    if (ch === '"') { inStr = !inStr; out += ch; continue; }
    if (inStr && ch < ' ') {
      out += ch === '\n' ? '\\n' : ch === '\t' ? '\\t' : ch === '\r' ? '\\r' : '';
      continue;
    }
    out += ch;
  }
  return JSON.parse(out);
}

/* Deterministic cleanup before the audit. Some faults are not worth spending a
   retry on: "actually" and "really" are pure filler, and the model reaches for
   them however firmly the prompt says not to. Cutting the word is safe (the
   sentence reads the same without it) and cheaper than another generation. */
const FILLER = /\s*\bactually\b/gi;
function polish(v) {
  if (typeof v === 'string') {
    return v.replace(FILLER, '').replace(/\s*—\s*/g, ', ').replace(/ {2,}/g, ' ').replace(/ ([,.;:])/g, '$1').trim();
  }
  if (Array.isArray(v)) return v.map(polish);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, polish(x)]));
  return v;
}

/* A generated guide has to survive the same scrutiny as a scraped number. */
function audit(prose, p) {
  const problems = [];
  const KEYS = ['summary', 'day_to_day', 'work_environment', 'getting_in', 'ladder', 'suits',
    'misconceptions', 'who_qualifies', 'what_the_numbers_miss', 'tools'];
  const blob = [...KEYS.map((k) => prose[k] ?? ''), prose.tools ?? '',
    ...(prose.steps ?? []).map((i) => `${i.do} ${i.how}`),
    ...(prose.industries ?? []).map((i) => `${i.name} ${i.note}`),
    ...(prose.specializations ?? []).map((i) => `${i.name} ${i.why}`),
    ...(prose.pros ?? []), ...(prose.cons ?? []),
    ...(prose.faq ?? []).flatMap((f) => [f.q, f.a])].join(' ');
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
  if (/\bactually\b/i.test(blob)) problems.push('contains the word "actually"');
  if (/—/.test(blob)) problems.push('contains an em dash');
  for (const item of prose.faq ?? []) {
    const question = String(item.q ?? '').trim();
    const first = String(item.a ?? '').trim().split(/(?<=[.!?])\s+/)[0] ?? '';
    if (/\b(how long|how many years)\b/i.test(question) && !/(\d|no fixed timeline)/i.test(first)) {
      problems.push(`timeline FAQ does not give a range in its first sentence: ${question}`);
    }
    if (/^(can|could|do|does|is|are|will|should)\b/i.test(question)
        && !/^(yes|no|usually|rarely|sometimes|it can|they can|some)\b/i.test(first)) {
      problems.push(`yes-or-no FAQ is indirect in its first sentence: ${question}`);
    }
  }
  for (const key of ['summary', 'day_to_day', 'work_environment', 'getting_in', 'ladder', 'suits', 'misconceptions', 'who_qualifies', 'what_the_numbers_miss', 'tools']) {
    if (!prose[key] || prose[key].length < 60) problems.push(`${key} missing or too short`);
  }
  if (!Array.isArray(prose.faq) || prose.faq.length < 3) problems.push('fewer than 3 FAQ entries');
  if (!Array.isArray(prose.steps) || prose.steps.length < 3) problems.push('fewer than 3 steps');
  for (const st of prose.steps ?? []) {
    if (!st.do || !st.how || st.how.length < 40) problems.push('a step is missing its detail');
  }
  for (const [key, min] of [['industries', 2], ['pros', 2], ['cons', 2]]) {
    if (!Array.isArray(prose[key]) || prose[key].length < min) problems.push(`${key}: fewer than ${min}`);
  }
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

let wrote = 0, skipped = 0, failed = 0, inTok = 0, outTok = 0, thinkTok = 0;
for (const occ of targets) {
  const p = packet(occ, into);
  if (!p) { console.log(`  skip ${occ}: no route data`); skipped++; continue; }
  if (process.env.DRY) { console.log(JSON.stringify(p, null, 1)); break; }
  const dest = path.join(OUT, `${occ}.json`);
  if (fs.existsSync(dest) && !process.env.FORCE) { skipped++; continue; }
  try {
    let { parsed, usage } = await generate(p, key);
    inTok += usage.input_tokens ?? 0; outTok += usage.output_tokens ?? 0;
    thinkTok += usage.output_tokens_details?.thinking_tokens ?? 0;
    parsed = polish(parsed);
    let problems = audit(parsed, p);
    if (problems.length) {
      // One repair pass: hand the failures back rather than throwing away a
      // guide that is otherwise good. A second failure is a real reject.
      console.log(`  fix  ${occ}: ${problems.join('; ')}`);
      const fix = await generate(p, key, 1, problems);
      inTok += fix.usage.input_tokens ?? 0; outTok += fix.usage.output_tokens ?? 0;
      thinkTok += fix.usage.output_tokens_details?.thinking_tokens ?? 0;
      parsed = polish(fix.parsed);
      problems = audit(parsed, p);
    }
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
console.log(`tokens in ${inTok.toLocaleString()}, out ${outTok.toLocaleString()}`
  + (thinkTok ? ` (of which ${thinkTok.toLocaleString()} thinking)` : '')
  + ` (~$${cost.toFixed(2)} at Sonnet list)`);
if (thinkTok > outTok * 0.4) {
  console.log('note: thinking dominates the bill. Re-run with GUIDE_THINKING=off to compare.');
}
