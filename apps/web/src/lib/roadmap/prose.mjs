import { readFileSync } from 'node:fs';
/* The prose layer of the route report, everything the mechanical numbers can't
   write on their own: the verdict, the sequenced 90-day plan, the evidence
   checklist, the timeline copy. Two producers, one shape:

     buildProse(d)              deterministic, templated from the numbers. Works
                                with no API key; it is the graceful fallback and
                                the exemplar the AI imitates.
     buildProseAI(d, apiKey)    one Anthropic call for the bespoke, per-person
                                version; falls back to buildProse on any failure.

   Voice mirrors the approved draft: deadpan, numbers over adjectives, no
   exclamation points, <b> only on figures. Fields are inserted raw into the
   template, so light HTML (<b>) is allowed; punctuation is plain unicode.      */

const b = (s) => `<b>${s}</b>`;
const money = (n) => '$' + Math.round(n / 1000) + 'k';
const oneOf = (arr, i) => arr[i % arr.length];

/* ── helpers over the mechanical data ─────────────────────────────────── */
function analyze(d) {
  const wf = d.waterfall || [];
  const have = wf.filter((w) => w.earned > 0);
  const gaps = wf.filter((w) => w.earned === 0).sort((a, z) => z.pts - a.pts);
  const partials = wf.filter((w) => w.earned > 0 && w.earned < w.pts - 0.05).sort((a, z) => z.pts - a.pts);
  const earned = Math.round(have.reduce((s, w) => s + w.earned, 0) * 10) / 10;
  const top3 = gaps.slice(0, 3);
  const top3pts = Math.round(top3.reduce((s, w) => s + w.pts, 0) * 10) / 10;
  const after3 = Math.min(99, Math.round(earned + top3pts));
  return { have, gaps, partials, earned, top3, top3pts, after3 };
}
// origin band vs dest band, as a plain verdict fragment
function payDelta(d) {
  const [olo, ohi] = d.origin.salary_band || [0, 0];
  const [dlo, dhi] = d.dest.salary_band || [0, 0];
  const om = (olo + ohi) / 2, dm = (dlo + dhi) / 2;
  if (!om || !dm) return { word: 'holds', line: 'The posted bands are close.' };
  const r = dm / om;
  if (r >= 1.08) return { word: 'rises', line: 'The destination posts higher.' };
  if (r <= 0.92) return { word: 'dips', line: 'Expect a trim in posted pay for the move.' };
  return { word: 'holds', line: 'The bands sit on top of each other.' };
}

/* ── the deterministic fallback ───────────────────────────────────────── */
/* Curated courses, keyed by skill NAME.
 *
 * The waterfall rows carry { name, pts, earned } and no id, data.mjs drops it ,
 * so keying the map on w.id would have silently produced an empty resource list
 * on every report. Building a name -> id index from the lexicon instead, which
 * also means the JSON stays keyed on stable ids rather than display strings. */
const RES = (() => {
  try {
    const here = (rel) => new URL(rel, import.meta.url);
    const byId = JSON.parse(readFileSync(here('../../../../../packages/data/taxonomy/skill-resources.json'), 'utf8')).resources;
    const lex = JSON.parse(readFileSync(here('../../../../../packages/data/taxonomy/skills.json'), 'utf8')).skills;
    const out = {};
    for (const sk of lex) if (byId[sk.id]) out[sk.name.toLowerCase()] = byId[sk.id];
    return out;
  } catch { return {}; }
})();

