/* The route report — the six-page PDF the export sheet promises.
   Framework-free ESM: imported by the render script (draft) and the
   /api/roadmap route handler (production). Renders the full HTML document;
   Chromium prints it to A4. Design system per docs/01: paper/ink/cobalt,
   Instrument Sans for words, Space Mono for measurements, accent on data only.

   Pages (matching the export sheet's table of contents):
     01 The measurement   02 The role, decoded   03 The 90-day plan
     04 Evidence          05 Your graph, printed 06 Salary map            */

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const money = (n) => '$' + Math.round(n / 1000) + 'k';
const RABBIT = '<svg viewBox="-8 -12 139 124" aria-hidden="true"><g fill="currentColor"><path d="M31.9 0 A25.3 15 0 0 0 82.5 0 Z"/><path fill-rule="evenodd" d="M83.3 0 L92 0 C104 0 116 8 121 20 C124 27 123 34 119 38 C112 41 100 40 90 40 L83.3 40 Z M103.3 20 a3.7 3.7 0 1 0 0.01 0 Z"/><path d="M83.1 40 L83.1 76 C91 76 99 82 102 90 C103.5 94 103 98 101.5 99.7 L24 99.7 C23.5 92 25 84 28.6 75 C32 64 40 53 58.9 45 C67 41 73 40 78.6 40 Z"/><circle cx="10" cy="89.5" r="10"/></g></svg>';
const ARROW = '<svg class="ar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>';

function header(tag) {
  return `<div class="hd"><span class="hd-brand"><span class="hd-mark">${RABBIT}</span>PIVOTHOP</span><span class="hd-tag">${esc(tag)}</span></div>`;
}
function footer(d, n) {
  return `<div class="ft"><span>${esc(d.origin.title)} &rarr; ${esc(d.dest.title)}</span><span>${esc(d.meta.reportId)} &middot; generated ${esc(d.meta.generated)}</span><span>${String(n).padStart(2, '0')} / 08</span></div>`;
}

/* ── 01 · cover / the measurement ─────────────────────────────────────── */
function pageCover(d) {
  const sig = (k, v, src) => v == null ? '' : `
    <div class="sig"><span class="sig-k">${k}</span>
      <span class="sig-t"><span class="sig-f" style="width:${Math.min(100, v)}%"></span></span>
      <span class="sig-v">${v}</span></div>${src ? `<div class="sig-src">${esc(src)}</div>` : ''}`;
  const mobilitySrc = { 'observed-flow-us': 'observed US worker flow', 'observed-flow-ctot': 'observed US worker flow (DOL CPS/SIPP)', 'observed-flow-eu': 'observed EU worker flow', related: 'O*NET related occupations' }[d.dest.mobilitySource] || null;
  const nSig = 1 + (d.dest.capability != null ? 1 : 0) + (d.dest.mobility != null ? 1 : 0);
  const gaps = (d.waterfall || []).filter((w) => w.earned === 0).sort((a, z) => z.pts - a.pts).slice(0, 3);
  return `<section class="pg pg-cover">
    ${header('Route report')}
    <div class="cover-route">${esc(d.origin.title)}<br><span class="cover-to">${ARROW} ${esc(d.dest.title)}<span class="dot">.</span></span></div>
    <div class="cover-meta">${d.dest.match}% readiness &middot; ${esc(d.dest.salary)} &middot; ${esc(d.dest.demand)} demand &middot; ${esc(d.dest.time)}${d.dest.license ? ' &middot; license required' : ' &middot; no license gate'}</div>
    <p class="cover-verdict">${d.verdict}</p>
    <div class="cover-sigs">
      <div class="cap">${nSig > 1 ? 'The signals' : 'The measurement'} &mdash; read from ${d.dest.provenance.postings.toLocaleString()} live ${esc(d.dest.title.toLowerCase())} postings</div>
      ${sig('Skill readiness', d.dest.match)}
      ${sig('Shared core abilities', d.dest.capability)}
      ${sig('Commonly done', d.dest.mobility, mobilitySrc)}
    </div>
    ${gaps.length ? `<div class="cover-gap">
      <div class="cap">What closes it &mdash; the highest-value gaps</div>
      <div class="cg-row">${gaps.map((w) => `<span class="cg">${esc(w.name)}<span class="cg-p">+${w.pts.toFixed(1)}</span></span>`).join('')}</div>
    </div>` : ''}
    <div class="cover-toc">
      <div class="cap">Inside</div>
      ${[['02', 'The role, decoded', 'the 100 points, skill by skill'], ['03', 'What this actually is', 'the job, the jump, and where to learn it'], ['04', 'The 90-day plan', 'sequenced by what each skill is worth'], ['05', 'Evidence', 'the artifacts that read as proof'], ['06', 'The timeline', 'the whole arc, drawn to scale'], ['07', 'Salary map', 'both bands, one axis'], ['08', 'The short version', 'if you only keep one page']]
        .map(([n, t, s]) => `<div class="toc-row"><span class="toc-n">${n}</span><span class="toc-t">${t}</span><span class="toc-s">${s}</span></div>`).join('')}
    </div>
    ${footer(d, 1)}
  </section>`;
}

