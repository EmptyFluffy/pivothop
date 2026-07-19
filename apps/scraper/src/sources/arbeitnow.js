import { fetchJson } from '../lib/http.js';
import { stripHtml } from '../lib/text.js';

// Arbeitnow public job board API — keyless, EU-weighted, full descriptions.
export const name = 'arbeitnow';

const PAGES = 8;

export async function fetchRaw({ log }) {
  const rows = [];
  for (let p = 1; p <= PAGES; p++) {
    const body = await fetchJson(`https://www.arbeitnow.com/api/job-board-api?page=${p}`);
    const jobs = body?.data ?? [];
    if (!jobs.length) break;
    for (const j of jobs) {
      rows.push({
        source: name,
        external_id: j.slug,
        title: j.title ?? '',
        company: j.company_name ?? null,
        location: j.location || 'Germany',
        remote_flag: Boolean(j.remote),
        salary_min: null,
        salary_max: null,
        currency: null,
        salary_period: null,
        description_text: stripHtml(j.description ?? '').slice(0, 20000),
        posted_at: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
        url: j.url ?? null,
      });
    }
  }
  log(`arbeitnow: ${rows.length} postings`);
  return rows;
}