export function buildProse(d) {
  const A = analyze(d);
  const dest = d.dest.title;
  const destL = dest.toLowerCase();
  const origin = d.origin.title;
  const g = A.top3.map((w) => w.name);
  const pay = payDelta(d);
  const rank = d.dest.rank;
  const routeCount = d.routeCount;
  const rankPhrase = rank === 1 ? 'the nearest of the routes your skills already reach'
    : rank && routeCount ? `route number ${rank} of the ${routeCount} your skills reach`
    : 'one of the routes your skills already reach';
  const gapPhrase = A.top3.length >= 3 ? 'three named skills rather than a degree'
    : A.top3.length ? `${g.join(' and ')} rather than a degree` : 'narrow';
  const licensePhrase = d.dest.license
    ? `A credential does gate this one, so plan for the license as well as the skills.`
    : `No license stands at the door, which is not a given for a move out of ${origin.toLowerCase()}.`;
  const flowPhrase = (d.dest.mobility != null && d.dest.mobility >= 50 && /observed/.test(d.dest.mobilitySource || ''))
    ? ' In the worker-flow data this is a move people actually make.' : '';

  const verdict = `This is ${rankPhrase}. You already hold ${b(`${A.earned} of the 100 points`)} that ${destL} postings ask for, and the gap is ${gapPhrase}. ${licensePhrase}${flowPhrase} On pay, the move ${pay.word}.`;

  const decodedNote = A.partials.length
    ? `Partial rows (${A.partials.slice(0, 4).map((w) => w.name).join(', ')}) mean the postings want a deeper or ${destL}-specific version of a skill you already carry, the fastest points on the board after the named gap.`
    : `Every point you hold is a skill the ${destL} postings name outright; the gap is a short, specific list, not a rebuild.`;

  // 90-day plan, the top three gaps, in value order, then applications
  const artifact = (w) => `a portfolio artifact that puts ${w.name} to work in the format ${destL} employers review`;
  const phases = [];
  if (A.top3[0]) phases.push({
    weeks: 'WK 01–04', title: `${A.top3[0].name}, done in public`, worth: `+${A.top3[0].pts.toFixed(1)} pts`,
    steps: [
      `Close the single most valuable gap first: ${A.top3[0].name} is worth ${b(`+${A.top3[0].pts.toFixed(1)} points`)}, more than any other missing skill. Produce ${artifact(A.top3[0])}.`,
      `Reframe two projects you have already done through ${A.top3[0].name}; the work exists, the lens is new.`,
      `Use the words the postings use. Half of getting read is being findable.`,
    ],
    proof: `Two artifacts that demonstrate ${A.top3[0].name}, in the exact form an employer would receive.`,
  });
  const p2 = A.top3.slice(1);
  if (p2.length) phases.push({
    weeks: 'WK 05–08', title: `${p2.map((w) => w.name).join(' + ')}, on paper`, worth: `+${p2.reduce((s, w) => s + w.pts, 0).toFixed(1)} pts`,
    steps: [
      `Build the deliverable that proves ${p2[0].name} (${b(`+${p2[0].pts.toFixed(1)}`)})${p2[1] ? ` and, alongside it, ${p2[1].name} (${b(`+${p2[1].pts.toFixed(1)}`)})` : ''}.`,
      A.have[0] ? `Lean on ${A.have[0].name}, which you already hold, as the bridge into it, same muscle, different paperwork.` : `Keep each piece small and finished; a shipped artifact beats a polished intention.`,
      `Make things, do not describe things. The work speaks for you in a way a bullet point cannot.`,
    ],
    proof: `One finished deliverable per skill, exported as the document that reads as competence.`,
  });
  phases.push({
    weeks: 'WK 09–12', title: 'Applications, positioned as proof', worth: `→ ${A.after3}%`,
    steps: [
      `Re-narrate three ${origin.toLowerCase()} projects as ${destL} stories: same work, new camera.`,
      d.board.open ? `Apply against the live board, ${b(`${d.board.open} ${destL} role${d.board.open > 1 ? 's are' : ' is'} open today`)}${d.board.companies[0] ? `, several at ${d.board.companies[0][0]}` : ''}. Lead with the artifacts.` : `Apply where the postings are freshest, and lead with the artifacts, not the title.`,
      `Name the number in every conversation: your skills cover ${b(`${A.after3}%`)} of what the postings ask once the three gaps close, and the evidence is attached.`,
    ],
    proof: `Three applications sent with the re-cut portfolio, each cover note citing the readiness number and an artifact.`,
  });

  const firstMove = A.top3[0]
    ? `This week, produce one small artifact that puts ${A.top3[0].name} to work, the highest-value gap on the board. That single piece seeds Phase 1 and becomes the first page of the new portfolio.`
    : `This week, re-narrate one project you are proud of in the language of ${destL} postings. It is the cheapest way to start reading as ${destL}, not ${origin.toLowerCase()}.`;

  const longArc = `The ${d.dest.time} figure is the full arc to hired-and-settled, estimated from how long this gap typically closes alongside a day job. The 90-day plan is its first quarter, the part that makes you interview-able. First conversations tend to open a few months in; matching your current seniority takes the rest.`;

  // evidence, the gaps as artifacts, plus positioning
  // When the skill is curated, the evidence item IS the hand-written artifact
  // ("a 15-second animated piece for a real brand, posted publicly") rather than
  // the generic "an artifact that proves X" the founder rightly rejected. The
  // generic phrasing survives only for uncurated skills, where inventing a
  // specific deliverable we know nothing about would be worse.
  const evItems = A.top3.map((w) => ({
    item: (RES[(w.name || '').toLowerCase()] || [])[0]?.artifact
      ? RES[w.name.toLowerCase()][0].artifact.charAt(0).toUpperCase() + RES[w.name.toLowerCase()][0].artifact.slice(1)
      : `An artifact that proves ${w.name}`,
    why: `Worth ${w.pts.toFixed(1)} points, and not something you can claim, you have to show it. This is that, in the form an employer actually opens.`,
    covers: `+${w.pts.toFixed(1)} pts`,
  }));
  if (A.partials[0]) evItems.push({
    item: `A piece that deepens ${A.partials[0].name}`,
    why: `You already have this, you just need to show the ${destL} version of it. That turns a half-row into a full one.`,
    covers: `+${(A.partials[0].pts - A.partials[0].earned).toFixed(1)} pts`,
  });
  evItems.push({
    item: `${origin} projects re-narrated as ${destL}`,
    why: `The same work, told for a ${destL} reader. It costs you an afternoon and it is what makes your experience legible to them.`,
    covers: 'positioning',
  });
  const evidence = {
    intro: `${dest} hiring runs on artifacts, not certificates. Each item below is checkable, fits in a portfolio, and maps to points in the gap. The right-hand column is what the artifact evidences.`,
    items: evItems.slice(0, 6),
    checkpoints: [
      `By week 4 you can produce a defensible ${A.top3[0] ? A.top3[0].name.toLowerCase() : 'first'} artifact in under a day, the speed itself is the signal.`,
      `By week 8 the portfolio holds pieces a ${origin.toLowerCase()} portfolio does not, aimed squarely at ${destL}.`,
      `By week 12 you apply with a ${A.after3}% readiness claim you can itemize${d.board.open ? `, on a board with ${d.board.open} open seat${d.board.open > 1 ? 's' : ''}` : ''}.`,
    ],
  };

  // timeline, the plan's three phases plus the hiring window from the time band
  const [lo, hi] = parseTime(d.dest.time);
  const timeline = {
    intro: `Ninety days makes you interview-able; the hiring window opens around month ${lo}. Every milestone below is a deliverable you can check the week it lands, not an intention.`,
    weekly: `Pacing assumes six to eight focused hours a week alongside your current job, the cadence the ${lo}–${hi} month figure is measured from, not a sabbatical. Miss a week and the window shifts a week; it does not close.`,
    phases: [
      { title: 'The 90-day plan', span: 'Weeks 1–12', stones: [
        { when: 'Week 4', label: `${A.top3[0] ? A.top3[0].name : 'First artifacts'} proven`, detail: phases[0].proof },
        A.top3.length > 1 ? { when: 'Week 8', label: `${A.top3.slice(1).map((w) => w.name).join(' + ')} documented`, detail: 'The deliverables no origin-field portfolio carries.' } : { when: 'Week 8', label: 'Depth added', detail: 'The partial skills deepened into full points.' },
        { when: 'Week 12', label: 'First applications out', detail: `Three roles, portfolio re-cut, each cover note citing the ${A.after3}% readiness claim.` },
      ] },
      { title: 'Compounding', span: `Months 4–${Math.max(4, lo - 1)}`, stones: [
        { when: 'Month 4–5', label: 'First conversations begin', detail: 'The readiness number is what gets you into the room this early.' },
        { when: `Month ${Math.max(5, lo - 3)}`, label: 'Portfolio v2 · review point', detail: 'Re-run the graph. If two checkpoints have slipped, adjust the plan, not the goal.' },
      ] },
      { title: 'Hiring window', span: `Months ${lo}–${hi}`, hot: true, stones: [
        { when: `Month ${lo}`, label: 'Hiring window opens', detail: `Where this pivot typically lands, the point the ${lo}–${hi} month figure is measured to.`, hot: true },
        { when: `Month ${Math.round((lo + hi) / 2)}–${hi}`, label: 'Seniority-match offers', detail: 'Matching your current level, rather than restarting junior, takes the back half of the arc.', hot: true },
      ] },
    ],
  };

  const altsLicensed = (d.alternates || []).filter((a) => /licens|pe /i.test(a.gate || '')).length;
  const alternatesNote = (d.alternates && d.alternates.length)
    ? `Ranked by the same 100-point read.${altsLicensed >= (d.alternates.length) ? ` All ${d.alternates.length} run through licensure, which is why ${destL}, gated nowhere, is the route this report prices.` : d.dest.license ? '' : ` ${dest} clears without one, which is part of why it prices first.`}`
    : `No other route your skills reach clears the confidence bar yet; ${destL} is the one the numbers support.`;

  const salaryVerdict = `${origin} posts ${b(`${money(d.origin.salary_band[0])}–${money(d.origin.salary_band[1])}`)}; ${destL} posts ${b(`${money(d.dest.salary_band[0])}–${money(d.dest.salary_band[1])}`)}. ${pay.line} Read from ${d.dest.provenance.salaried.toLocaleString()} postings that state pay.`;

  // The fallback is deliberately vaguer than the AI path here: without a model
  // we cannot describe an occupation we hold no prose about. It says less rather
  // than inventing, which is the same rule the rest of the product runs on.
  const roleContext = {
    whatItIs: `${dest} work is defined by what the postings ask for, and for this role that is led by ${A.gaps.slice(0, 2).map((w) => w.name).join(' and ') || 'the skills listed below'}.`,
    carriesOver: A.have.length ? `${A.have.slice(0, 3).map((w) => w.name).join(', ')} carry over directly, they are named in ${dest} postings, not merely adjacent to them.` : '',
    doesNot: A.gaps.length ? `${A.gaps[0].name} is the part that does not come with you; it is ${A.gaps[0].pts.toFixed(1)} of the 100 points and has to be built.` : '',
  };
  const mob = d.dest.mobility;
  const difficulty = {
    verdict: `${A.earned.toFixed(1)} of 100 points held, ${A.gaps.length} named gap${A.gaps.length === 1 ? '' : 's'}, and ${d.dest.license ? 'a credential at the door' : 'no licence at the door'}.`,
    // Capped at three names. The uncapped version printed all EIGHT gap skills for
    // copywriter -> motion designer and pushed the panel under the page footer.
    howMany: A.gaps.length
      ? `${A.gaps.length} skill${A.gaps.length === 1 ? '' : 's'} to learn: ${A.gaps.slice(0, 3).map((w) => w.name).join(', ')}${A.gaps.length > 3 ? `, and ${A.gaps.length - 3} more` : ''}.`
      : '',
    mobilityRead: mob == null ? '' : mob >= 25
      ? `Observed worker flow is ${mob}, a well-travelled path, employers have seen this move before.`
      : `Observed worker flow is ${mob}, which makes this an uncommon move. Expect to explain the jump rather than have it assumed.`,
  };
  // Without a model we will not invent course names. The fallback gives the
  // reader the search terms and the shape of what to look for, which is honest
  // and still useful.
  // Named courses come from packages/data/taxonomy/skill-resources.json, which is
  // hand-written and verified. "Search for a project-based X course" was the old
  // fallback and the founder was right that it says nothing the reader did not
  // already know. Skills with no curated entry are simply omitted rather than
  // padded with generic advice.
  const resources = {
    intro: 'One thing per gap, and build something with it. The certificate is not the point, the thing you make in the course is what an employer opens.',
    items: A.gaps.slice(0, 6).flatMap((w) => (RES[(w.name || '').toLowerCase()] || []).slice(0, 2).map((r) => ({
      skill: w.name,
      what: `${r.platform}, ${r.title}`,
      url: r.url || '',
      why: r.note || `Worth ${w.pts.toFixed(1)} of the 100 points.`,
      hours: r.cost || '',
    }))).slice(0, 6),
    note: 'Skip anything that ends in a certificate and nothing else. Hiring managers open the artifact, not the badge.',
  };
  const explainTheJump = A.have.length
    ? `Lead with what travels: ${A.have.slice(0, 3).map((w) => w.name).join(', ')} are named in ${destL} postings, not merely adjacent to them. Then name the number, ${Math.round(A.earned)}% of the requirements held on day one, and the artifact that proves it.`
    : '';
  // Without a model we do not describe what a job FEELS like; that would be
  // invention. The block simply does not render on the fallback path.
  const first90 = '';
  return { explainTheJump, first90, resources, roleContext, difficulty, verdict, decodedNote, plan: { intro: planIntro(A, destL), phases, firstMove, longArc }, evidence, timeline, alternatesNote, salaryVerdict };
}

