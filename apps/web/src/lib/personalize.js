// Personalized readiness (docs/15, Threads 2+4 — Phase B). The origin becomes the
// user's actual skill set: chips seed from the origin occupation's typical profile,
// the user adds/removes, and readiness re-derives for EVERY occupation from that
// vector. Binary-coverage semantics, deliberately interpretable: "the skills you
// have cover X% of the demand weight this role's postings ask for."
//   readiness(dest) = 100 · Σ_{s ∈ dest ∩ yours} share_dest(s) / Σ_{s ∈ dest} share_dest(s)
//
// The personalized graph keeps the FULL topology semantics of the server emitter
// (docs/15 Thread 2): ring 2 = next-tier destinations at honest origin-relative
// readiness, each attached to the ring-1 parent that best UNLOCKS it (coverage gain
// from merging the parent's skill profile into yours), bridges = a second unlocking
// parent, cross = profile overlap between ring-1 roles. Organic graph, not a star.

const FIRST_HOPS = 8;
const MIN_MATCH = 10;
const KIDS_PER_HOP = 2;
const KIDS_TOTAL_MAX = 16;
const BRIDGE_MIN_GAIN = 5;
const CROSS_MIN_W = 0.3;
const CROSS_MAX = 6;
const BRIDGE_MAX = 4;

export function seedChips(profiles, originSlug, max = 12) {
  const p = profiles[originSlug];
  if (!p) return [];
  return Object.entries(p.s).sort((a, b) => b[1] - a[1]).slice(0, max).map(([id]) => id);
}

export function rankPersonalized(chips, profiles, meta, names, originSlug, originLabel) {
  const have = new Set(chips);

  // direct readiness for every occupation
  const direct = new Map();
  const scored = [];
  for (const [slug, p] of Object.entries(profiles)) {
    if (slug === originSlug) continue;
    if (p.den < 0.25) continue; // truly degenerate: dictionary barely covers this occupation
    let cov = 0, shared = 0;
    for (const [s, w] of Object.entries(p.s)) if (have.has(s)) { cov += w; shared++; }
    if (shared < 2) continue;
    // thin profiles (den < 0.5) get damped, not banned — inflation neutralized proportionally
    const match = Math.round(((100 * cov) / p.den) * Math.min(1, p.den / 0.5));
    direct.set(slug, match);
    if (match >= MIN_MATCH) scored.push({ slug, match });
  }
  scored.sort((a, b) => b.match - a.match);
  const hops = scored.slice(0, FIRST_HOPS);
  const hopSet = new Set(hops.map((h) => h.slug));

  // coverage of dest with the parent's profile merged into the user's skills:
  // contribution per skill = full share if you have it, else min(parent share, dest share)
  function mergedCoverage(parentSlug, destSlug) {
    const pp = profiles[parentSlug].s, dp = profiles[destSlug];
    let cov = 0;
    for (const [s, w] of Object.entries(dp.s)) cov += have.has(s) ? w : Math.min(pp[s] || 0, w);
    return Math.round((100 * cov) / dp.den);
  }

  const roleOf = (h) => {
    const m = meta[h.slug];
    const dSkills = Object.entries(profiles[h.slug].s).sort((a, b) => b[1] - a[1]);
    return {
      id: h.slug,
      title: m.title,
      field: m.field,
      cluster: m.cluster,
      kind: null,
      desc: m.desc || '',
      license: m.license || null,
      match: h.match,
      salary: m.salary || '—',
      demand: m.demand,
      remote: m.remote,
      time: h.match >= 85 ? '3–8 mo' : h.match >= 70 ? '6–12 mo' : h.match >= 60 ? '9–16 mo' : '12–24 mo',
      have: dSkills.filter(([s]) => have.has(s)).slice(0, 4).map(([s]) => names[s] || s),
      learn: dSkills.filter(([s]) => !have.has(s)).slice(0, 4).map(([s]) => names[s] || s),
      capability: null,
      mobility: null,
      personalized: true,
    };
  };
  const roles = hops.map(roleOf);

  // ring 2: next tier attached by best unlock gain
  const next = Object.fromEntries(hops.map((h) => [h.slug, []]));
  const bridges = [];
  const slots = new Map(hops.map((h) => [h.slug, 0]));
  let kidCount = 0;
  for (const k of scored.slice(FIRST_HOPS)) {
    if (kidCount >= KIDS_TOTAL_MAX) break;
    const gains = hops
      .map((h) => { const to = mergedCoverage(h.slug, k.slug); return { parent: h.slug, to, gain: to - k.match }; })
      .sort((a, b) => b.gain - a.gain);
    const best = gains.find((g) => slots.get(g.parent) < KIDS_PER_HOP);
    if (!best) continue;
    slots.set(best.parent, slots.get(best.parent) + 1);
    const idx = next[best.parent].length;
    next[best.parent].push({ t: meta[k.slug].title, m: k.match, slug: k.slug });
    kidCount++;
    const second = gains.find((g) => g.parent !== best.parent && g.gain >= BRIDGE_MIN_GAIN);
    if (second && bridges.length < BRIDGE_MAX) bridges.push([second.parent, best.parent + '_' + idx, +(second.to / 100).toFixed(2)]);
  }

  // cross links: directional profile coverage between ring-1 roles
  function profCoverage(aSlug, bSlug) {
    const ap = profiles[aSlug].s, bp = profiles[bSlug];
    let cov = 0;
    for (const [s, w] of Object.entries(bp.s)) cov += Math.min(ap[s] || 0, w);
    return cov / bp.den;
  }
  const cross = [];
  for (let i = 0; i < hops.length; i++) for (let j = i + 1; j < hops.length; j++) {
    const w = Math.max(profCoverage(hops[i].slug, hops[j].slug), profCoverage(hops[j].slug, hops[i].slug));
    if (w >= CROSS_MIN_W) cross.push([hops[i].slug, hops[j].slug, +w.toFixed(2)]);
  }
  cross.sort((a, b) => b[2] - a[2]).splice(CROSS_MAX);

  return {
    originLabel,
    originSlug,
    postings: null,
    personalized: true,
    skillCount: chips.length,
    roles,
    next,
    cross,
    bridges,
  };
}
