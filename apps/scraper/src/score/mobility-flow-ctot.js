import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { readJson } from '../lib/store.js';
import { TAXONOMY_DIR, PKG_DATA } from '../lib/paths.js';

// Observed US transitions from the DOL CTOT CPS/SIPP public-use dataset (docs/18):
// survey-weighted person-level moves, ~2020 vintage, SOC-2018 hybrid codes. Fresher
// than the Oxford OMN window (2010–2017) and SOC-coded (finer than ACS on some
// families), but origin coverage is restricted to "mid-level" occupations — so this
// is the SECOND link in the US flow chain: it corroborates and fills where it can,
// and silence here never counts against a pair.
//
// SOC codes arrive at three levels; a vendor code matches a slug's detailed SOC when
// it is the same code, its broad ##-###0 parent, or a masked ##-###X prefix.

const PAIRS_GZ = path.join(PKG_DATA, 'vendor', 'ctot', 'cps-sipp-transitions.json.gz');
const MIN_CELL_N = 3; // unweighted persons per SOC pair below this are noise, not signal

let state = null;

function socMatchesSlug(code, soc) {
  if (code === soc) return true;
  if (code.endsWith('X')) return soc.startsWith(code.slice(0, -1));
  if (code.endsWith('0') && code !== soc) return soc.slice(0, 6) === code.slice(0, 6);
  return false;
}

function load() {
  if (state) return state;
  const occ = readJson(path.join(TAXONOMY_DIR, 'occupations.json')).occupations;
  const socOf = {};
  for (const o of occ) if (o.soc) socOf[o.slug] = o.soc.split('.')[0];

  const data = JSON.parse(zlib.gunzipSync(fs.readFileSync(PAIRS_GZ)).toString('utf8'));
  // vendor code -> matching slugs, computed once over the distinct codes
  const codes = new Set();
  for (const [f, t] of data.pairs) { codes.add(f); codes.add(t); }
  const codeSlugs = new Map();
  for (const code of codes) {
    const hits = Object.entries(socOf).filter(([, soc]) => socMatchesSlug(code, soc)).map(([slug]) => slug);
    if (hits.length) codeSlugs.set(code, hits);
  }

  const acc = {}; // origin -> Map(dest -> {w, n})
  for (const [f, t, w, n] of data.pairs) {
    const os = codeSlugs.get(f), ds = codeSlugs.get(t);
    if (!os || !ds) continue;
    // A broad/masked code matching k of our slugs is evidence for "one of those k",
    // not for each of them — split the weight AND the count across the fan-out, or
    // four people moving to "designers" would count as four whole moves to every
    // specific design occupation we track.
    const k = os.length * ds.length;
    for (const o of os) {
      for (const d of ds) {
        if (o === d || socOf[o] === socOf[d]) continue; // unresolvable within a SOC bucket
        const m = (acc[o] ??= new Map());
        const cell = m.get(d) ?? { w: 0, n: 0 };
        cell.w += w / k; cell.n += n / k;
        m.set(d, cell);
      }
    }
  }
  const perOrigin = {};
  for (const [o, m] of Object.entries(acc)) {
    const kept = [...m.entries()].filter(([, c]) => c.n >= MIN_CELL_N);
    if (!kept.length) continue;
    const max = Math.max(...kept.map(([, c]) => c.w));
    perOrigin[o] = new Map(kept.map(([d, c]) => [d, { score: Math.round(100 * c.w / max), n: Math.round(c.n * 10) / 10 }]));
  }
  state = { perOrigin };
  return state;
}

/** CTOT observed-flow score (0..100) for origin->dest, or null when uncovered. */
export function mobilityFlowCtotScore(origin, dest) {
  return load().perOrigin[origin]?.get(dest)?.score ?? null;
}

export function analyzeFlowCtot({ log, origin = 'electrician' } = {}) {
  const { perOrigin } = load();
  const occ = Object.fromEntries(readJson(path.join(TAXONOMY_DIR, 'occupations.json')).occupations.map((o) => [o.slug, o]));
  const row = perOrigin[origin];
  if (!row) { log(`mobility-flow-ctot: no CTOT flow for ${origin} (mid-level origins only; unmapped or uncovered)`); return null; }
  const ranked = [...row.entries()].map(([dest, v]) => ({ dest, ...v })).sort((a, b) => b.score - a.score);
  log(`observed CTOT (CPS/SIPP ~2020) flow from ${occ[origin]?.title ?? origin} — where workers actually went:`);
  for (const r of ranked.slice(0, 12)) log(`  ${String(r.score).padStart(3)}  ${occ[r.dest]?.title ?? r.dest} (n=${r.n})`);
  return ranked;
}
