import fs from 'node:fs';
import path from 'node:path';
import type { Job } from '../jobs/JobCard';

/* The company-pages family (/companies/<slug>), plan family 3, first tranche
   2026-09-02. One company record feeds the profile page, its computed FAQ,
   and the hub — the Himalayas hub-asset pattern, built from postings alone:
   nothing here is self-reported.

   TRANCHE GATE: 20+ live roles admits ~200 companies. Same reasoning as the
   skills tranche — the discovered-not-crawled queue punishes bulk drops.

   EXCLUSIONS, measured 2026-09-02 and each a documented data artifact, not
   an editorial call: 'Name' (167 rows, a parser bug upstream — the company
   field literally says "Name") and 'Jobup' (730 rows; it is a Swiss job
   PLATFORM appearing as publisher on Job-Room rows, so a "Jobs at Jobup"
   page would attribute other employers' openings to it). Staffing agencies
   stay: they are the real hiring contact for their listings. Both artifacts
   belong on the scraper QA backlog; fixing them upstream retires this list. */

const COMPANY_FLOOR = 20;
const EXCLUDE = new Set(['Name', 'Jobup']);

export type CompanyPage = {
  slug: string;
  name: string;
  count: number;
  remoteN: number;
  logo: string | null;
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
  const entries = [...byCo.entries()].filter(([, js]) => js.length >= COMPANY_FLOOR)
    .sort((a, b) => b[1].length - a[1].length);
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
      band: band(js),
      jobs: js,
      newest: js[0]?.posted ?? '',
    });
  }
  return _pages;
}

export function companySlugs(): string[] { return [...build().keys()]; }
export function getCompany(slug: string): CompanyPage | null { return build().get(slug) ?? null; }
export function companiesRanked(): CompanyPage[] {
  return [...build().values()].sort((a, b) => b.count - a.count);
}
