import { fetchJson } from '../lib/http.js';
import { stripHtml, parseSalaryString } from '../lib/text.js';

// Remotive public API — remote-first postings, JSON out of the box, no key.
export const name = 'remotive';

export async function fetchRaw({ log }) {
  const body = await fetchJson('https://remotive.com/api/remote-jobs', { minIntervalMs: 2000 });
  const jobs = body?.jobs ?? [];
  log(`remotive: ${jobs.length} postings`);
  return jobs.map((j) => {
    const sal = parseSalaryString(j.salary);
    return {
      source: name,
      external_id: String(j.id),
      title: j.title ?? '',
      company: j.company_name ?? null,
      location: j.candidate_required_location || 'Remote',
      remote_flag: true,
      salary_min: sal?.min ?? null,
      salary_max: sal?.max ?? null,
      currency: sal?.currency ?? null,
      salary_period: null, // inferred during normalization
      description_text: stripHtml(j.description).slice(0, 20000),
      posted_at: j.publication_date ?? null,
      url: j.url ?? null,
    };
  });
}
