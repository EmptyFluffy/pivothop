import path from 'node:path';
import { fetchJson } from '../lib/http.js';
import { stripHtml } from '../lib/text.js';
import { readJson } from '../lib/store.js';
import { CONFIG_DIR } from '../lib/paths.js';

// Workday CXS — the public JSON API behind every *.myworkdayjobs.com careers
// site. This is what the firm's own careers page calls; no key, full-text
// descriptions on the detail endpoint. One adapter covers every Workday tenant,
// which is how the big AEC firms that looked "own-page only" (KPF, HKS) become
// scrapeable after all: their careers pages are skins over exactly this API.
//
// Tenants are curated in config/workday-companies.json as {tenant, wd, site,
// company}; verified by fetching a real posting before being added (the studio
// probe of 2026-08-03 found four namesake boards among 18 hits — never add a
// slug unverified). The direct-careers adapter logs any myworkdayjobs.com URL
// it encounters, which is where new tenants come from.
//
// Cloudflare fronts these endpoints and blocks empty/anonymous user agents, so
// requests carry the browser-style UA with our contact — same posture as
// jobroom: read what the visitor's browser reads, politely, capped.
export const name = 'workday';

const UA = 'Mozilla/5.0 (compatible; PivotHopScraper/0.1; contact: hello@pivothop.com)';
const PAGE = 20; // Workday's own page size; the list endpoint caps limit at 20
const MAX_JOBS = 200; // per tenant, a runaway guard — these firms post dozens, not thousands

function extractSalary(text) {
  const m = text.match(/(?:salary|pay|compensation|base)[^\n]{0,80}?\$\s?([\d,]{4,11})(?:\.\d{2})?(?:\s?(?:[-–—]|to){1,3}\s?\$?\s?([\d,]{4,11})(?:\.\d{2})?)?/i)
    || text.match(/\$\s?([\d,]{6,11})(?:\.\d{2})?\s?[-–—]\s?\$?\s?([\d,]{6,11})(?:\.\d{2})?/);
  if (!m) return null;
  const lo = Number(m[1].replace(/,/g, ''));
  const hi = m[2] ? Number(m[2].replace(/,/g, '')) : lo;
  if (!lo || hi < 20000 || hi > 2000000) return null;
  return { min: lo, max: hi };
}

export async function fetchRaw({ log }) {
  const tenants = readJson(path.join(CONFIG_DIR, 'workday-companies.json'))?.tenants ?? [];
  const rows = [];
  for (const { tenant, wd, site, company } of tenants) {
    const base = `https://${tenant}.${wd}.myworkdayjobs.com/wday/cxs/${tenant}/${site}`;
    const posts = [];
    for (let offset = 0; offset < MAX_JOBS; offset += PAGE) {
      const body = await fetchJson(`${base}/jobs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'user-agent': UA },
        body: JSON.stringify({ limit: PAGE, offset, searchText: '' }),
        minIntervalMs: 1500,
      }).catch(() => null);
      const page = body?.jobPostings ?? [];
      posts.push(...page);
      if (page.length < PAGE || posts.length >= (body?.total ?? 0)) break;
    }
    if (!posts.length) { log(`workday:${tenant} — no postings (skipped)`); continue; }

    let kept = 0;
    for (const p of posts) {
      if (!p.externalPath || !p.title) continue;
      const detail = await fetchJson(`${base}${p.externalPath}`, {
        headers: { accept: 'application/json', 'user-agent': UA },
        minIntervalMs: 1500,
      }).catch(() => null);
      const info = detail?.jobPostingInfo;
      if (!info) continue;
      const text = stripHtml(info.jobDescription || '');
      const salary = extractSalary(text);
      rows.push({
        source: name,
        external_id: `${tenant}:${info.id || p.externalPath}`,
        title: info.title || p.title,
        company,
        location: info.location || p.locationsText || null,
        remote_flag: /\bremote\b/i.test(`${info.title} ${info.location || ''} ${text.slice(0, 2000)}`),
        salary_min: salary?.min ?? null,
        salary_max: salary?.max ?? null,
        currency: salary ? 'USD' : null,
        salary_period: salary ? 'year' : null,
        description_text: text.slice(0, 20000),
        posted_at: info.startDate || null,
        url: info.externalUrl || `https://${tenant}.${wd}.myworkdayjobs.com/${site}${p.externalPath}`,
      });
      kept++;
    }
    log(`workday:${tenant} — ${kept} postings (${company})`);
  }
  return rows;
}
