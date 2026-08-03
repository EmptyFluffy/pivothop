# Switzerland as the niche

*Due diligence on refocusing PivotHop as a Swiss business for the Swiss market,
researched 2026-08-01. The founder's partner is Swiss; the theory is that a local
tool in a local niche beats competing with US brands on their own field. Verdict
up front: **the thesis is stronger than the founder suspects, and the hard part
is not the market or the languages — it is the data.***

---

## What the theory gets right

**"Quereinsteiger" is a word.** In English, "career changer" is a description; in
the German-speaking job market it is a *category*, with its own job-board filters,
its own guides, and postings explicitly advertising for it. A market that has a
word for your user has demand. There is even a dedicated Swiss career-changer
board (derquereinstieg.ch, ~425 explicitly Quereinsteiger-tagged positions) — a
validation and a study object, not a serious competitor.

**The shortage is measured, national, and official.** The Adecco/University of
Zurich skills-shortage index finds shortage in **32 of 55 occupational groups**;
unemployment is ~2.8%, historically low. Employers cannot fill roles, retraining
times have been deliberately shortened (3–6 month certificates in several
trades), and "Fachkräftemangel" is standing national news. A tool that tells an
employer *who could do this job and never applied* is aimed at the exact wound.

**Local wins locally.** Swiss buyers demonstrably prefer Swiss tools (.ch domain,
Swiss hosting, CHF invoicing, a Swiss founder's name on the about page), and the
big US brands do not localize here — HiringCafe, LinkedIn's career tools, none
of them speak to the Swiss system of Berufslehre, eidg. Fachausweis and
reglementierte Berufe. The moat the US market never gives us — being *from
here* — is available.

**Monetization ceiling is far higher per unit.** A single posting on jobs.ch
costs employers roughly CHF 1,000+. The willingness-to-pay baseline for
recruiting products in Switzerland is a different order of magnitude from the
US-anonymous-web baseline. The adjacent-talent board thesis prices better here.

**The Swiss credential system is PivotHop-shaped.** Switzerland runs on
regulated, documented pathways: ~230 federally recognized apprenticeship
professions, a public list of reglementierte Berufe (SBFI), official crosswalks
(CH-ISCO-19, BFS). Our licence-gate honesty — "no amount of skill overlap
shortens a credential" — is not a nice-to-have there; it is how the whole labor
market already thinks. And our taxonomy already carries an ISCO crosswalk
(`isco-crosswalk.json`), which is the Swiss system's own spine.

## What the theory underestimates

**1. The data problem is severe, and it is the gate — again.**
Adzuna, 75% of our corpus, **does not operate in Switzerland at all** (no CH in
its country list; our own config confirms). Our current corpus contains
approximately zero Swiss postings beyond stray Greenhouse/Lever companies with
Zurich offices. A Swiss PivotHop starts from an empty corpus. The options:

| source | nature | cost/risk |
|---|---|---|
| **Job-Room (arbeit.swiss)** | SECO's public government portal; has an API (the alv-ch open-source project) | keyless/public — VERIFY terms; the anchor source if usable |
| **x28 AG** | crawls ~250k CH postings directly from employer sites; sells API access | commercial, paid — the "buy the corpus" option; also powers job-radar.ch and the academic Swiss Job Tracker |
| **jobs.ch / JobCloud** | market leader, ~110–150k ads | scraping against ToS of the company we might later partner with — poor idea |
| **Direct employer crawling** | our Greenhouse/Lever/Ashby model, Swiss scale-ups | free, thin — Swiss SMEs are on Abacus/Umantis-style local HR systems, not US ATSs |
| **Jobich.ch** | aggregates 43+ Swiss boards | someone else's aggregation; same syndication-echo problem we refuse elsewhere |

**2. Salaries are not posted.** Swiss job ads famously omit pay. Our salary bands
would go dark — UNLESS we anchor on the **BFS Lohnstrukturerhebung / Salarium**
(the federal wage-structure survey, public, official, per-occupation, per-region,
per-age). Arguably *better* than posted-salary spreads: "the official federal
statistics say" beats "179 postings state pay" for Swiss credibility. Real work
to wire, but public and free.

**3. Languages are the critical path, not polish.** UI in DE/FR/EN minimum
(Italian deferrable; Romansh no). More importantly the *miner* must read German
and French postings: German title mapping (compound splitting — head-final, the
opposite problem from Spanish) was measured at 2% of the problem globally and
deferred; **for a Swiss corpus it becomes ~65% of the problem**. French phase 3
becomes the Romandie market. The i18n architecture (docs/27) was built for
exactly this; the phases just re-prioritize.

**4. US mobility data does not transfer.** Our observed-flow numbers are CPS/SIPP
(US) with an EU (Belgian) secondary. Swiss-observed mobility would need BFS
labor-market microdata (SESAM/SAKE) — possible, slow. Launch honestly: skill
readiness measured from Swiss postings, mobility labeled as EU-observed until a
Swiss source exists. The honesty rule already covers this.

## How it would actually look

- **Brand:** keep PivotHop, add the Swiss surface. `pivothop.ch`, hero in the
  house pattern which translates cleanly: **"Berufswechsel, vermessen."** /
  **"Reconversion, mesurée."** The period survives translation.
- **Structure:** Swiss-first *brand and market*, same engine. The corpus gains a
  `country=CH` slice; pages get locale routes (`/de`, `/fr`, defaulting by
  region); the graph, miner, gates and PDF are unchanged. This is a market
  pivot, not a rebuild — the report harness and gold sets protect exactly this
  kind of expansion.
- **Geo:** Vercel provides `x-vercel-ip-country` on every request — middleware
  reads it, no external service. **Suggest, never force:** a dismissible "View
  the Swiss edition?" banner + hreflang alternates. Forced geo-redirects damage
  SEO (Google crawls mostly from the US) and annoy the 25% of Swiss residents
  who are foreign and may want English.
- **Entity:** partner being Swiss makes a Swiss GmbH (CHF 20k capital) or a
  simple Einzelfirma-first path real, which unlocks CHF invoicing, TWINT, Swiss
  hosting claims, and — decisively — being a *Swiss company* in every sales
  conversation.
- **GTM that is Swiss-shaped:** B2C stays free; the money is B2B and it is
  *relationship-sold*: outplacement firms (outplacement is customary and often
  contractual in Swiss redundancies — they buy tools), RAV career counselors
  (cantonal employment offices), and employers in the 32 shortage occupations.
  The concierge V0 model in docs/00 fits Switzerland better than it fits the US.
- **Launch vertical:** architecture carries no special story here. The shortage
  data points at **Pflege (nursing/care), IT, and trades**. Pflege is the
  loudest national Quereinstieg conversation and has federal retraining money
  behind it (Pflegeinitiative) — but it is licence-gated, which our system
  handles *honestly*, and that honesty is a differentiator against retraining
  marketers who oversell.

## The pressure test, summarized

The niche theory holds. The demand exists and is named; the competition is
absent at our specific angle (adjacency measurement — jobs.ch tells you what
IS, nobody measures what you could REACH); the willingness to pay is the best
in Europe; the founder has a genuine local unfair advantage. The two honest
risks are **corpus acquisition** (no Adzuna crutch; Job-Room API viability is
the first thing to verify, x28 the first thing to price) and **the German
miner** (compound splitting moves from phase-2-deferred to critical path).
Both are workable; neither is fast. The market is small (5.2M workforce) but
the thesis was never volume — it is depth in a market that pays.

## Open questions for the founder

1. **Full pivot or Swiss edition?** Recommendation: Swiss-first brand and GTM,
   global engine kept — the US corpus keeps feeding the method and the MCP/AEO
   surface while Switzerland becomes the *business*.
2. **Which language is the partner native in?** DE or FR decides the launch
   region (Deutschschweiz is 65% of the market; Romandie is a fine beachhead
   with jobup.ch culture).
3. **Data budget:** is there appetite to PAY for the first data source (x28) if
   Job-Room's public API proves insufficient? This is the first franc the
   business would spend.
4. **Who sells?** Swiss B2B (outplacement, RAV, employers) is sold in person,
   in German, over months. Is the partner in for that role — and for being the
   Swiss face of a Swiss company?
5. **Which vertical first** — Pflege (loudest need, licence-gated, honesty
   differentiates), IT (easiest data, most competition), or trades?
6. **Kill criteria:** docs/12 exists for the global product. What is the Swiss
   equivalent — e.g. "no Job-Room/x28 viable corpus within N weeks" or "no
   outplacement firm will take a meeting within M months"?
7. **Does the name carry?** "PivotHop" is an anglicism — fine for IT, untested
   for a Pflege audience. Keep the brand, German tagline? Or a Swiss product
   name over the same engine?


---

## The call (researched and answered, 2026-08-01)

**Recommendation: go Swiss-first now, staged, without burning the global boats.**
Not a rebrand-everything pivot — a redirection of all *new* effort while the
automated global machine keeps running at zero marginal cost.

### Why now is the cheapest this pivot will ever be

1. **Nothing to strand.** Pre-revenue, pre-brand (Google was still serving our
   Vercel logo days ago). The sunk cost is the engine — miner, gates, PDF,
   report harness — and it transfers 100%. Every month of further US SEO
   investment raises the cost of this decision; today it is near zero.
2. **The global lane now has a named, funded competitor on our architecture.**
   HiringCafe: 1M MAU, direct-crawl + LLM extraction, currently hiring a
   Founding Head of SEO. Beating that solo on English-language organic is a bad
   fight. Nobody in Switzerland measures adjacency; jobs.ch sells listings, not
   measurement, and derquereinstieg.ch proves the demand at hobby scale.
3. **Revenue is nearer in CH.** The US plan monetizes "after one paying
   employer" with no pipeline. The Swiss plan has named buyer categories —
   outplacement firms (customary in Swiss redundancies), RAV counselors,
   employers in 32 shortage occupations — reachable in person by a native
   partner who already runs our outreach operation.
4. **The corpus risk is testable in days, not months.** The Job-Room API is
   real and documented (api.job-room.ch, contact jobroom-api@seco.admin.ch) —
   and the Stellenmeldepflicht means employers are *legally required* to report
   vacancies in high-unemployment occupations to exactly this system: mandated
   coverage precisely where career-changers are wanted. Bridge scrapers exist
   (Apify: arbeit.swiss, jobscout24); x28 is the paid fallback.
5. **Sequencing dissolves the German blocker.** Launch with Swiss TECH, where a
   large share of ads are in English (SwissDevJobs, englishjobsearch.ch, US-ATS
   companies with Zurich offices) — the miner works day one. German compound
   splitting lands in parallel and unlocks wave 2 (Pflege, trades), where the
   licence-gate honesty moat is deepest.

### The seven questions, answered

1. **Swiss edition, not full pivot.** The nightly global machine is automated
   and free; keep it as method-proof and the MCP/AEO surface. Stop new US GTM
   investment; all new build time goes to CH.
2. **Language:** launch Deutschschweiz regardless (65% of market, shortage
   concentration); if the partner is Romandie-native, ship DE+FR together —
   jobup culture is a genuinely separate market and a native voice there is an
   edge, not a detour.
3. **Data budget: yes, capped.** ~CHF 300/mo ceiling, spent only after the free
   path (Job-Room + direct crawling + bridge scrapers) proves insufficient.
   First action costs nothing: one email to jobroom-api@seco.admin.ch, sent by
   the Swiss partner from the Swiss entity.
4. **Who sells: the partner.** She already operates the outreach console; the
   GmbH makes her the Swiss face, which is the whole local-trust thesis made
   flesh. Engineering, data and product stay on this side.
5. **Vertical: IT first, Pflege second.** IT for data reasons (English ads,
   existing ATS sources, the corpus is strongest there today, and "PivotHop"
   carries in tech). Pflege once the German miner lands — biggest shortage,
   federal retraining money, and the market where honest licence gates
   embarrass the retraining marketers.
6. **Kill criteria, concrete:** Day 14 — Job-Room read access answered OR a
   bridge scraper delivering ≥10k CH postings, else pause. Day 45 — ≥25k CH
   postings AND German titles mapping ≥55%, else reassess. Day 90 — one Swiss
   B2B conversation showing pilot interest, else revert to global-only, which
   never stopped running. Reverting costs almost nothing by construction.
7. **Name: keep PivotHop, add the German tagline** ("Berufswechsel,
   vermessen.") for the IT launch. Revisit only if the Pflege wave tests badly
   against the anglicism.

### What this is, in one sentence

The engine was always the moat and the market was always the question; the data
says the answer is a market that has a word for our user, a law that feeds our
corpus, a price floor ten times the US baseline, and a co-founder who is native
to it.


---

## Competitor deep-dive: business mechanics and growth (researched 2026-08-02)

### JobCloud (jobs.ch, jobup.ch, JobScout24), the incumbent

- **Ownership and scale:** a 50/50 joint venture of TX Group and Ringier, the two
  big Swiss media houses; ~350 employees; crossed **CHF 100M revenue in 2017**;
  holds 49% of Austria's karriere.at. This is the Swiss recruiting establishment,
  not a startup.
- **How they make money:** classic listings economics. Employers pay per posting
  (~CHF 1,000+ on jobs.ch), plus packages, CV-database access, application
  management, and display advertising on the portals. Job seekers pay nothing.
- **How they grew:** consolidation, not product. jobs.ch and jobup.ch merged
  under the JobCloud roof (2013) with media-house distribution behind them; the
  moat is brand default and employer habit, refreshed by acquisitions.
- **What this means for us:** their revenue is LISTING revenue; measurement
  products would neither cannibalize nor tempt them. They are a channel-power
  competitor, not a product competitor, and plausibly an eventual partner or
  acquirer of a proven Swiss data product.

### SwissDevJobs, the proof that a Swiss niche board sustains a business

- **Origin:** 2018 side project by Zurich developers annoyed that job boards
  "looked built in 2002." Bootstrapped, ~5 people, never funded.
- **How they make money:** employer-paid postings with a twist that IS the
  product: **mandatory salary transparency and structured tech-stack data**.
  Standardization is the differentiator in a market of unstructured ads.
- **How they grew:** 80,000+ monthly users; SEO on structured data plus
  developer word-of-mouth; then EXPORTED the playbook (GermanTechJobs.de,
  DevITJobs.fr) rather than widening at home.
- **What this means for us:** the closest existing proof of our exact plan
  shape: a two-person Swiss side project, data-structure-as-product, employer-
  paid, bootstrapped to sustainability. They stopped at transparency; we go to
  measurement. Also a candidate data partner (their postings are structured).

### x28 AG, the data infrastructure (supplier, not competitor)

- **How they make money:** B2B data licensing. They crawl ~250k postings from
  employer sites and sell API access sliced by region/industry/company, plus
  semantic matching (Profilmatcher) and the quarterly Jobradar report.
- **Who buys:** KOF (ETH Zurich), University of Lausanne, cantons, NZZ,
  consultancies, the academic Swiss Job Tracker. Government and research money,
  in significant part.
- **What this means for us:** x28 proves Swiss institutions PAY for labor-market
  data, and that cantons/RAV budgets buy from private data vendors. They are our
  fallback corpus supplier AND evidence for our own B2B pricing thesis. They do
  not serve consumers and do not measure individual adjacency.

### derquereinstieg.ch, the category board

Small, listings-plus-guides economics (employer postings on a niche audience);
its existence and its ~425 tagged ads are the demand proof. Not a business we
compete with so much as a keyword surface we will outrank with data.

### Outplacement (Grass & Partner, Alixio Mobility, LHH, Right Management, von Rohr, Dr. Nadig, Mangold)

- **How they make money:** CHF 10,000–25,000 per person, paid by the FORMER
  employer, customary and often contractual in Swiss redundancy social plans;
  annual contracts with minimum terms at the big firms.
- **How they grew:** relationship sales to HR departments over decades; the
  market was described by hrtoday as "träge" (sluggish) and forced into
  modernization by von Rundstedt's entry with flexible pricing and tooling.
- **What this means for us:** a sluggish, tooling-poor, high-price service
  industry whose unit economics make a CHF 100–150/month counselor seat
  invisible. Buyers, not competitors, and the NZZ-documented pain ("employers
  want a clone of the predecessor") is literally what adjacency measurement
  answers.

### The pattern across all of them

Everyone monetizes EMPLOYERS (listings, data licenses, outplacement mandates);
nobody monetizes measurement for the individual, and nobody sells the employer
the answer to "who could do this job that never applied." The revenue in this
market flows B2B, which is exactly where our plan points.

## Scraping and data-acquisition option analysis (2026-08-02)

| option | volume | cost | legal/terms posture | effort | verdict |
|---|---|---|---|---|---|
| **Careerjet CH locales** | unknown; careerjet.ch aggregates broadly | free (existing key) | terms make re-display the INTENDED use; we already comply (click-tracker attribution) | **config-only: add de_CH/fr_CH/en_CH to an adapter that runs tonight** | **do first, day one** |
| **Job-Room API** (arbeit.swiss) | mandated coverage in shortage occupations via Stellenmeldepflicht | free | government portal, documented API; read-access terms to confirm with SECO | one email + an adapter | **do first, in parallel** |
| **Direct ATS crawl** (Greenhouse/Lever/Ashby CH offices + SwissDevJobs-listed employers) | thin but full-text (skills!) | free | already our model; public JSON endpoints | token curation | do; feeds the SKILL side |
| **Apify bridge scrapers** (arbeit.swiss, JobScout24) | 10k+ plausible | ~usage-priced (small) | third-party scrapers of public listings; fine for VALIDATION, not for permanent re-display | hours | volume validation only, weeks 1–2 |
| **x28 API** | ~250k, the ceiling | commercial; institutional pricing unknown; our cap CHF ~300/mo may not reach it | clean (licensed) | one integration | fallback if free path fails the day-14 gate; also a partnership conversation, not just a purchase |
| **jobs.ch / JobCloud scraping** | high | free | against ToS of the market's establishment and our plausible future partner; CH unfair-competition law (UWG) risk on systematic re-use | — | **refused** |
| **Jobich / aggregator re-scrape** | high | free | scraping an aggregator = syndication echo + double-attribution mess | — | refused (same rule as everywhere) |

**Recommended sequence:** Careerjet CH locales tonight (config), SECO email day
one, ATS tokens for Swiss tech this week, one Apify volume probe to calibrate
the day-14 gate, x28 only if the gate fails. Note the skill-quality caveat from
docs/31 applies in Switzerland too: Careerjet delivers EXCERPTS, so it feeds
counts and salaries; full-text skill profiles come from the ATS crawl and, if
granted, Job-Room.


---

## Architecture decision: one corpus, sliced, honestly labeled (2026-08-02)

Settled with the founder; not to be re-litigated without new evidence.

- **One corpus, one engine.** The CH edition is a country slice of the shared
  corpus, not a fork. Lexicon, taxonomy, extraction, graph, gates, PDF: shared.
- **Demand weights are per-market where the sample allows.** Skill
  RELATIONSHIPS are universal; the 100-point demand WEIGHTS drift by market
  (language requirements, SAP prevalence, local regulation). Per-occupation:
  compute Swiss weights once the CH slice clears the existing sample floor,
  else fall back to the global profile, LABELED as global. Same
  insufficient-data discipline, one more dimension.
- **Licence gates get a CH overlay** from the SBFI reglementierte-Berufe list;
  the US licensing map does not transfer.
- **Mobility** stays geography-labeled (as today with mobility_eu); BFS open
  data upgrades it later without architectural change. **Salaries** per-country
  via Salarium.
- **Language is de-CH, never dialect and never de-DE:** no ß (always ss),
  "Lohn" not "Gehalt", "Ferien" not "Urlaub". Nadine reviews all German copy —
  the native eye is the quality gate.
- **The Swiss cross is regulated** (Swissness Act): permitted for services when
  HQ and administration are in Switzerland — the GmbH earns the flag; until
  then, "Schweizer Ausgabe" as text.
- **Backlink surface is institutional:** berufsberatung.ch (official national
  career portal), cantonal RAV pages, university career services, hrtoday /
  Handelszeitung. Few but mighty, reachable in German in person — Nadine's
  channel, earned by the Swiss launch data-post.


---

## Day one, executed (2026-08-02)

**Job-Room is live in the pipeline.** The portal's own public search endpoint
(`job-room.ch/jobadservice/api/jobAdvertisements/_search`) serves published ads
keyless: **71,702 on first probe**, full-text descriptions, language-tagged
(overwhelmingly German, confirming the miner priority), official AVAM occupation
codes on every ad, canton codes, and the Stellenmeldepflicht flag. The adapter
(`sources/jobroom.js`) ingests nightly with polite paging and a hard page cap;
`avam_code` and `lang` are stored verbatim, because one AVAM-to-taxonomy
crosswalk will beat parsing German compounds title by title, and the data for it
accrues from tonight.

This **passes the day-14 corpus gate (≥10k) by 7x on day zero.** The formal SECO
channel is still worth the email, for blessing and stability; the draft below is
ready for the partner to send.

**Night one and the 10,000-row window (2026-08-03).** The first nightly pull
stopped at exactly 10,000 of 71,320 ads: the backend is Elasticsearch with the
default `max_result_window`, and page x size past 10,000 returns HTTP 412. Probed
and fixed the same day: `cantonCodes` filters work and `x-total-count` reports
slice sizes (ZH alone holds ~17k, so big cantons sub-slice by `permanent` and
`workloadPercentageMin/Max`; the `sort` param is honored, so a slice that still
exceeds the window gets a two-ended `date_desc` + `date_asc` read covering 20k).
The adapter now runs a nightly two-pass: `onlineSince: 2` countrywide for fresh
ads first, then a rotating canton sweep under a page budget — the full corpus is
touched every couple of nights and nothing is silently dropped. Night one still
banked +9,735 Swiss postings (94% German), taking the raw corpus to ~293k.

**Careerjet correction:** the adapter existed but the key never did — it has
been skipping silently since it was written. Founder signup at
careerjet.com/partners (free), then `CAREERJET_API_KEY` in `.env` (laptop) and
in the GitHub Actions secrets, plus IP allow-listing. With Job-Room live,
Careerjet drops from "first source" to "nice supplementary" and the laptop
retirement is unblocked once we confirm a few Job-Room nights.

### SECO email draft (for the partner to send, adjust freely)

> **An:** jobroom-api@seco.admin.ch
> **Betreff:** Anfrage Lesezugriff Job-Room API, Arbeitsmarkt-Analyse
>
> Guten Tag
>
> Wir bauen mit PivotHop (pivothop.ch, Schweizer Firma in Gründung) ein
> Analyse-Instrument für Berufswechsel: Es misst anhand echter Stellendaten,
> welche Berufe die vorhandenen Kompetenzen einer Person bereits erreichen,
> und was konkret fehlt. Zielgruppen sind Stellensuchende, Berufsberatung und
> Outplacement.
>
> Dafür möchten wir publizierte Stellenanzeigen aus dem Job-Room auswerten
> (reiner Lesezugriff, aggregierte Analyse, tägliche Aktualisierung, keine
> Weitergabe von Personendaten). Die API-Dokumentation unter api.job-room.ch
> beschreibt primär den Publikationskanal für Arbeitgeber; uns interessiert der
> korrekte, von Ihnen vorgesehene Weg für Lesezugriff.
>
> Können Sie uns sagen, welche Nutzungsbedingungen gelten und ob ein formeller
> Zugang möglich ist? Wir richten uns selbstverständlich nach Ihren Vorgaben.
>
> Freundliche Grüsse
> [Nadine], PivotHop
