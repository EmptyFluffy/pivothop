import { readNdjsonSafe, readJson, writeJson } from '../lib/store.js';
import { POSTINGS_FILE, AGGREGATES_FILE, TAXONOMY_DIR, DATA_DIR } from '../lib/paths.js';
import path from 'node:path';

// Finding 1 of the Adjacency Index, computed: the skills that appear most in an
// origin's postings but are NOT native to its field — the "bridge skills" that carry
// a person toward adjacent work. Every number is reproduced from the scrape, so the
// launch chart never hand-types a statistic. Also computes the pay angle (Finding 2):
// do the origin's postings that name a bridge skill pay more than those that don't?

const DEMAND_FLOOR = 0.12; // a skill "belongs to" an occupation if >=12% of its postings name it
const NATIVE_FIELDS = new Set(['Architecture', 'Construction']); // origin-native fields for architecture

export function bridgeSkills({ log, origin = 'architect', top = 8 } = {}) {
  const agg = readJson(AGGREGATES_FILE)?.roles;
  const occ = readJson(path.join(TAXONOMY_DIR, 'occupations.json')).occupations;
  const skillDict = Object.fromEntries(readJson(path.join(TAXONOMY_DIR, 'skills.json')).skills.map((s) => [s.id, s.name]));
  const fieldBySlug = Object.fromEntries(occ.map((o) => [o.slug, o.field]));
  if (!agg?.[origin]) { log(`bridge-skills: no aggregate for ${origin}`); return null; }

  const oAgg = agg[origin];
  const nativeFields = origin === 'architect' ? NATIVE_FIELDS : new Set([fieldBySlug[origin]]);

  // For each skill: which occupations demand it (>= floor), split native vs non-native field.
  const demandedBy = new Map();
  for (const [slug, a] of Object.entries(agg)) {
    for (const t of a.top_skills ?? []) {
      if (t.share < DEMAND_FLOOR) continue;
      if (!demandedBy.has(t.id)) demandedBy.set(t.id, []);
      demandedBy.get(t.id).push(slug);
    }
  }

  const ranked = [];
  for (const t of oAgg.top_skills ?? []) {
    const others = (demandedBy.get(t.id) ?? []).filter((s) => s !== origin);
    const nonNativeFields = new Set(others.map((s) => fieldBySlug[s]).filter((f) => !nativeFields.has(f)));
    // A bridge skill: demanded by the origin, and its centre of gravity is outside the
    // origin's own field(s). Skip skills that live almost entirely inside architecture.
    const isBridge = nonNativeFields.size >= 3;
    if (!isBridge) continue;
    ranked.push({
      id: t.id,
      name: skillDict[t.id] ?? t.id,
      origin_share: t.share,
      other_fields: [...nonNativeFields].sort(),
      example_occupations: others
        .filter((s) => !nativeFields.has(fieldBySlug[s]))
        .slice(0, 4)
        .map((s) => occ.find((o) => o.slug === s)?.title ?? s),
    });
  }
  ranked.sort((a, b) => b.origin_share - a.origin_share);
  const chosen = ranked.slice(0, top);

  // Pay angle: origin postings naming >=1 chosen bridge skill vs those naming none.
  const postings = readNdjsonSafe(POSTINGS_FILE).filter((p) => p.role_id === origin && p.salary_usd_min);
  const bridgeIds = new Set(chosen.map((c) => c.id));
  const withBridge = postings.filter((p) => p.skills.some((s) => bridgeIds.has(s)));
  const without = postings.filter((p) => !p.skills.some((s) => bridgeIds.has(s)));
  const median = (arr) => {
    if (!arr.length) return null;
    const mids = arr.map((p) => (p.salary_usd_min + (p.salary_usd_max ?? p.salary_usd_min)) / 2).sort((a, b) => a - b);
    return Math.round(mids[Math.floor(mids.length / 2)]);
  };
  const payWith = median(withBridge), payWithout = median(without);
  const premium = payWith && payWithout ? +(100 * (payWith - payWithout) / payWithout).toFixed(1) : null;

  const out = {
    generatedFromRun: readJson(AGGREGATES_FILE)?.ranAt,
    origin: { slug: origin, title: occ.find((o) => o.slug === origin)?.title, postings: oAgg.count },
    skills: chosen.map((c) => ({ ...c, origin_share_pct: +(100 * c.origin_share).toFixed(1) })),
    pay: { with_bridge_median: payWith, without_bridge_median: payWithout, premium_pct: premium, n_with: withBridge.length, n_without: without.length },
  };
  writeJson(path.join(DATA_DIR, `bridge-skills-${origin}.json`), out);

  log(`bridge-skills (${out.origin.title}, ${oAgg.count} postings):`);
  for (const s of out.skills) log(`  ${s.origin_share_pct.toFixed(1).padStart(4)}%  ${s.name.padEnd(24)} also in: ${s.other_fields.slice(0, 4).join(', ')}`);
  if (premium != null) log(`  pay: postings naming a bridge skill median $${payWith} vs $${payWithout} (${premium > 0 ? '+' : ''}${premium}%), n=${withBridge.length}/${without.length}`);
  return out;
}
