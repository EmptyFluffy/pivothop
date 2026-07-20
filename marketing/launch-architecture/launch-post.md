# r/Architects launch data-post — draft

*The §6 launch move (see `docs/09-marketing-strategy.md`). Register 2: PivotHop named in the methodology comment, described as the scrape source, no link on the first post. Ship after the account warm-up and once the numbers hold across two runs.*

**Status:** draft on 836 clean architecture postings (Jul 2026). Chart: `chart.png` (rendered from `chart.html`; numbers reproduce via `npm run scrape -- analyze:bridge architect`). Verify the figures haven't drifted before posting.

---

## The chart

`chart.png` — "The skills in architect job posts that architecture school never taught." Six bars, cobalt on paper, the +9.5% pay premium underneath.

## Title options (pick one, no question marks, no hype)

1. I read 836 architecture job posts. The most-transferable skills in them aren't architecture.
2. The skills in architecture job posts that architecture school never taught.
3. What 836 architecture postings actually ask for, ranked by how far the skill travels.

## The post body (image post; this goes as the first line / caption)

> Pulled 836 live architecture job postings and counted the skills that show up in them but aren't architecture — the ones that also appear across business, engineering, finance, healthcare. Sustainability, project management, spec writing, presentation. None of them are drawing or design. And the postings that name them pay about 9.5% more.

## The methodology comment (top comment, posted by the same account)

> Method, since someone will ask. These are 836 architecture postings scraped in July 2026 from public job-board APIs — Adzuna, Reed, USAJOBS, Greenhouse, Lever, Ashby, and a few others. No LinkedIn, no Indeed (both prohibit it). I map each posting's title to a global occupation taxonomy, then extract skills from the description against a fixed dictionary. "Non-architecture" here means a skill whose demand sits mostly outside architecture and construction — it shows up in three or more other fields.
>
> The percentages are the share of architecture postings that name each skill. They're honest but conservative: a lot of postings don't spell their skills out, so the real numbers are floors, not ceilings. The pay figure compares the median salary of postings that name at least one of these skills against those that don't (n=142 vs 663).
>
> The whole thing comes out of a tool I've been building called PivotHop — it maps where a given profession's skills can actually take you, from live postings. Happy to run the same read for any other field if people want to see it.

## Voice check (per `docs/01-style-direction.md`)

- No exclamation points ✓
- Numbers over adjectives ✓ (836, 9.5%, n=142/663)
- Deadpan; no "unlock/supercharge/journey" ✓
- Admits the limitation (percentages are floors) — this is the honesty moat, keep it
- Register 2: named, function stated, no link ✓

## Before posting

- [ ] Account warm-up complete (2–3 weeks, 20+ substantive comments, per `docs/09`)
- [ ] Re-run `analyze:bridge architect`; confirm the top skills and the pay premium are stable (±1–2 pts)
- [ ] Post weekday morning US Eastern, not on a major AEC news day
- [ ] Carlos owns the final wording — this is a draft, not his voice yet