/* The human half of page 2. prose.mjs has been generating roleContext and
   difficulty on every report since they were added — and the template never
   referenced them, so the model wrote them and we threw them away. This renders
   them: what the destination job actually is, what carries over, what does not,
   and one plain-English read on how hard the jump is. Every field is optional,
   so a payload without them renders exactly as before. */
function humanBlock(d) {
  const rc = d.roleContext || {}, df = d.difficulty || {};
  const rows = [
    ['What this job actually is', rc.whatItIs],
    ['What carries over', rc.carriesOver],
    ['What does not', rc.doesNot],
  ].filter(([, v]) => v);
  const verdict = [df.verdict, df.howMany, df.mobilityRead].filter(Boolean);
  if (!rows.length && !verdict.length) return '';
  return `<div class="human">
    ${rows.length ? `<div class="hu-cols">${rows.map(([k, v]) => `<div class="hu-c"><span class="lbl">${k}</span><p>${v}</p></div>`).join('')}</div>` : ''}
    ${verdict.length ? `<div class="hu-verdict"><span class="lbl">How hard is this, honestly</span>${verdict.map((v) => `<p>${v}</p>`).join('')}</div>` : ''}
  </div>`;
}

/* ── 02 · the role, decoded (one anatomy strip + two lists) ───────────── */
// "Close those three" was hardcoded against a variable-length list — it printed
// over a two-item list in the mechanical-engineer report. The count now follows
// the list, and reads as words rather than digits, which is how a person says it.
const numWord = (n) => ['', 'one', 'two', 'three', 'four', 'five', 'six'][n] || String(n);

function pageDecoded(d) {
  const have = d.waterfall.filter((w) => w.earned > 0);
  const earned = have.reduce((s, w) => s + w.earned, 0);
  // A route can have NO zero-earned skills — every row partial credit. Product
  // Manager -> Conversation Designer is one: LangChain 15.8/30.8, Machine
  // Learning 7.5/15.4, Customer Service 6.8/11.5, nothing at zero. `gaps` came
  // back empty, so the strip drew three zero-width segments and the callout read
  // "are worth +0.0 points together" with no subject at all.
  //
  // When nothing is a clean gap, the real gap is the REMAINING points inside the
  // partial rows — which is what page 3 already names correctly, and what the
  // reader needs either way.
  const full = d.waterfall.filter((w) => w.earned === 0).sort((a, b) => b.pts - a.pts);
  const partialDeficits = d.waterfall
    .filter((w) => w.earned > 0 && w.pts - w.earned > 0.05)
    .map((w) => ({ ...w, pts: +(w.pts - w.earned).toFixed(1), partial: true }))
    .sort((a, b) => b.pts - a.pts);
  const gaps = full.length ? full : partialDeficits;
  const top3 = gaps.slice(0, 3);
  const top3pts = top3.reduce((s, w) => s + w.pts, 0);
  const otherPts = 100 - earned - top3pts;
  // the anatomy strip: one bar, five segments — yours + the three named gaps + the rest
  const seg = (w, cls, label) => `<span class="an-seg ${cls}" style="width:${w}%">${label ? `<span class="an-in">${label}</span>` : ''}</span>`;
  const strip = seg(earned, earned < 24 ? 'an-yours an-tight' : 'an-yours', `${earned.toFixed(1)} &mdash; already yours`) +
    top3.map((w, i) => seg(w.pts, 'an-gap', `<b>${i + 1}</b>`)).join('') +
    seg(otherPts, 'an-rest', '');
  const legend = top3.map((w, i) => `<span class="an-key"><b>${i + 1}</b> ${esc(w.name)} +${w.pts.toFixed(1)}</span>`).join('') +
    `<span class="an-key an-key-rest">everything else +${otherPts.toFixed(1)}</span>`;
  const haveRow = (w) => `<div class="sk"><span class="sk-n">${esc(w.name)}</span><span class="sk-dots"></span><span class="sk-v">${w.earned >= w.pts - 0.05 ? w.pts.toFixed(1) : `${w.earned.toFixed(1)} / ${w.pts.toFixed(1)}`}</span></div>`;
  const gapRow = (w) => `<div class="sk sk-gap"><span class="sk-n">${esc(w.name)}</span><span class="sk-dots"></span><span class="sk-v acc">+${w.pts.toFixed(1)}</span></div>`;
  return `<section class="pg">
    ${header('The role, decoded')}
    <h2 class="ph">The 100 points, opened up.</h2>
    <p class="pdek">Every ${esc(d.dest.title.toLowerCase())} posting was read for the skills it demands; the 20 most-demanded share 100 points between them. You hold <b>${earned.toFixed(1)}</b>. One bar, no model:</p>
    <div class="anatomy">${strip}</div>
    <div class="an-legend">${legend}</div>
    <div class="two">
      <div>
        <div class="cap">Already yours &mdash; ${earned.toFixed(1)} pts</div>
        ${have.map(haveRow).join('')}
      </div>
      <div>
        <div class="cap acc">The gap, priced &mdash; ${(100 - earned).toFixed(1)} pts</div>
        ${gaps.map(gapRow).join('')}
        <div class="callout">
          <b>${top3.map((w) => esc(w.name)).join(' + ')}</b> ${top3.length === 1 ? 'is worth' : 'are worth'} <b>+${top3pts.toFixed(1)} points</b> together. Close ${top3.length === 1 ? 'it' : `those ${numWord(top3.length)}`} and this route reads <b>${Math.round(earned + top3pts)}%</b>. That is the whole plan, on one line.
        </div>
      </div>
    </div>
    <div class="facts">
      <div><b>${d.dest.provenance.postings.toLocaleString()}</b><span>postings read</span></div>
      <div><b>${esc(d.dest.demand)}</b><span>demand</span></div>
      <div><b>${esc(d.dest.remote)}</b><span>fully remote</span></div>
      <div><b>${d.dest.license ? 'Yes' : 'None'}</b><span>license gate</span></div>
      <div><b>${esc(d.dest.time)}</b><span>to hiring-ready</span></div>
    </div>
    ${d.decodedNote ? `<p class="note">${d.decodedNote}</p>` : ''}
    ${footer(d, 2)}
  </section>`;
}


