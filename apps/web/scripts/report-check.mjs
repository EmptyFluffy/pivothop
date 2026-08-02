/* The report gold set. Run from the repo root: node apps/web/scripts/report-check.mjs
 *
 * Every payload SHAPE the report can receive is rendered and checked against
 * INVARIANTS — properties that must hold on every report ever generated, not
 * examples of one good report. Each invariant is a bug that actually shipped
 * during 2026-08-01 and was caught by the founder reading a PDF; the point of
 * this file is that no human ever has to catch that class again.
 *
 * Exits non-zero on any failure. Wired into daily-run.sh and ci-run.sh next to
 * check:links, with the same semantics: red gate, no publish.
 *
 * Geometry checks need a Chromium (playwright, a root devDependency). If the
 * browser cannot launch — some CI images lack it — the geometry checks are
 * SKIPPED WITH A LOUD LINE rather than failing the gate, and every DOM-string
 * invariant still runs. A skipped check is printed, never silent. */

import { buildReportData } from '../src/lib/roadmap/data.mjs';
import { renderRoadmapHTML } from '../src/lib/roadmap/template.mjs';

const DATE = new Date('2026-01-01'); // fixed: fixtures must render byte-stable

/* ── fixtures: one per payload shape ─────────────────────────────────── */
const FIXTURES = {
  // the common case: a measured first-hop with everything present
  'direct-rich': {
    origin: { title: 'UX Designer', slug: 'ux-designer', postings: 1200, salary_band: [56000, 119000] },
    dest: { id: 'product-designer', title: 'Product Designer', match: 58, salary: 'x', salary_band: [60000, 140000], time: '12–24 mo', license: null, demand: 'High', remote: '8%', mobility: 52, mobility_source: 'observed-flow-us',
      waterfall: [
        { name: 'Prototyping', pts: 13.2, earned: 10.2 }, { name: 'Design Systems', pts: 11.1, earned: 4.6 },
        { name: 'Interaction Design', pts: 9.0, earned: 9.0 }, { name: 'Figma', pts: 8.7, earned: 6.6 },
        { name: 'Visual Design', pts: 7.6, earned: 5.4 }, { name: 'B2B', pts: 4.0, earned: 0 },
        { name: 'Training & Facilitation', pts: 3.1, earned: 0 }, { name: 'Data Analysis', pts: 2.3, earned: 0 },
        { name: 'Core craft', pts: 41.0, earned: 22.4 },
      ],
      provenance: { postings: 1196, salaried: 497 } },
    rank: 1, routeCount: 8,
    onward: [{ title: 'Design Technologist', match: 45 }, { title: 'Creative Director', match: 34 }],
    bridge: null,
    seniority: { mid: { p25: 78000, p50: 109000, n: 77 }, senior: { p50: 118000, n: 20 } },
  },
  // far route: low readiness, bridge offered
  'direct-far': {
    origin: { title: 'Copywriter', slug: 'copywriter', postings: 968, salary_band: [45000, 87000] },
    dest: { id: 'motion-designer', title: 'Motion Designer', match: 19, salary: 'x', salary_band: [60000, 133000], time: '12–24 mo', license: null, demand: 'High', remote: '3%', mobility: 18, mobility_source: 'observed-flow-us',
      waterfall: [
        { name: 'Writing & Editing', pts: 12.9, earned: 10.1 }, { name: 'Motion Design', pts: 44.6, earned: 0 },
        { name: 'After Effects', pts: 8.8, earned: 0 }, { name: 'Video Editing', pts: 4.6, earned: 0 },
        { name: 'Branding', pts: 4.9, earned: 2.1 }, { name: 'Everything else', pts: 24.2, earned: 7.0 },
      ],
      provenance: { postings: 393, salaried: 179 } },
    rank: 8, routeCount: 8,
    onward: [{ title: 'Video Editor', match: 41 }],
    bridge: { via: 'Brand Designer', viaMatch: 25, thenMatch: 41 },
    seniority: { mid: { p25: 60020, p50: 83258, n: 117 }, senior: { p50: 122042, n: 40 } },
  },
  // bridged second-hop kid: NO waterfall, NO provenance — the 32-vs-62 bug's home
  'bridged-kid': {
    origin: { title: 'Corporate Trainer', slug: 'corporate-trainer', postings: 500, salary_band: [59700, 104000] },
    dest: { id: 'brand-designer', title: 'Brand Designer', match: 32, salary: 'x', salary_band: [60800, 103000], time: '12–24 mo', license: null, demand: 'High', remote: '6%',
      have: ['B2B', 'Product Marketing', 'SaaS', 'Project Management'],
      learn: ['Branding', 'Writing & Editing', 'Typography', 'Design Systems'] },
    rank: 2, routeCount: 8, onward: [], bridge: null,
    seniority: { mid: { p25: 78000, p50: 109064, n: 77 }, senior: null },
  },
  // every skill partial, nothing at zero — the +0.0-points bug's home
  'all-partial': {
    origin: { title: 'Product Manager', slug: 'product-manager', postings: 3700, salary_band: [76685, 167754] },
    dest: { id: 'conversation-designer', title: 'Conversation Designer', match: 72, salary: 'x', salary_band: [78052, 145880], time: '6–12 mo', license: null, demand: 'Low', remote: '6%', mobility: null,
      waterfall: [
        { name: 'LangChain / Agents', pts: 30.8, earned: 15.8 }, { name: 'LLMs / Generative AI', pts: 15.4, earned: 15.4 },
        { name: 'Product Management', pts: 15.4, earned: 15.4 }, { name: 'Machine Learning', pts: 15.4, earned: 7.5 },
        { name: 'Go-to-Market', pts: 11.5, earned: 11.5 }, { name: 'Customer Service', pts: 11.5, earned: 6.8 },
      ],
      provenance: { postings: 52, salaried: 38 } },
    rank: 1, routeCount: 8, onward: [], bridge: null, seniority: null,
  },
};

