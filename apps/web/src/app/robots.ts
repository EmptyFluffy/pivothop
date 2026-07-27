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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: '/admin' },
      ...AI_BOTS.map((ua) => ({ userAgent: ua, allow: '/', disallow: '/admin' })),
    ],
    sitemap: 'https://www.pivothop.com/sitemap.xml',
    host: 'https://www.pivothop.com',
  };
}