/* ── 03 · what this actually is (the human page) ──────────────────────── */
/* These two blocks were bolted onto pages 2 and 4, which were already full.
   A4 is a fixed height, so page 2's difficulty panel printed UNDER the footer
   and page 4's resource list was cut mid-sentence. They also belong together:
   what the job is, how hard the jump is, and where to go and learn it are one
   question asked three ways. */
function pageHuman(d) {
  return `<section class="pg">
    ${header('What this actually is')}
    <h2 class="ph">Before the plan, the job.</h2>
    <p class="lede">The numbers say how far it is. This page says what you are walking towards, and how hard the walk is.</p>
    ${humanBlock(d)}
    ${resourcesBlock(d)}
    ${footer(d, 3)}
  </section>`;
}

/* ── 03 · the 90-day plan ─────────────────────────────────────────────── */
function pagePlan(d) {
  return `<section class="pg">
    ${header('The 90-day plan')}
    <h2 class="ph">Ninety days, sequenced by the points.</h2>
    <p class="pdek">${d.plan.intro}</p>
    ${d.plan.phases.map((p, i) => `
      <div class="phase">
        <div class="phase-hd"><span class="phase-wk">${esc(p.weeks)}</span><span class="phase-t">${esc(p.title)}</span><span class="phase-pts">${esc(p.worth)}</span></div>
        <ul class="phase-steps">${p.steps.map((s) => `<li>${s}</li>`).join('')}</ul>
        <div class="phase-proof"><span class="cap">Proof</span>${p.proof}</div>
      </div>`).join('')}
    <div class="firstmove"><span class="cap">The first move, this week</span><p>${d.plan.firstMove}</p></div>
    ${footer(d, 4)}
  </section>`;
}

/* ── 04 · evidence ────────────────────────────────────────────────────── */
function pageEvidence(d) {
  return `<section class="pg">
    ${header('Evidence')}
    <h2 class="ph">What counts as proof.</h2>
    <p class="pdek">${d.evidence.intro}</p>
    <div class="ev-list">
      ${d.evidence.items.map((e) => `
        <div class="ev"><span class="ev-box"></span><div class="ev-bd"><b>${e.item}</b><span>${e.why}</span></div><span class="ev-pts">${esc(e.covers)}</span></div>`).join('')}
    </div>
    <div class="cap" style="margin-top:7mm">How you&rsquo;ll know it&rsquo;s working</div>
    <div class="checks">
      ${d.evidence.checkpoints.map((c, i) => `<div class="chk"><span class="chk-n">${String(i + 1).padStart(2, '0')}</span><p>${c}</p></div>`).join('')}
    </div>
    <p class="note">${d.plan.longArc}</p>
    ${footer(d, 5)}
  </section>`;
}

/* The arc heading read t.lo/t.hi, which NEITHER prose path ever set — the
   fallback computes them locally without returning them, and the AI shape does
   not declare them at all. It rendered "undefined–undefined months" on every
   report. Derived here from dest.time instead, so the heading cannot depend on
   the prose layer at all; t.lo/t.hi are still honoured if a future shape adds them. */
function arcMonths(d, t) {
  if (t?.lo != null && t?.hi != null) return `${t.lo}&ndash;${t.hi}`;
  const m = String(d?.dest?.time || '').match(/(\d+)\s*[–—-]\s*(\d+)/);
  if (m) return `${m[1]}&ndash;${m[2]}`;
  const one = String(d?.dest?.time || '').match(/(\d+)/);
  return one ? one[1] : '12&ndash;24';
}

/* Resources sit on the evidence page on purpose: the courses and the artifacts
   they produce are the same argument, and splitting them across pages makes the
   course look like the goal. Platform + title, never URLs — see the RESOURCES
   rule in prose.mjs. A dead link in a report someone trusted costs more than the
   course was worth. */
function resourcesBlock(d) {
  const r = d.resources;
  if (!r?.items?.length) return '';
  return `<div class="res-b">
    <span class="lbl">Where to actually learn this</span>
    ${r.intro ? `<p class="res-i">${r.intro}</p>` : ''}
    <div class="res-list">
      ${r.items.map((it) => `<div class="res-r">
        <div class="res-l"><b>${esc(it.what || '')}</b>${it.why ? `<span class="res-w">${esc(it.why)}</span>` : ''}</div>
        <div class="res-m">${esc(it.skill || '')}${it.hours ? ` · ${esc(it.hours)}` : ''}</div>
      </div>`).join('')}
    </div>
    ${r.note ? `<p class="res-n">${r.note}</p>` : ''}
  </div>`;
}


