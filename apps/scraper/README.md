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
| Adzuna | `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` | free at developer.adzuna.com — primary breadth + salary source |
| USAJOBS | `USAJOBS_API_KEY` + `USAJOBS_EMAIL` | free at developer.usajobs.gov — clean US salary bands |

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

## The match formula

```
match(origin → dest) = round(100 · destCoverage)
```

over the two occupations' top-20 skill shares (share = fraction of postings mentioning the skill). `destCoverage` is directional — how much of the destination's demanded skill weight the origin's profile already carries — which makes the displayed number interpretable: *"X% of what this role asks for, you already have."* Ranking is by match with weighted Jaccard as tie-breaker; pairs sharing fewer than 3 distinct skills are not scored at all (the evidence floor that keeps thin-profile origins from producing confident-looking noise). Deterministic given the same aggregates; the acceptance tolerance (±5 across runs) absorbs data drift between scrapes.

## Growing the mapping

`normalize` logs every unmapped title with its frequency to `data/unmapped-titles.json`. The loop: review that file, extend `packages/data/taxonomy/occupations.json` synonyms, re-run `normalize`. Same for skills in `packages/data/taxonomy/skills.json`.
