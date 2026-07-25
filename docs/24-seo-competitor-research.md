# PivotHop — Competitor SEO Research

*Three research passes, run 2026-07-25. Pass 1: sitemap forensics (page counts measured by crawling robots.txt + sitemaps and counting `<loc>` entries). Pass 2: strategy teardowns (founder interviews, first-party playbooks, Semrush/Ahrefs estimates). Pass 3: casualty forensics (Sistrix visibility indexes, Google update history). "Measured" means a named tool + date; "self-reported" and "estimate" are labeled. Preserved here because the conclusions drive the SEO roadmap.*

---

## 1. Page counts (measured 2026-07)

| Site | Indexable pages | Reality behind the number |
|---|---|---|
| Indeed | ~10⁸ (est.) | 12.8M ranking keywords (Ahrefs); 400M visits/mo, 154M organic (Semrush 6/2026) |
| Glassdoor | ~10⁶–10⁷ (est.) | 5.5M keywords; 27.5M visits/mo. No public sitemap |
| **Zippia** | **~2–3M** (sampled sitemap index, 228 children) | Volume play. Editorial sitemap now returns **0 URLs** |
| **Himalayas** | **860,137 exact** | 61% is candidate-profile mass; mints inventory-less combos ("React jobs in Chad") |
| RemoteOK | ~385k listed; **~26k real SEO surface** | The famous tag layer is only **233 tag pages**; ~294k user profiles pad the count |
| BuiltIn | ~57k accessible | 40k editorial + company/city directories; city domains (builtinchicago.org…) still live, never consolidated |
| CareerKarma | ~12k | Post-collapse skeleton; "careers" library down to **18 pages**; comparisons (5,621) survived |
| **levels.fyi** | **11,412 exact** | The authority play. Money pages aren't even in the sitemap and still rank top-5 |
| WWR / Wellfound / Teal | unverifiable | Sitemaps behind Cloudflare/DataDome bot walls |
| **PivotHop** | **~1,243** (2026-07-25) | ~800 board categories + 132 occupation boards + 126 routes + 156 salary + blog/core |

## 2. The casualty record (measured)

- **Zippia: −76.38% Google US visibility during 2024** (Sistrix IndexWatch, pub. 2025-02-06). Self-claimed 7M visits/mo (Jan 2023) → ~531k total/mo (Semrush 6/2026) ≈ **−97% from peak**. DR still 88 — authority intact, traffic gone: the post-update signature. Hit by the March 2024 core/spam ("scaled content abuse"), not clearly HCU.
- **CareerKarma: ~−95% from its 3M/mo self-claim** (~151k now, Similarweb 6/2026). Two layoff rounds (2022, 2023); founders' new AI company now owns it. Confounded with the bootcamp-market collapse.
- **Glassdoor −46.47% during 2023** (HCU year); **Indeed −52.17 Sistrix points during 2024** — yet Indeed still holds 154M organic/mo because its pages front real inventory.
- **What got wiped** (Sistrix/Amsive pattern): scaled templated informational pages with no proprietary data or transaction behind them — "what does a [X] do", skills lists, best-states, job-description templates, "how to become" affiliate funnels, every-variation-of-a-topic programmatic prose.
- **What survived:** pages fronting live inventory (Indeed postings), proprietary crowdsourced data (levels.fyi), employer-paid profiles (BuiltIn — traffic ~flat since 2020, never collapsed).
- **Checked negative:** no job board has been hit by site-reputation-abuse enforcement (that wave hit coupon sections on news sites; Forbes Advisor deindexed Nov 2024).

**The verdict in one line: authority beats volume — levels.fyi outranks Zippia with 1/200th the pages — and every durable page fronts data its site uniquely computes.**

## 3. The Himalayas playbook (their founders' own guides — cavuno.com, Jan–Feb 2026)

The closest thing to a published job-board SEO manual, from a site reporting **5M organic clicks / 365M impressions in 12 months** (their GSC figure; Semrush estimates them at only ~59k/mo — third-party tools undercount programmatic long-tail by ~7x, so **trust Search Console, not estimate tools**).