/* ── 07 · the summary (the page people actually re-read) ──────────────── */
/* Everything above is the argument; this is the answer. Deliberately no new
   information — if a number appears here it appears earlier too, because a
   summary that introduces facts is a seventh page of reading rather than a
   place to land. Built to survive being screenshotted on a phone. */
function pageSummary(d) {
  const have = d.waterfall.filter((w) => w.earned > 0);
  const earned = have.reduce((s, w) => s + w.earned, 0);
  const full = d.waterfall.filter((w) => w.earned === 0).sort((a, b) => b.pts - a.pts);
  const partial = d.waterfall.filter((w) => w.earned > 0 && w.pts - w.earned > 0.05)
    .map((w) => ({ ...w, pts: +(w.pts - w.earned).toFixed(1) })).sort((a, b) => b.pts - a.pts);
  const top = (full.length ? full : partial).slice(0, 3);
  const after = Math.round(earned + top.reduce((s, w) => s + w.pts, 0));
  const stones = (d.timeline?.phases || []).flatMap((ph) => ph.stones || []).slice(0, 4);
  const lic = d.dest.license;
  return `<section class="pg">
    ${header('The short version')}
    <h2 class="ph">If you only keep one page.</h2>
    <p class="lede">Everything in this report, on one page. Nothing here is new &mdash; it is all above, with the working attached.</p>

    <div class="sm-top">
      <div class="sm-big"><span class="sm-n">${Math.round(earned)}<span class="sm-pc">%</span></span><span class="lbl">where you stand today</span></div>
      <div class="sm-big"><span class="sm-n">${after}<span class="sm-pc">%</span></span><span class="lbl">after the ${numWord(top.length)} below</span></div>
      <div class="sm-big"><span class="sm-n sm-sm">${esc(d.dest.time)}</span><span class="lbl">to hiring-ready</span></div>
      <div class="sm-big"><span class="sm-n sm-sm">${d.board.open ? d.board.open : '&mdash;'}</span><span class="lbl">open ${esc(d.dest.title.toLowerCase())} roles today</span></div>
    </div>

    <div class="sm-grid">
      <div class="sm-col">
        <span class="lbl">What stands between you and it</span>
        ${top.map((w, i) => `<div class="sm-gap"><span class="sm-i">${i + 1}</span><b>${esc(w.name)}</b><span class="sm-p">+${w.pts.toFixed(1)}</span></div>`).join('')}
        ${lic ? `<p class="sm-lic"><b>Licence:</b> ${esc(lic.label || 'required')}. No amount of skill overlap shortens it.</p>`
              : '<p class="sm-lic">No licence stands at the door. What is missing is skills, and skills you can show.</p>'}
      </div>
      <div class="sm-col">
        <span class="lbl">Start here, this week</span>
        <p class="sm-first">${d.plan.firstMove}</p>
        ${stones.length ? `<span class="lbl" style="margin-top:5mm;display:block">Then, in order</span>
        <div class="sm-stones">${stones.map((st) => `<div class="sm-st"><span>${esc(st.when || '')}</span><b>${esc(st.label || '')}</b></div>`).join('')}</div>` : ''}
      </div>
    </div>

    <div class="sm-foot">
      <div><span class="lbl">Pay</span><p>${esc(d.origin.title)} ${esc(d.origin.salary)} &nbsp;&rarr;&nbsp; ${esc(d.dest.title)} ${esc(d.dest.salary)}</p></div>
      <div><span class="lbl">Re-run it free, any time</span><p><b>pivothop.com</b> &mdash; the numbers move with the market, and the graph is always current.</p></div>
    </div>
    ${footer(d, 8)}
  </section>`;
}

/* ── 05 · the timeline (vertical, phase-grouped roadmap) ──────────────── */
function pageTimeline(d) {
  const t = d.timeline;
  const phases = t.phases.map((ph) => `
    <div class="rm-ph${ph.hot ? ' rm-ph-hot' : ''}">
      <div class="rm-ph-hd"><span class="rm-ph-t">${esc(ph.title)}</span><span class="rm-ph-s">${esc(ph.span)}</span></div>
      ${ph.stones.map((s) => `
        <div class="rm-stone${s.hot ? ' rm-hot' : ''}">
          <span class="rm-when">${esc(s.when)}</span>
          <span class="rm-dot"></span>
          <div class="rm-bd"><b>${esc(s.label)}</b><span>${esc(s.detail)}</span></div>
        </div>`).join('')}
    </div>`).join('');
  return `<section class="pg">
    ${header('The timeline')}
    <h2 class="ph">The whole arc, ${arcMonths(d, t)} months.</h2>
    <p class="pdek">${t.intro}</p>
    <div class="rm">${phases}</div>
    <div class="rm-note"><span class="cap">Pacing</span><p>${t.weekly}</p></div>
    <div class="cap" style="margin-top:4mm">If this route sours &mdash; the nearest alternates</div>
    <div class="alts">
      ${d.alternates.map((a) => `<div class="alt"><span class="alt-t">${esc(a.title)}</span><span class="alt-m">${a.match}%</span><span class="alt-g">${esc(a.gate)}</span></div>`).join('')}
    </div>
    <p class="note note-flow">${d.alternatesNote}</p>
    ${footer(d, 6)}
  </section>`;
}

