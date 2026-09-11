import type { MetadataRoute } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { POSTS } from './blog/posts';
import { routableSlugs, routeOrigins } from './routes/routes-data';
import { coverableSlugs } from './salary/salary-data';
import { CR_BENCHMARKS } from './salary/by-country/costa-rica/benchmarks';
import { guidedSlugs } from './career-guides/facts';
import { jobOccupations } from './jobs/jobs-data';
import { allCategories } from './jobs/categories-data';
import { compareSlugs } from './compare/compare-data';
import { skillPageSlugs } from './skills/skills-data';
import { companySitemapSlugs, getCompany, countryCompanySlugs, getCountryCompanies } from './companies/companies-data';
import { getSkillPage } from './skills/skills-data';
import { crJobsFor } from './hire/costa-rica/hire-data';
import { careerFacts } from './career-guides/facts';
import { createHash } from 'node:crypto';
import { hireOccSlugs } from './hire/costa-rica/hire-data';

const BASE = 'https://www.pivothop.com';

// Per-page change dates from scripts/build-lastmod.py, which advances a date
// only when the data behind that page actually changed. Stamping every URL with
// the build time — which this file used to do — makes every page claim to change
// nightly, and Google discounts lastmod it cannot trust. A page that has not
// moved keeps its old date so "changed today" carries information.
// Missing entry means we cannot date it honestly, so we send no date at all.
let LASTMOD: Record<string, string> = {};
try {
  LASTMOD = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'lastmod.json'), 'utf8')
  );
} catch {
  LASTMOD = {};
}
const mod = (p: string) => (LASTMOD[p] ? { lastModified: new Date(`${LASTMOD[p]}T00:00:00Z`) } : {});

/* THE PAGE LEDGER (2026-09-09). build-lastmod.py dates the boards, routes and
   salary pages by hashing their data files; the families whose membership is a
   predicate in this codebase (categories, companies, skills, hire, guides) had
   no date at all, 80% of the sitemap, and exactly the pages that change every
   night. Same principle, in TypeScript: each page has a content signature
   (the job ids behind it); the ledger keeps {signature, date} per path, and a
   date moves only when the signature moves. Written by the CI build
   (PAGE_GRACE_WRITE=1, like the grace ledger) and committed with the nightly
   data; Vercel and dev read it and never advance it. A first appearance is
   dated today, which is true: the page is new. */
const LEDGER_FILE = 'lastmod-pages.json';
type Ledger = Record<string, { h: string; d: string }>;
let LEDGER: Ledger = {};
try {
  LEDGER = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', LEDGER_FILE), 'utf8'));
} catch { LEDGER = {}; }
const TODAY = new Date().toISOString().slice(0, 10);
const NEXT: Ledger = {};
const dated = (p: string, sig: string) => {
  const prev = LEDGER[p];
  const d = prev && prev.h === sig ? prev.d : TODAY;
  NEXT[p] = { h: sig, d };
  return { lastModified: new Date(`${d}T00:00:00Z`) };
};
const sigOf = (parts: (string | number | null | undefined)[]) => createHash('sha1').update(parts.map(String).join('\n')).digest('hex').slice(0, 12);
function writeLedger() {
  if (process.env.PAGE_GRACE_WRITE !== '1') return;
  const dir = path.join(process.cwd(), 'public', 'data');
  const tmp = path.join(dir, `${LEDGER_FILE}.tmp-${process.pid}`);
  const sorted = Object.fromEntries(Object.entries(NEXT).sort(([a], [b]) => a.localeCompare(b)));
  try {
    fs.writeFileSync(tmp, `${JSON.stringify(sorted)}\n`);
    fs.renameSync(tmp, path.join(dir, LEDGER_FILE));
  } catch { try { fs.unlinkSync(tmp); } catch { /* nothing to clean */ } }
}
// hand-maintained pages: the date each one last changed in git
const STATIC: Record<string, string> = {
  '/about': '2026-09-02', '/employers': '2026-09-02', '/support': '2026-09-02', '/privacy': '2026-09-02', '/terms': '2026-09-02',
  '/licenses': '2026-08-22', '/instrument': '2026-09-02', '/hire/costa-rica': '2026-09-02', '/companies': '2026-09-02', '/career-guides': '2026-09-08',
};
const fixed = (p: string) => (STATIC[p] ? { lastModified: new Date(`${STATIC[p]}T00:00:00Z`) } : {});
// blog posts carry a month ("August 2026"); date them to the first of that month, honestly coarse
const MONTHS: Record<string, string> = { january: '01', february: '02', march: '03', april: '04', may: '05', june: '06', july: '07', august: '08', september: '09', october: '10', november: '11', december: '12' };
const postDate = (d: string) => { const m = d.match(/^([A-Za-z]+)\s+(\d{4})$/); const mm = m && MONTHS[m[1].toLowerCase()]; return mm ? { lastModified: new Date(`${m![2]}-${mm}-01T00:00:00Z`) } : {}; };

