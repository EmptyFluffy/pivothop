# PivotHop — Landing Strategy

*How users enter the site, why we're not asking them to identify themselves, and how the two sides of the marketplace get their own entry surfaces without breaking the candidate flow.*

---

## Decision: no interstitial segmentation

The obvious idea — ask visitors "are you a candidate or an employer?" on first landing — is rejected. Reasons:

1. **Candidates dominate traffic.** By at least 100:1 in year one. Asking a segmentation question up front means adding friction to 99% of traffic to save one click for the 1%.
2. **Employers arriving from cold outreach, LinkedIn ads, or the pillar article are already self-segmented.** They know why they're there. An interstitial insults them.
3. **The interstitial is the tell of a company that hasn't figured out its positioning.** Real category-owners lead with their strongest surface. Ours is the instrument.
4. **It fights SEO.** Search engines want a single dominant page per intent. Splitting attention hurts ranking.

**The pattern instead:** candidates land on the main site by default. Employers arrive through a distinct URL (`pivothop.com/employers`) promoted only through their acquisition channels. Everyone wins, no interstitial, no fork in the road.

## Candidate landing (V0 primary)

### URL and audience

- **URL:** `pivothop.com/` (root)
- **Audience assumption:** anyone with transferable skills considering a pivot — any profession. The instrument is origin-agnostic; the "Current role" field selects the user's occupation and the graph derives their routes.
- **Reading level and vocabulary:** professional and specific — but the specificity now lives **per origin**, not in a single-vertical assumption. The generic landing speaks in profession-neutral instrument language ("Career moves, measured."), and the per-route pages (`05`) carry the industry-fluent voice for each origin. "Trying to speak to everyone speaks to no one" still holds — it's solved by origin-aware routes, not by excluding professions.

### Structure (top to bottom)

*Redesigned. The reference implementation is `pivothop-swiss.html` — build against that file, not against this list.*

The controlling decision: **the graph is the hero.** It is the product, it is interactive, it is the thing no competitor has. It gets the width and the position to say so. Everything above it seeds it; everything below it explains it.

1. **Nav** (sticky, 60px, 1px ink bottom) — brand + wordmark, primary nav (FairElephant ↗, Method, Blog, About), black "For employers" cell. The only black element on the page.
2. **Hero** — eyebrow ("The career instrument") + h1 "Career moves, measured." at `clamp(60px, 9.4vw, 132px)`, flush left, forced to two lines by `max-width: 12ch`. **No paragraph.** The explanatory prose that used to live here was cut; the manifesto carries that idea now.
3. **Search bar** — full-bleed (nav width, no side padding, not floating), 78px, sticky at `top: 59px` inside the `.instr` wrapper. Its bottom border *is* the graph band's top edge. CTA: "Run the graph."
4. **The instrument band** — `272px | 1fr`. Left rail: the routes list, which swaps in place to the detail view on click. Right: the graph stage at `clamp(480px, 70vh, 740px)`. Band head carries the pivot score. Trail strip underneath.
5. **Proof strip** — in-demand skills as a middot-separated list + the two stats (8 matches / 12,540 roles) as large ink numerals. One hairline-ruled row.
6. **Method** — four flush-left numbered rows. Oversized ink numerals (76px), terse title, one flat sentence. **No icons.**
7. **Manifesto** — the one big color moment. Full-bleed cobalt field, white type up to 72px, flush left. "Four applications that matter beat four hundred that don't." / "No spray. No pray."
8. **Capture band** — underline input, no box. "Take the graph with you."
9. **Footer** — Product, Resources, Company columns + copy band. Tagline "Career decisions, measured." closes the loop with the hero.

### The console is gone

The old three-column console (280px score panel | radar | 280px detail panel) has been replaced. Reasons, in order of weight:

- The graph was the smallest-feeling thing in its own section. Two permanently-reserved 280px columns squeezed the product into ~640px on a 1440px screen.
- The detail panel was reserved space that sat empty until a click. Presence-on-demand beats permanent reservation.
- The score "84" competed with the match "92"; two cobalt CTAs were visible simultaneously; the roles list duplicated what the graph already showed.

**Replacement:** one 272px rail that holds the routes list *and* becomes the detail surface on demand (`.rail.dmode` swaps `#railRoles` → `#railDetail`, 260ms). An overlay panel sliding over the graph was built and rejected — covering the instrument to describe the instrument is a contradiction.

### Copy discipline

The candidate landing is where every voice-discipline rule from `01-style-direction.md` gets tested. Every sentence on this page has to earn its place. When in doubt, delete.

### Personalization signals

Even on the default candidate landing, we can personalize with light signals if the user arrived from a specific source:

- **From r/Architects link** → h1 subline nods to Reddit ("Built after 15 years in architecture. Free to use.")
- **From Novatr/ThinkParametric partner** → banner acknowledging the partnership
- **From preloaded route page** → the state is preserved on return

These are V1 touches. V0 ships without them.

## Employer landing (V0 minimal, V1 fully-built)

### V0 approach

There is no dedicated employer landing in V0. The "For employers" CTA in the nav links to a **contact form** — a simple page with:

- A paragraph explaining that PivotHop matches employers with adjacent-talent candidates through Carlos's personal review
- A form: name, company, role hiring for, brief description
- Carlos's direct email
- No pricing displayed (concierge pricing needs conversation)

This is enough for V0 because employer volume is intentionally low — one relationship in the first 60-90 days is the target, not scale.

### V1 approach (post-validation)

Once V0 proves employer demand exists, build `pivothop.com/employers`:

