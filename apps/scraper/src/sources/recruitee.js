import path from 'node:path';
import { fetchJson } from '../lib/http.js';
import { readJson } from '../lib/store.js';
import { CONFIG_DIR } from '../lib/paths.js';

// Recruitee public offers API — {company}.recruitee.com/api/offers/ is the
// documented public feed behind every Recruitee careers page. Same contract
// as the other company-board sources: public JSON, link back to apply.
export const name = 'recruitee';

const strip = (h) => (h ?? '').replace(/<[^>]+>/g, ' ');

export async function fetchRaw({ log }) {
  const companies = readJson(path.join(CONFIG_DIR, 'recruitee-companies.json'))?.companies ?? [];
  const rows = [];
  for (const c of companies) {
    const body = await fetchJson(`https://${c}.recruitee.com/api/offers/`);
    const offers = body?.offers;
    if (!Array.isArray(offers)) { log(`recruitee:${c} — no public board (skipped)`); continue; }
    log(`recruitee:${c} — ${offers.length} postings`);
    for (const j of offers) {
      rows.push({
        source: name,
        external_id: `${c}:${j.id}`,
        title: j.title ?? '',
        company: j.company_name || c,
        location: [j.city, j.country].filter(Boolean).join(', ') || j.location || null,
        remote_flag: j.remote === true || /remote|hybrid/i.test(String(j.location ?? '')),
        salary_min: j.min_salary || null,
        salary_max: j.max_salary || null,
        currency: j.salary?.currency || (j.min_salary ? 'EUR' : null),
        salary_period: j.min_salary ? 'year' : null,
        description_text: strip(`${j.description ?? ''}\n${j.requirements ?? ''}`).slice(0, 20000),
        posted_at: j.published_at ? new Date(j.published_at).toISOString() : null,
        url: j.careers_url ?? j.careers_apply_url ?? null,
      });
    }
  }
  return rows;
}
