import crypto from 'node:crypto';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = 'PivotHopScraper/0.1 (+https://www.pivothop.com; hello@pivothop.com)';

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(45000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// ANE — Agencia Nacional de Empleo (ane.cr), Costa Rica's public employment
// service (MTSS/INA). The CR counterpart of the Swiss Job-Room: a statutory
// vacancy-dissemination portal, server-rendered, publicly searchable with no
// login and no robots.txt restrictions (robots.txt 404s; probed 2026-08-22,
// 1,916 live vacancies). Heavily blue/pink-collar and regional — inventory no
// other source in the mix carries.
//
// Mechanics: GET /Puesto?Pagina=N pages through .job-listing blocks, 10 per
// page. There are no public detail pages (applying requires an ANE account),
// so the apply URL is the portal itself and external_id is a stable hash of
// the listing's own fields. Listings carry title, company (often
// "Confidencial"), a category line, "Plazas: N", locations, and a Spanish
// long-form date — no salary, no description body. Like Careerjet excerpts,
// this feeds COUNTS and locations; skill profiles come from full-text sources.
export const name = 'ane';

const BASE = 'https://www.ane.cr/Puesto';
const MAX_PAGES = 250;                 // runaway guard; ~192 pages live today
const SPACING_MS = 1500;               // polite: one public-agency page every 1.5s

const MONTHS = { enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
  julio: '07', agosto: '08', septiembre: '09', setiembre: '09', octubre: '10', noviembre: '11', diciembre: '12' };

function parseDate(s) {
  // "Publicado el viernes, 21 de agosto del 2026"
  const m = /(\d{1,2}) de ([a-zá-ú]+) del? (\d{4})/i.exec(s || '');
  if (!m) return null;
  const mm = MONTHS[m[2].toLowerCase()];
  return mm ? `${m[3]}-${mm}-${String(m[1]).padStart(2, '0')}` : null;
}

const unesc = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

function parsePage(html) {
  const out = [];
  const blocks = html.split('<div class="job-listing">').slice(1);
  for (const b of blocks) {
    const title = unesc((/job-listing-title[^>]*>(.*?)<\/h3>/s.exec(b) || [])[1] || '');
    if (!title) continue;
    // exact class: "job-listing-company-logo" shares the prefix and would greedily
    // swallow the logo markup into the company name
    const company = unesc((/class="job-listing-company text-right"[^>]*>(.*?)<\/h4>/s.exec(b) || [])[1] || '');
    const descs = [...b.matchAll(/<h4 class="job-listing-description">(.*?)<\/h4>/gs)].map((m) => unesc(m[1]));
    const category = descs.find((d) => !/^Plazas:/i.test(d)) || '';
    const posted = parseDate((/<small[^>]*>(.*?)<\/small>/s.exec(b) || [])[1] || '');
    const locs = [...b.matchAll(/add-location"><\/i>\s*([^<]+)</g)].map((m) => unesc(m[1]));
    out.push({ title, company, category, posted, location: locs.join('; ') });
  }
  return out;
}

export async function fetchRaw({ log }) {
  const rows = [];
  const seen = new Set();
  let total = null;
  for (let p = 1; p <= MAX_PAGES; p++) {
    let html;
    try {
      html = await fetchText(`${BASE}?Pagina=${p}`);
    } catch (e) {
      log(`ane: page ${p} failed (${String(e.message).slice(0, 60)}) — stopping with ${rows.length}`);
      break;
    }
    if (total == null) {
      const m = /Resultados encontrados:\s*([\d.,]+)/.exec(html || '');
      total = m ? Number(m[1].replace(/[.,]/g, '')) : 0;
    }
    const jobs = parsePage(html || '');
    if (!jobs.length) break;
    for (const j of jobs) {
      // stable identity: the portal has no public per-job URL, so the fields are the id
      const id = crypto.createHash('sha1')
        .update(['ane', j.title, j.company, j.location, j.posted].join('|')).digest('hex').slice(0, 16);
      if (seen.has(id)) continue;
      seen.add(id);
      rows.push({
        source: name,
        external_id: id,
        title: j.title,
        company: j.company && j.company !== 'Confidencial' ? j.company : null,
        location: j.location || 'Costa Rica',
        remote_flag: false,
        salary_min: null, salary_max: null, currency: null, salary_period: null,
        description_text: j.category ? `${j.category}.` : '',
        posted_at: j.posted,
        url: BASE,           // applying requires an ANE account; the portal is the origin
        country: 'CR',       // source ground truth: a Costa Rican public portal
      });
    }
    if (rows.length >= (total || Infinity)) break;
    await sleep(SPACING_MS);
  }
  log(`ane: ${rows.length} postings of ${total ?? '?'} listed (Costa Rica public employment service)`);
  return rows;
}
