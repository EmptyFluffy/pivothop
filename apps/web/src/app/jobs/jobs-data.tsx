import fs from 'node:fs';
import path from 'node:path';

/* The job board: backfilled from the scrape (build-jobs.py), one JSON per
   occupation under public/data/jobs/. Re-displayable sources only, each listing
   links out to apply at the source. Server-only (fs). */

import type { Job } from './JobCard';
export type { Job };

function read<T>(rel: string): T | null {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', rel), 'utf8')); }
  catch { return null; }
}

let _idx: Record<string, number> | null = null;
export function jobsIndex(): Record<string, number> {
  if (!_idx) _idx = read<Record<string, number>>('jobs-index.json') ?? {};
  return _idx;
}
export function jobOccupations(): string[] { return Object.keys(jobsIndex()); }
export function jobCount(occ: string): number { return jobsIndex()[occ] ?? 0; }
export function getJobs(occ: string): Job[] { return read<Job[]>(`jobs/${occ}.json`) ?? []; }

let _meta: Record<string, { title?: string; field?: string }> | null = null;
function meta(occ: string) {
  if (!_meta) _meta = read<{ meta: Record<string, { title?: string; field?: string }> }>('occ-meta.json')?.meta ?? {};
  return _meta![occ] ?? {};
}
export function occTitle(occ: string): string {
  return meta(occ).title ?? occ.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
// origins.json carries a field for every occupation (occ-meta covers only a subset).
let _fieldMap: Record<string, string> | null = null;
export function occField(occ: string): string {
  if (!_fieldMap) {
    _fieldMap = {};
    const o = read<{ origins: { slug: string; field?: string }[] }>('origins.json');
    for (const r of o?.origins ?? []) if (r.field) _fieldMap[r.slug] = r.field;
  }
  return _fieldMap[occ] ?? meta(occ).field ?? 'Other';
}

