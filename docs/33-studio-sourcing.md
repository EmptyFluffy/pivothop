# Studio sourcing — the daily practice

*How boutique architecture/design firms enter the corpus. Started 2026-08-03;
waves 1–4 took the direct fleet from 0 to 130+ firms. The goal is a body of
postings that exists on no aggregator anywhere — the board's uncopyable half.*

## The two channels

1. **Hosted-ATS feeds** (free, deterministic): greenhouse / lever / ashby /
   workable / smartrecruiters / recruitee / **personio** (Swiss-critical) /
   **workday CXS**. Probe with `probe-studios-2.mjs`-style scripts.
2. **The direct fleet** (`config/direct-companies.json`, read by
   `sources/direct.js`): rendered careers pages + Claude extraction. This is
   where boutiques actually live — the ATS probes across ~290 firms confirmed
   the pattern twice: small studios do not use big ATSes.

## Running a wave

```
# 1. add candidates (name + homepage) to a new file:
apps/scraper/config/waves/wave-N.json        # [["Name","https://…"], …]

# 2. render-discover (careers link, ATS signature, jobs signal):
node apps/scraper/scripts/discover-studios.mjs apps/scraper/config/waves/wave-N.json > /tmp/waveN.json 2>/tmp/waveN.log

# 3. read /tmp/waveN.log and sort BY HAND into:
#    - ATS hits        -> that adapter's config, AFTER sample-posting verification
#    - verified pages  -> direct-companies.json (the URL discovery landed on, cleaned)
#    - no surface      -> packages/data/outreach/curated.json (category "studio")
#    - junk            -> nothing
```

## The rules that keep the corpus clean (each learned the hard way)

- **Verify every ATS hit against a real posting.** Namesakes are everywhere:
  `recruitee:som` was a Québec call-center, `greenhouse:athletics` the baseball
  team, `personio:bbb` the Berlin public pools, `greenhouse:rapp` the ad agency.
- **Only render-verified careers URLs enter the direct config.** Guessed paths
  produced confident zeros: a SPA 404 still returns 70KB of shell.
  `fosterandpartners.com/careers` was a 404; the jobs live on `vacancies.`.
- **Read the junk follows.** Snask's careers link goes to careers.mcdonalds.com;
  Marvel's went to a nyc.gov press release; Porto Rocha's to an awards jury.
- **Paid niche boards stay out** (Dezeen Jobs, world-architects, Hochparterre):
  employer-paid boards are the jobs.ch case — partners, not scrape targets.
- **Inline listings are normal for boutiques** (EM2N renders openings with `#`
  links). `direct.js` handles them with page+title identity — do not "fix" a
  0-postings firm by guessing a different URL before reading the nightly log.
- **A zero can be honest.** Small firms genuinely aren't hiring most of the
  time. The fleet's value is coverage-over-time, not daily yield per firm.

## Where the results are visible

- `/admin/outreach` → **Scraped studio fleet**: every firm, its channel, its
  LIVE listing count from the published board.
