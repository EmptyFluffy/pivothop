import { readNdjsonSafe, readJson, writeJson } from '../lib/store.js';
import { POSTINGS_FILE, TAXONOMY_DIR, GENERATED_DIR } from '../lib/paths.js';
import path from 'node:path';

// Skill co-occurrence, computed from our own postings — the "you added Rhino, people who
// list Rhino also list Grasshopper" signal that powers related-skill suggestion in the
// typeahead (docs/15, Thread 4). Ranked by lift, not raw frequency, so ubiquitous skills
// (Excel, Communication) don't get suggested for everything; a floor on co-occurrence
// count keeps it out of the noise.

const MIN_PAIR = 4;       // a pair must co-occur at least this many times to be trusted
const TOP_PER_SKILL = 8;

export function cooccur({ log } = {}) {
  const postings = readNdjsonSafe(POSTINGS_FILE);
  const names = Object.fromEntries(readJson(path.join(TAXONOMY_DIR, 'skills.json')).skills.map((s) => [s.id, s.name]));
  const N = postings.length;

  const freq = new Map();          // skill -> postings containing it
  const pair = new Map();          // "ab" (a<b) -> co-occurrence count
  for (const p of postings) {
    const skills = [...new Set(p.skills)];
    for (const s of skills) freq.set(s, (freq.get(s) ?? 0) + 1);
    for (let i = 0; i < skills.length; i++) {
      for (let j = i + 1; j < skills.length; j++) {
        const [a, b] = skills[i] < skills[j] ? [skills[i], skills[j]] : [skills[j], skills[i]];
        const k = `${a}${b}`;
        pair.set(k, (pair.get(k) ?? 0) + 1);
      }
    }
  }

  const related = {}; // skill -> [{id, name, together, confidence, lift}]
  for (const [key, c] of pair) {
    if (c < MIN_PAIR) continue;
    const [a, b] = key.split('');
    const fa = freq.get(a), fb = freq.get(b);
    const lift = (c / N) / ((fa / N) * (fb / N));
    if (lift < 1.2) continue; // only keep pairs that co-occur more than chance
    for (const [x, y, fx] of [[a, b, fa], [b, a, fb]]) {
      (related[x] ??= []).push({ id: y, name: names[y] ?? y, together: c, confidence: +(c / fx).toFixed(3), lift: +lift.toFixed(2) });
    }
  }
  for (const k of Object.keys(related)) {
    related[k].sort((p, q) => q.lift - p.lift || q.together - p.together);
    related[k] = related[k].slice(0, TOP_PER_SKILL);
  }

  writeJson(path.join(GENERATED_DIR, 'skill-cooccur.json'), {
    $comment: 'Related skills by co-occurrence in postings. lift = observed/expected co-occurrence; confidence = P(other | this). Powers related-skill suggestion in the typeahead (docs/15, Thread 4).',
    postings: N,
    skills: related,
  });

  const sample = related['rhino'] ?? related['python'] ?? [];
  log(`cooccur: ${Object.keys(related).length} skills with related suggestions from ${N} postings`);
  if (related['rhino']) log(`  e.g. Rhino → ${related['rhino'].slice(0, 4).map((r) => `${r.name} (${Math.round(r.confidence * 100)}%)`).join(', ')}`);
  return related;
}
