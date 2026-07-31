# Corpus and skill quality

*A cleaning pass on the miner, 2026-07-31. Four changes: an HTML bug that had been
quietly poisoning our best source, nine skills of missing vocabulary, two title
fixes, and an evidence floor on the origin side of adjacency.*

---

## Where the skill loss actually was

Title mapping is the loss everyone reaches for first. It is not the biggest one.
Measured against the corpus before this pass:

| skills extracted | share of postings | median description |
|---|---|---|
| 0 | 39.8% | **500 chars** |
| 1 | 26.4% | **500 chars** |
| 2 | 12.1% | **500 chars** |
| 3+ | 21.8% | **4,433 chars** |

500 is not a natural number. It is Adzuna's truncation, and Reed truncates at 453.
Those two are 81% of the corpus, and the split by source follows exactly:

| source | ≥3 skills |
|---|---|
| Greenhouse | 96.9% |
| Ashby | 95.2% |
| Lever | 92.3% |
| **Adzuna** (195,982) | **9.5%** |
| **Reed** (14,200) | **5.3%** |

**The skill profiles are built on the ~20% of the corpus that ships full text.**
That is worth stating plainly, because it means adding more aggregator volume does
not improve skill quality at all — it only improves salary and demand counts.
Sharpening skills means protecting the full-text sources and widening the lexicon,
which is what the rest of this pass does.

## The bug: stripHtml handed back raw HTML

Greenhouse delivers its `content` field as **escaped** HTML. `stripHtml` removed
tags first and decoded entities second, so on escaped input the strip found nothing
to remove and the decode then turned `&lt;p&gt;` **into** a real `<p>`. The helper's
output was markup — averaging **129 residual tags per posting**, 22.5% of every
description, on the single richest source we have.

It cost us in both directions at once:

- **junk in** — `html-css` was extracted from the literal tags; `git`, `jira`, `aws`,
  `react` and `langchain` from href values and attributes.
- **real skills out** — `forecasting` and `budgeting` were missed because `</li>`
  never became the break that separates two list items, so adjacent bullets glued
  into one unmatched token.

The fix runs strip-then-decode until the text stops changing (capped at three
passes). A tag now also has to open with a letter — without that guard,
`&lt;5 years and &gt;10 projects` decodes to `<5 years and >10 projects` and the
whole span is eaten as a tag. The old code only survived that case by accident,
because the decode happened too late to expose it.

`stripHtml` is applied in `normalize` as well as in the adapters, so the 260k rows
already on disk were repaired without a re-scrape.

### What the removals turned out to be

The pass removed 2,360 skill mentions and added 139 — a net loss, which is the
correct direction. Every removal class was checked against the source text:

| removed | why it was wrong |
|---|---|
| `mental-health`, `accessibility`, `training` | *"fertility benefits, and **mental health** benefits"* — the benefits block |
| `financial-modeling` | *"About Stripe — Stripe is a **financial** infrastructure platform"* — company boilerplate |
| `spark` | *"in-person work to accelerate progress, **spark** innovation"* — the English verb |
| `html-css`, `langchain` | the markup itself |

Cleaner text changes the line structure, which is what `zoneText` keys on, so the
benefits / about-us zoning finally reaches text it previously could not parse. The
≥3-skill rate fell from 21.75% to 21.69% as a result. **A lower number that is true
beats a higher one that is not** — this is the dental-hygienist lesson in its
routine form.

## Nine skills of missing vocabulary

Thin origins have two different diseases and they need different medicine:
**vocabulary starvation** (the postings say it, our lexicon has no word for it) and
**sourcing starvation** (the postings genuinely do not say it). Hotel Manager had
456 postings and a **four-skill** profile — that is vocabulary. Flight Attendant has
74 postings of airline marketing prose — that is sourcing, and no lexicon fixes it.

Added: `guest-relations`, `front-office`, `housekeeping`, `hotel-operations`,
`food-beverage`, `revenue-management`, `property-management`, `library-services`,
`air-traffic-control`.

Three aliases were deliberately **not** added, because the abbreviation is owned by
another field: bare `adr` (Alternative Dispute Resolution in legal, American
Depositary Receipt in finance), bare `atc` (Automatic Temperature Control), and
bare `letting` (an ordinary English gerund; the UK noun `lettings` is safe).

### The audit is the point

Every lexicon change gets an alias-reach audit afterwards, and this one found three
things worth keeping:

