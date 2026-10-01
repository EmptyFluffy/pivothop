// Classify unmapped titles into the occupation taxonomy with a model, as PROPOSALS.
//
//   node scripts/classify-titles.mjs <titles.json> [--budget 5] [--batch 150] [--concurrency 4]
//
// <titles.json> is [{ k: cleanedTitle, n: postings, ex: one raw title }], most
// frequent first. Results merge into packages/data/taxonomy/title-classified.json:
// map[cleanedTitle] = slug, or null when the model said none or was unsure (kept,
// so the title is never asked about twice). mapTitle() reads that file as its very
// last tier, an exact lookup: no model ever runs inside the mapper, and every
// entry is a line a person can read, audit and delete.
//
// The bar is the rules' bar. A wrong confident answer is worse than a miss (the
// dental-hygienist lesson), so the prompt makes "none" the default, keeps support
// roles off professional boards, and only `high` answers are stored as slugs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const TAX = path.join(ROOT, 'packages', 'data', 'taxonomy');
const OUT = path.join(TAX, 'title-classified.json');
const MODEL = process.env.CLASSIFY_MODEL || 'claude-haiku-4-5';
const PRICE = { in: 1, out: 5, cacheWrite: 1.25, cacheRead: 0.1 };   // USD per million tokens

const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? Number(process.argv[i + 1]) : dflt; };
const BUDGET = arg('budget', 5), BATCH = arg('batch', 150), CONC = arg('concurrency', 4);
if (!process.env.ANTHROPIC_API_KEY) { console.error('classify: ANTHROPIC_API_KEY is not set'); process.exit(1); }

const occ = JSON.parse(fs.readFileSync(path.join(TAX, 'occupations.json'), 'utf8')).occupations;
const SLUGS = new Set(occ.map((o) => o.slug));
const catalogue = occ.map((o) => `${o.slug} | ${o.title} | SOC ${String(o.soc ?? '').slice(0, 7)} | ${(o.synonyms ?? []).slice(0, 4).join('; ')}`).join('\n');

const SYSTEM = `You classify job posting titles into a fixed list of occupations for a job board.

OCCUPATIONS (slug | title | SOC | example titles):
${catalogue}

RULES
1. Pick the occupation whose day-to-day work the title describes. Seniority (senior, lead, principal, II, intern, trainee) does not change the occupation.
2. "none" is the default. Answer a slug only when a recruiter would agree the posting belongs on that occupation's board without hesitation.
3. Level matters. Assistants, aides, clerks, coordinators and technicians never go to a professional or manager occupation: use a support occupation from the list if one fits (administrative-assistant, medical-assistant, nursing-assistant, teaching-assistant, pharmacy-technician, laboratory-technician...), otherwise none. Respect the SOC: a 43- clerical role is not a 13- specialist or an 11- manager.
4. Managers, directors and heads map only when the list has that management occupation (engineering-manager, marketing-manager, product-manager, project-manager, program-manager, operations-manager, hr-manager, store-manager, warehouse-manager, general-manager, construction-manager, facilities-manager, hotel-manager, production-supervisor...). C-level, VP, and a director or head of a function with no management occupation in the list: none.
5. Generic or ambiguous titles (engineer, specialist, associate, consultant, analyst, manager, designer with no domain; a title that fits two occupations equally): none.
6. Talent pools, expressions of interest, multi-role or event ads, and titles that are not a job: none.
7. Gig work rating or training AI models ("AI trainer", "evaluate model responses"): data-annotator.
8. Titles can be in any language; classify the job, not the language.

OUTPUT: one line per input, in input order, exactly: <number><TAB><slug or none><TAB><high or low>
Use high only when you are sure. No other text.`;

const input = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const store = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const map = store.map ?? {};
const todo = input.filter((x) => x.k && x.k.length >= 3 && !(x.k in map));
console.log(`classify: ${input.length} titles, ${todo.length} not yet classified; model ${MODEL}, budget $${BUDGET}, batch ${BATCH}`);

let spent = 0, done = 0, slugs = 0, stopped = false;
const save = () => {
  const out = {
    $comment: 'Model-proposed occupations for titles every rule tier misses (scripts/classify-titles.mjs). mapTitle() reads it as its last tier, an exact lookup on the cleaned title. null = the model said none or was unsure; kept so a title is asked once. Audit before trusting; delete any wrong line.',
    model: MODEL,
    updated: new Date().toISOString().slice(0, 10),
    map: Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b))),
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 0).replace(/,"/g, ',\n"') + '\n');
};

async function ask(batch) {
  const body = {
    model: MODEL, max_tokens: 4096, temperature: 0,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: batch.map((x, i) => `${i + 1}. ${String(x.ex).slice(0, 160)}`).join('\n') }],
  };
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null);
    if (res?.ok) return res.json();
    const txt = res ? await res.text().catch(() => '') : 'network';
    if (res && /credit balance/i.test(txt)) throw new Error('anthropic credits exhausted');
    if (res && res.status < 500 && res.status !== 429) throw new Error(`anthropic ${res.status}: ${txt.slice(0, 200)}`);
    await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
  }
  throw new Error('anthropic: gave up after retries');
}

const batches = [];
for (let i = 0; i < todo.length; i += BATCH) batches.push(todo.slice(i, i + BATCH));
let next = 0;
async function worker() {
  while (!stopped && next < batches.length) {
    const batch = batches[next++];
    let data;
    try { data = await ask(batch); }
    catch (err) { console.error(`classify: ${err.message}`); stopped = true; return; }
    const u = data.usage ?? {};
    spent += ((u.input_tokens ?? 0) * PRICE.in + (u.output_tokens ?? 0) * PRICE.out
      + (u.cache_creation_input_tokens ?? 0) * PRICE.cacheWrite + (u.cache_read_input_tokens ?? 0) * PRICE.cacheRead) / 1e6;
    const text = (data.content ?? []).map((c) => c.text ?? '').join('');
    const got = new Map();
    for (const line of text.split('\n')) {
      const m = /^\s*(\d+)\t([a-z0-9-]+)\t(high|low)\s*$/.exec(line);
      if (m) got.set(Number(m[1]) - 1, { slug: m[2], conf: m[3] });
    }
    // a batch whose answer did not line up is skipped, not guessed: asked again next run
    if (got.size < batch.length * 0.9) { console.error(`classify: batch answered ${got.size}/${batch.length} lines, skipped`); continue; }
    batch.forEach((x, i) => {
      const g = got.get(i);
      if (!g) return;
      const ok = g.conf === 'high' && g.slug !== 'none' && SLUGS.has(g.slug);
      map[x.k] = ok ? g.slug : null;
      if (ok) slugs++;
    });
    done += batch.length;
    if (done % (BATCH * 10) < BATCH) { save(); console.log(`classify: ${done}/${todo.length} titles, ${slugs} placed, $${spent.toFixed(2)}`); }
    if (spent >= BUDGET) { console.log(`classify: budget $${BUDGET} reached`); stopped = true; }
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
save();
console.log(`classify: done ${done}/${todo.length}, ${slugs} placed, $${spent.toFixed(2)} spent -> ${path.relative(ROOT, OUT)}`);
