# PivotHop — Build Playbook

*Step-by-step prompts for Claude Code. Each phase has literal copy-paste prompts, the files to load as context, and acceptance checks. Work phases in order — each one's output is the next one's input. The philosophy, monetization, and marketing live in `00`, `02`, `08`, `09`; this file is the execution layer.*

*The reference mockups (`pivothop-swiss.html`, `fairelephant.html`) are in this folder. They are not inspiration — they are the spec. Build on top of them, never redesign them.*

---

## Phase 0 — Repo and ground rules

**Context to load:** `CLAUDE.md`, `03-mvp-scope.md`

**Prompt 0.1:**
> Create a monorepo for PivotHop: `apps/web` (Next.js 14+, App Router, TypeScript), `apps/scraper` (Node or Python service, your call — justify it), `packages/data` (shared types + the ROLES/NEXT data contract), `packages/report` (PDF generation). Supabase for persistence. Copy `pivothop-swiss.html` and `fairelephant.html` into `apps/web/reference/` untouched — they are the source of truth for all frontend work. Add a root README that repeats the ten non-negotiables from CLAUDE.md verbatim.

**Acceptance:** repo builds, reference files present and unmodified, README carries the non-negotiables.

---

## Phase 1 — The scrape (the gate)

This is the first real work. Everything else is decoration until this produces defensible numbers. Do not let Claude Code (or yourself) skip ahead to the frontend — it is already done.

**Context to load:** `00-overview.md` (the gate section), `03-mvp-scope.md`, `13-graph-spec.md` (the data contract)

### Where the data comes from — legally

Do **not** scrape LinkedIn or Indeed; both prohibit it in their ToS and it creates real legal exposure for a one-person business. Use sources that permit programmatic access:

- **Adzuna API** — free tier, salary data included, broad coverage. Primary source.
- **Remotive API + RemoteOK API** — remote-first postings, JSON out of the box. FairElephant's remote-market side.
- **Greenhouse and Lever public job boards** — thousands of companies expose JSON endpoints (`boards-api.greenhouse.io/v1/boards/{company}/jobs`). Curate a company list.
- **USAJOBS API** — US public sector, clean salary bands.
- **Pay-transparency postings** — Colorado, NYC, California, and EU postings must state salary ranges; these are the highest-quality salary signals in any feed.
- **O*NET + ESCO** — the skill taxonomies. Not postings: the canonical vocabulary to normalize skills *against*.

**Prompt 1.1 — ingestion:**
> Build the ingestion layer in `apps/scraper`. One module per source (Adzuna, Remotive, RemoteOK, Greenhouse boards from a curated company list in a config file, USAJOBS). Each module outputs the same raw shape: `{source, external_id, title, company, location, remote_flag, salary_min, salary_max, currency, description_text, posted_at, url}`. Store raw rows in Supabase table `postings_raw` with a unique constraint on `(source, external_id)`. Rate-limit politely, cache responses, make every module runnable independently via CLI. No LinkedIn, no Indeed, no ToS-violating sources.

**Prompt 1.2 — normalization:**
> Build the normalization pass: `postings_raw` → `postings`. (1) Title canonicalization: map raw titles to a **global occupation taxonomy** — O*NET-SOC as the backbone (~1,000 occupations), crosswalked to ESCO for European coverage. Rules-first mapper (regex/synonym tables) with an LLM fallback for the long tail; seed the synonym tables deepest for the launch verticals (architecture first) but accept and map every profession from day one. Log every unmapped title for review. (2) Salary normalization: convert to annual USD using a monthly FX snapshot; flag rows where salary was absent or parsed with low confidence. (3) Skill extraction: match description text against a skill dictionary seeded from O*NET/ESCO plus a curated architecture-adjacent list (Rhino, Grasshopper, Revit, Dynamo, Python, Figma, GIS...). Output per posting: `role_id, skills[], salary_usd_min/max, remote_flag, country`. Write data-quality counters per batch: % titles mapped, % with salary, % with ≥3 skills.

**Prompt 1.3 — adjacency scoring:**
> Compute per-occupation aggregates and occupation-to-occupation adjacency across the whole taxonomy. Aggregates per occupation: posting count, salary p25/p50/p75 (only rows with real salary), remote share, top-20 skill frequencies. Adjacency: weighted skill-overlap (Jaccard over top-skill sets, weighted by frequency) computed all-pairs but stored sparse — keep the top-k (k≈12) destinations per origin, scaled to a 0–100 match. Emit the `ROLES` / `NEXT` shape the graph consumes (see `13-graph-spec.md` §data model) as **per-origin generated files keyed by origin slug** into `packages/data/generated/` — the graph loads the file for whatever origin the user selects. Include per-number provenance: how many postings back each salary band and each match score. Confidence tiers: <30 postings behind a number → low-confidence flag in the UI; an origin with <50 mapped postings total → "insufficient data yet" state rather than invented routes.

**Acceptance (the gate itself):** *Launch-vertical tier:* the Architect origin's 8 first-hop roles have ≥500 mapped postings each, salary bands from ≥30 salaried postings each, match scores stable across two independent runs (±5). *Global tier:* ≥100 origin occupations publish routes with honest confidence flags; spot-check 5 non-architecture origins (nurse, teacher, journalist, mechanical engineer, accountant) for sane routes. If the launch tier can't be met, stop and rethink per `12-kill-criteria.md` — do not proceed to Phase 2 with invented numbers.

---

## Phase 2 — Port the frontend, wire real data

**Context to load:** `01-style-direction.md`, `13-graph-spec.md`, `04-landing-strategy.md`, and the two reference HTML files.