function planIntro(A, destL) {
  if (!A.top3.length) return `The plan below turns a small, specific gap into hiring readiness for ${destL}, one checkable artifact at a time.`;
  return `The sequence below is ordered by what each missing skill is worth, not by what is easiest. ${A.top3[0].name} alone carries ${b(`${A.top3[0].pts.toFixed(1)} of the ${(100 - A.earned).toFixed(1)} missing points`)}, so it goes first. Every phase produces an artifact; nothing here is a course for its own sake.`;
}

export function parseTime(time) {
  const m = String(time || '').match(/(\d+)\s*[–\-,]\s*(\d+)/);
  if (m) return [Number(m[1]), Number(m[2])];
  const one = String(time || '').match(/(\d+)/);
  const n = one ? Number(one[1]) : 12;
  return [Math.max(3, Math.round(n * 0.7)), n];
}

/* ── the AI version ───────────────────────────────────────────────────── */
/* One strict parse, then one forgiving retry. The failure that motivated this
   was "Expected ',' or '}' at position 852", the SHAPE we sent contained
   pseudo-notation (x3, x5-6, a parenthetical aside) that is not valid JSON, so
   the model reproduced the malformation faithfully. The shape is fixed now; this
   is the net underneath it, because one bad character should not cost a reader
   the whole AI report. Repairs only unambiguous damage: trailing commas and
   stray comment lines. Returns null if it still will not parse, never guesses
   at content. */
