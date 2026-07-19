# PivotHop — FairElephant Integration

*How the two products relate, what they share, what stays distinct, and what the integration means in V0 vs. V1.*

---

## What FairElephant is

FairElephant is the companion instrument to PivotHop. It answers a different question, in the same voice, using the same design system:

**PivotHop asks:** what can I become?
**FairElephant asks:** what should I be paid?

FairElephant analyzes remote compensation across geographies, cost of living, and role families to help people (both employees and employers) understand whether a specific salary is fair for a specific person in a specific location. Same instrument philosophy, different domain.

## Shared attributes

Both products share:

- **Design system:** Space Grotesk + Space Mono (two faces only). Paper tones + ink tones + rules. The 1280px shell with rule rails. The sticky-instrument pattern. The plate visual metaphor — ink frames divisions, rules organize, sub-pixel strokes render data.
- **Voice discipline:** deadpan, editorial, print-referenced, no motivational vocabulary.
- **Founder:** Carlos. Same about-page biography carries E-E-A-T for both.
- **Business model philosophy:** free tool for individuals, revenue from the professional side (concierge introductions for PivotHop, insights/reports/API for FairElephant).
- **Anti-category positioning:** both reject the norms of their category (career-tech's motivational hype for PivotHop, HR-tech's compensation gatekeeping for FairElephant).

## Distinctions

- **Accent color:** PivotHop cobalt (`#2b3cf5`), FairElephant oxblood (`#8a2f1e`). Same role in the palette, different hue. Cool for careers, warm for compensation.
  - *Changed from orange `#f24d1e`.* Two reasons: it read as flashy against the serious register, and it fails WCAG AA against white (3.6:1) — which matters because the manifesto block is white type on a full-bleed accent field. Oxblood measures 8.4:1. **Any future accent must clear 4.5:1 against white.**
- **Mark:** rabbit for PivotHop, elephant for FairElephant.
- **Vocabulary:** PivotHop uses "route," "skill overlap," "transition." FairElephant uses "compensation," "fair value," "geographic delta."
- **Data source:** PivotHop scrapes job postings for skill and adjacency data. FairElephant scrapes compensation data from postings + geographic cost data.
- **Primary user intent:** PivotHop is exploratory (I'm considering a change). FairElephant is verificatory (I want to check what's fair).

## V0 integration scope

**Minimal.** In V0, the two products are:

