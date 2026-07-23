# 19 · SEO site architecture and canonical host

*How the site is structured so a crawler can understand it, and why every absolute URL now says `www`. Findings from research plus what we changed, so the next person does not undo it by accident.*

---

## The two questions this answers

1. "For Google the site needs to be understandable so it can rank it." What does that actually mean, and did we do it.
2. "On the sitemap we should have www." Why, and what it commits us to.

Both are now applied in code. One piece cannot be done in code and is flagged at the end: the redirect. Read that part before launch.

---

## Part one · "Understandable" is a shape, not a keyword

The phrase people repeat is vague, but what a crawler rewards is concrete and measurable. Three things.

### 1. A pyramid, and nothing more than three clicks deep

The site should read top-down: one home, a few hubs, then the leaves.

```
Home (the instrument)
├── /routes            hub   → /routes/architect-to-ux-designer      leaf
├── /salary            hub   → /salary/ux-designer                    leaf
├── /blog              hub   → /blog/the-adjacency-premium            leaf
└── /glossary          reference, linked from every post
```

Every leaf is reachable from the home page in two clicks: home to hub, hub to leaf. That matters because crawl effort falls off a cliff with depth. Pages four or more clicks from home get crawled far less often, on the order of a large reduction in crawl frequency, because the crawler spends its budget near the root. Our deepest page is two clicks. Nothing to fix here; this was already true because the hubs list their own leaves.

### 2. Internal links carry the meaning

A crawler infers what a page is about partly from the words other pages use to link to it. Two rules follow.

- Descriptive anchor text, not "click here." Our route pages now link to salary pages with the anchor "Full UX designer pay data: median, seniority curve, by country and US state", not a bare URL. The anchor is the label the crawler reads.
- No orphans, and links that go both ways. Salary pages already linked out to the routes that move into or out of that job. Routes did not link back to salary. They do now: any route whose destination has a salary page carries a contextual link to it. The cluster is bidirectional, which is what tells a crawler these pages are one topic, not scattered pages that happen to share words.

The density guidance in the research is a few contextual links per thousand words. We are inside that on every content page. The blog posts also open doors to `/salary` and `/fairelephant` where the sentence earns it, which knits the three hubs together rather than leaving them as islands.

### 3. Semantic HTML and breadcrumb markup

Two mechanical things a crawler uses to build the outline of a page:

- Heading order. A page should go `h1` then `h2` then `h3`, no skips. A jump from `h1` straight to `h3` reads as a missing level and muddies the outline. Our section headings on salary, route, and blog pages were `h3` sitting directly under the page `h1`. They are now `h2`. The CSS was renamed at the same time so nothing looks different; only the tag changed. A UX designer salary page now renders eight `h2` sections and zero stray `h3`.
- `BreadcrumbList` structured data. This is the machine-readable version of "you are here: Home / Salaries / UX designer." Google uses it to draw the breadcrumb line in the search result and to place the page in the site hierarchy. Route pages already had it. Salary pages and blog posts now have it too, so all three leaf types carry it.

We already had the rest of the structured-data surface: `Occupation` and `MonetaryAmountDistribution` on salary pages for the salary rich result, `Article` on posts and routes, `FAQPage` where there are FAQs, `DefinedTermSet` on the glossary. Breadcrumbs were the gap.

---

## Part two · www versus the bare domain

### The finding, stated plainly

There is no ranking difference between `www.pivothop.com` and `pivothop.com`. Google treats them as two different sites that happen to serve the same pages, and it will pick one as canonical whether or not you tell it which. The cost of not choosing is split signals: links, crawl budget, and any ranking history get divided across two addresses instead of pooling on one. So the rule is not "pick the winning one." There is no winning one. The rule is pick one and be consistent everywhere.

We picked `www`. Two reasons, both technical, neither about ranking:

- DNS flexibility. A bare domain (the apex, `pivothop.com`) can only carry `A` records pointing at fixed IP addresses. A `www` subdomain can be a `CNAME`, which points at a hostname instead. That lets the host or CDN move the underlying IPs without us touching DNS, and it is how most managed hosts and CDNs want to be wired. The apex cannot do this cleanly.
- Cookie and CDN hygiene. Cookies set on the bare apex domain are sent to every subdomain under it. Serving the site from `www` keeps a clean separation and is the conventional choice for a static, CDN-fronted site, which is what this is.

For a one-person static site on a managed host, `www` is the low-friction default. That is the whole case. If we were apex-only for brand reasons we could do that too; the point is consistency, not the letter `w`.

### Consistency means five things agree

