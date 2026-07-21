import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { readJson } from '../lib/store.js';
import { TAXONOMY_DIR, PKG_DATA } from '../lib/paths.js';

// Observed occupation-to-occupation FLOW (docs/15, Thread 6). Real behavioral mobility from
// the Oxford CPS-derived occupational_mobility_network (2010–2017, CC BY 4.0, vendored in
// packages/data/vendor/omn). Row i -> col j is the empirical probability a worker moves from
// occupation i to j. This is the "humans-actually-gravitate-here" signal — genuine flow, not
// curated relatedness or skill similarity. Joined to our taxonomy via taxonomy/acs-crosswalk.json.
//
// Resolution ceiling: ACS is coarser than our taxonomy (one "designers" bucket for UX/graphic/
// interior/…), so our occupations sharing an ACS id can't be resolved against each other — those
// pairs return null and the fit falls back to the other signals.

const MATRIX_GZ = path.join(PKG_DATA, 'vendor', 'omn', 'occupational_mobility_network.csv.gz');

let state = null;

function load() {
  if (state) return state;
  const map = readJson(path.join(TAXONOMY_DIR, 'acs-crosswalk.json')).map;
  const text = zlib.gunzipSync(fs.readFileSync(MATRIX_GZ)).toString('utf8');
  const matrix = text.trim().split('\n').map((line) => line.split(',').map(Number));

  // Per-origin normalized flow among OUR taxonomy destinations, excluding self and same-ACS-bucket.
  const perOrigin = {}; // slug -> Map(destSlug -> {score, weight})
  const slugs = Object.keys(map);
  for (const o of slugs) {
    const ai = map[o];
    if (ai == null || !matrix[ai]) continue;
    const dests = [];
    for (const d of slugs) {
      const aj = map[d];
      if (aj == null || aj === ai || d === o) continue; // unresolvable within an ACS bucket
      const w = matrix[ai][aj];
      if (w > 0) dests.push({ dest: d, weight: w });
    }
    if (!dests.length) continue;
    const max = Math.max(...dests.map((x) => x.weight));
    perOrigin[o] = new Map(dests.map((x) => [x.dest, { score: Math.round(100 * x.weight / max), weight: x.weight }]));
  }
  state = { perOrigin };
  return state;
}

/** Observed-flow M (0..100) for origin->dest, or null when unresolvable (unmapped or same ACS bucket). */
export function mobilityFlowScore(origin, dest) {
  return load().perOrigin[origin]?.get(dest)?.score ?? null;
}

export function mobilityFlowExists() {
  return fs.existsSync(MATRIX_GZ);
}

// Verification: the top real destinations workers actually move to, from an origin.
export function analyzeFlow({ log, origin = 'architect' } = {}) {
  const { perOrigin } = load();
  const occ = Object.fromEntries(readJson(path.join(TAXONOMY_DIR, 'occupations.json')).occupations.map((o) => [o.slug, o]));
  const row = perOrigin[origin];
  if (!row) { log(`mobility-flow: no observed flow for ${origin} (unmapped in acs-crosswalk)`); return null; }
  const ranked = [...row.entries()].map(([dest, v]) => ({ dest, ...v })).sort((a, b) => b.score - a.score);
  log(`observed CPS flow from ${occ[origin]?.title ?? origin} — where workers actually go (ACS resolution):`);
  for (const r of ranked.slice(0, 12)) log(`  ${String(r.score).padStart(3)}  ${occ[r.dest]?.title ?? r.dest}`);
  return ranked;
}
