# Redesign V2 · 02 · Template inventory

*From the route tree at commit f3ccf2b8 plus the live sitemap (3,047 URLs, 2026-08-19). "SSR text" = primary content is server-rendered and crawlable today; preserving that is a migration invariant.*

| # | Family | Route pattern | Source | Data | Rendering | ~URLs | Sitemap | Canonical | Schema | Primary goal | SEO weight | Redesign priority |
|---|--------|--------------|--------|------|-----------|-------|---------|-----------|--------|--------------|-----------|------------------|
| 1 | Homepage (instrument) | `/` | `app/page.tsx` | generated origins, board counts | static, SSR text + client instrument | 1 | yes | self | WebSite | run the instrument, orient | high | **Anchor B** |
| 2 | Job board | `/jobs` | `jobs/page.tsx` + `JobsBrowse` | `public/data` JSON | static shell + client board (SSR hero/counts) | 1 | yes | self | none | search/filter live jobs | high | **Anchor A** |
| 3 | Occupation boards | `/jobs/[occ]` | `jobs/[occ]/page.tsx` | per-occ JSON, SSR list | static ×156, client layer on top | 156 | yes | self | ItemList (verify) | occupation landing | high | Phase A |
| 4 | Category/facet boards (pSEO) | `/jobs/<tag>` via `categories-data` | same template | filtered board | static | ~304 | yes | self | — | facet landing (remote, visa, 4-day…) | high | Phase A |
| 5 | Browse hub | `/jobs/browse` | `jobs/browse/page.tsx` | categories | static | 1 | yes | self | — | crawl hub for facets | med | Phase A |
| 6 | Job detail | `/jobs/[occ]/[id]` | `jobs/[occ]/[id]/page.tsx` | jobs + detail JSON | **ISR on demand**, `noindex,follow`, robots-disallowed | ~14.5k (not in sitemap) | no | self | JobPosting (verify) | read + apply out | none (deliberate) | Phase A |
| 7 | Routes hub | `/routes` | `routes/page.tsx` | generated | static | 1 | yes | self | — | route discovery | med | Phase B |
| 8 | Origin route pages | `/routes/[route]` | `routes/[route]/page.tsx` + `RouteInstrument` | generated origin files | static ×286, client instrument | 286 | yes | self | FAQ (verify) | the measured routes out of an occupation | **highest** | **Anchor C** |
| 9 | Salary pages | `/salary/[occ]` | `salary/[occ]/page.tsx` | salary-data | static | 143 | yes | self | FAQ (verify) | occupation pay, by country/seniority | high | Phase B |
| 10 | Compare pages | `/compare/[pair]` | `compare/[pair]/page.tsx` | compare-data | static | 243 | yes | self | FAQ (verify) | two-occupation overlap | med | Phase B |
| 11 | Blog index | `/blog` | `blog/page.tsx` | posts.tsx | static | 1 | yes | self | — | editorial hub | med | Phase C |
| 12 | Blog article | `/blog/[slug]` | `blog/[slug]/page.tsx` | posts.tsx | static ×44 | 44 | yes | self | FAQPage | pillar content | high | Phase C |
| 13 | Adjacency Index | `/adjacency-index` | own page | generated | static | 1 | yes | self | Dataset (verify) | research artifact | med | Phase C |
| 14 | Glossary | `/glossary` | own page | skills glossary | static | 1 | yes | self | DefinedTermSet (verify) | 360-skill reference | med | Phase C |
| 15 | About / Employers / Licenses | `/about` `/employers` `/licenses` | own pages | static | static | 3 | yes | self | — | trust + employer CTA | low/med | Phase C |
| 16 | FairElephant | `/fairelephant` | own page | static | static | 1 | yes | self | — | companion tool | low | Phase C |
| 17 | Feeds / machine surfaces | `/feed.xml` `/llms-full.txt` `/sitemap.xml` `/robots.txt` | route handlers | posts/data | dynamic-on-build | 4 | n/a | n/a | n/a | syndication/AI | high (leave alone) | never restyle |
| 18 | Admin console | `/admin`, `/admin/social`, `/admin/research`, `/admin/outreach`, `/admin/schweiz` | force-dynamic | Supabase | SSR + actions, Basic Auth, noindex | 5 | no | n/a | none | operations | none | last, cosmetic only |
| 19 | API | `/api/social/*` | route handlers | Supabase | serverless | 3 | no | n/a | n/a | autoposter | none | never |
| 20 | Error/empty states | `not-found`, expired-job messaging inside detail/panel | shared | — | static | — | no | n/a | — | recovery | low | with each family |

Internal-linking spine (do not break during migration): occupation boards ↔ route pages ↔ salary pages ↔ compare pages cross-link through `lib/site.ts` anchors; blog posts link into all four; job detail links up to its occupation family ("The PivotHop read"). The moat cross-links on category pages (docs/25) are part of family 4's template.
