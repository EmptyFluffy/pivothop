import type { MetadataRoute } from 'next';

/* CRAWL POLICY (rewritten 2026-09-11 after the public review of that date).
   Read with docs/35-crawl-index-policy.md; scripts/check-robots.mjs verifies
   the built robots.txt against the built sitemap on every CI run.

   What each surface wants:
   - Indexed surfaces (boards, categories, browse hubs, routes, compare,
     salary, companies, skills, guides, blog, /direct): crawlable by everyone.
   - Job detail pages /jobs/<occ>/<id>: NOINDEX by meta since 2026-07-23
     (f3ff061b8): the description is the source's words, so the board pages
     carry the site's content signal. Google must FETCH a page to read that
     noindex; a robots block hides it and leaves URL-only indexing possible.
     So the search engines whose index matters (Googlebot, Bingbot) may crawl
     them and read the noindex. The generic group keeps the 2026-08-04
     crawl-waste block (c4bb74858: 75% of edge requests were bots fetching
     noindexed pages), because SEO tools and minor crawlers earn nothing there.
   - /jobs/browse/<facet>: the 2026-08-04 pattern /jobs/* /* caught these seven
     indexed hubs by accident (they sit in the sitemap). Allow wins on the
     longer match, so they are crawlable again for every agent.
   - /j/<id>: branded social short links, a 307 to the detail page with
     X-Robots-Tag noindex. Nothing to crawl.
   - /admin: HTTP Basic Auth in proxy.ts, and noindex; disallowed for all.
   - /data/: raw JSON (all-jobs.json alone is 12MB). AI retrieval bots keep
     it, structured JSON is what a cited answer reads; nobody else needs it.
   - /dashboard, /signin, /auth/confirm, /design-lab: noindex by meta, left
     crawlable on purpose so the noindex is read. */

const AI_BOTS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'anthropic-ai',
  'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended',
  'CCBot', 'Amazonbot', 'cohere-ai', 'Meta-ExternalAgent',
];

// The search engines that build the index we care about: they read the
// noindex on detail pages themselves, so nothing is hidden from them.
const SEARCH_BOTS = ['Googlebot', 'Bingbot'];

const GENERIC_DISALLOW = ['/admin', '/jobs/*/*', '/data/', '/j/'];
const GENERIC_ALLOW = ['/', '/jobs/browse/'];
const SEARCH_DISALLOW = ['/admin', '/data/', '/j/'];
const AI_DISALLOW = ['/admin', '/j/'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: GENERIC_ALLOW, disallow: GENERIC_DISALLOW },
      ...SEARCH_BOTS.map((ua) => ({ userAgent: ua, allow: '/', disallow: SEARCH_DISALLOW })),
      ...AI_BOTS.map((ua) => ({ userAgent: ua, allow: '/', disallow: AI_DISALLOW })),
    ],
    sitemap: 'https://www.pivothop.com/sitemap.xml',
    host: 'https://www.pivothop.com',
  };
}
