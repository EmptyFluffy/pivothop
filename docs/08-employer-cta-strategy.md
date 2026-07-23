# PivotHop — Employer CTA Strategy

*How the adjacent-talent job board launches and monetizes. Revised July 2026: the concierge model was broken — it needed a candidate pool we do not have, it does not scale for one person, and a high-volume board cannot be run by hand. The model below supersedes it. The drafted emails further down remain useful, repurposed for claim-and-upgrade outreach.*

---

## The model: aggregate, own demand, monetize the match

The board faces the classic two-sided **cold-start problem**: candidates will not come without jobs, employers will not pay without candidates. The documented way to break it (Indeed, 2004; every niche board since) is **aggregation** — backfill the board with real listings from other sources so it is full from day one, build job-seeker traffic on that density, then convert the employers whose listings are already getting views. We can run this playbook because we already operate a compliant scraper, the single hardest part for everyone else.

Three moves, in order:

1. **Seed supply from the scrape (backfill).** The board launches full: real open roles from our re-displayable sources (company-direct ATS boards — Greenhouse, Lever, Ashby, SmartRecruiters — plus remote APIs and USAJOBS public-domain data), each tagged to its occupation and linked back to the original posting. About 13,000 live listings across ~148 occupations at launch, no candidate pool and no manual matching required. Aggregator sources whose terms restrict re-display (Adzuna, Reed) feed the salary aggregates only, never the board.
2. **Own the demand with the tools (come for the tool, stay for the network).** The instrument, salary board, routes, and blog are the single-player tool that builds candidate traffic through SEO, the audience employers pay to reach. Already the launch strategy; the board is the network layer on top. The differentiator no one else has: we surface jobs by **adjacency**, the open roles your current skills can actually pivot into, shown on the route and salary pages.
3. **Monetize the match.** Employers whose backfilled roles are getting adjacent-candidate views convert on a claim-and-upgrade offer: your role is already on PivotHop and getting views, claim it and get featured placement to the candidates whose skills match. Pricing follows traffic — pay-per-post scaling from roughly $200 at 10k monthly visitors toward RemoteOK-style rates as traffic grows, featured upgrades, subscriptions once 20+ employers pay. The truth to respect: employers pay for **applicants, not listings**, so candidate traffic must be live first, which is why the SEO surface ships before the paid tier.

### The launch promo (supersedes "free for the first twenty")

Not free-for-the-first-20 (too scarce, and it wrongly assumes we must beg employers to fill an empty board; the scrape already fills it). Instead: **a free first month of featured placement, offered to every employer, temporary while the board fills and traffic proves out**, framed as claim-your-already-listed-role, with the paid featured tier as its destination. Free-to-claim off a backfilled board converts far better than free-to-seed an empty one.

### Automated vs. by hand

The board is **self-serve and automated**: backfill, occupation tagging, and adjacency matching all run off the existing pipeline, no person in the loop, which is the only way one person runs volume. What stays personal is the *first* employer outreach (the claim emails below), because a warm, specific first contact converts best. One manual touch, a choice not a bottleneck.

### The ToS line

Re-displaying a listing is a different permission than analyzing it. The board backfills only from sources whose terms allow indexing with attribution and a link back, and every listing links out to apply at the source. Adzuna and Reed terms do not allow re-display; they feed the salary data only.

## Employer capture (revised)

The `/employers` page keeps its intent-qualified form (below): work email, company, the role, the challenge. No passive newsletter waitlist — curious employers do not need capturing, ready ones fill the form. When Supabase is wired, the form stores the lead and notifies Carlos to send a personal first reply, with a simple confirmation to the employer. Captured emails are never auto-added to a marketing list.

*(The funnel, form spec, and email drafts below predate the revision. The drafts remain the templates for claim-and-upgrade outreach; their concierge framing is superseded by the backfill model above.)*

## The employer capture funnel (superseded framing, drafts reusable)

Employers reach PivotHop through:

1. **The board itself** — their role is already backfilled and getting views; the claim CTA on the listing is the primary capture.
2. **The `/employers` page** — the intent-qualified form for employers who want to post or feature directly.
3. **Direct outreach from Carlos** — to hand-picked leads whose roles are already on the board, using the claim emails below.

## The capture form (V0 employer landing)

The `/employers` page in V0 has a short form:

- Name
- Company
- Role you're hiring for (freeform 1-2 sentence description)
- Current biggest challenge in filling this role (freeform)
- Email
- Optional: LinkedIn URL

