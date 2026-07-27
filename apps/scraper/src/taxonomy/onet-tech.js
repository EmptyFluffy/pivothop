import fs from 'node:fs';
import path from 'node:path';
import { readJson, writeJson } from '../lib/store.js';
import { TAXONOMY_DIR, DATA_DIR, CACHE_DIR } from '../lib/paths.js';

// O*NET Technology Skills — the tools/tech alias tier for the lexicon, the
// source ESCO can't be (ESCO abstracts tools into competences; this is the
// actual software). Public domain-ish, CC BY 4.0, U.S. Department of Labor;
// same onetcenter.org source as Related Occupations (taxonomy/onet.js).
//
// Each row is O*NET-SOC → an example tool ("Autodesk Revit") + a commodity
// category ("Computer aided design CAD software") + a Hot Technology flag. We
// join to our taxonomy by SOC, aggregate per tool (how many of OUR occupations
// list it, whether it's hot), and flag which tools the lexicon already covers —
// so curation sees the real, current, uncovered tools worth adding, with their
// category ready to seed an alias/skill entry. A curation aid, not a runtime
// source: output lands in the gitignored data dir.

const URL = 'https://www.onetcenter.org/dl_files/database/db_29_1_text/Technology%20Skills.txt';
const norm = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
const baseSoc = (s) => String(s).split('.')[0]; // "15-1252.00" -> "15-1252"

async function download() {
  const cp = path.join(CACHE_DIR, 'onet', 'technology-skills.txt');
  if (fs.existsSync(cp)) return fs.readFileSync(cp, 'utf8');
  const res = await fetch(URL, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`O*NET Technology Skills download failed: HTTP ${res.status}`);
  const text = await res.text();
  fs.mkdirSync(path.dirname(cp), { recursive: true });
  fs.writeFileSync(cp, text);
  return text;
}

export async function fetchOnetTech({ log } = {}) {
  const text = await download();

  // SOC -> our slugs, indexed both full (17-1011.00) and base (17-1011).
  const { occupations } = readJson(path.join(TAXONOMY_DIR, 'occupations.json'));
  const socToSlugs = new Map();
  for (const o of occupations) {
    if (!o.soc) continue;
    for (const key of [o.soc, baseSoc(o.soc)]) {
      if (!socToSlugs.has(key)) socToSlugs.set(key, new Set());
      socToSlugs.get(key).add(o.slug);
    }
  }

  // What the lexicon already covers.
  const skills = readJson(path.join(TAXONOMY_DIR, 'skills.json')).skills;
  const aliasSet = new Set(skills.flatMap((s) => [s.name, ...s.aliases]).map(norm));

  // Aggregate per tool.
  const tools = new Map(); // norm(name) -> { name, category, hot, slugs:Set }
  const occTitle = Object.fromEntries(occupations.map((o) => [o.slug, o.title]));
  let joinedRows = 0;
  for (const line of text.split('\n').slice(1)) {
    const [soc, example, , commodity, hot] = line.split('\t');
    if (!soc || !example) continue;
    const slugs = socToSlugs.get(soc) || socToSlugs.get(baseSoc(soc));
    if (!slugs) continue;                                  // occupation not in our taxonomy
    joinedRows++;
    const key = norm(example);
    let t = tools.get(key);
    if (!t) tools.set(key, (t = { name: example.trim(), category: (commodity || '').trim(), hot: false, slugs: new Set() }));
    if (hot?.trim() === 'Y') t.hot = true;
    for (const s of slugs) t.slugs.add(s);
  }

  const rows = [...tools.values()].map((t) => ({
    name: t.name,
    category: t.category,
    hot: t.hot,
    nOcc: t.slugs.size,
    inLexicon: aliasSet.has(norm(t.name)),
    occupations: [...t.slugs].map((s) => occTitle[s] ?? s).slice(0, 4),
  })).sort((a, b) => Number(b.hot) - Number(a.hot) || b.nOcc - a.nOcc);

  const newHot = rows.filter((r) => r.hot && !r.inLexicon);
  writeJson(path.join(DATA_DIR, 'onet-tech.json'), {
    $comment: 'O*NET Technology Skills joined to our taxonomy: tools ranked by hot-flag then # of our occupations that list them, with inLexicon coverage. Source: O*NET, U.S. DOL, CC BY 4.0. Curation aid for the tools/tech alias tier (companion to analyze:unmatched + taxonomy:esco-skills). Regenerate: npm run scrape -- taxonomy:onet-tech',
    generated: { toolsJoined: tools.size, rowsJoined: joinedRows, hot: rows.filter((r) => r.hot).length, newHotUncovered: newHot.length },
    tools: rows,
  });

  log?.(`onet-tech: ${tools.size} distinct tools joined to our taxonomy (${joinedRows} rows); ${rows.filter((r) => r.hot).length} hot, ${newHot.length} hot & NOT yet in the lexicon`);
  log?.('\n  top hot tools not yet in the lexicon (tool · #our-occupations · category):');
  newHot.slice(0, 45).forEach((r) => log?.(`   ${r.name.padEnd(26)} ${String(r.nOcc).padStart(3)}  ${r.category}`));
  return rows;
}
