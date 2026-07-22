# PivotHop — Mobility-Data Catalog

*The verified catalog of occupation-to-occupation mobility sources: what each one actually is, what it costs, whether we can legally ship numbers derived from it, and what we did about it. Compiled July 2026 from an adversarially-verified deep-research pass (25/25 claims confirmed, 0 refuted); updated as ingests land. The distinction that matters everywhere below: **observed flow** (people actually moved) vs **similarity or curated relatedness** (someone or something judged the move plausible). The field is full of the second masquerading as the first.*

---

## Ingested

| Source | What it is | Resolution | License | Status |
|---|---|---|---|---|
| Oxford CPS mobility network (del Rio-Chanona/Mealy/Farmer, Zenodo 4453162) | **True observed US flow**, CPS monthly panels 2010–2017; edge = empirical probability a worker moves i→j | 464 occupations, ACS/Census 4-digit | CC BY 4.0 (commercial + redistribution OK, attribution) | `vendor/omn`, primary M signal (`observed-flow-us`) |
| JobHop v2 (VDAB/aida-ugent, HuggingFace) | **True observed EU flow**: 355k career trajectories from ~440k anonymized Flanders/Belgium resumes | ESCO leaf (~3,000 occupations — separates UX from graphic design) | CC BY 4.0 | `vendor/jobhop`, derived ISCO-4 matrix, fallback M (`observed-flow-eu`), geography-labeled |
| DOL CTOT CPS/SIPP Transitions | **True observed US flow**, person-level CPS+SIPP (~2020), survey-weighted, aggregated to SOC pairs | SOC-2018 hybrid (detailed/broad/masked); broad-code evidence is split across matching slugs, cells floored at n≥3 | US government work, published as public-use data | `vendor/ctot`, second link in the US chain (`observed-flow-ctot`). Mid-level origins only → 18 origins, 98 resolvable pairs; with OMN covering the taxonomy it currently corroborates rather than adds emitted pairs. `analyze:flow-ctot` is the editorial view (electrician→carpenter, medical assistant→RN…) |
| BLS EP Table 1.10 (2024–34) | **Separation base rates** — annual % who transfer to a different occupation, % who exit the labor force, openings; no destinations | SOC 6-digit, 832 line items | Public domain | `vendor/bls-ep`; joined per-slug (147/156 covered), emitted as `origin.separations` in every route payload. Architect: 3.3%/yr transfer, 2.5%/yr exit |
| O*NET Related Occupations | **Curated expert relatedness** — not flow | O*NET-SOC 8-digit | CC BY 4.0 | `taxonomy/related-occupations.json`, base-rate-damped prior, last fallback (`related`) |
| O*NET Abilities/Work Activities | **Capability similarity** — not flow; the durable backbone `C` | O*NET-SOC | CC BY 4.0 | `taxonomy/capability-vectors.json` |

**Resolution note:** ACS lumps all designers into one bucket, so intra-bucket pairs (e.g. UX ↔ graphic) return null from the US flow and fall through to the EU flow (which resolves them) or the prior. AI-era occupations (ai-engineer, mlops, nlp, computer-vision, prompt-engineer, data-architect, ai-product-manager, ux-researcher, robotics-engineer) are mapped to the classical ACS/ISCO codes their workers were recorded under during the survey window — bucket-sharing keeps their intra-bucket pairs null, which is the honest reading.

## Verified but not (yet) ingested

- **DOL CTOT Emsi/Lightcast-derived files** — verified and downloaded (Dashboard_transitions: 458 origins × top-30 destinations with OEWS wage deltas; Emsi_dataset: 256,831 origin→destination rows with twelve skill-difference variables). **Held out of the product on license grounds**: DOL publishes them as public-use, but the underlying data was licensed from Emsi/Lightcast and the page grants use "for researchers... for their own analysis" — not a clear commercial-redistribution grant. Local copies retained for *validation only* (checking our M signal against theirs); nothing derived from them ships until DOL (contact on the data.gov record) confirms. The CPS/SIPP file has no such problem and is ingested above.
- **Access note (July 2026):** dol.gov and bls.gov both block scripted clients at the TLS-fingerprint level, and the CTOT listing was removed from the live DOL page between 2022 and 2026. The Internet Archive raw-bytes URLs (`id_` infix) in `scripts/build-mobility-vendor.py` are the reliable path and serve the original files byte-for-byte.
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