/* ── 06 · salary map ──────────────────────────────────────────────────── */
function pageSalary(d) {
  const lo = Math.min(d.origin.salary_band[0], d.dest.salary_band[0]) * 0.94;
  const hi = Math.max(d.origin.salary_band[1], d.dest.salary_band[1]) * 1.06;
  const X = (v) => ((v - lo) / (hi - lo)) * 100;
  const band = (label, b, sel) => `
    <div class="sal-row">
      <span class="sal-k">${esc(label)}</span>
      <span class="sal-t">
        <span class="sal-b ${sel ? 'sal-sel' : ''}" style="left:${X(b[0])}%;width:${X(b[1]) - X(b[0])}%"></span>
        <span class="sal-lo" style="left:${X(b[0])}%">${money(b[0])}</span>
        <span class="sal-hi" style="left:${X(b[1])}%">${money(b[1])}</span>
      </span>
    </div>`;
  return `<section class="pg">
    ${header('Salary map')}
    <h2 class="ph">Both bands, one axis.</h2>
    <p class="pdek">${d.salaryVerdict}</p>
    <div class="salmap">
      ${band(d.origin.title, d.origin.salary_band, false)}
      ${band(d.dest.title, d.dest.salary_band, true)}
    </div>
    <div class="cap" style="margin-top:8mm">Openings on the board, today</div>
    <div class="board">
      <div class="board-n"><b>${d.board.open}</b><span>live ${esc(d.dest.title.toLowerCase())} roles</span></div>
      <div class="board-cos">
        ${d.board.companies.map(([c, n]) => `<div class="board-co"><span>${esc(c)}</span><span class="mono">${n} role${n > 1 ? 's' : ''}</span></div>`).join('')}
      </div>
    </div>
    <a class="board-cta">pivothop.com/jobs/${esc(d.dest.id)} ${ARROW}</a>
    <div class="method">
      <div class="cap">Method</div>
      <p>Readiness is the share of the destination&rsquo;s 100 demand-weighted skill points your profile already earns, read from ${d.dest.provenance.postings.toLocaleString()} live postings (${d.dest.provenance.salaried.toLocaleString()} stating pay). Mobility is observed worker flow, not opinion. Salary bands are the posted 10th&ndash;90th spread. Numbers move with the market; the graph re-runs free at <b>pivothop.com</b>.</p>
    </div>
    ${footer(d, 7)}
  </section>`;
}

