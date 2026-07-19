import path from 'node:path';
import { fetchJson } from '../lib/http.js';
import { stripHtml, parseSalaryString } from '../lib/text.js';
import { readJson } from '../lib/store.js';
import { CONFIG_DIR } from '../lib/paths.js';

// Ashby public posting API — api.ashbyhq.com/posting-api/job-board/{org}. Full
// descriptions and, with includeCompensation, published salary tiers. Keyless.
export const name = 'ashby';

export async function fetchRaw({ log }) {
  const orgs = readJson(path.join(CONFIG_DIR, 'ashby-companies.json'))?.companies ?? [];
  const rows = [];
  for (const org of orgs) {
    const body = await fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${org}?includeCompensation=true`);
    const jobs = body?.jobs ?? [];
    if (!jobs.length) { log(`ashby:${org} — no public board (skipped)`); continue; }
    log(`ashby:${org} — ${jobs.length} postings`);
    for (const j of jobs) {
      const comp = parseSalaryString(j.compensation?.compensationTierSummary ?? '');
      rows.push({
        source: name,
        external_id: `${org}:${j.id}`,
        title: j.title ?? '',
        company: org,
        location: j.location ?? null,
        remote_flag: Boolean(j.isRemote) || /remote/i.test(j.location ?? ''),
        salary_min: comp?.min ?? null,
        salary_max: comp?.max ?? null,
        currency: comp?.currency ?? null,
        salary_period: comp ? 'year' : null,
        description_text: stripHtml(j.descriptionHtml ?? '').slice(0, 20000),
        posted_at: j.publishedAt ?? null,
        url: j.jobUrl ?? j.applyUrl ?? null,
      });
    }
  }
  return rows;
}
