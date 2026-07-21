import { fetchJson } from '../lib/http.js';

// Himalayas public jobs API — keyless JSON, ~100k remote roles with salary and
// category data. https://himalayas.app/jobs/api — attribution appreciated.
export const name = 'himalayas';

const PAGES = 20, LIMIT = 100;

export async function fetchRaw({ log }) {
  const rows = [];
  for (let p = 0; p < PAGES; p++) {
    let body;
    try {
      body = await fetchJson(`https://himalayas.app/jobs/api?limit=${LIMIT}&offset=${p * LIMIT}`, { minIntervalMs: 1500 });
    } catch (err) { log(`himalayas p${p} — ${err.message}`); break; }
    const items = body?.jobs ?? [];
    if (!items.length) break;
    for (const j of items) {
      rows.push({
        source: name,
        external_id: String(j.guid ?? j.applicationLink),
        title: j.title ?? '',
        company: j.companyName ?? null,
        location: (j.locationRestrictions ?? []).join('; ') || 'Remote',
        remote_flag: true,
        salary_min: j.minSalary || null,
        salary_max: j.maxSalary || null,
        currency: j.currency || 'USD',
        salary_period: (j.salaryPeriod || 'year').toLowerCase(),
        description_text: String(j.description ?? '').replace(/<\/?[^>]+>/g, ' ').slice(0, 20000),
        posted_at: j.pubDate ? new Date(j.pubDate * 1000).toISOString() : null,
        url: j.applicationLink ?? null,
      });
    }
  }
  log(`himalayas — ${rows.length} postings`);
  return rows;
}
