import fs from 'node:fs';
import path from 'node:path';
import type { Job } from './JobCard';
import { occField, occTitle, jobOccupations } from './jobs-data';
import { countryName } from './countries';

/* Programmatic category pages — the filter/tag axis of the board (the RemoteOK
   move: every tag, and every sensible tag pair, becomes a preloaded, indexed
   landing page). Each category is a filter over the full board with its own copy
   and a deep-link to the live board. Derived entirely from all-jobs.json at build
   time, so the set regenerates with the scrape — no separate generator.

   The discipline that keeps this out of thin-content territory: a page only
   exists if it clears THRESHOLD live jobs. Every dimension maps to an existing
   JobsBrowse URL param, so "See all" reproduces the filter on the live board.
   Phase 1 = single dimension; Phase 2 = the 2-dim combos (the long tail). */

const THRESHOLD = 6;    // a page must clear this many live jobs to be generated
const CATEGORY_MAX = 120; // SSR sample cap; the full set is one click away on /jobs

let _all: Job[] | null = null;
function allJobs(): Job[] {
  if (!_all) {
    try { _all = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'all-jobs.json'), 'utf8')) as Job[]; }
    catch { _all = []; }
  }
  return _all;
}

export type CategoryKind =
  | 'remote' | 'field' | 'country' | 'level' | 'flag' | 'pay'                    // single dimension
  | 'remote-field' | 'remote-occ' | 'level-occ' | 'level-field' | 'field-country'; // combos
export type Category = {
  slug: string;          // /jobs/<slug>
  kind: CategoryKind;
  title: string;         // meta + h1: "Remote jobs", "Senior UX Designer jobs"
  searchTitle: string;   // board placeholder noun: "remote", "senior ux designer"
  query: string;         // deep-link query string (applied to showAllBase)
  match: (j: Job) => boolean;
  count: number;         // live jobs matching, over the full board
  remoteN: number;       // of those, how many are remote (for the blurb)
  noun?: string;         // combos: natural phrase for the blurb ("fully-remote design roles")
  showAllBase?: string;  // combos on one occupation: "/jobs/<occ>" instead of "/jobs"
  destOcc?: string;      // occupation-scoped combos: the destination occupation slug
};

// NFKD + diacritic strip so "Türkiye" -> "turkiye", not "t-rkiye".
const slugify = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Candidate specs, before the threshold cut.
function candidates(): Omit<Category, 'count' | 'remoteN'>[] {
  const jobs = allJobs();
  const out: Omit<Category, 'count' | 'remoteN'>[] = [];
  const fields = [...new Set(jobs.map((j) => occField(j.occ)))].filter((f) => f && f !== 'Other').sort();
  const codes = ([...new Set(jobs.map((j) => j.c).filter(Boolean))] as string[]).filter((c) => countryName(c) !== c);
  const occs = [...new Set(jobs.map((j) => j.occ))];
  const levels = [{ code: 's', slug: 'senior', label: 'Senior' }, { code: 'e', slug: 'entry-level', label: 'Entry-level' }] as const;

  // ── single dimension ──
  out.push({ slug: 'remote', kind: 'remote', title: 'Remote jobs', searchTitle: 'remote', query: 'r=1', match: (j) => !!j.remote });
  for (const f of fields)
    out.push({ slug: slugify(f), kind: 'field', title: `${f} jobs`, searchTitle: f.toLowerCase(), query: `f=${encodeURIComponent(f)}`, match: (j) => occField(j.occ) === f });
  for (const c of codes) {
    const name = countryName(c);
    out.push({ slug: `in-${slugify(name)}`, kind: 'country', title: `Jobs in ${name}`, searchTitle: name, query: `c=${c}`, match: (j) => j.c === c });
  }
  out.push({ slug: 'senior', kind: 'level', title: 'Senior jobs', searchTitle: 'senior', query: 't=s', match: (j) => j.lv === 's' });
  out.push({ slug: 'entry-level', kind: 'level', title: 'Entry-level jobs', searchTitle: 'entry-level', query: 't=e', match: (j) => j.lv === 'e' });
  out.push({ slug: 'with-equity', kind: 'flag', title: 'Jobs with equity', searchTitle: 'equity', query: 't=eq', match: (j) => !!j.fl?.includes('eq') });
  out.push({ slug: 'visa-sponsorship', kind: 'flag', title: 'Visa sponsorship jobs', searchTitle: 'visa-sponsor', query: 't=vi', match: (j) => !!j.fl?.includes('vi') });
  out.push({ slug: 'four-day-week', kind: 'flag', title: 'Four-day week jobs', searchTitle: 'four-day-week', query: 't=4d', match: (j) => !!j.fl?.includes('4d') });
  for (const p of [50, 100, 150, 200])
    out.push({ slug: `over-${p}k`, kind: 'pay', title: `Jobs paying over $${p}k`, searchTitle: `$${p}k+`, query: `pay=${p}`, match: (j) => (j.smax ?? j.smin ?? 0) >= p * 1000 });

  // ── 2-dimension combos (the long tail) ──
  for (const f of fields)
    out.push({ slug: `remote-${slugify(f)}`, kind: 'remote-field', title: `Remote ${f} jobs`, searchTitle: `remote ${f.toLowerCase()}`, noun: `fully-remote ${f.toLowerCase()} roles`, query: `r=1&f=${encodeURIComponent(f)}`, match: (j) => !!j.remote && occField(j.occ) === f });
  for (const o of occs) {
    const t = occTitle(o);
    out.push({ slug: `remote-${o}`, kind: 'remote-occ', title: `Remote ${t} jobs`, searchTitle: `remote ${t.toLowerCase()}`, noun: `fully-remote ${t.toLowerCase()} roles`, query: 'r=1', showAllBase: `/jobs/${o}`, destOcc: o, match: (j) => !!j.remote && j.occ === o });
  }
  for (const lv of levels) for (const o of occs) {
    const t = occTitle(o);
    out.push({ slug: `${lv.slug}-${o}`, kind: 'level-occ', title: `${lv.label} ${t} jobs`, searchTitle: `${lv.label.toLowerCase()} ${t.toLowerCase()}`, noun: `${lv.label.toLowerCase()} ${t.toLowerCase()} roles`, query: `t=${lv.code}`, showAllBase: `/jobs/${o}`, destOcc: o, match: (j) => j.lv === lv.code && j.occ === o });
  }
  for (const lv of levels) for (const f of fields)
    out.push({ slug: `${lv.slug}-${slugify(f)}`, kind: 'level-field', title: `${lv.label} ${f} jobs`, searchTitle: `${lv.label.toLowerCase()} ${f.toLowerCase()}`, noun: `${lv.label.toLowerCase()} ${f.toLowerCase()} roles`, query: `f=${encodeURIComponent(f)}&t=${lv.code}`, match: (j) => j.lv === lv.code && occField(j.occ) === f });
  for (const f of fields) for (const c of codes) {
    const name = countryName(c);
    out.push({ slug: `${slugify(f)}-in-${slugify(name)}`, kind: 'field-country', title: `${f} jobs in ${name}`, searchTitle: `${f.toLowerCase()} in ${name}`, noun: `${f.toLowerCase()} roles in ${name}`, query: `f=${encodeURIComponent(f)}&c=${c}`, match: (j) => occField(j.occ) === f && j.c === c });
  }

  return out;
}

