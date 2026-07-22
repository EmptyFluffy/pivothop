import fs from 'node:fs';
import path from 'node:path';
import { readJson } from '../lib/store.js';
import { TAXONOMY_DIR, PKG_DATA } from '../lib/paths.js';

// BLS Employment Projections Table 1.10 (docs/18): per-SOC annual average
// occupational TRANSFER rate (share who leave for a different occupation),
// labor force EXIT rate, and openings. The honest per-origin base rate — how
// often people actually leave — with no destination claim attached. Public
// domain; vendored by scripts/build-mobility-vendor.py.

const SEP_FILE = path.join(PKG_DATA, 'vendor', 'bls-ep', 'separations.json');

let state = null;

function load() {
  if (state) return state;
  if (!fs.existsSync(SEP_FILE)) { state = { socs: {}, vintage: null, all: null }; return state; }
  const d = readJson(SEP_FILE);
  const occ = readJson(path.join(TAXONOMY_DIR, 'occupations.json')).occupations;
  const bySlug = {};
  for (const o of occ) {
    if (!o.soc) continue;
    const soc = o.soc.split('.')[0];
    // detailed first, then the broad ##-###0 parent (some taxonomy SOCs sit
    // at levels the projections table rolls up)
    const hit = d.socs[soc] ?? d.socs[soc.slice(0, 6) + '0'] ?? null;
    if (hit) bySlug[o.slug] = { transfer: hit.transfer, exit: hit.exit, total: hit.total, openings: hit.openings };
  }
  state = { bySlug, vintage: d.vintage, all: d.all_occupations };
  return state;
}

/** {transfer, exit, total, openings} for a slug, or null. Rates are annual-average percent. */
export function separationsForSlug(slug) {
  return load().bySlug[slug] ?? null;
}

export function separationsVintage() {
  return load().vintage;
}