function parseLoose(raw) {
  try { return JSON.parse(raw); } catch { /* fall through to repair */ }
  try {
    const fixed = raw
      .replace(/\/\/[^\n"]*$/gm, '')       // line comments outside strings
      .replace(/,\s*([}\]])/g, '$1');       // trailing commas
    return JSON.parse(fixed);
  } catch { return null; }
}

/* STEP 1 OF THE CHAIN, form a view before writing a word.
 *
 * The single-call version asked the model to produce eight sections at once from
 * raw numbers, and it read like transcription because that is what it was. This
 * call produces nothing the reader ever sees: it is a working note that the
 * writing steps then argue FROM. Asking "what do these numbers mean" and "what
 * would you tell a friend" separately from "now write the report" is the whole
 * difference between a document with a thesis and a document with statistics.
 *
 * It is also cheap insurance against the failure that has dogged this flow: a
 * small call with a small output truncates far less readily than one carrying a
 * whole document, and if it fails the report still generates without it.
 *
 * Returns a short object. Never rendered directly. */
async function interpret(d, facts, apiKey) {
  const sys = `You are reading one person's career-transition numbers and forming a view, before anyone writes anything for them. This is a working note, not copy, nobody will read it but the writer who comes next. Be blunt and specific. No hedging, no encouragement, no audience.

Answer four questions:
1. What is the SHAPE of this move? Is the gap one enormous skill or many small ones? That changes the advice completely and the numbers usually make it obvious.
2. What does the mobility figure actually mean here, is this a path people take, or one this person will have to justify?
3. What is the single most useful true thing you could tell them, including if it is discouraging? If the honest read is "this is a long way and the pay does not improve", say that.
4. What would make this report worth keeping rather than skimming?

Return ONLY JSON: {"shape":"...","mobilityRead":"...","mostUsefulTruth":"...","whatMakesItWorthKeeping":"..."}, two or three sentences each, plain words.`;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        // thinking DISABLED explicitly: the model was spending the max_tokens budget on
        // a thinking block before the text, "blocks=2[thinking,text] stop=max_tokens"
        //, which produced empty and truncated JSON at any budget. These calls want
        // structured output, not deliberation.
        model: 'claude-sonnet-5', thinking: { type: 'disabled' }, max_tokens: 1200, system: sys,
        messages: [{ role: 'user', content: `FACTS = ${JSON.stringify(facts)}\n\nReturn the JSON now.` }],
      }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const text = (j.content || []).map((c) => c.text || '').join('').trim();
    const a = text.indexOf('{'), b = text.lastIndexOf('}');
    if (a < 0 || b < 0) return null;
    return parseLoose(text.slice(a, b + 1));
  } catch { return null; }   // the report is fine without it; never block on this
}

