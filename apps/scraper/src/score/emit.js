import path from 'node:path';
import { readJson, writeJson } from '../lib/store.js';
import { AGGREGATES_FILE, ADJACENCY_FILE, GENERATED_DIR, TAXONOMY_DIR } from '../lib/paths.js';
import { getTaxonomy } from '../normalize/titles.js';
import { skillName } from '../normalize/skills.js';

// Confidence tiers per the build playbook: <30 postings behind a number -> low-confidence
// flag in the UI; an origin with <50 mapped postings total -> "insufficient data yet"
// state rather than invented routes.
const MIN_ORIGIN_POSTINGS = 50;
const LOW_CONFIDENCE_POSTINGS = 30;
const FIRST_HOPS = 8;

// Ring semantics: every node's match is ORIGIN-RELATIVE READINESS (same coverage
// metric everywhere). Ring 1 = the most reachable destinations. Ring 2 = real
// destinations at lower readiness, shown honestly — not hidden behind an invented
// prerequisite. A kid attaches to the first-hop that best UNLOCKS it: merge the
// origin's skill profile with the parent's (elementwise max — what you'd carry
// after time in that role) and measure how much the kid's coverage rises.
const KIDS_PER_HOP = 2;
const KIDS_TOTAL_MAX = 16;
const KID_MIN_READINESS = 10; // below this even the honest framing is noise
const BRIDGE_MIN_GAIN = 5;    // a second parent must add real unlock, not rounding error
const CROSS_MAX = 6;
const BRIDGE_MAX = 4;

function fmtSalary(p25, p75) {
  if (!p25 || !p75) return null;
  const k = (n) => `$${Math.round(n / 5000) * 5}k`;
  return `${k(p25)}–${k(p75)}`;
}

function demandTier(count) {
  return count >= 300 ? 'High' : count >= 75 ? 'Moderate' : 'Low';
}

function timeEstimate(match) {
  return match >= 85 ? '3–8 mo' : match >= 70 ? '6–12 mo' : match >= 60 ? '9–16 mo' : '12–24 mo';
}

function occInfo(slug) {
  const occ = getTaxonomy().occupations.find((o) => o.slug === slug);
  return occ ?? { slug, title: slug, field: '', desc: '' };
}

const skillMap = (aggRole) => new Map((aggRole?.top_skills ?? []).map((t) => [t.id, t.share]));

function coverage(om, dm) {
  let cov = 0, den = 0;
  for (const [s, w] of dm) { den += w; cov += Math.min(om.get(s) ?? 0, w); }
  return den ? cov / den : 0;
}

function mergeMax(a, b) {
  const m = new Map(a);
  for (const [s, w] of b) m.set(s, Math.max(m.get(s) ?? 0, w));
  return m;
}

/**
 * The waterfall: coverage decomposes exactly over the destination's top-20 skills,
 * so each skill's demand share IS the number of match points it carries. earned
 * points sum to the displayed match; the remainder is the gap, skill by skill.
 * This array is the structured route doc the AI-assisted export narrates from —
 * every claim in a generated plan traceable to a field scraped from real postings.
 */
function waterfall(oMap, dMap) {
  let den = 0;
  for (const w of dMap.values()) den += w;
  if (!den) return [];
  return [...dMap]
    .map(([s, w]) => {
      const earned = Math.min(oMap.get(s) ?? 0, w);
      return { skill: s, name: skillName(s), pts: +(100 * w / den).toFixed(1), earned: +(100 * earned / den).toFixed(1) };
    })
    .sort((a, b) => b.pts - a.pts);
}

/**
 * Emits per-origin generated files keyed by origin slug into packages/data/generated/.
 * Shape mirrors the reference implementation's ROLES/NEXT, plus readiness-tier kids,
 * unlock provenance, waterfall arrays, numeric salary bands, and confidence flags.
 */
