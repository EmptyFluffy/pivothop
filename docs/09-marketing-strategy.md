# PivotHop — Marketing Strategy

*Where PivotHop earns attention. The channel portfolio, the tactics per channel, and the honest budget of what's realistic solo.*

---

## The framework that governs everything

**Channels serve stages, not products.** PivotHop is pre-revenue, pre-scrape, a free consumer product monetized by growing into the adjacent-talent job board (concierge intros as its manual V0). That stage math means:

- Organic channels first. Always.
- Paid channels only after organic proves the funnel converts.
- Distribution partnerships (per-vertical educators — AEC first, each expansion vertical has its own equivalents) count as organic and are the most underused channel available.
- Every dollar spent on paid before the scrape produces defensible signals is a dollar buying the feeling of momentum, not growth.

The full channel portfolio and reasoning is in §13 of the Notion bible. This document is the operational plan per channel. The concrete platform-by-platform list of *where to post* (launch sites, communities, directories, with the emerging/less-saturated ones flagged) lives in `docs/22-launch-channels.md`.

---

## Channel 1: Reddit (Tier 1 organic, highest ROI year one)

### The strategic significance

In 2026 Reddit is not a marketing channel that helps SEO. **Reddit is SEO.** Google's licensing deal + preferential ranking means a high-quality comment in r/Architects that gets 200 upvotes can rank in Google search results for a year and outperform a full blog post for that period.

For PivotHop's specific stage and niche, Reddit will likely produce more qualified traffic in year one than programmatic SEO. See §12 of the Notion bible for full reasoning.

### Priority subs

- **Bullseye (post here first — launch vertical):** r/Architects, r/architecture. This whole channel plan is a per-vertical template: each expansion vertical gets its own bullseye subs (r/nursing, r/Teachers, r/AskEngineers, r/Journalism...), same discipline, same registers.
- **Broader audience (secondary):** r/careerguidance, r/careerchange, r/findapath
- **Adjacent professional:** r/computationaldesign, r/BIM, r/UXDesign, r/cscareerquestions, r/ExperiencedDevs
- **Ecosystem-adjacent (for FairElephant crossover):** r/remotework, r/digitalnomad

### The account discipline

**Before ANY promotional activity:**

- 2-3 week warm-up on each priority sub
- 20+ substantive comments per sub on topics unrelated to PivotHop
- No promotional links, no PivotHop mentions during warm-up
- Establish the account as a real architect who reads and comments in the sub

**The 9:1 rule:** for every comment that mentions PivotHop (even in Register 2), nine comments must be substantive contributions unrelated to promotion. Track this ratio. Mods watch account history when things get flagged.

### The three attribution registers (from §12 addendum)

**Register 1 — direct builder statement:** "I built a tool called PivotHop for exactly this — here's what it says about your situation." Right for: self-promo-friendly subs (r/SideProject, r/InternetIsBeautiful), stickied Sunday self-promo threads, direct "what tools help?" threads.

**Register 2 — workhorse frame (the default):** "I've been building a scraper called PivotHop to map where architects actually go — pulling from the current dataset, your best routes are X, Y, Z because [substantive answer]." The tool is named, function stated, no link. Comment is *about the person's question*; the tool is incidental.

**Register 3 — pure answer, bio does the work:** No project mention. For subs with strict no-promotion rules. Answer stands on its own; bio + username carry the attribution for the 1-3% who check profiles.

### The launch data-post (the moment of ship)

The single most important Reddit action of V0. Ship after the scrape produces defensible signals.

**Post format:**
- Chart or infographic built from the scrape's real output
- Something like "The 8 non-architecture skills that appear most often in postings hiring architects (from 12,000 postings)"
- Title with a specific finding, not a question
- Methodology comment as a top comment: what was scraped, how, over what timeframe, with limitations acknowledged
- PivotHop named in the methodology comment, described as the scrape source, no link on first post

**Post timing:**
- Weekday morning US Eastern (r/Architects skews international but US-heavy)
- Not on a major AEC news day (competing attention)
- After 60+ days of account warm-up

**Success signal:**
- 50+ upvotes = launch worked; do another data post in 2-3 weeks
- 100+ upvotes = ship a follow-up post within 5 days while attention is fresh
- <30 upvotes = data or framing didn't land; iterate before next post

### Ongoing engagement cadence

**Per week:**
- 5-10 substantive non-promotional comments in priority subs (Register 3)
- 1-2 Register 2 comments when a natural fit thread appears (architect asking about pivot options, someone asking what tools exist, etc.)
- 0-1 Register 1 activity (a self-promo Sunday post, an "I built X" post, a direct product mention in a very appropriate context)

Track: mod removals (indicates crossing lines), account karma trends, PivotHop URL clicks from Reddit (via analytics).

