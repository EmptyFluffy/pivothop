import { fetchJson } from '../lib/http.js';
import { stripHtml } from '../lib/text.js';

// Jobicy public API — keyless, remote-first, annual salary fields when published.
export const name = 'jobicy';

export async function fetchRaw({ log }) {
  const body = await fetchJson('https://jobicy.com/api/v2/remote-jobs?count=100');
  const jobs = body?.jobs ?? [];
  log(`jobicy: ${jobs.length} postings`);
  return jobs.map((j) => ({
    source: name,
    external_id: String(j.id),
    title: j.jobTitle ?? '',
    company: j.companyName ?? null,
    location: j.jobGeo || 'Remote',
    remote_flag: true,
    salary_min: j.annualSalaryMin || null,
    salary_max: j.annualSalaryMax || null,
    currency: j.salaryCurrency || (j.annualSalaryMin ? 'USD' : null),
    salary_period: j.annualSalaryMin ? 'year' : null,
    description_text: stripHtml(j.jobDescription ?? j.jobExcerpt ?? '').slice(0, 20000),
    posted_at: j.pubDate ?? null,
    url: j.url ?? null,
  }));
}
