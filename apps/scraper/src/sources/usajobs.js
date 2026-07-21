import path from 'node:path';
import { fetchJson } from '../lib/http.js';
import { readJson } from '../lib/store.js';
import { CONFIG_DIR } from '../lib/paths.js';

// USAJOBS API — US public sector, clean salary bands. Needs USAJOBS_API_KEY + USAJOBS_EMAIL in .env
// (free at developer.usajobs.gov).
export const name = 'usajobs';

const PERIOD_BY_RATE = { PA: 'year', PH: 'hour', PD: 'day', PW: 'week', PM: 'month' };

export async function fetchRaw({ log }) {
  const key = process.env.USAJOBS_API_KEY, email = process.env.USAJOBS_EMAIL;
  if (!key || !email) { log('usajobs: skipped — set USAJOBS_API_KEY and USAJOBS_EMAIL in .env (free at developer.usajobs.gov)'); return []; }
  const cfg = readJson(path.join(CONFIG_DIR, 'queries.json'));
  const headers = { host: 'data.usajobs.gov', 'user-agent': email, 'authorization-key': key };
  const rows = [];
  for (const term of cfg.terms) {
    const url = `https://data.usajobs.gov/api/search?Keyword=${encodeURIComponent(term)}&ResultsPerPage=500`;
    let body;
    try { body = await fetchJson(url, { headers, minIntervalMs: 1500 }); }
    catch (err) { log(`usajobs:"${term}" — ${err.message}`); continue; }
    const items = body?.SearchResult?.SearchResultItems ?? [];
    log(`usajobs:"${term}" — ${items.length} postings`);
    for (const it of items) {
      const d = it.MatchedObjectDescriptor ?? {};
      const rem = (d.PositionRemuneration ?? [])[0] ?? {};
      rows.push({
        source: name,
        external_id: String(it.MatchedObjectId ?? d.PositionID),
        title: d.PositionTitle ?? '',
        company: d.OrganizationName ?? null,
        location: d.PositionLocationDisplay ?? null,
        remote_flag: /remote/i.test(d.PositionLocationDisplay ?? ''),
        salary_min: Number(rem.MinimumRange) || null,
        salary_max: Number(rem.MaximumRange) || null,
        currency: 'USD',
        salary_period: PERIOD_BY_RATE[rem.RateIntervalCode] ?? 'year',
        description_text: [d.UserArea?.Details?.MajorDuties, d.QualificationSummary].flat().filter(Boolean).join('\n').slice(0, 20000),
        posted_at: d.PublicationStartDate ?? null,
        url: d.PositionURI ?? null,
      });
    }
  }
  return rows;
}