For the choice to actually pool signals, every place that emits an absolute URL has to say the same thing. All five now say `www`:

| Surface | Before | Now |
|---|---|---|
| `metadataBase` (resolves every relative canonical) | not set | `https://www.pivothop.com` |
| Page canonicals (`alternates.canonical`) | relative, unresolved | resolve to `www` via `metadataBase` |
| `sitemap.xml` | `https://pivothop.com` | `https://www.pivothop.com`, 74 URLs |
| `robots.txt` | non-www sitemap line, no host | `Host:` and `Sitemap:` both `www` |
| JSON-LD (breadcrumbs, author, article URLs) | `https://pivothop.com` | `https://www.pivothop.com`, all of them |

The load-bearing change is `metadataBase`. Without it, Next.js leaves relative canonicals relative and they never resolve to a host at all, which means the canonical tag is silently useless. With it set to the `www` origin, every `alternates.canonical: '/salary/ux-designer'` renders as `https://www.pivothop.com/salary/ux-designer`. Verified in the build output.

---

## The one thing code cannot do: the 301 redirect

Everything above tells Google which URL is canonical. It does not stop the non-canonical URL from being reachable. Someone typing `pivothop.com` or an old `http://` link still needs to physically land on `https://www.pivothop.com`. That is a server-side redirect, and it is configured at the host or DNS layer, not in this repo.

At launch, configure a `301` (permanent) redirect covering both axes:

- `pivothop.com` to `www.pivothop.com` (host)
- `http://` to `https://` (scheme)

On Vercel this is the domain settings: add both `pivothop.com` and `www.pivothop.com`, set `www` as primary, and it issues the `301` from the apex automatically. On raw DNS plus a server it is a redirect rule in the edge config. The test is one command:

```
curl -sI http://pivothop.com | grep -i location
# must show: location: https://www.pivothop.com/
```

Until that returns the `www` `https` URL, the canonicalization is only advisory. A `301` makes it enforced, and a permanent redirect also passes the accumulated link value from the old URL to the new one. A `302` (temporary) does not, so it has to be `301`.

---

## What changed, in files

- `src/app/layout.tsx` · added `metadataBase: new URL('https://www.pivothop.com')`
- `src/app/sitemap.ts` · `BASE` to `www`
- `src/app/robots.ts` · `Sitemap:` to `www`, added `host`
- `src/app/salary/[occ]/page.tsx` · section `h3` to `h2`, added `BreadcrumbList`
- `src/app/routes/[route]/page.tsx` · section `h3` to `h2`, added route to salary contextual link, www JSON-LD
- `src/app/blog/[slug]/page.tsx` · section `h3` to `h2`, added canonical, `BreadcrumbList`, article `mainEntityOfPage`, www JSON-LD
- `src/app/blog/posts.tsx` · 105 body `h3` to `h2`
- `src/app/glossary/page.tsx` · www JSON-LD
- `src/app/globals.css` · heading selectors renamed `h3` to `h2` so styling is unchanged, added `.rt-sallink`

The acceptance checks that held after the build: canonical tags resolve to `www`, sitemap carries 74 `www` URLs and zero non-www, robots `Host` and `Sitemap` are `www`, a salary page renders eight `h2` and zero orphan `h3`, breadcrumbs present on salary, route, and blog leaves, and the route to salary link renders.

---

## The rule going forward

Any new absolute URL, in any file, uses `https://www.pivothop.com`. Any new page that wants a canonical sets `alternates.canonical` to a root-relative path and lets `metadataBase` resolve it; do not hardcode the host in a canonical. Any new leaf page carries a `BreadcrumbList` and starts its sections at `h2`. New content links to the hubs with descriptive anchors, not bare URLs, and links both ways when a sibling page exists.

---

## Addendum · the job board's index boundary (July 2026)

The board has three layers with deliberately different index treatment:

- `/jobs` (hub, search-first) and `/jobs/{occupation}` (122 boards) — **indexed**, in the sitemap, breadcrumbed. These pages are our own content: counts, adjacency context, occupation framing.
- `/jobs/{occupation}/{id}` (~2,750 detail pages) — **noindexed** (`robots: noindex, follow`), not in the sitemap. The description body is the source's words; indexing re-displayed text would read as duplicate content and dilute the site's quality signal. The pages exist for users, not for Google.
- No `JobPosting` structured data on backfilled listings, for the same reason. That schema is reserved for direct, claimed employer posts, which is also the paid product's carrot: claimed roles become first-party content that CAN be indexed and marked up for Google Jobs.

Do not "fix" the noindex without revisiting this reasoning.