- **`housekeeping` → automotive & aircraft mechanics (30).** *"Complies with safety,
  fire, security, environmental, and **housekeeping** regulations."* Workplace
  tidiness, not the hotel function. Guarded.
- **`food-beverage` → account executives (44).** *"expanding into other **food and
  beverage** concepts such as grocery stores."* An industry vertical a salesperson
  sells into, not an operational skill. Guarded.
- **`front-office` → auditors (70).** Here the *skill* was right and the *title
  mapping* was wrong — see below.

## Two title fixes

**Night Auditor is not a financial auditor.** It is the hotel front-desk role that
reconciles the day's folios, and it was **120 of 1,295 `auditor` postings (9.3%)**,
dragging guest relations, front office and hotel operations into the financial
auditor's skill profile and from there into its adjacency. There is no front-desk
occupation to move it to, so it maps to nothing — the same call as *Técnico
Mecánico*. A small `NEVER` list now holds titles that contain a real synonym but
denote an occupation we do not carry. `Overnight Auditor` still maps.

**A Remote Pilot is a drone operator.** `cleanTitle` strips `remote` as a
work-arrangement modifier, which turned *Remote Pilot* into *pilot* and landed it on
the airline occupation — even though `drone-pilot` already claimed "remote pilot" as
a synonym. A narrow lookahead exempts it. This is the general trap worth
remembering: **a generic noise-word list will eventually eat domain vocabulary.**

That fix then exposed a third occupation hiding inside the same words. *Remote Pilot
**Operator*** is FAA terminology for someone who flies simulated aircraft so trainee
controllers have traffic to work — the postings name their facility by identifier
(CLT, ZME, D01, S46). It is neither a drone pilot nor an airline pilot. It had been
landing on `pilot`, the lookahead moved it to `drone-pilot` where it became that
occupation's **top skill signal**, and it is now refused outright. Worth noting how
it surfaced: not from the title list, which looked plausible, but from auditing the
*skill* profile afterwards and asking why air traffic control ranked first for drone
pilots. **The audit found what the fix broke.**

`contract` was left unguarded on purpose. It really is employment type in the common
case — *Contract Visual Designer* should map to the designer — and the minority
where it is the subject (*Contract Manager*) has no occupation to land on anyway, so
guarding it would buy unmapped rows rather than correct ones.

## The origin floor

Adjacency guarded the **destination** four ways — `MIN_DEST_POSTINGS`,
`HARD_MIN_DEN`, the `denDamp` damping, and `MIN_SHARED_SKILLS` — and the **origin**
only for being non-empty. That asymmetry is backwards for `/routes/<origin>`, which
is a page about the origin.

Coverage is directional, so a starved origin does not produce an *inflated* match —
it produces an **arbitrary** one. The only destinations clearing `MIN_SHARED_SKILLS`
are whichever three generic skills the origin happened to catch. Flight Attendant
published exactly one route, to **Automotive Technician**, on the strength of
"customer service" and "aviation operations". Hotel Manager emitted eight from four
skills.

`MIN_ORIGIN_DEN = 0.25` mirrors the destination floor. Below it an origin emits no
routes, and `emit` gives it the honest insufficient-data state with its own note —
enough postings, too few of them stating requirements in detail — rather than a page
with an empty route table.

**Order matters here, and it is the reusable lesson.** The floor was written second,
deliberately: vocabulary fixes the *cause*, a floor only hides the symptom, so the
floor should only ever catch what vocabulary cannot reach. Run in that order, Hotel
Manager never meets the floor at all — it goes from a four-skill profile at 0.12 to
a nine-skill one at **0.92**, and its routes change from `hr-manager 10%` to
`sommelier 42%` and `chef 17%`. Had the floor shipped first it would have suppressed
a page that was one lexicon gap away from being correct.

What the floor keeps: **8 origins**, of which four are already under the posting
floor. The four real catches are `building-surveyor` (0.13), `wind-turbine-technician`
(0.15), `human-factors-engineer` (0.21) and `school-administrator` (0.22). Flight
Attendant no longer publishes its route to Automotive Technician.

## Protected by the gate

The gold set went from 92 to 104 titles and 19 to 26 skill cases, pinning every
decision above: the four Night Auditor spellings to null, `Overnight Auditor` to
auditor, five Remote Pilot variants to drone-pilot, both sides of each new guard,
and the escaped-markup case.

One fix to the harness itself was needed first. The gold runner asserted against
`extractSkills(zoneText(text))` — it never called `stripHtml`, so it was testing a
path production does not run, and the escaped-markup case could not have failed no
matter how broken the helper was. **A gold set asserting against the wrong pipeline
is how a miner goes green while broken.**

