import { fetchJson } from '../lib/http.js';
import { stripHtml } from '../lib/text.js';

// Job-Room (job-room.ch / arbeit.swiss) — the Swiss federal employment service's
// public job portal, run by SECO. The Swiss pivot's anchor source (docs/32).
//
// This is the endpoint the portal's own frontend uses: a keyless POST search
// with FULL-TEXT descriptions. Coverage is partly mandated by law: the
// Stellenmeldepflicht obliges employers to report vacancies in occupations with
// elevated unemployment to exactly this system, so the corpus is legally fed
// precisely where career-changers are wanted.
//
// THE 10,000-ROW WINDOW. The backend is Elasticsearch with the default
// max_result_window: page*size beyond 10,000 returns HTTP 412, which is why the
// first pull (2026-08-02) stopped at exactly 10,000 of 71,320 ads. The fix is
// to slice queries until every slice fits the window (probed 2026-08-03):
//   - cantonCodes filters and x-total-count reports each slice's size,
//   - permanent (true/false) and workloadPercentageMin/Max sub-slice big
//     cantons (ZH alone is ~17k),
//   - the sort param is honored (date_asc/date_desc), so a slice that still
//     exceeds the window gets a two-ended read covering up to 20k. Anything
//     beyond that is logged, never silently dropped.
//
// Nightly shape: pass 1 reads everything published countrywide in the last two
// days (onlineSince — also catches ads with no canton). Pass 2 sweeps cantons
// in a rotation keyed to the day number, spending the remaining page budget on
// refresh; the full country is touched every couple of nights. The first-seen
// ledger keeps ages honest across partial pulls.
//
// Three properties that make this source unusually good for us:
//   - descriptions are FULL TEXT (2k+ chars typical), so skill extraction works
//     — unlike Adzuna/Reed/Careerjet excerpts (docs/31's ceiling lesson).
//   - every ad carries an official AVAM occupation code. We store it verbatim:
//     one future avam->taxonomy crosswalk beats parsing German compounds title
//     by title, and the data to build that crosswalk accumulates nightly.
//   - jobDescriptions are language-tagged (de/fr/it/en), which hands the
//     multilingual miner its ground truth for free.
//
// Respectful use of a public endpoint: paged politely (minIntervalMs), capped
// per night, distinctive User-Agent with contact. SECO's formal API channel
// (api.job-room.ch, jobroom-api@seco.admin.ch) is auth-gated for B2B publishing;
// the partner is asking SECO for blessed read access in parallel — if they say
// stop, we stop. Until then this reads what every visitor's browser reads.
export const name = 'jobroom';

const ENDPOINT = 'https://www.job-room.ch/jobadservice/api/jobAdvertisements/_search';
const PAGE_SIZE = 100;
const WINDOW = 10000; // Elasticsearch max_result_window — HTTP 412 past it
// Page budget per night. 400 pages = up to 40k rows; with pass 1 taking the
// fresh ads first, the rotating sweep covers all ~71k ads across two nights
// while keeping the nightly's wall-clock bounded.
const MAX_PAGES = Number(process.env.JOBROOM_MAX_PAGES) || 400;

const CANTON = { AG: 'Aargau', AI: 'Appenzell Innerrhoden', AR: 'Appenzell Ausserrhoden', BE: 'Bern', BL: 'Basel-Landschaft', BS: 'Basel-Stadt', FR: 'Fribourg', GE: 'Geneva', GL: 'Glarus', GR: 'Graubünden', JU: 'Jura', LU: 'Luzern', NE: 'Neuchâtel', NW: 'Nidwalden', OW: 'Obwalden', SG: 'St. Gallen', SH: 'Schaffhausen', SO: 'Solothurn', SZ: 'Schwyz', TG: 'Thurgau', TI: 'Ticino', UR: 'Uri', VD: 'Vaud', VS: 'Valais', ZG: 'Zug', ZH: 'Zürich' };

const HEADERS = { 'content-type': 'application/json', 'user-agent': 'PivotHopScraper/0.1 (career adjacency; contact: hello@pivothop.com)' };

// Prefer the German description when one exists (largest market slice), else
// take the longest — the language tag rides along either way.
function pickDescription(list = []) {
  if (!list.length) return null;
  return list.find((d) => d.languageIsoCode === 'de') || [...list].sort((a, b) => (b.description || '').length - (a.description || '').length)[0];
}

