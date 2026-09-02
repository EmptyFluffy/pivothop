import fs from 'node:fs';
import path from 'node:path';
import type { Job } from './JobCard';
import { occField, occTitle, jobOccupations } from './jobs-data';
import { countryName } from './countries';
import { regionOf, regionInName, regionName, regionSlug, type RegionKey } from './regions';
import { article } from '../../lib/site';

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

/* GRACE WINDOW (2026-09-02). A filter that holds 6 roles today and 5 tomorrow
   used to delete its page overnight, and the page came back the day after —
   churn that shows up in Search Console as 404s (100 of them on 2026-08-27)
   and teaches Google the URL is unreliable. Measured 26 Aug -> 1 Sep: 4 pages
   vanished on the stable axes alone; the small multi-axis cells churn harder.

   So a page that has cleared the bar keeps its URL for GRACE_DAYS after it
   drops below, as long as it still has at least one live role — an empty page
   is genuinely thin and still goes. Retirement becomes a slow, deliberate
   decision instead of a nightly flap, and a graced page says so in its own
   copy rather than repeating the "always clears the bar" line, which would be
   false on exactly those pages.

   The ledger records, per slug, the last date it cleared THRESHOLD on merit.
   It is written during the CI build (PAGE_GRACE_WRITE=1) and committed with
   the nightly data, so it persists across builds. Content is a pure function
   of all-jobs.json, so the parallel build workers all write identical bytes;
   the write is atomic (tmp + rename) and therefore race-safe. */
const GRACE_DAYS = 30;
const GRACE_FILE = 'page-grace.json';

let _grace: Record<string, string> | null = null;
function graceLedger(): Record<string, string> {
  if (!_grace) {
    try {
      _grace = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', GRACE_FILE), 'utf8'));
    } catch { _grace = {}; }
  }
  return _grace!;
}
const daysSince = (iso: string) => {
  const t = Date.parse(`${iso}T12:00:00Z`);
  return Number.isFinite(t) ? Math.floor((Date.now() - t) / 864e5) : Infinity;
};

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
  | 'remote-field' | 'remote-occ' | 'level-occ' | 'level-field' | 'field-country' // 2-dim combos
  | 'remote-country' | 'remote-field-country' | 'level-field-country' | 'pay-field' // 3-dim long tail
  | 'occ-country' | 'pay-occ' | 'remote-occ-country' | 'level-occ-country'       // occupation-level long tail
  | 'flag-field' | 'flag-country' | 'pay-country'                                // benefits/pay long tail
  | 'region' | 'field-region' | 'remote-region' | 'occ-region';                  // macro-region axis (LATAM, Europe…)
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
  graced?: boolean;      // below THRESHOLD today, kept alive by the grace window
};

