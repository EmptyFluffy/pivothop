# 30 — CTAs to the job board

*What every content page should ask the reader to do, and where. Written 2026-09-10 with the first Search Console export in hand (docs/25 has the numbers). Companion to docs/26 (board UX principles).*

## What the export told us

Content pages earn the impressions: the comparison family sits at positions 5 to 15 for "X vs Y salary" and "who gets paid more". Clicks, when they come, stay on the page. The board is one click away and the page did not say so. Three of the ten most-shown pages had no link to a single live role.

The reader on a comparison page is deciding between two jobs. The most useful next step is not "run the instrument" first; it is "show me what those jobs look like right now". The instrument is the second ask.

## The CTA set, per template

One primary ask per viewport. Every ask names a number the build computed, and only renders when the number is above zero (no "browse 0 jobs").

| Template | Above the fold | Mid-page | Closing |
|---|---|---|---|
| Comparison `/compare/a-vs-b` | Fact columns carry "N open right now" with a text link per side | Four freshest roles per side (JobsList), then the two-board banner: primary pill to the larger board, outline pill to the other | Instrument banner, then FAQ with linked counts |
| Occupation board `/jobs/occ` | The board itself | Routes in, more searches | Employer banner (hiring this role?) |
| Route `/routes/a-to-b` | Readiness and gap | Freshest destination roles (JobsList) | Instrument banner |
| Salary `/salary/occ` | Bands | Freshest roles paying in band (JobsList) | Board link with count |
| Career guide `/career-guides/occ` | Pay band | Open roles (JobsList) | Board link with count |
| Company `/companies/slug` | Their open roles | | Board by field |
| Skill `/skills/slug` | Roles it unlocks | Freshest roles naming it | Board link with count |

## Rules

1. The number is the copy. "44 aerospace engineer jobs", never "Browse jobs". A count-gated link is honest and it converts better than a verb.
2. Board asks come before instrument asks on pages whose intent is comparison, salary or a specific occupation. The instrument is the ask on pages about the reader (home, routes out of an origin).
3. Two pills at most in one banner: a filled primary and an outline secondary. Never two filled pills side by side.
4. The employer ask ("hiring X?") lives only on board pages and the hire pages. It does not go on comparison, salary or guide pages, where the reader is a candidate.
5. Every job list is the board's own JobCard (logo, title, company, place, pay, age, save, apply), under a section heading, with a "see all N" link. No other list shape for jobs.
6. FAQ answers link the count ("1,061 registered nurse openings") to the board, and the companies hiring most to their company pages.

## What changed on 2026-09-10

- Comparison pages rewritten: title carries the question ("pay, skills and which pays more"), description leads with the pay verdict and the open-role count, a short-answer band at the top, four freshest roles per side, the two-board banner, linked shared skills, linked companies in the FAQ.
- 36 comparison pages that Search Console showed with impressions (3,023 between them, the site's most-shown page among them) had dropped to 404 when the adjacency data stopped scoring a direction. They are back as proven pairs: pay and boards compared, readiness stated as not scorable. A key in `PROVEN_PAIRS` is never removed without a redirect.
