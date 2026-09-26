import path from 'node:path';
import { stripHtml } from '../lib/text.js';
import { fetchJson } from '../lib/http.js';
import { readJson } from '../lib/store.js';
import { CONFIG_DIR } from '../lib/paths.js';

// BambooHR public careers feed (2026-09-26). Every BambooHR careers page is
// backed by {sub}.bamboohr.com/careers/list (open roles) and
// /careers/{id}/detail (description, date, pay), both public JSON. Found behind
// studio careers pages by studio-resolve (Ballinger, STUDIOS, Gillespies,
// Bluecadet...) and two Costa Rica employers (Gorilla Logic, Establishment Labs).
// The feed has no company name and often no country, so each config row
// carries both: { slug, company, country }.
export const name = 'bamboohr';

const DETAIL_CAP = Number(process.env.BAMBOOHR_MAX_JOBS || 400);
const REMOTE_TYPE = '1'; // locationType: 0 on site, 1 remote, 2 hybrid

export async function fetchRaw({ log }) {
  const companies = readJson(path.join(CONFIG_DIR, 'bamboohr-companies.json'))?.companies ?? [];
  const rows = [];
  for (const c of companies) {
    const slug = typeof c === 'string' ? c : c.slug;
    const company = (typeof c === 'object' && c.company) || slug;
    const country = typeof c === 'object' ? c.country : null;
    let list;
    try { list = await fetchJson(`https://${slug}.bamboohr.com/careers/list`, { headers: { accept: 'application/json' }, minIntervalMs: 600 }); }
    catch (err) { log(`bamboohr:${slug} — ${err.message} (board skipped, source continues)`); continue; }
    const jobs = Array.isArray(list?.result) ? list.result : null;
    if (!jobs) { log(`bamboohr:${slug} — no public board (skipped)`); continue; }
    log(`bamboohr:${slug} — ${jobs.length} postings`);
    for (const j of jobs.slice(0, DETAIL_CAP)) {
      let d = null;
      try { d = (await fetchJson(`https://${slug}.bamboohr.com/careers/${j.id}/detail`, { headers: { accept: 'application/json' }, minIntervalMs: 600 }))?.result?.jobOpening ?? null; }
      catch { d = null; } // the list row still carries title and place
      const loc = d?.location ?? j.location ?? {};
      const ats = d?.atsLocation ?? j.atsLocation ?? {};
      const place = [loc.city || ats.city, loc.state || ats.state || ats.province, loc.addressCountry || ats.country || country].filter(Boolean);
      const remote = String(d?.locationType ?? j.locationType) === REMOTE_TYPE || j.isRemote === true;
      rows.push({
        source: name,
        external_id: `${slug}:${j.id}`,
        title: String(d?.jobOpeningName ?? j.jobOpeningName ?? '').trim(),
        company,
        location: [...new Set(place)].join(', ') || (remote ? `Remote${country ? `, ${country}` : ''}` : country || null),
        remote_flag: remote,
        salary_min: null, salary_max: null, currency: null, salary_period: null,
        description_text: stripHtml(`${d?.description ?? ''}${d?.compensation ? `\nCompensation: ${d.compensation}` : ''}`).slice(0, 20000),
        posted_at: d?.datePosted ? new Date(d.datePosted).toISOString() : null,
        url: d?.jobOpeningShareUrl || `https://${slug}.bamboohr.com/careers/${j.id}`,
      });
    }
  }
  return rows;
}
