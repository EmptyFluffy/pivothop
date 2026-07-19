# PivotHop — Project Overview

*Master doc. Read this first. Everything else is downstream of what's here.*

---

## What PivotHop is

An instrument for people who want a map of their career options, not a motivational poster. It reads live job postings, computes how a user's existing skills overlap with real roles in adjacent fields, and returns the four routes worth taking — each with salary bands, skill gaps, and honest transition odds attached.

It is **not**: a resume optimizer, an "AI career coach," a bootcamp funnel, or a networking app. Its destination, however, *is* a job board — a specific kind nobody runs: the **adjacent-talent job board**, where employers explicitly flag roles as open to candidates pivoting in from adjacent fields, and candidates arrive already mapped to those roles by skill overlap. Until that board has liquidity, PivotHop is the instrument that builds its candidate side. The category it occupies today: **career navigation instrument**.

## Who it's for

**The product is for anyone with transferable skills — any profession, globally.** The instrument maps pivots by **skills, not titles**: a nurse, a teacher, a journalist, a mechanical engineer, an accountant, an architect. The taxonomy, the scrape, and the graph are global and profession-agnostic from day one. Any occupation can be the origin; the graph derives that origin's best adjacent routes from the data.

**Launch sequencing (marketing, not product):** the *product* ships global; the *go-to-market* starts where the founder has native credibility — architecture. Reasons this is the first vertical, not the boundary:

1. Carlos has lived the exact pivot (architect → computational designer) — uncopyable launch credibility
2. AEC career-change queries have real search volume and weak SERP competition
3. The AEC education ecosystem (Novatr, ThinkParametric, PAACADEMY, etc.) provides first distribution partnerships

**Expansion verticals** (same product, new marketing fronts, opened as data confidence allows): teachers, nurses, mechanical engineers, journalists, finance analysts, lawyers, mid-level consultants. Each is a content-and-channel campaign on top of the same global instrument — never a separate build.

## The two-sided business

**Free side (candidates):** Full access to the instrument. Graph, routes, reports, everything. The tool is free forever for candidates. This is the acquisition surface.

**Paid side (employers): the adjacent-talent job board.** This is the monetization path — the only one. Employers post roles and flag them **"open to adjacent talent,"** and pay for the posting and for access to skill-matched adjacent candidates. The board's differentiation is structural: every candidate arrives pre-mapped by skill overlap, and every employer on it has already said yes to pivots — the two sides self-select for exactly the transaction general boards can't serve.

**Getting there:** a job board dies without liquidity, so V0 runs the board *manually* — concierge hand-matched introductions where Carlos personally reviews an employer's role and introduces 2-3 skill-matched adjacent candidates. That is not a separate business model; it is the board at n=1, done by hand for validation and price discovery. As candidate volume and employer demand grow, the concierge mechanic becomes self-serve postings with the adjacent-open flag. Nothing on the candidate side is ever paywalled.

## The gate that governs everything

**The scrape.** PivotHop's entire value proposition — the graph, the match percentages, the salary bands, the skill gaps, the "honest odds," the pillar articles' uncopyable data — all depends on scraping live job postings and producing clean, defensible per-role adjacency data across a **global occupation taxonomy** at hobbyist scale — deep for the launch verticals, honest about confidence for the long tail.

Zero of the following work if the scrape isn't producing real data:
- The graph (no real numbers to show)
- The SEO strategy (no proprietary data per page = doorway pages)
- The pillar articles (no uncopyable sentence to write)
- The employer pitch (no adjacency scores to make matches)
- The Reddit data-post launch move (no data to post)

**The scrape is the MVP. Everything else is packaging.**

Nothing in this project should be built past its scrape-dependent function until the scrape produces defensible signals for at least the 8 first-hop architect routes.

## V0 MVP (real scope)

The honest minimum to test whether this business exists:

