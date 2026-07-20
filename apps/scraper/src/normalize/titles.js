import path from 'node:path';
import { readJson } from '../lib/store.js';
import { TAXONOMY_DIR } from '../lib/paths.js';

// Rules-first title canonicalization against the occupation taxonomy.
// Every unmapped title is logged for review — the synonym tables grow from that log.

// NB: "assistant" and "associate" are deliberately NOT stripped — they are load-bearing
// nouns in real occupations (Medical Assistant, Teaching Assistant, Accounts Assistant,
// Research Associate). The phrase matcher still recovers the head noun of "Assistant
// Project Manager" by containment, so keeping them costs nothing and saves whole occupations.
const SENIORITY = /\b(senior|sr\.?|junior|jr\.?|lead|principal|staff|chief|head of|head|intern|entry[- ]?level|mid[- ]?level|graduate|trainee|apprentice|expert|specialist i{1,3}|i{1,3}|iv|v|\d+)\b/g;
const NOISE = /\b(remote|hybrid|onsite|on-site|contract|contractor|freelance|part[- ]?time|full[- ]?time|temporary|temp|permanent|urgent|immediate|new|now hiring|work from home|wfh|m\/f\/d|f\/m\/d|h\/f)\b/g;

export function cleanTitle(raw) {
  let t = String(raw).toLowerCase();
  t = t.replace(/\(.*?\)/g, ' ');            // parentheticals
  t = t.split(/ [-–—|@] | at |, /)[0];       // location/company tails
  t = t.replace(NOISE, ' ').replace(SENIORITY, ' ');
  t = t.replace(/[^a-z0-9&/+.# ]/g, ' ').replace(/\s+/g, ' ').trim();
  return t;
}

let matcher = null;

function buildMatcher() {
  const { occupations } = readJson(path.join(TAXONOMY_DIR, 'occupations.json'));
  const exact = new Map();       // cleaned synonym -> slug
  const phrases = [];            // [{phrase, slug}] for containment, longest first
  for (const occ of occupations) {
    for (const syn of [occ.title.toLowerCase(), ...occ.synonyms]) {
      const c = syn.replace(/\s+/g, ' ').trim();
      if (!exact.has(c)) exact.set(c, occ.slug);
      phrases.push({ phrase: c, slug: occ.slug });
    }
  }
  phrases.sort((a, b) => b.phrase.length - a.phrase.length);
  return { exact, phrases, occupations };
}

export function getTaxonomy() {
  if (!matcher) matcher = buildMatcher();
  return matcher;
}

/** @returns {{slug:string, method:'exact'|'phrase'}|null} */
export function mapTitle(rawTitle) {
  const m = getTaxonomy();
  const cleaned = cleanTitle(rawTitle);
  if (!cleaned) return null;
  const hitExact = m.exact.get(cleaned);
  if (hitExact) return { slug: hitExact, method: 'exact' };
  // containment on word boundaries — longest synonym wins
  const padded = ` ${cleaned} `;
  for (const { phrase, slug } of m.phrases) {
    if (phrase.length < 4) continue;
    if (padded.includes(` ${phrase} `)) return { slug, method: 'phrase' };
  }
  return null;
}
