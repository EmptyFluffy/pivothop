# PivotHop — Style Direction

*The visual and verbal system. Applies to the site, PDFs, emails, social posts, and any future surface. FairElephant follows the same system with a different accent color.*

*Reference implementations (both current, both built and verified): `pivothop-swiss.html`, `fairelephant.html`. When this document and those files disagree, the files win — they are the source of truth for exact values.*

---

## Design philosophy

**Instrument, not app.** The visual language is a measuring tool, not a consumer product. Reference points: Swiss modernist print design (Vignelli, Müller-Brockmann), Bloomberg Terminal, patent drawings, Braun product manuals, Otl Aicher's Munich '72 pictogram system. Not: SaaS marketing sites, gradient hero backgrounds, illustrations of diverse people high-fiving, motivational posters.

**Print-referenced.** Everything should feel like it could be printed and read as a document — ink hairlines, grid subdivisions, editorial typography, generous but functional white space. The web is the delivery mechanism; the underlying feel is bound reference material.

**Structural honesty.** Lines separate real content divisions. Weight and color signal actual hierarchy. Nothing decorative, nothing added because it "looks nice." If a visual element doesn't earn its place by clarifying meaning, delete it.

**The instrument is the hero.** The graph is the product. It is not a supporting illustration inside a marketing page — it is the thing the page exists to deliver, and it gets the width, the height, and the position to say so. Everything above it exists to seed it; everything below it exists to explain it.

---

## The four laws

These four rules do more work than the rest of this document. When a new surface is designed, check it against these before anything else.

**1. Scale contrast, not decoration.** Power comes from the gap between the largest and smallest type on the page, not from ornament. One enormous statement, then quiet text. A page where everything is 14–18px reads as bland no matter how good the details are.

**2. The accent belongs to the data.** Cobalt (PivotHop) / oxblood (FairElephant) is permitted in exactly three places: **the data itself** (graph edges and nodes, score bars, lens dots, deltas, match numerals), **one primary action per viewport**, and **the manifesto block**. Nothing else. When the accent appears twelve times per screen it stops being an accent and becomes texture — that is what "noisy" means.

**3. Space organizes, not boxes.** Enclosure is binary; whitespace is proportional. Default to no border. Hairlines are permitted as full-width horizontal section rules and as a few structural verticals in the instrument band. A box around a small module is almost always the wrong answer.

**4. Flush left.** No centered text blocks anywhere. Centering is the one alignment Swiss style rejects, and a centered paragraph in a flush-left system reads instantly as generic startup copy.

---

## Typography

**Two typefaces. Not three.** Archivo has been removed — it and Space Grotesk were doing the same job.

**Instrument Sans** (400/500/600/700) — everything set as language. Headlines, prose, UI, buttons, role names in the graph, the wordmark, the graph's center anchor.

*Adopted 2026-07-31, replacing Space Grotesk in the same slot. Rodrigo Fuenzalida's face for the Instrument agency, and the closest free relative to ABC Diatype, which is what Creative Boom runs (docs/29). It is variable across weight **and width**, which is the operative argument: the hero clamps 46→104px, and type sized right at 46 is a touch wide at 104. Space Grotesk cannot do that. The count is unchanged — two faces, not three.*