export default function sitemap(): MetadataRoute.Sitemap {
  const urls: MetadataRoute.Sitemap = [
    { url: BASE, ...mod('/'), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/about`, ...fixed('/about'), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/support`, ...fixed('/support'), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/privacy`, ...fixed('/privacy'), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/terms`, ...fixed('/terms'), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/employers`, ...fixed('/employers'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/salary/calculator`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    ...POSTS.map((p) => ({ url: `${BASE}/blog/${p.slug}`, ...postDate(p.date), changeFrequency: 'monthly' as const, priority: 0.7 })),
    { url: `${BASE}/adjacency-index`, ...mod('/adjacency-index'), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/routes`, ...mod('/routes'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/glossary`, ...mod('/glossary'), changeFrequency: 'monthly', priority: 0.6 },
    ...skillPageSlugs().map((s) => { const sp = getSkillPage(s); return { url: `${BASE}/skills/${s}`, ...dated(`/skills/${s}`, sigOf(sp ? sp.unlocks.map((u) => `${u.slug}:${u.count}`) : [])), changeFrequency: 'weekly' as const, priority: 0.7 }; }),
    { url: `${BASE}/hire/costa-rica`, ...fixed('/hire/costa-rica'), changeFrequency: 'daily', priority: 0.8 },
    ...hireOccSlugs().map((s) => ({ url: `${BASE}/hire/costa-rica/${s}`, ...dated(`/hire/costa-rica/${s}`, sigOf(crJobsFor(s).map((j) => `${j.occ}/${j.id}`).sort())), changeFrequency: 'daily' as const, priority: 0.7 })),
    { url: `${BASE}/companies`, ...fixed('/companies'), changeFrequency: 'daily', priority: 0.7 },
    ...companySitemapSlugs().map((s) => ({ url: `${BASE}/companies/${s}`, ...dated(`/companies/${s}`, getCompany(s)?.sig ?? ''), changeFrequency: 'daily' as const, priority: 0.7 })),
    ...countryCompanySlugs().map((s) => ({ url: `${BASE}/companies/${s}`, ...dated(`/companies/${s}`, getCountryCompanies(s)?.sig ?? ''), changeFrequency: 'daily' as const, priority: 0.7 })),
    { url: `${BASE}/licenses`, ...mod('/licenses'), changeFrequency: 'monthly', priority: 0.7 },
    ...routableSlugs().map((s) => ({ url: `${BASE}/routes/${s}`, ...mod(`/routes/${s}`), changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...routeOrigins().map((s) => ({ url: `${BASE}/routes/${s}`, ...mod(`/routes/${s}`), changeFrequency: 'weekly' as const, priority: 0.8 })),
    { url: `${BASE}/compare`, ...mod('/compare'), changeFrequency: 'weekly', priority: 0.7 },
    ...compareSlugs().map((s) => ({ url: `${BASE}/compare/${s}`, ...mod('/compare'), changeFrequency: 'weekly' as const, priority: 0.7 })),
    { url: `${BASE}/salary`, ...mod('/salary'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/salary/by-country`, ...mod('/salary'), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/salary/by-country/costa-rica`, changeFrequency: 'weekly', priority: 0.8 },
    ...CR_BENCHMARKS.map((r) => ({ url: `${BASE}/salary/by-country/costa-rica/${r.slug}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...coverableSlugs().map((s) => ({ url: `${BASE}/salary/${s}`, ...mod(`/salary/${s}`), changeFrequency: 'weekly' as const, priority: 0.8 })),
    { url: `${BASE}/career-guides`, ...mod('/career-guides'), changeFrequency: 'weekly', priority: 0.7 },
    // a guide changes when its board's data changes (every figure re-derives from it) or when its prose was rewritten
    ...guidedSlugs().map((s) => { const g = careerFacts(s)?.guide as { generated?: string; rewritten?: string } | null | undefined; return { url: `${BASE}/career-guides/${s}`, ...dated(`/career-guides/${s}`, sigOf([LASTMOD[`/jobs/${s}`], g?.generated, g?.rewritten])), changeFrequency: 'weekly' as const, priority: 0.8 }; }),
    { url: `${BASE}/jobs`, ...mod('/jobs'), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/instrument`, ...fixed('/instrument'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/jobs/browse`, ...mod('/jobs/browse'), changeFrequency: 'daily', priority: 0.7 },
    // the five facet sub-hubs (tier 2 of the browse spine) rank on their own
    ...['remote', 'fields', 'countries', 'seniority', 'pay'].map((f) => (
      { url: `${BASE}/jobs/browse/${f}`, ...mod(`/jobs/browse/${f}`), changeFrequency: 'daily' as const, priority: 0.65 }
    )),
    ...jobOccupations().map((s) => ({ url: `${BASE}/jobs/${s}`, ...mod(`/jobs/${s}`), changeFrequency: 'daily' as const, priority: 0.7 })),
    ...allCategories().filter((c) => c.indexable).map((c) => ({ url: `${BASE}/jobs/${c.slug}`, ...dated(`/jobs/${c.slug}`, c.sig), changeFrequency: 'daily' as const, priority: c.kind === 'city' || c.kind === 'occ-city' ? 0.65 : 0.6 })),
  ];
  writeLedger();
  return urls;
}