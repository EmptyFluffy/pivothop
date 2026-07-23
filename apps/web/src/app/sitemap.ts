import type { MetadataRoute } from 'next';
import { POSTS } from './blog/posts';
import { ROUTE_SLUGS } from './routes/routes-data';
import { SALARY_SLUGS } from './salary/salary-data';

const BASE = 'https://pivothop.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/employers`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/fairelephant`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    ...POSTS.map((p) => ({ url: `${BASE}/blog/${p.slug}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
    { url: `${BASE}/routes`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/glossary`, changeFrequency: 'monthly', priority: 0.6 },
    ...ROUTE_SLUGS.map((s) => ({ url: `${BASE}/routes/${s}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
    { url: `${BASE}/salary`, changeFrequency: 'weekly', priority: 0.8 },
    ...SALARY_SLUGS.map((s) => ({ url: `${BASE}/salary/${s}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
  ];
}