**Prompt 2.1:**
> Port `pivothop-swiss.html` into `apps/web` as the homepage. React owns the page, rail, detail view, and trail; the graph canvas stays imperative vanilla JS exactly as in the reference (physics + label state outside React, per `13-graph-spec.md` porting notes). Do not restyle anything: same CSS variables, same type scale, same 59px sticky trick, same no-overshoot scroll math. Then make the search real: **"Current role" becomes an occupation selector over the global taxonomy** (typeahead against occupation names + synonyms); choosing an origin loads that origin's generated `ROLES`/`NEXT` file, sets the center wordmark to the occupation's name, and replays the unfold. Default demo origin: Architect. Origins with insufficient data get the honest empty state, never fake routes. Run the full acceptance checklist in `13-graph-spec.md` with Playwright and DOM measurement — every check, numerically.

**Prompt 2.2:**
> Same for `fairelephant.html` → `/fairelephant` (or its own domain later): port verbatim, keep the lens instrument's drag/keyboard/two-way-sync behavior and the atlas exactly as-is (the atlas SVG geometry is precomputed — copy it, never regenerate at runtime). Wire lens values and atlas country data from the scrape's remote/local aggregates where they exist; countries without data keep the "no data yet" treatment.

**Acceptance:** pixel-faithful to the references at 1440px; all Playwright checks green; Lighthouse performance ≥ 90 (the references are dependency-free — the port must not regress that).

---

## Phase 3 — Backend, accounts-free persistence, the report

**Context to load:** `03-mvp-scope.md` (report contents), `08-employer-cta-strategy.md` (email sequences)

**Prompt 3.1:**
> Supabase schema: `postings_raw`, `postings`, `role_aggregates`, `adjacency`, `route_exports` (email, route_id, created_at, pilot_opt_in), `employer_leads`. No user accounts in V0 — the email capture is the identity. Row-level security on, service key only server-side.

**Prompt 3.2 — the PDF report:**
> Build `packages/report`: given a route (origin → destination, optionally via a bridge role), render the route report PDF with Puppeteer from an HTML template that uses the same two typefaces, palette, and voice as the site (`01-style-direction.md`). Contents per `03-mvp-scope.md`: cover with route summary, role decoded, 90-day plan, evidence checklist, bridge role if applicable, graph snapshot, salary map. Deliver via Postmark. Subject lines follow voice discipline — no emojis, no hype.

**Acceptance:** export flow works end-to-end from the site with a real email; the PDF reads as a printed excerpt of the instrument.

---

## Phase 4 — Preloaded route pages (the SEO surface)

**Context to load:** `05-preloaded-states.md`, `09-marketing-strategy.md` (SEO section)

**Prompt 4.1:**
> Generate `/routes/{origin}-to-{destination}` pages — the template is origin-agnostic. First batch: architect origins (launch vertical); then the highest-search-volume routes from other origins as their data reaches confidence. Statically generated, one per route. Each page: the graph preloaded in click-focus on that destination (route lit, path back visible), the rail detail populated, and 300–500 words of route-specific editorial in the site voice (answer-first structure: the direct answer in the first two sentences, then the evidence). Structured data (JobPosting/FAQ where honest), canonical URLs, OG images rendered from the design system.

**Acceptance:** 20–30 route pages live; each loads the focused graph state without a click; editorial passes the voice rules in `01-style-direction.md`.

---

## Phase 5 — The content and marketing ecosystem

**Context to load:** `07-blog-strategy.md` (the pillars), `09-marketing-strategy.md` (channels), `06-about-page.md`

**Prompt 5.1:**
> Build the blog on the same design system: pillar structure per `07-blog-strategy.md`. Ship the first pillar article using scrape data — the launch data-post per `09-marketing-strategy.md` — with charts rendered from the design system, no stock imagery, every claim backed by a posting count.

**Prompt 5.2:**
> Build the about page per `06-about-page.md` — Carlos's pivot story, prose not bullets, one real photo — and the V0 employer contact page per `04-landing-strategy.md` (form → `employer_leads` + notification email).

Marketing execution (Reddit, cold email, LinkedIn, X) stays human — Claude Code builds the surfaces and the data-posts; `09-marketing-strategy.md` is Carlos's playbook, not an automation spec.

---

## Phase 6 — Deploy and instrument

**Prompt 6.1:**
> Deploy `apps/web` (Vercel or the VPS per `03-mvp-scope.md`), scraper as a scheduled job (weekly full run, daily incremental), Supabase hosted. Add privacy-respecting analytics (Plausible or self-hosted umami) with the events from `11-success-criteria.md`: graph interaction rate, route selection, export completion, employer-form submission. No cookie banners by design — don't add tracking that would need one.

**Acceptance:** the metrics in `11-success-criteria.md` are all measurable from day one; `12-kill-criteria.md` thresholds have live dashboards.

---

## Monetization, in one place

The model (full detail in `00-overview.md`, `02-objectives.md`, `08-employer-cta-strategy.md`): **free forever for candidates** — the instrument, the graph, the reports are the acquisition surface. Revenue is the **adjacent-talent job board**: employers flag roles "open to adjacent talent," pay to post, and pay for skill-matched candidate access. Because a board without liquidity is worthless, V0 runs the board manually as concierge introductions — same transaction at n=1, hand-done for validation and price discovery — then graduates to self-serve postings as volume proves out. FairElephant compounds the same audience from the compensation angle. Nothing on the candidate side ever gets paywalled — the moment it does, the data-post marketing and the Reddit credibility both collapse.

---

## The order of operations, honestly

Phase 1 before Phase 2, always. The frontend is finished and beautiful, which makes it the tempting place to keep polishing — and per the standing instruction in `CLAUDE.md`: that pull is the thing to resist. A weekend spent on Phase 1 moves the business; a weekend spent re-porting the graph moves nothing.