Below the form:

> "Carlos personally reviews every employer request. If PivotHop can help, he'll reach out within 3 business days with 2-3 candidates who fit and a short call to discuss. If it's not a fit, he'll say so. Either way, you'll hear back."

That last paragraph is important. It sets the expectation that this is a conversation, not a marketplace transaction.

## Capture timing decisions

**Do NOT capture employer emails without intent signal.** No newsletter signup, no "get updates about employer features" popup. Employers who are curious don't need to be captured; employers who are ready fill out the form.

**Do NOT do exit-intent modals on the employer page.** Same reason.

**Do NOT auto-add captured employer emails to a marketing list.** Each captured email starts as a 1:1 conversation. Adding to a marketing list without explicit consent for that purpose burns the relationship.

## The email sequence (V0)

Once an employer fills out the form, Carlos personally sends the emails below. These are not automated sequences from a CRM — they are drafted templates that Carlos edits per employer before sending. The personalization is the product.

---

### Email 1: Initial response (send within 48 hours of form submit)

**Subject:** Re: [company] hiring for [role]

**Body:**

Hi [name],

Thanks for filling out the form. I read every one personally, and yours caught my attention because [specific reason — the role, the challenge described, the company, or something Carlos knows about the space].

Quick context on what PivotHop actually does, so you know what to expect:

I scrape live job postings, compute how specific adjacent professions overlap with roles like the one you're hiring for, and identify candidates whose current skill set already covers 70-90% of what you need. Then I personally review each candidate and reach out to make sure they're actually pursuing this transition (not passively browsing).

For your role, the candidates most likely to fit are probably coming from [adjacent field 1] and [adjacent field 2] — I can dig into the specifics if that sounds useful. If it does, I'd suggest a 20-minute call to talk through:

- What "great" looks like for this role at your company
- Which parts of the standard job description are truly required vs. nice-to-have
- Any red flags I should filter for

Here's my calendar: [Cal.com or similar link]

If it's not a fit — say, if you need someone with 10 years of exact-role experience and no interest in adjacent hires — just tell me and I won't take up more of your time.

Carlos

---

**Notes on this email:**

- Sent within 48 hours. Delay past 3 days and the employer forgets they filled out the form.
- Names one specific reason the request caught Carlos's attention. Not generic. If Carlos can't name a specific reason, he shouldn't send this email — he should send Email 1-alt below.
- Explicitly names the two adjacent fields Carlos thinks fit. This proves the tool is real, not vaporware.
- Ends with an out. If they're not the right fit, they can decline without embarrassment.

---

### Email 1-alt: When the request isn't a good fit

**Subject:** Re: [company] hiring for [role]

**Body:**

Hi [name],

Thanks for reaching out about the [role] role. I want to be honest with you: I don't think PivotHop is going to help here, and I'd rather say that up front than waste your time on a call.

The reason: [specific reason — the role is too specialized, requires credentials PivotHop's adjacent candidates typically don't have, is at a compensation level below where adjacent-hire economics work, etc.]

If your search changes shape — say, you'd consider hires who need 3-6 months to ramp, or you're open to a mid-level version of the same role — I'd love to hear from you again.

In the meantime, if I hear of specific people who might be a good direct fit, I'll pass names along. Good luck with the search.

Carlos

---

**Notes on this email:**

- Being willing to walk away from bad-fit requests is the brand. Every employer who receives this email tells at least one colleague about the experience.
- Offers a future opening ("if your search changes shape")
- Offers real help if possible ("I'll pass names along")
- Under 100 words. Doesn't need to be longer.

---

### Email 2: After the intro call (send within 24 hours of the call)

**Subject:** [company] — 2 candidates + next steps

**Body:**

Hi [name],

Good talking earlier. Recapping what we agreed and what happens next:

**The role, as we scoped it:**
- [1-2 sentence summary of the actual need, informed by the call]
- Key skills: [3-5 skills prioritized by importance]
- Deal-breakers: [things Carlos will filter for]
- Comp range: [what the employer said]

**Candidates I'm looking at:**

I have two people I'd like to introduce, plus a third I'm still evaluating.

**Candidate A** — [current field, e.g., "Senior architect at a mid-size Chicago firm"]
- 8 years of experience in [relevant work]
- Has demonstrated [key skill] in [specific project or context]
- Actively pursuing this transition — has completed [self-taught / bootcamp / freelance] work in the destination field
- Comp expectations: [range]

