import type { MetadataRoute } from 'next';
import { POSTS } from './blog/posts';

const BASE = 'https://pivothop.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/employers`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/fairelephant`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    ...POSTS.map((p) => ({ url: `${BASE}/blog/${p.slug}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
