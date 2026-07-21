// Personalized readiness (docs/15, Threads 2+4 — Phase B). The origin becomes the
// user's actual skill set: chips seed from the origin occupation's typical profile,
// the user adds/removes, and readiness re-derives for EVERY occupation from that
// vector. Binary-coverage semantics, deliberately interpretable: "the skills you
// have cover X% of the demand weight this role's postings ask for."
//   readiness(dest) = 100 · Σ_{s ∈ dest ∩ yours} share_dest(s) / Σ_{s ∈ dest} share_dest(s)

const FIRST_HOPS = 8;
const MIN_MATCH = 10;

export function seedChips(profiles, originSlug, max = 12) {
  const p = profiles[originSlug];
  if (!p) return [];
  return Object.entries(p.s).sort((a, b) => b[1] - a[1]).slice(0, max).map(([id]) => id);
}

export function rankPersonalized(chips, profiles, meta, names, originSlug, originLabel) {
  const have = new Set(chips);
  const scored = [];
  for (const [slug, p] of Object.entries(profiles)) {
    if (slug === originSlug) continue;
    let cov = 0, shared = 0;
    for (const [s, w] of Object.entries(p.s)) if (have.has(s)) { cov += w; shared++; }
    if (shared < 2) continue;
    const match = Math.round((100 * cov) / p.den);
    if (match >= MIN_MATCH) scored.push({ slug, match });
  }
  scored.sort((a, b) => b.match - a.match);
  const hops = scored.slice(0, FIRST_HOPS);

  const roles = hops.map((h) => {
    const m = meta[h.slug];
    const dSkills = Object.entries(profiles[h.slug].s).sort((a, b) => b[1] - a[1]);
    const haveList = dSkills.filter(([s]) => have.has(s)).slice(0, 4).map(([s]) => names[s] || s);
    const learnList = dSkills.filter(([s]) => !have.has(s)).slice(0, 4).map(([s]) => names[s] || s);
    return {
      id: h.slug,
      title: m.title,
      field: m.field,
      cluster: m.cluster,
      kind: null, // origin cluster comparison happens against the person, not shown in personalized mode
      desc: m.desc || '',
      match: h.match,
      salary: m.salary || '—',
      demand: m.demand,
      remote: m.remote,
      time: h.match >= 85 ? '3–8 mo' : h.match >= 70 ? '6–12 mo' : h.match >= 60 ? '9–16 mo' : '12–24 mo',
      have: haveList,
      learn: learnList,
      capability: null,
      mobility: null,
      personalized: true,
    };
  });

  return {
    originLabel,
    originSlug,
    postings: null,
    personalized: true,
    skillCount: chips.length,
    roles,
    next: Object.fromEntries(roles.map((r) => [r.id, []])), // ring 2 returns in standard mode
    cross: [],
    bridges: [],
  };
}
