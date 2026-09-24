import path from 'node:path';
import { fetchJson } from '../lib/http.js';
import { stripHtml } from '../lib/text.js';
import { readJson } from '../lib/store.js';
import { CONFIG_DIR } from '../lib/paths.js';

// SmartRecruiters public postings API — api.smartrecruiters.com/v1/companies/{id}/postings.
// Keyless. This is where the big AEC employers live (the Greenhouse of enterprise).
// Full text costs one detail call per posting, so details are capped per company and
// cached on disk — repeated runs deepen coverage for free.
export const name = 'smartrecruiters';

const DETAILS_PER_COMPANY = 120;

export async function fetchRaw({ log }) {
  const companies = readJson(path.join(CONFIG_DIR, 'smartrecruiters-companies.json'))?.companies ?? [];
  const rows = [];
  for (const c of companies) {
    let list;
    try { list = await fetchJson(`https://api.smartrecruiters.com/v1/companies/${c}/postings?limit=100`); }
    catch (err) { log(`smartrecruiters:${c} — ${err.message} (board skipped, source continues)`); continue; }
    if (!list?.content?.length) { log(`smartrecruiters:${c} — no public postings (skipped)`); continue; }
    let items = list.content;
    // up to SR_MAX_JOBS per company (200 -> 1000, 2026-09-24: SGS holds 4.5k,
    // AbbVie 1.9k, Primark 900; two pages read a fraction of them)
    const MAX = Number(process.env.SR_MAX_JOBS) || 1000;
    for (let offset = 100; offset < Math.min(list.totalFound, MAX) && items.length % 100 === 0; offset += 100) {
      const page = await fetchJson(`https://api.smartrecruiters.com/v1/companies/${c}/postings?limit=100&offset=${offset}`).catch((err) => { log(`smartrecruiters:${c} p${offset / 100 + 1} — ${err.message}`); return null; });
      if (!page?.content?.length) break;
      items = items.concat(page.content);
    }
    log(`smartrecruiters:${c} — ${items.length} postings (of ${list.totalFound})`);
    let detailed = 0;
    for (const j of items) {
      let text = '';
      if (detailed < DETAILS_PER_COMPANY) {
        const d = await fetchJson(`https://api.smartrecruiters.com/v1/companies/${c}/postings/${j.id}`, { minIntervalMs: 700 }).catch(() => null);
      if (!d) continue;
        const sec = d?.jobAd?.sections ?? {};
        text = stripHtml([sec.jobDescription?.text, sec.qualifications?.text, sec.additionalInformation?.text].filter(Boolean).join('\n'));
        detailed++;
      }
      rows.push({
        source: name,
        external_id: `${c}:${j.id}`,
        title: j.name ?? '',
        company: c,
        location: [j.location?.city, j.location?.country?.toUpperCase()].filter(Boolean).join(', ') || null,
        remote_flag: Boolean(j.location?.remote),
        salary_min: null,
        salary_max: null,
        currency: null,
        salary_period: null,
        description_text: text.slice(0, 20000),
        posted_at: j.releasedDate ?? null,
        url: `https://jobs.smartrecruiters.com/${c}/${j.id}`,
      });
    }
  }
  return rows;
}
