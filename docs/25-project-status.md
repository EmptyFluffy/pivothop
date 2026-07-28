# PivotHop — Project Status

*Living checklist of what's shipped, in flight, and pending. Updated 2026-07-28. Companion to docs/23 (automation), docs/24 (competitor SEO research), docs/26 (board UX principles). "Shipped" = deployed to production and verified.*

---

## Shipped

### Data pipeline & quality
- **Scrape → normalize → aggregate → score → emit** pipeline, 15 keyless sources; local-first NDJSON, optional Supabase mirror.
- **Cross-tier classification fix** (the dental-hygienist lesson): head-noun + next-token guard in the title matcher — "Physician Assistant" ≠ physician. Taxonomy synonym sweep (cross-tier, magnets → exactOnly, dedup).
- **License gates + honest transition time**: gated professions (dental-hygienist, physician, paramedic, genetic-counselor, RN, PT, pharmacist…) carry a credential gate and never show a months-scale timeline for a multi-year degree.
- **Salary sanitization**: currency-mismatch reinterpretation (NT$ labeled USD → local ccy), degenerate-min drop, 5× ratio guard, $900k cap, +20 countries in inference.
- **Skill extraction quality**: heading-aware zoning (skip benefits/EEO/about blocks), per-skill `unless_near` context vetoes (EMS AirFlow ≠ Apache Airflow), alias hygiene, ≥3-posting + ≥2%-share support floor, +16 clinical/trades skills.
- **Cross-source dedup** (60-day window, richest copy wins) — removed 16,142 syndicated duplicates on first run. **First-seen ledger** makes posting ages repost-proof.
- **Guardrails**: `verify` gold-set (67 cases, every fixed bug frozen as a test) + sanity invariants + licensed-route checks; build-jobs purity canary; `check:links` internal link-integrity gate; 45s fetch timeout.

### Automation (docs/23)
- **Nightly bot — two homes, both gated.** Laptop: launchd `com.pivothop.scraper.daily` 07:15 (`daily-run.sh`). **Cloud: GitHub Actions `nightly-scrape.yml` 08:00 UTC (`ci-run.sh`) — laptop-independent (Phase B, ✅).** Both: verify (gold 67 + sanity) → exports → web build → link gate → auto-commit + push (Vercel deploy) → IndexNow ping. Red gate = no publish. Implausible-diff tripwire. (Retire the laptop one once Actions proves out — see §B.)

