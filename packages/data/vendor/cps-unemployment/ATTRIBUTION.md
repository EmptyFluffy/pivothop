# BLS CPS — Unemployment rate by detailed occupation (2025 annual average)

Household Data Annual Averages, Table 25b "Unemployment levels and rates by
detailed occupation." One row per Census-2018 (SOC-2018-based) occupation with
the BLS-published unemployment rate (use column directly; do not recompute from
rounded counts). ~563 detailed occupations; the smallest are suppressed.

- Producer: U.S. Bureau of Labor Statistics, Current Population Survey. Public domain.
- Retrieved via Internet Archive raw-bytes mirror (bls.gov blocks scripted clients):
  https://web.archive.org/web/20260502080235id_/https://www.bls.gov/cps/cpsaat25b.xlsx
- No SOC code column; joined to our occupations by title (curated map in
  apps/scraper/scripts/build-unemployment.py). Occupations that fold into a CPS
  residual bucket (e.g. data scientists → "Other mathematical science
  occupations") take that bucket's rate, labeled as such.
