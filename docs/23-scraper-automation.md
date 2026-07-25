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