- Nightly log `direct:` lines: per-firm yield, ATS discoveries ("graduate to a
  deterministic adapter"), bot walls, robots refusals.

## Candidate seams not yet mined

- US: Texas/Chicago/Denver mid-size firms; healthcare-architecture specialists
  (HDR-adjacent); more landscape.
- CH: Romandie (Lausanne/Geneva) offices — the French-speaking seam is nearly
  untouched; Ticino.
- EU: Vienna, Munich, Hamburg practices; Madrid/Lisbon; Warsaw.
- Interiors/hospitality studios hire interior-designer + ffe-specialist — the
  occupations our board covers thinly.
- Cloud-blocked firms (Foster + Partners, AHMM render only from residential
  IPs): needs the residential-fetch workaround before re-adding.

## Wave 5 (2026-08-09, US-heavy for board balance)

53 candidates -> 22 render-verified careers pages into the direct fleet
(Lake Flato 21 jobs, Shepley Bulfinch 20, SCB 15, Michael Hsu 9, Reed
Hilderbrand 7, OZ 6, Base Design 6...), 27 no-surface firms into outreach.
Junk-link discipline caught: Overland (news article), Ross Barney (award
page), Fentress (link leaks to populous.com), Clayton Korte (#subscribe),
OLIN (SlideRoom login).

Retry list (DNS/timeout, re-probe in a future wave):
- Landon Bone Baker (ERR_NAME_NOT_RESOLVED - check domain)
- Parts and Labor Design (ERR_NAME_NOT_RESOLVED)
- Champions Design (ERR_NAME_NOT_RESOLVED - try championsdesign.com)
- ICRAVE (render timeout)
- Taylor Design hires via BambooHR (no adapter yet; bamboohr JSON API is a
  candidate: <tenant>.bamboohr.com/careers/list)

## The prospector (2026-08-09): discovery is now nightly

`scripts/prospect.mjs` runs in both nightlies before ingest. It drains
`config/prospect-queue.json` (seeded with 218 firms: US-weighted AEC,
engineering, landscape, interiors, brand studios, plus Canada/UK/Nordics/CH)
at PROSPECT_PER_NIGHT=12 candidates per night, renders each, and auto-admits
into `config/direct-companies-auto.json` only when the wave rules pass
mechanically:

- careers link on the firm's own registrable domain (junk-link class killed)
- landing URL itself careers-ish (award pages and news articles fail)
- hosted-ATS signatures are NEVER auto-admitted: they land in
  prospect-state.json as `ats-candidate` for manual sample-posting
  verification. The namesake rule stays human.

Every attempt is recorded once in `config/prospect-state.json`; both files
are tracked, so cloud nightlies commit admissions with the data. direct.js
reads curated + auto fleets, domain-deduped. When the queue drains the
nightly log says so — top it up with a new candidate list any session.

First live batch: LMN Architects admitted (7-job signal), Olson Kundig held
as ats-candidate, three duplicates correctly skipped.

## Costa Rica expansion (2026-08-22)

Research verdicts (2-lens sweep, robots.txt fetched live; full report in the
session that built this):

- **Ingesting**: ANE ane.cr (public employment service, 1,916 vacancies,
  server-rendered, robots 404s — the `ane` source), amazon.jobs search JSON
  (`amazon` source, robots-allowed), 15 verified Workday CR tenants with
  per-tenant `searchText:"Costa Rica"` (the 200-cap otherwise fills with
  non-CR roles), Careerjet `es_CR` locale + `jooble` source (both key-gated).
- **Skipped on ToS**: elempleo (explicit written scraping prohibition in
  robots.txt), Computrabajo direct (bot walls; its inventory arrives legally
  via the Jooble and Careerjet APIs, which aggregate it), LinkedIn/Indeed.
- **Deferred pending probes**: tecoloco (163 listings, robots `User-agent: *`
  allows listings), unmejorempleo (~363, robots asks `Crawl-delay: 4` only),
  buscojobs.cr (Cloudflare, needs Playwright probe), empleos.net.
- **Equifax Workday excluded on judgment**: robots disallows its /External/
  HTML pages; the CXS API isn't named but the intent is arguable.

**UA/robots policy, made explicit:** the fleet crawls as
`PivotHopScraper/0.1 (+https://www.pivothop.com; hello@pivothop.com)` and
stands on each site's `User-agent: *` grant. Several sites (tecoloco,
getonbrd, buscojobs.cr) block the named UA `ClaudeBot` via Cloudflare's
managed AI list while granting `*` and signaling `search=yes, ai-train=no`:
PivotHop indexes for search and does not train models on postings, which is
the use those signals permit. We honor named disallows of OUR UA, all
`Disallow` paths, and stated crawl delays.

**Measured results (2026-08-22, first live sweeps):**

- Careerjet: the key finally exists (referer header + REAL public `user_ip`
  both required — placeholder IPs are rejected now). First full sweep:
  **2,042 rows across 12 locales in 3.6 min** — 222 CRC Costa Rica, and the
  Swiss (340 CHF), GB (320) and US (320) sweeps that had been silently
  skipping since the adapter shipped came alive as a side effect. IP-bound to
  the founder's machine → production absorbs it via the SIDELOAD channel
  (`apps/scraper/sideload/*.ndjson`, tracked; `scripts/sideload.mjs --export`
  on the laptop, absorbed by ci-run.sh before normalize). Refresh cadence is
  manual; stale rows age out through freshness caps.
- Jooble is DUAL-SITE (keys are site-bound; a global key 400s on
  cr.jooble.org): the CR key sweeps Spanish terms with country pinned CR
  (**1,360 distinct**), the global key sweeps ONLY thin-market AEC/trades
  terms (**2,307 distinct**) so it fills gaps rather than duplicating
  Adzuna/ATS bulk. The CR host 400s on empty keywords — every term is real.
- Combined first-day arsenal: ANE 1,916 + Jooble 3,667 + Careerjet 2,042 +
  Amazon 68 + 15 Workday tenants + 32 CR employers at the prospect queue head.

**Morning-after audits owed:** (1) Spanish-title alias reach — ANE's
Salonero/Bodeguero tier only reaches the board if the lexicon maps it;
(2) triple-listing dedup (Jooble and Careerjet both aggregate Computrabajo).

**CR pipeline cautions:** dedup pressure (Jooble + Careerjet + a direct board
can triple-list one Computrabajo posting — unresolved country defeats dedup,
so `country:'CR'` rides on every CR-source row); CRC salaries (the fx table
carries CRC; sanitization needs a millions-of-colones eye when ANE ever adds
pay); Spanish blue-collar titles (ANE's SALONERO/Bodeguero tier) need a
lexicon-alias audit before their volume shows on the board — vocabulary
starvation, not sourcing starvation, is the failure mode to watch.