let _cats: Category[] | null = null;
export function allCategories(): Category[] {
  if (_cats) return _cats;
  const jobs = allJobs();
  const occSet = new Set(jobOccupations()); // never shadow a real occupation slug
  const seen = new Set<string>();
  const out: Category[] = [];
  for (const c of candidates()) {
    if (occSet.has(c.slug) || seen.has(c.slug)) continue;
    const matched = jobs.filter(c.match);
    if (matched.length < THRESHOLD) continue;
    seen.add(c.slug);
    out.push({ ...c, count: matched.length, remoteN: matched.filter((j) => j.remote).length });
  }
  out.sort((a, b) => b.count - a.count);
  _cats = out;
  return out;
}

export function categorySlugs(): string[] { return allCategories().map((c) => c.slug); }
export function getCategory(slug: string): Category | null { return allCategories().find((c) => c.slug === slug) ?? null; }

/** The SSR sample: newest first, capped. The full filtered set lives on the board. */
export function categoryJobs(c: Category): Job[] {
  return allJobs().filter(c.match).sort((a, b) => (b.posted || '').localeCompare(a.posted || '')).slice(0, CATEGORY_MAX);
}

/** The deep-link to the full filtered board for a category. */
export function categoryShowAll(c: Category): string { return `${c.showAllBase ?? '/jobs'}?${c.query}`; }

/** A distinct, count-bearing intro per category — never boilerplate. */
export function categoryBlurb(c: Category): string {
  const n = c.count.toLocaleString();
  const rem = c.remoteN > 0 && c.kind !== 'remote' ? `, ${c.remoteN.toLocaleString()} fully remote` : '';
  switch (c.kind) {
    case 'remote':
      return `${n} live fully-remote roles across every field, freshest first. Each is tagged to the skills that reach it and links out to apply at the source.`;
    case 'field':
      return `${n} live ${c.searchTitle} openings from company career pages and public boards, freshest first${rem}. The roles a ${c.searchTitle} background reaches — each links out to apply at the origin.`;
    case 'country':
      return `${n} live openings in ${c.searchTitle}, from company career pages and public-sector boards, freshest first${rem}. Apply at the original posting.`;
    case 'level':
      return c.slug === 'senior'
        ? `${n} live senior and lead roles, freshest first${rem}. Openings that ask for depth, each tagged to the skills that reach it.`
        : `${n} live entry-level and junior roles, freshest first${rem}. Openings that hire on potential over tenure — apply at the source.`;
    case 'flag':
      if (c.slug === 'with-equity') return `${n} live roles that include equity, freshest first${rem}. Ownership on top of salary, read straight from the posting.`;
      if (c.slug === 'visa-sponsorship') return `${n} live roles that state visa sponsorship, freshest first${rem}. Read from the posting text, not employer-flagged — verify at the source before you count on it.`;
      return `${n} live four-day-week roles, freshest first${rem}. A shorter week, stated in the posting — apply at the origin.`;
    case 'pay':
      return `${n} live roles posting pay of ${c.searchTitle.replace('+', ' or more')}, freshest first. Only postings that state a salary are counted here — apply at the source.`;
    default: { // the 2-dim combos
      const crem = c.remoteN > 0 && !/remote/.test(c.noun || '') ? `, ${c.remoteN.toLocaleString()} fully remote` : '';
      return `${n} live ${c.noun || `${c.searchTitle} roles`}, freshest first${crem}. Backfilled from company career pages and public boards, refreshed nightly — each links out to apply at the source.`;
    }
  }
}
