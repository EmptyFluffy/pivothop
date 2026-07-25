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
