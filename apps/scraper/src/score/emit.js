import path from 'node:path';
import { readJson, writeJson } from '../lib/store.js';
import { AGGREGATES_FILE, ADJACENCY_FILE, GENERATED_DIR } from '../lib/paths.js';
import { getTaxonomy } from '../normalize/titles.js';
import { skillName } from '../normalize/skills.js';

// Confidence tiers per the build playbook: <30 postings behind a number -> low-confidence
// flag in the UI; an origin with <50 mapped postings total -> "insufficient data yet"
// state rather than invented routes.
const MIN_ORIGIN_POSTINGS = 50;
const LOW_CONFIDENCE_POSTINGS = 30;
const FIRST_HOPS = 8;
const KIDS_PER_HOP = 2;
const KID_MIN_MATCH = 15; // a second hop below this is noise, not a route
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

/**
 * Emits per-origin generated files keyed by origin slug into packages/data/generated/.
 * Shape mirrors the reference implementation's ROLES/NEXT exactly, plus provenance
 * and confidence flags. The graph loads the file for whatever origin the user selects.
 */
export async function emit({ log, origin: onlyOrigin } = {}) {
  const agg = readJson(AGGREGATES_FILE)?.roles;
  const adj = readJson(ADJACENCY_FILE)?.origins;
  if (!agg || !adj) { log('emit: missing aggregates/adjacency — run `aggregate` and `score` first'); return null; }

  const origins = onlyOrigin ? [onlyOrigin] : Object.keys(adj);
  const index = [];

  for (const origin of origins) {
    const oAgg = agg[origin];
    const oInfo = occInfo(origin);
    if (!oAgg) { log(`emit: ${origin} — no postings, skipped`); continue; }

    const file = path.join(GENERATED_DIR, `${origin}.json`);
    if (oAgg.count < MIN_ORIGIN_POSTINGS) {
      writeJson(file, {
        version: 1,
        origin: { slug: origin, title: oInfo.title, postings: oAgg.count },
        insufficient: true,
        note: `Only ${oAgg.count} mapped postings for this origin — honest empty state, never invented routes.`,
      });
      index.push({ slug: origin, title: oInfo.title, postings: oAgg.count, insufficient: true });
      continue;
    }

    const oSkills = new Map((oAgg.top_skills ?? []).map((t) => [t.id, t.share]));
    const hops = (adj[origin] ?? []).slice(0, FIRST_HOPS);
    const hopSlugs = new Set(hops.map((h) => h.dest));

    const roles = hops.map((h) => {
      const d = agg[h.dest];
      const info = occInfo(h.dest);
      const dSkills = (d.top_skills ?? []);
      const have = dSkills.filter((s) => oSkills.has(s.id)).slice(0, 4).map((s) => skillName(s.id));
      const learn = dSkills.filter((s) => !oSkills.has(s.id)).slice(0, 4).map((s) => skillName(s.id));
      return {
        id: h.dest,
        title: info.title,
        field: info.field,
        desc: info.desc ?? '',
        match: h.match,
        salary: d.salaried_count >= 5 ? fmtSalary(d.salary_p25, d.salary_p75) : null,
        demand: demandTier(d.count),
        remote: `${Math.round(d.remote_share * 100)}%`,
        time: timeEstimate(h.match),
        have,
        learn,
        low_confidence: d.count < LOW_CONFIDENCE_POSTINGS,
        provenance: { postings: d.count, salaried: d.salaried_count },
      };
    });

    // Second hops. Three rules keep two-hop stories honest:
    //   1. quality floor — a kid below KID_MIN_MATCH is noise, not a route
    //   2. bridge-beats-direct — presenting origin→P→K claims P is the way in; if the
    //      origin reaches K directly at equal or better match, that claim is false
    //   3. one parent per kid — each kid occupation attaches to its best parent only;
    //      other first-hops that also reach it become bridge edges, as in the reference
    const directMatch = new Map((adj[origin] ?? []).map((x) => [x.dest, x.match]));
    const candidates = [];
    for (const h of hops) {
      for (const k of adj[h.dest] ?? []) {
        if (k.dest === origin || hopSlugs.has(k.dest)) continue;
        if (k.match < KID_MIN_MATCH) continue;
        if (k.match <= (directMatch.get(k.dest) ?? 0)) continue;
        candidates.push({ parent: h.dest, slug: k.dest, match: k.match });
      }
    }
    candidates.sort((a, b) => b.match - a.match);
    const kidParent = new Map(); // kid slug -> best parent
    for (const c of candidates) if (!kidParent.has(c.slug)) kidParent.set(c.slug, c);
    const next = {};
    for (const h of hops) {
      next[h.dest] = [...kidParent.values()]
        .filter((c) => c.parent === h.dest)
        .slice(0, KIDS_PER_HOP)
        .map((c) => ({ t: occInfo(c.slug).title, m: c.match, slug: c.slug }));
    }

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

    // Bridges: a kid reachable from a *second* parent — the most interesting edges in the graph.
    const bridges = [];
    for (const h of hops) {
      (next[h.dest] ?? []).forEach((kid, i) => {
        for (const other of hops) {
          if (other.dest === h.dest) continue;
          const hit = (adj[other.dest] ?? []).find((x) => x.dest === kid.slug);
          if (hit && hit.match >= KID_MIN_MATCH) bridges.push([other.dest, `${h.dest}_${i}`, +(hit.match / 100).toFixed(2)]);
        }
      });
    }
    bridges.sort((a, b) => b[2] - a[2]).splice(BRIDGE_MAX);

    writeJson(file, {
      version: 1,
      origin: { slug: origin, title: oInfo.title, field: oInfo.field, postings: oAgg.count, salary: fmtSalary(oAgg.salary_p25, oAgg.salary_p75), remote: `${Math.round(oAgg.remote_share * 100)}%` },
      roles,
      next,
      cross,
      bridges,
      formula: readJson(ADJACENCY_FILE)?.formula,
    });
    index.push({ slug: origin, title: oInfo.title, postings: oAgg.count, insufficient: false });
  }

  index.sort((a, b) => b.postings - a.postings);
  writeJson(path.join(GENERATED_DIR, 'index.json'), { version: 1, origins: index });
  const ok = index.filter((i) => !i.insufficient).length;
  log(`emit: ${index.length} origin files written (${ok} with routes, ${index.length - ok} honest empty states) → packages/data/generated/`);
  return index;
}
