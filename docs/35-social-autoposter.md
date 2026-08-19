# 35 · Social autoposter

*Written 2026-08-19. LinkedIn publishing via Zapier, selection via the corpus. The direct Posts API adapter exists (`lib/social/linkedin.ts`) but is deliberately unwired: Zapier needs no LinkedIn API approval, and swapping it out later touches only the publisher, never the selection engine.*

## Architecture

One platform-independent engine in `apps/web/src/lib/social/`:

- `select.ts` · eligibility (live on the board, has an internal page, title+company sane, under 60 days old, not posted before, not a near-duplicate) then a deterministic `social_score` 0..100 with a stored plain-text reason, then diversity constraints against the recent ledger (no company from the last 5 posts, no occupation from the last 3). Same corpus, same run, same pick: no randomness, no model.
- `copy.ts` · six restrained templates rotated by a hash of the job id; regenerate bumps the variant. The adjacency template only fires when a measured route with match ≥ 60 exists. UTM (`linkedin / organic_social / daily_jobs / occ-id`) on every URL. Hashtags from `SOCIAL_HASHTAGS`, max 4.
- `store.ts` · `social_posts` in Supabase over raw REST (the admin/data.ts pattern). `unique (platform, job_id)` plus compare-and-set status transitions make duplicate publication impossible.
- `linkedin.ts` · the future direct provider, unwired.

Flow: **Vercel cron** (08:45 · 12:45 · 16:45 Costa Rica) → `/api/social/cron` selects one job → row lands as `draft` (or `scheduled` when `SOCIAL_AUTO_APPROVE=true`) → **/admin/social** to approve/skip/regenerate/queue-a-replacement → **Zapier** polls `/api/social/feed`, publishes to the LinkedIn page, then POSTs `/api/social/consume` → row becomes `published`. The feed drops expired jobs (board presence is the liveness check) before any publisher sees them.

## Setup

1. Run the migration `supabase/migrations/0006_social_posts.sql` in the Supabase SQL editor.
2. Vercel env vars: `CRON_SECRET` (long random; Vercel sends it automatically on cron calls) and `SOCIAL_FEED_TOKEN` (long random, different). Leave `SOCIAL_AUTO_APPROVE` unset.
3. Deploy. The three crons in `apps/web/vercel.json` activate on their own.

## First dry run (approval mode IS the dry run)

- Wait for a cron tick, or force one: `curl -H "Authorization: Bearer $CRON_SECRET" https://www.pivothop.com/api/social/cron`
- Open `/admin/social` (existing Basic Auth). Inspect the pick, the score, the reason, the exact copy. Nothing reaches the feed until Approve.

## Zapier connection (exact steps)

1. Zapier → Create Zap.
2. **Trigger:** app "Webhooks by Zapier" → event **Retrieve Poll**. URL: `https://www.pivothop.com/api/social/feed?token=YOUR_SOCIAL_FEED_TOKEN`. Deduplication key: `id` (Zapier's default). Test: with one approved item in the queue the test returns it.
3. **Action 1:** app "LinkedIn" → event **Create Company Update**. Connect the LinkedIn account that is Super Admin of the PivotHop page (plain OAuth login inside Zapier, no developer portal). Select the PivotHop company page. Comment: map `generated_post_copy`. Leave the URL field empty (the copy already carries the UTM link; LinkedIn unfurls it).
4. **Action 2:** app "Webhooks by Zapier" → event **POST**. URL: `https://www.pivothop.com/api/social/consume?token=YOUR_SOCIAL_FEED_TOKEN`. Payload type JSON, data: `publication_id` = the trigger's `publication_id`. This burns the item; without this step the item still fires only once (Zapier dedups on `id`), but the queue would show it as unconsumed.
5. Zap polling interval: 15 minutes is fine; the feed is idempotent to re-polls.

## One test post

Approve exactly one draft in `/admin/social`, publish the Zap once with "Test & Review" on the LinkedIn step (or turn the Zap on and wait a poll). Confirm the post on the page, then check the row shows `published` in `/admin/social`.

## Going automatic

Set `SOCIAL_AUTO_APPROVE=true` in Vercel env and redeploy. Cron output then lands directly in the feed and the Zap publishes ~3/day inside Zapier's poll cadence. Frequency: `SOCIAL_POSTS_PER_DAY` caps selection; the cron times live in `apps/web/vercel.json` (UTC; Costa Rica is UTC−6).

## Later: direct API

When LinkedIn Community Management access is worth having: wire `publishLinkedInPost()` into a consumer of the same queue, fill the `LINKEDIN_*` env block, retire the Zap. Selection, copy, dedup, admin: unchanged.
