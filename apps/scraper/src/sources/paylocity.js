import path from 'node:path';
import { stripHtml } from '../lib/text.js';
import { hard } from '../lib/http.js';
import { readJson } from '../lib/store.js';
import { CONFIG_DIR } from '../lib/paths.js';

// Paylocity Recruiting public job boards (2026-09-27). The board page
// recruiting.paylocity.com/recruiting/jobs/All/{guid} embeds its openings as
// window.pageData.Jobs (title, place, date, remote); each opening's Details
// page carries a full JobPosting JSON-LD. Common with mid-size US design
// firms (Miller Hull, GBBN, Steinberg Hart, SERA, EwingCole, Mahlum, Vocon).
// Config: { guid, company }.
export const name = 'paylocity';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url) {
  const res = await hard(fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) }), 30000, url);
  if (!res.ok) { await res.body?.cancel(); return null; }
  return hard(res.text(), 30000, url);
}
function posting(html) {
  for (const m of String(html || '').matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let j; try { j = JSON.parse(m[1].replace(/[\u0000-\u001f]+/g, ' ')); } catch { continue; }
    if (j?.['@type'] === 'JobPosting') return j;
  }
  return null;
}
const PERIOD = { YEAR: 'year', MONTH: 'month', WEEK: 'week', DAY: 'day', HOUR: 'hour' };

export async function fetchRaw({ log }) {
  const companies = readJson(path.join(CONFIG_DIR, 'paylocity-companies.json'))?.companies ?? [];
  const rows = [];
  for (const c of companies) {
    let jobs = null;
    try {
      const html = await get(`https://recruiting.paylocity.com/recruiting/jobs/All/${c.guid}`);
      const m = html?.match(/window\.pageData\s*=\s*(\{[\s\S]*?\});\s*\n/);
      jobs = m ? JSON.parse(m[1]).Jobs : null;
    } catch (err) { log(`paylocity:${c.company} — ${err.message} (board skipped, source continues)`); continue; }
    if (!Array.isArray(jobs)) { log(`paylocity:${c.company} — no public board (skipped)`); continue; }
    const open = jobs.filter((j) => !j.IsInternal);
    log(`paylocity:${c.company} — ${open.length} postings`);
    for (const j of open) {
      const url = `https://recruiting.paylocity.com/Recruiting/Jobs/Details/${j.JobId}`;
      let jp = null; try { jp = posting(await get(url)); } catch { jp = null; }
      await sleep(700);
      const loc = j.JobLocation ?? {};
      const pay = jp?.baseSalary?.value ?? {};
      const min = Number(pay.minValue) || null; const max = Number(pay.maxValue) || null;
      rows.push({
        source: name,
        external_id: `${c.guid}:${j.JobId}`,
        title: String(j.JobTitle ?? '').trim(),
        company: c.company,
        location: [loc.City, loc.State, loc.Country].filter(Boolean).join(', ') || j.LocationName || null,
        remote_flag: j.IsRemote === true,
        salary_min: min, salary_max: max,
        currency: min || max ? jp?.baseSalary?.currency || 'USD' : null,
        salary_period: min || max ? PERIOD[String(pay.unitText || '').toUpperCase()] ?? 'year' : null,
        description_text: stripHtml(jp?.description || j.Description || '').slice(0, 20000),
        posted_at: j.PublishedDate ? new Date(j.PublishedDate).toISOString() : null,
        url,
      });
    }
  }
  return rows;
}
