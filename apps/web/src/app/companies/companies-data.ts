import fs from 'node:fs';
import path from 'node:path';
import type { Job } from '../jobs/JobCard';
import { occField } from '../jobs/jobs-data';

/* The company-pages family (/companies/<slug>), plan family 3, first tranche
   2026-09-02. One company record feeds the profile page, its computed FAQ,
   and the hub — the Himalayas hub-asset pattern, built from postings alone:
   nothing here is self-reported.

   TWO GATES, ON PURPOSE (2026-09-02, profile expansion). PAGE_FLOOR=3 mints
   a page — the same floor an occupation needs for a board, and enough rows
   to say something true. SITEMAP_FLOOR=20 decides which pages we push at
   Google; the rest exist, interlink and are discoverable, but do not join
   the sitemap — the Himalayas pattern (their 41k editorial pages live
   outside their sitemaps) and the answer to the discovered-not-crawled
   queue. Thin pages degrade section by section and carry the claim CTA:
   these are the seed of claimed employer profiles.

   EXCLUSIONS, measured 2026-09-02 and each a documented data artifact, not
   an editorial call: 'Name' (167 rows, a parser bug upstream — the company
   field literally says "Name") and 'Jobup' (730 rows; it is a Swiss job
   PLATFORM appearing as publisher on Job-Room rows, so a "Jobs at Jobup"
   page would attribute other employers' openings to it). Staffing agencies
   stay: they are the real hiring contact for their listings. Both artifacts
   belong on the scraper QA backlog; fixing them upstream retires this list. */

const PAGE_FLOOR = 3;
const SITEMAP_FLOOR = 20;
const EXCLUDE = new Set(['Name', 'Jobup']);

export type CompanyPage = {
  slug: string;
  name: string;
  count: number;
  remoteN: number;
  logo: string | null;
  /* How the company describes itself, mined from its own postings: the
     140-700-char paragraph repeated across 2+ of its live postings that names
     the company with a descriptor verb (or sits under an About heading).
     Task lists, EEO text, interview/benefit boilerplate are vetoed — a wrong
     "what they do" quote is worse than none, so misses omit the section. */
  blurb: { text: string; n: number } | null;
  fields: [string, number][];         // dominant hiring fields, jobs each
  countries: [string, number][];      // ISO code, jobs
  occs: [string, number][];           // occ slug, jobs
  benefits: [string, number][];       // taxonomy term, postings declaring it
  band: { n: number; p25: number; p75: number } | null;
  jobs: Job[];                        // freshest first
  newest: string;                     // ISO date of freshest posting
};

function slugify(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

let _all: Job[] | null = null;
function allJobs(): Job[] {
  if (!_all) {
    try {
      _all = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'all-jobs.json'), 'utf8')) as Job[];
    } catch { _all = []; }
  }
  return _all;
}

let _benTerms: Map<number, string> | null = null;
function benefitTerm(i: number): string | null {
  if (!_benTerms) {
    _benTerms = new Map();
    try {
      const g = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'benefits-glossary.json'), 'utf8')) as { i: number; term: string }[];
      for (const b of g) if (typeof b.i === 'number') _benTerms.set(b.i, b.term);
    } catch { /* no glossary: pages simply omit the benefits block */ }
  }
  return _benTerms.get(i) ?? null;
}

function band(jobs: Job[]): CompanyPage['band'] {
  const mids = jobs
    .filter((j) => j.smin || j.smax)
    .map((j) => ((j.smin ?? j.smax ?? 0) + (j.smax ?? j.smin ?? 0)) / 2)
    .sort((a, b) => a - b);
  if (mids.length < 5) return null;
  const q = (p: number) => Math.round(mids[Math.floor((mids.length - 1) * p)] / 1000);
  return { n: mids.length, p25: q(0.25), p75: q(0.75) };
}

/* ── the blurb miner ─────────────────────────────────────────────────────────
   Detail files are loaded ONE OCCUPATION AT A TIME and released — the store
   is 124MB and parsing it whole would balloon the build. Precision over
   recall, measured 2026-09-02 on the top-20 tranche companies: every emitted
   blurb was a genuine self-description; roughly half the companies (Swiss
   staffing agencies especially) carry none and get no section. */
const ABOUT_RE = /\babout\b|who we are|company overview|acerca de|über uns|wer wir sind|qui sommes/i;
const VETO_RE = /equal opportunit|discriminat|interview|onboarding|work.?life balance|hiring process|what we offer|benefits|apply now|privacy/i;
const BULLET_RE = /(^|\n)\s*[+*•-]\s|###/;
// Recruiting hype reads wrong on a deadpan page even as a quotation: emoji,
// shouted words, stacked exclamation points all disqualify (Accenture's
// "🚀 DARE TO BE A PART OF THE CHALLENGE!" was rank 1 without this).
const HYPE_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const shouty = (t: string) => (t.match(/!/g) ?? []).length >= 2 || (t.match(/\b[A-Z]{3,}\b/g) ?? []).length >= 4;
const normPara = (t: string) => t.replace(/\s+/g, ' ').trim().toLowerCase();

