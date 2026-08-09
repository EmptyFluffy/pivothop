import path from 'node:path';
import { stripHtml } from '../lib/text.js';
import { fetchJson } from '../lib/http.js';
import { readJson } from '../lib/store.js';
import { CONFIG_DIR } from '../lib/paths.js';

// Workable public widget API — companies expose JSON deliberately at
// apply.workable.com/api/v1/widget/accounts/{account}. Same contract as
// Greenhouse/Lever: public feed, meant for embedding, link-back to apply.
// Heavy in EU and SMB land, which diversifies the board's company mix.
export const name = 'workable';

const strip = (h) => stripHtml(h ?? ''); // canonical: keeps </li>/</p> as newlines for skill zoning

export async function fetchRaw({ log }) {
  const companies = readJson(path.join(CONFIG_DIR, 'workable-companies.json'))?.companies ?? [];
  const rows = [];
  for (const c of companies) {
    let body;
    try { body = await fetchJson(`https://apply.workable.com/api/v1/widget/accounts/${c}?details=true`); }
    catch (err) { log(`workable:${c} — ${err.message} (board skipped, source continues)`); continue; }
    const jobs = body?.jobs;
    if (!Array.isArray(jobs)) { log(`workable:${c} — no public board (skipped)`); continue; }
    log(`workable:${c} — ${jobs.length} postings`);
    for (const j of jobs) {
      const loc = [j.city, j.country].filter(Boolean).join(', ') || j.location?.city || null;
      rows.push({
        source: name,
        external_id: `${c}:${j.shortcode ?? j.id}`,
        title: j.title ?? '',
        company: body.name || c,
        location: loc,
        remote_flag: !!j.telecommuting,
        salary_min: null,
        salary_max: null,
        currency: null,
        salary_period: null,
        description_text: strip(`${j.description ?? ''}\n${j.requirements ?? ''}\n${j.benefits ?? ''}`).slice(0, 20000),
        posted_at: j.published_on ? new Date(j.published_on).toISOString() : null,
        url: j.url ?? j.application_url ?? null,
      });
    }
  }
  return rows;
}
