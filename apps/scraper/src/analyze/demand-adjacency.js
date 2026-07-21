import path from 'node:path';
import { readNdjsonSafe, readJson, writeJson } from '../lib/store.js';
import { RAW_FILE, POSTINGS_FILE, TAXONOMY_DIR, GENERATED_DIR } from '../lib/paths.js';
import { disciplineToSlug } from '../normalize/disciplines.js';

// Demand-side adjacency (docs/15, Thread 6 enrichment). Employers routinely name the
// backgrounds they'll accept — "degree in graphic design or a related field", "background
// in architecture" — right in the posting text we already scraped. Each such phrase in a
// posting for occupation DEST is an employer attesting an edge ORIGIN -> DEST: a person
// with ORIGIN's background is welcome in DEST. This captures the non-obvious, human moves
// O*NET's curated relatedness misses (does a UX posting welcome an architecture background?)
// and doubles as the adjacent-talent signal for the employer side.

const PHRASE = /(?:degree in|background in|experience in|studies in|major in|coming from(?: a| an)?)\s+([a-z][a-z /&,-]{2,40})/g;
const MIN_EDGE = 3;
const MIN_DEST_POSTINGS = 25; // don't compute a share on a tiny denominator (kills the "Corporate Trainer = 100 everywhere" artifact)
const matchDiscipline = disciplineToSlug;

export function demandAdjacency({ log } = {}) {
  const roleById = new Map();
  for (const p of readNdjsonSafe(POSTINGS_FILE)) roleById.set(`${p.source} ${p.external_id}`, p.role_id);
  const occ = Object.fromEntries(readJson(path.join(TAXONOMY_DIR, 'occupations.json')).occupations.map((o) => [o.slug, o]));

  const edge = new Map();       // `${origin}->${dest}` -> count
  const destTotal = new Map();  // dest -> postings with a role_id
  let scanned = 0, attested = 0;
  for (const r of readNdjsonSafe(RAW_FILE)) {
    const dest = roleById.get(`${r.source} ${r.external_id}`);
    if (!dest) continue;
    destTotal.set(dest, (destTotal.get(dest) ?? 0) + 1);
    const text = (r.description_text || '').toLowerCase();
    if (!text) continue;
    scanned++;
    const seen = new Set();
    for (const m of text.matchAll(PHRASE)) {
      const origin = matchDiscipline(m[1]);
      if (!origin || origin === dest || seen.has(origin)) continue;
      seen.add(origin);
      const key = `${origin}->${dest}`;
      edge.set(key, (edge.get(key) ?? 0) + 1);
      attested++;
    }
  }

  // Score by LIFT, not raw share, so generic sinks (a Corporate Trainer welcomes every
  // background) don't dominate. lift = how much more this destination welcomes this origin
  // than the average destination does. High lift = a SPECIFIC, meaningful adjacency.
  const destWelcomeTotal = new Map(); // dest -> total welcome edges
  const originWelcomeTotal = new Map(); // origin -> total times welcomed anywhere
  let grand = 0;
  for (const [key, count] of edge) {
    if (count < MIN_EDGE) continue;
    const [origin, dest] = key.split('->');
    if ((destTotal.get(dest) ?? 0) < MIN_DEST_POSTINGS) continue;
    destWelcomeTotal.set(dest, (destWelcomeTotal.get(dest) ?? 0) + count);
    originWelcomeTotal.set(origin, (originWelcomeTotal.get(origin) ?? 0) + count);
    grand += count;
  }
  const byOrigin = {};
  for (const [key, count] of edge) {
    if (count < MIN_EDGE) continue;
    const [origin, dest] = key.split('->');
    if ((destTotal.get(dest) ?? 0) < MIN_DEST_POSTINGS) continue;
    const pOriginGivenDest = count / destWelcomeTotal.get(dest);
    const pOriginOverall = originWelcomeTotal.get(origin) / grand;
    const lift = pOriginGivenDest / pOriginOverall;
    (byOrigin[origin] ??= []).push({ dest, count, lift: +lift.toFixed(2) });
  }
  const out = {};
  for (const [origin, rows] of Object.entries(byOrigin)) {
    const max = Math.max(...rows.map((r) => r.lift));
    out[origin] = rows
      .map((r) => ({ ...r, score: Math.round(100 * r.lift / max), title: occ[r.dest]?.title ?? r.dest }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }

  writeJson(path.join(GENERATED_DIR, 'demand-adjacency.json'), {
    $comment: 'Employer-attested adjacency from posting text: DEST postings that name ORIGIN as a welcome background. score = per-origin-normalized share of DEST postings welcoming ORIGIN. Captures non-obvious, human moves O*NET misses. docs/15 Thread 6.',
    scanned, attested, origins: out,
  });
  log(`demand-adjacency: ${attested} employer-attested background edges from ${scanned} postings → ${Object.keys(out).length} origins`);
  if (out['architect']) log(`  architect is welcomed in: ${out['architect'].slice(0, 6).map((r) => `${r.title} (${r.score})`).join(', ')}`);
  return out;
}
