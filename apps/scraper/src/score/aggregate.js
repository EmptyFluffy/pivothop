import { readNdjson, writeJson, supabaseUpsert } from '../lib/store.js';
import { POSTINGS_FILE, AGGREGATES_FILE } from '../lib/paths.js';

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo));
}

/**
 * Per-occupation aggregates: posting count, salary p25/p50/p75 (only rows with a
 * real, stated-or-inferred salary), remote share, top-20 skill frequencies.
 */
export async function aggregate({ log }) {
  const postings = readNdjson(POSTINGS_FILE);
  if (!postings.length) { log('aggregate: no normalized postings — run `normalize` first'); return null; }

  const byRole = new Map();
  for (const p of postings) {
    if (!byRole.has(p.role_id)) byRole.set(p.role_id, []);
    byRole.get(p.role_id).push(p);
  }

  const roles = {};
  for (const [slug, rows] of byRole) {
    const mids = rows
      .filter((r) => r.salary_usd_min)
      .map((r) => (r.salary_usd_min + (r.salary_usd_max ?? r.salary_usd_min)) / 2)
      .sort((a, b) => a - b);
    const skillCounts = new Map();
    for (const r of rows) for (const s of r.skills) skillCounts.set(s, (skillCounts.get(s) ?? 0) + 1);
    // Support floor (the dental-hygienist lesson): a skill enters a role's
    // profile only with real evidence — ≥3 postings AND ≥2% share. Without it,
    // a 2-in-390 fluke ("Airflow" the dental polishing device) ranks in the
    // top-20 of a skill-poor occupation and poisons every route into it.
    const topSkills = [...skillCounts.entries()]
      .filter(([, n]) => n >= 3 && n / rows.length >= 0.02)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([id, n]) => ({ id, share: +(n / rows.length).toFixed(4) }));
    roles[slug] = {
      count: rows.length,
      salaried_count: mids.length,
      salary_p25: percentile(mids, 0.25),
      salary_p50: percentile(mids, 0.5),
      salary_p75: percentile(mids, 0.75),
      remote_share: +(rows.filter((r) => r.remote_flag).length / rows.length).toFixed(3),
      top_skills: topSkills,
    };
  }

  writeJson(AGGREGATES_FILE, { ranAt: new Date().toISOString(), roles });
  log(`aggregate: ${byRole.size} occupations with postings (largest: ${[...byRole.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 3).map(([s, r]) => `${s}=${r.length}`).join(', ')})`);

  const { mirrored } = await supabaseUpsert(
    'role_aggregates',
    Object.entries(roles).map(([role_id, a]) => ({ role_id, ...a, top_skills: a.top_skills })),
    'role_id'
  );
  if (mirrored) log(`aggregate: mirrored ${mirrored} rows to Supabase`);
  return roles;
}
