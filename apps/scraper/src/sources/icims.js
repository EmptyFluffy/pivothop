import path from 'node:path';
import { stripHtml } from '../lib/text.js';
import { hard } from '../lib/http.js';
import { readJson } from '../lib/store.js';
import { CONFIG_DIR } from '../lib/paths.js';

// iCIMS public career portals (2026-09-27). {sub}.icims.com/jobs/search
// ?ss=1&in_iframe=1&pr=N lists 20 openings per page as plain links
// (/jobs/{id}/{slug}/job); every opening page carries a JobPosting JSON-LD
// (title, date, place, full description, pay when published). Used by large
// AEC firms (Walter P Moore, Corgan, Design Workshop, LHB, Cundall).
// Config: { sub, company }.
export const name = 'icims';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MAX_JOBS = Number(process.env.ICIMS_MAX_JOBS || 500);
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
const clean = (v) => (v && !/^unavailable$/i.test(String(v)) ? String(v) : null);
const PERIOD = { YEAR: 'year', MONTH: 'month', WEEK: 'week', DAY: 'day', HOUR: 'hour' };

export async function fetchRaw({ log }) {
  const companies = readJson(path.join(CONFIG_DIR, 'icims-companies.json'))?.companies ?? [];
  const rows = [];
  for (const c of companies) {
    const base = `https://${c.sub}.icims.com`;
    const ids = new Map();
    try {
      for (let pr = 0; pr < 40 && ids.size < MAX_JOBS; pr++) {
        const html = await get(`${base}/jobs/search?ss=1&in_iframe=1&pr=${pr}`);
        if (!html) break;
        const before = ids.size;
        for (const m of html.matchAll(/\/jobs\/(\d+)\/([^/"?]+)\/job/g)) if (!ids.has(m[1])) ids.set(m[1], `${base}/jobs/${m[1]}/${m[2]}/job`);
        if (ids.size === before) break; // past the last page
        await sleep(700);
      }
    } catch (err) { log(`icims:${c.sub} — ${err.message} (board skipped, source continues)`); continue; }
    if (!ids.size) { log(`icims:${c.sub} — no public openings (skipped)`); continue; }
    log(`icims:${c.sub} — ${ids.size} postings (${c.company})`);
    for (const [id, url] of [...ids].slice(0, MAX_JOBS)) {
      let jp = null; try { jp = posting(await get(`${url}?in_iframe=1`)); } catch { jp = null; }
      await sleep(700);
      if (!jp) continue;
      const a = [].concat(jp.jobLocation ?? [])[0]?.address ?? {};
      const pay = jp.baseSalary?.value ?? {};
      const min = Number(pay.minValue) || null; const max = Number(pay.maxValue) || null;
      rows.push({
        source: name,
        external_id: `${c.sub}:${id}`,
        title: String(jp.title ?? '').trim(),
        company: c.company,
        location: [clean(a.addressLocality), clean(a.addressRegion), clean(a.addressCountry)].filter(Boolean).join(', ') || null,
        remote_flag: /TELECOMMUTE/i.test(String(jp.jobLocationType ?? '')) || /\bremote\b/i.test(String(jp.title ?? '')),
        salary_min: min, salary_max: max,
        currency: min || max ? jp.baseSalary?.currency || 'USD' : null,
        salary_period: min || max ? PERIOD[String(pay.unitText || '').toUpperCase()] ?? 'year' : null,
        description_text: stripHtml(jp.description ?? '').slice(0, 20000),
        posted_at: jp.datePosted && !Number.isNaN(Date.parse(jp.datePosted)) ? new Date(jp.datePosted).toISOString() : null,
        url,
      });
    }
  }
  return rows;
}
