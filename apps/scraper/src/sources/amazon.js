import { fetchJson } from '../lib/http.js';
import { stripHtml } from '../lib/text.js';

// amazon.jobs public search JSON — scoped to Costa Rica (Amazon is a top-3 CR
// private employer; 68 open CR roles at the 2026-08-22 probe). robots.txt
// disallows only /internal; search.json is served openly. Descriptions arrive
// full-text in the payload.
export const name = 'amazon';

const PAGE = 100;
const MAX = 1000;

export async function fetchRaw({ log }) {
  const rows = [];
  for (let offset = 0; offset < MAX; offset += PAGE) {
    const body = await fetchJson(`https://www.amazon.jobs/en/search.json?country=CRI&result_limit=${PAGE}&offset=${offset}&sort=recent`);
    const jobs = body?.jobs ?? [];
    for (const j of jobs) {
      rows.push({
        source: name,
        external_id: String(j.id_icims ?? j.id ?? j.job_path),
        title: j.title ?? '',
        company: 'Amazon',
        location: j.normalized_location || j.location || 'San Jose, Costa Rica',
        remote_flag: /virtual|remote/i.test(j.location || ''),
        salary_min: null, salary_max: null, currency: null, salary_period: null,
        description_text: stripHtml(`${j.description ?? ''}\n${j.basic_qualifications ?? ''}\n${j.preferred_qualifications ?? ''}`).slice(0, 20000),
        posted_at: j.posted_date ? new Date(j.posted_date).toISOString().slice(0, 10) : null,
        url: j.job_path ? `https://www.amazon.jobs${j.job_path}` : null,
        country: 'CR',
      });
    }
    if (jobs.length < PAGE) break;
  }
  log(`amazon: ${rows.length} Costa Rica postings`);
  return rows;
}