/* One retry, because a malformed generation is usually not repeated and the
 * whole AI report is the thing at stake. Only retries the cases a second attempt
 * can plausibly fix, a bad parse or a 5xx, never a 401, which will fail
 * identically forever and should surface immediately. There is room for it:
 * maxDuration is 300s and one call runs in single-digit seconds. */
export async function buildProseAI(d, apiKey) {
  // Step 1: form a view. Cheap, small, and the report still generates if it fails.
  const facts0 = factsFor(d);
  const view = await interpret(d, facts0, apiKey);
  const first = await buildProseAIOnce(d, apiKey, view);
  const err = first?._aiError;
  const worthRetry = err && (err.startsWith('unparseable') || err.startsWith('no-json') || /^http 5/.test(err));
  if (!worthRetry) return first;
  console.error('[roadmap] retrying after:', err);
  const second = await buildProseAIOnce(d, apiKey, view);
  // If the retry also failed, keep the SECOND reason, it is the more recent
  // truth, and two different reasons in a row is itself worth seeing.
  return second?._ai ? second : { ...second, _aiError: `retried; ${second?._aiError || err}` };
}

/* One fact set, shared by every step of the chain. It was built inline inside the
   writing call, which meant the interpretation step could not see the same
   numbers the writer would, and two steps reasoning from different facts is how
   a chain contradicts itself. */
export function factsFor(d) {
  const A = analyze(d);
  return {
    origin: d.origin.title, dest: d.dest.title,
    readiness: A.earned, gapTotal: Math.round((100 - A.earned) * 10) / 10,
    topGaps: A.top3.map((w) => ({ skill: w.name, points: w.pts })),
    partialSkills: A.partials.slice(0, 5).map((w) => ({ skill: w.name, have: w.earned, of: w.pts })),
    heldSkills: A.have.slice(0, 8).map((w) => w.name),
    afterTop3: A.after3, time: d.dest.time, licensed: !!d.dest.license,
    salary: { origin: d.origin.salary_band, dest: d.dest.salary_band },
    demand: d.dest.demand, remote: d.dest.remote,
    board: { open: d.board.open, companies: d.board.companies },
    // Verified courses for the gap skills, so the model picks from real ones
    // rather than producing a plausible title nobody can find.
    curatedResources: A.gaps.slice(0, 6).flatMap((w) => (RES[(w.name || '').toLowerCase()] || []).map((r) => ({ skill: w.name, ...r }))),
    mobility: d.dest.mobility, mobilitySource: d.dest.mobilitySource,
    gapCount: A.gaps.length,
    onward: d.onward || [], bridge: d.bridge || null, destSeniority: d.destSeniority || null,
  };
}