export async function emit({ log, origin: onlyOrigin } = {}) {
  const agg = readJson(AGGREGATES_FILE)?.roles;
  const adj = readJson(ADJACENCY_FILE)?.origins;
  if (!agg || !adj) { log('emit: missing aggregates/adjacency — run `aggregate` and `score` first'); return null; }

  // Observed-relatedness layer (O*NET, via taxonomy:onet). Corroboration, not ranking:
  // routes the observed data agrees with carry the annotation and its provenance.
  const observed = readJson(path.join(TAXONOMY_DIR, 'related-occupations.json'))?.pairs ?? {};
  const observedTier = (from, to) => (observed[from] ?? []).find((r) => r.slug === to)?.tier ?? null;

  const origins = onlyOrigin ? [onlyOrigin] : Object.keys(adj);
  const index = [];

  for (const origin of origins) {
    const oAgg = agg[origin];
    const oInfo = occInfo(origin);
    if (!oAgg) { log(`emit: ${origin} — no postings, skipped`); continue; }

    const file = path.join(GENERATED_DIR, `${origin}.json`);
    if (oAgg.count < MIN_ORIGIN_POSTINGS) {
      writeJson(file, {
        version: 2,
        origin: { slug: origin, title: oInfo.title, postings: oAgg.count },
        insufficient: true,
        note: `Only ${oAgg.count} mapped postings for this origin — honest empty state, never invented routes.`,
      });
      index.push({ slug: origin, title: oInfo.title, postings: oAgg.count, insufficient: true });
      continue;
    }

    const oMap = skillMap(oAgg);
    const hops = (adj[origin] ?? []).slice(0, FIRST_HOPS);
    const hopSlugs = new Set(hops.map((h) => h.dest));

    const roles = hops.map((h) => {
      const d = agg[h.dest];
      const info = occInfo(h.dest);
      const dMap = skillMap(d);
      const wf = waterfall(oMap, dMap);
      return {
        id: h.dest,
        title: info.title,
        field: info.field,
        desc: info.desc ?? '',
        match: h.match,
        salary: d.salaried_count >= 5 ? fmtSalary(d.salary_p25, d.salary_p75) : null,
        salary_band: d.salaried_count >= 5 ? [d.salary_p25, d.salary_p75] : null,
        demand: demandTier(d.count),
        remote: `${Math.round(d.remote_share * 100)}%`,
        time: timeEstimate(h.match),
        have: wf.filter((s) => s.earned > 0).slice(0, 4).map((s) => s.name),
        learn: wf.filter((s) => s.earned === 0).slice(0, 4).map((s) => s.name),
        waterfall: wf,
        low_confidence: d.count < LOW_CONFIDENCE_POSTINGS,
        observed: observedTier(origin, h.dest), // O*NET relatedness tier when the pair is independently attested
        provenance: { postings: d.count, salaried: d.salaried_count },
      };
    });

    // Ring 2: destinations ranked below the first hops, at honest origin-relative
    // readiness, each attached to the parent that best unlocks it.
    const parentMaps = new Map(hops.map((h) => [h.dest, mergeMax(oMap, skillMap(agg[h.dest]))]));
    const slots = new Map(hops.map((h) => [h.dest, 0]));
    const next = Object.fromEntries(hops.map((h) => [h.dest, []]));
    const bridges = [];
    let kidCount = 0;

    for (const k of (adj[origin] ?? []).slice(FIRST_HOPS)) {
      if (kidCount >= KIDS_TOTAL_MAX) break;
      if (k.match < KID_MIN_READINESS) continue;
      const kMap = skillMap(agg[k.dest]);
      const gains = hops
        .map((h) => {
          const to = Math.round(100 * coverage(parentMaps.get(h.dest), kMap));
          return { parent: h.dest, to, gain: to - k.match };
        })
        .sort((a, b) => b.gain - a.gain);
      const best = gains.find((g) => slots.get(g.parent) < KIDS_PER_HOP);
      if (!best) continue;
      slots.set(best.parent, slots.get(best.parent) + 1);
      const idx = next[best.parent].length;
      next[best.parent].push({
        t: occInfo(k.dest).title,
        m: k.match, // origin-relative readiness — the same measure as every other node
        slug: k.dest,
        via: { parent: best.parent, readiness_after: best.to, gain: best.gain },
        observed: observedTier(origin, k.dest),
      });
      kidCount++;
      const second = gains.find((g) => g.parent !== best.parent && g.gain >= BRIDGE_MIN_GAIN);
      if (second) bridges.push([second.parent, `${best.parent}_${idx}`, +(second.to / 100).toFixed(2)]);
    }
    bridges.sort((a, b) => b[2] - a[2]).splice(BRIDGE_MAX);

    // Cross-links: skill overlap between first-hops, strongest pairs only.
    const cross = [];
    for (let i = 0; i < hops.length; i++) {
      for (let j = i + 1; j < hops.length; j++) {
        const ab = (adj[hops[i].dest] ?? []).find((x) => x.dest === hops[j].dest)?.match ?? 0;
        const ba = (adj[hops[j].dest] ?? []).find((x) => x.dest === hops[i].dest)?.match ?? 0;
        const w = Math.max(ab, ba) / 100;
        if (w >= 0.3) cross.push([hops[i].dest, hops[j].dest, +w.toFixed(2)]);
      }
    }
    cross.sort((a, b) => b[2] - a[2]).splice(CROSS_MAX);

    writeJson(file, {
      version: 2,
      origin: {
        slug: origin,
        title: oInfo.title,
        field: oInfo.field,
        postings: oAgg.count,
        salary: fmtSalary(oAgg.salary_p25, oAgg.salary_p75),
        salary_band: [oAgg.salary_p25, oAgg.salary_p75],
        remote: `${Math.round(oAgg.remote_share * 100)}%`,
      },
      roles,
      next,
      cross,
      bridges,
      formula: readJson(ADJACENCY_FILE)?.formula,
    });
    index.push({ slug: origin, title: oInfo.title, postings: oAgg.count, insufficient: false });
  }

  index.sort((a, b) => b.postings - a.postings);
  writeJson(path.join(GENERATED_DIR, 'index.json'), { version: 2, origins: index });
  const ok = index.filter((i) => !i.insufficient).length;
  log(`emit: ${index.length} origin files written (${ok} with routes, ${index.length - ok} honest empty states) → packages/data/generated/`);
  return index;
}
