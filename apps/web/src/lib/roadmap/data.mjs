/* Assembles the report's mechanical half from a route payload (what the graph
   already holds for the selected route) plus the destination's live board rows,
   then hands the whole thing to the prose layer. Pure: no fs, no globals — the
   caller passes board rows and (optionally) an Anthropic key. Used identically
   by /api/roadmap and the local render harness. */

import { buildProse, buildProseAI, parseTime } from './prose.mjs';

const abbr = (s) => String(s || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'XXX';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// A kid (second-hop) arrives without a waterfall; synthesize a coherent one from
// its have/learn lists so the report still reads, points summing to ~100.
function synthWaterfall(have = [], learn = [], match) {
  const H = have.length, L = learn.length, n = H + L || 1;
  const wf = [];
  // Held points MUST equal the route's real match. This used a hardcoded 62/38
  // split, so a bridged 32% route rendered a cover saying 32% and a page 2
  // saying "62.0 already yours" — two different answers to the same question in
  // one document. Tapered by rank as before; only the totals are honest now.
  const hPts = Math.min(95, Math.max(5, Number(match) || 62)), gPts = 100 - hPts;
  have.forEach((name, i) => { const p = +(hPts * (H - i) / (H * (H + 1) / 2 || 1)).toFixed(1); wf.push({ name, pts: p, earned: p }); });
  learn.forEach((name, i) => { const p = +(gPts * (L - i) / (L * (L + 1) / 2 || 1)).toFixed(1); wf.push({ name, pts: p, earned: 0 }); });
  return wf.length ? wf : [{ name: 'Core skills', pts: 100, earned: 60 }];
}

// board rows -> { open, companies:[[name,count]...] }, one row per company, top 4
function boardSummary(jobs = []) {
  const m = new Map();
  for (const j of jobs) m.set(j.company, (m.get(j.company) || 0) + 1);
  const companies = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  return { open: jobs.length, companies };
}

/**
 * @param {object} p  route payload: { origin, dest, alternates?, routeCount? }
 * @param {object} opts { jobs?: board rows for dest, apiKey?, date?: Date|string }
 * @returns {Promise<object>} the full `d` for renderRoadmapHTML
 */
export async function buildReportData(p, opts = {}) {
  const date = opts.date ? new Date(opts.date) : new Date(0);
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mo = String(date.getUTCMonth() + 1).padStart(2, '0');

  const dest = p.dest || {};
  const waterfall = (Array.isArray(dest.waterfall) && dest.waterfall.length)
    ? dest.waterfall.map((w) => ({ name: w.name || w.skill, pts: +w.pts, earned: +(w.earned ?? 0) }))
    : synthWaterfall(dest.have, dest.learn, dest.match);

  const salBand = (band, fallback) => (Array.isArray(band) && band.length === 2 ? band.map(Number) : fallback);

  const d = {
    meta: {
      reportId: `PH·${abbr(p.origin?.title)}→${abbr(dest.title)}·${mo}${dd}`,
      generated: `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`,
    },
    origin: {
      title: p.origin?.title || 'Your role',
      postings: Number(p.origin?.postings) || 0,
      salary_band: salBand(p.origin?.salary_band, [0, 0]),
    },
    dest: {
      id: dest.id || dest.slug || 'role',
      title: dest.title || 'Destination',
      match: Math.round(Number(dest.match) || 0),
      capability: dest.capability != null ? Math.round(Number(dest.capability)) : null,
      mobility: dest.mobility != null ? Math.round(Number(dest.mobility)) : null,
      mobilitySource: dest.mobility_source || dest.mobilitySource || null,
      salary: dest.salary || '—',
      salary_band: salBand(dest.salary_band, [0, 0]),
      demand: dest.demand || 'Moderate',
      remote: dest.remote || '—',
      time: dest.time || '12–18 mo',
      license: dest.license || null,
      provenance: {
        postings: Number(dest.provenance?.postings) || Number(dest.postings) || 0,
        salaried: Number(dest.provenance?.salaried) || 0,
      },
      rank: p.rank || null,
    },
    routeCount: p.routeCount || null,
    // Pass-throughs for the report's "what this position unlocks" surfaces.
    onward: Array.isArray(p.onward) ? p.onward.slice(0, 3) : [],
    bridge: p.bridge || null,
    destSeniority: p.seniority || null,
    waterfall,
    alternates: Array.isArray(p.alternates) ? p.alternates.slice(0, 3).map((a) => ({
      title: a.title, match: Math.round(Number(a.match) || 0), gate: a.gate || (a.license ? 'License · slower' : '—'),
    })) : [],
    board: boardSummary(opts.jobs),
  };
  const [lo, hi] = parseTime(d.dest.time);
  d.timeMonths = { lo, hi };

  const prose = opts.apiKey ? await buildProseAI(d, opts.apiKey) : buildProse(d);
  return { ...d, ...prose };
}
