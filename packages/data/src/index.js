import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const GENERATED_DIR = path.join(PKG_ROOT, 'generated');

/**
 * The contract the graph consumes. Per-origin file shape (version 2):
 * {
 *   origin: { slug, title, field, cluster, postings, salary, salary_band: [p25, p75], remote },
 *   roles:  [{ id, title, field, cluster, kind, desc,
 *              match,       // skill readiness (R) — the HEADLINE number, drives the graph
 *              fit, capability, mobility, mobility_source, mobility_eu, mobility_tier,  // secondary:
 *                                                          // fit = blend of R + C + M, decomposed in the rail.
 *                                                          // mobility_source: 'observed-flow-us' (Oxford CPS) |
 *                                                          // 'observed-flow-eu' (JobHop, Belgium) | 'related'.
 *                                                          // mobility_eu: EU observed flow (Belgium), separate,
 *                                                          // finer resolution, geography-labeled; any may be null
 *              salary, salary_band, demand, remote, time,
 *              have[], learn[],
 *              waterfall: [{ skill, name, pts, earned }],  // coverage decomposed per skill;
 *                                                          // earned sums to match — the structured
 *                                                          // route doc the export narrates from
 *              low_confidence, observed, provenance: {postings, salaried} }],  // ring 1: top-8 by readiness
 *   next:   { [roleId]: [{ t, m, slug, field, cluster, kind, gap[], reach:'bridged',
 *                          via: { parent, readiness_after, gain } }] },
 *              // ring 2 BRIDGED: a first-hop unlocks these; via documents the unlock
 *   direct: [{ t, m, slug, field, cluster, kind, gap[], reach:'direct' }],
 *              // ring 2 DIRECT: reachable from the origin's own skills, standalone, no bridge.
 *              // gap[] is the missing skills to be ready to apply. (docs/15, Thread 2)
 *   cross:  [[roleIdA, roleIdB, w]],                       // skill-overlap links between first hops
 *   bridges:[[roleId, kidId, w]],  // a second parent that also unlocks the kid;
 *                                  // kidId is "parentId_index" — load-bearing, see docs/13-graph-spec.md
 * }
 * kind is 'lateral' (same industry cluster as origin) or 'pivot' (crosses it). (docs/15, Thread 1)
 * Origins below the confidence floor instead carry { insufficient: true } — the UI
 * shows the honest empty state, never invented routes.
 */
export function listOrigins() {
  const idx = path.join(GENERATED_DIR, 'index.json');
  if (!fs.existsSync(idx)) return [];
  return JSON.parse(fs.readFileSync(idx, 'utf8')).origins;
}

export function loadOrigin(slug) {
  const file = path.join(GENERATED_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function loadTaxonomy() {
  return JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'taxonomy', 'occupations.json'), 'utf8'));
}