1. **Scrape working for 8-16 architect-adjacent routes** with skill overlap %, salary band, skill gap list, transition odds
2. **One landing page** (candidates, profession-agnostic — the search bar's "Current role" selects any origin occupation; the demo state seeds Architect)
3. **The instrument working** — the career graph with real data, route selection, export-report modal
4. **An about page** with Carlos's story (E-E-A-T authority signal + biographical hook)
5. **20-30 preloaded state pages** — Architect → each realistic destination, with real graph data per page
6. **One data post published to r/Architects** (the §6 launch move) with the scrape's first real chart
7. **Email capture + one confirmation email** with the PDF report (real send, not stub)
8. **One concierge employer pilot** — a single real relationship (through Predock/AVARQ network) willing to accept a hand-matched introduction
9. **Legal/privacy pages** — GDPR-compliant consent language, privacy policy, terms

Success criteria per surface documented in `success-criteria.md`.

## V1 (post-V0-validation)

Only after V0 hits its success gates:

- FairElephant integration (product-level, not just navigation)
- Full 30-blog-post pillar content plan
- Employer-side dedicated landing at `/employers`
- Automated employer matching (post-concierge validation)
- Second niche expansion (teachers, engineers, etc.)
- LinkedIn organic + cold email campaigns at scale
- Paid Reddit ads
- Own newsletter

## What's explicitly NOT in V0 (with rationale)

- **Interstitial "are you a candidate or employer" segmentation** — adds friction to dominant flow to save one click for the minority. Employers self-segment via `/employers` URL promoted through cold outreach.
- **30 blog posts** — 3-4 good posts + one pillar article outperforms 30 mediocre posts (per §11 SEO strategy). Ship pillar first, expand once it ranks.
- **Marketing across 4 channels** — Reddit + educator partnerships in the launch vertical (AEC first; each vertical gets its own instantiation of the same playbook) are Tier 1. LinkedIn organic (Carlos-as-founder) is Tier 1 low-effort. Everything else waits for V1.
- **X/Twitter campaigns** — diffuse audience for AEC niche. Skip until V1.
- **Cold email campaigns to employers at scale** — one manual, personal pilot relationship is worth 100 templated cold emails. Scale after the pilot proves the mechanic.
- **Anything paid** — Reddit ads earliest, after organic proves the funnel. See §13 of the bible.

## Kill criteria (V0 stop-and-rethink triggers)

If any of the following are true 90 days after V0 ship, stop and rethink:

- Scrape can't produce clean data for the 8 core routes in a few focused sessions
- 10 hand-matched employer introductions produce zero conversion signals (no calls booked, no LOIs, no interest)
- <100 unique architects engage with the instrument in the first 30 days despite Reddit push
- Zero pillar-quality data-post can be produced from the scrape output
- Reddit data-post launch produces <50 upvotes on r/Architects (indicates the audience doesn't recognize the problem or the data quality)

These are the honest tests. Log outcomes against them monthly.

## File structure

```
pivothop-knowledge-base/
├── CLAUDE.md                   (build entry point — read this first if you're building)
├── 00-overview.md              (this file — read first)
├── 01-style-direction.md       (design system, voice, tone)
├── 02-objectives.md            (business + product goals, KPIs)
├── 03-mvp-scope.md             (V0 detailed spec)
├── 04-landing-strategy.md      (candidate + employer landing decisions)
├── 05-preloaded-states.md      (state-driven page strategy)
├── 06-about-page.md            (Carlos's story structure)
├── 07-blog-strategy.md         (pillar + content pillar structure)
├── 08-employer-cta-strategy.md (capture timing, email sequences, drafts)
├── 09-marketing-strategy.md    (Reddit, SEO, cold email, LinkedIn)
├── 10-fairelephant-integration.md (relationship between the two products)
├── 11-success-criteria.md      (metric definitions per surface)
├── 12-kill-criteria.md         (stop-and-rethink triggers)
├── 13-graph-spec.md            (the instrument — physics, states, acceptance)
└── 14-build-playbook.md        (step-by-step Claude Code prompts: scrape, port, backend, ecosystem)

**Reference implementations (source of truth for exact values):**

```
pivothop-swiss.html     the landing + the graph — built, tuned, verified
fairelephant.html       the companion, same system, oxblood accent
fairelephant-old.html   pre-redesign, reference only
```

When a markdown file and an HTML file disagree, **the HTML wins.**
```

Each doc is standalone but references the others. All decisions here are defensible against the Notion product bible; where they conflict with an older doc, this file wins.

## Voice discipline (applies to everything)

- No exclamation points
- No "unlock," "supercharge," "empower," "journey," "growth mindset," "revolutionize"
- No em-dash abuse (use sparingly and intentionally)
- Deadpan, editorial, print-referenced
- If a sentence could appear on any other career-tech landing page, delete it
- The brand's job is to be the one company in the category that speaks like a working person, not a marketing person

## The one line to keep in your head

**Don't build past the scrape. If the scrape is real, everything else becomes obvious. If it isn't, nothing else matters.**
