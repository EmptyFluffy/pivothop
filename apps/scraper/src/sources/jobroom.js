import { fetchJson } from '../lib/http.js';
import { stripHtml } from '../lib/text.js';

// Job-Room (job-room.ch / arbeit.swiss) — the Swiss federal employment service's
// public job portal, run by SECO. The Swiss pivot's anchor source (docs/32).
//
// This is the endpoint the portal's own frontend uses: a keyless POST search
// that returned 71,702 published advertisements with FULL-TEXT descriptions on
// first probe (2026-08-02). Coverage is partly mandated by law: the
// Stellenmeldepflicht obliges employers to report vacancies in occupations with
// elevated unemployment to exactly this system, so the corpus is legally fed
// precisely where career-changers are wanted.
//
// Three properties that make this source unusually good for us:
//   - descriptions are FULL TEXT (2k+ chars typical), so skill extraction works
//     — unlike Adzuna/Reed/Careerjet excerpts (docs/31's ceiling lesson).
//   - every ad carries an official AVAM occupation code. We store it verbatim:
//     one future avam->taxonomy crosswalk beats parsing German compounds title
//     by title, and the data to build that crosswalk accumulates from tonight.
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
// ~72k ads / 100 per page = ~720 pages. A full nightly pull at ~1.3s spacing is
// ~16 minutes, fine for a nightly — but capped anyway so a runaway pagination
// bug cannot hammer a government service. First-seen ledger makes ages honest
// across partial pulls.
const MAX_PAGES = Number(process.env.JOBROOM_MAX_PAGES) || 750;

const CANTON = { AG: 'Aargau', AI: 'Appenzell Innerrhoden', AR: 'Appenzell Ausserrhoden', BE: 'Bern', BL: 'Basel-Landschaft', BS: 'Basel-Stadt', FR: 'Fribourg', GE: 'Geneva', GL: 'Glarus', GR: 'Graubünden', JU: 'Jura', LU: 'Luzern', NE: 'Neuchâtel', NW: 'Nidwalden', OW: 'Obwalden', SG: 'St. Gallen', SH: 'Schaffhausen', SO: 'Solothurn', SZ: 'Schwyz', TG: 'Thurgau', TI: 'Ticino', UR: 'Uri', VD: 'Vaud', VS: 'Valais', ZG: 'Zug', ZH: 'Zürich' };

// Prefer the German description when one exists (largest market slice), else
// take the longest — the language tag rides along either way.
function pickDescription(list = []) {
  if (!list.length) return null;
  return list.find((d) => d.languageIsoCode === 'de') || [...list].sort((a, b) => (b.description || '').length - (a.description || '').length)[0];
}

export async function fetchRaw({ log }) {
  const rows = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const body = await fetchJson(`${ENDPOINT}?page=${page}&size=${PAGE_SIZE}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': 'PivotHopScraper/0.1 (career adjacency; contact: hello@pivothop.com)' },
      body: JSON.stringify({}),
      minIntervalMs: 1300,
    }).catch(() => null);
    if (!Array.isArray(body) || body.length === 0) break;

    for (const wrap of body) {
      const ad = wrap?.jobAdvertisement;
      const jc = ad?.jobContent;
      const jd = pickDescription(jc?.jobDescriptions);
      if (!ad?.id || !jd?.title) continue;
      const loc = jc.location || {};
      const place = [loc.city, CANTON[loc.cantonCode] || loc.cantonCode, 'Switzerland'].filter(Boolean).join(', ');
      rows.push({
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
      });
    }
    if (body.length < PAGE_SIZE) break;
  }
  const langs = rows.reduce((m, r) => ((m[r.lang || '?'] = (m[r.lang || '?'] || 0) + 1), m), {});
  log(`jobroom: ${rows.length} Swiss postings (${Object.entries(langs).map(([k, v]) => `${k}:${v}`).join(' ')})`);
  return rows;
}
