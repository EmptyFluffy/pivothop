import path from 'node:path';
import { stripHtml } from '../lib/text.js';
import { readJson } from '../lib/store.js';
import { CONFIG_DIR } from '../lib/paths.js';

// Personio — the public XML feed every Personio careers page publishes at
// <tenant>.jobs.personio.com/xml. Keyless, full job descriptions, one request
// per company. Found 2026-08-03 while chasing why the direct adapter returned
// nothing: Zaha Hadid Architects, which looked like a bespoke careers page,
// actually redirects to zha.jobs.personio.com.
//
// Personio is the dominant HR platform for European mid-market employers, which
// makes this adapter disproportionately valuable for the Swiss build-out
// (docs/32): most CH firms of the size we care about run it, and the feed gives
// full German/French descriptions the miner can read.
//
// Tenants are curated in config/personio-companies.json and VERIFIED against a
// real position before being added — the studio probe found four namesake
// boards among 18 hits, so nothing enters on a guess.
export const name = 'personio';

const UA = 'Mozilla/5.0 (compatible; PivotHopScraper/0.1; contact: hello@pivothop.com)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The feed is flat, machine-generated, and never nests a <position> inside a
// <position>, so scanning tag to tag is safe here and avoids a parser
// dependency. Entities are decoded once, at the leaf.
function decode(s) {
  return String(s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}
const tag = (xml, t) => {
  const m = xml.match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`));
  return m ? decode(m[1]).trim() : null;
};

function parsePositions(xml) {
  return [...xml.matchAll(/<position>([\s\S]*?)<\/position>/g)].map((m) => m[1]);
}

// Personio carries structured salary only when the employer fills it in; most
// leave it blank, so the description is the fallback the other adapters use.
function extractSalary(text) {
  const m = text.match(/(?:salary|gehalt|lohn|salaire|compensation)[^\n]{0,80}?([€£$]|CHF)\s?([\d',.]{4,12})(?:\s?(?:[-–—]|to|bis)\s?([€£$]|CHF)?\s?([\d',.]{4,12}))?/i);
  if (!m) return null;
  const num = (s) => Number(String(s).replace(/[',.](?=\d{3}\b)/g, '').replace(/[^\d]/g, ''));
  const lo = num(m[2]);
  const hi = m[4] ? num(m[4]) : lo;
  if (!lo || hi < 20000 || hi > 2000000) return null;
  const sym = m[1] || m[3];
  return { min: lo, max: hi, currency: sym === '€' ? 'EUR' : sym === '£' ? 'GBP' : sym === '$' ? 'USD' : 'CHF' };
}

export async function fetchRaw({ log }) {
  const tenants = readJson(path.join(CONFIG_DIR, 'personio-companies.json'))?.tenants ?? [];
  const rows = [];
  for (const { tenant, company, host = 'jobs.personio.com' } of tenants) {
    const url = `https://${tenant}.${host}/xml`;
    let xml = null;
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/xml' }, signal: AbortSignal.timeout(25000) });
      if (res.ok) xml = await res.text();
    } catch { /* network — reported as a skip below */ }
    await sleep(1200);
    if (!xml) { log(`personio:${tenant} — feed unreachable (skipped)`); continue; }

    let kept = 0;
    for (const p of parsePositions(xml)) {
      const id = tag(p, 'id');
      const title = tag(p, 'name');
      if (!id || !title) continue;
      // jobDescriptions holds several named sections; concatenate their values
      // so the miner reads the whole ad, not just the first block.
      const body = [...p.matchAll(/<value>([\s\S]*?)<\/value>/g)].map((m) => stripHtml(decode(m[1]))).join('\n\n');
      const office = tag(p, 'office');
      const salary = extractSalary(body);
      const employmentType = tag(p, 'employmentType');
      rows.push({
        source: name,
        external_id: `${tenant}:${id}`,
        title,
        company,
        location: office || null,
        remote_flag: /\bremote\b|home ?office|télétravail/i.test(`${title} ${office || ''} ${body.slice(0, 2000)}`),
        salary_min: salary?.min ?? null,
        salary_max: salary?.max ?? null,
        currency: salary?.currency ?? null,
        salary_period: salary ? 'year' : null,
        description_text: body.slice(0, 20000),
        posted_at: tag(p, 'createdAt') || null,
        url: `https://${tenant}.${host}/job/${id}`,
        employment_type: employmentType || null,
      });
      kept++;
    }
    log(`personio:${tenant} — ${kept} postings (${company})`);
  }
  return rows;
}
