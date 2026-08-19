import { fetchJson } from '../lib/http.js';
import { stripHtml } from '../lib/text.js';

// The Muse public API — keyless, broad US coverage across many industries
// (healthcare, retail, finance, creative — good for niche-occupation reach).
// https://www.themuse.com/developers/api/v2 — attribution required, polite pacing.
export const name = 'themuse';

const PAGES = 80; // 20 jobs/page; doubled 2026-08-19 for US volume (docs/34)

export async function fetchRaw({ log }) {
  const rows = [];
  for (let page = 1; page <= PAGES; page++) {
    let body;
    try {
      body = await fetchJson(`https://www.themuse.com/api/public/jobs?page=${page}`, { minIntervalMs: 1300 });
    } catch (err) { log(`themuse p${page} — ${err.message}`); break; }
    const items = body?.results ?? [];
    if (!items.length) break;
    for (const j of items) {
      const loc = (j.locations ?? []).map((l) => l.name).join('; ');
      rows.push({
        source: name,
        external_id: String(j.id),
        title: j.name ?? '',
        company: j.company?.name ?? null,
        location: loc || null,
        remote_flag: /flexible|remote/i.test(loc),
        salary_min: null,
        salary_max: null,
        currency: 'USD',
        salary_period: 'year',
        description_text: stripHtml(String(j.contents ?? '')).slice(0, 20000),
        posted_at: j.publication_date ?? null,
        url: j.refs?.landing_page ?? null,
      });
    }
    if (page % 10 === 0) log(`themuse — ${rows.length} postings so far`);
  }
  log(`themuse — ${rows.length} postings`);
  return rows;
}