**Candidate B** — [same structure]

**Candidate C (still evaluating)** — [same structure, but Carlos hasn't fully vetted]

**Next steps:**

If you're interested in A and B, I'll make warm introductions this week — I'll write to each of them, confirm they're still in-market and interested in the role, then connect you directly. From there, your standard hiring process takes over.

The intro fee for each candidate you interview is [$X]. If either results in a hire, the placement fee is [$Y] against that intro fee (i.e., the intro fee counts as a deposit).

Standard terms attached. Let me know when you'd like me to make the intros.

Carlos

---

**Notes on this email:**

- Recaps the call so both parties have the same understanding on paper
- Names 2-3 real candidates (never 5+ — that's a resume database dump, not a curated match)
- Explicit about the mechanic — no surprise fees, no surprise process
- Attached standard terms — legal doc that Carlos wrote once and reuses

---

### Email 3: The follow-up after the intro (send 7 days after warm introductions made)

**Subject:** Following up on [candidate A] and [candidate B]

**Body:**

Hi [name],

Checking in on how the intros landed. A quick note on each:

**Candidate A** — [any relevant update Carlos knows, e.g., "I know they were traveling this week and might just be catching up on inbox"]

**Candidate B** — [same]

If either conversation is stalling for reasons on your side (unclear on next steps, waiting on team availability, reconsidering the role), tell me and I can help unblock. If it's stalling on their side, I'll nudge them.

If both aren't working out, no harm — I can keep looking. There's a smaller pool of second-tier candidates I haven't surfaced yet that I could go back to.

Carlos

---

**Notes:**

- Sent regardless of whether Carlos has heard anything from either side. The point is to show up as an active partner, not a broker who disappears after the intro.
- Offers to unblock, not to nag.
- Offers a backup plan.

---

### Email 4: The renewal email (send 30 days after successful placement)

**Subject:** How's [name of placed candidate] doing?

**Body:**

Hi [name],

30 days in — how's it going with [candidate name]? Genuinely curious, not asking to justify the fee.

If there are things going well, I'd love to hear specifics (they help me match better next time). If there are things going poorly, I want to know — one of the promises I make is that I stay involved when placements don't work out.

And if you have another role coming up, tell me early. I can start the search before it's posted publicly.

Carlos

---

**Notes:**

- Sent 30 days after placement. Not 7. Not 90. Thirty is the window where problems become clear but aren't yet catastrophic.
- The "genuinely curious, not asking to justify the fee" phrase is important. It signals that this isn't a check-in for cover.
- Ends with the next-search hook, but low pressure.

---

## Direct cold outreach emails (Carlos-initiated)

For cold outreach to hand-picked employers (not form fills), the sequence is different:

### Cold Email 1: The introduction

**Subject:** Adjacent-hire candidates for [specific role at company]

**Body:**

Hi [name],

I noticed [company] is hiring for [specific role] — congrats on the growth.

I run PivotHop, a small operation that matches employers with adjacent-hire candidates. Specifically, I identify people from adjacent fields whose current skill set already covers 70-90% of a role's requirements, and who are actively pursuing that transition.

For [role], the candidates most likely to fit are coming from [field 1] and [field 2]. I have [N] specific people I'm tracking who I think would be worth introducing to you.

If you're open to it, I'd send you 2-3 short profiles (no resumes — just relevant context) and you tell me if any are worth a call. No fees unless you decide to interview someone I introduce.

Sound useful?

Carlos
[LinkedIn URL]

---

**Notes:**

- Names the specific role. Never sent to a company generically.
- Names specific adjacent fields to signal Carlos actually looked at the role.
- Low-friction ask (2-3 profiles, no fees to look) means the response rate is higher than for cold sales emails.
- Signature includes LinkedIn — proof of person, not spam.

### Cold Email 2: The follow-up (7 days later, only if no response)

**Subject:** Re: Adjacent-hire candidates for [specific role]

**Body:**

Hi [name],

Following up on my note last week. No pressure — I know inboxes are what they are.

If the role has been filled, congrats, and let me know if there are other openings I should watch. If it's still open, my offer stands: I can send 2-3 profiles this week.

Carlos

---

**Do not send a Cold Email 3.** Two touches is the limit. More is spam.

## Compliance and consent

- Every email captured through the site's `/employers` form has explicit consent language: "By submitting, you agree that Carlos will contact you personally about your request."
- No captured email is added to a broader marketing list without a separate opt-in.
- Every email Carlos sends has an unsubscribe / reply STOP language in the footer, even the 1:1 ones. Simple: "If you'd rather not hear from me, just reply STOP and I'll never write again."
- Cold outreach: only to publicly-listed emails from company sites, LinkedIn (using LinkedIn's own messaging when possible), or introductions through mutual contacts. Never scraped from lead databases.

## Metrics to track per email

- Open rate (basic; Postmark or similar tracks this)
- Reply rate (the real metric)
- Meeting-booking rate from replies
- Intro-fee-paid rate from meetings
- Placement-fee-paid rate from interviews

If reply rate on Cold Email 1 is below 15%, the targeting is wrong — pause and re-select the recipient list.

If open rate is high but reply rate is low, the subject line is fine but the body isn't earning a response — rewrite.

## The one rule for all employer email

**Every email Carlos sends to an employer should be one an employer would forward internally to their VP of Talent as a good example of professional outreach.** If it wouldn't survive that forward, it doesn't get sent.

---

## Addendum · the post-a-role funnel, as built (July 2026)

The employer journey on the site, designed to conversion research (progressive disclosure: three short steps outperform one long form; pay and work model asked up front; trust copy at the moment of commitment):

1. **Entry**: the cobalt employer band on `/jobs` ("The applicants you never see are already measuring your role", live stats, one CTA), the nav CTA, and the claim link on every backfilled detail page.
2. **Step 1 · The role**: title, salary band ("listings with pay rank higher"), remote, apply link. As the employer types, the title is matched live against the occupation taxonomy (title + synonyms) and offered as chips.
3. **Step 2 · The company**: company, work email, name, two-sentence pitch.
4. **Step 3 · Review and send**: summary rows, one primary button carrying the offer ("Post the role, first month featured free"), hand-review-within-two-days trust note. Transport is a structured mailto until Supabase lands; the fields map 1:1 to the future table.
5. **The right rail is the differentiator**, visible through all three steps: a live preview of the listing card exactly as candidates will see it (with the Featured tag), and, once the occupation resolves, the **adjacency fan-in panel** — how many measured routes lead into the role, the top origins with their readiness percentages, and how many live listings it joins. Real numbers from the graph; the "who will see this" evidence no other job board can render.

The search bar on `/jobs` also matches occupation synonyms and word prefixes in both directions ("architecture" finds architect roles), so employer-side and candidate-side vocabulary both land.


## Addendum: the full-page posting flow (RemoteOK study)

/employers is now the post-a-job page, full stop — the marketing prose was removed. A single Swiss-brutalist flow in five numbered sections with a sticky live-preview + adjacency rail:

1. The role — title (live occupation match), employment type, remote, where-from.
2. Compensation — salary min/max USD/yr, pushed with the "Google indexes salary, ranks higher" framing borrowed from RemoteOK.
3. The posting — about / responsibilities / qualifications, a **skills picker** against our own skill bank (our answer to RemoteOK's tags/stack), and a **benefits chip picker** whose first entries (equity, 4-day week, visa) map to the board's derived filter tags.
4. The company — name, **logo URL** (previews live), private work email, contact.
5. How to apply — apply URL or email, with the "a form beats an email" guidance.

Taken from RemoteOK: the dedicated full page, the logo, salary prominence, benefits chips, apply-URL guidance, the live preview. Dropped as off-model: all à-la-carte upsells (sticky/highlight/blast/QR/geolock/brand-color), invoice/VAT/PO/pay-later billing, Twitter, feedback box, AI writer. Submit still composes one structured email (no backend); fields map 1:1 to the future Supabase table.


### Second pass (flow questioned and rebuilt)

- One calm centered column (~860px), five numbered sections; the two-column rail is gone.
- The adjacency fan-in now appears **inline in section 01** the moment the role matches an occupation — context where the action is, not in a far rail.
- The preview is **docked to the bottom of the viewport** (the RemoteOK pattern) and rendered by the **actual JobCard component the board uses** — real by construction, updating live, arrow and tags included.
- Workplace is a three-way segmented choice (On-site / Hybrid / Remote) with mode-aware location labels; employment type is a chip row.
- The skills picker accepts **custom skills** ("Add X as a new skill") when the bank lacks one, so no real requirement is blocked.
- Logo hint made honest: it shows on the listing page; the board card stays typographic.