- **Category pages, not listings, drive the majority of sustainable job-board organic traffic.**
- **Don't index pages with fewer than ~5–10 active listings** (independently converges on our ≥6 threshold).
- Start with 40–50 high-quality pages before scaling; "crawled – currently not indexed" is the #1 job-board Search Console problem.
- 7+ internal links per page; hub-and-spoke with breadcrumbs; link traffic pages → money pages with next-intent anchors.
- Keyword selection by pain point over volume ("where to post developer jobs", 800/mo, beats 12k/mo head terms on business value).
- JobPosting schema on job detail pages only, never on category pages. Google Indexing API cuts job-page indexing from 48–72h to 4–6h (first-party listings only).
- **Timeline honesty: 3–6 months to meaningful traffic; compounding at 6–12; 12+ for authority content.**

## 4. The Teal warning (founder's own post-mortem, Jan 2026)

Teal (20–30k resume pages, ~1M organic clicks/mo) reverse-proxied a **3M-page job board** onto its domain. Result: money keywords ("resume builder") tanked *without those pages changing* — the ~100:1 page-ratio flipped Google's entity classification of the domain from "resume tool" to "job site". Fix direction: hub pages + deliberate internal-linking architecture, not volume.

**For PivotHop:** the board surface is ~75% of our sitemap; the moat is the instrument (routes/salary/adjacency). Detail pages stay noindexed, hubs and cross-link mesh exist — and future growth should favor **authority surfaces** over more board combos.

## 5. levels.fyi mechanics (the model to copy)

- One uncopyable crowdsourced dataset + one **normalization standard** (their leveling map ≈ our skill-adjacency scores).
- Tiny page count, all data-dense: title×level×city leaderboards, per-company salary pages (top-5 for "amazon software engineer salary"), 16 `/reports` pages.
- **Annual pay report at a stable URL** = the recurring press/backlink magnet (CNBC, Forbes).
- **Engineering-story posts as link bait**: their "we ran millions of users on Google Sheets" post earned HN/press links for years.
- Seeded growth by answering questions on Blind where the audience already was. Zero ad spend.

## 6. Verified numbers worth reusing

- JobPosting structured data: **Monster India +94%**, **Jobrapido +182%** organic to job pages (Google first-party case studies) — applies to first-party listings (our employer board, later).
- Domain migrations: **229-day average recovery, 42% never recover** (SEJ 2023 study of 171 migrations) — never rebrand the domain.
- RemoteOK today: position 18 for "remote jobs" — even originals fade without a moat; WWR survives on 12 years of brand/backlink age.
- RemoteOK's real tag surface: 233 pages. Bounded, inventory-backed landing layers beat unbounded cross-products (Himalayas' "documentation jobs in Antarctica").

## 7. What this means for PivotHop — the roadmap

**Already compliant / shipped (2026-07):** ≥6-listing threshold on all ~800 category pages; unique computed data per page; detail pages noindexed; hub + cross-link mesh; IndexNow; llms.txt; FAQPage schema on routes; link-integrity + purity gates; nightly gated bot.

**Do next (authority surfaces, in order):**
1. **Per-origin "alternative careers for [X]" pages** — the SERP is held by niche blogs (winnable); the content is our adjacency data verbatim. ~130–160 pages at `/routes/[origin]`.
2. **Data-first "X vs Y career" comparisons** — prose comparisons lose to institutions; comparisons backed by proprietary numbers survived even CareerKarma's collapse. We hold both sides of every pair.
3. **The Adjacency Index** (docs/07 spec) — the annual data report at a stable URL; the levels.fyi backlink play.
4. **Engineering-story posts** — "one word, two professions" (architect disambiguation), the dental-hygienist forensics. Cheap, genuinely linkable.
5. **Later, employer-side:** company pages as an SEO lattice (Himalayas/BuiltIn), JobPosting schema + Indexing API on first-party paid listings, title×company salary pages.

**Never do:** templated prose page types (what-does-X-do, how-to-become at scale) — that's the wiped class; unbounded cross-products; a domain rebrand; letting a WAF challenge legitimate non-Google crawlers.

**Measurement:** judge by Search Console, not Semrush/Ahrefs estimates; expect 3–6 months to meaningful traffic; watch "crawled – currently not indexed" as the primary health metric.
