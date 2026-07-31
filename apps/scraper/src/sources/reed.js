import path from 'node:path';
import { fetchJson } from '../lib/http.js';
import { readJson } from '../lib/store.js';
import { stripHtml } from '../lib/text.js';
import { CONFIG_DIR } from '../lib/paths.js';

// Reed.co.uk Jobseeker API — free key at reed.co.uk/developers. UK's best salary
// signal: employer-stated min/max on most postings. Needs REED_API_KEY in .env.
export const name = 'reed';

export async function fetchRaw({ log }) {
  const key = process.env.REED_API_KEY;
  if (!key) { log('reed: skipped — set REED_API_KEY in .env (free at reed.co.uk/developers)'); return []; }
  const cfg = readJson(path.join(CONFIG_DIR, 'queries.json'));
  const auth = 'Basic ' + Buffer.from(`${key}:`).toString('base64');
  const rows = [];
  for (const term of cfg.terms) {
    const body = await fetchJson(`https://www.reed.co.uk/api/1.0/search?keywords=${encodeURIComponent(term)}&resultsToTake=100`, { headers: { authorization: auth } });
    const results = body?.results ?? [];
    for (const j of results) {
      rows.push({
        source: name,
        external_id: String(j.jobId),
        title: j.jobTitle ?? '',
        company: j.employerName ?? null,
        location: j.locationName ? `${j.locationName}, UK` : 'UK',
        remote_flag: /remote/i.test(`${j.jobTitle} ${j.locationName}`),
        salary_min: j.minimumSalary || null,
        salary_max: j.maximumSalary || null,
        currency: j.currency || 'GBP',
        salary_period: null, // Reed mixes annual and hourly; magnitude inference handles it
        // 25.6% of Reed rows carry HTML entities, and Reed's snippet is only ~453
        // characters — "R&amp;D" wastes four of them and matches nothing.
        description_text: stripHtml(j.jobDescription ?? '').slice(0, 20000),
        posted_at: j.date ? j.date.split('/').reverse().join('-') : null,
        url: j.jobUrl ?? null,
      });
    }
  }
  log(`reed: ${rows.length} postings`);
  return rows;
}
