# 20 · Scraping sources, the complete catalog

*Every source the pipeline ingests, what it provides, its legal basis, and where its data is allowed to surface. The scraper CLI registers these in `apps/scraper/src/cli.js`; each has a module in `apps/scraper/src/sources/`. Rule of the house: legal by construction — public feeds and licensed APIs only, no LinkedIn, no Indeed, no ToS-violating collection.*

---

## The two surfaces, and the line between them

Every posting feeds the **data side** (skill extraction, adjacency, salary aggregates, the graph). Only some sources may feed the **job board**, because re-displaying a listing is a different permission than analyzing it. Board-eligible sources are public feeds companies expose deliberately for embedding, always with attribution and a link back to apply. Aggregator APIs whose terms restrict re-display feed the data side only.

## Job-posting sources (15)

| Source | Module | Auth | What it is | Geography | Board? | Config |
|---|---|---|---|---|---|---|
| Greenhouse | `greenhouse.js` | none | Public JSON per company board (`boards-api.greenhouse.io`) | Global (US-led; EU/LATAM/Asia/Africa boards added) | **Yes** | `greenhouse-companies.json` (219 boards) |
| Lever | `lever.js` | none | Public JSON per company (`api.lever.co/v0/postings`) | Global | **Yes** | `lever-companies.json` (63) |
| Ashby | `ashby.js` | none | Public JSON per org; compensation tiers when published | Global (AI/startup-heavy) | **Yes** | `ashby-companies.json` (76) |
| SmartRecruiters | `smartrecruiters.js` | none | Public API per enterprise account | Global enterprise (AEC, retail, consulting) | **Yes** | `smartrecruiters-companies.json` (44) |
| Workable | `workable.js` | none | Public widget JSON per account (`apply.workable.com/api/v1/widget`) | EU/SMB-heavy | **Yes** | `workable-companies.json` (55) |
| Recruitee | `recruitee.js` | none | Public offers JSON per tenant (`{company}.recruitee.com/api/offers`) | EU-heavy (NL/DE/PL) | **Yes** | `recruitee-companies.json` (44) |
| USAJOBS | `usajobs.js` | `USAJOBS_API_KEY` + email | Official US federal jobs API; public-domain data, clean salary bands | US | **Yes** | — |
| Remotive | `remotive.js` | none | Remote-first board, JSON API | Worldwide remote | **Yes** | — |
| RemoteOK | `remoteok.js` | none | Remote board API with salary estimates | Worldwide remote | **Yes** | — |
| Himalayas | `himalayas.js` | none | Remote board API | Worldwide remote | **Yes** | — |
| Jobicy | `jobicy.js` | none | Remote board API, annual salary fields | Worldwide remote | **Yes** | — |
| Arbeitnow | `arbeitnow.js` | none | EU-weighted board API, full descriptions | EU (DE-led) | **Yes** | — |
| The Muse | `themuse.js` | none | Public jobs API | US-led | **Yes** | — |
| Adzuna | `adzuna.js` | `ADZUNA_APP_ID/KEY` | Licensed aggregator API — primary breadth + salary source | 12 markets: US GB CA AU DE FR ES NL BR IN MX SG | **No — data only** (terms restrict re-display) | `queries.json` (207 terms × 12 countries) |
| Reed | `reed.js` | `REED_API_KEY` | Licensed UK API, employer-stated salaries | UK | **No — data only** | — |

The board allowlist lives in `apps/scraper/scripts/build-jobs.py` (`OK = {...}`). Change it only with the terms in hand.

## Board composition rules (build-jobs.py)

- Freshest 60 per occupation, minimum 3 to publish a board.
- **Diversity ceiling: US listings stop at 65% of an occupation's cap while non-US supply remains**, so one country cannot crowd out the world.
- Dedup by URL and by (company, title); named employers only.
- Country resolved per listing: normalize's ISO code, else inferred from location text (country names, ~90 world cities, ", XX" suffixes, US states and cities). ~88% coverage across 54 countries; "Anywhere" remotes stay uncoded on purpose.
- Derived tags computed from the posting text (never self-reported): four-day week, equity, visa sponsorship, seniority level.
- Featured strip: allowlisted recognizable employers, salary-stated first, max two per company.

## Reference-data sources (not postings)

| Dataset | Where | License | Used for |
|---|---|---|---|
| Oxford CPS occupational mobility network (2010–17) | `packages/data/vendor/omn` | CC BY 4.0 | Observed US worker flows (primary M signal) |
| JobHop resume trajectories (Flanders) | `vendor/jobhop` | CC BY 4.0 | EU observed flows (fallback signal) |
| DOL CTOT (CPS/SIPP transitions) | `vendor/ctot` | Public domain | Second US flow corroboration |
| BLS EP Table 1.10 separations | `vendor/bls-ep` | Public domain | Per-occupation transfer/exit rates |
| BLS OEWS annual history (2019–24) | `vendor/oews-history` | Public domain | Salary anchors + trend charts |
| BLS CPS unemployment (Table 25b) | `vendor/cps-unemployment` | Public domain | Per-occupation unemployment rates |
| O*NET Related Occupations | `taxonomy/related-occupations.json` | CC BY (US DoL) | Curated relatedness prior (last fallback) |
| World Bank ICP price levels | via FairElephant pipeline | Open | Cost-of-living adjustment by country |

Government hosts (bls.gov, dol.gov) block scripted clients at the TLS level; these vendors were built from Internet Archive mirrors by `scripts/build-mobility-vendor.py` and friends. Details in `docs/18-mobility-data-catalog.md`.

## Growing the catalog

New company boards: append to the config lists (unknown boards skip gracefully — casting wide is safe). New source *types*: clone a module (`lever.js` is the cleanest pattern), register in `cli.js` `SOURCES`, decide board eligibility against its terms, and add a row here. The nightly run (`scripts/daily-run.sh`) picks everything up automatically.
