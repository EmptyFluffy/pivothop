import path from 'node:path';
import { readJson, writeJson } from '../lib/store.js';
import { TAXONOMY_DIR } from '../lib/paths.js';

// O*NET Related Occupations — the observed-relatedness layer. Public domain-ish
// (CC-BY, U.S. Department of Labor). Joined onto our taxonomy via SOC codes and
// stored as slug->slug pairs. This corroborates the scrape's skill-overlap
// adjacency; it never replaces it. Postings measure forward-looking demand,
// O*NET/CPS measure curated/observed structure — disagreement is editorial signal.
const URL = 'https://www.onetcenter.org/dl_files/database/db_29_1_text/Related%20Occupations.txt';
const OUT = path.join(TAXONOMY_DIR, 'related-occupations.json');

export async function fetchOnetRelated({ log }) {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`O*NET download failed: HTTP ${res.status}`);
  const text = await res.text();

  const { occupations } = readJson(path.join(TAXONOMY_DIR, 'occupations.json'));
  const socToSlugs = new Map();
  for (const o of occupations) {
    if (!o.soc) continue;
    if (!socToSlugs.has(o.soc)) socToSlugs.set(o.soc, []);
    socToSlugs.get(o.soc).push(o.slug);
  }

  const related = {}; // origin slug -> [{slug, tier, rank}]
  const lines = text.split('\n').slice(1);
  let joined = 0;
  for (const line of lines) {
    const [soc, relSoc, tier, index] = line.trim().split('\t');
    if (!soc || !relSoc) continue;
    for (const from of socToSlugs.get(soc) ?? []) {
      for (const to of socToSlugs.get(relSoc) ?? []) {
        if (from === to) continue;
        related[from] ??= [];
        if (!related[from].some((r) => r.slug === to)) {
          related[from].push({ slug: to, tier, rank: Number(index) });
          joined++;
        }
      }
    }
  }
  for (const k of Object.keys(related)) related[k].sort((a, b) => a.rank - b.rank);

  writeJson(OUT, {
    $comment: 'O*NET Related Occupations (db 29.1, onetcenter.org, CC-BY) joined to the taxonomy via SOC codes. Observed-relatedness evidence layer: corroborates the scrape-derived adjacency, never replaces it.',
    source: URL,
    pairs: related,
  });
  log(`taxonomy:onet — ${lines.length} O*NET rows → ${joined} slug pairs across ${Object.keys(related).length} origins → ${OUT}`);
  return related;
}
