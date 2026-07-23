# @pivothop/scraper

The gate. Ingestion → normalization → adjacency scoring → per-origin `ROLES`/`NEXT` files.

Plain Node (≥20), ES modules, zero dependencies. Chosen over Python/TypeScript deliberately: one runtime for the whole repo, no build step, no venv — maintainable by one person with a day job.

## Run

From the repo root:

```
npm run scrape -- ingest            # all sources (keyless ones work immediately)
npm run scrape -- normalize         # titles → taxonomy, salary → annual USD, skills
npm run scrape -- aggregate         # per-occupation aggregates
npm run scrape -- score             # occupation adjacency, top-12 sparse
npm run scrape -- emit              # per-origin files → packages/data/generated/
npm run scrape -- run               # all of the above, in order
npm run scrape -- status            # counters
npm run scrape -- fx:update         # refresh the monthly FX snapshot
```

## Sources — legal by construction

No LinkedIn, no Indeed, no ToS-violating sources.

| Source | Auth | Notes |
|---|---|---|
| Remotive | none | remote-first postings, JSON API |
| RemoteOK | none | remote postings with annual USD salary estimates |
| Greenhouse boards | none | public JSON per company; curated list in `config/greenhouse-companies.json`; pay-transparency ranges parsed from posting text |
| Lever boards | none | public JSON per company; full descriptions, salaryRange when published |
| Ashby boards | none | public JSON per org; full descriptions + compensation tiers |
| SmartRecruiters | none | enterprise boards (AEC lives here); full text via capped, cached detail calls |
| Workable | none | public widget JSON per account; EU/SMB-heavy, diversifies the company mix |
| Recruitee | none | public offers JSON per tenant ({company}.recruitee.com/api/offers) |
| Arbeitnow | none | EU-weighted board, full descriptions |
| Jobicy | none | remote board, annual salary fields |
| Adzuna | `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` | free at developer.adzuna.com — primary breadth + salary source |
| USAJOBS | `USAJOBS_API_KEY` + `USAJOBS_EMAIL` | free at developer.usajobs.gov — clean US salary bands |
| Reed | `REED_API_KEY` | free at reed.co.uk/developers — UK employer-stated salaries |

**Observed-mobility layer** (three sources, chained by strength in emit):
1. **US observed flow** — the Oxford CPS-derived occupational mobility network (2010–2017, CC BY 4.0, `packages/data/vendor/omn`, joined via `taxonomy/acs-crosswalk.json`). Real worker transitions; the primary M signal (`mobility_source: 'observed-flow-us'`).
2. **EU observed flow** — JobHop resume trajectories (Flanders/Belgium, CC BY 4.0, `vendor/jobhop`, ISCO-08 4-digit via `taxonomy/isco-crosswalk.json`). Finer than ACS on design roles; geography-labeled, exposed separately as `mobility_eu` and used as fallback (`'observed-flow-eu'`).
3. **Curated relatedness** — `taxonomy:onet` downloads O*NET Related Occupations (CC-BY, US DoL) → `taxonomy/related-occupations.json`; base-rate-damped prior, last fallback (`'related'`). Emitted routes also carry `observed: <tier>` when a pair is independently attested.
Corroboration, never ranking — postings measure forward-looking demand; flow measures where people actually went; disagreement is editorial signal. AI-era occupations absent from ACS/ISCO are mapped to the classical codes their workers were recorded under (bucket-sharing keeps intra-bucket pairs null). Two more government layers ship alongside: **DOL CTOT CPS/SIPP observed transitions** (`vendor/ctot`, second US flow link, mid-level origins, evidence split across broad-code fan-outs) and **BLS EP Table 1.10 separation rates** (`vendor/bls-ep`, per-origin annual transfer/exit base rates, emitted as `origin.separations`). Both built by `scripts/build-mobility-vendor.py` from Internet Archive mirrors (live hosts block scripted clients). Candidates for later: Villarreal 2020 OCC1990 matrices, Nesta Career Causeways.

All requests are cached on disk (`cache/`, ~20h TTL) and rate-limited per host. Every module is runnable independently: `ingest remotive`, `ingest greenhouse`, ...

## Local-first persistence

Without Supabase credentials everything persists to NDJSON under `data/`:

```
data/postings_raw.ndjson     raw rows, unique on (source, external_id)
data/postings.ndjson         normalized rows (role_id, skills, salary_usd, country)
data/aggregates.json         per-occupation aggregates
data/adjacency.json          top-12 destinations per origin, with the formula
data/quality-latest.json     batch counters: % mapped, % with salary, % with ≥3 skills
data/unmapped-titles.json    the review log the synonym tables grow from
```

With `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` in the root `.env`, rows also upsert to Supabase via PostgREST (schema in `supabase/migrations/`).

## The output contract

`emit` writes one file per origin occupation into `packages/data/generated/` — the exact shape the graph derives `GNODES`/`GEDGES` from (see `docs/13-graph-spec.md` and `packages/data/src/index.js`). Confidence tiers are enforced at emit time:

- a destination backed by <30 postings carries `low_confidence: true`
- an origin with <50 mapped postings gets `{ insufficient: true }` — the honest empty state, never invented routes

Ring semantics: every node's match is origin-relative readiness (the same coverage metric everywhere). Ring 1 is the top-8; ring 2 is the next tier shown at its honest lower number, each kid attached to the first-hop that best *unlocks* it — merge the origin's skill profile with the parent's and measure the coverage gain (`via: {parent, readiness_after, gain}`). Each ring-1 role also carries a `waterfall` array decomposing its match point-by-point per skill (earned points sum to the displayed match) — the structured route doc that the report export and route pages narrate from.

## The match formula

```
match(origin → dest) = round(100 · destCoverage)
```

over the two occupations' top-20 skill shares (share = fraction of postings mentioning the skill). `destCoverage` is directional — how much of the destination's demanded skill weight the origin's profile already carries — which makes the displayed number interpretable: *"X% of what this role asks for, you already have."* Ranking is by match with weighted Jaccard as tie-breaker; pairs sharing fewer than 3 distinct skills are not scored at all (the evidence floor that keeps thin-profile origins from producing confident-looking noise). Deterministic given the same aggregates; the acceptance tolerance (±5 across runs) absorbs data drift between scrapes.

## Growing the mapping

`normalize` logs every unmapped title with its frequency to `data/unmapped-titles.json`. The loop: review that file, extend `packages/data/taxonomy/occupations.json` synonyms, re-run `normalize`. Same for skills in `packages/data/taxonomy/skills.json`.
