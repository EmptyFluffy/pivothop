# PivotHop — Skill-Graph Evolution

*The plan for moving from an occupation-keyed graph to a skill-vector-keyed graph. Logged so the work doesn't drift. Grounded in industry research (SOC job families, LinkedIn Skills Graph, skill-adjacency literature) — see the sources at the bottom.*

---

## The one idea

Everything here is one shift: **the graph should be computed from a personal skill vector, not from a fixed occupation average.** An architect who also has graphic design and photography should get a graph that leans toward those fields. The occupation is just the *default* skill vector; the user edits it, and the graph re-derives.

The four threads below are facets of that shift.

---

## Thread 1 — Lateral moves vs cross-industry pivots

**Problem:** architect → BIM Manager (same field) and architect → Graphic Designer (real pivot) currently read identically. They shouldn't.

**Research:** occupational-mobility literature separates *within-occupation lateral moves* from *between-occupation changes*; SOC groups all work into 23 job families (same family = lateral, cross = pivot).

**Decision:**
- Add an **industry cluster** to each occupation, one level above `field` (Built Environment, Design, Technology, Business, Finance, Healthcare, Education, Media & Writing, Legal, Science, Engineering & Manufacturing, Trades, Service).
- Classify each route `kind: 'lateral'` (same cluster) or `'pivot'` (crosses it).
- Surface it **without breaking the design system**: a Space Mono tag in the rail detail (`LATERAL · BUILT ENVIRONMENT` / `PIVOT → DESIGN`), and a lightweight filter chip (`All / Pivots only`). **No new color** — the accent belongs to the match data (Law 2).

## Thread 2 — Not every second-ring role needs a bridge; personalization

**Problem:** the emitter forces every ring-2 role to attach to a parent (a bridge). But some destinations are directly transferable-but-farther — reachable from the user's skills today, at lower readiness, with a gap to close, and no bridge required.

**Decision:**
- **Conditional bridges.** A kid attaches to a parent only when that parent raises readiness by a real margin (`via.gain >= threshold`). Otherwise the kid is **standalone** in ring 2 (`reach: 'direct'`), connected faintly to the origin, carrying its skill-gap waterfall — which *is* "the missing pieces to be ready to apply."
- **User-editable skill vector (the core).** Origin = a skill vector seeded from the occupation's typical profile, then the user adds/removes skills. Readiness re-computes against every occupation from that vector. This makes every graph unique and is the heart of the product.

## Thread 3 — "Architect" disambiguation (design vs software)

**Research:** building architect (SOC 17-1011) and software architect (SOC 15-12xx) are different occupations in different major groups. Industry standard disambiguation = **qualifier + context**: qualifier words route the title; the description's skills break ties.

**Decision:**
- The `exactOnly` fix (shipped) is the industry-standard approach and stays.
- **Enhancement:** a skill-context tiebreak for genuinely ambiguous bare titles (tech-heavy description → software architect).
- **This becomes a blog pillar** under *Unbundle the Job*: "One word, two professions." Methodology-transparency, E-E-A-T, peak honest-instrument brand.

## Thread 4 — Typeahead, skill chips, related-skill suggestion, preload

**Research:** LinkedIn Skills Graph (39k skills, 200k links, 374k aliases) — aliases power typeahead, co-occurrence powers related-skills, prerequisite/relevance edges structure it. Autocomplete UX: show suggestions immediately, canonicalize.

**Decision (Phase 2 front door to Thread 2):**
- **Title typeahead, disambiguation-first**: taxonomy titles + synonyms, each showing its field (`Architect — Architecture` vs `Solutions Architect — Technology`). Fixes contamination at the input.
- **Default skill chips** from the occupation's `top_skills`.
- **Related-skill suggestion** (Rhino → Grasshopper) from **skill co-occurrence** computed over our postings.
- **Preload**: compute layout in the background as chips change; "Run the graph" plays the unfold on the already-computed result.

---

## Checklist

**Phase A — data layer (backend-only, now):**
- [ ] Industry cluster on every occupation in the taxonomy (field→cluster + AEC-engineer overrides)
- [ ] Emitter: `cluster` + `kind` (lateral/pivot) on every ring-1 role and ring-2 kid
- [ ] Emitter: conditional bridges — kids are `bridged` (via a parent) or `direct` (standalone in ring 2 with gap); only bridged kids emit a bridge edge
- [ ] `analyze:cooccur` command: per-skill top co-occurring skills from postings → generated file
- [ ] Blog pillar entry for Thread 3 in `docs/07-blog-strategy.md`
- [ ] Re-run pipeline, verify sanity + stability, refresh preview, commit

**Phase B — personalization model (data, next):**
- [ ] Origin as an editable skill vector; readiness re-derives from the vector, not the occupation average
- [ ] Skill-context tiebreak in title mapping for ambiguous bare titles

**Phase C — Phase 2 frontend (React rail + vanilla physics):**
- [ ] Title typeahead, disambiguation-first, field shown
- [ ] Editable skill chips seeded from the occupation
- [ ] Related-skill suggestions from co-occurrence (add Rhino → suggest Grasshopper)
- [ ] Standalone-kid rendering (faint origin→kid `reach` edge, longer ideal length)
- [ ] Lateral/pivot rail tag + filter chip
- [ ] Background compute + reveal-on-run (keep the unfold as the theatrical moment)

---

## Sources

- Management Science, lateral vs vertical mobility · BLS SOC job families & career clusters · O*NET-SOC taxonomy
- PeoplePilot / JobsPikr: skill-adjacency & talent graphs ("70% of the skills, close the 30%")
- Monograph: architects vs software architects (the homonym)
- LinkedIn Engineering: building the Skills Graph (nodes, edges, co-occurrence, aliases)
- Baymard: autocomplete UX best practice
