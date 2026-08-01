# PivotHop — V0 MVP Scope

*The minimum viable version of the project. What must ship, what waits, what will get built later.*

---

## Scope philosophy

The MVP tests **whether the methodology works** — skills-based adjacency producing routes people trust — using the launch vertical (architecture) as the first proving ground on top of a **global, profession-agnostic taxonomy**. The product built in V0 is the general product; the vertical is where the marketing aims first. The question the MVP answers is:

> If I ship a working instrument with real data for 8-16 architect routes and a small distribution push, will architects use it, will employers care, will the scrape produce defensible signals, and will Carlos want to keep going?

Everything in scope serves that question. Everything out of scope is deferred to V1 or killed.

## In scope for V0

### 1. The scrape (the gate)

- Live scraping of job postings from at least 2-3 major boards (Indeed, LinkedIn, RemoteOK or similar)
- Cleaning pipeline that dedupes, extracts skills, salary, location, remote status
- Per-role adjacency computation: for each source role (Architect) and each destination role (8-16 adjacent options), compute:
  - Skill overlap %
  - Salary band comparison
  - Demand indicator (posting frequency)
  - Remote share
  - Top skills gap (roles requires but source doesn't have)
  - Bridge role suggestions
- Refresh cadence: weekly, minimum
- Storage: PostgreSQL or SQLite for MVP scale
- One defensible chart producible from the data — for the launch data-post

**Ship gate:** If the scrape can't produce all of the above for the 8 core routes within a few focused sessions, the MVP doesn't ship. Everything else waits.

### 2. The instrument (candidate-facing site)

- **Landing page** at pivothop.com (or chosen domain), profession-agnostic — "Current role" selects any origin occupation (demo seed: Architect)
- **Working career graph** — force-directed, top-8 first-hop + second-hop routes **derived per origin occupation** from the global taxonomy (demo origin: Architect), real match numbers pulled from the scrape. Full spec in `13-graph-spec.md`.
- **Route selection flow** — click a role, see the detail panel with salary, demand, remote, skills gap
- **Export report modal** — the multi-slide carousel from the current mockup, with email capture and PDF delivery
- **The instrument stays free forever** for candidates. No upsell, no premium tier, no paywall.

### 3. Preloaded route pages (state-driven SEO)

- 20-30 pages, one per specific Architect → destination route
- Each page has:
  - The full graph preloaded to that route
  - Real match number, real salary, real skills gap
  - Editorial paragraph explaining why this route is realistic (Carlos's judgment layer)
  - Bridge role callout if applicable
  - Related routes (internal links)
  - Meta description and Open Graph card
- URLs like `/routes/architect-to-product-designer`
- Structured data (JSON-LD) for E-E-A-T ranking signal

### 4. About page

- Carlos's story: architect → computational designer, why he built this
- Photograph (real, textured, not corporate)
- Credentials: Predock affiliation, AVARQ, education
- The rejection of category norms — why PivotHop isn't like other career tools
- Contact info (email, LinkedIn)

This page carries E-E-A-T weight for every other page on the site. It's not "optional marketing" — it's structural.

### 5. Report PDF + email flow

- User enters email in the export modal
- PDF generated with the design system (**Instrument Sans** + Space Mono, paper tones, cobalt accent)
- **What the built report actually contains** (5 named sections, `lib/roadmap/template.mjs` — this list supersedes the looser spec that used to sit here, which named a graph snapshot, a "role decoded" page and a bridge-role page that the shipped template does not render):
  1. **"The 100 points, opened up."** — the readiness score decomposed into what each missing skill is worth
  2. **"Ninety days, sequenced by the points."** — the plan, ordered by value per skill rather than by difficulty
  3. **"What counts as proof."** — the evidence that reads as credible to a hiring manager
  4. **"The whole arc, X–Y months."** — the honest timeline, credential-floored where a licence applies
  5. **"Both bands, one axis."** — origin and destination pay on one scale
- Prose is AI-written when `ANTHROPIC_API_KEY` is set and falls back to a template otherwise; both ship the same five sections
- Confirmation email sent with PDF attached (or link to download)
- Email uses transactional email provider (Postmark, SendGrid, or Resend)
- Compliant with GDPR — consent language, unsubscribe link, plain footer

### 6. Legal / privacy pages

- Privacy policy (GDPR-compliant)
- Terms of use
- Cookie notice (if applicable — try to avoid needing one)
- Email consent language embedded in the capture form

Non-optional. Ship-blocking.

### 7. Launch data-post (r/Architects)

- One original chart built from the scrape's real output
- Something like "The 8 non-architecture skills that appear most often in postings hiring architects" — a legitimate finding, not a marketing framing
- Posted as image + methodology comment
- Register 2 attribution: names PivotHop in the top comment, describes it as the scrape source, does not link on first post
- If it lands (>50 upvotes), the next data-post 2 weeks later

### 8. One concierge employer relationship (the job board at n=1)

- One real conversation with a hiring lead at a firm Carlos has access to (through Predock, AVARQ, or personal network)
- Verbal commitment or LOI to review 2-3 hand-matched candidates from PivotHop
- No money required at this stage — this is a pilot to prove the mechanic
- If Carlos can't get one such relationship in the first 60 days, that's a signal about the employer side that matters

### 9. Analytics + tracking

- Plausible or Fathom (privacy-first analytics)
- Day-6 engagement tracking (the north-star metric per objectives.md)
- Email capture rate per route page
- Report download rate
- Reddit referral traffic
- Nothing invasive. No Facebook Pixel. No GA4.

## Out of scope for V0

### FairElephant integration (beyond navigation)

- Product-level integration between PivotHop and FairElephant (shared user accounts, cross-referenced data, combined salary+career analysis) is V1
- V0: FairElephant exists at fairelephant.com with the current design, and PivotHop's nav links to it. That's the full relationship for now.

### Employer-side dedicated landing page

- V0 employers self-segment via Carlos's direct outreach and the concierge model
- V1: `/employers` URL with full landing, case studies, pricing, contact flow

### 30 blog posts

- V0: 3-5 quality posts building topical authority around the pillar themes
- V1: the full 30-post editorial calendar

### The pillar article

- Ships in V1, after the employer-side product surfaces skill-overlap data that the article promises. Ship the product view first, then the article. Otherwise the article writes a check the product bounces.

### Cold email campaigns to employers

- V0: one manual, personal relationship
- V1: templated outreach after the manual pilot proves the mechanic

### LinkedIn organic content at scale

- V0: Carlos posts occasionally, when he has something specific to say
- V1: consistent cadence (2-3 posts/week) with content workflow

### X/Twitter campaigns

- V0: not at all
- V1: if any signal emerges that architects hang out there for career-related content

### Any paid channel

- V0: zero
- V1: Reddit ads at $10-20/day once organic proves the funnel converts

### Interstitial "candidate or employer?" segmentation

- Never. Adds friction to dominant flow. Employers self-segment via URL.

### Native mobile app

- Never in V0. Maybe never at all. The web app is enough.

### Sign-in or account creation

- V0: no accounts. Email capture is the only user-provided data.
- V1: only if there's a specific feature that requires it (saved routes, return visits) and users are asking for it.

### Payment processing

- V0: no. Concierge invoicing is manual (invoice → wire transfer or Stripe payment link).
- V1: if volume justifies, add Stripe billing.

## The build sequence

Build in this order. Don't skip ahead:

1. **Scrape prototype** — get one Architect → Computational Designer route producing all the required data outputs
2. **Static page mockup** — the existing design becomes a real static page with real data injected
3. **Interactive career graph** — the force-directed SVG graph wired to real data (see `13-graph-spec.md`)
4. **Second and third routes** — Architect → BIM Manager, Architect → UX Designer — to prove the scrape is generalizable
5. **All 8 first-hop routes** — full first-hop mode working
6. **Second-hop routes** — 16 kid roles
7. **Export report PDF generation** — the modal → email → PDF flow
8. **20-30 preloaded route pages** — publish
9. **About page + privacy/terms** — publish
10. **Launch data-post to r/Architects** — the moment of ship
11. **One concierge employer conversation** — parallel to launch
12. **Weekly Reddit and content cadence begins** — the sustaining work

## Tech stack (proposed)

- **Frontend:** the existing HTML/CSS/JS baked into a Next.js app for SEO + preloaded state routes
- **Backend:** Node/TS scrape service running on a cheap VPS (Hetzner, DigitalOcean) with cron jobs
- **Database:** PostgreSQL (Supabase or self-hosted)
- **Email:** Postmark or Resend for transactional
- **PDF generation:** Puppeteer or Playwright rendering an HTML report template
- **Hosting:** Vercel for frontend, VPS for scrape
- **Analytics:** Plausible or Fathom
- **Domain:** pivothop.com if available, or nearest alternative

Don't over-engineer. Ship on rails, replace what breaks.

## Definition of "V0 shipped"

V0 is shipped when:

- ✅ Scrape produces all required outputs for all 8 first-hop routes and refreshes weekly
- ✅ pivothop.com loads the interactive career graph with real data
- ✅ 20-30 preloaded route pages are live and indexable
- ✅ About page is live with Carlos's real story and photo
- ✅ Privacy policy and terms are live
- ✅ Export report PDF sends successfully to a captured email
- ✅ Launch data-post has been posted to r/Architects
- ✅ One concierge employer conversation is in progress or agreed
- ✅ Analytics are tracking day-6 engagement
- ✅ Nothing on the site links to functionality that doesn't work

**Estimated timeline for V0:** 8-12 weeks of focused solo work. Extend it if it needs extending. Don't ship early on principle if the scrape isn't real.
