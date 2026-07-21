import path from 'node:path';
import { fetchJson } from '../lib/http.js';
import { readJson } from '../lib/store.js';
import { CONFIG_DIR } from '../lib/paths.js';

// Adzuna API — free tier, salary data included, broad coverage. Primary source.
// Needs ADZUNA_APP_ID + ADZUNA_APP_KEY in .env (free at developer.adzuna.com).
export const name = 'adzuna';

const CURRENCY_BY_COUNTRY = { us: 'USD', gb: 'GBP', ca: 'CAD', au: 'AUD', de: 'EUR', fr: 'EUR', es: 'EUR', it: 'EUR', nl: 'EUR', at: 'EUR', pl: 'PLN', br: 'BRL', mx: 'MXN', in: 'INR', sg: 'SGD', nz: 'NZD', za: 'ZAR' };

export async function fetchRaw({ log }) {
  const id = process.env.ADZUNA_APP_ID, key = process.env.ADZUNA_APP_KEY;
  if (!id || !key) { log('adzuna: skipped — set ADZUNA_APP_ID and ADZUNA_APP_KEY in .env (free at developer.adzuna.com)'); return []; }
  const cfg = readJson(path.join(CONFIG_DIR, 'queries.json'));
  const rows = [];
  for (const country of cfg.adzunaCountries) {
    for (const term of cfg.terms) {
      for (let page = 1; page <= cfg.adzunaPagesPerQuery; page++) {
        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${id}&app_key=${key}&results_per_page=50&what=${encodeURIComponent(term)}&content-type=application/json`;
        let body;
        try { body = await fetchJson(url, { minIntervalMs: 2500 }); }
        catch (err) { log(`adzuna:${country}:"${term}" p${page} — ${err.message}`); break; }
        const results = body?.results ?? [];
        if (!results.length) break;
        for (const j of results) {
          rows.push({
            source: name,
            external_id: `${country}:${j.id}`,
            title: j.title?.replace(/<\/?[^>]+>/g, '') ?? '',
            company: j.company?.display_name ?? null,
            location: j.location?.display_name ?? null,
            remote_flag: /remote/i.test(j.title ?? '') || /remote/i.test(j.location?.display_name ?? ''),
            salary_min: j.salary_min || null,
            salary_max: j.salary_max || null,
            currency: CURRENCY_BY_COUNTRY[country] ?? 'USD',
            salary_period: 'year', // Adzuna normalizes to annual
            description_text: (j.description ?? '').replace(/<\/?[^>]+>/g, ' ').slice(0, 20000),
            posted_at: j.created ?? null,
            url: j.redirect_url ?? null,
          });
        }
      }
    }
    log(`adzuna:${country} — ${rows.length} cumulative postings`);
  }
  return rows;
}
