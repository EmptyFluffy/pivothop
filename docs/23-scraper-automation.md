# PivotHop — Scraper Automation

*The plan for taking the human out of the nightly loop without taking the honesty out. One person owns this; every practice below exists so the bot can be trusted unattended.*

---

## The principle

The pipeline may only publish what it can defend. Automation is therefore not "run the scrape on a timer" — it is **run the scrape, prove the output is sane, and only then let it near production.** A bot that ships a contaminated board at 7am is worse than no bot.

The proving layer already exists and is the heart of this plan:

| Gate | What it catches | Where |
|---|---|---|
| `verify/gold` (67 cases) | Any fixed classification/extraction bug returning | `apps/scraper/test/gold.json`, run by `scrape verify` |
| `verify/sanity` | Waterfall≠match, bad salary bands, licensed routes missing gates or showing months-scale times | `src/score/verify.js` |
| `verify/stability` | Match drift >±5 vs snapshot (data problem or code regression) | emit-snapshot comparison |
| Purity canary | Licensed boards >30% cross-tier titles → **build fails** | `scripts/build-jobs.py` |
| Salary bounds | Anything >$900k or degenerate mins reaching the board | normalize + build-jobs belt-and-braces |

**Rule: every bug fixed in the pipeline gets a gold row in the same commit.** That is what makes unattended operation compound in safety instead of decaying.

---

## Current state (2026-07)

- `scripts/daily-run.sh` runs the full chain: `run all` → salaries → status → export-web-data → build-jobs → skill-glossary. Logs to `data/daily-run.log`.
- `scripts/com.pivothop.scraper.daily.plist` schedules it daily at 07:15 — **written but never loaded** (`launchctl list` shows nothing).
- The chain regenerates local files only. **Production data updates only when someone commits and pushes.** This is the missing piece: today the bot would scrape into a void.

## Phase A — arm the local bot (now)

1. **Add the gate to daily-run.sh.** After `run all`, run `scrape verify`; parse for `PROBLEM`. Any gold/sanity failure → skip export and publish, keep yesterday's data, log loudly. Drift >±5 on many routes → publish but flag for review (drift is often legitimate data movement; gold/sanity failures never are).
2. **Add the publish step.** On green: `git add` the regenerated surfaces (`apps/web/public/data`, `packages/data/generated`, `apps/web/src/lib/data.js`, `data/first-seen.json`) → commit `data: nightly scrape YYYY-MM-DD (N postings, M boards)` → `git push` → Vercel deploys. The commit history becomes the audit log of every dataset that ever went live.
   - Guard: `git diff --stat` first; if the diff is implausibly large (>60% of boards changed) or implausibly small (0 files), abort and flag — both smell like a broken run.
3. **Load the agent:** `launchctl load ~/Library/LaunchAgents/com.pivothop.scraper.daily.plist` (copy the plist there first). Mac must be awake at 07:15; `caffeinate` or an `AlarmClock` wake is acceptable at this scale.
4. **Failure notification.** On any red gate: append to the log AND send a Postmark email to the founder (the Postmark account already exists for the route reports). One email per failure day, subject `scrape FAILED gate: <which>`. No news = green.

## Phase B — move it off the laptop (when Phase A has run green ~2 weeks)

The laptop is the single point of failure (asleep, on a plane, battery). Two candidate homes, in order of fit:

- **GitHub Actions (recommended first).** Nightly `schedule:` workflow, `npm run scrape -- run all` + verify + the python exports, commit+push on green. Free tier is enough at this scale (~20 min/night). Secrets (Supabase, Adzuna/Reed/USAJOBS keys) go in repo secrets. Caveats: runner IPs are datacenter IPs — the current sources are APIs/feeds that tolerate this (Greenhouse, Lever, Ashby, USAJOBS…); if a source starts blocking, that source moves to Phase C.
- **The VPS** (already in the stack plan, docs/03) with a cron job — same script, residential-adjacent IP, always on. Choose this instead if Actions runner IPs get blocked or the run outgrows the free tier.

Non-negotiables regardless of home: the verify gates run **in the bot**, the publish is **git-based** (auditable, revertable with one `git revert`), and the failure email fires on red.

