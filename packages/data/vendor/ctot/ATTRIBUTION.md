# DOL CTOT — CPS/SIPP Transitions (public use)

Observed occupation-to-occupation transitions from the Career Trajectories and
Occupational Transitions study (DOL Office of the Assistant Secretary for
Policy, December 2021): person-level CPS + SIPP records with survey weights,
aggregated here to SOC-pair weight/count cells (12886 pairs from
36235 usable person transitions).

- Producer: U.S. Department of Labor, OASP (a U.S. government work published
  as a public-use dataset; the underlying surveys are Census Bureau products).
- Retrieved via Internet Archive raw-bytes mirror (the live DOL listing was
  removed between 2022 and 2026): https://web.archive.org/web/20221017211231id_/https://www.dol.gov/sites/dolgov/files/OASP/evaluation/pdf/CPS-SIPP_dataset.csv
- Scope caveat: ORIGIN occupations are restricted to "mid-level" (beyond high
  school, below a four-year degree). Destinations are unrestricted. Treat as
  corroboration for covered origins, never as evidence of absence.
- The separate Emsi/Lightcast-derived CTOT files are deliberately NOT vendored:
  their commercial-redistribution license is unresolved (see docs/18).