### SEO surfaces
- **~800 job category pages** (`/jobs/<tag>`): single-dim + 2-dim + 3-dim + occupation-level combos ("software engineer jobs in germany", "remote design jobs in the united states", pay×occ, visa×country…), all ≥6-listing gated, unique per-page copy, `/jobs/browse` hub.
- **124 per-origin pages** (`/routes/<origin>`): "Alternative careers for [X]", every measured route ranked — the winnable SERP from docs/24.
- **126 route pages + 156 salary pages** (pre-existing), route FAQs expanded (license + skills questions) with FAQPage schema.
- **Cross-link mesh**: "More [role] searches" on occupation pages; "By starting point" on the routes hub.
- **Discovery plumbing**: IndexNow (key + nightly ping), `llms.txt`, blog RSS `/feed.xml`, sitemap `lastModified`, ItemList schema on category + origin pages, Article/FAQ/Breadcrumb schema.
- **Company logos on every job card** (2026-07-25): retrieved favicon (ATS-slug → domain → Google favicon, globe-filtered) or neutral monogram fallback; `fetch-logos.mjs` grows the library nightly.
- **Category-page FAQ enrichment** (2026-07-25): every category page carries a data-driven Quick-answers block (live count + freshness, this filter's own posted pay band, a kind-specific question — routes-in for occupations, top fields per country, top roles per field, visa honesty — and the instrument funnel) with FAQPage schema and 2–5 internal links per block into salary/routes/sibling pages.

### AEO / AI-search surface (2026-07-27 — all LIVE)
- **The Adjacency Index** (`/adjacency-index`): citable stats hub — headline numbers as extractable sentences with proof links, Dataset+Article JSON-LD, live board scale + data-as-of date, "Cite as" line. Footers + sitemap (0.9, daily) + llms.txt.
- **llms-full.txt**: the full corpus in one fetch (Index numbers, method, 45 strongest routes, 35 comparisons, glossary, all findings). Regenerates each build. NOTE: 404s under local `next start` (hyphenated-route quirk) but serves 200 in prod — don't chase the local 404.
- **E-E-A-T**: named author on every Article (blog/routes/compare), visible byline, per-post datePublished, dateModified tracking the nightly corpus date, About-page Person entity (@id, knowsAbout).
- **AI-crawler robots**: explicit allow for GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, CCBot et al.
- **TL;DR boxes** ("The short version") on the 5 top data posts — self-contained quotable facts, the block answer engines extract first.
- **PRIVACY RULE (standing)**: the founder's unique surname must never appear in site content, schema, or bot commit names — author is "Carlos Alvarez" everywhere. Zero-occurrence verified in built output.

### Pending (AEO + misc, needs founder)
- **[USER] sameAs entity links**: provide safe LinkedIn/X (and Crunchbase) URLs → wire into Organization + Person schema (the last on-page AEO piece).
- **[USER later] scraper contact email**: swap personal address in source User-Agents for hello@pivothop.com (deferred, not urgent).
- **[USER] GetOnBoard reply**: on a re-display "yes", add 'getonbrd' to build-jobs OK set → 511 LATAM jobs onto the board (mints the occ×region pages).
- **Careerjet**: adapter ready (CAREERJET_API_KEY secret), blocked on static-IP allow-list — revisit if/when a VPS exists (pairs with PDF-export render env).
- **Off-page AEO (the ceiling)**: get the Adjacency Index cited (Reddit/HN/newsletter) + create a Wikidata entity for PivotHop.

### Content
- Blog: career-adjacency method post, **recruiter-ghosting post** (~2k words, sourced), **confused-career-pairs post** (launches the compare surface; first use of the Pull/Go editorial furniture), **skills-over-titles thesis post** ('Job titles, deprecated'), **ai-jobs-three-ledgers post** (Altman's verified arc incl. the July 11, 2026 'net job-creating' X post, the Anthropic Economic Index, the Stanford-canaries/Yale displacement record, and our demand ledger), **claude-chats-google post** (the July 25–27, 2026 indexing incident; the robots-block-hides-noindex mechanism; trend-term SEO play). Title discipline: docs/07 'glance test' rule added 2026-07-27; three posts retitled (slugs unchanged). Voice + method in docs/01, docs/07. Job cards + detail pages carry honest relative freshness ('3d ago', repost-proof via the first-seen ledger).

### Comparison surface (2026-07-26)
- **554 `/compare/[a]-vs-[b]` pages + `/compare` hub** — posted bands from each occupation's own corpus, skill readiness both directions, shared-skill waterfall, license gates, board counts, asymmetry callouts, FAQ + schemas. Pair qualification: mutual measurement, one-way ≥45%, or high-search seeds with ≥1 measured direction. Cross-linked from routes hub, blog posts; in sitemap (~1,937 URLs total).

### Product
- The instrument (force-directed skill graph), route/salary/jobs surfaces, FairElephant companion, employer post form ($49/$99 launch), graph → jobs destination CTA.
- **Employer waitlist gate (2026-07-26)**: /employers now shows a concierge waitlist card (email + optional company/role) instead of the un-wired checkout journey. `joinWaitlist` → Supabase `employer_waitlist` (migration 0006) → Postmark heads-up to hello@ once §C lands → mailto fallback. The full EmployerForm stays built behind the one-line `WAITLIST` flag in employers/page.tsx — flip to `false` when Lemon Squeezy is wired. **[USER] run migration 0006 (with 0005) in the Supabase SQL editor, and confirm SUPABASE_URL + SUPABASE_SERVICE_KEY exist in Vercel env, so signups persist instead of falling back to mailto.**
- **Route-report PDF export** (6-page) built; the send-loop degrades gracefully (lead captured without keys).

### Skill surface + crawl signals (2026-07-28 — all LIVE)
- **351/351 skills carry a mark, a definition, and an unlock list.** The glossary builder used to emit "sits below the share floor, so no unlock list yet" for 66 skills (ZBrush, the whole AEC tool family) — publishing a skill while telling the reader it was unusable. Unlocks now fall through three evidence tiers (top-20 profiles → full posting corpus at ≥3 mentions → hand-map for noise-level collisions like Dynamo/DynamoDB). Definitions are slug-keyed in `scripts/skill_definitions.py`; the profile-derived fallback line is a bug signal, not a resting state.
- **Skill marks**: simple-icons (83) → Font Awesome Free brands (5: AWS, Java, Salesforce, Microsoft — what simple-icons dropped at brand request) → 263 house glyphs in `scripts/skill-glyphs.mjs` for the concepts no logo exists for. Adobe, Tableau, MATLAB and most AEC tools are in neither library. Brand marks fill, house glyphs stroke. Rendered on job chips, the skill sheet, and every glossary entry.
- **Skill definition sheet** replaces the jump-to-glossary on both the instrument and job pages: a Swiss card over the page with the definition, unlock links, and "show in glossary". Chips keep real hrefs (cmd-click / no-JS still work).
- **Glossary is three tabs** (terms / sources / skill bank) instead of one 62,000px scroll; deep links land at the 80px sticky offset.
- **Lexicon +68 domain terms** (education, culinary, legal, trades, clinical, finance, media, aviation, logistics, real estate, lab science, library, creative 3D). Teacher, chef, cook, welder, carpenter emit routes for the first time; 974 → 989. Seven greedy aliases cut after reach audits — "interpreting" matched *interpreting blueprints*, "aviation" matched construction firms listing market sectors. **Rule: audit alias reach after every lexicon change; a term in 10+ unrelated occupations is a false positive, not a popular skill.**
- **Canonical tags** on the homepage, /about, /blog (were missing; every other page had one). The homepage is a client component so it cannot export `metadata` — React 19 hoists a rendered `<link>` into `<head>`, so no page split was needed.
- **Per-page sitemap `lastmod`** (`scripts/build-lastmod.py`): hashes the data behind each URL, advances the date only when the hash moves. Previously every URL carried the build time, so all 1,821 pages claimed to change nightly — the textbook untrustworthy-lastmod pattern Google discounts. 741 of 1,867 URLs now carry an honest date; editorial pages carry none rather than a fake one.
- **IndexNow submits only changed URLs** (was: the whole sitemap, nightly). `--all` retained for structural changes.
- **Pipeline gap closed**: `build-jobs.py` is not part of `scrape -- run`, so running the scrape by hand refreshes the graph and leaves the board a day stale — this is what made a posting listing TypeScript show no skill chips. `build-skill-icons.mjs` was likewise never in `daily-run.sh`. Both wired. **Correct order: `scrape -- run` → export-web-data → fetch-logos → build-jobs → build-skill-icons → build-skill-glossary → build-lastmod → next build.**

---

## Pending

### Near-term (do now / this week)
- **[USER] Search Console**: resubmit sitemap (~1,370 URLs), Request Indexing on ~20 best new pages (origin pages, visa-sponsorship-in-the-united-states, top occ×country). **Bing Webmaster Tools**: verify once (pairs with IndexNow).
- **[USER] Export loop wiring**: Postmark domain verify + Anthropic API key + pick render env (Vercel Pro vs VPS) — then the PDF send-loop goes fully live.
- Let the ~800 board pages + 124 origin pages **index for 4–6 weeks** before minting more board combos (the Teal entity-flip warning, docs/24).

### Soon (2–4 weeks — authority content)
- ~~"X vs Y career" comparison pages~~ ✅ shipped 2026-07-26 (554 pages).
- **Engineering-story blog posts** as link bait: "one word, two professions" (architect disambiguation), the dental-hygienist forensics.
- **Blog cadence**: one data post/month, each with one uncopyable number.

### LATAM sources (2026-07-27)
- **GetOnBoard** (keyless): ADDED as data-only (511 LATAM tech jobs, enriches adjacency). To DISPLAY: email GetOnBoard for re-display + backlink permission, then add 'getonbrd' to build-jobs.py OK set.
- **Careerjet v4** (display-permitted): adapter BUILT, key-gated on `CAREERJET_API_KEY` (repo secret). **BLOCKED on infra**: Careerjet mandates a server-IP allow-list (≤8 IPs); the GitHub Actions nightly egresses from ~7,300 rotating CIDR ranges, so it can't be satisfied from Actions. Careerjet only fires from a declared static IP (a VPS). Hold until a static-IP host exists; key can sit in secrets meanwhile.
- Adzuna br+mx already on (data-only).

### Parked, designed, ship when current pages index (~2–4 weeks from 2026-07-28)
- **The skill surface (/skills/<id>, ~351 pages — lexicon grew 283 → 351 on 2026-07-28)** — the skill-first inversion of title-based IA; the structural proof of the skills-over-titles thesis. Per-skill page: unlock list (occupations weighted by demand share, LIVE job counts), the matrix graphic, co-occurring skills (skill-cooccur), bridge score, links into boards/routes/glossary. ALL DATA EXISTS (skills-glossary unlocks + profiles + cooccur + bridge analysis) — the build is presentation only. Threshold-gate like every surface; skills below the data floor get no page.
  - **OG graphics**: per-skill generated card (Next ImageResponse; Swiss, mono numbers: skill → top unlocks → counts). The "graphic combos" done as og-images attached to real pages, NOT standalone image pages.
  - **Skill-combo pages: NO** (283² = the thin-content trap we pruned from compare). The instrument handles arbitrary combos live. Exception: ≤20 curated iconic "stacks" later, only if search data asks.
  - **PDF section** "Beyond this route: what your skills unlock" — bundle with the §C export wiring (Postmark + Anthropic key), not before.
  - Pairs with the Adjacency Index ("passports" section, expanded page-by-page). Interlink with /jobs/<tag> pages, don't duplicate: tag pages = listings intent, skill pages = career-value intent.
  - **Gate to start**: GSC shows the July surfaces (compare/regions/AEO posts) substantially indexed — recheck discovered-not-indexed trend before minting.

### Internal linking + funnel (2026-07-28 — SHIPPED)
*Measured the link graph across all 6,355 built pages before touching anything. The 125 `/routes/<origin>` pages were reachable from 831 pages and from none of the obvious ones: zero links from the 4,477 job pages, zero from 157 salary pages, zero from 126 route pairs (a pair page did not link its own origin hub), zero between sibling origins. Meanwhile every page fired 11 sitewide footer links at hubs already one click from everywhere.*
- **Pages linking to origin pages: 831 → 5,080.** Job pages (noindex,follow — they cannot rank, so they are pure link equity), salary pages, and route-pair breadcrumbs now all point at them. `hasOriginPage()` guards every one, since the origin set is threshold-gated.
- **Job pages**: related-jobs module (5 siblings, the industry standard — WWR runs the same) *plus* an adjacent-occupation module that no competitor can build: "9 open interior designer roles · 53% readiness from architect", pointing at indexable board pages rather than deeper into the noindex pool.
- **Salary pages**: "Roles that pay more, that these skills already reach" — median from each destination's own postings, the delta, the readiness, a link to live listings. The FairElephant offer-checker was the primary CTA, sending the warmest traffic on the page to a side product; now demoted below it.
- **CTAs follow landing intent**, not one template. Route pair (destination already chosen) → count-gated board CTA. Origin page (still exploring) → the instrument, but the promise is the outcome: "180 of these roles are open right now." No-board routes fall back rather than promising an empty page.
- **Anchor variation**: five phrasings per origin page, stable per page id. Corpus went from effectively one phrase to 584 distinct phrasings over 5,387 links, exact-match at 22% (the research band is 15–25%).
- **Still open from this pass**: sibling-origin cross-links (architect ↔ interior designer origin pages), and the footer's 11 sitewide links are still diluting — worth pruning to the few that earn their place.

### The graph, made smarter (designed 2026-07-28 — ordered by value per hour)
*Finding: the instrument is the least informed surface in the product. Every route emits 26 fields; the detail panel renders about nine. The PDF report and the route pages already know more about a route than the graph does. Most of this is showing what we compute, not computing more.*

- **The waterfall in the detail panel** *(start here)*. `waterfall` is emitted per route and used only by the PDF and compare pages. It decomposes the match point-by-point: Revit worth 17.4, earned 17.4; Space Planning worth 13.9, **earned 0**. Turns an opaque "53%" into an argument, and answers "what should I learn next" directly — the largest unearned row is the highest-leverage skill. Each row is a skill, so clicking one opens the skill sheet we shipped: connects two systems that currently don't know about each other. **Acceptance: earned points must sum to the displayed match** (a correctness test, not a visual one).
- **Salary as a signed delta.** Both `salary_band`s are raw numbers; the panel shows two formatted strings and makes the reader do the arithmetic. "−$8k median" is the fact most likely to change a decision.
- **Confidence made visible.** `provenance.postings` per route is emitted and used only by the PDF; `low_confidence` is emitted and **used nowhere at all**. A route backed by 460 postings currently looks identical to one backed by 30. For a product whose promise is honest numbers, uniform confidence is the wrong thing to hide.
- **Separations on the origin node.** `origin.separations` (BLS annual transfer/exit) reaches route pages but not the graph. "About 1 in 30 architects changes occupation in a year — here's where they go" reframes the whole instrument honestly.
- **US/EU disagreement as editorial signal.** `mobility_eu` is computed and never displayed. A move common in Flanders and rare in the US is interesting, and no competitor can say it. The scraper README already calls disagreement editorial signal.
- **"What if I learned this?"** — the flagship. Tick a skill, watch matches recompute and ring-2 roles cross into ring 1. Match is deterministic from skill coverage and `rankPersonalized` already exists in `personalize.js`, so the machinery is largely there. This is what turns a chart into the instrument CLAUDE.md says it is, and it is the most screenshot-able thing on the site.
- **Skill-first traversal** (cheaper cousin): click a skill → dim the graph to routes that need it. "Where does Revit actually take me?" reuses the sheet.
- **Out of scope by design**: no new nodes (25/34 is tuned, label clearance is the hard part), no position transitions, no third typeface, no D3, accent stays on the data. None of the above needs any of them — it is detail-panel work plus one recompute path.

### Later (this quarter — ceiling-raisers)
- **The Adjacency Index** — annual data report at a stable URL (docs/07 spec); the backlink magnet everything compounds on.
- **Automation Phase B**: move the nightly bot to GitHub Actions (laptop-independent). Needs repo secrets (Adzuna/Reed/USAJOBS keys).
- **Ghost-job / stale detection**: weekly liveness re-crawl (404/expired), >60d flags (first-seen ledger already in place).
- **Employer-side surfaces** (when paid board has inventory): company pages (Himalayas/BuiltIn lattice), JobPosting schema on first-party listings, title×company salary pages.
  - **Indexing API: assume it stays shut (checked 2026-07-28).** It only accepts JobPosting/BroadcastEvent, and Google **froze quota-increase approvals in October 2025** after spammers pushed fake/expired jobs and SERP redirects through it, multiplying quota across subdomains. The application form is still live with no reliable review behind it; legitimate boards wait months. Google's own line is that it discovered job postings fine before the API existed. Reopening, if it happens, likely favours large established boards — so this **grandfathers incumbents and is a structural barrier to new job boards**. Plan the first-party listing play on ordinary crawling; treat API access as upside, never as the mechanism.
  - Note the same dynamic upstream: Google for Jobs sits above organic results (23 boards complained to the EU in 2019; Jobindex reported −20% search traffic), and AI Overviews cut position-one CTR 34–61%. **Conclusion: do not fight for the listing surface. The moat is the instrument** — which is what docs/24 already concluded independently.
- **Lexicon depth** beyond healthcare: ESCO + O*NET gazetteer mining (human-reviewed).

### Never (the casualty list, docs/24)
- Templated prose pages (what-does-X-do, how-to-become at scale) — the wiped class. Unbounded cross-products. Domain rebrands. Judging progress by Semrush over Search Console.

---

## Calibration
From the site doing 5M organic clicks/year (Himalayas, docs/24): **3–6 months to meaningful traffic, compounding at 6–12.** The surface is built; from here it's authority pieces + patience + the nightly bot compounding the data underneath.

---

# THE WIRING CHECKLIST — every pending step, exactly

*This section is the single source of truth for what remains. Three items need the founder's accounts; the build work that follows each is Claude's. Check items off as they land.*

## A. Search Console + Bing (founder, ~15 min) — do first

**A1. Open Search Console.** https://search.google.com/search-console — sign in with the Google account that owns pivothop.com. The property should already exist (the site is indexed); pick it in the top-left property dropdown. If it doesn't exist: Add property → **Domain** → `pivothop.com` → Google shows a TXT record → Cloudflare → DNS → Add record → Type TXT, Name `@`, paste the value → Save → back in GSC press Verify (give it a few minutes).

**A2. Submit the sitemap.** Left menu → *Sitemaps* (under Indexing) → in "Add a new sitemap" enter `https://www.pivothop.com/sitemap.xml` → Submit. Status should read *Success* with ~1,370 discovered URLs (the count can take a day to appear). One-time: it stays submitted and re-reads nightly.

**A3. Request indexing on the priority pages.** Top search bar ("Inspect any URL") → paste a URL → wait for the check → press **Request indexing** → next URL. The daily quota is ~10 per property, so do 10 today and 10 tomorrow, in this order:

Day 1: `/routes/architect` · `/routes/registered-nurse` · `/routes/software-engineer` · `/routes/accountant` · `/routes/teacher` · `/routes/data-analyst` · `/routes/project-manager` · `/routes/graphic-designer` · `/jobs/browse` · `/jobs/visa-sponsorship-in-united-states`
Day 2: `/jobs/remote` · `/jobs/remote-in-germany` · `/jobs/software-engineer-in-united-states` · `/jobs/remote-software-engineer-in-united-states` · `/jobs/data-analyst-over-100k` · `/jobs/senior-software-engineer` · `/jobs/remote-design` · `/routes/medical-assistant` · `/routes/electrician` · `/blog/why-recruiters-ghost`
(All prefixed https://www.pivothop.com)

**A4. Bing (2 min).** https://www.bing.com/webmasters → sign in → **"Import from Google Search Console"** → authorize → done. Bing pulls the site + sitemap automatically and pairs with the IndexNow pings already firing nightly.

**A5. What to watch (weekly, not daily).** GSC → Indexing → Pages: the "Crawled – currently not indexed" line is the health metric (normal to be large at first, should shrink over weeks). GSC → Performance: real clicks/queries. Trust GSC numbers only — Semrush-type tools undercount our long tail ~7× (docs/24).

## B. Nightly bot → GitHub Actions (Phase B — ✅ PROVEN GREEN END-TO-END 2026-07-26)

**First autonomous publish: commit `e90c8da` — "data: nightly scrape 2026-07-26 (4305 board listings)", authored by pivothop-bot, deployed by Vercel.** Full chain verified in CI: 15 sources in parallel (~2 min warm) → 182,773-row accumulated corpus → dedup −19,141 → gold 67/67 → sanity clean → purity canary → 5,688 pages built, 194,961 internal links all resolve → publish → IndexNow 200. Runs nightly at 08:00 UTC (02:00 local), cron + manual dispatch.

What it took (the debugging record, for posterity): parallel source ingest (sequential was 5+ h; Adzuna alone 310 min) · Adzuna ÷4 nightly term rotation at 2 pages · corpus + HTTP cache persisted in Actions cache and seeded once from the laptop · salary links re-gated on the generator's own predicate (the link gate caught the divergence) · 8GB Node heap (normalize OOM'd at the default). Secrets: 7 set, write-only. Seed release + workflow deleted after green.

**Post-green incidents, both closed (2026-07-26):**
- **Cron proven:** the first scheduled run (GitHub delayed it ~09:49 UTC — normal cron lag) ran green and published `bf4bd61` autonomously.
- **Vercel "Deployment was blocked"** on both bot publishes: Vercel Hobby only auto-deploys commits **authored by the account owner** — the `pivothop-bot` identity was rejected. Fix: the nightly commit now carries the owner identity (`ci-run.sh`); bot publishes stay identifiable by their `data: nightly scrape` message. (If the project ever moves to a Vercel team, team-member authors work too.)
- **Laptop bot retired** (`launchctl unload` done) — GitHub Actions is the only bot. To watch or re-run: GitHub → repo → **Actions** → nightly-scrape. Re-arm the laptop anytime with `launchctl load ~/Library/LaunchAgents/com.pivothop.scraper.daily.plist`.

## C. PDF route-report export — go fully live (founder: ~20 min, then Claude finishes)

The loop is built and degrades gracefully (today: leads captured, no email sent). Three founder steps flip it on:

**C1. Postmark** (account exists; needs domain + token):
1. postmarkapp.com → Sender Signatures → **Add Domain** → `pivothop.com`.
2. Postmark shows two DNS records → add both in Cloudflare DNS: the **DKIM TXT** record, and the **Return-Path CNAME** — the CNAME must be **DNS-only (grey cloud)**. Do NOT add another SPF record (one already exists for Cloudflare Email Routing; a second breaks both).
3. Back in Postmark press Verify on both → then Servers → (default server) → **API Tokens** → copy the Server API Token.
4. Vercel → pivothop project → Settings → Environment Variables → add `POSTMARK_SERVER_TOKEN` (the token) and `POSTMARK_FROM` (e.g. `reports@pivothop.com`). Paste keys ONLY there.

**C2. Anthropic key** (for the AI-written plan prose; without it the templated fallback ships): console.anthropic.com → API Keys → create → Vercel env `ANTHROPIC_API_KEY`.

**C3. Pick the render environment** (the one real decision):
- **Vercel Pro** (~$20/mo): 60s function limit fits the PDF render; then Claude installs `puppeteer-core` + `@sparticuz/chromium` and sets `serverExternalPackages` — render works with no further change (the code already loads them at runtime).
- **or the VPS** (already in the stack plan): Claude moves rendering behind a tiny endpoint there instead.

**Also:** run migration `supabase/migrations/0005_roadmap_leads.sql` in the Supabase SQL editor (one paste-and-run) so leads persist.

**Then Claude finishes:** install render deps for the chosen env, end-to-end test to the founder's inbox, deploy. The graph's "Send my report" then delivers the six-page PDF for real.

## D. Claude's build queue after A–C (no founder action)
1. "X vs Y career" comparison pages (~100–150, data-first — the class that survives Google updates).
2. Engineering-story posts ("one word, two professions"; the dental-hygienist forensics).
3. The Adjacency Index annual report (docs/07) + its launch distribution.
4. Ghost-job liveness re-crawl (weekly 404/expired check on live URLs).
5. Employer-side surfaces when the paid board has inventory (company pages, JobPosting schema + Indexing API).
