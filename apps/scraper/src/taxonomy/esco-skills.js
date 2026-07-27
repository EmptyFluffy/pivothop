import fs from 'node:fs';
import path from 'node:path';
import { readJson, writeJson } from '../lib/store.js';
import { DATA_DIR, CACHE_DIR } from '../lib/paths.js';

// ESCO skills pillar — the canonicalization + alias source for growing the
// lexicon (docs/15 Thread 4; the companion to analyze:unmatched). ESCO is the EU
// multilingual skills/competences classification, published under CC BY 4.0, so
// redistributing derived English labels + alt-labels is permitted with
// attribution (© European Union, ESCO, https://esco.ec.europa.eu).
//
// We do NOT bulk-dump all ~13,900 ESCO skills — that would bloat the gazetteer
// and hurt precision (the whole point of mining our own corpus first). Instead
// we RESOLVE a targeted term list (by default the corpus miner's candidates)
// against the ESCO API and keep, per term, ESCO's canonical English label and
// its English alt-labels — exactly the aliases we want when adding a real skill
// to packages/data/taxonomy/skills.json. Responses are cached so re-runs are
// free and offline-friendly.

const API = 'https://ec.europa.eu/esco/api/search';
const CONCURRENCY = 5;
const DEFAULT_TERMS = 400;

const norm = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').trim();

function cachePath(term) {
  const safe = norm(term).replace(/[^a-z0-9]+/g, '_').slice(0, 60);
  return path.join(CACHE_DIR, 'esco', `${safe}.json`);
}

async function escoSearch(term) {
  const cp = cachePath(term);
  if (fs.existsSync(cp)) { try { return readJson(cp); } catch { /* refetch */ } }
  const url = `${API}?text=${encodeURIComponent(term)}&type=skill&language=en&full=true&limit=5`;
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new Error(`ESCO HTTP ${res.status}`);
  const results = (await res.json())?._embedded?.results ?? [];
  fs.mkdirSync(path.dirname(cp), { recursive: true });
  writeJson(cp, results);
  return results;
}

/** English preferred label + english alt-labels (and en-us spelling) for one result. */
function englishLabels(r) {
  const pref = r.preferredLabel?.en || r.title || '';
  const alts = new Set();
  for (const a of r.alternativeLabel?.en ?? []) alts.add(a);
  const us = r.preferredLabel?.['en-us'];
  if (us && norm(us) !== norm(pref)) alts.add(us);
  alts.delete(pref);
  return { label: pref, aliases: [...alts] };
}

const tokset = (s) => new Set(norm(s).split(' ').filter((w) => w.length > 2));

/** Resolve one term: strong match if the query equals the ESCO label or an
    alt-label. Otherwise offer the best result ONLY when it shares real token
    overlap with the query (ESCO's rank-1 is often a related-but-different
    concept — e.g. "machine learning" → "data mining" — so unrelated rank-1s are
    dropped rather than presented as suggestions). */
function resolve(term, results) {
  const t = norm(term);
  const qt = tokset(term);
  let best = null, bestOv = 0;
  for (const r of results) {
    const { label, aliases } = englishLabels(r);
    if (!label) continue;
    // Preferred-label exact = strong. Alt-label exact only counts for multi-word
    // queries — single generic words collide with incidental ESCO alt-labels
    // ("board" is an alt of "scaffolding components"), a false-match source.
    if (norm(label) === t || (qt.size >= 2 && aliases.some((a) => norm(a) === t))) {
      return { term, matched: true, escoUri: r.uri, escoLabel: label, aliases };
    }
    const lt = tokset(label);
    const inter = [...qt].filter((w) => lt.has(w)).length;
    const ov = qt.size ? inter / qt.size : 0;
    if (ov > bestOv) { bestOv = ov; best = { r, label, aliases }; }
  }
  if (best && bestOv >= 0.5) {
    return { term, matched: false, suggestion: true, overlap: +bestOv.toFixed(2), escoUri: best.r.uri, escoLabel: best.label, aliases: best.aliases };
  }
  return { term, matched: false }; // ESCO has no close concept — expected for tools/modern tech
}

async function pool(items, worker, n) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; try { out[k] = await worker(items[k]); } catch (e) { out[k] = { error: String(e?.message || e) }; } }
  }));
  return out;
}

export async function fetchEscoSkills({ log, terms, limit } = {}) {
  // Default term list = the corpus miner's candidates (analyze:unmatched output).
  if (!terms || !terms.length) {
    const f = path.join(DATA_DIR, 'unmatched-skills.json');
    if (!fs.existsSync(f)) { log?.('esco: no terms and no data/unmatched-skills.json — run analyze:unmatched first, or pass --terms='); return; }
    terms = readJson(f).candidates.slice(0, limit || DEFAULT_TERMS).map((c) => c.gram);
  }
  terms = [...new Set(terms.map(norm))].filter(Boolean);
  log?.(`esco: resolving ${terms.length} terms against the ESCO skills pillar (CC BY 4.0)…`);

  const rows = await pool(terms, async (t) => resolve(t, await escoSearch(t)), CONCURRENCY);
  const clean = rows.filter((r) => r && !r.error);
  const matched = clean.filter((r) => r.matched);
  const suggested = clean.filter((r) => !r.matched && r.suggestion);
  const errors = rows.filter((r) => r?.error).length;

  writeJson(path.join(DATA_DIR, 'esco-skills.json'), {
    $comment: 'ESCO skills resolved for lexicon growth: per corpus-mined term, ESCO canonical English label + English alt-labels (aliases). Source: ESCO, © European Union, CC BY 4.0 (https://esco.ec.europa.eu). "matched" = the term equals an ESCO label/alt-label; "suggestion" = closest ESCO concept (token-overlap ≥0.5), review before trusting. NOTE: ESCO is a competences taxonomy with verbose phrasing and no modern tools, so its auto-match rate against posting-derived vocabulary is low (~1%) — use as an on-demand alias aid for clean multi-word competences, not an automated source. Regenerate: npm run scrape -- taxonomy:esco-skills',
    generated: { terms: terms.length, matched: matched.length, suggestions: suggested.length, errors },
    skills: clean.sort((a, b) => Number(b.matched) - Number(a.matched)),
  });

  log?.(`esco: ${matched.length} strong matches, ${suggested.length} suggestions, ${errors} errors → taxonomy/esco-skills.json`);
  log?.('\n  strong matches (term → ESCO label · #aliases):');
  matched.slice(0, 40).forEach((r) => log?.(`   ${r.term.padEnd(26)} → ${String(r.escoLabel).padEnd(38)} ${r.aliases.length} aliases`));
  return clean;
}
