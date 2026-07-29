# Employer outreach

*The adjacent-talent pitch, sent to companies we can prove are hiring. Built 2026-07-29.
Console at `/admin/outreach`. Builder: `apps/scraper/scripts/build-outreach-targets.py`.*

---

## What we have and what we don't

The corpus names **46,836 distinct companies** across 208,295 raw postings. That is a
prospect list nobody had to buy, pre-qualified by the only signal that matters for a
job board: they are demonstrably hiring, right now, for roles we have already
classified.

What the corpus does **not** contain is contact emails. Measured across all 209,228
raw postings: **668 distinct addresses**, present in 3.5% of postings. And the most
frequent local-parts are not what you'd hope:

| local-part | count |
|---|---|
| `accommodations@` | 1,037 |
| `recruitingops@` | 496 |
| `hr@` | 383 |
| `accessibleinterviewing@` | 382 |
| `candidateaccommodations@` | 372 |
| `talentdata.privacy@` | 252 |

Those are statutory channels — ADA disability-accommodation inboxes and GDPR
data-subject-request addresses, published because the law requires it. Sending sales
mail to them is the fastest possible route to complaints against our domain. **They
are never outreach targets**, and the console says so in its rules.

So contact discovery is a **separate, paid, per-domain step**, run by a human against
the shortlist — never swept across the corpus. See "Providers" below.

## Why not just buy 40,000 emails

Three independent reasons, any one of which is fatal:

1. **Cost.** Tens of thousands of lookups is a provider's top self-serve tier,
   several hundred a month. For a business whose doctrine is "nothing that needs
   funding" (CLAUDE.md), that is not a rounding error.
2. **Obligation.** Collecting 40,000 people's contact details puts a GDPR Article 14
   duty on *us* to notify each of them individually within a month. That converts a
   one-person side business into a compliance function.
3. **Deliverability.** Google and Microsoft require complaint rates under 0.3%. A
   solo sender pushing 40k cold emails from a new domain is spam-foldered within
   days — and domain reputation is shared with the transactional mail the board
   depends on.

The channel works at hundreds of well-chosen sends, and fails at tens of thousands.
That is not a compromise; it is the shape of the medium.

## The ranking

A company is worth an email when we can tell it something true that it does not
know: a role it has open is reachable by people holding a different title, and we can
name them. That is exactly what the emitted graph measures, so the score is built
from our own data rather than from bought firmographics.

| Component | What it measures | Weight |
|---|---|---|
| **reach** | best origin→role readiness among this company's openings, plus breadth of the adjacent pool | `match + 4 × min(origins, 10)` |
| **volume** | how many adjacent roles are open, log-damped — 40 openings is not 40× the prospect of one | `14 × ln(1 + adjacent)` |
| **age** | days the oldest adjacent role has been open; staleness is pain, and pain is why someone answers | `25 × (days / 120)` |

Every component is emitted next to the total, so any target can be argued with
rather than trusted. Readiness comes from `roles[]` in the emitted per-origin files —
the same number the graph draws — and only origins at **≥40% readiness** count. Below
that it is a stretch, not a pitch.

**Government is dropped, not ranked.** USAJOBS, the VA, and the National Guard cannot
buy a job post, and Veterans Health Administration is the single largest poster in the
corpus (990 board listings) — left in, it would win on volume alone.

## The pitch

The console generates the draft, because the whole point is that the email contains
a finding rather than a claim:

> **Subject:** BIM Manager at ⟨company⟩ — Architects are 62% ready for it
>
> You've had BIM Manager open for 47 days. I run PivotHop, which measures how close
> one occupation's skills sit to another's using live postings. On that measurement,
> Architects cover 62% of what your BIM Manager posting asks for, and they're one of
> 6 adjacent titles that clear our bar for it. That's a pool you're probably not
> seeing, because they don't have your job title on their CV.

Nobody else can send that email. That is the entire moat, and it is why volume is
counterproductive — the specificity is the product.

Note the phrasing discipline: readiness is **skill coverage of the posting's
requirements**, not "62% of candidates" and not a probability of being hired.
Misstating it in an email would be the same failure as misstating it on a route page.

## Compliance, enforced in the UI

- **Germany (UWG §7)** and **Canada (CASL)** require prior consent for B2B email —
  up to €300,000 and CAD $10M. Companies posting *only* from those countries carry
  `mail_ok: false` and their controls are **disabled**, not merely warned about. A
  rule that depends on a tired operator remembering it is not a rule.
- **US (CAN-SPAM)**: no consent needed and no B2B exemption, but every send needs
  accurate sender identity, a real postal address, and a working unsubscribe.
  $53,088 per email.
- **UK/EU**: legitimate interest covers B2B outreach to corporate addresses, with a
  documented basis and honoured access/deletion requests.

## Providers

Linked from the console, deliberately as links rather than an integration — the spend
should be a human decision each time, on a shortlist, with a cap.

| Provider | Why |
|---|---|
| [Hunter.io](https://hunter.io/domain-search) | domain search + confidence scoring; best measured accuracy (~90%) |
| [Dropcontact](https://www.dropcontact.com) | stores no database, computes in real time — the EU-safe option |
| [Findymail](https://findymail.com) | charges only for verified hits |
| [MillionVerifier](https://millionverifier.com) | verify before sending; bounces burn domains |
| [Instantly](https://instantly.ai) | sending + warmup, from a **secondary** domain |

We already own the expensive half of the pipeline: `fetch-logos.mjs` resolves company
name → domain (ATS slug → Clearbit autocomplete → `.com` guess) and runs nightly. The
builder reuses that logic to emit `domain_candidates`, which the console links
straight into Hunter's domain search. Candidates are **not asserted as fact** — the
provider resolves them.

## Architecture

```
corpus + emitted graph
      ↓  build-outreach-targets.py         (nightly, before the web build)
packages/data/outreach/targets.json        ← NOT under apps/web/public
      ↓  imported server-side by /admin/outreach
console  ⟷  outreach_status (Supabase, migration 0007)
```

Two deliberate choices:

- **The list is a build artefact; the state is a database row.** They join on
  `company_key`. A re-rank therefore never loses campaign history, and history never
  pins a stale ranking.
- **`targets.json` lives outside `apps/web/public/`.** A scored list of who we are
  about to pitch is not something to serve to the world. It is imported, so it is
  bundled server-side and no client component receives it whole.

State is shared rather than per-browser on purpose: two people working one list from
`localStorage` would double-email the same company, which is worse for sender
reputation than not sending at all. Claim a row (`queued` + `owner`) before writing.

## Access

`/admin` and `/admin/*` sit behind HTTP Basic Auth in `src/middleware.ts`
(`ADMIN_USER` / `ADMIN_PASSWORD` from the Vercel environment), and `robots.txt`
disallows `/admin`. The partner uses the shared credential — chosen 2026-07-29 over
per-user logins for now. If independent revocation is ever needed, the middleware
takes a list of `user:password` pairs in about fifteen lines.

## Setup checklist

1. Apply `supabase/migrations/0007_outreach.sql`. Until then the console is
   read-only and says so — the list still works, status just won't persist.
2. Buy an outreach domain. Never `pivothop.com`.
3. Warm it 2–3 weeks before volume.
4. Pick a provider and a monthly cap.
5. Work the top of the list. Tens per day.
