import { fetchJson } from '../lib/http.js';
import { stripHtml } from '../lib/text.js';

// Jooble partner API — free key at jooble.org/api/about. Costa Rica scope: the
// sanctioned route into the inventory Computrabajo/Tecoloco/elempleo hold
// (their sites disallow or gate scraping; Jooble aggregates them and offers
// the API for exactly this). Skips silently without JOOBLE_API_KEY, same
// pattern as Careerjet. Results are snippets + redirect links; the redirect
// IS the attribution their terms ask for. Feeds counts, titles, locations.
export const name = 'jooble';

const TERMS = ['', 'ventas', 'ingeniero', 'desarrollador', 'contabilidad', 'servicio al cliente',
  'operario', 'administrativo', 'enfermeria', 'marketing', 'soporte', 'bilingue'];

export async function fetchRaw({ log }) {
  const key = process.env.JOOBLE_API_KEY;
  if (!key) { log('jooble: no JOOBLE_API_KEY set — skipping (free key at jooble.org/api/about)'); return []; }
  // The CR inventory lives on cr.jooble.org and Jooble keys are SITE-BOUND:
  // a key issued on the global site 400s here (probed 2026-08-22 — the global
  // index has zero Heredia results and matches "Costa Rica" to Costa, WV).
  // Request the key from cr.jooble.org/api/about, or pick Costa Rica in the
  // signup form. A wrong-site key fails the first call and skips cleanly.
  const byId = new Map();
  for (const kw of TERMS) {
    for (let page = 1; page <= 5; page++) {
      let body;
      try {
        body = await fetchJson(`https://cr.jooble.org/api/${key}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ keywords: kw, location: 'Costa Rica', page: String(page) }),
        });
      } catch { break; }
      const jobs = body?.jobs ?? [];
      for (const j of jobs) {
        const id = String(j.id ?? j.link);
        if (byId.has(id)) continue;
        byId.set(id, {
          source: name,
          external_id: id,
          title: j.title ?? '',
          company: j.company || null,
          location: j.location || 'Costa Rica',
          remote_flag: /remoto|remote/i.test(`${j.title} ${j.location}`),
          salary_min: null, salary_max: null, currency: null, salary_period: null,
          description_text: stripHtml(j.snippet ?? '').slice(0, 4000),
          posted_at: j.updated ? String(j.updated).slice(0, 10) : null,
          url: j.link ?? null,
          country: 'CR',
        });
      }
      if (jobs.length < 20) break;
    }
  }
  log(`jooble: ${byId.size} distinct Costa Rica postings`);
  return [...byId.values()];
}
