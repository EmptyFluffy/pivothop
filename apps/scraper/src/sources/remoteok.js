import { fetchJson } from '../lib/http.js';
import { stripHtml } from '../lib/text.js';

// RemoteOK public API — JSON out of the box, no key. First array element is a legal notice.
export const name = 'remoteok';

export async function fetchRaw({ log }) {
  const body = await fetchJson('https://remoteok.com/api', {
    headers: { 'user-agent': 'PivotHopScraper/0.1 (career adjacency research; contact: cvinocoura@gmail.com)' },
    minIntervalMs: 2000,
  });
  const jobs = (Array.isArray(body) ? body : []).filter((j) => j && j.id && (j.position || j.title));
  log(`remoteok: ${jobs.length} postings`);
  return jobs.map((j) => ({
    source: name,
    external_id: String(j.id),
    title: j.position || j.title || '',
    company: j.company ?? null,
    location: j.location || 'Remote',
    remote_flag: true,
    salary_min: j.salary_min || null,
    salary_max: j.salary_max || null,
    currency: 'USD', // RemoteOK publishes annual USD estimates
    salary_period: 'year',
    description_text: stripHtml(j.description).slice(0, 20000),
    posted_at: j.date ?? null,
    url: j.url ?? (j.slug ? `https://remoteok.com/remote-jobs/${j.slug}` : null),
  }));
}