// NFKD + diacritic strip so "Türkiye" -> "turkiye", not "t-rkiye".
const slugify = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// "Jobs in the United States", not "Jobs in United States" — display name takes
// a definite article for the countries English gives one; slugs stay bare.
const THE = new Set(['US', 'GB', 'NL', 'AE', 'PH']);
const inName = (c: string) => (THE.has(c) ? `the ${countryName(c)}` : countryName(c));


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
    const name = countryName(c); const disp = inName(c);
    out.push({ slug: `in-${slugify(name)}`, kind: 'country', title: `Jobs in ${disp}`, searchTitle: name, query: `c=${c}`, match: (j) => j.c === c });
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
    const name = countryName(c); const disp = inName(c);
    out.push({ slug: `${slugify(f)}-in-${slugify(name)}`, kind: 'field-country', title: `${f} jobs in ${disp}`, searchTitle: `${f.toLowerCase()} in ${disp}`, noun: `${f.toLowerCase()} roles in ${disp}`, query: `f=${encodeURIComponent(f)}&c=${c}`, match: (j) => occField(j.occ) === f && j.c === c });
  }

  // ── 3-dimension long tail ("remote business jobs in the united states") ──
  for (const c of codes) {
    const name = countryName(c); const disp = inName(c);
    out.push({ slug: `remote-in-${slugify(name)}`, kind: 'remote-country', title: `Remote jobs in ${disp}`, searchTitle: `remote in ${disp}`, noun: `fully-remote roles hiring in ${disp}`, query: `r=1&c=${c}`, match: (j) => !!j.remote && j.c === c });
  }
  for (const f of fields) for (const c of codes) {
    const name = countryName(c); const disp = inName(c);
    out.push({ slug: `remote-${slugify(f)}-in-${slugify(name)}`, kind: 'remote-field-country', title: `Remote ${f} jobs in ${disp}`, searchTitle: `remote ${f.toLowerCase()} in ${disp}`, noun: `fully-remote ${f.toLowerCase()} roles hiring in ${disp}`, query: `r=1&f=${encodeURIComponent(f)}&c=${c}`, match: (j) => !!j.remote && occField(j.occ) === f && j.c === c });
  }
  for (const lv of levels) for (const f of fields) for (const c of codes) {
    const name = countryName(c); const disp = inName(c);
    out.push({ slug: `${lv.slug}-${slugify(f)}-in-${slugify(name)}`, kind: 'level-field-country', title: `${lv.label} ${f} jobs in ${disp}`, searchTitle: `${lv.label.toLowerCase()} ${f.toLowerCase()} in ${disp}`, noun: `${lv.label.toLowerCase()} ${f.toLowerCase()} roles in ${disp}`, query: `f=${encodeURIComponent(f)}&t=${lv.code}&c=${c}`, match: (j) => j.lv === lv.code && occField(j.occ) === f && j.c === c });
  }
  for (const p of [100, 150]) for (const f of fields)
    out.push({ slug: `${slugify(f)}-over-${p}k`, kind: 'pay-field', title: `${f} jobs paying over $${p}k`, searchTitle: `${f.toLowerCase()} $${p}k+`, noun: `${f.toLowerCase()} roles posting $${p}k or more`, query: `f=${encodeURIComponent(f)}&pay=${p}`, match: (j) => occField(j.occ) === f && (j.smax ?? j.smin ?? 0) >= p * 1000 });

  // ── occupation-level long tail — the highest-intent searches of all ──
  // "software engineer jobs in germany", "data analyst jobs over $100k",
  // "remote software engineer jobs in the united states". Occupation-scoped, so
  // each page carries the Routes-into adjacency block and a /jobs/<occ> deep-link.
  for (const o of occs) {
    const t = occTitle(o);
    for (const c of codes) {
      const name = countryName(c); const disp = inName(c);
      out.push({ slug: `${o}-in-${slugify(name)}`, kind: 'occ-country', title: `${t} jobs in ${disp}`, searchTitle: `${t.toLowerCase()} in ${disp}`, noun: `${t.toLowerCase()} roles in ${disp}`, query: `c=${c}`, showAllBase: `/jobs/${o}`, destOcc: o, match: (j) => j.occ === o && j.c === c });
      out.push({ slug: `remote-${o}-in-${slugify(name)}`, kind: 'remote-occ-country', title: `Remote ${t} jobs in ${disp}`, searchTitle: `remote ${t.toLowerCase()} in ${disp}`, noun: `fully-remote ${t.toLowerCase()} roles hiring in ${disp}`, query: `r=1&c=${c}`, showAllBase: `/jobs/${o}`, destOcc: o, match: (j) => !!j.remote && j.occ === o && j.c === c });
      for (const lv of levels)
        out.push({ slug: `${lv.slug}-${o}-in-${slugify(name)}`, kind: 'level-occ-country', title: `${lv.label} ${t} jobs in ${disp}`, searchTitle: `${lv.label.toLowerCase()} ${t.toLowerCase()} in ${disp}`, noun: `${lv.label.toLowerCase()} ${t.toLowerCase()} roles in ${disp}`, query: `t=${lv.code}&c=${c}`, showAllBase: `/jobs/${o}`, destOcc: o, match: (j) => j.lv === lv.code && j.occ === o && j.c === c });
    }
    for (const p of [100, 150])
      out.push({ slug: `${o}-over-${p}k`, kind: 'pay-occ', title: `${t} jobs paying over $${p}k`, searchTitle: `${t.toLowerCase()} $${p}k+`, noun: `${t.toLowerCase()} roles posting $${p}k or more`, query: `pay=${p}`, showAllBase: `/jobs/${o}`, destOcc: o, match: (j) => j.occ === o && (j.smax ?? j.smin ?? 0) >= p * 1000 });
  }

  // ── macro-region axis (LATAM, Europe, Asia…) — "design jobs in Latin America" ──
  // The searched cut between a single country and "remote" / global. Region
  // slugs ("latin-america") never collide with country slugs.
  const regionKeys = [...new Set(jobs.map((j) => regionOf(j.c)).filter(Boolean))] as RegionKey[];
  for (const rk of regionKeys) {
    const disp = regionInName(rk);
    out.push({ slug: `in-${regionSlug(rk)}`, kind: 'region', title: `Jobs in ${disp}`, searchTitle: regionName(rk), query: `region=${rk}`, match: (j) => regionOf(j.c) === rk });
  }
  for (const f of fields) for (const rk of regionKeys) {
    const disp = regionInName(rk);
    out.push({ slug: `${slugify(f)}-in-${regionSlug(rk)}`, kind: 'field-region', title: `${f} jobs in ${disp}`, searchTitle: `${f.toLowerCase()} in ${disp}`, noun: `${f.toLowerCase()} roles in ${disp}`, query: `f=${encodeURIComponent(f)}&region=${rk}`, match: (j) => occField(j.occ) === f && regionOf(j.c) === rk });
  }
  for (const rk of regionKeys) {
    const disp = regionInName(rk);
    out.push({ slug: `remote-in-${regionSlug(rk)}`, kind: 'remote-region', title: `Remote jobs in ${disp}`, searchTitle: `remote in ${disp}`, noun: `fully-remote roles hiring in ${disp}`, query: `r=1&region=${rk}`, match: (j) => !!j.remote && regionOf(j.c) === rk });
  }
  for (const o of occs) for (const rk of regionKeys) {
    const t = occTitle(o); const disp = regionInName(rk);
    out.push({ slug: `${o}-in-${regionSlug(rk)}`, kind: 'occ-region', title: `${t} jobs in ${disp}`, searchTitle: `${t.toLowerCase()} in ${disp}`, noun: `${t.toLowerCase()} roles in ${disp}`, query: `region=${rk}`, showAllBase: `/jobs/${o}`, destOcc: o, match: (j) => j.occ === o && regionOf(j.c) === rk });
  }

  // ── benefits and pay long tail ──
  for (const f of fields) {
    out.push({ slug: `${slugify(f)}-with-equity`, kind: 'flag-field', title: `${f} jobs with equity`, searchTitle: `${f.toLowerCase()} with equity`, noun: `${f.toLowerCase()} roles that include equity`, query: `f=${encodeURIComponent(f)}&t=eq`, match: (j) => occField(j.occ) === f && !!j.fl?.includes('eq') });
    out.push({ slug: `${slugify(f)}-visa-sponsorship`, kind: 'flag-field', title: `${f} jobs with visa sponsorship`, searchTitle: `${f.toLowerCase()} visa-sponsor`, noun: `${f.toLowerCase()} roles that state visa sponsorship`, query: `f=${encodeURIComponent(f)}&t=vi`, match: (j) => occField(j.occ) === f && !!j.fl?.includes('vi') });
  }
  for (const c of codes) {
    const name = countryName(c); const disp = inName(c);
    out.push({ slug: `visa-sponsorship-in-${slugify(name)}`, kind: 'flag-country', title: `Visa sponsorship jobs in ${disp}`, searchTitle: `visa-sponsor in ${disp}`, noun: `roles in ${disp} that state visa sponsorship`, query: `c=${c}&t=vi`, match: (j) => j.c === c && !!j.fl?.includes('vi') });
    out.push({ slug: `over-100k-in-${slugify(name)}`, kind: 'pay-country', title: `Jobs paying over $100k in ${disp}`, searchTitle: `$100k+ in ${disp}`, noun: `roles in ${disp} posting $100k or more`, query: `c=${c}&pay=100`, match: (j) => j.c === c && (j.smax ?? j.smin ?? 0) >= 100000 });
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
  const ledger = graceLedger();
  const today = new Date().toISOString().slice(0, 10);
  const merit: Record<string, string> = {};
  for (const c of candidates()) {
    if (occSet.has(c.slug) || seen.has(c.slug)) continue;
    const matched = jobs.filter(c.match);
    const clears = matched.length >= THRESHOLD;
    if (clears) merit[c.slug] = today;
    // grace: below the bar but recently above it, and not empty
    const graced = !clears && matched.length > 0
      && !!ledger[c.slug] && daysSince(ledger[c.slug]) <= GRACE_DAYS;
    if (!clears && !graced) continue;
    seen.add(c.slug);
    out.push({ ...c, count: matched.length, remoteN: matched.filter((j) => j.remote).length, graced });
  }
  out.sort((a, b) => b.count - a.count);
  _cats = out;
  writeGrace(ledger, merit);
  return out;
}