- Two separate domains (pivothop.com and fairelephant.com)
- Two separate codebases (if they share infrastructure, that's implementation detail)
- Two separate landing pages
- Linked via nav ("FairElephant ↗" in PivotHop's nav, "PivotHop ↗" in FairElephant's nav)
- Linked via footer (each site's footer has an "Ecosystem" column referencing the other)
- Not sharing user accounts, email lists, or backend data

The reason to keep V0 integration minimal: each product needs to prove its own market individually before shared infrastructure earns its complexity cost. Coupling them prematurely means a problem in one becomes a problem in both.

## V1 integration scope

**Meaningful but limited.** In V1, after both products have validated their individual markets:

### Cross-referenced data

Route pages on PivotHop include a "check the pay" callout linking to the equivalent FairElephant state — e.g., Architect → Product Designer route page has "See FairElephant's fair salary for Product Designer in [your location]" callout.

FairElephant salary reports include a "check the pivot" callout linking to the equivalent PivotHop state — e.g., Product Designer salary report has "See who else can become a Product Designer" callout.

### Shared newsletter (optional)

One newsletter, "Just the numbers" or similar name, that publishes editorial content from both properties. Frequency: weekly or biweekly. Every issue has one PivotHop-flavored piece (skill/pivot data) and one FairElephant-flavored piece (compensation/geographic data).

Users subscribe once for both properties. Reduces the friction of "another newsletter to subscribe to."

### Shared account (only if there's a user need for it)

Only if V1 introduces functionality that requires it (saved routes, saved salary comparisons, comparison history across both products), add a light-weight shared account. Do not build accounts because it feels professional. Build them only when specific features require them.

## V2 integration scope (speculative)

Post-V1 validation. Not something to plan for now. Possibilities include:

- **A unified "career navigation" report** combining PivotHop's skill route with FairElephant's compensation projection for the specific pivot
- **B2B API** allowing HR-tech companies to license both datasets together
- **A common data infrastructure** (single scraping pipeline serving both products)

None of this matters now. Ship each product's V0 and V1 independently first.

## Cross-brand voice

When one product references the other, the mention should:

- Be brief (a sentence, not a paragraph)
- Not oversell (the sibling product isn't the whole world, just a useful adjacent tool)
- Match the referring product's voice, not switch registers
- Include the correct mark (rabbit or elephant) as a small inline glyph if visual

Example on a PivotHop route page:

> If you want to check what this new role should pay in your location, FairElephant [elephant mark] has the compensation data.

Example on a FairElephant salary page:

> If you're thinking about the pivot rather than just the pay, PivotHop [rabbit mark] maps the career adjacency.

## What NOT to do

- Do NOT force users to sign up for one to use the other
- Do NOT put popup CTAs cross-promoting between the products
- Do NOT include heavy "Powered by [sibling product]" branding
- Do NOT combine analytics or user tracking across the properties without explicit consent
- Do NOT let the sibling reference become an interruption in the primary product's flow

The two products should feel like a family, not a bundle sold together.

## The strategic point of having two products at all

FairElephant exists for four reasons:

1. **It hedges the domain risk.** If the AEC-niche approach to PivotHop doesn't scale as fast as hoped, FairElephant's remote-work audience is a bigger and different pool.
2. **It compounds the design system's investment.** Every design decision, every voice discipline, every technical solution developed for PivotHop applies directly to FairElephant. Two products, one design language, one voice. This is now demonstrated rather than asserted: the Swiss redesign was applied to FairElephant in a single pass, reusing the nav, the sticky-instrument pattern, the type scale, the numbered method rows, the manifesto block, and the scroll-landing math without modification. **Identical system, one variable.**
3. **It doubles the surface area for organic distribution.** Reddit engagement, LinkedIn content, cold outreach — each investment can serve both products.
4. **It builds Carlos's reputation as a builder of instruments, not just one tool.** The founder-practitioner identity becomes more credible when there are two visibly-different tools built in the same voice.

The point is not to build a portfolio of ten products. Two is the right number for one person to actively maintain. Adding a third before both are validated is scope creep, not strategy.

## The integration principle

**Integration follows demand, not ambition.** Each cross-product feature should be added only when users of both products are asking for it explicitly. If PivotHop users never mention wanting FairElephant's data inline, don't build that integration.

Users will tell you which integrations they want. Listen for those signals; ignore the founder's own itch to make everything connected.

---

## Current state (post-redesign)

`fairelephant.html` has been rebuilt on the PivotHop Swiss system. The previous version is preserved as `fairelephant-old.html`.

### What is shared, verbatim

- Two typefaces (Space Grotesk + Space Mono). Archivo dropped from both.
- Full palette except `--accent` / `--accent-press` / `--accent-tint`.
- Nav: 60px, `250px repeat(4,1fr) 250px`, 1px ink bottom, black employers cell.
- **The sticky instrument pattern**: `.instr` wraps the input bar + the results band; the bar is sticky at `top: 59px` (the 1px border-overlap trick), full-bleed, releasing when you scroll past the band.
- **The no-overshoot scroll**: "Run the numbers" lands the results band flush with the sticky bar's bottom; a second click is a no-op. Same math, same `-1`.
- Numbered method rows, oversized ink numerals, no icons.
- Full-bleed manifesto block, white type, flush left.
- Underline capture input, compressed footer, copy band.
- Voice discipline, including the hero construction.

### The parallel copy

| | PivotHop | FairElephant |
|---|---|---|
| Eyebrow | The career instrument | The compensation instrument |
| Hero | Career moves, measured. | Fair pay, computed. |
| CTA | Run the graph | Run the numbers |
| Manifesto | Four applications that matter beat four hundred that don't. | The number is identical. The answer isn't. |
| Close | No spray. No pray. | No black box. No vibes. |
| Capture | Take the graph with you. | Take the numbers with you. |
| Footer tagline | Career decisions, measured. | Fair pay, computed. |

The hero parallel ("X, past-participle.") is what makes them read as one house. Keep it if a third product ever appears.

### What differs, by necessity

- **The instrument.** PivotHop's is a force-directed graph; FairElephant's is the seven-lens comparison. Both are the hero of their page, both sit directly under the input bar, both re-run visibly on CTA click — FairElephant replays the lens dots, which is the analogue of the graph's unfold.
- **The lens view is a live instrument, not a readout.** Each lens renders a p25–p75 band (industry-standard "range penetration" encoding) with a median dot, and the offer is **one continuous draggable line** through all seven rows. Dragging it recomputes everything live: per-lens signed reads (oxblood when the offer sits below that lens's fair line), the fairness score and verdict, the delta vs expected, and the calculator's salary field (two-way sync — typing a salary moves the line). Keyboard: arrows ±$500, shift+arrows ±$5,000, proper `role="slider"` semantics. This is FairElephant's analogue of PivotHop's draggable physics: the "test salary" pattern from comp-industry practice, made tactile.
- **The results band.** PivotHop: rail + stage. FairElephant: three hairline-divided columns (score / expected fair salary / method flags). No boxes; `rcol + rcol` gets a `0.5px` left rule.
- **Accent placement.** FairElephant's oxblood lives on: the hot lens dot and its value, the score bar, the +18% delta, the "On" flags, the eyebrow, the CTA, the manifesto. Same discipline — data plus one action.

- **The atlas.** A third section between the lenses and the method: a world choropleth (real geometry — world-atlas 110m topology decoded and projected through Equal Earth at build time, baked as inline SVG paths, zero runtime dependencies). Three modes: **Local market**, **Remote market**, and **The gap** ((remote − local) / local as %) — the third mode is the product's thesis as a picture. Six-bin paper→oxblood ramp for magnitudes; gap mode uses a neutral grey for ≤0 plus five warm bins. Hover tooltip (local · remote · gap), click-to-pin readout, mode toggle with 260ms fill transitions, `prefers-reduced-motion` respected. Equal-area projection is non-negotiable for choropleths (Mercator distorts exactly the visual channel the map uses). Rings crossing the antimeridian (Russia, Fiji, the Aleutians) are split at ±180° with interpolated crossing latitudes and closed along the projection's curved boundary in 2° steps — skipping this smears Russia across the full canvas. ~61 countries carry demo data; the rest render as "no data yet."

### Known open items

- The employer-side surface does not exist on either product.
- FairElephant's lens rows and the atlas's per-country medians are still hardcoded demo values; both need the same scrape the graph needs.
- Mobile is functional but unpolished on both.