## Phase C — source resilience (ongoing)

- **Per-source health ledger:** ingest already counts per source; persist a rolling 7-day count per source and flag any source whose volume drops >70% (silent breakage is the most common scraper failure mode).
- **Politeness:** keep per-source rate limits and `If-Modified-Since`/ETag caching (the `cache/` dir); never fight a 403 — a source that blocks is dropped, not evaded. ToS discipline stays absolute: re-display only from re-displayable sources; Adzuna/Reed remain data-only.
- **First-seen ledger** (`data/first-seen.json`, shipped 2026-07): honest posting ages survive reposts; stale tails (>60d) stay measurable for the ghost-jobs signal.
- **Dedup** (shipped 2026-07): cross-source (company, title, place) per 60-day window at normalize, richest copy wins — aggregates count openings, not syndication.

## Phase D — data depth (the quality roadmap, research-backed)

- **Lexicon growth from ESCO + O*NET** (both CC BY 4.0): mine ESCO's occupation↔skill relations and O*NET Technology Skills (~32k tool names) for candidate aliases, human-review each batch before it enters `skills.json` (precision-first; no bulk import). ESCO's relations double as a free sanity prior for adjacency scores.
- **Unmapped-title mining:** `unmapped-titles.json` already logs the top 400 by frequency — a monthly 20-minute pass turns the biggest clusters into new synonyms/occupations, each with a gold row.
- **Zoning v2** if boilerplate pollution reappears: per-line heading classifier (the current heading heuristic covers the labeled-sections case).

## What stays manual, on purpose

- Taxonomy changes (synonyms, license gates, new occupations) — judgment calls, human-reviewed, each with gold rows.
- The lexicon (`skills.json`) — curated, never auto-grown.
- Anything that touches copy, pages, or the graph's tuned values.

The bot's jurisdiction is: fetch, normalize, score, verify, publish data. Nothing else.

---

## The rebuild contract (2026-07-29)

*What must regenerate every time the scraper finishes, in what order, and what stops the publish. Written after the board quoted three different remote counts on one page.*

### Order is load-bearing

```
scrape -- ingest all → normalize → aggregate → salaries      (nightly)
scrape -- score → emit                                        (Mondays only, FORCE_GRAPH=1 to override)
export-web-data.py        origins, skill-profiles, salaries, cloud, lib/data.js
fetch-logos.mjs           company logos (incremental, non-fatal)
build-jobs.py             the board: jobs/<occ>.json, jobs-detail/, all-jobs.json, jobs-index.json
build-skill-icons.mjs     skill-icons.ts + skill-marks.json
build-skill-glossary.py   skills-glossary.json   ← folds in skill-marks.json, so icons MUST run first
build-lastmod.py          lastmod.json           ← sitemap.ts reads it at build time, so this runs last
next build → check:links
```

Three of these have bitten us by running in the wrong order or not at all: `build-jobs.py` is not part of `scrape -- run`, so a hand-run scrape refreshes the graph and leaves the board a day stale; `build-skill-icons` after the glossary ships markless chips for a day; `build-lastmod` after the build has no effect at all.

### One source per number

**Every visible count comes from `all-jobs.json`, via `boardStats()` in `jobs-data.tsx`.** Do not re-derive a count by filtering the board inside a page — that is exactly how the `/jobs` dek came to say 3,066 remote while the client said 1,530. New facets get added to `boardStats()`, not recomputed at the call site. Category counts come from `categories-data`, which reads the same file.

### The gates, and what each one exists to stop

| Gate | Catches |
|---|---|
| `verify` gold set (67 cases) | every bug ever fixed, frozen as a test |
| `verify` sanity + licensed routes | waterfalls that do not reconcile, a months-scale timeline on a multi-year credential |
| purity canary (build-jobs) | a licensed board >30% cross-tier titles — the dental-hygienist class |
| **mojibake canary** | double-encoded text reaching a displayed field |
| **consistency canary** (new) | per-occupation boards and `all-jobs.json` disagreeing on total or remote |
| `check:links` | any internal href with no target — including pages that stopped being generated |
| implausible-diff tripwire | >3,000 changed files, i.e. something went badly wrong upstream |

