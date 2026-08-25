import fs from 'node:fs';
import path from 'node:path';
import type { Job } from '../../../jobs/JobCard';

let cache: Job[] | null = null;
function allJobs(): Job[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'all-jobs.json'), 'utf8')) as Job[];
  } catch {
    cache = [];
  }
  return cache;
}

function median(xs: number[]): number | null {
  const a = xs.filter((n) => Number.isFinite(n) && n > 0).sort((x, y) => x - y);
  if (!a.length) return null;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : Math.round((a[mid - 1] + a[mid]) / 2);
}

export type CrRoleLiveStats = {
  jobs: number;
  remote: number;
  withSalary: number;
  salaryMedian: number | null;
  companies: string[];
};

export function crMarketStats() {
  const jobs = allJobs().filter((j) => j.c === 'CR');
  return {
    total: jobs.length,
    remote: jobs.filter((j) => j.remote).length,
    withSalary: jobs.filter((j) => j.smin != null || j.smax != null).length,
    companies: new Set(jobs.map((j) => j.company).filter(Boolean)).size,
  };
}

export function crRoleStats(occ: string): CrRoleLiveStats {
  const jobs = allJobs().filter((j) => j.c === 'CR' && j.occ === occ);
  const salaries = jobs.map((j) => {
    if (j.smin && j.smax) return (j.smin + j.smax) / 2;
    return j.smin || j.smax || 0;
  }).filter((v) => v > 0);
  return {
    jobs: jobs.length,
    remote: jobs.filter((j) => j.remote).length,
    withSalary: salaries.length,
    salaryMedian: salaries.length >= 10 ? median(salaries) : null,
    companies: [...new Set(jobs.map((j) => j.company).filter(Boolean))].slice(0, 6),
  };
}
