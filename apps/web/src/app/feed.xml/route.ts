import { POSTS } from '../blog/posts';

// RSS for the blog: feed readers, aggregators, and the crawlers behind AI
// search all use it as a discovery signal. Static per build.
export const dynamic = 'force-static';

const BASE = 'https://www.pivothop.com';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function GET() {
  const items = POSTS.map((p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${BASE}/blog/${p.slug}</link>
      <guid isPermaLink="true">${BASE}/blog/${p.slug}</guid>
      <description>${esc(p.dek)}</description>
    </item>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PivotHop — the blog</title>
    <link>${BASE}/blog</link>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Career moves, measured. Findings and method from the PivotHop posting corpus: career adjacency, salaries, ghost jobs, and the honest odds of switching fields.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
}
