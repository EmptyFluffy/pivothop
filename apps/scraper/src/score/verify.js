import fs from 'node:fs';
import path from 'node:path';
import { readJson, writeJson } from '../lib/store.js';
import { GENERATED_DIR, DATA_DIR } from '../lib/paths.js';
import { listOrigins, loadOrigin } from '../../../../packages/data/src/index.js';

const SNAPSHOT = path.join(DATA_DIR, 'emit-snapshot.json');

// Flatten the current emit into a comparable {origin/dest: match} map plus headline
// counts. This is what stability is measured against between runs.
function fingerprint() {
  const routes = {};
  let originsWithRoutes = 0, totalRoutes = 0;
  for (const idx of listOrigins()) {
    if (idx.insufficient) continue;
    const o = loadOrigin(idx.slug);
    if (!o?.roles) continue;
    originsWithRoutes++;
    for (const r of o.roles) { routes[`${idx.slug}→${r.id}`] = r.match; totalRoutes++; }
  }
  return { routes, originsWithRoutes, totalRoutes };
}

/**
 * Two jobs, both cheap and both real robustness checks:
 *
 *  1. Sanity — the invariants that must hold for the emit to be trustworthy:
 *     every waterfall's earned points reconcile to its displayed match; every
 *     salary band is ordered; no route claims a higher match than its own origin's
 *     posting count can support. Failures are bugs, not drift.
 *
 *  2. Stability — compare this emit against the last snapshot and report per-route
 *     match drift. The acceptance bar (docs/14) is match scores stable across two
 *     independent runs within ±5. `--snapshot` saves the current emit as the new
 *     baseline; a bare `verify` compares against it.
 */
export function verify({ log, snapshot = false } = {}) {
  const problems = [];
  let waterfalls = 0, checkedSalary = 0;

  for (const idx of listOrigins()) {
    if (idx.insufficient) continue;
    const o = loadOrigin(idx.slug);
    if (!o?.roles) continue;
    for (const r of o.roles) {
      if (Array.isArray(r.waterfall) && r.waterfall.length) {
        waterfalls++;
        const earned = r.waterfall.reduce((s, w) => s + w.earned, 0);
        if (Math.abs(earned - r.match) > 1.5) problems.push(`${idx.slug}→${r.id}: waterfall earned ${earned.toFixed(1)} ≠ match ${r.match}`);
        if (r.waterfall.some((w) => w.earned > w.pts + 0.01)) problems.push(`${idx.slug}→${r.id}: a skill earns more than it's worth`);
      }
      if (r.salary_band) {
        checkedSalary++;
        const [lo, hi] = r.salary_band;
        if (!(lo > 0 && hi >= lo)) problems.push(`${idx.slug}→${r.id}: bad salary band [${lo}, ${hi}]`);
      }
      if (r.match < 0 || r.match > 100) problems.push(`${idx.slug}→${r.id}: match ${r.match} out of range`);
    }
  }

  log(`verify/sanity: ${waterfalls} waterfalls reconciled, ${checkedSalary} salary bands checked — ${problems.length ? `${problems.length} PROBLEM(S)` : 'all clean'}`);
  for (const p of problems.slice(0, 20)) log(`  ✗ ${p}`);

  const fp = fingerprint();
  const prev = readJson(SNAPSHOT);
  if (prev?.routes) {
    const shared = Object.keys(fp.routes).filter((k) => k in prev.routes);
    const drifts = shared.map((k) => Math.abs(fp.routes[k] - prev.routes[k]));
    const over5 = shared.filter((k) => Math.abs(fp.routes[k] - prev.routes[k]) > 5);
    const max = drifts.length ? Math.max(...drifts) : 0;
    const mean = drifts.length ? drifts.reduce((s, d) => s + d, 0) / drifts.length : 0;
    const added = Object.keys(fp.routes).filter((k) => !(k in prev.routes)).length;
    const dropped = Object.keys(prev.routes).filter((k) => !(k in fp.routes)).length;
    log(`verify/stability: vs snapshot (${prev.ranAt?.slice(0, 10) ?? '?'}) — ${shared.length} shared routes, mean drift ${mean.toFixed(2)}, max ${max}, ${over5.length} moved >±5; +${added} new routes, -${dropped} gone`);
    for (const k of over5.slice(0, 15)) log(`  Δ ${k}: ${prev.routes[k]} → ${fp.routes[k]}`);
  } else {
    log('verify/stability: no snapshot yet — run `verify --snapshot` after a good run to set the baseline');
  }

  if (snapshot) {
    writeJson(SNAPSHOT, { ranAt: new Date().toISOString(), ...fp });
    log(`verify: snapshot saved (${fp.totalRoutes} routes across ${fp.originsWithRoutes} origins)`);
  }

  return { problems, ...fp };
}
