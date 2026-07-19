# PivotHop — Kill Criteria

*The honest tests that would tell you this project isn't working. Written before ship so they can't be reasoned away when the data comes in.*

---

## Why kill criteria exist

Most projects don't get killed when they should. Founders reason around bad data, reset the goalposts, and keep going. Six months in, they've spent time they can't get back on something that already told them it wasn't working.

Kill criteria protect Carlos from that failure mode. They are pre-committed thresholds. When they trigger, they trigger a specific action — not "keep pushing," but "stop, diagnose, and decide."

The three possible responses to a kill trigger:

1. **Continue** — with a specific, evidence-based rationale for why the trigger isn't the signal it appears to be. Must be written down.
2. **Pivot** — a specific change in scope, positioning, or channel strategy. Must be a change, not a redouble of the current approach.
3. **Stop** — sunset the project, document what was learned, apply lessons elsewhere.

"Keep going and see what happens" is not a valid response to a trigger.

---

## V0 kill triggers (evaluated at day 90)

### Trigger 1: The scrape doesn't produce defensible signals

**The check:** at day 60, can the scrape produce clean per-role data for the launch vertical's 8 first-hop routes (origin: Architect) — match %, salary band, skills gap, demand indicator for each — **and** pass spot-checks on at least 5 other origin occupations from the global taxonomy (routes exist, numbers are sane, confidence flags honest)?

**Kill signal:** the answer is no. The data is dirty, incomplete, or inconsistent across roles. Or scraping is producing so much noise that Carlos's judgment layer can't rescue it.

**Why this is fatal:** everything depends on the scrape. No scrape = no product.

**If triggered:** stop building the site, stop the marketing rollout. Diagnose whether the scrape can be salvaged with a different technical approach, or whether the underlying data available on the internet doesn't support the product's premise. If the scrape can't be made to work in 30 more days of focused effort, stop.

### Trigger 2: Fewer than 25 people reach day 6

**The check:** at day 90, how many people have engaged with the tool six or more distinct days?

**Kill signal:** fewer than 25. Target was 100.

**Why this matters:** day-6 is the qualified pool. Without it, there's no supply side for the concierge business.

**If triggered:** diagnose whether it's a distribution problem (they never showed up) or a retention problem (they showed up once and never came back). Distribution failure means the marketing strategy is wrong. Retention failure means the tool isn't holding attention. Fix one or the other before continuing.

### Trigger 3: Reddit launch data-post gets less than 30 upvotes on r/Architects

**The check:** the launch data-post's upvote count 48 hours after posting.

**Kill signal:** fewer than 30 upvotes.

**Why this matters:** r/Architects is the bullseye audience. If Carlos can't produce a chart from real data that this audience recognizes as valuable, either the data isn't good, the framing is wrong, or the audience isn't as engaged with career-pivot content as assumed.

**If triggered:** post-mortem the specific post. Was the data compelling? Was the framing right? Would a different subreddit have received it better? If iteration produces a second post that hits 100+, the strategy is fine and post 1 was a bad shot. If the second post also lands <30, the audience or the data is the problem.

### Trigger 4: Zero concierge employer conversations opened

**The check:** at day 90, how many real employer conversations has Carlos had? Not form submissions — actual back-and-forth conversations about hiring adjacent talent.

**Kill signal:** zero.

**Why this matters:** without employer demand, the concierge business has no monetization path. Even one signal-generating conversation is enough — it proves the mechanic is real. Zero means it isn't.

**If triggered:** the employer-side thesis needs re-examination. Is the direct outreach approach failing? Is the messaging wrong? Is the segment (small-to-mid AEC firms) actually not the right ICP for adjacent-hire concierge? Get in front of 10 hiring leads for 15-minute conversations before deciding the model is broken.

### Trigger 5: No pillar-quality data post can be produced

**The check:** at day 90, can Carlos produce at least one data-driven blog post grounded in the scrape's real output — with a defensible uncopyable sentence?

**Kill signal:** no. The data isn't rich enough or the analytical work isn't producing findings that hold up.

**Why this matters:** the pillar content is the SEO strategy's differentiation. Without it, every blog post is fluff that Google will demote.

**If triggered:** the scrape needs more work, or Carlos needs to define what "publishable finding" means at a lower threshold. If the data can't sustain even one pillar post at 90 days, it can't sustain 30 posts at V1.

---

## V0.5 kill triggers (evaluated at day 180)

### Trigger 6: No concierge employer placement or paid pilot

