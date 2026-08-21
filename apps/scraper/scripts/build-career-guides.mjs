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

const SYSTEM = `You write for PivotHop, a career-navigation instrument that measures career moves from live job postings.

WHO IS SPEAKING:
Someone who has done this work for years, still finds it interesting, and is telling a friend who asked what it is like. Not a journalist reporting on the trade from outside, and not a recruiter selling it. Someone inside it, in a good mood, being straight.

That means the reader should finish with a clear picture AND, where the job earns it, some appetite for doing it. Say what is good about the work with the same specificity you use for what is hard. A guide that only lists friction is as dishonest as one that only sells.

WARMTH COMES FROM DETAIL, NOT FROM ADJECTIVES. Never reach for "rewarding", "exciting", "passionate", "dream job", "thrive", "fulfilling". Instead name the thing that is satisfying: the moment a model finally clashes clean, the first time a contractor builds what you drew, the patient who walks out. That is what enthusiasm sounds like in writing.

DO NOT WRITE THE JOB AS SOMETHING TO BE ENDURED. Banned framings: people who "tolerate" it, who "do not mind" it, who "put up with" it, and any variant of "nobody enjoys this part". The hard parts are information, not a verdict against the work. Someone chose this career and stayed; write as though you understand why.

HOUSE VOICE:
- Editorial and specific. Numbers over adjectives. Warm is right; salesy is not.
- Numbers over adjectives. No motivational vocabulary, no exclamation points, no rhetorical questions.
- NEVER use em dashes or en dashes. Use periods, commas, colons or parentheses.
- No "in today's fast-paced world", no "landscape", no "delve", no "testament", no "vibrant".
- Do not open consecutive sentences with the same word. Vary sentence length.
- If a sentence could appear on any other career site, delete it.

THE RULE THAT MATTERS MOST:
You are given a FACTS packet measured from live job postings. You may ONLY state figures that appear in that packet. Never invent, round differently, estimate, or import a number from your training data. If you do not have a figure, write around it or say the data does not show it. The page renders the numbers itself, so you rarely need to repeat them; reference them sparingly and only where the sentence needs one to make sense.

NEVER refer to the mechanics of your own input. The words "packet", "dataset provided", "the data given", "our data shows" are forbidden. Refer to the evidence the way a reader understands it: "postings", "live postings", "the board", "measured routes".

WRITE LIKE A PERSON WHO DOES THIS WORK. The reader should feel they asked someone in the trade over coffee. That means:
- Specific over general. One detail too particular to have been invented beats three general truths.
- Vary sentence length. Some short. Some that take their time and carry a qualification inside them.
- An aside in parentheses now and then (used sparingly) reads human.
- Mixed feelings are allowed. So is saying a part of the job is tedious.

BANNED, because they are the tells of machine writing:
- Em dashes and en dashes. Exclamation points. Rhetorical questions as openers.
- "crucial", "delve", "landscape" (figurative), "pivotal", "showcase", "testament", "underscore", "vibrant", "foster", "tapestry", "realm", "navigate" (figurative), "robust", "seamless", "leverage" (as a verb).
- "At its core", "the real question is", "what really matters", "in today's world", "let's", "here's the thing", "honestly,".
- "actually" and "really" as intensifiers. They are filler. Say the thing without them. (Once in a whole guide, at most, and only where the sentence collapses without it.)
- The rule of three. Do not group ideas in threes by default; use two or four.
- "It is not X. It is Y." Mirrored antithesis is allowed once in the whole guide, at most.
- Sections that end on a quotable punchline. One such closer in the entire guide, maximum. Most sections should end on information.
- Starting consecutive sentences with the same word.
- Announcing what you are about to say before saying it.
- Formulaic aphorisms of the shape "X is the Y of Z".

You are writing what a number cannot say. The page prints the figures itself, so do not recite them.`;

