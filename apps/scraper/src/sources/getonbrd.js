import { fetchJson } from '../lib/http.js';
import { stripHtml } from '../lib/text.js';

// GetOnBoard (getonbrd.com) — LATAM (Chile-led) tech jobs. Keyless public API,
// full job description + per-country geo + salary: the richest LATAM signal for
// the adjacency/skill engine.
//
// DATA-ONLY (not in build-jobs.py's re-display OK set): the public API grants no
// re-display right in its docs, so — same stance as Adzuna/Reed — these postings
// enrich the LATAM corpus and region adjacency but are NOT shown on the board.
// If GetOnBoard confirms re-display + backlink by email, add 'getonbrd' to the
// OK set and it becomes a display source too (it already carries links.public_url).
export const name = 'getonbrd';

const API = 'https://www.getonbrd.com/api/v0';
const HDRS = { 'user-agent': 'PivotHopScraper/0.1 (career adjacency research; contact: cvinocoura@gmail.com)' };

// GetOnBoard country labels (ES/PT) -> English, so normalize/country.js resolves
// the ISO code. "Remote" is dropped; a remote-only row keeps location 'Remote'.
const CC = {
  'Chile': 'Chile', 'Brasil': 'Brazil', 'Brazil': 'Brazil', 'México': 'Mexico', 'Mexico': 'Mexico',
  'Argentina': 'Argentina', 'Colombia': 'Colombia', 'Perú': 'Peru', 'Peru': 'Peru', 'Ecuador': 'Ecuador',
  'Uruguay': 'Uruguay', 'Paraguay': 'Paraguay', 'Bolivia': 'Bolivia', 'Venezuela': 'Venezuela',
  'Costa Rica': 'Costa Rica', 'Panamá': 'Panama', 'Guatemala': 'Guatemala', 'España': 'Spain',
  'Estados Unidos': 'United States',
};

async function get(url) {
  return fetchJson(url, { headers: HDRS, minIntervalMs: 1200 }).catch(() => null);
}

// The API paginates and reports meta.total_pages. Taking page 1 only, at
// per_page=50, was fetching 226 of the ~1,233 postings actually on offer — 18%
// of the feed. per_page=100 is accepted, and programming alone runs to 4 pages.
const PER_PAGE = 100;
const MAX_PAGES = 25;   // backstop against a malformed meta sending us spinning

export async function fetchRaw({ log }) {
  const cats = ((await get(`${API}/categories`))?.data ?? []).map((c) => c.id);
  const rows = [];
  const seen = new Set();
  for (const id of cats) {
    let page = 1, pages = 1;
    do {
      const body = await get(
        `${API}/categories/${id}/jobs?per_page=${PER_PAGE}&page=${page}&expand=%5B%22company%22%5D`
      );
      pages = Math.min(body?.meta?.total_pages ?? 1, MAX_PAGES);
      for (const j of body?.data ?? []) {
      if (!j?.id || seen.has(j.id)) continue;
      seen.add(j.id);
      const a = j.attributes ?? {};
      const co = a.company?.data?.attributes ?? {};
      const countries = (a.countries ?? []).filter((c) => c && c !== 'Remote');
      const loc = countries.map((c) => CC[c] ?? c).join(', ') || 'Remote';
      rows.push({
        source: name,
        external_id: String(j.id),
        title: a.title ?? '',
        company: co.name ?? null,
        location: loc,
        remote_flag: !!a.remote,
        salary_min: a.min_salary || null,
        salary_max: a.max_salary || null,
        currency: 'USD',        // GetOnBoard publishes gross monthly USD
        salary_period: 'month',
        description_text: stripHtml([a.description, a.functions, a.desirable, a.benefits].filter(Boolean).join('\n\n')).slice(0, 20000),
        posted_at: a.published_at ? new Date(a.published_at * 1000).toISOString().slice(0, 10) : null,
        url: j.links?.public_url ?? null,
      });
      }
      page += 1;
    } while (page <= pages);
  }
  log(`getonbrd: ${rows.length} distinct postings from ${cats.length} categories`);
  return rows;
}
