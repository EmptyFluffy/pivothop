# Redesign V2 · 03 · Baseline (production, 2026-08-19)

*Captured from the live site so the migration can be diffed against reality, not memory. Screenshots (desktop 1440 + mobile 390 for each page) and the raw extraction (`tech.json`) live in `docs/redesign-v2/baseline/` in the worktree, deliberately git-ignored to keep binaries out of history; regenerate any time with the capture script noted below.*

## Technical baseline

| Page | Path | HTTP | Robots meta | JSON-LD @types | Internal links | SSR text chars |
|---|---|---|---|---|---|---|
| home | `/` | 200 | index (default) | ?+FAQPage | 18 | 3,148 |
| jobs | `/jobs` | 200 | index (default) | ?+BreadcrumbList | 247 | 10,177 |
| jobs-occ | `/jobs/architect` | 200 | index (default) | ?+BreadcrumbList | 102 | 7,884 |
| jobs-facet | `/jobs/remote` | 200 | index (default) | ?+BreadcrumbList+ItemList+FAQPage | 102 | 6,765 |
| job-detail | `/jobs/architect/6cda75a542` | 200 | noindex, follow | ? | 39 | 3,897 |
| route | `/routes/architect` | 200 | index (default) | ?+Article+BreadcrumbList+ItemList+FAQPage | 33 | 2,906 |
| salary | `/salary/architect` | 200 | index (default) | ?+Occupation+FAQPage+BreadcrumbList | 48 | 5,116 |
| compare | `/compare/product-manager-vs-project-manager` | 200 | index (default) | ?+Article+BreadcrumbList+FAQPage | 38 | 2,422 |
| blog-index | `/blog` | 200 | index (default) | ? | 65 | 14,902 |
| blog-article | `/blog/career-change-tax` | 200 | index (default) | ?+Article+BreadcrumbList+FAQPage | 28 | 8,342 |
| employers | `/employers` | 200 | index (default) | ? | 22 | 685 |

Notes:
- The unnamed `?` schema block on every page is the site-wide graph object (WebSite/Organization) emitted without a top-level `@type` string by the shared layout; verify it stays identical after migration.
- Job detail is `noindex, follow` by design and robots-disallowed; its baseline matters for USERS not SEO.
- Titles, descriptions and canonicals for all 11 pages are recorded verbatim in `tech.json`; every canonical is self-referential on `https://www.pivothop.com`.
- H1s and the first six H2s per page are in `tech.json`; heading semantics are a migration invariant.

## Performance baseline
Not captured locally in this pass (no Lighthouse in the toolchain; CWV needs field data). Before Phase A migration ships, capture PageSpeed Insights for `/`, `/jobs`, one occupation page and one route page and append here; the redesign must not regress LCP/CLS/INP materially (brief §23). The current site's known perf posture: static HTML, one global stylesheet, two self-hosted fonts, no client framework beyond React itself on interactive surfaces.

## Regenerating this baseline
The capture script lives in this repo's history (see the Phase-1 commit); it drives production with Playwright, extracts head/meta/schema/headings/link counts, and writes both screenshots and `tech.json`.