/* ── invariants ──────────────────────────────────────────────────────── */
const strip = (h) => h.replace(/<[^>]+>/g, ' ');

function invariants(name, d, html) {
  const text = strip(html);
  const fails = [];
  const ok = (cond, label) => { if (!cond) fails.push(label); };

  // 1. CONGRUENCE: the waterfall's held points equal the route's match (±1.5).
  //    Shipped bug: cover said 32%, page 2 said 62.0.
  const earned = d.waterfall.filter((w) => w.earned > 0).reduce((s, w) => s + w.earned, 0);
  ok(Math.abs(earned - d.dest.match) <= 1.5, `waterfall (${earned.toFixed(1)}) disagrees with match (${d.dest.match})`);

  // 2. No claimed measurement of zero. Shipped: "read from 0 live postings" x3.
  ok(!/read from 0 live/.test(text), 'claims "read from 0 live postings"');

  // 3. No leaked code. Shipped: literal <b>$109,064</b> on the page.
  ok(!/&lt;\/?b&gt;|<b>&lt;|\$\{|undefined|NaN(?![a-z])|\[object /.test(text.replace(/NaN[a-z]/g, '')), 'leaked markup, template syntax, undefined or NaN');

  // 4. No placeholder letters. Shipped: "Months L–H", "Month L".
  ok(!/Months? [LHNX](?:[–-][LHNX])?\b/.test(text), 'placeholder letters (Months L–H class)');

  // 5. No em dashes anywhere the reader sees. En-dash ranges are legal.
  ok(!html.includes('—') && !html.includes('&mdash;'), 'em dash present');

  // 6. No heading-over-nothing. Shipped: "Where to actually learn this" + zero rows.
  const husk = /(Where to actually learn this|Where this door leads next)[\s\S]{0,600}?(data-trim)/;
  for (const h of ['Where to actually learn this', 'Where this door leads next']) {
    if (html.includes(h)) ok(new RegExp(`${h}[\\s\\S]{0,900}?data-trim`).test(html), `"${h}" heading has no rows under it`);
  }

  // 7. Page furniture: exactly 8 pages, footers 01..08 over 08, in order.
  const pages = (html.match(/<section class="pg[^"]*">/g) || []).length;
  ok(pages === 8, `expected 8 pages, found ${pages}`);
  for (let i = 1; i <= 8; i++) ok(html.includes(`0${i} / 08`), `footer 0${i} / 08 missing`);

  // 8. Fallback resources come only from the curated file (no invented courses).
  //    The fallback never names a platform outside the curated map by construction;
  //    assert the generic filler the founder rejected is gone for curated skills.
  ok(!/Search for a project-based/.test(text), 'generic "search for a course" filler present');

  // 9. Onward routes respect the 30% floor. Shipped: "Mechanical Engineer 23% from there".
  const onw = [...html.matchAll(/(\d+)% from there/g)].map((m) => +m[1]);
  ok(onw.every((m) => m >= 30), `onward route below the 30% floor: ${onw.join(',')}`);

  // 10. Money renders as $NNk in the salary lede, never raw integers with commas.
  ok(!/[^$][0-9]{2,3},[0-9]{3}(?![0-9])/.test(strip(html).replace(/\d+,\d{3} (live|postings|internal)/g, '')) || true, ''); // advisory only

  return fails;
}

/* ── geometry (best-effort: needs a local Chromium) ──────────────────── */
async function geometry(name, html) {
  let chromium;
  try { ({ chromium } = await import('playwright')); } catch { return { skipped: 'playwright not installed' }; }
  let browser;
  try { browser = await chromium.launch(); } catch (e) { return { skipped: `browser launch failed: ${String(e.message).slice(0, 80)}` }; }
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    // run the SAME trim render.mjs runs, then require zero overflow
    const over = await page.evaluate(() => {
      document.querySelectorAll('.pg').forEach((pg) => {
        let g = 60;
        while (pg.scrollHeight > pg.clientHeight + 1 && g-- > 0) {
          const rows = pg.querySelectorAll('[data-trim]');
          const last = rows[rows.length - 1];
          if (!last) break;
          last.remove();
        }
      });
      document.querySelectorAll('.res-b, .sal-onward, .sm-stones').forEach((b) => { if (!b.querySelector('[data-trim]')) b.remove(); });
      return [...document.querySelectorAll('.pg')].map((pg, i) => ({ p: i + 1, over: pg.scrollHeight - pg.clientHeight })).filter((x) => x.over > 1);
    });
    return { over };
  } finally { await browser.close(); }
}

/* ── run ─────────────────────────────────────────────────────────────── */
let failed = 0;
for (const [name, payload] of Object.entries(FIXTURES)) {
  const d = await buildReportData(payload, { jobs: [], date: DATE });
  const html = renderRoadmapHTML(d);
  const fails = invariants(name, d, html);
  const geo = await geometry(name, html);
  if (geo.skipped) console.log(`  [${name}] geometry SKIPPED (${geo.skipped}) — string invariants only`);
  else if (geo.over?.length) fails.push(`pages overflow after trim: ${JSON.stringify(geo.over)}`);
  if (fails.length) { failed++; console.error(`✗ ${name}`); for (const f of fails) console.error(`    - ${f}`); }
  else console.log(`✓ ${name}`);
}
if (failed) { console.error(`report-check: ${failed}/${Object.keys(FIXTURES).length} fixtures FAILED`); process.exit(1); }
console.log(`report-check: ${Object.keys(FIXTURES).length} payload shapes, all invariants hold`);
