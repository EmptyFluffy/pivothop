import path from 'node:path';
import { stripHtml } from '../lib/text.js';
import { fetchJson, hard } from '../lib/http.js';
import { readJson } from '../lib/store.js';
import { CONFIG_DIR } from '../lib/paths.js';

// Breezy HR public board feed (2026-09-26). {sub}.breezy.hr/json lists every
// open position (title, place, date, pay text); the description lives on the
// posting page as JobPosting JSON-LD. Found behind studio careers pages by
// studio-resolve (Red Antler, Stoss, Michael Green Architecture, MKThink...).
export const name = 'breezy';

const UA = 'Mozilla/5.0 (compatible; PivotHopScraper/0.1; contact: hello@pivothop.com)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PAGE_CAP = Number(process.env.BREEZY_MAX_JOBS || 300);

// "$90,000 – $105,000 / year", "€45k - €55k", "$40/hr"
function pay(text, countryId) {
  const s = String(text || '');
  if (!s) return {};
  const nums = [...s.matchAll(/(\d[\d,.]*)\s*(k)?/gi)].map((m) => Number(m[1].replace(/,/g, '')) * (m[2] ? 1000 : 1)).filter((n) => n > 0);
  if (!nums.length) return {};
  const currency = /€/.test(s) ? 'EUR' : /£/.test(s) ? 'GBP' : /\$/.test(s) ? ({ CA: 'CAD', AU: 'AUD', NZ: 'NZD', MX: 'MXN' }[countryId] ?? 'USD') : null;
  const period = /hour|hr\b/i.test(s) ? 'hour' : /month/i.test(s) ? 'month' : 'year';
  return { salary_min: Math.min(...nums), salary_max: Math.max(...nums), currency, salary_period: period };
}

async function description(url) {
  try {
    const res = await hard(fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) }), 30000, url);
    if (!res.ok) { await res.body?.cancel(); return ''; }
    const html = await hard(res.text(), 30000, url);
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      // raw newlines inside the description string make the block invalid JSON
      let j; try { j = JSON.parse(m[1].replace(/[\u0000-\u001f]+/g, ' ')); } catch { continue; }
      if (j?.['@type'] === 'JobPosting') return stripHtml(j.description ?? '');
    }
    const div = html.match(/<div class="description">([\s\S]*?)<\/div>\s*<\/div>/);
    return div ? stripHtml(div[1]) : '';
  } catch { return ''; }
}

export async function fetchRaw({ log }) {
  const companies = readJson(path.join(CONFIG_DIR, 'breezy-companies.json'))?.companies ?? [];
  const rows = [];
  for (const slug of companies) {
    let list;
    try { list = await fetchJson(`https://${slug}.breezy.hr/json`, { minIntervalMs: 600 }); }
    catch (err) { log(`breezy:${slug} — ${err.message} (board skipped, source continues)`); continue; }
    if (!Array.isArray(list)) { log(`breezy:${slug} — no public board (skipped)`); continue; }
    log(`breezy:${slug} — ${list.length} postings`);
    for (const j of list.slice(0, PAGE_CAP)) {
      const loc = j.location ?? {};
      const cid = loc.country?.id;
      const text = j.url ? await description(j.url) : '';
      await sleep(500);
      rows.push({
        source: name,
        external_id: `${slug}:${j.id}`,
        title: String(j.name ?? '').trim(),
        company: j.company?.name || slug,
        location: loc.name || [loc.city, loc.state?.name ?? loc.state, loc.country?.name].filter(Boolean).join(', ') || null,
        remote_flag: loc.is_remote === true,
        salary_min: null, salary_max: null, currency: null, salary_period: null,
        ...pay(j.salary, cid),
        description_text: text.slice(0, 20000),
        posted_at: j.published_date ? new Date(j.published_date).toISOString() : null,
        url: j.url ?? `https://${slug}.breezy.hr/`,
      });
    }
  }
  return rows;
}