**Red gate = no publish, last-good data stays live.** That is the whole point: the bot may only publish what it can defend.

### The recurring failure mode

Threshold-gated pages vanish when their data moves. A compare pair stops qualifying, an origin drops below the posting floor, a category falls under the 6-listing gate — and any hard-coded link to it 404s. `check:links` catches it, but only *after* it has blocked a night's publish. Editorial links to computed pages must go through a guard: `hasOriginPage()` for routes, `CompareLink`/`compareHref` for comparisons. Anything new that links from prose to a generated page needs the same treatment.

### Freshness expectations, by surface

- **Board listings** — nightly. Expire in weeks; this is the product's freshness claim.
- **Adjacency / route numbers** — weekly (Mondays). Computed over a large accumulated corpus, so nightly re-scoring shuffled matches by a point or two for no reader benefit and made `lastmod` meaningless.
- **Salary bands** — nightly, from aggregates. Note the trade: route pages carry Monday's salary strings while `/salary/*` carries nightly figures, so the two can drift a little during the week and re-sync on Monday.
- **`lastmod`** — advances only when the data behind a page actually changed (`build-lastmod.py` hashes it). "Changed today" has to mean something or Google stops believing it.


---

## 2026-07-31 — the corpus hit a hard ceiling, and the cloud found it

**The most important entry in this file.** Seeding the cloud with the laptop's
real corpus ran the primary code path against real data on a different machine,
and it failed:

```
Error: Cannot create a string longer than 0x1fffffe8 characters
```

`0x1fffffe8` is **V8's maximum string length: 536,870,888 characters.**
`postings_raw.ndjson` was **535,851,089 bytes — 99.8% of it.** Headroom: under
1MB, against ~70MB of growth a night.

`readNdjson` did `readFileSync(file,'utf8')` — the whole corpus as one string.
`writeNdjson` built one on the way out. **The laptop bot would have died at
07:15 the next morning**, and the failure cascades: normalize dies,
`postings.ndjson` is never written, every downstream step fails on a missing
file, and the cause reads as gibberish unless you know V8 internals.

Fixed by reading as a **Buffer** and decoding line by line (Buffers have no such
cap), and writing in 8MB chunks while keeping the atomic temp-then-rename.
Verified: 260,519 rows in 2.1s, byte-identical round-trip, UTF-8 safety at chunk
boundaries (`São Paulo`, `Köln`, `東京` — splitting a multi-byte sequence would
have silently corrupted exactly the Spanish and Portuguese titles docs/27 was
written to fix), and a full normalize matching the laptop's run to the digit.

**The lesson worth keeping:** running the same code against the same data on a
second machine is a test, not a formality. The ceiling had been approaching for
weeks and nothing on one machine would have revealed it before it bit.

## The corpus seed

`postings_raw.ndjson` is gitignored, so before today the entire 511MB corpus
existed on **one laptop** and nowhere else. That was the real single point of
failure, independent of the switchover.

Private release `corpus-seed-2026-07-31` now holds it (93MB gzipped) plus the
first-seen ledger. `ci-run.sh` restores both on a cold cache, gated on **size,
not existence** — a truncated restore is worse than none because it looks like
data, so anything under 50MB re-downloads. The ledger is restored alongside
deliberately: seeding postings without it would make every seeded posting look
first-seen today, destroying the repost-proof age guarantee.

**Keep the release private.** It contains 195,982 Adzuna and 14,200 Reed
postings whose terms restrict re-display. If this repo is ever made public,
delete the release first.

## Where the switchover stands

The cloud now runs green on the full corpus — 262,290 raw → 118,319 after dedup,
gold 91/91, sanity clean, published. It is at parity with the laptop.

**Both bots still run, and that is the remaining problem:** they commit the same
paths, so whichever finishes last publishes. No longer a data-quality risk now
that the corpora match, but still a race that produces confusing diffs.

Retire the laptop *after* several unattended green cloud nights, not before.
The order matters — there must never be a window with no working publisher.
