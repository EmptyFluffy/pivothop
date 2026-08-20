# Redesign V2 · 00 · Current architecture

*Audited 2026-08-19 on commit f3ccf2b8, by reading the code, not inferring.*

## Framework and hosting
- **Next.js 16.2 (App Router)**, npm workspaces monorepo (`apps/web` is the site; `apps/scraper` feeds it and is out of redesign scope).
- **Vercel**, project root `apps/web`. Mostly static output; ISR only on `/jobs/[occ]/[id]` (on-demand, revalidate 86400, noindexed). Serverless: `/admin/*` (force-dynamic) and `/api/social/*`. Middleware: `src/proxy.ts` (Basic Auth on `/admin`, geo cookies `ph-ch`/`ph-cc` with the docs/32 rule that served HTML stays byte-identical for crawlers).
- Deploys are pushed by the **scraper bot twice daily** (07:15, 16:15 CR) from a Mac via launchd; the bot commits regenerated data on whatever branch `~/PivotHop` has checked out. **Consequence: the redesign lives in a linked git worktree (`~/PivotHop-redesign`), never checked out in the bot's tree.**

## Styling
- **One global stylesheet**: `src/app/globals.css`, 1,858 lines, hand-written custom properties. No Tailwind, no CSS modules in app pages (one stray `page.module.css`), no component library. Blast radius of editing it: the entire site.
- Tokens (`:root`): `--ink #15151a`, `--ink-2/3`, `--paper #f5f3ed`, `--paper-2`, `--card #faf9f5`, `--rule/rule-2`, `--accent #002FA6` (+press/tint), `--dur .15s`, `--ease cubic-bezier(.4,0,.2,1)`, `--r-pill`, `--r-soft`.
- Shell: `.shell{max-width:1280px}` with hairline side borders; board pages opt into `.shell-wide` (clamp to 1600px).

## Typography
- `next/font/google` in the root layout: **Instrument Sans** (`--font-sans`) + **Space Mono** (`--font-mono`), self-hosted at build. The `.lbl` class (mono 10.5px uppercase letterspaced) is the site-wide label idiom.

## Data flow
- Board data = committed JSON under `public/data` (`all-jobs.json`, `jobs/<occ>.json`, `jobs-detail/<occ>.json`, `skills-glossary.json`, logos), regenerated nightly. Server reads via `src/app/jobs/jobs-data.tsx` (fs + bounded parse LRU). Route/adjacency data = `packages/data/generated/*.json` read via `src/app/routes/routes-data.tsx`; salary via `salary/salary-data.tsx`; compare via `compare/compare-data.tsx`; blog = `blog/posts.tsx` (typed TSX registry, 44 posts).
- Client board (`JobsBrowse.tsx`) fetches the same public JSON; URL-state filters; split-pane detail (desktop) / bottom sheet (mobile) fetch the listing's own ISR page and parse it (`jobs/detail.ts`).

## SEO machinery (the asset being protected)
- `layout.tsx`: `metadataBase = https://www.pivothop.com`; per-page `generateMetadata`; canonical host is www (host-level 301 apex→www).
- `sitemap.ts`: composed from the same data modules the pages use; honest per-page `lastmod` from `public/data/lastmod.json` (only advances when underlying data changed). Live sitemap: **3,047 URLs** (jobs 2,324 · routes 286 · compare 243 · salary 143 · blog 45 · singles).
- `robots.ts`: allows all + explicitly welcomes 14 named AI bots; disallows `/admin`, `/data/`, and `/jobs/*/*` (14.5k noindexed job-detail pages; disallow saves the crawl budget). Job detail pages carry `noindex, follow` meta.
- Structured data: FAQPage JSON-LD on blog posts (takeaways/faq fields), schema on salary/route pages (verify per-template during migration), `feed.xml`, `llms-full.txt`, IndexNow pings post-deploy from the bot.
- Voice/SEO invariants live in `CLAUDE.md` + docs (em-dash ban, two-typeface rule #7, accent-on-data rule #6, "measure then act").

## Analytics
- `@vercel/analytics` in the root layout. No custom event layer.

## Gates that already exist (reuse for regression checks)
- `npm run build` then `npm run check:links` (link integrity) and `report-check.mjs` run inside the bot before every publish. Lint has 173 pre-existing errors and is not a gate.