function userPrompt(p) {
  return `Write the prose for the ${p.title} career guide.

MEASUREMENTS (the only figures you may use, and the page prints most of them itself):
${JSON.stringify(p, null, 1)}

Return ONLY valid JSON, no markdown fence, with exactly these keys:

{
  "summary": "2 to 3 sentences. What this job is, and what separates it from the role next to it that people confuse it with. Start with the work, not with a definition of the field.",

  "day_to_day": "4 to 6 sentences. What the work consists of across an ordinary week. Name the artefacts: what gets opened, drafted, reviewed, sent, sat through. Say roughly how the week splits between solo work and other people. Include one detail specific enough that only someone who knows the job would write it, and one moment in the week that people in this job look forward to. End on the work itself, not on a complaint.",

  "work_environment": "3 to 5 sentences. Where the work happens and under what conditions: office, site, home, lab, ward, shop floor. Hours and what makes a bad week (deadlines, on-call, seasonal peaks, travel). If the remote share in the measurements is low or high, explain what about the work causes that. Be concrete about the physical and social setting.",

  "getting_in": "4 to 6 sentences. The realistic route in, with durations. Use the education and experience figures given, and if a license object is present use its path and time exactly as stated. Say which step takes longest and which is the common place people stall. If a degree is waived in a meaningful share of postings, say what employers accept instead.",

  "ladder": "3 to 5 sentences. What changes as you move up, in terms of what you carry responsibility for rather than titles. What the first real step up requires. Where the ladder tends to fork (management against staying hands-on) and roughly when.",

  "suits": "3 to 5 sentences. Open with who comes alive in this job and what specifically gives them a good day. Then, plainly and without relish, who tends to leave and what they wanted instead. A real opinion a practitioner would give a friend, warm about the people who belong here.",

  "misconceptions": "2 to 4 sentences. What outsiders get wrong about this job. Name the belief, then correct it. Avoid the obvious ones everyone already knows.",

  "who_qualifies": "3 to 4 sentences. Who already has most of what this role asks for, grounded in routes_in. Name the origin occupations and say what specifically carries over and what does not. If routes_in is empty, say plainly that no measured route in exists yet.",

  "what_the_numbers_miss": "2 to 3 sentences. What this measurement cannot see about THIS job specifically. Flat and unceremonious, not a disclaimer with a bow on it.",

  "steps": [ { "do": "the action, as an imperative of 6 words or fewer", "how": "2 to 3 sentences: what it concretely involves, roughly how long it takes, and how you know you are done with it. Name real things (a specific exam, portfolio piece, hour count, kind of employer) rather than generic advice." } ],

  "tools": "2 to 4 sentences. The software, instruments or equipment this job runs on day to day, drawn from the skills in the measurements. Say which ones are the real gatekeepers in hiring and which are nice to have. Mention where the tooling is heading if the postings suggest it.",

  "industries": [ { "name": "the sector or setting that employs this role", "note": "one line on what the work is like there specifically, and how it differs from the others" } ],

  "specializations": [ { "name": "an emerging or high-value specialization within this role", "why": "one or two sentences on why it is worth going deep here and who is hiring for it" } ],

  "pros": [ "something genuinely good about this job, one sentence, specific to this role and not to jobs in general. At least one of these should be about the work itself being satisfying, not about pay or security" ],

  "cons": [ "a genuine drawback, one sentence, specific and stated without bitterness. Something a person in the job would warn a friend about, not something a critic would say about the profession" ],

  "faq": [ { "q": "the question as a person types it into Google, in their words", "a": "2 to 3 sentences that answer it in the first sentence, then qualify" } ]
}

Write 5 steps, 3 or 4 industries, 3 specializations, 4 pros, 4 cons.

THE STEPS ARE THE HIGHEST INTENT PART OF THE PAGE. Someone searching how to become this is looking for a sequence they can start on Monday. Order them as a real path, front to back. Attach a duration to every step where one exists in the measurements or in the license path. Do not pad to five if the path is genuinely shorter; four honest steps beat five with filler. Never write a step that amounts to "build a portfolio" or "keep learning" without saying what goes in it.

THE FAQ IS A SEARCH SURFACE, so write the questions the way people search, not the way a brochure asks them. Use the reader's phrasing ("how long does it take to become a ${p.title.toLowerCase()}", not "What is the typical timeline to qualification"). Cover 6 of these query shapes, choosing the ones this occupation genuinely raises:
- how long it takes to qualify or become one
- whether you can do it without a degree, or with a degree in something else
- whether it is a good career, or worth it, right now
- what the job is like day to day, or how hard it is
- whether it can be done remotely
- what it pays at the start against later
- how it compares to the single adjacent role people confuse it with (name that role)
- whether the work is at risk from automation or AI, if the evidence supports an answer
Answer the question in the first sentence. A reader who reads only that sentence should have the answer.

Write 5 FAQ entries. At least one must be about the gate (license, degree, or years of experience) if the measurements show one.`;
}

