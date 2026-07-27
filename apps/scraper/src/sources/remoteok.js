import { fetchJson } from '../lib/http.js';
import { stripHtml } from '../lib/text.js';

// RemoteOK public API — JSON out of the box, no key. First array element is a
// legal notice (filtered out by the id/position guard below).
//
// The plain /api returns only the ~100 newest jobs across all tags. But each
// tag endpoint is a SEPARATE 100-job window: measured, ?tags=data alone carried
// 94 jobs absent from the base call, ?tags=finance 77, ?tags=design 64. So we
// pull the base plus a field-diverse tag set and dedupe by id — several times
// the distinct jobs per run. Per-host throttle (2s) keeps it polite; the first-
// seen ledger absorbs the heavy cross-tag overlap. Attribution is satisfied the
// way their API terms require: every listing links back to its remoteok.com URL.
export const name = 'remoteok';

// Single-word tags spanning our occupation fields (tech is over-covered on
// purpose — it's where RemoteOK is deepest; the rest widen the spread).
const TAGS = [
  'dev', 'engineer', 'devops', 'data', 'product', 'design',
  'marketing', 'sales', 'finance', 'analyst', 'writing',
  'hr', 'medical', 'legal', 'education', 'senior',
];

async function pull(url) {
  const body = await fetchJson(url, {
    headers: { 'user-agent': 'PivotHopScraper/0.1 (career adjacency research; contact: cvinocoura@gmail.com)' },
    minIntervalMs: 2000,
  }).catch(() => []);
  return (Array.isArray(body) ? body : []).filter((j) => j && j.id && (j.position || j.title));
}

export async function fetchRaw({ log }) {
  const endpoints = ['https://remoteok.com/api', ...TAGS.map((t) => `https://remoteok.com/api?tags=${encodeURIComponent(t)}`)];
  const byId = new Map();
  for (const url of endpoints) {
    for (const j of await pull(url)) if (!byId.has(j.id)) byId.set(j.id, j);
  }
  const jobs = [...byId.values()];
  log(`remoteok: ${jobs.length} distinct postings from ${endpoints.length} endpoints`);
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