function toRow(ad) {
  const jc = ad?.jobContent;
  const jd = pickDescription(jc?.jobDescriptions);
  if (!ad?.id || !jd?.title) return null;
  const loc = jc.location || {};
  const place = [loc.city, CANTON[loc.cantonCode] || loc.cantonCode, 'Switzerland'].filter(Boolean).join(', ');
  return {
    source: name,
    external_id: ad.id,
    title: jd.title,
    company: jc.company?.name || null,
    location: place || 'Switzerland',
    remote_flag: /home ?office|remote|télétravail/i.test(`${jd.title} ${jd.description || ''}`.slice(0, 3000)),
    salary_min: null, // Swiss ads do not post pay; Salarium covers CH salaries (docs/32)
    salary_max: null,
    currency: 'CHF',
    salary_period: null,
    description_text: stripHtml(jd.description || '').slice(0, 20000),
    posted_at: ad.publication?.startDate || String(ad.createdTime || '').slice(0, 10) || null,
    url: jc.externalUrl || `https://www.job-room.ch/job-search/${ad.id}`,
    // Swiss-specific extras, preserved verbatim for the CH build-out:
    lang: jd.languageIsoCode || null,                       // miner ground truth
    avam_code: jc.occupations?.[0]?.avamOccupationCode || null, // official occupation code -> future crosswalk
    canton: loc.cantonCode || null,
    workload: jc.employment?.workloadPercentageMax || null,
    reporting_obligation: !!ad.reportingObligation,          // Stellenmeldepflicht flag
  };
}

export async function fetchRaw({ log }) {
  const rows = [];
  const seen = new Set(); // in-run dedupe: passes and two-ended reads overlap by design
  let budget = MAX_PAGES;

  const post = (filter, page, size, sort) =>
    fetchJson(`${ENDPOINT}?page=${page}&size=${size}${sort ? `&sort=${sort}` : ''}`, {
      method: 'POST', headers: HEADERS, body: JSON.stringify(filter), minIntervalMs: 1300,
    }).catch(() => null);

  // Slice size via x-total-count on a 1-row probe. Probes are cheap and are not
  // charged against the page budget.
  const count = async (filter) => {
    const r = await fetchJson(`${ENDPOINT}?page=0&size=1`, {
      method: 'POST', headers: HEADERS, body: JSON.stringify(filter), minIntervalMs: 1300,
      captureHeaders: ['x-total-count'],
    }).catch(() => null);
    return r ? Number(r.headers['x-total-count']) || 0 : 0;
  };

  const harvest = async (filter, sort = null) => {
    for (let page = 0; budget > 0 && page * PAGE_SIZE < WINDOW; page++) {
      const body = await post(filter, page, PAGE_SIZE, sort);
      budget--;
      if (!Array.isArray(body) || body.length === 0) return;
      for (const wrap of body) {
        const row = toRow(wrap?.jobAdvertisement);
        if (row && !seen.has(row.external_id)) { seen.add(row.external_id); rows.push(row); }
      }
      if (body.length < PAGE_SIZE) return;
    }
  };

  // Pass 1 — every ad published countrywide in the last two days. Overlap with
  // yesterday is intentional (dedupe absorbs it); this also catches ads that
  // carry no canton and would slip through the canton sweep.
  await harvest({ onlineSince: 2 });
  const fresh = rows.length;

  // Pass 2 — rotating canton sweep with the remaining budget, sliced to fit
  // the window. Rotation start moves daily so partial nights still converge.
  const order = Object.keys(CANTON).sort();
  const shift = Math.floor(Date.now() / 86400e3) % order.length;
  const rotated = [...order.slice(shift), ...order.slice(0, shift)];
  for (const c of rotated) {
    if (budget <= 0) { log(`jobroom: page budget spent, sweep resumes near ${c} tomorrow`); break; }
    const base = { cantonCodes: [c] };
    const t = await count(base);
    if (t === 0) continue;
    if (t <= WINDOW) { await harvest(base); continue; }
    for (const permanent of [true, false]) {
      const f1 = { ...base, permanent };
      const t1 = await count(f1);
      if (t1 === 0) continue;
      if (t1 <= WINDOW) { await harvest(f1); continue; }
      for (const [lo, hi] of [[100, 100], [90, 99], [0, 89]]) {
        const f2 = { ...f1, workloadPercentageMin: lo, workloadPercentageMax: hi };
        const t2 = await count(f2);
        if (t2 === 0) continue;
        if (t2 <= WINDOW) { await harvest(f2); continue; }
        await harvest(f2, 'date_desc');
        await harvest(f2, 'date_asc');
        if (t2 > 2 * WINDOW) log(`jobroom: slice ${c}/perm=${permanent}/wl=${lo}-${hi} holds ${t2}, ${t2 - 2 * WINDOW} beyond the two-ended window this pass`);
      }
    }
  }

  const langs = rows.reduce((m, r) => ((m[r.lang || '?'] = (m[r.lang || '?'] || 0) + 1), m), {});
  log(`jobroom: ${rows.length} Swiss postings, ${fresh} fresh + ${rows.length - fresh} swept, ${MAX_PAGES - budget} pages (${Object.entries(langs).map(([k, v]) => `${k}:${v}`).join(' ')})`);
  return rows;
}
