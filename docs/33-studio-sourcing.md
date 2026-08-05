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
