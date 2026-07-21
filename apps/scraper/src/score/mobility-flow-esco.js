import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { readJson } from '../lib/store.js';
import { TAXONOMY_DIR, PKG_DATA } from '../lib/paths.js';

// EU observed occupation-to-occupation flow (docs/15, Thread 6) from the JobHop resume
// dataset (Flanders/Belgium, CC BY 4.0), derived to an ISCO-08 4-digit transition matrix
// in packages/data/vendor/jobhop. Real observed worker transitions, finer than the US ACS
// resolution (separates interior/product/graphic design). GEOGRAPHY-LABELED and kept
// SEPARATE from the US Oxford signal — Belgian magnitudes are a weak proxy for US rates,
// so this enriches/disambiguates rather than overriding the US flow.

const EDGES_GZ = path.join(PKG_DATA, 'vendor', 'jobhop', 'isco_transitions.json.gz');

let state = null;

function load() {
  if (state) return state;
  const cross = readJson(path.join(TAXONOMY_DIR, 'isco-crosswalk.json')).map;
  const data = JSON.parse(zlib.gunzipSync(fs.readFileSync(EDGES_GZ)).toString('utf8'));
  const flow = new Map(); // fromIsco -> Map(toIsco -> count)
  for (const e of data.edges) {
    if (!flow.has(e.from)) flow.set(e.from, new Map());
    flow.get(e.from).set(e.to, e.n);
  }

  const perOrigin = {}; // slug -> Map(destSlug -> score 0..100)
  const slugs = Object.keys(cross);
  for (const o of slugs) {
    const fi = cross[o];
    const row = flow.get(fi);
    if (!row) continue;
    const dests = [];
    for (const d of slugs) {
      const ti = cross[d];
      if (!ti || ti === fi || d === o) continue; // unresolvable within an ISCO unit group
      const n = row.get(ti);
      if (n) dests.push({ dest: d, n });
    }
    if (!dests.length) continue;
    const max = Math.max(...dests.map((x) => x.n));
    perOrigin[o] = new Map(dests.map((x) => [x.dest, Math.round(100 * x.n / max)]));
  }
  state = { perOrigin };
  return state;
}

/** EU observed-flow score (0..100) for origin->dest, or null when unresolvable/unmapped. */
export function mobilityFlowEscoScore(origin, dest) {
  return load().perOrigin[origin]?.get(dest) ?? null;
}

export function analyzeFlowEsco({ log, origin = 'architect' } = {}) {
  const { perOrigin } = load();
  const occ = Object.fromEntries(readJson(path.join(TAXONOMY_DIR, 'occupations.json')).occupations.map((o) => [o.slug, o]));
  const row = perOrigin[origin];
  if (!row) { log(`mobility-flow-esco: no EU flow for ${origin}`); return null; }
  const ranked = [...row.entries()].map(([dest, score]) => ({ dest, score })).sort((a, b) => b.score - a.score);
  log(`observed EU (Flanders) resume flow from ${occ[origin]?.title ?? origin} — where workers actually go (ISCO-4 resolution):`);
  for (const r of ranked.slice(0, 12)) log(`  ${String(r.score).padStart(3)}  ${occ[r.dest]?.title ?? r.dest}`);
  return ranked;
}
