#!/usr/bin/env node
/* check-robots: the crawl/index gate (2026-09-11).
 *
 * Runs on the BUILT output, not the source: Next prerenders /robots.txt and
 * /sitemap.xml into .next/server/app/{robots.txt,sitemap.xml}.body. For every
 * agent group in robots.txt it applies the robots matching rule (longest
 * matching path wins, Allow beats Disallow on a tie) to every sitemap URL, and
 * fails when a URL the sitemap asks Google to index is one robots forbids it
 * to fetch. That is exactly the contradiction the 2026-08-04 rule created for
 * /jobs/browse/<facet>, found by the 2026-09-11 public review.
 *
 * Also fails when the sitemap carries a URL that must never be indexed (job
 * detail pages, admin, dashboard, sign-in), a query string, or a non-canonical
 * host. Usage: npm run check:robots (after next build). */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const appDir = path.join(root, '.next', 'server', 'app');
const read = (f) => {
  const p = path.join(appDir, f);
  if (!fs.existsSync(p)) { console.error(`check-robots: missing ${p}; run next build first`); process.exit(2); }
  return fs.readFileSync(p, 'utf8');
};

/* robots.txt -> { agent: { allow: [], disallow: [] } } */
function parseRobots(txt) {
  const groups = {};
  let current = [];
  for (const raw of txt.split('\n')) {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) continue;
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const field = m[1].toLowerCase(), value = m[2].trim();
    if (field === 'user-agent') {
      const ua = value.toLowerCase();
      groups[ua] ??= { allow: [], disallow: [] };
      // consecutive user-agent lines share the rules that follow
      if (current.length && current.some((g) => groups[g].allow.length || groups[g].disallow.length)) current = [];
      current.push(ua);
    } else if ((field === 'allow' || field === 'disallow') && current.length) {
      for (const g of current) groups[g][field].push(value);
    }
  }
  return groups;
}

/* Google's matching: patterns support * and $; the longest matching pattern
   wins; on equal length Allow wins. An empty Disallow matches nothing. */
function toRegex(pattern) {
  const esc = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp('^' + (esc.endsWith('\\$') ? esc.slice(0, -2) + '$' : esc));
}
function allowed(group, pathname) {
  let best = { len: -1, allow: true };
  for (const [kind, list] of [['allow', group.allow], ['disallow', group.disallow]]) {
    for (const p of list) {
      if (!p) continue;
      if (toRegex(p).test(pathname)) {
        const len = p.length;
        if (len > best.len || (len === best.len && kind === 'allow')) best = { len, allow: kind === 'allow' };
      }
    }
  }
  return best.allow;
}

const robots = parseRobots(read('robots.txt.body'));
const sitemapXml = read('sitemap.xml.body');
const urls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urls.length < 1000) { console.error(`check-robots: sitemap has only ${urls.length} URLs, expected thousands`); process.exit(1); }

const problems = [];
const agents = ['*', 'googlebot', 'bingbot'];
for (const ua of agents) {
  const g = robots[ua];
  if (!g) { problems.push(`robots.txt has no group for ${ua}`); continue; }
  for (const u of urls) {
    const pathname = new URL(u).pathname;
    if (!allowed(g, pathname)) problems.push(`${ua} may not fetch a sitemap URL: ${pathname}`);
  }
}

// never in the sitemap: noindexed or private surfaces, query strings, wrong host
const NEVER = [/^\/jobs\/[^/]+\/[0-9a-f]{10}$/, /^\/admin(\/|$)/, /^\/dashboard(\/|$)/, /^\/signin(\/|$)/, /^\/auth\//, /^\/design-lab(\/|$)/, /^\/j\//, /^\/api\//];
for (const u of urls) {
  const url = new URL(u);
  if (url.host !== 'www.pivothop.com') problems.push(`non-canonical host in sitemap: ${u}`);
  if (url.search) problems.push(`query string in sitemap: ${u}`);
  if (NEVER.some((re) => re.test(url.pathname))) problems.push(`noindex/private URL in sitemap: ${url.pathname}`);
}

// the detail-page pattern must stay blocked for the generic group and open for the search engines
const sampleDetail = '/jobs/software-engineer/0123456789';
if (allowed(robots['*'], sampleDetail)) problems.push(`generic group should not crawl job detail pages (${sampleDetail})`);
for (const ua of ['googlebot', 'bingbot']) if (robots[ua] && !allowed(robots[ua], sampleDetail)) problems.push(`${ua} must be able to read the noindex on ${sampleDetail}`);
for (const ua of agents) {
  if (robots[ua] && allowed(robots[ua], '/admin/outreach')) problems.push(`${ua} may crawl /admin`);
  if (robots[ua] && allowed(robots[ua], '/j/abc123')) problems.push(`${ua} may crawl /j/ short links`);
}

const uniq = [...new Set(problems)];
if (uniq.length) {
  console.error(`check-robots: ${uniq.length} problem(s)`);
  for (const p of uniq.slice(0, 30)) console.error('  ✗ ' + p);
  process.exit(1);
}
console.log(`check-robots: ${urls.length} sitemap URLs fetchable by *, Googlebot and Bingbot; no noindex, private, parameterised or off-host URLs in the sitemap`);
