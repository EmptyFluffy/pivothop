import path from 'node:path';
import { stripHtml } from '../lib/text.js';
import { readJson } from '../lib/store.js';
import { hard } from '../lib/http.js';
import { CONFIG_DIR } from '../lib/paths.js';

// Teamtailor public jobs RSS (2026-09-26). Every Teamtailor career site serves
// {sub}.teamtailor.com/jobs.rss: title, full description, publish date,
// remote status and structured locations (tt:city, tt:country). Common with
// Nordic and European studios (CEBRA, Kurppa Hosk, IttenBrechbühl).
export const name = 'teamtailor';

const UA = 'Mozilla/5.0 (compatible; PivotHopScraper/0.1; contact: hello@pivothop.com)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unesc = (s) => String(s ?? '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');
const tag = (xml, t) => { const m = xml.match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`)); return m ? unesc(m[1]).trim() : ''; };

export async function fetchRaw({ log }) {
  const companies = readJson(path.join(CONFIG_DIR, 'teamtailor-companies.json'))?.companies ?? [];
  const rows = [];
  for (const c of companies) {
    const slug = typeof c === 'string' ? c : c.slug;
    const company = (typeof c === 'object' && c.company) || slug;
    let xml;
    try {
      const url = `https://${slug}.teamtailor.com/jobs.rss`;
      const res = await hard(fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) }), 30000, url);
      if (!res.ok) { await res.body?.cancel(); log(`teamtailor:${slug} — HTTP ${res.status} (skipped)`); continue; }
      xml = await hard(res.text(), 30000, url);
    } catch (err) { log(`teamtailor:${slug} — ${err.message} (board skipped, source continues)`); continue; }
    await sleep(600);
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
    log(`teamtailor:${slug} — ${items.length} postings`);
    for (const it of items) {
      const link = tag(it, 'link');
      const locs = [...it.matchAll(/<tt:location>([\s\S]*?)<\/tt:location>/g)].map((m) => [tag(m[1], 'tt:city'), tag(m[1], 'tt:country')].filter(Boolean).join(', ')).filter(Boolean);
      const remote = tag(it, 'remoteStatus');
      const date = tag(it, 'pubDate');
      rows.push({
        source: name,
        external_id: `${slug}:${tag(it, 'guid') || link}`,
        title: tag(it, 'title'),
        company,
        location: locs[0] || null,
        remote_flag: /fully|remote|hybrid|temporary/i.test(remote) && !/none/i.test(remote),
        salary_min: null, salary_max: null, currency: null, salary_period: null,
        description_text: stripHtml(tag(it, 'description')).slice(0, 20000),
        posted_at: date && !Number.isNaN(Date.parse(date)) ? new Date(date).toISOString() : null,
        url: link || `https://${slug}.teamtailor.com/jobs`,
      });
    }
  }
  return rows;
}
