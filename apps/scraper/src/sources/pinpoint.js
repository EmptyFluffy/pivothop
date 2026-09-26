import path from 'node:path';
import { stripHtml } from '../lib/text.js';
import { fetchJson } from '../lib/http.js';
import { readJson } from '../lib/store.js';
import { CONFIG_DIR } from '../lib/paths.js';

// Pinpoint public postings feed (2026-09-26). {sub}.pinpointhq.com/postings.json
// is the JSON behind every Pinpoint careers site: title, place, workplace type,
// pay range with currency and period, and the full description in sections.
// Found behind studio careers pages by studio-resolve (RWDI, Overland Partners,
// Nicole Hollis, Maccreanor Lavington).
export const name = 'pinpoint';

const PERIOD = { year: 'year', annual: 'year', month: 'month', week: 'week', day: 'day', hour: 'hour' };

export async function fetchRaw({ log }) {
  const companies = readJson(path.join(CONFIG_DIR, 'pinpoint-companies.json'))?.companies ?? [];
  const rows = [];
  for (const c of companies) {
    const slug = typeof c === 'string' ? c : c.slug;
    const company = (typeof c === 'object' && c.company) || slug;
    let body;
    try { body = await fetchJson(`https://${slug}.pinpointhq.com/postings.json`, { minIntervalMs: 600 }); }
    catch (err) { log(`pinpoint:${slug} — ${err.message} (board skipped, source continues)`); continue; }
    const jobs = Array.isArray(body?.data) ? body.data : null;
    if (!jobs) { log(`pinpoint:${slug} — no public board (skipped)`); continue; }
    log(`pinpoint:${slug} — ${jobs.length} postings`);
    for (const j of jobs) {
      const loc = j.location ?? {};
      const min = Number(j.compensation_minimum) || null;
      const max = Number(j.compensation_maximum) || null;
      const shown = j.compensation_visible !== false && (min || max);
      const sections = [j.description, j.key_responsibilities_header, j.key_responsibilities, j.skills_knowledge_expertise_header, j.skills_knowledge_expertise, j.benefits_header, j.benefits].filter(Boolean).join('\n');
      rows.push({
        source: name,
        external_id: `${slug}:${j.id}`,
        title: String(j.title ?? '').trim(),
        company,
        location: loc.name || [loc.city, loc.province].filter(Boolean).join(', ') || null,
        remote_flag: j.workplace_type === 'remote' || j.workplace_type === 'hybrid',
        salary_min: shown ? min : null,
        salary_max: shown ? max : null,
        currency: shown ? j.compensation_currency || null : null,
        salary_period: shown ? PERIOD[j.compensation_frequency] ?? 'year' : null,
        description_text: stripHtml(sections.replace(/<!--[\s\S]*?-->/g, '')).slice(0, 20000),
        posted_at: null, // the feed carries no publish date; first-seen ages it
        url: j.url ?? `https://${slug}.pinpointhq.com/`,
      });
    }
  }
  return rows;
}