function mineBlurbs(tranche: Map<string, Job[]>): Map<string, { text: string; n: number }> {
  // group tranche jobs by occupation so each detail file is read once
  const byOcc = new Map<string, { co: string; id: string }[]>();
  for (const [co, js] of tranche) {
    for (const j of js.slice(0, 40)) {
      const arr = byOcc.get(j.occ) ?? [];
      arr.push({ co, id: j.id });
      byOcc.set(j.occ, arr);
    }
  }
  type Cand = { ids: Set<string>; text: string; head: string };
  const cands = new Map<string, Map<string, Cand>>(); // company -> norm -> cand
  for (const [occ, refs] of byOcc) {
    let detail: Record<string, { s?: { h?: string | null; t?: string }[] }>;
    try {
      detail = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'jobs-detail', `${occ}.json`), 'utf8'));
    } catch { continue; }
    for (const { co, id } of refs) {
      const secs = detail[id]?.s ?? [];
      for (const sec of secs) {
        const t = (sec.t ?? '').trim();
        if (t.length < 140 || t.length > 700) continue;
        const n = normPara(t);
        const m = cands.get(co) ?? new Map<string, Cand>();
        const c = m.get(n) ?? { ids: new Set<string>(), text: t, head: sec.h ?? '' };
        c.ids.add(id);
        m.set(n, c); cands.set(co, m);
      }
    }
  }
  const out = new Map<string, { text: string; n: number }>();
  for (const [co, m] of cands) {
    const name0 = co.split(/\s+/)[0].toLowerCase().replace(/[.,]$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const desc = new RegExp(`${name0}[’'a-z]*\\s+(is|are|ist|es|builds|provides|operates|helps|makes|develops|delivers|exists|was founded|creates|offers)\\b`);
    const missionDesc = new RegExp(`${name0}[^.]{0,40}\\bmission is\\b`);
    let best: { text: string; n: number } | null = null; let score = -1;
    for (const [n, c] of m) {
      if (c.ids.size < 2 || VETO_RE.test(n) || BULLET_RE.test(c.text)) continue;
      if (HYPE_RE.test(c.text) || shouty(c.text)) continue;
      const hasName = n.includes(name0.replace(/\\/g, ''));
      const hasDesc = desc.test(n) || missionDesc.test(n);
      const aboutH = ABOUT_RE.test(c.head) || ABOUT_RE.test(c.text.slice(0, 40));
      if (!(hasDesc || (aboutH && hasName))) continue;
      const sc = c.ids.size * 4 + (hasDesc ? 40 : 0) + (aboutH ? 25 : 0);
      if (sc > score) { score = sc; best = { text: c.text.replace(/\s+/g, ' ').trim(), n: c.ids.size }; }
    }
    if (best) out.set(co, best);
  }
  return out;
}

let _pages: Map<string, CompanyPage> | null = null;
function build(): Map<string, CompanyPage> {
  if (_pages) return _pages;
  const byCo = new Map<string, Job[]>();
  for (const j of allJobs()) {
    if (!j.company || EXCLUDE.has(j.company)) continue;
    const arr = byCo.get(j.company) ?? [];
    arr.push(j);
    byCo.set(j.company, arr);
  }
  _pages = new Map();
  const taken = new Set<string>();
  const entries = [...byCo.entries()].filter(([, js]) => js.length >= PAGE_FLOOR)
    .sort((a, b) => b[1].length - a[1].length);
  const blurbs = mineBlurbs(new Map(entries));
  for (const [name, js] of entries) {
    let slug = slugify(name);
    if (!slug) continue;
    while (taken.has(slug)) slug = `${slug}-co`;
    taken.add(slug);
    js.sort((a, b) => (b.posted || '').localeCompare(a.posted || ''));
    const top = (key: (j: Job) => string | undefined) => {
      const m = new Map<string, number>();
      for (const j of js) { const k = key(j); if (k) m.set(k, (m.get(k) ?? 0) + 1); }
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };
    const ben = new Map<string, number>();
    for (const j of js) for (const i of j.b ?? []) {
      const t = benefitTerm(i);
      if (t) ben.set(t, (ben.get(t) ?? 0) + 1);
    }
    _pages.set(slug, {
      slug, name,
      count: js.length,
      remoteN: js.filter((j) => j.remote).length,
      logo: js.find((j) => j.logo)?.logo ?? null,
      countries: top((j) => j.c).slice(0, 5),
      occs: top((j) => j.occ).slice(0, 8),
      benefits: [...ben.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
      blurb: blurbs.get(name) ?? null,
      fields: top((j) => { const f = occField(j.occ); return f === 'Other' ? undefined : f; }).slice(0, 2) as [string, number][],
      band: band(js),
      jobs: js,
      newest: js[0]?.posted ?? '',
    });
  }
  return _pages;
}

export function companySlugs(): string[] { return [...build().keys()]; }
/** Only the strong pages join the sitemap; the rest are link-discovered. */
export function companySitemapSlugs(): string[] {
  return [...build().values()].filter((c) => c.count >= SITEMAP_FLOOR).map((c) => c.slug);
}
export function getCompany(slug: string): CompanyPage | null { return build().get(slug) ?? null; }
export function companiesRanked(): CompanyPage[] {
  return [...build().values()].sort((a, b) => b.count - a.count);
}
