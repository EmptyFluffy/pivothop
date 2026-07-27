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
export function getJob(occ: string, id: string): Job | null {
  return getJobs(occ).find((j) => j.id === id) ?? null;
}
let _logoSet: Set<string> | null = null;
/** Locally-served company logo when we have one (public/data/logos/<slug>.png), else null. */
export function companyLogo(company: string): string | null {
  if (!_logoSet) {
    try { _logoSet = new Set(fs.readdirSync(path.join(process.cwd(), 'public', 'data', 'logos')).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4))); }
    catch { _logoSet = new Set(); }
  }
  const slug = company.toLowerCase().replace(/[^a-z0-9]/g, '');
  return slug && _logoSet.has(slug) ? `/data/logos/${slug}.png` : null;
}
export type JobSection = { h: string | null; t: string };
// Detail rows are {s: sections, k: skill ids}; the bare-array form is the
// pre-skills shape, still readable so a half-regenerated dataset never breaks.
type DetailRow = JobSection[] | { s: JobSection[]; k?: string[] };
export function getJobSections(occ: string, id: string): JobSection[] {
  const v = read<Record<string, DetailRow>>(`jobs-detail/${occ}.json`)?.[id];
  return Array.isArray(v) ? v : v?.s ?? [];
}
export function getJobSkills(occ: string, id: string): string[] {
  const v = read<Record<string, DetailRow>>(`jobs-detail/${occ}.json`)?.[id];
  return Array.isArray(v) ? [] : v?.k ?? [];
}
let _skillNames: Record<string, string> | null = null;
export function skillDisplayName(id: string): string {
  if (!_skillNames) _skillNames = read<{ names: Record<string, string> }>('skills-meta.json')?.names ?? {};
  return _skillNames![id] ?? id;
}
export function featuredJobs(): Job[] {
  return read<Job[]>('featured-jobs.json') ?? [];
}

let _meta: Record<string, { title?: string; field?: string }> | null = null;
function meta(occ: string) {
  if (!_meta) _meta = read<{ meta: Record<string, { title?: string; field?: string }> }>('occ-meta.json')?.meta ?? {};
  return _meta![occ] ?? {};
}
export function occTitle(occ: string): string {
  return meta(occ).title ?? occ.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
// origins.json carries a field + synonym list for every occupation (occ-meta covers only a subset).
type OriginRow = { slug: string; field?: string; syn?: string[] };
let _origins: OriginRow[] | null = null;
function origins(): OriginRow[] {
  if (!_origins) _origins = read<{ origins: OriginRow[] }>('origins.json')?.origins ?? [];
  return _origins;
}
let _fieldMap: Record<string, string> | null = null;
export function occField(occ: string): string {
  if (!_fieldMap) {
    _fieldMap = {};
    for (const r of origins()) if (r.field) _fieldMap[r.slug] = r.field;
  }
  return _fieldMap[occ] ?? meta(occ).field ?? 'Other';
}
/** Search-expansion text per occupation: title + field + taxonomy synonyms.
    Lets "architecture" find architect listings, "frontend" find front-end, etc. */
export function occSearchText(occ: string): string {
  const syn = origins().find((r) => r.slug === occ)?.syn ?? [];
  return [occTitle(occ), occField(occ), ...syn].join(' ').toLowerCase();
}
/** Every occupation with its synonyms, for role-to-occupation matching (employer wizard). */
export function occList(): { slug: string; title: string; syn: string[] }[] {
  return origins().map((r) => ({ slug: r.slug, title: occTitle(r.slug), syn: r.syn ?? [] }));
}

/** Full occ->field/title/search maps for JobsBrowse. Category pages span every
    occupation, so they need the complete maps (not a single occupation's). */
let _maps: { fields: Record<string, string>; titles: Record<string, string>; search: Record<string, string> } | null = null;
export function occMaps() {
  if (!_maps) {
    const fields: Record<string, string> = {}, titles: Record<string, string> = {}, search: Record<string, string> = {};
    for (const o of jobOccupations()) { fields[o] = occField(o); titles[o] = occTitle(o); search[o] = occSearchText(o); }
    _maps = { fields, titles, search };
  }
  return _maps;
}

