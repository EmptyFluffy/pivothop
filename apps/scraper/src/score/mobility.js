import path from 'node:path';
import { readJson } from '../lib/store.js';
import { TAXONOMY_DIR } from '../lib/paths.js';

// Observed-mobility prior M (docs/15, Thread 6). HONEST SCOPE: no free occupation->occupation
// flow matrix exists (that needs IPUMS CPS microdata, a real project — or PivotHop's own
// future usage data, the flywheel). So the best obtainable near-term signal is O*NET's
// curated "related occupations": experts saying these transitions are real. It is a
// corroboration prior, not "% who move", and it is labeled that way in the UI.
//
// Base-rate normalized: a destination that is "related" to almost every origin (a popular
// sink) carries less signal than one specifically related to THIS origin. We damp by the
// destination's in-degree across all origins so popularity doesn't swamp specificity.

const TIER_WEIGHT = { 'Primary-Short': 1.0, 'Primary-Long': 0.62, Supplemental: 0.34 };

let built = null;

export function buildMobility() {
  if (built) return built;
  const pairs = readJson(path.join(TAXONOMY_DIR, 'related-occupations.json'))?.pairs ?? {};
  // in-degree: how many origins list each dest as related (popularity / base rate)
  const inDeg = new Map();
  for (const rels of Object.values(pairs)) for (const r of rels) inDeg.set(r.slug, (inDeg.get(r.slug) ?? 0) + 1);
  const degs = [...inDeg.values()];
  const meanDeg = degs.length ? degs.reduce((a, b) => a + b, 0) / degs.length : 1;

  const M = {}; // origin -> Map(dest -> {score 0..100, tier})
  for (const [origin, rels] of Object.entries(pairs)) {
    const raw = rels.map((r) => {
      const tier = r.tier;
      const tw = TIER_WEIGHT[tier] ?? 0.3;
      const damp = Math.sqrt(meanDeg / Math.max(1, inDeg.get(r.slug) ?? 1)); // <1 for popular sinks
      return { dest: r.slug, tier, raw: tw * damp };
    });
    const max = Math.max(1e-9, ...raw.map((x) => x.raw));
    M[origin] = new Map(raw.map((x) => [x.dest, { score: Math.round(100 * x.raw / max), tier: x.tier }]));
  }
  built = M;
  return M;
}

/** M(origin -> dest) in 0..100, or null when the pair isn't attested (graceful fallback). */
export function mobilityScore(origin, dest) {
  return buildMobility()[origin]?.get(dest)?.score ?? null;
}
export function mobilityTier(origin, dest) {
  return buildMobility()[origin]?.get(dest)?.tier ?? null;
}
