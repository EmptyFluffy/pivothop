import crypto from 'node:crypto';
import { fetchJson } from '../lib/http.js';
import { stripHtml } from '../lib/text.js';

// Careerjet public API — aggregator with per-country LATAM locales, and the one
// net-new LATAM source whose terms make RE-DISPLAY the intended use ("if you'd
// like to embed Careerjet search results into your website, use the public
// search API"). So it's a display source (in build-jobs.py's OK set).
//
// Needs a free partner affiliate id (CAREERJET_AFFID) — register at
// careerjet.com/partners. Skips silently without it, so the nightly is safe
// before the key lands. Notes: descriptions are excerpts (thinner for skill
// extraction), and the `url` is a Careerjet click-tracker — that redirect IS the
// attribution/backlink their terms ask for.
export const name = 'careerjet';

// LATAM locales + the local currency Careerjet reports salaries in per locale.
const LOCALES = [
  { code: 'es_MX', ccy: 'MXN' }, { code: 'pt_BR', ccy: 'BRL' }, { code: 'es_AR', ccy: 'ARS' },
  { code: 'es_CO', ccy: 'COP' }, { code: 'es_CL', ccy: 'CLP' }, { code: 'es_PE', ccy: 'PEN' },
];
// A field-spanning keyword sweep (Careerjet needs a query; empty returns little).
const TERMS = ['developer', 'designer', 'marketing', 'ventas', 'engineer', 'analyst', 'product'];

export async function fetchRaw({ log }) {
  const affid = process.env.CAREERJET_AFFID;
  if (!affid) { log('careerjet: no CAREERJET_AFFID set — skipping (free key at careerjet.com/partners)'); return []; }

  const byId = new Map();
  for (const { code, ccy } of LOCALES) {
    for (const kw of TERMS) {
      const url = `http://public.api.careerjet.net/search?locale_code=${code}`
        + `&keywords=${encodeURIComponent(kw)}&pagesize=50&affid=${encodeURIComponent(affid)}`
        + `&user_ip=1.1.1.1&user_agent=PivotHopScraper&url=${encodeURIComponent('https://www.pivothop.com/jobs')}`;
      const body = await fetchJson(url, {
        headers: { Referer: 'https://www.pivothop.com/jobs', 'user-agent': 'PivotHopScraper/0.1 (career adjacency; cvinocoura@gmail.com)' },
        minIntervalMs: 2000,
      }).catch(() => null);
      for (const j of body?.jobs ?? []) {
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
          currency: j.salary_currency_label || ccy,
          salary_period: /year|año|anual/i.test(j.salary_type ?? '') ? 'year' : (/month|mes|mensual/i.test(j.salary_type ?? '') ? 'month' : null),
          description_text: stripHtml(j.description ?? '').slice(0, 20000),
          posted_at: j.date ?? null,
          url: j.url,
        });
      }
    }
  }
  const rows = [...byId.values()];
  log(`careerjet: ${rows.length} distinct LATAM postings from ${LOCALES.length} locales`);
  return rows;
}
