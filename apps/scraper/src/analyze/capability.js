import path from 'node:path';
import { readJson } from '../lib/store.js';
import { TAXONOMY_DIR } from '../lib/paths.js';

const CAP_FILE = path.join(TAXONOMY_DIR, 'capability-vectors.json');

// Capability similarity C = cosine over mean-centered O*NET importance vectors.
export function capabilitySimilarity(vectors, a, b) {
  const va = vectors[a]?.elements, vb = vectors[b]?.elements;
  if (!va || !vb) return null;
  let dot = 0, na = 0, nb = 0;
  for (const id in va) { const x = va[id], y = vb[id] ?? 0; dot += x * y; na += x * x; }
  for (const id in vb) nb += vb[id] * vb[id];
  if (!na || !nb) return null;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function loadCapabilities() {
  return readJson(CAP_FILE);
}

// Verification: for an origin, rank all occupations by capability similarity and show
// what drives the top ones. If UX / 3D / product design rise for architect, the signal works.
export function analyzeCapability({ log, origin = 'architect' } = {}) {
  const cap = readJson(CAP_FILE);
  if (!cap) { log('analyze:capability — run `taxonomy:capabilities` first'); return null; }
  const occ = Object.fromEntries(readJson(path.join(TAXONOMY_DIR, 'occupations.json')).occupations.map((o) => [o.slug, o]));
  if (!cap.vectors[origin]) { log(`no capability vector for ${origin}`); return null; }

  const scored = Object.keys(cap.vectors)
    .filter((s) => s !== origin)
    .map((s) => ({ slug: s, c: capabilitySimilarity(cap.vectors, origin, s) }))
    .filter((x) => x.c != null)
    .sort((a, b) => b.c - a.c);

  log(`capability similarity to ${occ[origin]?.title ?? origin} — top 15 (durable human-capability closeness, not tools):`);
  for (const { slug, c } of scored.slice(0, 15)) {
    const o = occ[slug] ?? { title: slug, cluster: '' };
    log(`  ${(c * 100).toFixed(0).padStart(3)}  ${o.title.padEnd(26)} ${o.cluster ?? ''}`);
  }
  log(`  shared top abilities of ${occ[origin]?.title}: ${cap.vectors[origin].top.join(', ')}`);
  return scored;
}
