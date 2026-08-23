import { fetchJson } from '../lib/http.js';
import { stripHtml } from '../lib/text.js';

// Jooble partner API — free keys at jooble.org/api/about, SITE-BOUND: a key
// only works on the country site it was issued from (probed 2026-08-22; a
// global key 400s on cr.jooble.org and vice versa). Two sites run here:
//
//  - cr.jooble.org (JOOBLE_API_KEY): the Costa Rica inventory — the sanctioned
//    route into what Computrabajo/Tecoloco/elempleo hold but do not permit
//    scraping directly. Spanish sweep, country pinned CR (source ground truth).
//  - jooble.org (JOOBLE_US_API_KEY): the global/US index, swept ONLY with the
//    board's thin-market terms (AEC + trades — the same axis the Careerjet EN
//    sweeps target) so it fills gaps instead of duplicating Adzuna/ATS bulk.
//    Country left null; the location text carries it downstream.
//
// Results are snippets + redirect links; the redirect IS the attribution the
// terms ask for. Feeds counts, titles, locations. Each site skips silently
// without its key.
export const name = 'jooble';

const CR_TERMS = ['ventas', 'ingeniero', 'desarrollador', 'contabilidad', 'servicio al cliente',
  'operario', 'administrativo', 'enfermeria', 'marketing', 'soporte', 'bilingue',
  'asistente', 'tecnico', 'conductor', 'cocinero', 'bodeguero', 'vendedor', 'agente',
  'analista', 'supervisor', 'gerente', 'recepcionista', 'seguridad', 'limpieza'];
const US_THIN_TERMS = ['architect firm', 'architectural designer', 'drafter', 'bim',
  'interior designer', 'landscape architect', 'civil engineer', 'structural engineer',
  'construction manager', 'electrician', 'hvac technician', 'plumber', 'welder',
  'carpenter', 'surveyor', 'estimator'];

const SITES = [
  { host: 'cr.jooble.org', env: 'JOOBLE_API_KEY', country: 'CR', terms: CR_TERMS, label: 'Costa Rica' },
  { host: 'jooble.org', env: 'JOOBLE_US_API_KEY', country: null, terms: US_THIN_TERMS, label: 'global thin-market' },
];

export async function fetchRaw({ log }) {
  const byId = new Map();
  const counts = [];
  for (const site of SITES) {
    const key = process.env[site.env];
    if (!key) { log(`jooble: no ${site.env} set — skipping ${site.label}`); continue; }
    let n = 0;
    for (const kw of site.terms) {
      for (let page = 1; page <= 5; page++) {
        let body;
        try {
          body = await fetchJson(`https://${site.host}/api/${key}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ keywords: kw, location: '', page: String(page) }),
          });
        } catch { break; }
        const jobs = body?.jobs ?? [];
        for (const j of jobs) {
          const id = String(j.id ?? j.link);
          if (byId.has(id)) continue;
          n += 1;
          byId.set(id, {
            source: name,
            external_id: id,
            title: j.title ?? '',
            company: j.company || null,
            location: j.location || (site.country === 'CR' ? 'Costa Rica' : ''),
            remote_flag: /remoto|remote/i.test(`${j.title} ${j.location}`),
            salary_min: null, salary_max: null, currency: null, salary_period: null,
            description_text: stripHtml(j.snippet ?? '').slice(0, 4000),
            posted_at: j.updated ? String(j.updated).slice(0, 10) : null,
            url: j.link ?? null,
            ...(site.country ? { country: site.country } : {}),
          });
        }
        if (jobs.length < 20) break;
      }
    }
    counts.push(`${site.label} ${n}`);
  }
  log(`jooble: ${byId.size} distinct postings (${counts.join(', ')})`);
  return [...byId.values()];
}
