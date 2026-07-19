# CLAUDE.md

*Entry point for Claude Code. Read this before touching anything.*

*(This is the knowledge-base CLAUDE.md with file paths adapted to the repo layout: the founding docs live in `docs/`, the reference implementations in `apps/web/reference/`.)*

---

## What this is

PivotHop is a career-navigation instrument for **anyone whose skills transfer to adjacent fields — any profession, global taxonomy, skills over titles.** It reads live job postings and returns the routes a person's existing skills can actually reach, with the salary, the skill gap, and the honest odds attached. Architecture is the launch vertical and the demo dataset (the founder's own pivot), never the product's boundary. The monetization destination is the **adjacent-talent job board** — employers flag roles open to adjacent candidates and pay to post and match; V0 runs that board manually as concierge introductions.

FairElephant is its companion — a remote-compensation calculator on the same design system.

**These are not startups.** They are a boutique second-income business run by one person. Scope decisions should reflect that: no infrastructure that needs a team, no features that need funding, nothing that can't be maintained by one architect who also has a day job.

---

## Read in this order

| File | Why |
|---|---|
| `docs/00-overview.md` | The business, the model, the gate |
| `docs/03-mvp-scope.md` | What V0 is and explicitly is not |
| `docs/01-style-direction.md` | The design and voice system. **Non-negotiable.** |
| `docs/13-graph-spec.md` | The instrument. Every value is a tuned finding. |
| `docs/04-landing-strategy.md` | Page structure, URL strategy |
| `docs/14-build-playbook.md` | **The execution layer** — phased copy-paste prompts, data sources, acceptance checks |
| `docs/02-objectives.md` · `docs/11-success-criteria.md` · `docs/12-kill-criteria.md` | What winning and losing look like |
| `docs/05` `06` `07` `08` `09` `10` | Preloaded states, about, blog, employer CTA, marketing, FairElephant |

---

## The reference implementations are the source of truth

```
apps/web/reference/pivothop-swiss.html     ← the landing + the graph. Built, tuned, verified.
apps/web/reference/fairelephant.html       ← the companion, same system, oxblood accent.
apps/web/reference/fairelephant-old.html   ← pre-redesign. Reference only. Do not revive.
```

**When a markdown file and an HTML file disagree, the HTML wins.** The docs describe intent; the files contain values that were tuned empirically and verified by DOM measurement. Port from the files, not from prose.

Both are vanilla, dependency-free, single-file. That is not laziness — it is a deliberate constraint that kept the graph fast. Read `docs/13-graph-spec.md` before deciding to "modernize" any of it.

---

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

---

## The gate

**The scrape is the gate.**

Everything in this knowledge base — the graph, the match percentages, the salary bands, the skill gaps, the pillar articles' uncopyable data, the entire value proposition — depends on scraping live job postings and producing clean, defensible per-role adjacency data at hobbyist scale.

Until that exists, the instrument is a beautiful demo with hardcoded numbers.

**If you are picking up this project cold: the scrape is the first real work.** Not the frontend. The frontend is done and it is good. Resist the pull toward the part that's fun to build.

---

## Suggested build order

*(Expanded into literal step-by-step prompts in `docs/14-build-playbook.md` — use that file to drive the work; this list is the summary.)*

1. **The scrape.** Per-role skill extraction from live postings → adjacency scoring → the `ROLES`/`NEXT` shape the graph already consumes. Start with 8 architect-adjacent roles. If this can't produce defensible numbers, nothing downstream matters.
2. **Wire the real data in.** The graph derives `GNODES`/`GEDGES` from `ROLES`/`NEXT`. Swap the source; the instrument shouldn't change.
3. **Persistence + the report.** Route state → PDF export. Postmark for delivery.
4. **Preloaded route pages.** 20–30 states, per `docs/05-preloaded-states.md`. This is the SEO surface.
5. **About + legal.** Small, real, per `docs/06-about-page.md`.
6. **The launch data-post.** Per `docs/09-marketing-strategy.md`.

Stack per `docs/03-mvp-scope.md`: Next.js / Supabase / VPS / Postmark / Puppeteer.

---

## Working in this repo

- npm workspaces. Node ≥ 20. Install once at the root: `npm install`.
- Scraper CLI: `npm run scrape -- <command>` from the root (see `apps/scraper/README.md`).
- The scraper runs local-first: without Supabase credentials it persists to NDJSON under `apps/scraper/data/`. With `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` in `.env` it also upserts to Supabase (schema in `supabase/migrations/`).
- Generated per-origin route files land in `packages/data/generated/` — that is the contract the graph consumes.

---

## Porting the graph

If the frontend moves to React: **physics and label state live outside React.** A ref or a plain module, DOM written imperatively as it is now. Reconciling 25 nodes × 34 edges per frame through the virtual DOM reintroduces exactly the thrashing this design eliminates.

React owns the rail, the detail view, the trail, the page. It does not own the canvas.

Do not reach for D3-force. The physics is ~60 lines tuned to this graph, and label clearance — the hard part — is not something D3 solves either.

---

## Voice

If you write copy: read the voice section of `docs/01-style-direction.md` first, in full.

The short version: no exclamation points, no motivational vocabulary, no inline bolding mid-sentence, no centered text, numbers over adjectives, deadpan register. If a sentence could appear on any other career-tech landing page, delete it.

Hero construction across the family is **"X, past-participle."** — *Career moves, measured.* / *Fair pay, computed.* The period is load-bearing.