/* Merge today's merit dates into the ledger and persist. Only the CI build
   writes (PAGE_GRACE_WRITE=1) — that build's output is what gets committed;
   Vercel and local dev read the committed file and never advance it. Slugs
   that fall out of the ledger's window are dropped so the file cannot grow
   without bound. */
function writeGrace(ledger: Record<string, string>, merit: Record<string, string>): void {
  if (process.env.PAGE_GRACE_WRITE !== '1') return;
  const next: Record<string, string> = {};
  for (const [slug, date] of Object.entries({ ...ledger, ...merit })) {
    if (daysSince(date) <= GRACE_DAYS) next[slug] = date;
  }
  const sorted = Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)));
  const dir = path.join(process.cwd(), 'public', 'data');
  const tmp = path.join(dir, `${GRACE_FILE}.tmp-${process.pid}`);
  try {
    fs.writeFileSync(tmp, `${JSON.stringify(sorted, null, 0)}\n`);
    fs.renameSync(tmp, path.join(dir, GRACE_FILE));
  } catch { try { fs.unlinkSync(tmp); } catch { /* nothing to clean */ } }
}

export function categorySlugs(): string[] { return allCategories().map((c) => c.slug); }
export function getCategory(slug: string): Category | null { return allCategories().find((c) => c.slug === slug) ?? null; }