/* ── document ─────────────────────────────────────────────────────────── */
export function renderRoadmapHTML(d) {
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root{--ink:#15151a;--ink2:#56565e;--ink3:#8a8a93;--paper:#f5f3ed;--paper2:#eae7df;--card:#faf9f5;--rule:#d5cfbf;--rule2:#b8b0a0;--acc:#002FA6}
  *{margin:0;padding:0;box-sizing:border-box}
  @page{size:A4;margin:0}
  html,body{background:var(--paper)}
  body{font-family:'Instrument Sans',sans-serif;color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .mono,.cap{font-family:'Space Mono',monospace}
  .acc{color:var(--acc)}
  .pg{width:210mm;height:297mm;padding:13mm 16mm 24mm;page-break-after:always;position:relative;background:var(--paper);display:flex;flex-direction:column;overflow:hidden}
  .pg:last-child{page-break-after:auto}
  /* chrome */
  .hd{display:flex;justify-content:space-between;align-items:center;border-bottom:1.2px solid var(--ink);padding-bottom:3.2mm;margin-bottom:7mm}
  .hd-brand{display:flex;align-items:center;gap:2.6mm;font-weight:700;font-size:10.5pt;letter-spacing:.14em}
  .hd-mark{width:7mm;color:var(--ink)}.hd-mark svg{display:block;width:100%;height:auto}
  .hd-tag{font-family:'Space Mono',monospace;font-size:7pt;letter-spacing:.2em;text-transform:uppercase;color:var(--ink3)}
  .ft{position:absolute;left:16mm;right:16mm;bottom:8mm;display:flex;justify-content:space-between;border-top:.5px solid var(--rule2);padding-top:2.6mm;font-family:'Space Mono',monospace;font-size:6.6pt;letter-spacing:.12em;text-transform:uppercase;color:var(--ink3)}
  .cap{font-size:7pt;letter-spacing:.18em;text-transform:uppercase;color:var(--ink3);margin-bottom:3.4mm}
  .cap.acc{color:var(--acc)}
  .ph{font-weight:700;font-size:21pt;letter-spacing:-.02em;line-height:1.04;margin-bottom:3.4mm}
  .pdek{font-size:9.6pt;line-height:1.5;color:var(--ink2);max-width:150mm;margin-bottom:7mm}
  .pdek b{color:var(--ink)}
  .note{font-size:8.4pt;line-height:1.5;color:var(--ink3);margin-top:auto;padding-top:4mm;max-width:158mm}
  .note.note-flow{margin-top:3.5mm}
  .ar{width:.72em;height:.72em;color:var(--acc)}
  /* cover */
  .pg-cover{padding-top:16mm}
  .cover-route{font-weight:700;font-size:37pt;letter-spacing:-.03em;line-height:1.02;margin:9mm 0 5mm}
  .cover-to .ar{width:.62em;height:.62em}
  .cover-to .dot{color:var(--acc)}
  .cover-meta{font-family:'Space Mono',monospace;font-size:8.2pt;letter-spacing:.1em;text-transform:uppercase;color:var(--ink2);margin-bottom:8mm}
  .cover-verdict{font-size:11.6pt;line-height:1.55;max-width:150mm;margin-bottom:11mm}
  .cover-verdict b{color:var(--acc)}
  .cover-sigs{margin-bottom:10mm}
  .cover-gap{margin-bottom:2mm}
  .cg-row{display:flex;flex-wrap:wrap;gap:4mm 8mm;margin-top:3.5mm}
  .cg{font-size:11.4pt;font-weight:600;letter-spacing:-.005em;display:inline-flex;align-items:baseline;gap:2mm}
  .cg-p{font-family:'Space Mono',monospace;font-size:8.4pt;font-weight:700;color:var(--acc)}
  .sig{display:grid;grid-template-columns:44mm 1fr 12mm;gap:4mm;align-items:center;margin:2.6mm 0}
  .sig-k{font-size:9.4pt;font-weight:500}
  .sig-t{height:2.6mm;background:var(--paper2);position:relative}
  .sig-f{position:absolute;inset:0 auto 0 0;background:var(--acc)}
  .sig-v{font-family:'Space Mono',monospace;font-weight:700;font-size:9.4pt;text-align:right}
  .sig-src{font-family:'Space Mono',monospace;font-size:6.8pt;letter-spacing:.12em;text-transform:uppercase;color:var(--acc);margin:1mm 0 0 48mm}
  .cover-toc{margin-top:auto;padding-top:6mm}
  .toc-row{display:grid;grid-template-columns:10mm 46mm 1fr;gap:4mm;align-items:baseline;padding:2.4mm 0;border-top:.5px solid var(--rule)}
  .toc-n{font-family:'Space Mono',monospace;font-size:8pt;color:var(--acc)}
  .toc-t{font-weight:600;font-size:10pt}
  .toc-s{font-size:8.6pt;color:var(--ink3)}
  /* the anatomy strip + skill lists */
  .two{display:grid;grid-template-columns:1fr 1fr;gap:11mm}
  .anatomy{display:flex;height:11mm;border:1.2px solid var(--ink);margin-bottom:2.6mm;background:var(--card)}
  /* 07 — the summary. Big numbers, few words, readable at a glance on a phone. */
  .sm-top{display:grid;grid-template-columns:repeat(4,1fr);gap:5mm;margin:6mm 0 7mm;padding-bottom:6mm;border-bottom:1.2px solid var(--ink)}
  .sm-big .sm-n{display:block;font-size:23pt;font-weight:600;letter-spacing:-.02em;color:var(--acc);line-height:1}
  .sm-big .sm-n.sm-sm{font-size:15pt;color:var(--ink)}
  .sm-big .sm-pc{font-size:13pt}
  .sm-big .lbl{display:block;margin-top:1.5mm}
  .sm-grid{display:grid;grid-template-columns:1fr 1fr;gap:9mm}
  .sm-gap{display:flex;align-items:baseline;gap:3mm;padding:2.4mm 0;border-bottom:0.5px solid var(--rule)}
  .sm-i{font-family:'Space Mono',monospace;font-size:8pt;color:var(--acc)}
  .sm-gap b{flex:1;font-size:10pt;font-weight:600}
  .sm-p{font-family:'Space Mono',monospace;font-size:8.5pt;color:var(--acc)}
  .sm-lic{margin:3.5mm 0 0;font-size:8.8pt;line-height:1.5;color:var(--ink2)}
  .sm-first{margin:1.5mm 0 0;font-size:10pt;line-height:1.55;color:var(--ink)}
  .sm-stones{margin-top:1.5mm}
  .sm-st{display:flex;gap:4mm;padding:1.8mm 0;border-bottom:0.5px solid var(--rule)}
  .sm-st span{flex:none;width:22mm;font-family:'Space Mono',monospace;font-size:8pt;color:var(--ink3)}
  .sm-st b{font-size:9.4pt;font-weight:600}
  .sm-foot{display:grid;grid-template-columns:1fr 1fr;gap:9mm;margin-top:8mm;padding-top:5mm;border-top:0.6px solid var(--rule2)}
  .sm-foot p{margin:1.5mm 0 0;font-size:9pt;line-height:1.5;color:var(--ink2)}
  .res-b{margin-top:7mm;padding-top:5mm;border-top:0.6px solid var(--rule2)}
  .res-i{margin:1.5mm 0 3.5mm;font-size:9.2pt;line-height:1.5;color:var(--ink2)}
  .res-list{display:flex;flex-direction:column}
  .res-r{display:flex;justify-content:space-between;align-items:baseline;gap:6mm;padding:2.6mm 0;border-bottom:0.5px solid var(--rule)}
  .res-l b{font-size:9.6pt;font-weight:600;color:var(--ink)}
  .res-w{display:block;margin-top:0.8mm;font-size:8.8pt;line-height:1.45;color:var(--ink2)}
  .res-m{flex:none;font-family:'Space Mono',monospace;font-size:8pt;color:var(--acc);white-space:nowrap}
  .res-n{margin:3.5mm 0 0;font-size:8.8pt;line-height:1.5;color:var(--ink3)}
  .human{margin-top:7mm;padding-top:5mm;border-top:0.6px solid var(--rule2)}
  .hu-cols{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6mm;margin-bottom:5mm}
  .hu-c p{margin:1.5mm 0 0;font-size:9.2pt;line-height:1.5;color:var(--ink2)}
  .hu-verdict{background:var(--paper2);border-left:1.6px solid var(--acc);padding:3.5mm 4.5mm}
  .hu-verdict p{margin:1.5mm 0 0;font-size:9.4pt;line-height:1.55;color:var(--ink)}
  .an-seg{position:relative;height:100%}
  .an-yours{background:var(--acc)}
  .an-yours .an-in{position:absolute;left:3mm;top:50%;transform:translateY(-50%);color:#fff;font-family:'Space Mono',monospace;font-size:8pt;letter-spacing:.05em;white-space:nowrap}
  /* White-on-white bug: the label is nowrap and absolutely placed, so on a low
     readiness (13.4% of the bar) it ran past the blue segment onto paper and
     vanished. Below 24% it sits to the RIGHT of the segment in accent ink. */
  .an-yours.an-tight .an-in{left:calc(100% + 2.5mm);color:var(--acc)}
  .an-gap{border-left:1.2px solid var(--acc);display:flex;align-items:center;justify-content:center}
  .an-gap .an-in b{font-family:'Space Mono',monospace;font-weight:700;font-size:8.4pt;color:var(--acc)}
  .an-rest{background:var(--paper2);border-left:1.2px solid var(--rule2)}
  .an-legend{display:flex;gap:6mm;flex-wrap:wrap;font-family:'Space Mono',monospace;font-size:7.2pt;color:var(--ink2);margin-bottom:8mm}
  .an-key b{color:var(--acc)}
  .an-key-rest{color:var(--ink3)}
  .sk{display:flex;align-items:baseline;gap:2.5mm;padding:1.5mm 0}
  .sk-n{font-size:8.8pt;font-weight:500;white-space:nowrap}
  .sk-dots{flex:1;border-bottom:1px dotted var(--rule2);transform:translateY(-.9mm)}
  .sk-v{font-family:'Space Mono',monospace;font-size:7.6pt;color:var(--ink2);white-space:nowrap}
  .sk-gap .sk-n{font-weight:600;font-size:9.4pt}
  .sk-gap .sk-v.acc{color:var(--acc);font-weight:700;font-size:8.8pt}
  .callout{border:1.2px solid var(--acc);padding:4.4mm 5mm;margin-top:5mm;font-size:9pt;line-height:1.5}
  .callout b{color:var(--acc)}
  .facts{display:grid;grid-template-columns:repeat(5,1fr);gap:4mm;border-top:1.2px solid var(--ink);margin-top:7mm;padding-top:4.4mm}
  .facts b{display:block;font-family:'Space Mono',monospace;font-weight:700;font-size:12.5pt}
  .facts span{font-family:'Space Mono',monospace;font-size:6.6pt;letter-spacing:.14em;text-transform:uppercase;color:var(--ink3)}
  /* plan */
  .phase{border-top:1.2px solid var(--ink);padding:4.6mm 0 4mm}
  .phase-hd{display:flex;align-items:baseline;gap:5mm;margin-bottom:2.8mm}
  .phase-wk{font-family:'Space Mono',monospace;font-size:8pt;letter-spacing:.14em;color:var(--acc);white-space:nowrap}
  .phase-t{font-weight:700;font-size:12.6pt;letter-spacing:-.01em}
  .phase-pts{margin-left:auto;font-family:'Space Mono',monospace;font-size:8pt;color:var(--ink3)}
  .phase-steps{list-style:none;margin:0 0 3mm}
  .phase-steps li{font-size:9.2pt;line-height:1.5;color:var(--ink2);padding:1.1mm 0 1.1mm 6mm;position:relative}
  .phase-steps li::before{content:"";position:absolute;left:1mm;top:2.9mm;width:2.2mm;height:1.2px;background:var(--acc)}
  .phase-steps b{color:var(--ink)}
  .phase-proof{display:flex;gap:4mm;align-items:baseline;font-size:8.8pt;color:var(--ink)}
  .phase-proof .cap{margin:0;white-space:nowrap;color:var(--acc)}
  .firstmove{background:var(--acc);color:#fff;padding:5.5mm 6mm;margin-top:6mm}
  .firstmove .cap{color:rgba(255,255,255,.65);margin-bottom:2mm}
  .firstmove p{font-size:10.6pt;line-height:1.5;font-weight:500}
  /* evidence */
  .ev-list{display:grid;grid-template-columns:1fr;gap:0}
  .ev{display:flex;gap:4.4mm;align-items:flex-start;padding:3.3mm 0;border-top:.5px solid var(--rule)}
  .ev-box{width:3.6mm;height:3.6mm;border:1.2px solid var(--ink);flex:none;margin-top:.8mm}
  .ev-bd{flex:1}
  .ev-bd b{display:block;font-size:9.8pt;font-weight:600}
  .ev-bd span{display:block;font-size:8.4pt;color:var(--ink2);line-height:1.45;margin-top:.6mm}
  .ev-pts{font-family:'Space Mono',monospace;font-size:7.2pt;color:var(--acc);white-space:nowrap;margin-top:1mm}
  .checks{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm}
  .chk{border-top:1.2px solid var(--ink);padding-top:3mm}
  .chk-n{font-family:'Space Mono',monospace;font-size:8pt;color:var(--acc)}
  .chk p{font-size:8.6pt;line-height:1.5;color:var(--ink2);margin-top:1.6mm}
  /* vertical roadmap: a spine, phase groups, milestone rows */
  .rm{position:relative;margin-bottom:5mm}
  /* the spine: centred on the dot axis (24mm) and behind the dots, whose paper
     halo masks it — line reads as connecting into each node, never over it */
  .rm::before{content:"";position:absolute;left:24mm;top:7.5mm;bottom:3.5mm;width:1.4px;background:var(--rule2);transform:translateX(-50%);z-index:0}
  .rm-ph-hd{display:flex;align-items:baseline;gap:4mm;margin:4mm 0 .5mm;padding-left:29mm}
  .rm-ph:first-child .rm-ph-hd{margin-top:1mm}
  .rm-ph-t{font-family:'Space Mono',monospace;font-size:7.4pt;letter-spacing:.16em;text-transform:uppercase;color:var(--acc)}
  .rm-ph-s{font-family:'Space Mono',monospace;font-size:7pt;letter-spacing:.1em;color:var(--ink3);margin-left:auto}
  .rm-stone{display:grid;grid-template-columns:20mm 8mm 1fr;align-items:start;padding:1.5mm 0}
  .rm-when{font-family:'Space Mono',monospace;font-size:7.2pt;color:var(--ink2);text-align:right;padding-top:.4mm;white-space:nowrap;letter-spacing:.04em}
  .rm-dot{position:relative;z-index:1;justify-self:center;align-self:start;width:2.9mm;height:2.9mm;border-radius:50%;background:var(--ink);margin-top:1mm;box-shadow:0 0 0 1.6mm var(--paper)}
  .rm-bd b{font-size:9.8pt;font-weight:600;letter-spacing:-.005em}
  .rm-bd span{display:block;font-size:8.3pt;color:var(--ink2);line-height:1.42;margin-top:.7mm;max-width:120mm}
  .rm-hot .rm-dot{background:var(--acc);width:3.4mm;height:3.4mm;box-shadow:0 0 0 1.6mm var(--paper)}
  .rm-hot .rm-bd b{color:var(--acc)}
  .rm-note{border-left:2px solid var(--acc);padding-left:4mm;margin:0 0 0 29mm}
  .rm-note .cap{margin-bottom:1.4mm}
  .rm-note p{font-size:8.3pt;color:var(--ink2);line-height:1.5;max-width:120mm}
  .alts{border-top:1.2px solid var(--ink)}
  .alt{display:grid;grid-template-columns:1fr 14mm 62mm;gap:4mm;padding:2.7mm 0;border-bottom:.5px solid var(--rule);align-items:baseline}
  .alt-t{font-weight:600;font-size:9.6pt}
  .alt-m{font-family:'Space Mono',monospace;font-weight:700;font-size:9.6pt;text-align:right}
  .alt-g{font-family:'Space Mono',monospace;font-size:6.8pt;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);text-align:right}
  /* salary */
  .salmap{border-top:1.2px solid var(--ink);padding-top:6mm}
  .sal-row{display:grid;grid-template-columns:36mm 1fr;gap:5mm;align-items:center;margin:7mm 0 9mm}
  .sal-k{font-weight:600;font-size:10.4pt}
  .sal-t{position:relative;height:7mm;background:var(--paper2)}
  .sal-b{position:absolute;top:0;bottom:0;background:var(--rule2)}
  .sal-b.sal-sel{background:var(--acc)}
  .sal-lo,.sal-hi{position:absolute;top:8.4mm;transform:translateX(-50%);font-family:'Space Mono',monospace;font-size:7.6pt;color:var(--ink2)}
  .board{display:flex;gap:10mm;align-items:flex-start;margin-bottom:4mm}
  .board-n b{display:block;font-family:'Space Mono',monospace;font-weight:700;font-size:26pt;line-height:1;color:var(--acc)}
  .board-n span{font-family:'Space Mono',monospace;font-size:6.8pt;letter-spacing:.14em;text-transform:uppercase;color:var(--ink3)}
  .board-cos{flex:1}
  .board-co{display:flex;justify-content:space-between;padding:1.8mm 0;border-bottom:.5px solid var(--rule);font-size:9.2pt}
  .board-co .mono{font-size:7.6pt;color:var(--ink2)}
  .board-cta{display:inline-flex;align-items:center;gap:2mm;font-family:'Space Mono',monospace;font-weight:700;font-size:9pt;color:var(--acc);border-bottom:1.2px solid var(--acc);padding-bottom:.8mm}
  .method{margin-top:auto;border-top:1.2px solid var(--ink);padding-top:4mm}
  .method p{font-size:8.2pt;line-height:1.55;color:var(--ink2);max-width:160mm}
</style></head><body>
${pageCover(d)}${pageDecoded(d)}${pageHuman(d)}${pagePlan(d)}${pageEvidence(d)}${pageTimeline(d)}${pageSalary(d)}${pageSummary(d)}
</body></html>`;
}