### What kills the strategy

- Same comment posted in multiple threads
- Any pattern that looks like a template
- Alt accounts to upvote yourself or place links your main can't
- Link-drops in unrelated threads
- Mentioning PivotHop more than the 9:1 ratio allows
- Getting into arguments in the comments — walk away instead

Once flagged and banned from a key sub, permanent. Assume every mod check is real.

---

## Channel 2: SEO — state-driven and pillar-driven

Full strategy in §11 of the Notion bible + `05-preloaded-states.md` + `07-blog-strategy.md`.

**V0 SEO ship list:**

1. 20-30 preloaded route pages with real per-page data
2. 3-5 pillar-quality blog posts, one per content pillar
3. About page with author schema
4. Basic technical SEO: sitemap.xml, robots.txt, canonical URLs, structured data (Article, Person, BreadcrumbList)
5. Google Search Console setup + weekly monitoring for first 90 days

**What NOT to do:**

- Do not build 2000 template pages
- Do not use AI to write the substance of any page
- Do not spam-target commercial keywords ("best career change tool")
- Do not buy backlinks
- Do not chase every long-tail keyword that shows up in Google Search Console — build for the queries that convert to email captures, ignore the ones that don't

**Realistic 12-month projection (per §11):** 30k-150k monthly organic visits from a well-executed AEC-niche instrument. Don't anchor on Zapier's 9M — that's 15 years of compounding on a mass market.

**The AI overview problem:** Google's AI Overviews (Search Generative Experience) now answer many career questions inline without the user clicking through. Structure content to be *cited* in AI overviews rather than replaced by them — clear author bylines, specific numbers, distinct claims that AI overviews will pull as quotes with attribution.

---

## Channel 3: LinkedIn organic (Carlos-as-founder, Tier 1 low-effort)

### Why LinkedIn matters specifically for this project

LinkedIn is where the AEC professional audience is genuinely active and where employer-side decision-makers (VPs of Talent, HR leaders, hiring managers) can be reached without paid intermediation. Carlos's founder-practitioner identity — architect who made the pivot, now building the tool — is unusually strong LinkedIn content.

Every AEC founder should be doing this. Most aren't. Underinvested channel.

### V0 content cadence

**Weekly:** 1 post from Carlos's own profile (not a PivotHop company page — the founder identity is stronger than the brand at this stage).

**Post types (rotate):**

1. **The data callout** — one number from the scrape, framed as an observation. "Of the last 3,000 senior architect postings I looked at, 41% mentioned tools that architects don't learn in school. Rhino, Grasshopper, Dynamo, Revit API..."
2. **The pivot observation** — a specific pattern Carlos has noticed in his own network or in the data. Short, personal, no CTA.
3. **The industry critique** — one thing wrong with how architects are told to think about careers. Not angry, just observed.
4. **The building-in-public update** — occasional glimpse of the tool being built. Screenshot of a chart, mention of a decision made. Grounds Carlos as a real person building a real thing.

**Never post:**
- Motivational quote graphics
- "Repost if you agree" bait
- Selfies with an inspirational caption
- "Congratulations to X on their new role" performances
- Vague "I'm hiring" posts without specifics
- AI-generated career advice

### V1 cadence (post-validation)

Move to 2-3 posts per week once V0 proves the format works. Add:

- Monthly "state of the AEC pivot" summary with data
- Guest interviews with architects who made specific pivots (short-form, published to LinkedIn video/newsletter)
- Cross-posts of blog content in short-form

### Metrics

- Follower growth (secondary metric only)
- Engagement rate: comments + reactions per post, target 3-5%
- Click-through to PivotHop from LinkedIn analytics
- Comments that turn into DM conversations (the real metric — DM conversations become real leads)

---

## Channel 4: AEC educator partnerships (Tier 1, highest-leverage)

### The target list

- **Novatr** (formerly Oneistox) — computational design courses for architects
- **Oliver Thomas** — YouTube + course creator, computational design focus
- **How to Rhino** — Rhino/Grasshopper tutorials
- **ThinkParametric** — computational design courses
- **PAACADEMY** — parametric architecture academy
- **The B1M** (adjacent — construction/architecture media)
- **Architecture Firm School** (business-of-architecture education)

### The deal structure

Each partnership is customized, but the basic mechanic:

- Their students/subscribers get featured access to PivotHop (perhaps with the audience acknowledgment banner on landing)
- They get commission on any successful concierge employer placements from their audience (structured as revenue share, not upfront)
- Optionally: co-branded content (a joint pillar article, a webinar, a data collaboration)

### Outreach approach

Not a cold pitch email. Warm intro when possible. Otherwise: a short personalized message on LinkedIn or their contact page. Structure:

