# PivotHop — Success Criteria

*Measurable per-surface tests that tell you whether V0 worked. Written before ship so they can't be moved to fit the result.*

---

## The north star metric

**Number of people who reach day 6 of engagement with the instrument in the first 90 days.** (The first cohort skews to the launch vertical — architects — because that's where the marketing aims; the metric is profession-agnostic.)

Rationale: day 6 (per §6 of the bible) separates casual visitors from people who treat PivotHop as part of their thinking. Day 1 visitors are noise. Day 6 users are the qualified pool from which everything else follows.

**V0 target:** 100 people reach day 6 in the first 90 days.
**Kill threshold:** fewer than 25 people reach day 6. That means either the tool doesn't hold attention or the audience never showed up. Both require diagnosis before continuing.

---

## Per-surface success metrics

### Homepage (candidate landing)

- **Sessions in first 90 days:** 3,000-8,000 (from Reddit + Google + LinkedIn combined)
- **Search bar interaction rate:** 20% of visitors interact with the search bar
- **Graph interaction rate:** 40% of visitors click at least one node
- **Report modal open rate:** 10% of visitors open the export modal
- **Email capture rate (from modal opens):** 30% of modal opens submit an email
- **Overall email capture rate (sessions to captures):** 3% (about 1 in 33 visitors)

Ship diagnosis:
- Sessions well below target → distribution isn't working; look at Reddit/SEO/LinkedIn signals
- Sessions on target, interaction rates low → the hero prose or the search bar UX is failing
- Interaction rates on target, modal opens low → the export CTA isn't compelling enough
- Modal opens on target, submissions low → the form asks too much or the value promise is unclear

### Preloaded route pages

- **Total organic sessions across all 20-30 pages in first 90 days:** 500-2,000
- **Time on page:** median >90 seconds (people are using the tool, not bouncing)
- **Email capture rate per page:** 5-10%
- **Backlinks acquired:** any inbound link from Reddit, LinkedIn, or industry blog counts as a win

Success signals per individual page:
- 100+ organic sessions/month by month 6 = winner, expand around it
- <10 organic sessions/month by month 6 = consider killing or restructuring
- Between = keep publishing, revisit at month 12

### About page

- **Sessions in first 90 days:** 800-2,000 (heavy inbound from Reddit "who built this" links, LinkedIn profile clicks, article bylines)
- **Time on page:** median >2 minutes (biographical pages should be read, not skimmed)
- **Bounce rate to product:** 20-30% of about-page visitors go to a route page or the homepage after reading
- **Direct email replies to Carlos:** at least 5 in first 90 days (indicates the "reachable founder" positioning is working)

### Blog posts

- **Organic sessions per post at 6 months:** 500-2,000 for pillar-quality posts, 100-500 for regular posts
- **Time on page:** median >2.5 minutes for pillar posts (long-form is being read)
- **Email capture from blog:** 2-5% of blog readers convert to email
- **Social shares (LinkedIn):** at least one comment or share per post from someone who isn't a personal contact of Carlos

### Reddit engagement

- **Substantive non-promotional comments per week:** 5-10 across tracked subs
- **PivotHop mentions in own comments per week:** 1-2 max (respecting 9:1 ratio)
- **Referral clicks from Reddit to PivotHop:** 200-500/month by month 6
- **Karma trajectory on tracked accounts:** monotonically increasing (no bans, no shadowbans)

Launch data-post specific:
- 50+ upvotes on r/Architects = worked
- 100+ upvotes = strong signal; ship follow-up post within 5 days
- <30 upvotes = data or framing didn't land; iterate

### LinkedIn organic (Carlos-as-founder)

- **Follower growth:** 200-500 new followers in first 90 days (secondary metric)
- **Post engagement rate:** 3-5% (comments + reactions vs. impressions)
- **DM conversations initiated:** 5-10 in first 90 days (real qualitative signal)
- **Click-through to PivotHop:** 100-300/month by month 6

### AEC educator partnerships

- **Conversations opened:** 5-8 partnerships approached in first 6 months
- **Partnerships activated:** 1-2 in first 6 months
- **Referred users from partners:** 100-500 within 90 days of first activation

### Employer side (concierge model)

- **Employer form fills:** 5-15 in first 90 days (small volume by design)
- **Intro calls booked from fills:** 30-50% of form fills
- **Concierge introductions attempted:** at least 3 in first 90 days
- **First successful placement:** target month 6-9

If zero placements by month 9, diagnose whether the mechanic works or whether the demand side (employers willing to pay for adjacent-hire postings and matches) has fundamentally weaker demand than the supply side (people wanting to pivot).

---

## Meta-metrics (portfolio-level)

### Overall traffic

- **Total unique users in first 90 days:** 3,500-10,000
- **Returning visitor rate:** 15-25% (people come back to check on their pivot thinking)
- **Direct traffic (as % of total):** 10-20% (indicates brand recognition growing)

### Voice recognition

Qualitative but real:

- **Unprompted mentions in tracked subs and LinkedIn:** 3-10 in first 6 months
- **"The one that isn't trying to sell me something" framing** appearing in comments about PivotHop
- **Being described consistently as "an instrument" or "the honest one"** by users who aren't Carlos's friends

### Reputation externalities

- **Recognizable industry citation:** at least 1 by month 12 (blog, podcast, publication)
- **AEC educator recommendation:** at least 1 partner publicly endorses by month 12
- **Cross-linked from a competitor's content:** if a rival career-tech site links to PivotHop, that's a signal

---

## What doesn't count as success

**Vanity metrics that will look tempting but aren't proof of anything:**

- Total pageviews (traffic without conversion is noise)
- Twitter/X followers
- LinkedIn followers alone (without engagement rate)
- Email list size alone (without engagement rate)
- Newsletter open rate alone (opens ≠ reads ≠ trust)
- Press coverage that doesn't drive qualified traffic
- Awards, "Best of" lists, feature roundups

If any of the above become the primary metric Carlos is tracking, something has gone wrong in the priorities.

---

## Measurement discipline

**Every metric above needs a source of truth:**

- Session, page, and referrer data: Plausible or Fathom analytics
- Reddit karma, upvote counts, comment activity: manual tracking in a spreadsheet
- LinkedIn engagement: LinkedIn's own analytics + manual tracking
- Email captures, opens, replies: transactional email provider dashboard
- Concierge pipeline: simple CRM (Notion database or Airtable)

**Cadence:**

- Weekly: quick check of the north star (day-6 users), Reddit activity, LinkedIn engagement, email captures
- Monthly: full review against all metrics above
- Quarterly: strategic review against kill criteria (`12-kill-criteria.md`)

---

## The uncomfortable rule

**Metrics can't be moved to fit the result.** If V0 hits 20% of targets, that means V0 hit 20%. It does not mean the targets were "unrealistic" or that "the metrics don't capture the qualitative wins." Those framings are how founders keep pouring time into projects that aren't working.

The metrics above are stated before ship because they are the honest test. When the data comes back, evaluate it against these targets — not against a new set of targets constructed to make the data look better.

If the data disappoints, that's information. Use it to decide: adjust, continue, or stop.
