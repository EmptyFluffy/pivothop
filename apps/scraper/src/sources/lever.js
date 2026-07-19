import path from 'node:path';
import { fetchJson } from '../lib/http.js';
import { readJson } from '../lib/store.js';
import { CONFIG_DIR } from '../lib/paths.js';

// Lever public postings API — same deal as Greenhouse: companies expose JSON
// deliberately at api.lever.co/v0/postings/{company}. Full descriptions, and
// salaryRange when the company publishes it. 404s/unknowns logged and skipped.
export const name = 'lever';

const PERIOD_BY_INTERVAL = { 'per-year-salary': 'year', 'per-hour-wage': 'hour', year: 'year', hour: 'hour', month: 'month' };

export async function fetchRaw({ log }) {
  const companies = readJson(path.join(CONFIG_DIR, 'lever-companies.json'))?.companies ?? [];
  const rows = [];
  for (const c of companies) {
    const body = await fetchJson(`https://api.lever.co/v0/postings/${c}?mode=json`);
    if (!body || !Array.isArray(body)) { log(`lever:${c} — no public board (skipped)`); continue; }
    log(`lever:${c} — ${body.length} postings`);
    for (const j of body) {
      const sr = j.salaryRange ?? {};
      rows.push({
        source: name,
        external_id: `${c}:${j.id}`,
        title: j.text ?? '',
        company: c,
        location: j.categories?.location ?? null,
        remote_flag: j.workplaceType === 'remote' || /remote/i.test(j.categories?.location ?? ''),
        salary_min: sr.min || null,
        salary_max: sr.max || null,
        currency: sr.currency || (sr.min ? 'USD' : null),
        salary_period: PERIOD_BY_INTERVAL[sr.interval] ?? (sr.min ? 'year' : null),
        description_text: (j.descriptionPlain ?? '').concat('\n', (j.lists ?? []).map((l) => `${l.text}\n${(l.content ?? '').replace(/<[^>]+>/g, ' ')}`).join('\n')).slice(0, 20000),
        posted_at: j.createdAt ? new Date(j.createdAt).toISOString() : null,
        url: j.hostedUrl ?? null,
      });
    }
  }
  return rows;
}
