import type { MetadataRoute } from 'next';

// AI answer engines are explicitly welcomed: the retrieval bots that power live
// citations (OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot) and the
// training/indexing crawlers (GPTBot, Google-Extended, Applebot-Extended, CCBot).
// Being cited is the goal; unique computed data is what gets cited. /admin only
// is disallowed. Naming them is a clean signal and future-proofs against a
// default block.
const AI_BOTS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'anthropic-ai',
  'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended',
  'CCBot', 'Amazonbot', 'cohere-ai', 'Meta-ExternalAgent',
];

// Crawl-waste control (2026-08-05: the 75%-of-edge-requests email). Two URL
// classes cost requests while earning nothing:
//   /jobs/<occ>/<id> — 14.5k job-detail pages, ALL noindexed by meta; bots must
//     fetch a page to see its noindex, so allowing the crawl paid full price
//     for zero index value. Disallow lets them skip the fetch entirely.
//   /data/ — raw JSON payloads (all-jobs.json alone is 4MB). No SEO value.
// AI retrieval bots keep /data access: structured JSON is exactly what a cited
// answer wants to read. Board pages, category pages, routes, salaries — every
// indexed surface — remain fully crawlable.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/jobs/*/*', '/data/'] },
      ...AI_BOTS.map((ua) => ({ userAgent: ua, allow: '/', disallow: '/admin' })),
    ],
    sitemap: 'https://www.pivothop.com/sitemap.xml',
    host: 'https://www.pivothop.com',
  };
}
