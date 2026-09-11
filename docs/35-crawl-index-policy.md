# 35 — Crawl and index policy

*Written 2026-09-11 after a public review of that date found robots.txt blocking five sitemap URLs. One policy per page type, the reasons, and the gate that keeps sitemap, robots, canonical and metadata aligned (`apps/web/scripts/check-robots.mjs`, run by the nightly after the link and copy gates).*

## The two controls

robots.txt decides what a crawler may fetch. A `noindex` meta tag decides whether a fetched page may enter the index. A page that is both blocked and noindexed is a page whose noindex is never read: Google can still index the bare URL from links pointing at it. So a page we want out of the index must be fetchable by the search engines that build the index, and a page we do not want fetched at all must have nothing worth indexing.

## Policy by page type

| Page type | Example | Index | Crawl | Sitemap | Why |
|---|---|---|---|---|---|
| Occupation boards | `/jobs/architect` | yes | all | yes | The board is the product: live inventory plus the four data blocks |
| Category pages | `/jobs/remote-design-in-switzerland`, `/jobs/in-zurich` | yes, above the family's floor | all | only `indexable` ones (city floors 20 / 10, language floor 20) | Thin end of the city axis is link-discovered, not pushed |
| Browse hubs | `/jobs/browse`, `/jobs/browse/<facet>` (7 facets) | yes | all (explicit `Allow: /jobs/browse/`) | yes, from the same `FACETS` list the route renders | The 2026-08-04 pattern `/jobs/*/*` caught them; the review found five in the sitemap while blocked, and two facets (cities, languages) missing from the sitemap |
| Job detail pages | `/jobs/<occ>/<id>` | **no** (`noindex, follow`, since 2026-07-23) | Googlebot and Bingbot yes; generic agents no | never | The description is the source's words; the board pages carry the site's signal. Search engines read the noindex themselves and follow the links; SEO tools and minor bots skip 40k fetches (the 2026-08-04 edge-request diet, kept for them) |
| Expired listings | a rotated-out id | 404 within a day (ISR 86400) | as above | never | Listings leave the nightly build; the page 404s on next render |
| Board with parameters | `/jobs/architect?c=CH`, `/jobs?q=…` | indexes as the bare board | all | never (no query strings) | Self-canonical to the bare board; the filter state is client-side |
| Short links | `/j/<id>` | no (`X-Robots-Tag: noindex`) | none | never | 307 to the detail page with campaign parameters; nothing to index |
| Companies, salary, routes, compare, skills, guides, blog, `/direct` | | yes | all | yes (companies above the 20-role floor; the rest all) | Computed or written content |
| Dashboard, sign-in, auth confirm, design lab | | no (`noindex` meta) | all | never | Left crawlable on purpose so the noindex is read; nothing private renders server-side |
| Admin | `/admin/*` | no | none | never | HTTP Basic Auth in `proxy.ts` (401), plus `noindex`, plus `Disallow` |
| Raw data | `/data/*.json` | n/a | AI retrieval bots only | never | Structured JSON is what a cited answer reads; 12MB a fetch for anyone else |

Google-Extended and the other AI agents have their own groups in robots.txt. Those groups say nothing about Googlebot: Googlebot follows the `Googlebot` group, and where a site has none, the `*` group.

## Why the job detail pages stay out of the index

Deliberate since commit f3ff061b8 (2026-07-23): the posting text is the source's, so the detail page would be a duplicate of the origin and would dilute the board pages that carry the site's own computed content. The 2026-09-11 review asked whether a subset should be indexed with JobPosting structured data for Google Jobs. Not yet, for four reasons, each a fact of the data today:

1. Dates: `posted` is the first-seen date from the scrape ledger for most sources, not the employer's publication date. Google requires `datePosted` to be the real posting date and `validThrough` for expiry; we can state neither for aggregator rows.
2. Expiry: a listing leaves the board when the nightly build drops it and the page 404s up to a day later. Google Jobs expects the page to be removed or marked expired the day the job closes.
3. Provenance and access: the direct postings (read from employer sites) are the only rows with the employer's own text, and they are the rows whose company and apply link are locked behind a plan (`/direct`). Google's job-posting policies do not allow a posting whose application requires payment or sign-in.
4. Duplication: aggregator rows exist on the source and often on the boards the source syndicates to; the canonical is theirs.

The subset that could be opened later is the direct postings, once they carry the employer's own `datePosted`, a `validThrough` derived from the employer's page, a 410 on expiry, and an application path that is free to use. Until those four hold, JobPosting stays off and the pages stay noindexed.

## The gate

`npm run check:robots` reads the built `robots.txt` and `sitemap.xml`, applies the robots matching rule (longest path wins, Allow beats Disallow on a tie) for `*`, Googlebot and Bingbot to every sitemap URL, and fails if any sitemap URL is unfetchable, if any noindexed or private path is in the sitemap, if any URL carries a query string or a non-canonical host, if the generic group can fetch detail pages, or if Googlebot cannot. It runs in `ci-run.sh` after the link and copy gates; a red gate means no publish.
