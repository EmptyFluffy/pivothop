import { fetchJson } from '../lib/http.js';

// JobTech Dev (Arbetsförmedlingen / Platsbanken) — the Swedish public
// employment service's open search API. Keyless, JSON, full plain-text
// descriptions, explicitly published as open data. The Nordic AEC angle is the
// reason it earns a slot while other country APIs wait for Search Console
// evidence (docs/34): arkitekt/BIM/konstruktör supply feeds exactly the thin
// roles, and the corpus carries official occupation concepts for a future
// crosswalk, same bet as jobroom's AVAM codes.
export const name = 'jobtech';

const BASE = 'https://jobsearch.api.jobtechdev.se/search';
const PAGE = 100;
// Query rotation: thin AEC roles first, then the international-title corpus.
// Swedish titles are deliberate — the multilingual miner precedent is jobroom
// (de/fr/it); audit alias reach after the first run before trusting counts.
const QUERIES = [
  'arkitekt', 'landskapsarkitekt', 'byggnadskonstruktör', 'bim',
  'byggnadsingenjör', 'VVS-ingenjör', 'elkonstruktör', 'inredningsarkitekt',
  'architect', 'civil engineer', 'structural engineer',
  'software engineer', 'developer', 'data engineer', 'designer',
  'projektledare', 'sjuksköterska', 'redovisningsekonom', 'elektriker', 'mekaniker',
];
const PAGES_PER_QUERY = 4;

export async function fetchRaw({ log }) {
  const rows = [];
  const seen = new Set();
  for (const q of QUERIES) {
    for (let p = 0; p < PAGES_PER_QUERY; p++) {
      const url = `${BASE}?q=${encodeURIComponent(q)}&limit=${PAGE}&offset=${p * PAGE}&sort=pubdate-desc`;
      let body;
      try { body = await fetchJson(url, { minIntervalMs: 900 }); }
      catch (err) { log(`jobtech:${q} — ${err.message} (query skipped, source continues)`); break; }
      const hits = body?.hits ?? [];
      for (const h of hits) {
        if (!h?.id || seen.has(h.id)) continue;
        seen.add(h.id);
        const muni = h.workplace_address?.municipality ?? null;
        const country = h.workplace_address?.country ?? 'Sverige';
        rows.push({
          source: name,
          external_id: String(h.id),
          title: h.headline ?? '',
          company: h.employer?.workplace || h.employer?.name || null,
          location: [muni, country === 'Sverige' ? 'Sweden' : country].filter(Boolean).join(', '),
          remote_flag: Boolean(h.remote),
          salary_min: null,
          salary_max: null,
          currency: null,
          salary_period: null,
          description_text: (h.description?.text ?? '').slice(0, 20000),
          posted_at: h.publication_date ?? null,
          url: h.webpage_url ?? null,
        });
      }
      if (hits.length < PAGE) break;
    }
  }
  log(`jobtech: ${rows.length} postings`);
  return rows;
}