/** The SSR sample: newest first, capped. The full filtered set lives on the board. */
export function categoryJobs(c: Category): Job[] {
  return allJobs().filter(c.match).sort((a, b) => (b.posted || '').localeCompare(a.posted || '')).slice(0, CATEGORY_MAX);
}

/** The deep-link to the full filtered board for a category. */
export function categoryShowAll(c: Category): string { return `${c.showAllBase ?? '/jobs'}?${c.query}`; }

/** Slugify a display name the same way category slugs were minted (NFKD, bare). */
export const slugifyName = slugify;

export type CategoryStats = {
  salaried: number;                 // matched jobs stating a salary
  p25: number | null; p75: number | null; // posted mid-band quartiles, $k
  topCountries: [string, number][];
  topFields: [string, number][];
  topOccs: [string, number][];
  newest: string;                   // most recent posted date in the set
};
/** Computed per-category facts for the FAQ block — every number is this filter's own. */
export function categoryStats(c: Category): CategoryStats {
  const m = allJobs().filter(c.match);
  const mids = m.filter((j) => j.smin || j.smax)
    .map((j) => ((j.smin ?? j.smax ?? 0) + (j.smax ?? j.smin ?? 0)) / 2)
    .sort((a, b) => a - b);
  const q = (p: number) => (mids.length >= 5 ? Math.round(mids[Math.floor((mids.length - 1) * p)] / 1000) : null);
  const top = (key: (j: Job) => string | undefined) => {
    const t = new Map<string, number>();
    for (const j of m) { const k = key(j); if (k) t.set(k, (t.get(k) ?? 0) + 1); }
    return [...t.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3) as [string, number][];
  };
  return {
    salaried: mids.length,
    p25: q(0.25), p75: q(0.75),
    topCountries: top((j) => j.c),
    topFields: top((j) => { const f = occField(j.occ); return f === 'Other' ? undefined : f; }),
    topOccs: top((j) => j.occ),
    newest: m.reduce((s, j) => (j.posted > s ? j.posted : s), ''),
  };
}

/** A distinct, count-bearing intro per category — never boilerplate. */
export function categoryBlurb(c: Category): string {
  const n = c.count.toLocaleString();
  const rem = c.remoteN > 0 && c.kind !== 'remote' ? `, ${c.remoteN.toLocaleString()} fully remote` : '';
  switch (c.kind) {
    case 'remote':
      return `${n} live fully-remote roles across every field, freshest first. Each is tagged to the skills that reach it and links out to apply at the source.`;
    case 'field':
      return `${n} live ${c.searchTitle} openings from company career pages and public boards, freshest first${rem}. The roles ${article(c.searchTitle)} ${c.searchTitle} background reaches — each links out to apply at the origin.`;
    case 'country':
      return `${n} live openings in ${c.searchTitle}, from company career pages and public-sector boards, freshest first${rem}. Apply at the original posting.`;
    case 'region':
      return `${n} live openings across ${c.searchTitle}, aggregated from company career pages, remote-first boards and public-sector feeds, freshest first${rem}. One region, every country we track in it — apply at the source.`;
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
