# PivotHop — Project Status

*Living checklist of what's shipped, in flight, and pending. Updated 2026-07-25. Companion to docs/23 (automation), docs/24 (competitor SEO research). "Shipped" = deployed to production and verified.*

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
- **Nightly bot ARMED** — launchd `com.pivothop.scraper.daily`, 07:15. `daily-run.sh` is fully gated: verify → exports → web build → link gate → auto-commit + push (Vercel deploy) → IndexNow ping. Red gate keeps yesterday's data + drops a `LAST-RUN-FAILED` marker. Implausible-diff tripwire.

### SEO surfaces
- **~800 job category pages** (`/jobs/<tag>`): single-dim + 2-dim + 3-dim + occupation-level combos ("software engineer jobs in germany", "remote design jobs in the united states", pay×occ, visa×country…), all ≥6-listing gated, unique per-page copy, `/jobs/browse` hub.
- **124 per-origin pages** (`/routes/<origin>`): "Alternative careers for [X]", every measured route ranked — the winnable SERP from docs/24.
- **126 route pages + 156 salary pages** (pre-existing), route FAQs expanded (license + skills questions) with FAQPage schema.
- **Cross-link mesh**: "More [role] searches" on occupation pages; "By starting point" on the routes hub.
- **Discovery plumbing**: IndexNow (key + nightly ping), `llms.txt`, blog RSS `/feed.xml`, sitemap `lastModified`, ItemList schema on category + origin pages, Article/FAQ/Breadcrumb schema.
- **Company logos on every job card** (2026-07-25): retrieved favicon (ATS-slug → domain → Google favicon, globe-filtered) or neutral monogram fallback; `fetch-logos.mjs` grows the library nightly.
- **Category-page FAQ enrichment** (2026-07-25): every category page carries a data-driven Quick-answers block (live count + freshness, this filter's own posted pay band, a kind-specific question — routes-in for occupations, top fields per country, top roles per field, visa honesty — and the instrument funnel) with FAQPage schema and 2–5 internal links per block into salary/routes/sibling pages.

### Content
- Blog: career-adjacency method post, **recruiter-ghosting post** (~2k words, sourced). Voice + method in docs/01, docs/07.

### Product
- The instrument (force-directed skill graph), route/salary/jobs surfaces, FairElephant companion, employer post form ($49/$99 launch), graph → jobs destination CTA.
- **Route-report PDF export** (6-page) built; the send-loop degrades gracefully (lead captured without keys).

---

## Pending

### Near-term (do now / this week)
- **[USER] Search Console**: resubmit sitemap (~1,370 URLs), Request Indexing on ~20 best new pages (origin pages, visa-sponsorship-in-the-united-states, top occ×country). **Bing Webmaster Tools**: verify once (pairs with IndexNow).
- **[USER] Export loop wiring**: Postmark domain verify + Anthropic API key + pick render env (Vercel Pro vs VPS) — then the PDF send-loop goes fully live.
- Let the ~800 board pages + 124 origin pages **index for 4–6 weeks** before minting more board combos (the Teal entity-flip warning, docs/24).

### Soon (2–4 weeks — authority content)
- **"X vs Y career" comparison pages** — the one programmatic class that survived every Google purge (docs/24), data-first from adjacency scores. ~100–150 pages.
- **Engineering-story blog posts** as link bait: "one word, two professions" (architect disambiguation), the dental-hygienist forensics.
- **Blog cadence**: one data post/month, each with one uncopyable number.

### Later (this quarter — ceiling-raisers)
- **The Adjacency Index** — annual data report at a stable URL (docs/07 spec); the backlink magnet everything compounds on.
- **Automation Phase B**: move the nightly bot to GitHub Actions (laptop-independent). Needs repo secrets (Adzuna/Reed/USAJOBS keys).
- **Ghost-job / stale detection**: weekly liveness re-crawl (404/expired), >60d flags (first-seen ledger already in place).
- **Employer-side surfaces** (when paid board has inventory): company pages (Himalayas/BuiltIn lattice), JobPosting schema + Google Indexing API on first-party listings (+94–182% per Google case studies), title×company salary pages.
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

## B. Nightly bot → GitHub Actions (Phase B — founder: 5 min, then Claude builds)

Today the bot runs on the laptop (launchd 07:15, fully gated). Laptop off = no data refresh (site stays up). To make it laptop-independent:

**Founder step — add the API keys as repo secrets:** GitHub → EmptyFluffy/pivothop → Settings → Secrets and variables → **Actions** → New repository secret, one per row (values are in the local `apps/scraper/.env` — copy each, never commit the file):
- `ADZUNA_APP_ID` · `ADZUNA_APP_KEY` · `REED_API_KEY` · `USAJOBS_API_KEY` · `USAJOBS_EMAIL`
- Optional (Supabase mirror): `SUPABASE_URL` · `SUPABASE_SERVICE_KEY`

**Then Claude builds:** `.github/workflows/nightly-scrape.yml` — nightly schedule, full gated chain (same gates as daily-run.sh: gold 67 + sanity + purity + link gate), commit + push on green (which deploys via Vercel), IndexNow ping, red-gate = no publish. The laptop launchd agent then gets unloaded.

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