async function buildProseAIOnce(d, apiKey, view) {
  const fallback = buildProse(d);
  if (!apiKey) return fallback;
  const A = analyze(d);
  const facts = factsFor(d);
  const sys = `You write one section of a career-transition report for PivotHop.

WHO IS READING THIS. Someone who wants out of their job and is not sure they are allowed to want it. Often anxious, often convinced they are behind. They did not buy a pep talk; they asked what the numbers say. Write to one person, not an audience.

PUNCTUATION. Never use an em dash anywhere in the output. Use a comma, a colon, or a new sentence.

HTML. The ONLY tag allowed is <b></b>, and only inside verdict, roleContext, difficulty, plan and salaryVerdict fields. Timeline, evidence and resources fields are PLAIN TEXT: any tag there prints literally on the page.

VOICE. Precise, plain, warm through candour rather than through adjectives. Numbers over adjectives. Second person. Short sentences and ordinary words, "you cannot just say you can do this" beats "unprovable by assertion", and it is the same sentence. Contractions are fine.

THE WARMTH IS IN THE HONESTY, NOT IN THE ENCOURAGEMENT. Telling someone a move is uncommon and they will have to explain themselves in every interview is kinder than telling them they have got this, because it treats them as an adult and tells them what is coming. Where the news is good, say it plainly and without fanfare, "you already hold more of this than you would guess" is a measured fact delivered kindly, and that is the register.

BANNED, because it reads as a company that wants something: exclamation points, "journey", "passion", "unlock", "empower", "dream role", "you've got this", and any sentence that could sit on a bootcamp landing page. Acknowledge the difficulty once, in one sentence, and then get on with the numbers, dwelling on the feeling is its own kind of condescension. Wrap key figures in <b></b>. Use plain unicode punctuation. Every claim must be grounded in the FACTS provided; invent no numbers. The reader is moving from ${d.origin.title} to ${d.dest.title}. Return ONLY valid JSON matching the SHAPE exactly, no prose around it.

HARD RULES, in order of importance:
1. NAME the artifact. Never write "an artifact that proves X", that is the failure mode this prompt exists to kill. Say the actual deliverable a ${d.dest.title} would recognise: a document type, a model, a calculation, a teardown, a named tool output. If you cannot name one for a skill, describe the smallest real piece of work that would demonstrate it.
2. Never state a count you have not verified against FACTS. Do not write "these three" for a two-item list, or "several at X" when X has two openings. Prefer the exact number or no number.
3. Say the hard thing. If mobility is low, the move is uncommon and the reader will have to explain themselves, write that plainly rather than burying it. If readiness is low, do not dress it up. An honest report that costs a reader an illusion is the product.
4. Assume the reader does NOT know what the destination job actually does day to day.

COUNTS (the SHAPE below shows ONE example element per array; produce these many):
- plan.phases: exactly 3, weeks 1-4, 5-8, 9-12. Phase 3 is about applications and its "worth" reads like "→ 68%".
- plan.phases[].steps: 3 each.
- evidence.items: 5 or 6. evidence.checkpoints: 3.
- timeline.phases: exactly 3, "The 90-day plan" (span "Weeks 1–12"), "Compounding" (span "Months 4–8"), and "Hiring window" (set "hot": true on the phase and on each of its stones).
- NEVER emit a placeholder letter or symbol. The hiring-window span and its stone labels must carry the REAL month numbers from FACTS.time, write "Months 12–24", "Month 12", "Month 18–24". A literal "L", "H", "N", "X" or "NN" anywhere in the output is a defect.
- Every readiness percentage you state must equal FACTS afterTop3. Do not compute your own; the same number appears on three pages and they must agree.
- Money is written as $80k / $140k, never as 139995 or 161,000.
- timeline.phases[].stones: 3 for the first phase, 2 for the other two.

RESOURCES, read this twice:
- Name the PLATFORM and the COURSE TITLE. Do NOT write URLs. You will get them wrong, and a dead link in a paid-for report destroys more trust than the course was worth.
- PREFER FACTS.curatedResources. Those are verified and carry real URLs; use them verbatim where one exists for a gap skill. Only go beyond that list if a gap has no entry.
- Only name things you are confident actually exist. A well-known platform and an approximate title the reader can search beats a precise-sounding invention.
- Prefer the specific over the famous: for a RAG gap, a vector-database course beats "Intro to Python" on a bigger brand.
- 4 to 6 items, at least one per named gap skill, ordered by the gap they close.
- Free and paid are both fine; say which where you are sure.
- The point of a course is the artifact you build in it. Say so.

OUTPUT: raw JSON only. No markdown fence, no commentary, no trailing commas, no comments, and no placeholder notation of any kind, every value must be real content.`;
  /* TWO shapes, two calls. One call carrying the whole document hit
     stop_reason=max_tokens at 9,063 characters and died mid-JSON, and the
     single shape it was copying had itself become malformed, with `resources`
     nested inside `difficulty` after an earlier edit. Both problems have the
     same fix: smaller, separately-declared shapes that are each valid on their
     own and each comfortably inside the budget. */
  const shapeA = `SHAPE = {
 "verdict": "2-4 sentences: where this route ranks, points already held, the nature of the gap (skills vs credential), whether people actually make the move, and the pay direction.",
 "roleContext": {
   "whatItIs": "2-3 sentences in plain language: what a ${d.dest.title} actually does day to day. No jargon. Assume the reader has only ever done ${d.origin.title}.",
   "carriesOver": "1-2 sentences: which parts of ${d.origin.title} work transfer, named from the skills in FACTS.",
   "doesNot": "1-2 sentences: what genuinely does not transfer, and what that will feel like."
 },
 "difficulty": {
   "verdict": "ONE sentence reading the numbers together: how hard this jump is, grounded in readiness, mobility and whether a licence gates it.",
   "howMany": "1 sentence: how many skills have to be learned. Name at most 3, then \'and N more\'.",
   "mobilityRead": "1 sentence on the observed-flow number: well-worn path or unusual one, and what that means for how you will be received."
 },
 "explainTheJump": "2-3 sentences, second person: the actual words for the interview question \'why are you moving?\'. Built from the held skills and the shape of the move. No apology, a reason, told forward.",
 "first90": "2-3 sentences: what the first ninety days IN the new job will feel like, including the part that will feel worse before it feels better. This is shift-shock inoculation, not a pep talk.",
 "decodedNote": "1 sentence about partial-credit skills.",
 "alternatesNote": "1 sentence about the fallback routes.",
 "salaryVerdict": "1-2 sentences comparing the two posted bands."
}`;
  const shapeB = `SHAPE = {
 "plan": {
   "intro": "1-2 sentences: the plan is sequenced by what each gap skill is worth.",
   "phases": [ {"weeks":"WK 01\u201304","title":"short","worth":"+X.X pts","steps":["step one","step two","step three"],"proof":"the artifact this phase yields"} ],
   "firstMove": "1-2 sentences: the single artifact to make THIS week.",
   "longArc": "2-3 sentences framing the full ${d.dest.time} arc against the 90-day quarter."
 },
 "evidence": { "intro":"1-2 sentences","items":[{"item":"the named artifact","why":"1 sentence","covers":"+X.X pts"}],"checkpoints":["a measurable week-N check"] },
 "resources": {
   "intro": "1 sentence, warm and plain: the point is the artifact, not the certificate.",
   "items": [ {"skill":"the gap skill this closes","what":"platform + course TITLE","why":"1 short sentence","hours":"cost or time"} ],
   "note": "1 sentence: what to skip, or the trap people fall into with courses for this role."
 },
 "timeline": {
   "intro":"1-2 sentences","weekly":"1-2 sentences on pacing (6-8 hrs/week)",
   "phases":[ {"title":"The 90-day plan","span":"Weeks 1\u201312","stones":[{"when":"Week 4","label":"deliverable","detail":"1 sentence"}]} ]
 }
}`;
  /* One helper, called twice. Each half is well inside the budget, and a failure
     in one half no longer costs the other, the merge below keeps whatever came
     back and fills the rest from the template. */
  const ask = async (shape, label) => {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          // thinking DISABLED explicitly: the model was spending the max_tokens budget on
        // a thinking block before the text, "blocks=2[thinking,text] stop=max_tokens"
        //, which produced empty and truncated JSON at any budget. These calls want
        // structured output, not deliberation.
        model: 'claude-sonnet-5', thinking: { type: 'disabled' }, max_tokens: 8000, system: sys,
          messages: [{ role: 'user', content: `FACTS = ${JSON.stringify(facts)}${view ? `\n\nYOUR OWN READ OF THIS CASE, formed before writing \u2014 argue FROM it, do not restate it:\n${JSON.stringify(view, null, 1)}` : ''}\n\n${shape}\n\nReturn the JSON now.` }],
        }),
      });
      if (!res.ok) {
        const body = (await res.text().catch(() => '')).slice(0, 200);
        return { err: `${label} http ${res.status}: ${body.slice(0, 120)}` };
      }
      const j = await res.json();
      const blocks = Array.isArray(j.content) ? j.content : [];
      const note = `${label} blocks=${blocks.length}[${blocks.map((c) => c?.type ?? typeof c).join(',')}] stop=${j.stop_reason ?? '?'}`;
      let text = blocks.map((c) => (typeof c?.text === 'string' ? c.text : '')).join('').trim();
      if (!text) return { err: `empty-text: ${note}` };
      text = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
      const a = text.indexOf('{'), b = text.lastIndexOf('}');
      if (a < 0 || b < 0) return { err: `no-json (${note}): ${text.slice(0, 100)}` };
      const out = parseLoose(text.slice(a, b + 1));
      if (!out) return { err: `unparseable (${note}, ${text.length} chars)` };
      return { out };
    } catch (e) { return { err: `${label} threw: ${String(e?.message || e).slice(0, 120)}` }; }
  };

  const [A1, B1] = await Promise.all([ask(shapeA, 'narrate'), ask(shapeB, 'plan')]);
  const out = { ...(A1.out || {}), ...(B1.out || {}) };
  const errs = [A1.err, B1.err].filter(Boolean);
  if (errs.length) console.error('[roadmap] partial/failed halves:', errs.join(' | '));
  // Both halves failed: nothing was written, report it plainly.
  if (!A1.out && !B1.out) return { ...fallback, _aiError: errs.join(' | ') };

  // Shape-guard: any missing branch falls back to the templated field, which is
  // also what makes a ONE-half failure graceful, the other half still ships.
  const merged = {
    resources: out.resources?.items?.length ? { ...out.resources, items: out.resources.items.slice(0, 5) } : fallback.resources,
    roleContext: out.roleContext?.whatItIs ? out.roleContext : fallback.roleContext,
    difficulty: out.difficulty?.verdict ? out.difficulty : fallback.difficulty,
    verdict: out.verdict || fallback.verdict,
    explainTheJump: out.explainTheJump || fallback.explainTheJump,
    first90: out.first90 || fallback.first90,
    decodedNote: out.decodedNote || fallback.decodedNote,
    plan: out.plan?.phases?.length ? { intro: out.plan.intro || fallback.plan.intro, phases: out.plan.phases, firstMove: out.plan.firstMove || fallback.plan.firstMove, longArc: out.plan.longArc || fallback.plan.longArc } : fallback.plan,
    evidence: out.evidence?.items?.length ? { intro: out.evidence.intro || fallback.evidence.intro, items: out.evidence.items, checkpoints: out.evidence.checkpoints || fallback.evidence.checkpoints } : fallback.evidence,
    timeline: out.timeline?.phases?.length ? { intro: out.timeline.intro || fallback.timeline.intro, weekly: out.timeline.weekly || fallback.timeline.weekly, phases: out.timeline.phases } : fallback.timeline,
    alternatesNote: out.alternatesNote || fallback.alternatesNote,
    salaryVerdict: out.salaryVerdict || fallback.salaryVerdict,
  };
  // The model bolds figures with <b> wherever it likes, but the template ESCAPES
  // some fields — timeline stones, evidence rows, resources — so tags printed
  // literally: "is <b>$109,064</b> against 77 reporting" on a real report. Strip
  // every tag from the escaped-render fields; <b> stays legal only in the prose
  // fields the template renders raw.
  const noTags = (v) => typeof v === 'string' ? v.replace(/<[^>]+>/g, '') : v;
  const scrub = (o) => { if (Array.isArray(o)) return o.map(scrub); if (o && typeof o === 'object') { const r = {}; for (const k of Object.keys(o)) r[k] = scrub(o[k]); return r; } return noTags(o); };
  merged.timeline = scrub(merged.timeline);
  merged.evidence = scrub(merged.evidence);
  merged.resources = scrub(merged.resources);

  const reviewed = process.env.ROADMAP_REVIEW === '0'
    ? merged
    : await reviewProse(merged, facts, apiKey);
  // _ai is TRUE when at least one half genuinely came from the model; a half
  // failure surfaces in _aiError so it is visible rather than silently partial.
  return { ...reviewed, _ai: true, ...(errs.length ? { _aiError: `partial: ${errs.join(' | ')}` } : {}) };
}