**The check:** at 6 months, has any concierge employer relationship converted to a paid interaction (intro fee, placement fee, retainer, or pilot payment)?

**Kill signal:** zero paid interactions.

**Why this matters:** the concierge model needs to prove itself. Six months is enough time for at least one relationship to convert if the model works.

**If triggered:** the employer economics don't work as designed. Options: adjust pricing, adjust the concierge scope, reconsider the ICP, or accept that the free-tool-with-concierge-monetization model isn't the right business shape for this niche.

### Trigger 7: Traffic plateaus below break-out threshold

**The check:** at 6 months, is monthly organic traffic on a growth curve or has it flatlined?

**Kill signal:** organic sessions have been below 2,000/month for three consecutive months with no upward trend.

**Why this matters:** at boutique scale, the business needs traffic momentum. Flatlined traffic means either the SEO strategy isn't working or the topic isn't as searched as assumed.

**If triggered:** diagnose whether it's technical SEO (site issues, ranking losses), content SEO (posts and routes not competitive), or market SEO (the niche isn't searching the way assumed). Fix the specific cause. If the market itself isn't searching, reconsider whether AEC is the right V0 niche.

### Trigger 8: Voice recognition fails

**The check:** at 6 months, is PivotHop being described unprompted in tracked subs, LinkedIn, or industry conversations?

**Kill signal:** zero unprompted mentions in 6 months.

**Why this matters:** the whole positioning thesis is that the voice + honesty combination is memorable enough to spread organically. If nobody is talking about the brand unprompted after 6 months of engagement, the differentiation isn't as strong as assumed.

**If triggered:** deep positioning review. Is the voice actually differentiated? Is the audience noticing? Is the "instrument, not motivational poster" frame landing? If the answer is that the differentiation isn't working, the whole positioning may need rebuilding.

---

## V1 kill triggers (evaluated at day 365)

### Trigger 9: No repeat concierge employer relationships

**The check:** at 12 months, has any employer used the concierge service more than once?

**Kill signal:** every employer relationship has been one-and-done.

**Why this matters:** the business only compounds if employers come back. One-off relationships are okay in year one but signal a broken model if none convert to repeat business.

**If triggered:** the placements are either not working (candidates leaving quickly, employers dissatisfied) or the ongoing value isn't being communicated. Either fixable, but requires structural work.

### Trigger 10: Revenue below sustaining threshold

**The check:** at 12 months, what is the annualized revenue run rate?

**Kill signal:** less than $20K/year. This is below the threshold at which the project justifies Carlos's ongoing time investment as a "boutique second income stream" (per objectives.md).

**Why this matters:** the objective was a real small business, not a hobby. If revenue can't reach $20K by month 12, it's a hobby.

**If triggered:** decide whether year 2 will realistically hit revenue targets or whether the project should be sunset gracefully.

---

## Signals that are NOT kill triggers

These will feel bad but don't warrant killing:

- **Slow month.** One month of low traffic or engagement is noise. Three months of consecutive decline is a signal.
- **A specific post underperforming.** Individual pieces of content miss. That's normal. Pattern of underperformance is the signal.
- **Competitor launches.** Someone else building an "adjacent talent job board" doesn't threaten PivotHop's specific niche play. Most competitors will build the wrong thing.
- **Getting flamed in a Reddit thread.** Happens. Not a strategic signal unless it happens repeatedly and reveals a real product problem.
- **Carlos feeling tired.** Distinct from the project not working. If Carlos is tired but data is good, the project works and he needs a break. If Carlos is tired and data is bad, that's convergent evidence.

---

## The founder discipline

The hardest part of kill criteria is honoring them when they trigger. Carlos should:

1. **Write down the response** — before checking whether the data hit the threshold, decide what "continue," "pivot," or "stop" would each look like. Then evaluate.
2. **Talk to at least one outside voice** — a peer, a trusted advisor, or someone who can look at the data without the emotional attachment. Sometimes another brain can see what's obvious.
3. **Set a 7-day cooling window** — no major structural decisions on the same day the trigger data comes in. Sit with it. Come back with fresh eyes.
4. **Document the decision** — whichever path is chosen, write down why. This makes future kill decisions easier because the pattern of reasoning becomes visible.

---

## The one thing to remember

**The point of kill criteria is not to be pessimistic. It's to be honest.**

A project that ships with real kill criteria is a project that trusts its own thesis enough to be tested against reality. Projects that ship without kill criteria are projects that don't want to know.

PivotHop is trying to be a real business, not a permanent side project. Real businesses are willing to be tested.