*One coupling to know about: graph label widths are computed from character counts rather than measured (non-negotiable #1), via a `GLYPH_W` ratio in `instrument.js` that stands in for the average glyph advance. It is **per-font** — 0.6 for Space Grotesk — and re-measured whenever the sans changes. Getting it wrong does not look like a font bug; it looks like labels crossing wires, because label width is what the edge repulsion keeps text clear of.*

**Space Mono** (400/700) — everything set as data or machine annotation. Eyebrows, labels, match percentages, metadata rows, crumbs, stat captions, source lines, section captions. This is the instrument voice. When something needs to read as *a machine reported this*, it is Space Mono uppercase with wide letter-spacing.

The split is semantic, not decorative: **Grotesk = words, Mono = measurements.**

### Type scale (web)

| Role | Value |
|---|---|
| Hero h1 | `clamp(46px, 7vw, 104px)`, weight 500, line-height .98, letter-spacing −.035em, `max-width: 12ch` |
| Hero h1 emphasis span | weight 700 |
| Manifesto h3 | `clamp(38px, 5.4vw, 72px)`, weight 500, line-height 1.02, letter-spacing −.03em, `max-width: 20ch` |
| Section h2 | `clamp(30px, 3.8vw, 48px)`, weight 600, letter-spacing −.025em |
| Capture h3 | `clamp(28px, 3.4vw, 44px)`, weight 600, letter-spacing −.025em |
| Method numerals | 64–76px, weight 700, letter-spacing −.04em, color `--ink` |
| Big data numerals | 38–64px, weight 700, letter-spacing −.03/−.04em, `font-variant-numeric: tabular-nums` |
| Detail title | 20px, weight 600 |
| Body | 15–16px, weight 400, line-height 1.5–1.6 |
| Small body | 13.5px |
| Mono labels | 9.5–11px, letter-spacing .14–.22em, uppercase |

**Hero sizing is a ratio, not a number (2026-07-30).** Because `max-width` is in `ch` and `ch` scales with font-size, the headline's share of the viewport is *constant* below the clamp ceiling: `12ch` ≈ `12 × 0.55 × <vw>`. The original `9.4vw` therefore occupied ~62vw at every width, which read as shouting. `7vw` lands near 46vw — still the largest thing on the page by a wide margin, but under half the screen. If the hero is ever resized again, solve for the ratio, not for a pixel value.

**The `max-width` in ch on headlines is load-bearing.** It's what forces the hero onto two lines and gives the statement its shape. Do not remove it and let the line run.

### Headline register

Hero headlines are **three words and a period**. Declarative, deadpan, no verb-object marketing construction.

- PivotHop: **"Career moves, measured."**
- FairElephant: **"Fair pay, computed."**

The period is load-bearing. The parallel construction across the two products is deliberate — it is what makes them read as one house.

---

## Color

**Paper tones (backgrounds)**
- `--paper: #f5f3ed` — main content background
- `--card: #faf9f5` — the instrument band, the search bar
- `--paper-2: #eae7df` — active/pressed states, subtle tinting

**Ink tones (text)**
- `--ink: #15151a` — primary text, headlines, method numerals, second-hop graph nodes
- `--ink-2: #56565e` — secondary text, prose body
- `--ink-3: #8a8a93` — tertiary text, labels, captions

**Rules (dividers)**
- `--rule: #d5cfbf` — hairline dividers, graph leader lines
- `--rule-2: #b8b0a0` — heavier dividers, graph cross-links

**Accent — PivotHop**
- `--accent: #2b3cf5` — cobalt
- `--accent-press: #1f2fd8`
- `--accent-tint: #e7e9ff` — "skills you have" tags only

**Accent — FairElephant**
- `--accent: #8a2f1e` — oxblood
- `--accent-press: #6e2416`
- `--accent-tint: #f4e3dd`

**Structural**
- `--black: #0c0c14` — the "For employers" nav cell. This is the only black element on the page.

**Never used:** pure white (`#ffffff`), pure black (`#000000`), any color not in this palette.

### Accent discipline

See Law 2. Concretely, the accent is permitted on:

- Graph: primary edges, bridge edges, first-hop nodes, the "match" line in labels *(PivotHop)*
- Lens dots, score bar, deltas, "On" flags *(FairElephant)*
- Exactly one CTA per viewport
- The manifesto block (full-bleed field, white type)
- The hero eyebrow
- Hover state on the capture button

It is **not** permitted on: match percentages in the graph (those are `--ink-3`), crumbs, tags other than `.have`, second-hop nodes, body links, section captions.

### Contrast is a constraint, not a preference

FairElephant's original orange `#f24d1e` was replaced because it fails WCAG AA against white (3.6:1) — the manifesto block is white type on a full-bleed accent field, so the accent must be dark enough to carry it. Oxblood `#8a2f1e` measures 8.4:1. **Any future accent must clear 4.5:1 against white.** Verify before committing, not after.

---

## Ink hierarchy

Three tiers of border weight signal three different roles:

1. **1px ink (`--ink`)** — structural section boundaries and the instrument frame. The nav's bottom edge, the search bar's top and bottom edges, the band's bottom edge, section separators, the capture input's underline. These say *a real division happens here*.
2. **0.5px rule (`--rule`)** — interior organization. The band head, the rail's right edge, data-row separators, method-row separators, the shell's left/right rails. These say *organized here*.
3. **Sub-pixel SVG strokes (0.3–1.4px)** — graph geometry. Edges, leader lines. These say *measured here*.

The reading experience: **1px ink means a division, 0.5px rule means organization, sub-pixel means data.**

Border count is a design metric. If a new module needs a box, the first question is whether space would do the job instead.

---

## Layout and grid

**The shell.** `max-width: 1280px`, centered, with 0.5px rule rails left and right. Content is never full-viewport — the rails are what make it a plate rather than a webpage.

**Section padding.** ~96–110px vertical for editorial sections, 30px horizontal. Generous is correct; the previous design's cramped padding was half the "bland" problem.

**Nav.** 60px tall, `grid-template-columns: 250px repeat(4, 1fr) 250px`, 1px ink bottom border, `position: sticky; top: 0`.

**The instrument band.** `grid-template-columns: 272px 1fr` — the rail and the stage. The rail carries the routes list *and* the on-demand detail (see below). The stage is `height: clamp(480px, 70vh, 740px)`.

**Full-bleed lines within panels.** Horizontal hairlines extend to the panel's border, not just under text. Every horizontal element terminates on a vertical border. Nothing floats.

### The sticky instrument pattern

The search bar and the results band are wrapped in a single `.instr` container. The search gets `position: sticky; top: 59px`.

This produces the intended behavior with no JavaScript: the search sticks under the nav while you are inside the instrument, and releases the moment you scroll past it. CSS sticky is bounded by its parent — that is the whole mechanism.

**The 59px is deliberate, not a rounding error.** The nav's border-bottom occupies pixel row 59–60. Sticking the search at `top: 59px` puts its border-top on the *same* pixel row, so the two 1px ink borders collapse into one visible hairline. At `top: 60px` you get a double line.

**The search is full-bleed.** Same width as the nav, no side padding, no floating. Its bottom border *is* the band's top edge. The input row reads as the top face of the instrument it operates.

---

## The graph

Full technical spec in `13-graph-spec.md`. The design rules:

**The center is typography, not a shape.** The origin role is set as a wordmark — Space Grotesk 15px / weight 700 / letter-spacing 1.8 / `--ink` — with an invisible paper-colored knockout rect behind it so edges terminating at center don't run through the letters. No pill, no frame, no fill. It matches the nav wordmark's recipe exactly, so the site's brand mark and the instrument's anchor speak in the same voice.

**Two-tone semantics.** Cobalt is the *routes* (first-hop nodes, primary edges, bridge edges). Ink is the *destinations beyond them* (second-hop nodes, 2.8px filled dots). Warm rule tone is *context* (cross-links, leader lines). Match percentages are `--ink-3`, not accent — the geometry carries the color, the numbers stay quiet.

**One dash style in the whole drawing.** Bridge edges are dashed `2 3`. Cross-links are solid warm hairlines. Everything else is solid. Two dash styles read as noise.

**Node weight encodes match.** First-hop radius = `3 + match/24`. Nothing arbitrary.

**Labels never touch anything.** Enforced by physics, not by hope. See `13-graph-spec.md`.

**The graph auto-fits its own frame.** After settling, the viewBox is computed from the actual content bounding box (nodes + label boxes + 22px padding). A fixed viewBox guarantees dead margin, because force-directed layouts settle into ellipses and containers are rectangles.

---

## Iconography

**Two icon families coexist deliberately:**

1. **Thin-line geometric** — for actions and states. Stroke 1.4–2.6px, square caps by default, round caps for softer moments. All arrows in this family. The undo icon.
2. **Pixel-grid Susan-Kare-heritage** — for identity moments. The rabbit mark. The "For employers" team-grid glyph. Drawn on integer grids with `shape-rendering="crispEdges"`. Reference: original Macintosh System 1 icons, Otto Neurath's ISOTYPE, Pixelarticons.

The tension is intentional — thin-line for the working surface, pixel-grid for brand moments. Do not mix them within a single element.

**Icons are not decoration.** The method section previously had a line icon per step; they were deleted. Numbered rows with oversized ink numerals do the job better. If an icon is only there to fill space, it is not an icon, it is clutter.

---

## The rabbit mark

The PivotHop logo is a filled rabbit head + ear + body silhouette with a small triangular tail. The rabbit's eye is a small circular knockout. Used at 28–30px in the nav and footer. Flush left of a `PIVOTHOP` wordmark in Space Grotesk 700, letter-spacing .12em, uppercase.

The rabbit is a considered choice: quick, small, willing to make sudden lateral moves that look impossible from above. Never explain the rabbit in copy. If it lands, it lands.

---

## Motion

**Sparingly, and only on the instrument.** Editorial sections do not animate.

**The architecture that makes it possible:** the graph's SVG is built once and never rebuilt. State changes call `setAttribute` on persistent elements, and CSS transitions ease between values automatically. This is why the motion is smooth — rebuilding `innerHTML` on every hover kills transitions and thrashes layout.

**What transitions:**
```css
.edge                    { transition: stroke-opacity 260ms ease-out; }
.node-first, .node-kid   { transition: opacity 220ms ease-out,
                                       r 320ms cubic-bezier(.34,.68,.4,1); }
.label-grp               { transition: opacity 240ms ease-out; }
```

**What does not transition:** positional attributes (`cx`, `cy`, `x`, `y`, line endpoints). Those are physics-driven and must be instant. A transition on position produces rubber-band lag and destroys the tactile feel of dragging.

The `cubic-bezier(.34,.68,.4,1)` on radius is a mild overshoot — nodes scaling up on hover slightly overshoot and settle. Opacity uses plain `ease-out`; opacity overshoot looks wrong.

**The unfold.** On page load *and* on every "Run the graph," the network collapses to the center wordmark and physically unfolds outward, labels fading in once settled. This is the one piece of theatrical motion in the system, and it earns its place by making the causal relationship literal: **the search generates the instrument.**

**Standard transitions elsewhere:** .15s hover, .18–.2s state changes, .26s view swaps.

**Prohibited:** parallax, scroll-triggered content reveals, autoplay (except the export modal carousel, which pauses on hover), loading spinners, Ken Burns, and any motion that ignores `prefers-reduced-motion`.

---

## Interaction patterns

**Detail on demand, in place.** When a node is clicked, the rail's routes list swaps to the detail view. It does **not** slide a panel over the graph. Covering the instrument to describe the instrument is a contradiction; an overlay panel was built, reviewed, and rejected for exactly this reason.

The swap: `.rail.dmode` hides `#railRoles`, shows `#railDetail`, 260ms rise-and-fade both directions. Exits: the "← All routes" button, background click, same-node click, or undo.

**Scroll landings never overshoot.** A CTA that scrolls must compute its target:

```js
target = bandAbsoluteY - (navH + searchH - 1)   // -1: the shared border row
if (Math.abs(window.scrollY - target) > 2) window.scrollTo({top: target, behavior: 'smooth'})
```

The band's top edge lands flush with the sticky search's bottom edge. Clicking from a resting position is a no-op. `scrollIntoView` is wrong here — it puts the target at y=0, underneath the sticky stack.

**Click vs. drag.** 5px threshold, tracked squared (`dx*dx + dy*dy > 25`) to avoid a sqrt in mousemove. Under = click (toggle focus). Over = drag (physics).

---

## Voice — verbal identity

**The instrument speaks like a working person, not a marketing person.**

Rules:
- No exclamation points
- No motivational vocabulary: "unlock," "supercharge," "empower," "journey," "growth mindset," "revolutionize," "level up," "elevate," "step into," "unleash"
- No abstract virtue-signaling: "we believe," "we're passionate," "we're on a mission to"
- No em-dash abuse. Sparingly and intentionally
- **No inline bolding mid-sentence.** Emphasis comes from placement and scale, not decoration. Bolding three words inside a paragraph reads as anxious.
- Deadpan register. If a sentence could appear on any other career-tech landing page, delete it
- Numbers over adjectives. "Four routes" beats "many possibilities." "$95K–$140K" beats "competitive salary."
- Labels earn their place. "Your pivot score," "How to read it," "Roles on your radar," "Most in-demand skills for your next move" — most section labels are deletable because the content is self-evident. Cut first, restore only if something breaks.

### Register examples

*Wrong:* "Unlock your career potential with AI-powered insights that reveal exciting new opportunities."
*Right:* "Reads live job postings. Returns four routes worth taking. No pep talks."

*Wrong:* "We're on a mission to democratize career navigation."
*Right:* "Most career tools optimize for volume. This one optimizes for fit."

*Wrong:* "Discover your dream role with our revolutionary matching technology."
*Right:* "The four adjacent roles most reachable from your current skills, with the salary and the gap for each."

### Current copy (both products, shipped)

| Surface | PivotHop | FairElephant |
|---|---|---|
| Eyebrow | The career instrument | The compensation instrument |
| Hero | Career moves, measured. | Fair pay, computed. |
| CTA | Run the graph | Run the numbers |
| Section 3 | Method | Method |
| Manifesto | Four applications that matter beat four hundred that don't. | The number is identical. The answer isn't. |
| Manifesto close | No spray. No pray. | No black box. No vibes. |
| Capture | Take the graph with you. | Take the numbers with you. |
| Footer tagline | Career decisions, measured. | Fair pay, computed. |

The footer tagline closing the loop with the hero is deliberate on both.

### Method copy pattern

Numbered row, terse title, one flat sentence. Verb-first titles for the user's actions, noun phrases for the system's.

- *State your position* / Role, years, and the skills you already hold.
- *The model reads the market* / Live postings, scored against your profile.
- *Read the graph* / Every route worth taking, with the gap attached.
- *Make the move* / A step-by-step plan, exported as one PDF.

**Punctuation:**
- Sentence case for UI, headings, buttons. Not Title Case.
- Uppercase for eyebrows, mono labels, category markers.
- Middle dot (·) as a separator in tight metadata rows.

**The signature line:** "Just the numbers." Once per major surface, maximum.

### Acronyms and the glossary — the first-mention rule

We assume the reader knows their own field, not ours. So every acronym, credential, and dataset name is spelled out the first time it appears on a page, and the acronym itself links to its glossary entry. This is not optional. A reader who hits "OEWS" or "FF&E" cold and gets no expansion and no link is a reader we lost.

The pattern, everywhere prose is rendered:

```jsx
<a className="gl" href="/glossary#oews">OEWS</a> (Occupational Employment and Wage Statistics)
```

The linked short form, then the spelled-out form in parentheses. The glossary is the single source of truth: every term there has an `id`, and that `id` is the anchor. If a term is not in `apps/web/src/app/glossary/glossary-data.ts`, add it there first, then link it.

Rules that keep it consistent:

- **First mention is per rendered page, not per file.** On the generated salary and route pages, the template introduces the shared data acronyms (OEWS, BLS, SOC, CPS) in the facts strip and method note, which render *above* the editorial. So those are linked once, in the template. A per-occupation or per-route editorial links only the profession acronyms it introduces (PE, MEP, CFA, PMP, ADDIE, APRN, and so on) — it does not re-link OEWS, because the template already did, higher up the page.
- **One link per acronym per page.** The first occurrence carries the link and the expansion. Later occurrences on the same page are bare text. Re-linking every instance is noise.
- **Plain-text strings cannot carry a link.** FAQ answers are string values, not JSX, so they render as text. There, spell the acronym out in prose instead of linking it.
- **The expansion is lowercase unless it is a proper noun.** "(certified public accountant)" but "(the Federal Aviation Administration)". Pull the exact wording from the glossary entry's `full` field and adjust the case to read as a sentence.

Applies to blog posts, salary pages, route pages, and any new surface. When you add a page or a post, the acceptance check is: no acronym renders without its first-mention expansion and link.

### Bold, in body prose

The no-inline-bolding law above governs *emphasis*. It does not forbid bold as a *structural label*. In the route and blog editorials, `<strong>` marks the thing being named — a destination role, a specific skill, the "Concrete first step:" lead-in — not an ordinary word we want to shout. One or two per paragraph, on nouns that are the subject of the sentence. If the bolded phrase is an adjective or a verb, it is emphasis, and it comes out.

### Route editorials — the shape

The judgment-call block under each route graph is prose, and prose breathes in paragraphs. One wall of text is a draft, not a finished block. Break each editorial into three or four short paragraphs along its natural seams: the claim, what actually changes, where the gap really is, and the concrete first step. Bold the destination role and the named skills on first use per the rule above. Link every profession acronym on first mention. Same voice as everywhere else: deadpan, numbers over adjectives, no em dashes.

### Headlines — the no-colon law

*Added 2026-07-30, after an audit found 20 of 41 blog headlines carrying the same construction.*

**The headline is a newsroom headline, not a paper title.** The failure mode is specific and it is punctuation, not vocabulary:

> ~~The gravity wells**: the careers the most skill sets can reach, and what they share**~~
> ~~Licensed exits**: 18 percent of good career routes have a legal gate**~~

`Label: explanation` is the academic convention — *"Title: A Study of X Among Y."* Journals use it constantly, newsrooms sparingly. It is why headlines written this way read like research papers, and this is a business.

The rules:

1. **Cut the clause that explains.** Every post already carries a `dek` of 300–400 characters doing the full explanation, so a subtitle is the third telling of the same thing. The colon survives only when the second half *turns* rather than explains — "Product manager vs project manager: 24% the same job" earns it, because the number contradicts the setup.
2. **Do not close the gap you just opened.** Curiosity is the space between what the reader knows and what they want to know. A headline that answers itself has nothing left to click for.
3. **Lead with the number when the number is the story.** "42,254 job titles now map to no job at all" beats "Job titles, deprecated: 42,254 title strings now map to no job at all."
4. **40–60 characters.** Search truncates near 600px; social truncates earlier. Long headlines are not penalised in ranking — Google indexes every word — so length is a click-through matter, which is exactly why it is a business matter.
5. **Rewrite by deleting.** If a headline is fixed by *adding* words, the diagnosis was wrong. Every rewrite in the 2026-07-30 pass was a deletion or a re-ordering; none added an adjective.
6. **The register does not change.** Not clickbait — no hype, no second person imperative, no "you won't believe." The model is *The Economist* and Bloomberg: short, dry, frequently a sharp turn, never breathless. A site whose whole claim is measurement cannot sell with adjectives.

Headlines that were already right, kept untouched as the reference set: *"Pink Floyd were architecture students, and it shows"*, *"The giants disagree about where you should sit"*, *"Where nurses actually go when they leave the bedside"*, *"What 1,090 job postings say architects actually do"*.

### Page titles — the brand suffix

`— PivotHop` does not go in the `<title>` of a templated page (`/compare`, `/salary`, `/routes`, `/jobs`, `/blog` posts). It sits at the end, where it is truncated first, and search already prints the domain above the title. Split-test data: a brand suffix lifts click-through up to 30% for a **recognised** brand and is negligible-to-negative for an unknown one. It stays on the hand-written pages — home, `/about`, `/employers`, section indexes — where length is not a constraint and ownership is the point.

Keywords go at the front. Boilerplate is the only thing that may be cut to hit length; never a keyword, since Google indexes the whole title regardless of what it displays.

---

## Photography and imagery

**Preferred:** none. The identity is entirely typographic and vectorial. Every stock photo of a diverse team high-fiving is another entry in the category we're rejecting.

**Acceptable exceptions:**
- Carlos's own portrait on the about page (a real photo with texture — not a stylized illustration, not a corporate headshot)
- Diagrams and data visualizations built from the design system
- Screenshots of the instrument itself

**Never:** stock photos, gradient meshes, 3D-rendered abstract shapes, AI-generated imagery, "startup Instagram" illustration.

---

## PDF and email surfaces

The route report PDF and transactional emails are visually continuous with the site. Same two typefaces, same palette, same voice. A PDF reads as a printed excerpt of the instrument the user just used — not a separate marketing brochure.

Email subject lines follow the same voice discipline. No "🎉", no "Big news!", no "You won't believe…".

---

## FairElephant relationship

**Identical system, one variable.** Same typefaces, same scale, same grid, same nav, same sticky-instrument pattern, same manifesto block, same voice. The differences:

| | PivotHop | FairElephant |
|---|---|---|
| Accent | cobalt `#2b3cf5` | oxblood `#8a2f1e` |
| Mark | rabbit | elephant |
| Instrument | force-directed career graph | seven-lens compensation calculator |
| Domain | career transition | remote compensation |

Cool for careers, warm for compensation. Anyone landing on either site should know within a second that they're in the same house. When they appear together (nav references, footer, ecosystem callouts), they read as sibling instruments in one system.

---

## Ratified amendments (2026-07, built and verified in apps/web)

These decisions were made against rendered mockups and the running app; they override the corresponding values above. The reference HTML files still carry the original cobalt — when porting, apply these amendments on top.

**Accent — Klein ultramarine replaces electric cobalt.**
- `--accent: #002FA6` (Yves Klein ultramarine — an artist's blue, not an app blue)
- `--accent-press: #001f7a` · `--accent-tint: #e3e8f7`
- Contrast on white: 10.7:1 (manifesto rule ≥4.5:1 passes with room). The old `#2b3cf5` read "shiny tech"; a muted periwinkle candidate read "social-media navy" — both rejected against renders.
- The graph's kid-edge tint becomes `#4b60c9`.

**The arrow motif — Lucide `arrow-up-right`, everywhere an action or route points outward.**
- Source: lucide.dev (MIT), 24px grid, 2.2px stroke, round caps — consistent with the thin-line icon family.
- Used on: every CTA ("Run the graph ↗", "Send my report ↗", "Export this route ↗"), nav outbound cells, rail route rows, route titles ("Architect ↗ Structural Engineer"). It is the visual verb of the product — a move.
- Never the HTML entity `&nearr;` (renders as a system glyph, off-brand).

**The export sheet — single-job capture over a live document preview.**
- Left half: a full-bleed miniature of the report's actual first page, rendered from the selected route's real data (masthead, route title, readiness bars, 90-day plan, "Page 1 of 6 · N postings read"). The deliverable is the proof. No blur-tease, no autoplay carousel — both violate the no-dark-patterns rule.
- Right half: ONE capture module, vertically centered — mono route context line, "Get the six-page report for this route." (specific number), oversized email field (autofocused, ink underline → accent on focus), full-width accent Send directly beneath, trust line, one quiet mono contents line. Nothing else competes.
- The preview page's layout IS the visual spec for the delivered PDF (Phase 3 renders the same template) — preview and deliverable must match.

**Imagery — halftone pinned, Sistine rejected.**
- Representational/classical imagery (e.g. the Michelangelo hands) is rejected: it's a category cliché and violates "entirely typographic and vectorial."
- The halftone/dot-matrix *technique* is approved in principle (it is a print method) but only applied to our own material (data fields, the marks, the graph) — currently pinned, unused, pending a placement that doesn't read as texture for texture's sake.

**Typefaces — reconfirmed.** The two-face system stays (Instrument Sans + Space Mono since 2026-07-31; Space Grotesk before that). Brutalist character comes from layout, hairlines, arrows, scale, and Mono-as-instrument-voice — not from swapping to a generic neo-grotesque.

**Motion additions (inside `prefers-reduced-motion` gates):** dropdowns settle in at 180ms / 7px on `cubic-bezier(.3,.7,.3,1)`; the export sheet rises 16px with a .985→1 scale settle at 280ms behind a 220ms veil fade. Scroll areas use macOS-style overlay scrollbars (5px, hover-only thumb).

**Creative Boom adoptions (2026-07-30, measured — docs/29 holds the source).**
- **The fade-in underline.** Editorial links render their underline permanently (`2px` thickness, `2px` offset) with `text-decoration-color: transparent`; hover animates only the colour. Nothing reflows, so it fades rather than snaps — that is the entire contemporary feel. Applied to `.gl`, post bodies, deks. Deliberately NOT applied to nav, chips, or data surfaces: if everything clickable underlines, the page twitches.
- **Hero emphasis underlines.** The `.em` word in the hero carries a scaled underline (`.055em` thickness, `.11em` offset, `skip-ink: none`) in currentColor — em units so it survives the clamp from 60px to 132px. The accent stays on the data (#6 untouched).
- **Nav in the wordmark face.** `.navlink` moved from the mono to the sans at 600/12px/.07em tracking. The mono read as a caption strip; the bar now speaks with the logotype's voice. The mono remains the measurement voice everywhere else.
- **Touchpoints are pills; structure stays sharp.** Chips and toggles (`.jb-chip`, `.jb-toggle`, `.jb-pill`, `.ejf-chip`, `.ew-chip`, `.jd-skill`) take `--r-pill`. Cards, panels, rules, and every structural container remain square. Measured from their CSS: radius is mostly `0`, `rounded-full` reserved for touchpoints — the same rule we had reasoned our way to.
- **One motion token pair.** `--dur: .15s`, `--ease: cubic-bezier(.4,0,.2,1)`, replacing per-rule ad-hoc timings as surfaces get touched. Their whole system is one duration and one curve; ours was already within noise, so this is consolidation, not correction.
- **Washes noted, not shipped.** Their accents each exist twice — saturated for marks, ~3% saturation as background washes — and the friendliness is mostly the washes. A wash is paper, not accent, so #6 permits it. Designed direction: a small paper set (Klein wash `--accent-tint`, one warm, one cool) that long pages alternate between. Ship deliberately, not by drift.
