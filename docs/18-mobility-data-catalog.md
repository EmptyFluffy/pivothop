# PivotHop — Mobility-Data Catalog

*The verified catalog of occupation-to-occupation mobility sources: what each one actually is, what it costs, whether we can legally ship numbers derived from it, and what we did about it. Compiled July 2026 from an adversarially-verified deep-research pass (25/25 claims confirmed, 0 refuted); updated as ingests land. The distinction that matters everywhere below: **observed flow** (people actually moved) vs **similarity or curated relatedness** (someone or something judged the move plausible). The field is full of the second masquerading as the first.*

---

## Ingested

| Source | What it is | Resolution | License | Status |
|---|---|---|---|---|
| Oxford CPS mobility network (del Rio-Chanona/Mealy/Farmer, Zenodo 4453162) | **True observed US flow**, CPS monthly panels 2010–2017; edge = empirical probability a worker moves i→j | 464 occupations, ACS/Census 4-digit | CC BY 4.0 (commercial + redistribution OK, attribution) | `vendor/omn`, primary M signal (`observed-flow-us`) |
| JobHop v2 (VDAB/aida-ugent, HuggingFace) | **True observed EU flow**: 355k career trajectories from ~440k anonymized Flanders/Belgium resumes | ESCO leaf (~3,000 occupations — separates UX from graphic design) | CC BY 4.0 | `vendor/jobhop`, derived ISCO-4 matrix, fallback M (`observed-flow-eu`), geography-labeled |
| O*NET Related Occupations | **Curated expert relatedness** — not flow | O*NET-SOC 8-digit | CC BY 4.0 | `taxonomy/related-occupations.json`, base-rate-damped prior, last fallback (`related`) |
| O*NET Abilities/Work Activities | **Capability similarity** — not flow; the durable backbone `C` | O*NET-SOC | CC BY 4.0 | `taxonomy/capability-vectors.json` |

**Resolution note:** ACS lumps all designers into one bucket, so intra-bucket pairs (e.g. UX ↔ graphic) return null from the US flow and fall through to the EU flow (which resolves them) or the prior. AI-era occupations (ai-engineer, mlops, nlp, computer-vision, prompt-engineer, data-architect, ai-product-manager, ux-researcher, robotics-engineer) are mapped to the classical ACS/ISCO codes their workers were recorded under during the survey window — bucket-sharing keeps their intra-bucket pairs null, which is the honest reading.

## Verified but not (yet) ingested

- **DOL CTOT (Career Trajectories and Occupational Transitions)** — ready-made, disclosure-checked public-use files of **observed transitions** on data.gov: an Emsi/Lightcast-derived origin→destination file (top-30 destinations per origin, OEWS wages attached) and a person-level CPS/SIPP file with survey weights. **Restricted to "mid-level" occupations** (beyond high school, below bachelor's) — excludes architecture, covers many of our trades/health/admin occupations. Open question logged: whether the Lightcast-derived file's numbers can be redistributed commercially; the CPS/SIPP-derived file is a government work product. *Status: ingest candidate; URL verification in progress.*
- **BLS Table 1.10 occupational separations** — per-SOC annual **occupational transfer rate** (share leaving to a *different* occupation each year) and labor-force exit rate. No destinations, but it is the honest per-origin base rate ("how often do people actually leave this occupation") — product copy and blog material. Public domain. *Status: ingest candidate; URL verification in progress.*
- **Villarreal 2020** (Sociological Science 7:187-221, CC BY 4.0) — observed CPS month-to-month matrices at 311 OCC1990 categories. Caveats: primary matrix limited to employed full-time men 25–55; one-month flows capture churn as well as deliberate pivots; supplement download not yet confirmed. Second-source corroboration if the matrix is downloadable.
- **IPUMS CPS JTOCC/OCCLY** — year-ago occupation and current occupation in a single record (no panel-linking needed), detailed Census OCC codes, free with registration. The build-it-yourself upgrade path if we ever want our own matrix (fresher window than OMN's 2010–2017).

## Ruled out, with reasons

- **Census LEHD J2J** — no occupation dimension at all (UI wage records carry no occupation codes); even origin-destination series resolve by industry. Confirmed 3-0.
- **Eurostat Labour Market Transitions** — statuses only (employment/unemployment/inactivity), no occupation pairs. Confirmed 3-0.
- **LinkedIn Economic Graph** — real observed flow, published only as charts/reports and privacy-thresholded dashboards; no open licensed dataset, no transitions API short of a bespoke partnership. Not scraping it (compliance line already drawn).
- **Revelio Labs** — the best *paid* option (resume-derived global transitions, ~1,500 job categories, from 2008) but commercial-contract pricing; the free tier (RPLS) publishes only hiring/attrition *rates* at SOC-2-digit — no pairs. Parked until the business could justify a data contract.
- **O*NET Career Changers Matrix** — derived from Related Occupations by algorithm; curated relatedness re-badged, not observed flow. We already hold the parent dataset.
- **CareerOneStop API** — free but click-license with real redistribution constraints, and it surfaces O*NET relatedness anyway.

## The flywheel note

Every source above is somebody else's history. The long-term observed-flow signal PivotHop can own is its own: which routes users run, save, and export. That dataset starts existing the day persistence ships (Phase 3) and is the only one on this page with zero license constraints.
