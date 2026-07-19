# PivotHop

Career moves, measured.

A career-navigation instrument for anyone whose skills transfer to adjacent fields — any profession, global taxonomy, skills over titles. It reads live job postings and returns the routes a person's existing skills can actually reach, with the salary, the skill gap, and the honest odds attached.

This is not a startup. It is a boutique second-income business run by one person.

## Repo layout

```
docs/                   the knowledge base — read docs/00-overview.md first, then CLAUDE.md
apps/web/               Next.js app (Phase 2 — the reference HTML in apps/web/reference/ is the spec)
apps/scraper/           the scrape: ingestion → normalization → adjacency (Phase 1 — the gate)
packages/data/          shared types, occupation taxonomy, generated ROLES/NEXT files
packages/report/        PDF report generation (Phase 3)
supabase/migrations/    database schema
```

**The scrape is the gate.** Until it produces defensible per-role adjacency data, the instrument is a beautiful demo with hardcoded numbers. Do not build past the scrape.

**The reference implementations are the source of truth.** `apps/web/reference/pivothop-swiss.html` and `apps/web/reference/fairelephant.html` are built, tuned, and verified. When a markdown file and an HTML file disagree, the HTML wins.

## Non-negotiables

Every one of these was learned by building the wrong thing first. Reversing any of them re-introduces a bug that is already fixed.

**1. No `getBBox()` in the simulation loop.** Label dimensions are computed once from character counts and cached. Live measurement caused layout thrashing, lag, and offset bugs. The text is static.

**2. Persistent DOM. Never rebuild `innerHTML`.** Build the SVG once, cache element references, `setAttribute` on state change. Rebuilding kills CSS transitions *and* breaks `mouseleave` (the element under the cursor gets destroyed mid-hover). Hover is hit-tested mathematically for exactly this reason.

**3. Label-edge repulsion runs against all 34 edges, unconditionally, every step** — including edges currently dimmed to invisible. Text must never cross a wire in any state, and a wire that's faint now is bright on the next hover.

**4. The three stability defenses stay.** Damping 0.62, velocity dead-zone 0.04, running-average snap after 6 stable frames. Remove any one and a label vibrates forever and the loop never stops. Acceptance bar: **0.00px position range over 20 frames, any state.**

**5. Positions never transition.** Only `opacity`, `stroke-opacity`, and `r`. A CSS transition on `cx`/`cy` produces rubber-band lag and destroys the drag feel.

**6. The accent belongs to the data.** Graph geometry, one CTA per viewport, the manifesto block. Nothing else. This is the difference between the current design and the "bland and noisy" one it replaced.

**7. Two typefaces.** Space Grotesk (words) + Space Mono (measurements). Archivo is gone. Do not add a third.

**8. Sticky offsets are 59px, not 60px.** The nav border and the search border share a pixel row. 60px gives a double line.

**9. Scroll landings compute their target.** `bandAbsoluteY - (navH + searchH - 1)`, guarded by a 2px no-op check. `scrollIntoView` puts the target under the sticky stack.

**10. Verify numerically, not by eye.** Playwright + DOM measurement. The acceptance checklist in `docs/13-graph-spec.md` is the bar. Screenshots lie; `getAttribute('stroke-opacity')` doesn't.

## Working on this repo

- Read `CLAUDE.md` at the root before touching anything.
- Build order lives in `docs/14-build-playbook.md`. Phase 1 (the scrape) before Phase 2 (the frontend port), always.
- Voice discipline for any copy: `docs/01-style-direction.md`. No exclamation points, numbers over adjectives, deadpan register.
