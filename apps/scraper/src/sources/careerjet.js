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
// Locales, each with its own currency default and its own keyword sweep — the
// API needs a query, and a German sweep run against Mexico would only burn the
// rate limit. salary_currency_code in the response overrides ccy per-job.
//
// SWITZERLAND (added 2026-08-02, the Swiss pivot's first corpus source): the
// adapter and key already existed for LATAM; Careerjet operates careerjet.ch
// with German and French locales, and its terms make re-display the intended
// use — the same reason it was chosen for LATAM. Excerpt-length descriptions,
// so this feeds COUNTS and SALARIES; skill profiles come from full-text sources
// (docs/31's lesson, unchanged by geography). en_CH may not exist as a locale;
// if the API rejects it, the catch below skips it silently and de/fr carry CH.
const LATAM_TERMS = ['developer', 'designer', 'marketing', 'ventas', 'engineer', 'analyst', 'product'];
const CH_DE_TERMS = ['informatiker', 'entwickler', 'ingenieur', 'pflege', 'techniker', 'verkauf', 'marketing', 'buchhaltung', 'projektleiter', 'quereinsteiger'];
const CH_FR_TERMS = ['développeur', 'ingénieur', 'infirmier', 'technicien', 'vente', 'comptable', 'chef de projet'];
const CH_EN_TERMS = ['engineer', 'developer', 'designer', 'analyst', 'product manager', 'consultant'];
// GB + US sweeps (added 2026-08-19, docs/34 amendments): the two thinnest
// English-language countries, served from the same key and the same terms of
// use. AEC terms lead because those are the thin roles.
const EN_TERMS = ['architect', 'civil engineer', 'structural engineer', 'bim', 'landscape architect',
  'mechanical engineer', 'electrical engineer', 'quantity surveyor',
  'engineer', 'developer', 'designer', 'analyst', 'nurse', 'accountant', 'project manager', 'consultant'];
const CR_TERMS = ['ventas', 'ingeniero', 'desarrollador', 'contabilidad', 'operario',
  'servicio al cliente', 'administrativo', 'enfermeria', 'bilingue', 'soporte', 'analista', 'marketing'];
const LOCALES = [
  // Costa Rica first (2026-08-22, the founder's home market): es_CR is a
  // confirmed locale in Careerjet's own client constants; CRC salaries.
  { code: 'es_CR', ccy: 'CRC', terms: CR_TERMS },
  { code: 'es_MX', ccy: 'MXN', terms: LATAM_TERMS }, { code: 'pt_BR', ccy: 'BRL', terms: LATAM_TERMS },
  { code: 'es_AR', ccy: 'ARS', terms: LATAM_TERMS }, { code: 'es_CO', ccy: 'COP', terms: LATAM_TERMS },
  { code: 'es_CL', ccy: 'CLP', terms: LATAM_TERMS }, { code: 'es_PE', ccy: 'PEN', terms: LATAM_TERMS },
  { code: 'de_CH', ccy: 'CHF', terms: CH_DE_TERMS },
  { code: 'fr_CH', ccy: 'CHF', terms: CH_FR_TERMS },
  { code: 'en_CH', ccy: 'CHF', terms: CH_EN_TERMS },
  { code: 'en_GB', ccy: 'GBP', terms: EN_TERMS },
  { code: 'en_US', ccy: 'USD', terms: EN_TERMS },
];
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
  for (const { code, ccy, terms } of LOCALES) {
    for (const kw of terms) {
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
  const ch = rows.filter((r) => r.currency === 'CHF').length;
  log(`careerjet: ${rows.length} distinct postings from ${LOCALES.length} locales (${ch} CHF/Swiss)`);
  return rows;
}
