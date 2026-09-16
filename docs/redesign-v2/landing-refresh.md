# Landing refresh · September 16, 2026

## Scope and review

Carlos requested a review of the current landing, an explanation of the changes,
then implementation. This iteration lives at `/design-lab/landing` on
`redesign-v2/landing-refresh`. The earlier redesign brief and `01-preview-safety.md`
require design approval before production migration. The existing production
homepage is unchanged. `/design-lab/landing/review` provides 360, 390, 768 and
1280px viewport frames for review.

## Direction

- Preserve Instrument Sans, Chivo Mono, the violet light theme and gold dark theme.
- Keep the “Career moves, measured.” headline, with lighter weight and shorter copy.
- Replace the decorative hero illustration with three real, linked career routes.
- Promote the existing search and separate live market counts into readable metrics.
- Place the two existing instruments directly after remote jobs.
- Present the remaining four existing job categories as compact two-column lists.
- Keep all five category destinations, the same 20 unique job selections, popular
  search destinations, instruments, resource destinations, nav and footer.

## Implementation boundaries

Next.js 16 App Router server component with a scoped CSS module. Reuses
`PageShell`, `LandingSearch`, jobs/category loaders and route loaders. No new
dependencies, client fetching, external images, fabricated numbers or simulated
controls. Route percentages come from `originRoles`, and only routable pairs are
shown. Required licenses and the meaning of skill readiness remain visible.

No changes to production templates, global styles, metadata, schema, canonical
logic, sitemaps, robots, routing, authentication, database, scraper, analytics,
payments or environment variables. The existing lab layout blocks production
and supplies noindex/nofollow. The preview adds no write actions.

## Verification

TypeScript and ESLint pass for the implementation. Preview build, browser visual
checks and search/navigation verification are recorded in the pull request.

If approved, migrate only the homepage presentation, preserving its metadata,
WebSite schema and server-rendered linking structure; remove the review harness
from the production-facing component.
