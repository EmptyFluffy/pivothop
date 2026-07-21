import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { DATA_DIR, GENERATED_DIR, TAXONOMY_DIR } from '../lib/paths.js';
import { readJson, writeJson } from '../lib/store.js';
import { extractRegion, extractSeniority } from '../normalize/region.js';

/* FairElephant's engine: precise salary bands per occupation.
 *
 * Two layers, fused:
 *  - live postings (this month's asking prices, remote split, global reach)
 *  - official anchors (BLS OEWS percentiles by SOC x US state; World Bank
 *    price levels by country)
 * US cells are SHRUNK toward the OEWS anchor with a pseudo-count (empirical
 * Bayes): blended = (n*postings + K*anchor) / (n + K). Small samples lean on
 * the anchor; big samples speak for themselves. Every cell ships its n and
 * all three numbers (posted / anchor / blended) — the method is inspectable.
 *
 * Floors: a cell below MIN_CELL observations emits nothing (honest empty).
 * Sanity: observations outside [$8k, $900k] annual USD are dropped; per-cell
 * percentiles are computed on the trimmed middle 98% to shed entry errors.
 */

const MIN_CELL = 30;
const MIN_REMOTE_SPLIT = 30;
const SHRINK_K = 40;
const PCTS = [10, 25, 50, 75, 90];

function pct(sorted, p) {
  if (!sorted.length) return null;
  const i = (sorted.length - 1) * (p / 100);
  const lo = Math.floor(i), hi = Math.ceil(i);
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo));
}
function bands(values) {
  if (values.length < MIN_CELL) return null;
  const s = [...values].sort((a, b) => a - b);
  const cut = Math.floor(s.length * 0.01);
  const t = s.slice(cut, s.length - cut || undefined);
  const out = { n: values.length };
  for (const p of PCTS) out['p' + p] = pct(t, p);
  return out;
}
function blend(post, anchor) {
  if (!post && !anchor) return null;
  if (!anchor) return { ...post, basis: 'postings' };
  if (!post) return { ...anchor, n: 0, basis: 'anchor' };
  const n = post.n, out = { n, basis: 'blended' };
  for (const p of PCTS) {
    const k = 'p' + p;
    out[k] = (post[k] != null && anchor[k] != null)
      ? Math.round((n * post[k] + SHRINK_K * anchor[k]) / (n + SHRINK_K))
      : (post[k] ?? anchor[k]);
  }
  return out;
}

async function loadObservations(log) {
  // location strings live in the raw store; join by source:external_id
  const locByKey = new Map();
  const rawRl = readline.createInterface({ input: fs.createReadStream(path.join(DATA_DIR, 'postings_raw.ndjson')) });
  for await (const line of rawRl) {
    try {
      const r = JSON.parse(line);
      if (r.location) locByKey.set(r.source + ' ' + r.external_id, r.location);
    } catch { /* skip corrupt line */ }
  }
  const obs = [];
  const rl = readline.createInterface({ input: fs.createReadStream(path.join(DATA_DIR, 'postings.ndjson')) });
  for await (const line of rl) {
    let r; try { r = JSON.parse(line); } catch { continue; }
    if (!r.role_id || (!r.salary_usd_min && !r.salary_usd_max)) continue;
    const lo = r.salary_usd_min || r.salary_usd_max, hi = r.salary_usd_max || r.salary_usd_min;
    const mid = (lo + hi) / 2;
    if (mid < 8000 || mid > 900000) continue;
    const location = locByKey.get(r.source + ' ' + r.external_id) || '';
    // country: stored field, else source-implied (usajobs=US, reed=GB, adzuna
    // encodes it in the external_id prefix), else region parse from location
    let country = r.country || null;
    if (!country) {
      if (r.source === 'usajobs') country = 'US';
      else if (r.source === 'reed') country = 'GB';
      else if (r.source === 'adzuna') {
        const m = String(r.external_id).match(/^([a-z]{2}):/);
        if (m) country = m[1].toUpperCase();
      }
    }
    if (!country && extractRegion(location, 'US')) country = 'US';
    obs.push({
      slug: r.role_id,
      usd: Math.round(mid),
      country,
      region: extractRegion(location, country),
      remote: r.remote_flag === true || r.remote_flag === 'True' || r.remote_flag === 'true',
      seniority: extractSeniority(r.title_raw),
      source: r.source,
    });
  }
  log(`salaries: ${obs.length} usable observations`);
  return obs;
}

