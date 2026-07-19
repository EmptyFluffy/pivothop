import { readJson, writeJson, supabaseUpsert } from '../lib/store.js';
import { AGGREGATES_FILE, ADJACENCY_FILE } from '../lib/paths.js';

const TOP_K = 48; // sparse but deep: emit-time direct-route comparisons need real numbers, not truncation zeros
const MIN_SHARED_SKILLS = 3; // evidence floor: a pair sharing fewer distinct skills is not scored

/**
 * Occupation-to-occupation adjacency from weighted skill overlap.
 *
 * For each ordered pair (origin -> dest), over the union of both top-20 skill maps
 * (share = fraction of that occupation's postings mentioning the skill):
 *   coverage = Σ_{s∈dest} min(o_s, d_s) / Σ_{s∈dest} d_s — how much of the destination's
 *              demanded skill weight the origin's profile already carries (directional)
 *   jaccard  = Σ min(o_s, d_s) / Σ max(o_s, d_s)     — symmetric profile similarity
 *   match    = round(100 · coverage)                 — the displayed number: a real,
 *              interpretable percentage ("X% of what the destination asks for, you have")
 *
 * Ranking is by match, jaccard as tie-breaker. Pairs sharing fewer than
 * MIN_SHARED_SKILLS distinct skills are not scored at all — thin-profile origins
 * (short descriptions, niche vocabularies) must not produce confident-looking noise.
 *
 * Deterministic given the same aggregates; the ±5-across-runs acceptance tolerance
 * absorbs data drift between scrapes, not algorithmic noise.
 */
export async function adjacency({ log }) {
  const agg = readJson(AGGREGATES_FILE);
  if (!agg) { log('adjacency: no aggregates — run `aggregate` first'); return null; }
  const roles = agg.roles;
  const slugs = Object.keys(roles);

  const maps = {};
  for (const s of slugs) maps[s] = new Map(roles[s].top_skills.map((t) => [t.id, t.share]));

  const out = {};
  for (const o of slugs) {
    const scored = [];
    for (const d of slugs) {
      if (d === o) continue;
      const om = maps[o], dm = maps[d];
      if (!om.size || !dm.size) continue;
      let sumMin = 0, sumMax = 0, cov = 0, covDen = 0, shared = 0;
      const union = new Set([...om.keys(), ...dm.keys()]);
      for (const s of union) {
        const a = om.get(s) ?? 0, b = dm.get(s) ?? 0;
        if (a && b) shared++;
        sumMin += Math.min(a, b);
        sumMax += Math.max(a, b);
      }
      if (shared < MIN_SHARED_SKILLS) continue;
      for (const [s, w] of dm) { covDen += w; cov += Math.min(om.get(s) ?? 0, w); }
      if (!sumMax || !covDen) continue;
      const jaccard = sumMin / sumMax;
      const coverage = cov / covDen;
      const match = Math.round(100 * coverage);
      if (match > 0) scored.push({ dest: d, match, jaccard: +jaccard.toFixed(4), coverage: +coverage.toFixed(4), shared, dest_postings: roles[d].count });
    }
    scored.sort((a, b) => b.match - a.match || b.jaccard - a.jaccard);
    out[o] = scored.slice(0, TOP_K);
  }

  writeJson(ADJACENCY_FILE, { ranAt: new Date().toISOString(), formula: 'match = round(100·destCoverage) over top-20 skill shares; ranked by match then weightedJaccard; pairs sharing <3 skills unscored', topK: TOP_K, origins: out });
  log(`adjacency: scored ${slugs.length} origins, top-${TOP_K} kept per origin`);

  const rows = Object.entries(out).flatMap(([origin, dests]) =>
    dests.map((d) => ({ origin_role_id: origin, dest_role_id: d.dest, match: d.match, jaccard: d.jaccard, coverage: d.coverage }))
  );
  const { mirrored } = await supabaseUpsert('adjacency', rows, 'origin_role_id,dest_role_id');
  if (mirrored) log(`adjacency: mirrored ${mirrored} rows to Supabase`);
  return out;
}
