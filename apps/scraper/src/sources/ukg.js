import path from 'node:path';
import { stripHtml } from '../lib/text.js';
import { fetchJson, hard } from '../lib/http.js';
import { readJson } from '../lib/store.js';
import { CONFIG_DIR } from '../lib/paths.js';

// UKG (UltiPro) Recruiting public job boards (2026-09-27). The careers widget
// behind recruiting(2).ultipro.com/{TENANT}/JobBoard/{guid}/ is backed by a
// public POST .../JobBoardView/LoadSearchResults (Top/Skip paging, totalCount)
// and each opening's page embeds its description as JSON. Common with large
// US architecture and engineering firms (Perkins&Will, Cooper Carry, Moody
// Nolan, WATG, CBT, DeSimone, Salas O'Brien). Config: { tenant, board, company, host? }.
export const name = 'ukg';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const HOSTS = ['recruiting2.ultipro.com', 'recruiting.ultipro.com'];
const MAX_JOBS = Number(process.env.UKG_MAX_JOBS || 600);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const search = (skip) => JSON.stringify({
  opportunitySearch: { Top: 50, Skip: skip, QueryString: '', Filters: [4, 5, 6, 37].map((f) => ({ t: 'TermsSearchFilterDto', fieldName: f, extra: null, values: [] })) },
  matchCriteria: { PreferredJobs: [], Educations: [], LicenseAndCertifications: [], Skills: [], hasNoLicenses: false, SkippedSkills: [] },
});

async function page(base, skip) {
  return fetchJson(`${base}/JobBoardView/LoadSearchResults`, { method: 'POST', body: search(skip), headers: { 'content-type': 'application/json', 'user-agent': UA }, minIntervalMs: 900 });
}

async function description(base, id) {
  try {
    const url = `${base}/OpportunityDetail?opportunityId=${id}`;
    const res = await hard(fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) }), 30000, url);
    if (!res.ok) { await res.body?.cancel(); return ''; }
    const html = await hard(res.text(), 30000, url);
    const m = html.match(/"Description":("(?:[^"\\]|\\.)*")/);
    return m ? stripHtml(JSON.parse(m[1])) : '';
  } catch { return ''; }
}

export async function fetchRaw({ log }) {
  const companies = readJson(path.join(CONFIG_DIR, 'ukg-companies.json'))?.companies ?? [];
  const rows = [];
  for (const c of companies) {
    let base = null; let first = null;
    for (const h of c.host ? [c.host] : HOSTS) {
      const b = `https://${h}/${c.tenant}/JobBoard/${c.board}`;
      try { first = await page(b, 0); } catch { first = null; }
      if (Array.isArray(first?.opportunities)) { base = b; break; }
    }
    if (!base) { log(`ukg:${c.tenant} — no public board (skipped)`); continue; }
    const total = Math.min(first.totalCount ?? first.opportunities.length, MAX_JOBS);
    const opps = [...first.opportunities];
    for (let skip = 50; skip < total; skip += 50) {
      const p = await page(base, skip).catch(() => null);
      if (!p?.opportunities?.length) break;
      opps.push(...p.opportunities);
    }
    log(`ukg:${c.tenant} — ${opps.length} postings (${c.company})`);
    for (const o of opps.slice(0, MAX_JOBS)) {
      const a = o.Locations?.[0]?.Address ?? {};
      const text = await description(base, o.Id);
      await sleep(700);
      rows.push({
        source: name,
        external_id: `${c.tenant}:${o.Id}`,
        title: String(o.Title ?? '').trim(),
        company: c.company,
        location: [a.City, a.State?.Code, a.Country?.Code].filter(Boolean).join(', ') || o.Locations?.[0]?.LocalizedDescription || null,
        remote_flag: /\bremote\b/i.test(`${o.Title} ${o.Locations?.[0]?.LocalizedDescription ?? ''}`),
        salary_min: null, salary_max: null, currency: null, salary_period: null,
        description_text: (text || stripHtml(o.BriefDescription ?? '')).slice(0, 20000),
        posted_at: o.PostedDate ? new Date(o.PostedDate).toISOString() : null,
        url: `${base}/OpportunityDetail?opportunityId=${o.Id}`,
      });
    }
  }
  return rows;
}
