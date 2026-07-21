import path from 'node:path';
import { readJson, writeJson } from '../lib/store.js';
import { TAXONOMY_DIR } from '../lib/paths.js';

// O*NET Abilities + Work Activities -> per-occupation capability vectors. These are the
// durable human capabilities (spatial orientation, visualization, originality, judgment)
// that cold posting-skills can't see — the reason an architect is genuinely close to UX.
// (docs/15, Thread 5). CC-BY, US DoL. Joined to our taxonomy by SOC, like Related Occupations.
const BASE = 'https://www.onetcenter.org/dl_files/database/db_29_1_text';
const FILES = { abilities: 'Abilities.txt', activities: 'Work%20Activities.txt' };
const OUT = path.join(TAXONOMY_DIR, 'capability-vectors.json');
const SCALE = 'IM'; // Importance (1–5): how much the capability matters to the occupation

async function loadElements(file, log) {
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) throw new Error(`O*NET ${file}: HTTP ${res.status}`);
  const text = await res.text();
  const lines = text.split('\n');
  const header = lines[0].split('\t');
  const ci = (name) => header.indexOf(name);
  const [cSoc, cId, cName, cScale, cVal] = ['O*NET-SOC Code', 'Element ID', 'Element Name', 'Scale ID', 'Data Value'].map(ci);
  const bySoc = new Map(); // soc -> Map(elementId -> value)
  const names = new Map(); // elementId -> name
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split('\t');
    if (c.length < 5 || c[cScale] !== SCALE) continue;
    const soc = c[cSoc], id = c[cId], val = Number(c[cVal]);
    if (!soc || !id || Number.isNaN(val)) continue;
    if (!bySoc.has(soc)) bySoc.set(soc, new Map());
    bySoc.get(soc).set(id, val);
    names.set(id, c[cName]);
  }
  log(`  ${file}: ${bySoc.size} occupations × ${names.size} elements (${SCALE})`);
  return { bySoc, names };
}

export async function fetchCapabilities({ log }) {
  log('taxonomy:capabilities — downloading O*NET abilities + work activities…');
  const ab = await loadElements(FILES.abilities, log);
  const wa = await loadElements(FILES.activities, log);
  const names = new Map([...ab.names, ...wa.names]);
  const elementIds = [...names.keys()];

  const { occupations } = readJson(path.join(TAXONOMY_DIR, 'occupations.json'));
  // Raw importance vector per SOC over the union of ability + activity elements.
  const socVec = new Map();
  const socsWanted = new Set(occupations.map((o) => o.soc).filter(Boolean));
  for (const soc of socsWanted) {
    const a = ab.bySoc.get(soc), w = wa.bySoc.get(soc);
    if (!a && !w) continue;
    const v = {};
    for (const id of elementIds) v[id] = (a?.get(id) ?? w?.get(id) ?? 0);
    socVec.set(soc, v);
  }

  // Center each element by its cross-occupation mean, so similarity reflects RELATIVE
  // emphasis (which abilities an occupation leans on above baseline), not the fact that
  // every job rates most abilities "somewhat important". Spatial orientation is high for
  // architect and UX relative to the mean — that's what should drive their closeness.
  const mean = {};
  for (const id of elementIds) {
    let s = 0, n = 0;
    for (const v of socVec.values()) { s += v[id]; n++; }
    mean[id] = n ? s / n : 0;
  }

  const vectors = {}; // slug -> { soc, elements: {id: centered}, top: [names] }
  let joined = 0;
  for (const o of occupations) {
    const v = socVec.get(o.soc);
    if (!v) continue;
    const centered = {};
    for (const id of elementIds) centered[id] = +(v[id] - mean[id]).toFixed(3);
    const top = elementIds
      .filter((id) => v[id] >= 4) // genuinely important to this occupation (IM >= 4 of 5)
      .sort((x, y) => centered[y] - centered[x])
      .slice(0, 6)
      .map((id) => names.get(id));
    vectors[o.slug] = { soc: o.soc, elements: centered, top };
    joined++;
  }

  writeJson(OUT, {
    $comment: 'O*NET Abilities + Work Activities (db 29.1, CC-BY) as mean-centered importance vectors per occupation. Capability similarity C = cosine(centered vectors). Captures durable human-capability transfer (spatial reasoning, visualization) cold posting-skills miss. docs/15 Thread 5.',
    source: BASE,
    scale: SCALE,
    elementNames: Object.fromEntries(names),
    vectors,
  });
  log(`taxonomy:capabilities — ${joined} occupations vectorized over ${elementIds.length} capability elements → ${OUT}`);
  return vectors;
}
