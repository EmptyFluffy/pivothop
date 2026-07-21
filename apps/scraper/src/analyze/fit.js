import path from 'node:path';
import { readJson } from '../lib/store.js';
import { TAXONOMY_DIR, ADJACENCY_FILE } from '../lib/paths.js';
import { loadCapabilities, capabilitySimilarity } from './capability.js';
import { mobilityScore, mobilityTier } from '../score/mobility.js';

// The combined fit (docs/15, Thread 7), as an analysis before it's wired into emit.
//   R = skill readiness (coverage), the differentiator, personalizable, always present
//   C = capability similarity (O*NET abilities), the durable backbone, 0..100 per-origin
//   M = observed-mobility prior (O*NET Related), corroboration, sparse
//   fit = wR·R + wC·C + wM·M over whatever signals exist (re-weighted, never a black box)
const W = { R: 0.55, C: 0.2, M: 0.25 };

export function analyzeFit({ log, origin = 'architect' } = {}) {
  const adj = readJson(ADJACENCY_FILE)?.origins?.[origin];
  if (!adj) { log(`analyze:fit — no adjacency for ${origin}; run score first`); return null; }
  const cap = loadCapabilities();
  const occ = Object.fromEntries(readJson(path.join(TAXONOMY_DIR, 'occupations.json')).occupations.map((o) => [o.slug, o]));

  // Capability sim is cosine (can be small/negative); normalize per-origin to 0..100 over
  // the candidates we actually rank, so it composes with R and M on the same scale.
  const cands = adj.map((x) => x.dest);
  const rawC = new Map(cands.map((d) => [d, cap?.vectors?.[origin] && cap?.vectors?.[d] ? capabilitySimilarity(cap.vectors, origin, d) : null]));
  const cVals = [...rawC.values()].filter((v) => v != null);
  const cMin = Math.min(...cVals, 0), cMax = Math.max(...cVals, 1);
  const normC = (v) => (v == null ? null : Math.round(100 * (v - cMin) / (cMax - cMin || 1)));

  const rows = adj.map((x) => {
    const R = x.match;
    const C = normC(rawC.get(x.dest));
    const M = mobilityScore(origin, x.dest);
    // re-weight over present signals so a missing C or M doesn't just drag fit to zero
    const parts = [[W.R, R], [W.C, C], [W.M, M]].filter(([, v]) => v != null);
    const wsum = parts.reduce((s, [w]) => s + w, 0);
    const fit = Math.round(parts.reduce((s, [w, v]) => s + w * v, 0) / wsum);
    return { dest: x.dest, R, C, M, fit, mtier: mobilityTier(origin, x.dest) };
  });

  const byFit = [...rows].sort((a, b) => b.fit - a.fit);
  const byR = [...rows].sort((a, b) => b.R - a.R);
  const rankR = new Map(byR.map((r, i) => [r.dest, i]));

  log(`combined fit for ${occ[origin]?.title ?? origin}  (weights R${W.R} C${W.C} M${W.M}; C normalized per-origin, — = no data):`);
  log(`  fit  R   C   M    Δrank  destination`);
  for (const r of byFit.slice(0, 16)) {
    const drank = rankR.get(r.dest) - byFit.indexOf(r);
    const arrow = drank > 0 ? `↑${drank}` : drank < 0 ? `↓${-drank}` : ' 0';
    const cell = (v) => (v == null ? ' — ' : String(v).padStart(3));
    log(`  ${String(r.fit).padStart(3)} ${cell(r.R)} ${cell(r.C)} ${cell(r.M)}  ${arrow.padStart(5)}  ${occ[r.dest]?.title ?? r.dest}${r.mtier ? ` · ${r.mtier}` : ''}`);
  }
  return byFit;
}
