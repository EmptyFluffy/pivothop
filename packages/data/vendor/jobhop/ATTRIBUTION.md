# JobHop ISCO transition matrix (derived, vendored)

`isco_transitions.json.gz` is a compact ISCO-08 4-digit occupation-to-occupation transition
matrix we **derived** from the JobHop dataset:

> Johary I, Romero R, Mara AC, De Bie T. *JobHop: A Large-Scale Dataset of Career
> Trajectories.* arXiv:2505.07653. Dataset: https://huggingface.co/datasets/aida-ugent/JobHop

Source dataset **License: Creative Commons Attribution 4.0 International (CC BY 4.0)** —
commercial use and redistribution of derived numbers permitted with attribution.

## What this is

JobHop is 1.67M observed work experiences from ~361k anonymized resumes from **VDAB, the
public employment service of Flanders, Belgium**, each mapped to a standardized ESCO
occupation code with quarter-level dates. We built the transition matrix by, per person,
ordering experiences by start quarter and counting consecutive occupation changes at the
**ISCO-08 4-digit** level (the first four digits of the ESCO code); self-loops excluded,
edges with count ≥ 2 kept. Result: 40,936 directed edges over 414 ISCO unit groups, from
263,854 people with 2+ datable experiences.

`edges`: `[{from: "2161", to: "3432", n: 53}, …]` — real **observed** worker transitions.

## Why we vendor this and not the raw dataset

The raw CSVs are ~475MB. We process them once into this 183KB derived matrix so the pipeline
is reproducible without the large download. Rebuild: download JobHop_{train,val,test}.csv from
HuggingFace and re-run the build script (see docs/15).

## Caveats (read before trusting the numbers)

- **Geography: Flanders/Belgium only.** These are Belgian labour-market flows — a weak proxy
  for US-specific magnitudes (our launch vertical is US architecture). Good for the global
  product and for adjacency *structure*; not authoritative for US rates. Kept **separate** from
  the US Oxford-CPS signal, geography-labeled (`mobility_eu`), never blended into US magnitudes.
- **Job-seeker self-selection.** VDAB is an employment service, so the corpus skews toward
  job-seekers / career-changers (arguably a feature for a pivot tool) and shows job-seeker
  noise (e.g. architects → retail during unemployment).
- **ISCO-4 resolution.** Finer than the US ACS "designers" lump — it separates interior (3432),
  product (2163), and graphic/multimedia incl. web/UX (2166) — but UX and graphic still share
  2166; full separation would need ESCO-leaf mapping (a future refinement).
