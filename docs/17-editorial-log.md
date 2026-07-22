# PivotHop — Editorial Log

*Running notes on competitors, borrowed patterns, and new angles. Append-dated.*

---

## July 2026 — Out of Architecture (outofarchitecture.com) review

What they are: career consulting for architects leaving practice (Rudin & Pellegrino, since 2018, 700+ clients, a Routledge book, podcast circuit). The dominant editorial voice in our launch vertical's exit conversation.

**What their content does well (borrow):**
1. **Story-first.** Interviews and first-person transition narratives, not frameworks. The reader sees themselves in a person, not a chart. → Our version: a "Pivot Interviews" series where a real person's story runs alongside their route's actual numbers (their match, their gap, what the graph said vs what happened). Their story, our overlay. Nobody else can do the overlay.
2. **Validation before advice.** They name the emotional state (overworked, underpaid, undervalued) before proposing anything. Our deadpan can read cold; the should-i-leave essay's "that is not burnout, that is accurate perception" is our register for the same move. Keep doing it.
3. **"Superpowers" translation language.** They relabel architecture skills in destination-industry vocabulary. We do this with data (the resume-conversion section in the 1,090-postings post). More of it, per vertical.

**What not to copy:** coaching-funnel CTAs, testimonial walls, no published data. Their moat is empathy and network; ours is measurement. Complementary, not competitive — a future partnership/interview-swap candidate rather than a rival.

## July 2026 — New angle logged: the corporate workplace beat

Famous companies as the unit of analysis: what the giants' policies (RTO mandates, four-day trials, AI reorganizations) do to the job landscape. Fits Shape of Work. Differentiator remains our corpus: policies as *claimed* vs what postings *actually offer*.

**First data point banked:** four-day-week mentions in our corpus = 102 of 110,681 postings (0.09%). By format: unspecified four-day 57, 9-day fortnight 38, reduced-hours 4, 4x10 compressed 3. Top offering occupations: civil engineer, electrician, financial analyst, welder — trades and AEC, not tech. The discourse-reality gap is the story.

**External anchors gathered (dated July 2026):** UK pilot (61 firms, 56 continued, 92%-class continuation, 65% fewer sick days); Tokyo Metropolitan Government four-day from April 2025; UK Employment Rights Act 2025 (flexible-working default staged 2026-27); RTO side: Amazon 5-day from Jan 2025, JPMorgan, AT&T, Goldman et al.; 54% of Fortune 100 employees under five-day mandates per JLL Q2 2025 (up from 11%); 67% of companies still hybrid, 6% fully remote.

**Posts produced from this angle:** four-day-week-counted, the-giants-disagree (July 2026).

## July 2026 — Preloaded route pages, batch 1 (multi-origin)

The `/routes` SEO surface (docs/05) shipped and generalized beyond architecture. The route system now reads any origin's `public/data` payload at build time, so a page for any occupation renders the same numbers the graph loads at runtime — no fabricated data, per the docs/05 non-negotiable.

**18 route pages live.** Eight architecture (the first-hop ring) plus ten most-searched non-architecture pivots, chosen at the intersection of (a) verified search demand and (b) the destination sitting in the origin's ring-1 with confident data:

| Pivot | Readiness | Signal | Why it's here |
|---|---|---|---|
| Graphic designer → UX designer | 19% | related | Canonical creative pivot; tools overlap, research is the gap |
| Teacher → instructional designer | 12% | observed | #1 searched teacher exit; low match, real flow, 11% remote |
| Registered nurse → nurse practitioner | 78% | observed 100 | Highest-readiness route; the license-is-the-wall story |
| Accountant → financial analyst | 43% | observed | Backward vs forward-looking; +20% pay |
| Software engineer → solutions architect | 60% | observed | Cleanest senior tech move; translation is the gap |
| Data scientist → ML engineer | 51% | observed | Notebook vs production; the LLM-era seat |
| Marketing manager → product manager | 19% | observed | Low match, strong flow; technical fluency the gap |
| Paralegal → lawyer | 35% | observed | Huge search; honest about the JD wall + compliance alt |
| Data analyst → data engineer | 42% | observed 100 | Most common analyst destination; orchestration the gap |
| Business analyst → project manager | 66% | observed | Smooth; delivery ownership + PMP the gap |

**Editorial stance carried across:** the licensed pivots (RN→NP, paralegal→lawyer) lead with the credential-vs-skill honesty from the "Where people actually go" post; the low-match-but-observed pivots (teacher→ID, marketing→PM, graphic→UX) explain why the skill number reads low while people make the move anyway. FAQs written to the literal high-intent queries for FAQPage schema and answer-engine citation. Editorials remain drafts for Carlos's rewrite before launch traffic (docs/05 #2).

**Next:** let batch 1 index 4–6 weeks, read Search Console, expand around winners (docs/05 dynamic long tail). BIM manager and project manager are batch-2 architecture candidates once direct ring-2 kids render in the web payload.
