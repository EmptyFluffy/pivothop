import fs from 'node:fs';
import path from 'node:path';
import type { Job } from '../../jobs/JobCard';

/* The employer funnel, Costa Rica (plan family 2, 2026-09-02). The SERP for
   "hire remote talent costa rica" is held by nearshore agencies whose salary
   tables are labeled "directional" and uncited, and by EOR guides competing on
   domain authority. Nobody ranking has posted-salary data. We do.

   THE LINE THIS FAMILY NEVER CROSSES (from the research's do-not-fake list):
   no employer-cost buildups, no tax brackets, no severance/notice matrices,
   no work-permit guidance, no hiring-speed or vetting claims, no EOR
   recommendations. Statutory context is CITED AND LINKED (MTSS, INEC), never
   restated as our own guidance — a wrong number in a compliance table is the
   dental-hygienist bug wearing employer clothes. */

const HIRE_FLOOR = 6; // same threshold the category pages use

let cache: Job[] | null = null;
function allJobs(): Job[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'all-jobs.json'), 'utf8')) as Job[];
  } catch { cache = []; }
  return cache;
}

export type HireOcc = {
  occ: string;
  n: number;
  remote: number;
  withSalary: number;
  band: { n: number; p25: number; p75: number } | null;
  companies: [string, number][];
  newest: string;
};

function band(jobs: Job[]): HireOcc['band'] {
  const mids = jobs
    .filter((j) => j.smin || j.smax)
    .map((j) => ((j.smin ?? j.smax ?? 0) + (j.smax ?? j.smin ?? 0)) / 2)
    .sort((a, b) => a - b);
  if (mids.length < 5) return null;
  const q = (p: number) => Math.round(mids[Math.floor((mids.length - 1) * p)] / 1000);
  return { n: mids.length, p25: q(0.25), p75: q(0.75) };
}

let _occs: Map<string, HireOcc> | null = null;
function build(): Map<string, HireOcc> {
  if (_occs) return _occs;
  const cr = allJobs().filter((j) => j.c === 'CR');
  const byOcc = new Map<string, Job[]>();
  for (const j of cr) {
    const arr = byOcc.get(j.occ) ?? [];
    arr.push(j);
    byOcc.set(j.occ, arr);
  }
  _occs = new Map();
  for (const [occ, js] of byOcc) {
    if (js.length < HIRE_FLOOR) continue;
    js.sort((a, b) => (b.posted || '').localeCompare(a.posted || ''));
    const cos = new Map<string, number>();
    for (const j of js) if (j.company) cos.set(j.company, (cos.get(j.company) ?? 0) + 1);
    _occs.set(occ, {
      occ,
      n: js.length,
      remote: js.filter((j) => j.remote).length,
      withSalary: js.filter((j) => j.smin || j.smax).length,
      band: band(js),
      companies: [...cos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
      newest: js[0]?.posted ?? '',
    });
  }
  return _occs;
}

export function hireOccSlugs(): string[] {
  return [...build().keys()].sort((a, b) => build().get(b)!.n - build().get(a)!.n);
}
export function getHireOcc(occ: string): HireOcc | null { return build().get(occ) ?? null; }
export function crJobsFor(occ: string): Job[] {
  return allJobs().filter((j) => j.c === 'CR' && j.occ === occ);
}

/** The companies with the most live Costa Rica postings on the board, for
    the hub's "who is already hiring here" list. */
export function crTopCompanies(limit = 12): [string, number][] {
  const m = new Map<string, number>();
  for (const j of allJobs()) if (j.c === 'CR' && j.company && j.company !== 'Name' && j.company !== 'Jobup') m.set(j.company, (m.get(j.company) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}
