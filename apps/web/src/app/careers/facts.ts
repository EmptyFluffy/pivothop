import fs from 'node:fs';
import path from 'node:path';

// The numbers on a career guide are computed here, at render, from the same
// files the board reads. They are never taken from the generated guide file:
// prose is written once, figures re-derive with every nightly scrape, so a
// guide can never quote a salary or a count the board does not currently hold.
// This mirrors build-career-guides.mjs deliberately; if one changes, change both.

export type CareerFacts = {
  slug: string;
  title: string;
  field: string;
  liveOpenings: number;
  remoteSharePct: number;
  postingsRead: number | null;
  salary: { p25: number; p50: number; p75: number; n: number | null } | null;
  yearlySwitchPct: number | null;
  topSkills: { skill: string; sharePct: number }[];
  topBenefits: { benefit: string; sharePct: number }[];
  gates: {
    expMedianYears: number | null;
    expStatedPct: number;
    education: Record<string, number>;
    educationTotal: number;
    languages: { language: string; n: number }[];
  };
  countries: { country: string; n: number }[];
  routesOut: { id: string; to: string; matchPct: number; salary: string | null; time: string | null; licensed: boolean }[];
  routesIn: { from: string; fromTitle: string; matchPct: number }[];
  licence: Licence | null;
  guide: { title: string; generated: string; prose: Prose } | null;
};

export type Prose = {
  summary: string;
  day_to_day: string;
  work_environment: string;
  getting_in: string;
  ladder: string;
  suits: string;
  misconceptions: string;
  tools: string;
  who_qualifies: string;
  what_the_numbers_miss: string;
  industries: { name: string; note: string }[];
  specializations: { name: string; why: string }[];
  pros: string[];
  cons: string[];
  faq: { q: string; a: string }[];
};

/** The credential gate, where one exists: the real path and how long it takes. */
export type Licence = {
  gate: string; path: string; time: string; note?: string;
  body?: { name: string; url: string }; anchor?: string; req?: string;
};

const REPO = path.join(process.cwd(), '..', '..');
const WEB = path.join(process.cwd(), 'public', 'data');
const GEN = path.join(REPO, 'packages', 'data', 'generated');
const GUIDES = path.join(REPO, 'packages', 'data', 'career-guides');

function read<T>(p: string, fb: T): T {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) as T; } catch { return fb; }
}
const share = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

let _into: Map<string, { from: string; fromTitle: string; matchPct: number }[]> | null = null;
/** Who reaches an occupation. Built once per process across every origin file. */
function routesInto(): Map<string, { from: string; fromTitle: string; matchPct: number }[]> {
  if (_into) return _into;
  const m = new Map<string, { from: string; fromTitle: string; matchPct: number }[]>();
  let files: string[] = [];
  try { files = fs.readdirSync(GEN).filter((f) => f.endsWith('.json')); } catch { /* none */ }
  for (const f of files) {
    const g = read<{ origin?: { slug?: string; title?: string }; roles?: { id: string; match?: number }[] }>(path.join(GEN, f), {});
    const from = g.origin?.slug ?? f.replace('.json', '');
    for (const r of g.roles ?? []) {
      if (r.match == null) continue;
      if (!m.has(r.id)) m.set(r.id, []);
      m.get(r.id)!.push({ from, fromTitle: g.origin?.title ?? from, matchPct: r.match });
    }
  }
  for (const [, list] of m) list.sort((a, b) => b.matchPct - a.matchPct);
  _into = m;
  return m;
}

/** Every occupation that has both route data and a written guide. */
export function guidedSlugs(): string[] {
  try {
    return fs.readdirSync(GUIDES).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')).sort();
  } catch { return []; }
}

export function careerFacts(occ: string): CareerFacts | null {
  type Gen = {
    origin?: { title?: string; field?: string; postings?: number; separations?: { transfer?: number } };
    roles?: { id: string; title: string; match?: number; salary?: string; time?: string; license?: { req?: string } }[];
  };
  const gen = read<Gen>(path.join(GEN, `${occ}.json`), {});
  if (!gen.origin) return null;

  type Job = { remote?: boolean; c?: string };
  type Detail = { k?: string[]; b?: string[]; r?: { exp?: number; edu?: { state: string }; lang?: string[] } };
  const jobs = read<Job[]>(path.join(WEB, 'jobs', `${occ}.json`), []);
  const detail = read<Record<string, Detail>>(path.join(WEB, 'jobs-detail', `${occ}.json`), {});
  const rows = Object.values(detail);

  const tally = (get: (d: Detail) => string[] | undefined) => {
    const m = new Map<string, number>();
    for (const d of rows) for (const v of get(d) ?? []) m.set(v, (m.get(v) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };

  const gates = rows.map((d) => d.r).filter(Boolean) as NonNullable<Detail['r']>[];
  const exps = gates.map((g) => g.exp).filter((n): n is number => n != null).sort((a, b) => a - b);
  const education: Record<string, number> = {};
  for (const g of gates) if (g.edu) education[g.edu.state] = (education[g.edu.state] ?? 0) + 1;
  const langs: Record<string, number> = {};
  for (const g of gates) for (const l of g.lang ?? []) langs[l] = (langs[l] ?? 0) + 1;
  const countries: Record<string, number> = {};
  for (const j of jobs) if (j.c) countries[j.c] = (countries[j.c] ?? 0) + 1;

  type Sal = { by_country?: Record<string, { blended?: Band; posted?: Band }>; global?: Band };
  type Band = { p25: number; p50: number; p75: number; n?: number };
  const sal = read<Sal>(path.join(WEB, 'salaries', `${occ}.json`), {});
  const band = sal.by_country?.US?.blended || sal.by_country?.US?.posted || sal.global || null;

  const guide = read<{ title: string; generated: string; prose: Prose } | null>(path.join(GUIDES, `${occ}.json`), null);
  const licence = read<Record<string, Licence>>(path.join(WEB, 'license-sheet.json'), {})[occ] ?? null;

  return {
    slug: occ,
    title: gen.origin.title ?? occ,
    field: gen.origin.field ?? 'Other',
    liveOpenings: jobs.length,
    remoteSharePct: share(jobs.filter((j) => j.remote).length, jobs.length),
    postingsRead: gen.origin.postings ?? null,
    salary: band ? { p25: band.p25, p50: band.p50, p75: band.p75, n: band.n ?? null } : null,
    yearlySwitchPct: gen.origin.separations?.transfer ?? null,
    topSkills: tally((d) => d.k).slice(0, 10).map(([skill, n]) => ({ skill, sharePct: share(n, rows.length) })),
    topBenefits: tally((d) => d.b).slice(0, 6).map(([benefit, n]) => ({ benefit, sharePct: share(n, rows.length) })),
    gates: {
      expMedianYears: exps.length ? exps[Math.floor(exps.length / 2)] : null,
      expStatedPct: share(exps.length, rows.length),
      education,
      educationTotal: Object.values(education).reduce((a, b) => a + b, 0),
      languages: Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([language, n]) => ({ language, n })),
    },
    countries: Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([country, n]) => ({ country, n })),
    routesOut: (gen.roles ?? []).filter((r) => r.match != null).slice(0, 6).map((r) => ({
      id: r.id, to: r.title, matchPct: r.match!, salary: r.salary ?? null, time: r.time ?? null,
      licensed: r.license?.req === 'required',
    })),
    routesIn: (routesInto().get(occ) ?? []).slice(0, 6),
    licence,
    guide,
  };
}