- Compliment their specific work (referenced by name — not generic)
- One sentence about PivotHop and why it fits their audience
- One specific ask: "Would you be open to a 20-minute call to talk about a possible partnership?"
- End

Under 100 words. Zero corporate boilerplate.

### V0 target: 2-3 partnerships opened, 1 activated by month 6

More is fine. Fewer means the AEC ecosystem doesn't recognize PivotHop as legitimate yet — reconsider positioning and voice before pushing for more.

---

## Channel 5: Cold email to employers (V0 minimal, V1 scaled)

### V0 scope

Small hand-picked list: 20-30 companies where Carlos has personal knowledge of the hiring situation. AEC firms, design agencies, tech companies with design-adjacent roles, real estate development firms with in-house design teams.

**Not:** any list purchased from a lead-gen tool. Any list built from generic scraping. Any list not curated by Carlos personally.

The cold email templates are in `08-employer-cta-strategy.md`.

### V1 scope (only after V0 pilot converts)

Expand to 100-200 companies. Structured outreach cadence. Small email tool for tracking (Instantly, Lemwarm, or similar — not full CRM).

Keep the 2-touch limit. No 5-email drip sequences.

---

## Channel 6: X / Twitter (V1 only)

**V0: not at all.** Not worth the time investment for AEC audience. Twitter is dominated by tech-startup and journalism voices; AEC professionals are on LinkedIn.

**V1 consideration:** if the pillar article gains traction on Twitter (via journalist or founder amplification), consider making Carlos active there for cross-pollination with the tech/design/startup audience. But drive-by Twitter presence is worse than no presence.

**If activated in V1:**

- Cross-post LinkedIn essays as Twitter threads
- Engage with 2-3 accounts that already write about career-change and hiring (e.g., Kevin Kwok, Not Boring, Anu Atluru)
- Don't try to build a Twitter audience from scratch — it's a decade-plus investment for questionable ROI at PivotHop's scale

---

## Channel 7: Product Hunt / Show HN (one-shot launches)

### Product Hunt

Launch once, when the product is polished and the scrape is real. Can bring 500-3000 users in 48 hours if executed well. Best used to seed the alpha pool with early advocates.

**Timing:** end of V0, when the tool works and can hold traffic.

**Preparation:**
- 30+ hunter votes lined up in advance (network of designers, indie builders, AEC folks)
- A prepared launch post with the strongest one-line pitch
- Real screenshots (not marketing mockups)
- Carlos active in comments all day

### Show HN

Launch once, if the product has a technical angle that would interest the HN audience (the scraper, the SVG data viz, the site build). Right audience for the instrument's aesthetic; wrong audience for AEC specifically.

Test only when the site can hold the traffic and the message.

---

## Channel 8: Paid ads (honest verdict)

**Google Ads:** don't. $10-30 CPC on career keywords, dominated by monetized competitors, wrong stage.

**Meta Ads:** wrong audience shape.

**LinkedIn Ads:** perfect audience match, but only makes sense once employer ACV exists to justify the CPC. V1 at earliest.

**Reddit Ads:** the exception. $1-3 CPC, sub-level targeting, aligns with organic Reddit strategy. Worth $10-20/day tests for 4-6 weeks *after* the site converts emails at a measurable rate. Use paid to amplify what organic proves, not to test cold.

**Twitter/X Ads:** cheap now, but diffuse audience for AEC. Skip.

**Podcast sponsorships:** consider V1 with 1-2 AEC-adjacent podcasts (Business of Architecture, The Second Studio, Practice Disrupted) where the audience is precisely the target and the CPMs are reasonable.

---

## Distribution calendar (V0, months 1-6)

**Month 1-2:** Account warm-up on Reddit + LinkedIn. AEC educator outreach begins. Zero promotional activity.

**Month 3:** Site ships. Launch data-post on r/Architects. First LinkedIn post as founder. First educator partnership call.

**Month 4-6:** Weekly Reddit engagement (per cadence above). Weekly LinkedIn post. 1-2 blog posts per month. Continued educator outreach. First 3-5 concierge employer conversations initiated.

**Month 6 review:** measure against success criteria (`11-success-criteria.md`). If Reddit + LinkedIn + educator partnerships are producing the target signal, keep going with same cadence + start V1 planning. If not, diagnose which channel is failing and why before adding new channels.

---

## The one rule for all marketing

**Every touch should be the kind of touch that would make an architect who saw it forward it to another architect.** If it's the kind of touch that would make them roll their eyes, don't ship it. This is the honesty test. Apply to every post, every email, every ad, every page.

The brand's whole positioning is "the honest one in a category that isn't honest." Every marketing action either reinforces that positioning or undermines it. There's no neutral.
