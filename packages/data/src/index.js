import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const GENERATED_DIR = path.join(PKG_ROOT, 'generated');

/**
 * The contract the graph consumes. Per-origin file shape (version 1):
 * {
 *   origin: { slug, title, field, postings, salary, remote },
 *   roles:  [{ id, title, field, desc, match, salary, demand, remote, time,
 *              have[], learn[], low_confidence, provenance: {postings, salaried} }],  // top-8 first hops
 *   next:   { [roleId]: [{ t, m, slug }] },                                            // second hops
 *   cross:  [[roleIdA, roleIdB, w]],                                                   // skill-overlap links
 *   bridges:[[roleId, kidId, w]],           // kidId is "parentId_index" — load-bearing, see docs/13-graph-spec.md
 * }
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