async function generate(p, key, attempt = 1, fixes = null) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: Number(process.env.GUIDE_MAX_TOKENS || 20000),
      ...(process.env.GUIDE_THINKING === 'off' ? { thinking: { type: 'disabled' } } : {}),
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
  const text = (j.content ?? []).filter((c) => c.type === 'text').map((c) => c.text ?? '').join('').trim();
  if (process.env.DEBUG_RAW) {
    fs.writeFileSync('/tmp/guide-raw.txt', text);
    console.log(`  [debug] ${text.length} chars, stop=${j.stop_reason}, out=${j.usage?.output_tokens}`);
  }
  if (j.stop_reason === 'max_tokens') throw new Error('response hit the token ceiling');
  const clean = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  return { parsed: parseLoose(clean), usage: j.usage ?? {} };
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
const FILLER = /\s*\b(actually|really)\b/gi;
function polish(v) {
  if (typeof v === 'string') {
    return v.replace(FILLER, '').replace(/ {2,}/g, ' ').replace(/ ([,.;:])/g, '$1').trim();
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
  const BANNED = /\b(crucial|delve|pivotal|showcase|testament|underscore|vibrant|tapestry|realm|seamless|robust)\b|at its core|the real question|in today'?s|\blet(?:'|\u2019)s\b|here'?s the thing/i;
  const bad = blob.match(BANNED);
  if (bad) problems.push(`banned phrase "${bad[0]}"`);
  const SOUR = /\b(tolerat\w+|do(?:n'?t| not) mind|put up with|nobody enjoys|no one enjoys|grind through|soul.?crushing)\b/i;
  const sour = blob.match(SOUR);
  if (sour) problems.push(`writes the job as endured ("${sour[0]}")`);
  const HYPE = /\b(rewarding|exciting|passionate|passion for|dream job|thrive|fulfilling|game.?chang\w+)\b/i;
  const hype = blob.match(HYPE);
  if (hype) problems.push(`sells rather than describes ("${hype[0]}")`);
  const crutch = (blob.match(/\bactually\b/gi) ?? []).length + (blob.match(/\breally\b/gi) ?? []).length;
  if (crutch > 1) problems.push(`"actually"/"really" used ${crutch} times, ration is 1`);
  for (const key of ['summary', 'day_to_day', 'work_environment', 'getting_in', 'ladder', 'suits', 'misconceptions', 'who_qualifies', 'what_the_numbers_miss', 'tools']) {
    if (!prose[key] || prose[key].length < 60) problems.push(`${key} missing or too short`);
  }
  if (!Array.isArray(prose.faq) || prose.faq.length < 4) problems.push('fewer than 4 FAQ entries');
  if (!Array.isArray(prose.steps) || prose.steps.length < 4) problems.push('fewer than 4 steps');
  for (const st of prose.steps ?? []) {
    if (!st.do || !st.how || st.how.length < 40) problems.push('a step is missing its detail');
  }
  for (const [key, min] of [['industries', 3], ['specializations', 3], ['pros', 3], ['cons', 3]]) {
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