/* A second pass that re-reads the generated report against the same FACTS and
   repairs claims that contradict them.
 *
 * Why a second call rather than a better first prompt: the first pass is writing
 * and the second is checking, and a model asked to do both at once reliably does
 * the first. The errors this catches are the ones the founder found by reading a
 * real report, "close those three" against a two-item list, "several at SpaceX"
 * when SpaceX has two openings. Both are the same failure: a word that implies a
 * count nobody verified.
 *
 * Deliberately CONSERVATIVE. It may only edit wording, never introduce a number
 * that is not in FACTS, and on any doubt it returns the text unchanged, an LLM
 * reviewing an LLM can invent as easily as it can correct, and a wrong "fix"
 * shipped as a correction is worse than the original error. If anything fails,
 * parses badly, or comes back empty, the unreviewed report ships. */
export async function reviewProse(prose, facts, apiKey) {
  if (!apiKey) return prose;
  const sys = `You are checking a finished career report against the facts it was generated from. Return ONLY the corrected JSON, same shape, no commentary.

Fix ONLY these, and change nothing else:
- Count words that do not match the list they describe ("these three" over two items, "several" for two, "a handful" for one).
- Any figure that contradicts FACTS.
- Any claim of a licence, requirement or timeline that FACTS does not support.
- Any remaining generic artifact phrasing like "an artifact that proves X", replace with the concrete deliverable, but ONLY if you can name one from FACTS.
- Any placeholder letter or symbol that escaped: a literal L, H, N, X or NN standing in for a number.
- Any readiness percentage that disagrees with FACTS.afterTop3, or with the same figure elsewhere in the report.
- LENGTH. This is a fixed-page PDF and overlong fields print past the page edge. Keep roleContext fields to 2 sentences, difficulty fields to 1 sentence each, and any skill list to 3 names plus "and N more". Trim rather than rewrite.

You may NOT: add numbers absent from FACTS, change the voice, lengthen the text, or rewrite anything that is already accurate. If a passage is fine, return it byte-identical. Preserve every key.`;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        // thinking DISABLED explicitly: the model was spending the max_tokens budget on
        // a thinking block before the text, "blocks=2[thinking,text] stop=max_tokens"
        //, which produced empty and truncated JSON at any budget. These calls want
        // structured output, not deliberation.
        model: 'claude-sonnet-5', thinking: { type: 'disabled' }, max_tokens: 4000, system: sys,
        messages: [{ role: 'user', content: `FACTS = ${JSON.stringify(facts)}\n\nREPORT = ${JSON.stringify(prose)}\n\nReturn the corrected REPORT JSON now.` }],
      }),
    });
    if (!res.ok) return prose;
    const j = await res.json();
    // An empty `text` produced "no-json:" with nothing after it, the response
    // parsed, returned 200, and carried no readable text. That rules out
    // truncation and auth, and means the assumption here is wrong: that every
    // content block is type "text" with a .text string. Capture what actually
    // came back instead of inferring it again.
    const blocks = Array.isArray(j.content) ? j.content : [];
    const shapeNote = `blocks=${blocks.length}[${blocks.map((c) => c?.type ?? typeof c).join(',')}] stop=${j.stop_reason ?? '?'}${j.type === 'error' ? ` ERRTYPE=${j.error?.type}:${String(j.error?.message).slice(0, 80)}` : ''}`;
    // Take text from any block that has it, whatever its type is called.
    let text = blocks.map((c) => (typeof c?.text === 'string' ? c.text : '')).join('').trim();
    if (!text) {
      console.error('[roadmap] anthropic empty text ,', shapeNote, JSON.stringify(j).slice(0, 400));
      return { ...fallback, _aiError: `empty-text: ${shapeNote}` };
    }
    text = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    const a = text.indexOf('{'), b = text.lastIndexOf('}');
    if (a < 0 || b < 0) return prose;
    const out = JSON.parse(text.slice(a, b + 1));
    // Every top-level key the report already had must survive the review.
    for (const k of Object.keys(prose)) if (out[k] == null) return prose;
    return out;
  } catch {
    return prose;
  }
}