The set then caught a contradiction of mine immediately: `Remote Pilot Operator` was
pinned to `drone-pilot` by the first fix and to `null` by the second, and both rows
were in the file. Duplicate titles are now collapsed on write.

## Where it landed

| | before | after |
|---|---|---|
| mapped | 64.7% | **64.5%** |
| postings with ≥3 skills | 21.75% | **21.8%** |
| hotel-manager profile | 4 skills, oden 0.12 | **9 skills, oden 0.92** |
| `auditor` postings | 1,295 | **1,045** (night audit removed) |
| origins publishing routes | 165 | **153** |
| gold cases | 92 titles / 19 skills | **105 titles / 26 skills** |

Two of those numbers went **down on purpose**, and both would read as regressions on
a dashboard that only tracks coverage. Mapping fell because refusing Night Auditor is
the correct answer.

The twelve origins that stopped publishing routes need splitting, because only four
are the new floor — `building-surveyor`, `wind-turbine-technician`,
`human-factors-engineer`, `school-administrator`. The other eight lost their routes
to the **HTML fix**, and that is the more interesting result:

> brewmaster, flight-attendant, grant-writer, journalist, librarian, perfusionist,
> pilot, tutor

`tutor` is the case that makes the point — it has a perfectly healthy profile (oden
0.81) and still clears no pair. Their routes had been resting on the boilerplate
skills the markup bug was feeding them: `training`, `accessibility`, `social-media`,
`mental-health` are generic enough to appear in *any* benefits or about-us block, so
they manufactured the three shared skills that `MIN_SHARED_SKILLS` asks for and
bridged occupations that have nothing real in common.

**Removing contamination removes routes.** Those eight were adjacency built out of
company boilerplate, and they should never have shipped. This is the same trade as
the ≥3-skill rate falling: the surface gets smaller and the remaining surface is
true. It also revises the record: several of these occupations were listed as fixed by the
2026-07-28 vocabulary pass, and part of that "fix" turns out to have been
contamination rather than vocabulary.

## What this pass did not fix

The ceiling stands: **78% of postings still carry fewer than three skills**, and
almost all of that is Adzuna and Reed truncation, which no amount of extraction work
reaches. The lever that would actually move it is more full-text sources — company
ATS boards on Greenhouse, Ashby and Lever — not a better matcher.

Flight Attendant is the honest illustration. It has 74 postings of airline marketing
prose ("the world's nicest airline", "truly awesome"), and no lexicon fixes that.
Its empty state is the correct output, not a gap to close.


## The stale-artifact bug this uncovered (2026-07-31, post-deploy)

Verifying the deploy against the live site rather than trusting the push found a
defect that predates this pass and that the gates could not see.

`export-web-data.py` **skipped** insufficient origins instead of overwriting them:

```python
if g.get('insufficient') or not g.get('roles'): continue
```

So an origin that FELL BELOW the floor kept its last good file at a public URL.
`/data/flight-attendant.json` was still serving "Automotive Technician 17%" after
the origin had stopped qualifying. Fourteen origins were in that state, several
with five to eight stale routes — `pilot`, `journalist`, `tutor`, `librarian` —
and two of them (`exhibit-designer`, `forensic-accountant`) had been stale since
well before today.

**The site itself was never wrong.** `origins.json` carries an `ok` flag, the
graph gates on it, and `/routes/flight-attendant` correctly returns 404. That is
why `check:links` passed and why nothing looked broken. The hole was for every
*other* consumer of those files — and `apps/mcp` reads exactly these files, so
asking an assistant "what can a flight attendant become?" returned a stale number
presented as measurement. That is the one thing the honesty rule exists to
prevent, and it was live.

Fixed in two places, deliberately:

1. **`export-web-data.py` now writes the honest payload** for an insufficient
   origin rather than skipping it, so the URL resolves and says so.
2. **`tools.js` trusts `ok` from `origins.json` over the payload.** A published
   file can lag its index, and the tool should not be the thing that discovers
   that. Defense in depth: either fix alone would have closed this instance.

**The general lesson: a gate that changes state must clean up the artifacts of
the old state.** This codebase now has four instances of the same shape —
CompareLink, `hasOriginPage`, `coverable()`, and this one — where a threshold
moved and something downstream kept serving the pre-threshold answer. Adding a
floor is never only an `if`; it is an `if` plus whatever the old branch already
published.
