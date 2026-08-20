# Redesign V2 · 01 · Preview safety

*How the `redesign-v2` branch stays invisible to search engines and harmless to production.*

## Isolation
- Branch `redesign-v2`, worked in a **linked git worktree** at `~/PivotHop-redesign` so the twice-daily scraper bot (which commits on whatever branch `~/PivotHop` has checked out) can never sweep redesign files into a data commit, and the redesign can never block a production publish.
- Nothing merges to `main` until explicit design approval (brief §28).

## Preview deployment
- Pushing the branch to origin creates a standard Vercel Preview with its own `*.vercel.app` URL. Production domain and its deployment are untouched.
- **Vercel serves `X-Robots-Tag: noindex` on all preview deployments by default.** Verify after the first push: `curl -sI <preview-url> | grep -i x-robots` must show `noindex`.
- Check in the Vercel dashboard whether Deployment Protection is enabled for previews (Settings → Deployment Protection). If it is, previews additionally require auth, which is strictly better. Do not weaken it.

## Design-lab-specific layers (belt and suspenders, all inside `/design-lab` files only)
1. Every design-lab route exports `robots: { index: false, follow: false }`.
2. The design-lab layout calls `notFound()` when `VERCEL_ENV === 'production'`, so even an accidental merge cannot expose the lab on the live domain.
3. `/design-lab` is not in `sitemap.ts`, is never linked from any production template, and its URL is not to be posted publicly.

## Environment guards on previews
- Vercel **crons do not run on preview deployments**, so the social autoposter cannot select or queue from a preview.
- `/admin` remains behind Basic Auth on previews (same middleware).
- `/api/social/*` remains gated by `CRON_SECRET` / `SOCIAL_FEED_TOKEN` on previews; a preview cannot publish anything anywhere by itself.
- The site sends no transactional email at request time and has no billing actions in request paths (LemonSqueezy/Stripe tables exist but no live checkout flow in templates). No further guards required; re-verify if that changes before Phase A migration.

## What was deliberately NOT changed
- Production `robots.ts`, `sitemap.ts`, canonicals, metadata, redirects, headers: untouched. No preview-conditional code exists outside `/design-lab`.