- **Hero** — different h1, employer-facing prose. Something like: "Adjacent talent, hand-matched. For roles no one on your shortlist can fill."
- **The problem** — you're looking at the same 50 candidates every other company sees. You're paying premium for the shortlist. Meanwhile there are people 6 months of training away from being your best hire.
- **The mechanic** — how Carlos personally matches: skill-overlap analysis + editorial context + warm intro
- **Case studies** — 2-3 real placements with quotes from the employer side (impossible in V0, essential in V1)
- **How pricing works** — clarified once real transactions produce real numbers
- **Booking CTA** — 30-minute intro call, Cal.com or similar
- **FAQ** — the standard set (how is this different from LinkedIn Recruiter, what's your candidate pool, how do you charge)

### Employer landing does NOT do

- Try to recruit employers with growth-hacker copy
- Promise scale or volume
- Compete on price
- Position PivotHop as a resume database with a search bar
- Include stock photos of diverse teams high-fiving

## Preloaded state pages (state-driven SEO)

### The concept

Each preloaded page is a saved state of the instrument for a specific route. Not a landing page in the marketing sense — a **result page for a specific query**. Someone Googles "how to pivot from architecture to product design," lands on `/routes/architect-to-product-designer`, and sees the full career graph with that destination already in click-focus — its route lit, the path back to the origin visible, all data populated in the rail, and editorial context specific to that pivot.

This is fundamentally different from doorway-page programmatic SEO. See `05-preloaded-states.md` and §11 of the Notion bible for the strategic reasoning.

### V0 target: 20-30 pages

The 20-30 routes should be chosen based on:
- Verified search volume (Ahrefs, Semrush, or free tools like Ubersuggest to check)
- Realistic transitions per the scrape's skill-overlap data
- Diversity of destination fields (design, tech, planning, business)

Baseline set to research and validate:

1. Architect → Product Designer
2. Architect → UX Designer / UX Researcher
3. Architect → Computational Designer
4. Architect → BIM Manager
5. Architect → Urban Planner
6. Architect → Interior Designer
7. Architect → Landscape Architect
8. Architect → Construction Manager
9. Architect → Real Estate Developer
10. Architect → Technical Artist (games)
11. Architect → 3D Modeler
12. Architect → Visualization Artist
13. Architect → Product Manager
14. Architect → Design Systems Lead
15. Architect → Data Visualization Designer
16. Architect → Building Performance Analyst
17. Architect → Sustainability Consultant
18. Architect → Building Envelope Consultant
19. Architect → Digital Twin Specialist
20. Architect → Facilities Manager
21. Architect → Property Development
22. Architect → Set Designer / Production Designer
23. Architect → Exhibit Designer
24. Architect → Furniture Designer
25. Architect → Signage / Wayfinding Designer
26. Architect → Instructor / Educator
27. Architect → Editorial / Architecture Writer
28. Architect → Podcast / Media Producer
29. Architect → Software Engineer (frontend/design-tech)
30. Architect → Independent Consultant

Track which pages get traffic, which convert to email captures, which convert to nothing. Kill the underperformers after 6 months of data. Expand around the winners. **Don't build every combination — build the ones that earn their place.**

### Ranking dependencies

Each preloaded page's Google ranking depends on:
- Original per-page data (the scrape's numbers for this route)
- Editorial paragraph (Carlos's judgment layer)
- Internal linking from related routes and pillar articles
- Author schema pointing to Carlos's about page
- Being genuinely useful — the reader either exports the report or clicks a related route

If a page has none of these signals, it's a doorway page and Google will nuke it. This is not "programmatic SEO in the 2020 sense." This is state-driven SEO in the 2026 sense. Every page must be defensible on its own.

## Return visits and continuity

V0 has no user accounts. This means return visits start fresh unless:

- The user bookmarked a specific route page → they land back on that state
- The user was emailed the PDF report → they can share/reference it offline
- The user clicked back from a preloaded state → we can preserve URL params

V1 might add optional saved-routes functionality if enough returning users signal demand for it.

## The route from every surface to email capture

The core conversion the site optimizes for is **email capture via the report export**. Every surface should have a plausible path to that action:

- Homepage → search bar → graph unfolds → node click → rail detail → export
- Preloaded route page → graph already focused on the route → export
- About page → CTA to try the instrument → export
- Blog post → embedded route example → export
- Reddit comment → route page URL → export

There is no other conversion goal in V0. Everything routes toward the email capture, because the email is where the concierge follow-up happens.

## Mobile

V0 works on mobile but is optimized for desktop. The instrument band is a desktop-first surface — a wide graph with a rail beside it. On mobile the search unsticks, the calc/search fields stack, the rail collapses to a horizontal row above the stage, and the stage drops to `64vh / min 420px`. It works; it doesn't sing.

**Known mobile gap:** the graph doesn't shrink as gracefully as the radar did — at narrow widths kid labels crowd. If mobile becomes a priority, the fix is a mobile-specific viewBox plus a label-hiding rule below a width threshold, not a redesign.

This is an intentional bet: architects making career decisions do it on a laptop, not their phone. The mobile experience is a courtesy for people who arrive via mobile from Reddit or social — they should be able to *use* the tool, but the primary experience is desktop. Don't spend V0 hours polishing mobile past "it works cleanly."

## What the landing must never do

- Ask visitors to sign up before showing the tool
- Autoplay video
- Show a chatbot bubble
- Trigger an email popup after 5 seconds
- Have exit-intent modals
- Use dark patterns of any kind ("Are you sure you want to leave without saving your progress?")
- Show anything on the page that isn't real (fake user counts, fake testimonials, fake social proof)

Every one of these is a rejection of the category we're rejecting. Doing them once burns the brand.