export async function salaryBands({ log }) {
  const occs = readJson(path.join(TAXONOMY_DIR, 'occupations.json')).occupations;
  const socOf = Object.fromEntries(occs.map((o) => [o.slug, (o.soc || '').split('.')[0] || null]));
  const titleOf = Object.fromEntries(occs.map((o) => [o.slug, o.title]));
  const oews = readJson(path.join(TAXONOMY_DIR, '../vendor/oews/wages.json'))?.wages ?? {};
  const wb = readJson(path.join(TAXONOMY_DIR, '../vendor/worldbank/price-levels.json'))?.levels ?? {};

  const obs = await loadObservations(log);
  const bySlug = new Map();
  for (const o of obs) {
    if (!bySlug.has(o.slug)) bySlug.set(o.slug, []);
    bySlug.get(o.slug).push(o);
  }

  const outDir = path.join(GENERATED_DIR, 'salaries');
  fs.mkdirSync(outDir, { recursive: true });
  const index = [];
  const recon = [];

  for (const [slug, rows] of bySlug) {
    const soc = socOf[slug];
    const anchor = soc && oews[soc] ? oews[soc] : null;
    const all = bands(rows.map((r) => r.usd));

    // per-country posted bands
    const byCountry = {};
    const countries = {};
    rows.forEach((r) => { if (r.country) (countries[r.country] ??= []).push(r); });
    for (const [c, rs] of Object.entries(countries)) {
      const b = bands(rs.map((r) => r.usd));
      if (!b) continue;
      const entry = { posted: b, price_level: wb[c]?.price_level ?? null };
      if (c === 'US' && anchor?.US) {
        entry.anchor = anchor.US;
        entry.blended = blend(b, anchor.US);
        // per-state where both sides have data
        const states = {};
        const byState = {};
        rs.forEach((r) => { if (r.region) (byState[r.region] ??= []).push(r.usd); });
        for (const [st, vals] of Object.entries(byState)) {
          const sb = bands(vals);
          const sa = anchor.states?.[st] ?? null;
          if (sb || sa) states[st] = { posted: sb, anchor: sa, blended: blend(sb, sa) };
        }
        if (Object.keys(states).length) entry.states = states;
      } else {
        entry.blended = blend(b, null);
      }
      byCountry[c] = entry;
    }

    // remote split (US-dominant corpus; compute per country when both sides clear the floor)
    let remote = null;
    const rem = rows.filter((r) => r.remote).map((r) => r.usd);
    const ons = rows.filter((r) => !r.remote).map((r) => r.usd);
    if (rem.length >= MIN_REMOTE_SPLIT && ons.length >= MIN_REMOTE_SPLIT) {
      const rb = bands(rem), ob = bands(ons);
      if (rb && ob) remote = { remote: rb, onsite: ob, premium_pct: Math.round(100 * (rb.p50 - ob.p50) / ob.p50) };
    }

    // seniority tiers
    const seniority = {};
    for (const tier of ['junior', 'mid', 'senior', 'lead']) {
      const b = bands(rows.filter((r) => r.seniority === tier).map((r) => r.usd));
      if (b) seniority[tier] = b;
    }

    // reconciliation: posted US median vs OEWS median
    if (byCountry.US?.posted && anchor?.US?.p50) {
      const dev = Math.round(100 * (byCountry.US.posted.p50 - anchor.US.p50) / anchor.US.p50);
      recon.push({ slug, posted_p50: byCountry.US.posted.p50, oews_p50: anchor.US.p50, deviation_pct: dev, n: byCountry.US.posted.n, flag: Math.abs(dev) > 30 });
    }

    const doc = {
      slug, title: titleOf[slug] || slug, soc,
      updated: new Date().toISOString().slice(0, 10),
      observations: rows.length,
      global: all,
      by_country: byCountry,
      remote,
      seniority: Object.keys(seniority).length ? seniority : null,
      anchor_source: anchor ? 'BLS OEWS May 2024' : null,
      price_level_source: 'World Bank ICP 2023',
    };
    writeJson(path.join(outDir, `${slug}.json`), doc);
    index.push({ slug, title: doc.title, observations: rows.length, has_anchor: !!anchor, countries: Object.keys(byCountry).length, remote_split: !!remote });
  }

  index.sort((a, b) => b.observations - a.observations);
  writeJson(path.join(outDir, 'index.json'), { generated: new Date().toISOString(), occupations: index });
  writeJson(path.join(DATA_DIR, 'salary-reconciliation.json'), { generated: new Date().toISOString(), rows: recon.sort((a, b) => Math.abs(b.deviation_pct) - Math.abs(a.deviation_pct)) });

  const flagged = recon.filter((r) => r.flag).length;
  log(`salaries: ${index.length} occupation files → generated/salaries/ · ${recon.length} US reconciliations, ${flagged} flagged >30% off anchor`);
  return index.length;
}
