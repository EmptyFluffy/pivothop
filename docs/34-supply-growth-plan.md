# 34 · Supply growth plan

*Written 2026-08-16 from a funnel measurement, not from a wish list. The question was how to grow postings much faster, and whether to add country APIs one at a time. The measurement says the board's problem is distribution, not volume, and that country-by-country is the wrong first move.*

---

## 1. What the funnel actually does

| Stage | Count | Note |
|---|---|---|
| Postings read to date | 169,138 | |
| Adzuna + Reed | 120,663 (71%) | **Permanently data-only.** Terms forbid re-display (`docs/20`, `docs/23`) |
| Displayable corpus | 48,475 (29%) | Everything the board can ever draw from |
| Displayable and 30 days old or fresher | 30,353 | |
| **On the board today** | **23,877** | 5,863 companies |

The board has not grown in eight nights: 26,099 on Aug 9, 23,877 on Aug 16. It oscillates, it does not climb.

**The 71% is not a lever.** Adzuna's terms restrict re-display and that decision is already documented and correct. Those postings earn their keep as the salary and skills corpus. Do not reopen it; write it off and plan around 48,475.

## 2. The real problem: distribution, not volume

Displayable supply by country: **CH 26,336, US 10,090**, DE 1,879, GB 1,348, CA 770.

Swiss listings are 54% of everything we are allowed to show, while US is where the search demand is (9.3K US impressions in Search Console). Supply and demand point in opposite directions.

That imbalance then collides with `CAP = 600`:

| Role | Displayable | CH | US | On the board |
|---|---|---|---|---|
| registered-nurse | 7,870 | 7,525 | 314 | 600 (CH 390 / US 187) |
| electrician | 2,729 | 2,665 | 52 | capped |
| carpenter | 2,464 | 2,456 | 7 | capped |
| plumber | 1,018 | 1,005 | 12 | capped |

**21,557 displayable listings are discarded by the cap**, concentrated in 16 roles that are mostly Swiss trades. Meanwhile:

- **60 of 171 roles have fewer than 20 displayable listings.**
- **20 roles show fewer than 10 on the board**: mep-engineer (3), prompt-engineer (3), 3d-modeler (4), gis-analyst (4), biomedical-engineer (5), creative-technologist (5).

Those thin roles are the differentiated ones. A board with three MEP engineer jobs is not a career instrument for an MEP engineer, and those are exactly the pages that make this unlike Indeed.

**Adding a country API would deepen the imbalance, not fix it.** More volume in roles that already overflow, in countries nobody is searching from.

## 3. Answering the question directly

**Should we go country by country collecting new APIs? Not first, and not speculatively.**

1. **Demand is US.** Supply should follow the traffic we already have, not create traffic we hope for.
2. **Most general aggregators carry the same restriction that already darkened 71% of the corpus.** Each new one risks being another data-only source: real integration cost, zero board growth.
3. **The compounding, terms-clean path is company-direct ATS.** Greenhouse, Lever, Ashby and SmartRecruiters are individual employer boards: re-displayable, deduplicated, apply-at-origin. That is 6,433 listings today, and the prospector already grows it nightly with 218 firms queued.

Add a country when Search Console shows impressions from it. GB is the plausible next one: English-language SEO and 1,348 displayable listings already in hand.

## 4. The plan, in order of leverage

### Phase 1 · Rebalance what we already have (no new sources)

1. **Make the cap country-aware.** Today a single `CAP = 600` per role lets Swiss supply fill slots US searchers need: 390 of 600 nurse listings are Swiss for a US audience. Cap per role *and* country, so no country can consume more than its share of a role's slots. This is a pure redistribution: the board gets more useful without a single new posting.
2. **Resolve the 2,605 displayable listings with no country.** An unresolved country defeats dedup *and* the balance gate, so these hurt twice.
3. **Retire stale listings.** 5,542 displayable postings are more than 90 days old. We published a piece on how to spot a ghost job; showing 90-day-old listings contradicts it. Drop or visibly date them.

### Phase 2 · Fix the thin roles, because they are the differentiation

4. **Targeted sourcing for the 60 roles under 20 listings.** These need specific boards, not general APIs: AEC and BIM job boards for mep-engineer and bim-manager, clinical trial networks for clinical-research-coordinator, GIS communities for gis-analyst. Low volume, high relevance, and it is what makes a route page honest.
5. **Raise the cap only where non-CH supply exists.** software-engineer, account-executive, product-manager and solutions-architect have real US surplus. Lift those; leave the Swiss trades capped.

### Phase 3 · Grow US supply, where the demand is

6. **Accelerate the prospector and bias its queue toward US firms.** It is the only asset here that compounds and it carries no terms risk.
7. **Add US-specific re-displayable sources**, prioritising ones that cover the thin roles rather than more software jobs.

### Phase 4 · Country expansion, demand-led

8. GB first, and only when its impressions justify it. Then follow the Search Console data rather than a map.

## 5. The framing that matters

We will never beat Indeed on volume and should stop trying. Indeed has millions of listings; the board has 23,877 and always will be smaller.

The product's claim is not "more jobs." It is **"jobs your skills can actually reach."** That claim is broken by a route page with three listings, and it is not improved by a fourth country of software jobs. Depth per role beats total count, every time.
