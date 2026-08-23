# 35 · Social autoposter

*Written 2026-08-19. Updated 2026-08-21. LinkedIn publishing via Zapier, selection via the corpus. The direct Posts API adapter exists (`lib/social/linkedin.ts`) but is deliberately unwired: Zapier needs no LinkedIn API approval, and swapping it out later touches only the publisher, never the selection engine.*

## Architecture

One platform-independent engine in `apps/web/src/lib/social/`:

- `select.ts` · eligibility (live on the board, has an internal page, title+company sane, under 60 days old, not posted before, not a near-duplicate) then a deterministic `social_score` 0..100 with a stored plain-text reason, then diversity constraints against the recent ledger (no company from the last 5 posts, no occupation from the last 3). The selector also accepts a remote and occupation filter for the dedicated architecture slot. Same corpus, same run, same pick: no randomness, no model.
- `copy.ts` · six alert-style templates rotated by a hash of the job id; regenerate bumps the variant. Social copy uses the branded `/j/{job-id}` URL; the redirect adds UTM attribution (`linkedin / organic_social / daily_jobs / occ-id`). Hashtags are derived from the job title and occupation, with role, modality and specialty tags capped at 5.
- `store.ts` · `social_posts` in Supabase over raw REST (the admin/data.ts pattern). `unique (platform, job_id)` plus compare-and-set status transitions make duplicate publication impossible.
- `linkedin.ts` · the future direct provider, unwired.

Flow: **15 Vercel crons across the UTC day** → `/api/social/cron` selects one job → row lands as `scheduled` → **Zapier** polls `/api/social/feed`, publishes to the LinkedIn page, then POSTs `/api/social/consume` → row becomes `published`. Five slots cover Asia business hours, four cover Europe, and six cover the Americas. The 15:15 UTC slot first looks for a source-verified remote architecture job. If that attempt falls back to the general pool, the four later Americas slots retry architecture until one is queued that UTC day. The feed drops expired jobs (board presence is the liveness check) before any publisher sees them.

Automatic scheduling is the default. Set `SOCIAL_AUTO_APPROVE=false` only when an emergency review mode is needed. Existing manual controls remain available in `/admin/social` for old drafts, skips, regeneration, and immediate replacements.

## Setup

1. Run the migration `supabase/migrations/0006_social_posts.sql` in the Supabase SQL editor.
2. Vercel env vars: `CRON_SECRET` (long random; Vercel sends it automatically on cron calls) and `SOCIAL_FEED_TOKEN` (long random, different).
3. Deploy. The 15 daily crons in `apps/web/vercel.json` activate on their own. No auto-approval environment variable is required.

## Zapier connection

1. Zapier → Create Zap.
2. **Trigger:** app "Webhooks by Zapier" → event **Retrieve Poll**. URL: `https://www.pivothop.com/api/social/feed?token=YOUR_SOCIAL_FEED_TOKEN`. Deduplication key: `id` (Zapier's default).
3. **Action 1:** app "LinkedIn" → event **Create Company Update**. Connect the LinkedIn account that is Super Admin of the PivotHop page. Select the PivotHop company page. Comment: map `generated_post_copy`. Leave the URL field empty; the copy already carries the branded link and LinkedIn follows its redirect.
4. **Action 2:** app "Webhooks by Zapier" → event **POST**. URL: `https://www.pivothop.com/api/social/consume?token=YOUR_SOCIAL_FEED_TOKEN`. Payload type JSON, data: `publication_id` = the trigger's `publication_id`.
5. Zap polling interval: 15 minutes is fine; the feed is idempotent to re-polls.

## Branded social links

A post shows `https://www.pivothop.com/j/{job-id}`. The route looks up the occupation from the social ledger and returns a 307 redirect to:

`/jobs/{occupation}/{job-id}?utm_source=linkedin&utm_medium=organic_social&utm_campaign=daily_jobs&utm_content={occupation}-{job-id}`

The redirect sends `X-Robots-Tag: noindex, follow`, so it does not create a duplicate indexable surface. The destination job page remains the source of the listing context.

## Validation

After deployment:

1. Use **Queue a replacement now** in `/admin/social`, or wait for the next cron.
2. Confirm the row enters as `scheduled`, not `draft`.
3. Open the generated `/j/{job-id}` URL and confirm it reaches the correct job with all four UTM parameters.
4. Let Zapier publish the item.
5. Confirm the post on the PivotHop LinkedIn page and verify that the row becomes `published`.

## Operations

- Default frequency: up to 15 posts/day inside Zapier's poll cadence.
- `SOCIAL_POSTS_PER_DAY` caps selection; its default is 15. The daily count and cron schedule use UTC so the Asia, Europe and Americas slots share one predictable quota.
- The 15:15 UTC run prioritizes remote architecture roles. If it cannot queue one, the four later slots retry until architecture succeeds or the UTC day ends. Every attempt preserves deduplication and source verification, and each failed architecture attempt falls back to a verified general role for that run.
- To pause publication immediately, turn the Zap off.
- To restore manual review mode, set `SOCIAL_AUTO_APPROVE=false` and redeploy.
- Hashtags are derived from the role, occupation and remote status in `copy.ts`.

## Later: direct API

When LinkedIn Community Management access is worth having: wire `publishLinkedInPost()` into a consumer of the same queue, fill the `LINKEDIN_*` env block, retire the Zap. Selection, copy, dedup, admin: unchanged.
