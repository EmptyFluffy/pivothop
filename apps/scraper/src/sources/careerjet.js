import crypto from 'node:crypto';
import { fetchJson } from '../lib/http.js';
import { stripHtml } from '../lib/text.js';

// Careerjet job-search API (v4) — aggregator with per-country LATAM locales, and
// the one net-new LATAM source whose terms make RE-DISPLAY the intended use, so
// it's a display source (in build-jobs.py's OK set).
//
// Auth: HTTP Basic, API key as the username + empty password (CAREERJET_API_KEY,
// stored in repo secrets — never in code). Skips silently without the key, so
// the nightly is safe before it lands. Careerjet also requires the calling
// server's IP to be allow-listed in the partner dashboard, so this only returns
// data when it runs from a declared static IP (see docs/25). Notes: descriptions
// are excerpts (thinner for skill extraction); `url` is a Careerjet click-tracker
// — that redirect IS the attribution/backlink their terms ask for.
export const name = 'careerjet';

const ENDPOINT = 'https://search.api.careerjet.net/v4/query';
// LATAM locales; salary_currency_code in the response overrides this per-job.
const LOCALES = [
  { code: 'es_MX', ccy: 'MXN' }, { code: 'pt_BR', ccy: 'BRL' }, { code: 'es_AR', ccy: 'ARS' },
  { code: 'es_CO', ccy: 'COP' }, { code: 'es_CL', ccy: 'CLP' }, { code: 'es_PE', ccy: 'PEN' },
];
// A field-spanning keyword sweep (the API needs a query; empty returns little).
const TERMS = ['developer', 'designer', 'marketing', 'ventas', 'engineer', 'analyst', 'product'];
const PERIOD = { Y: 'year', M: 'month', W: 'week', D: 'day', H: 'hour' };

function postedDate(s) {
  if (!s) return null;
  const t = Date.parse(String(s).replace(/^(\w{3}),(\d)/, '$1, $2')); // "Wed,15 Nov" -> "Wed, 15 Nov"
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : null;
}

export async function fetchRaw({ log }) {
  const key = process.env.CAREERJET_API_KEY;
  if (!key) { log('careerjet: no CAREERJET_API_KEY set — skipping (free key at careerjet.com/partners; IP allow-list required)'); return []; }
  const auth = `Basic ${Buffer.from(`${key}:`).toString('base64')}`;

  const byId = new Map();
  for (const { code, ccy } of LOCALES) {
    for (const kw of TERMS) {
      const url = `${ENDPOINT}?locale_code=${code}&keywords=${encodeURIComponent(kw)}`
        + `&page_size=100&sort=date&user_ip=1.1.1.1&user_agent=${encodeURIComponent('PivotHopScraper/0.1')}`;
      const body = await fetchJson(url, {
        headers: { Authorization: auth, 'user-agent': 'PivotHopScraper/0.1 (career adjacency; cvinocoura@gmail.com)' },
        minIntervalMs: 2000,
      }).catch(() => null);
      if (body?.type !== 'JOBS') continue; // skip LOCATIONS mode / errors
      for (const j of body.jobs ?? []) {
        if (!j?.url || !j.title) continue;
        const id = crypto.createHash('sha1').update(j.url).digest('hex').slice(0, 16);
        if (byId.has(id)) continue;
        byId.set(id, {
          source: name,
          external_id: id,
          title: j.title ?? '',
          company: j.company || null,
          location: j.locations || null,
          remote_flag: /remote|remoto|home ?office|teletrabajo/i.test(`${j.title} ${j.locations ?? ''}`),
          salary_min: Number(j.salary_min) || null,
          salary_max: Number(j.salary_max) || null,
          currency: j.salary_currency_code || ccy,
          salary_period: PERIOD[j.salary_type] ?? null,
          description_text: stripHtml(j.description ?? '').slice(0, 20000),
          posted_at: postedDate(j.date),
          url: j.url,
        });
      }
    }
  }
  const rows = [...byId.values()];
  log(`careerjet: ${rows.length} distinct LATAM postings from ${LOCALES.length} locales`);
  return rows;
}
