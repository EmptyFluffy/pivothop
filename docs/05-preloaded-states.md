# PivotHop — Preloaded State Pages

*The route-specific pages that carry the SEO strategy. Not doorway pages. State-driven pages. The template is origin-agnostic — any occupation-to-occupation route with confident data can become a page; the first batch (20-30) uses architect origins because that's where the launch marketing points.*

---

## The distinction that keeps you from getting penalized

Every AI-swapped-name-template SEO farm on the internet in 2020-2023 got hit by Google's March 2024 and subsequent updates. Sitewide demotion of 50-80%. The exact fate we're avoiding.

**Doorway page:** a URL generated from a template, populated with swapped keywords, that provides no unique value beyond the raw data available on other sites. Content is 60%+ boilerplate. AI writes the substance. Ships in bulk.

**State-driven page:** a URL that is a saved state of a working application. Each state has genuinely unique data (not swap-copy), a working interactive tool, an editorial paragraph reflecting the author's judgment, and internal linking to related states. Content is 60%+ unique. AI writes only connective tissue. Ships one at a time, with each page defensible on its own.

PivotHop's preloaded route pages must be the second kind. This document is the blueprint.

## What lives on each route page

Each page (`/routes/architect-to-{destination}`) contains:

### 1. The interactive instrument (graph) preloaded to this route

- The full career graph from the main site, with this specific destination role already in click-focus (its route and the path back to the origin role lit)
- All the match data populated: match %, salary band, skill gap list, remote %, transition time estimate
- The bridge role callout if applicable
- The user can interact with it fully — click other routes, toggle first/second hop, export the report

This is the state, not a screenshot of the state. It's the working tool bookmarked at this URL.

### 2. Real per-route data (from the scrape)

- Match percentage (specific to Architect → this destination)
- Salary band (from live postings)
- Job demand indicator (posting frequency)
- Remote work share
- Top 3-5 skills the destination role requires that source role doesn't
- Top 3-5 skills the source role has that destination values
- Estimated transition time (based on skill gap severity)

Each number comes from the scrape. Each number is defensible.

### 3. Editorial paragraph (Carlos's judgment layer)

150-300 words of prose that:
- Explains why this specific pivot is realistic (or realistic-adjacent)
- Names specifically what's different about this transition vs. the "obvious" ones
- Includes one specific piece of Carlos's own knowledge or perspective
- Ends with a concrete next step

Example (Architect → Product Designer):

> Architects and product designers share more foundation than either field admits. Both work in iterations. Both defend the human experience against project pressure. Both must convince stakeholders that spatial or interface logic matters when the budget conversation starts. The gap most architects underestimate isn't visual — architects usually design better than junior product designers. It's the software fluency: knowing Figma the way you know Rhino, understanding component systems the way you understand construction details, learning to write specs for engineers instead of contractors. The scrape says most architects making this pivot spend 4-8 months closing that gap before they start applying seriously. If you're strong on visualization tools already (Rhino, V-Ray, Enscape), the timeline shortens.

This paragraph is the moat. It's what a keyword-swap doorway page cannot produce.

### 4. The bridge role narrative (conditional)

If the destination role has a bridge role between it and architecture, mention it. Example: "The direct pivot from Architect to Data Analyst is uncommon. The realistic path runs through Data Visualization Designer first — a role architects reach with ~65% skill overlap, then transition into Data Analyst from there over 12-18 months."

Bridge roles are second-hop nodes in the graph — reachable through a first-hop parent, and sometimes through two (a bridge edge). Not every route has one; when one exists, it's often the most useful piece of information on the page.

### 5. Evidence checklist

3-5 checkboxes representing the skills the destination role expects. For each, indicate:
- ✅ Already demonstrated (typical architecture practice covers this)
- ⚠ Partially demonstrated (some architects have this, some don't)
- ○ Gap (most architects need to build this)

This is drawn from the skill overlap data, not written by hand per page. It's a visual summary of the gap.

### 6. Related routes (internal linking)

3-5 links to adjacent route pages. Something like:

> Also worth considering: [Architect → UX Designer], [Architect → Design Systems Lead], [Architect → Data Visualization Designer]

These links are the SEO structural work — signal to Google that the pages are part of a coherent topic cluster, and give users legitimate exploration paths.

### 7. Export report CTA

The same modal from the main site, with the route pre-selected. User enters email, gets the PDF for this specific route.

Email capture on route pages is the primary conversion event of the site.

### 8. Structured data (JSON-LD)

- Article schema
- Author schema pointing to Carlos's about page
- BreadcrumbList schema
- FAQPage schema if the page includes a small FAQ

Google reads this. Without it, the pages compete with the marketing-swap farms. With it, they compete with legitimate publishers.

## URL structure

`pivothop.com/routes/architect-to-product-designer`
`pivothop.com/routes/architect-to-bim-manager`
`pivothop.com/routes/architect-to-computational-designer`

Not: `?role=architect&target=product-designer`. Not: `/matches/12345`. Real, readable URLs. They matter for SEO and they matter for users sharing on Reddit.

## The 30 (or 20) starting routes

Pick from the list in `04-landing-strategy.md`. Rank by:

1. Verified search volume (use Ubersuggest, Ahrefs free trial, or Google's own suggestions)
2. Realistic transition per the scrape data
3. Distinctiveness of the destination field (avoid two nearly-identical routes)

Don't build all 30 in month 1. Build 8 first (the first-hop roles), let them index for 4-6 weeks, measure which ones get traffic, then expand around the winners.

## The dynamic long tail (V1)

Once V0 is live and the initial 20-30 pages are indexed and measured:

- Track which route queries produce searches that don't yet have a page (Google Search Console)
- Add new route pages for the ones with genuine search intent
- Kill pages that get zero traffic after 6 months
- Let user searches inform the page inventory, not preemptive combinatorics

**Rule:** never build a route page before there's evidence someone searches for that route.

## What breaks the strategy

The following will get the domain penalized and sitewide demoted:

- Any of the 30 pages having identical structure with only names swapped
- Any editorial paragraph that reads as AI-written boilerplate
- Any page shipped without real scrape data behind it
- Any page targeting a route where the match % is fabricated
- Any programmatic expansion to hundreds of pages without proportional editorial work

The threshold is unforgiving. Google's Gemini-powered quality models distinguish real editorial work from template-fill with high accuracy. If it looks templated at scale, it gets nuked.

## What makes the strategy work

Two things, non-negotiable:

1. **The scrape is real.** Every number on every page comes from live data, not fabricated. If the scrape doesn't cover a route, don't publish that route.
2. **The editorial paragraph is Carlos's.** Not AI's. AI can draft; Carlos rewrites in his own voice with his own knowledge. If the paragraph doesn't have a specific insight or judgment that AI couldn't have generated, rewrite it until it does.

## Success signals per page

Each page should be evaluated at 90 days on:

- Organic sessions from Google (target: 100+/month by month 6 for the top pages)
- Time on page (target: >2 minutes — indicates the tool is being used)
- Export report conversion rate (target: 5-10% of visitors capture email)
- Backlinks acquired (target: any inbound link from Reddit, LinkedIn, industry blog is a win)

Pages that don't hit any of these signals at 90 days go on the "consider killing" list. Pages that hit multiple become templates for the pattern of what works.
