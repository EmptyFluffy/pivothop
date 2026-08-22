import type { MetadataRoute } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { POSTS } from './blog/posts';
import { routableSlugs, routeOrigins } from './routes/routes-data';
import { coverableSlugs } from './salary/salary-data';
import { jobOccupations } from './jobs/jobs-data';
import { categorySlugs } from './jobs/categories-data';
import { compareSlugs } from './compare/compare-data';

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

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, ...mod('/'), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/support`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/employers`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/fairelephant`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    ...POSTS.map((p) => ({ url: `${BASE}/blog/${p.slug}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
    { url: `${BASE}/adjacency-index`, ...mod('/adjacency-index'), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/routes`, ...mod('/routes'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/glossary`, ...mod('/glossary'), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/licenses`, ...mod('/licenses'), changeFrequency: 'monthly', priority: 0.7 },
    ...routableSlugs().map((s) => ({ url: `${BASE}/routes/${s}`, ...mod(`/routes/${s}`), changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...routeOrigins().map((s) => ({ url: `${BASE}/routes/${s}`, ...mod(`/routes/${s}`), changeFrequency: 'weekly' as const, priority: 0.8 })),
    { url: `${BASE}/compare`, ...mod('/compare'), changeFrequency: 'weekly', priority: 0.7 },
    ...compareSlugs().map((s) => ({ url: `${BASE}/compare/${s}`, ...mod('/compare'), changeFrequency: 'weekly' as const, priority: 0.7 })),
    { url: `${BASE}/salary`, ...mod('/salary'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/salary/by-country`, ...mod('/salary'), changeFrequency: 'weekly', priority: 0.7 },
    ...coverableSlugs().map((s) => ({ url: `${BASE}/salary/${s}`, ...mod(`/salary/${s}`), changeFrequency: 'weekly' as const, priority: 0.8 })),
    { url: `${BASE}/jobs`, ...mod('/jobs'), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/jobs/browse`, ...mod('/jobs/browse'), changeFrequency: 'daily', priority: 0.7 },
    ...jobOccupations().map((s) => ({ url: `${BASE}/jobs/${s}`, ...mod(`/jobs/${s}`), changeFrequency: 'daily' as const, priority: 0.7 })),
    ...categorySlugs().map((s) => ({ url: `${BASE}/jobs/${s}`, ...mod(`/jobs/${s}`), changeFrequency: 'daily' as const, priority: 0.6 })),
  ];
}
