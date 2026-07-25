import type { MetadataRoute } from 'next';
import { POSTS } from './blog/posts';
import { routableSlugs, routeOrigins } from './routes/routes-data';
import { coverableSlugs } from './salary/salary-data';
import { jobOccupations } from './jobs/jobs-data';
import { categorySlugs } from './jobs/categories-data';

const BASE = 'https://www.pivothop.com';

export default function sitemap(): MetadataRoute.Sitemap {
  // Data-driven pages genuinely change with the nightly scrape, so the build
  // date is an honest lastModified — a real crawl-prioritization signal, not
  // a freshness costume. Editorial pages carry no date rather than a fake one.
  const now = new Date();
  return [
    { url: BASE, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/employers`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/fairelephant`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    ...POSTS.map((p) => ({ url: `${BASE}/blog/${p.slug}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
    { url: `${BASE}/routes`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/glossary`, changeFrequency: 'monthly', priority: 0.6 },
    ...routableSlugs().map((s) => ({ url: `${BASE}/routes/${s}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...routeOrigins().map((s) => ({ url: `${BASE}/routes/${s}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 })),
    { url: `${BASE}/salary`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/salary/by-country`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    ...coverableSlugs().map((s) => ({ url: `${BASE}/salary/${s}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 })),
    { url: `${BASE}/jobs`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/jobs/browse`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    ...jobOccupations().map((s) => ({ url: `${BASE}/jobs/${s}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.7 })),
    ...categorySlugs().map((s) => ({ url: `${BASE}/jobs/${s}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.6 })),
  ];
}
