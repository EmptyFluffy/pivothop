# 21 · Wiring: Supabase + Vercel

*How the /employers post-a-job form captures submissions, and what to set to make it live. The code is done; this is the ops checklist.*

---

## How it works

The form (`apps/web/src/app/employers/EmployerForm.tsx`) submits through a Next.js **server action** (`apps/web/src/app/employers/actions.ts`), which POSTs the row to Supabase over REST with the service key — the same pattern the scraper uses, no client library. The service key lives only on the server; nothing sensitive reaches the browser.

- **With `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` set** → the submission inserts into `job_submissions`, the form shows the success state, and (if Postmark is configured) you get an email.
- **Without them** (local dev, or before you wire it) → the action returns `not-configured` and the form falls back to the prefilled **mailto**. Nothing breaks either way.

The two pricing tiers are selectable in the form; the chosen tier (`standard` | `featured`) is stored on the row and named in the notification.

## One-time Supabase setup

1. Create a project at supabase.com (free tier is plenty).
2. Run the migrations in `supabase/migrations/` against it (SQL editor, or `supabase db push`): `0001_init.sql` then `0002_job_submissions.sql`. The second creates `job_submissions` (RLS on, no policies — service-key only).
3. From Project Settings → API, copy the **Project URL** and the **service_role key**.

## Vercel deploy

1. Import the repo into Vercel. Root is the monorepo; set the **project root / app** to `apps/web` (Next 16). Build command `next build`, output auto.
2. In Project → Settings → **Environment Variables**, set (Production + Preview):
   - `SUPABASE_URL` — the Project URL
   - `SUPABASE_SERVICE_KEY` — the service_role key
   - *(optional)* `POSTMARK_SERVER_TOKEN`, `POSTMARK_FROM` (a verified sender), `POSTMARK_NOTIFY_TO` (defaults to cvinocoura@gmail.com) — to get an email per submission.
3. Deploy. Submit a test job on the live `/employers`; confirm the row in Supabase → Table Editor → `job_submissions`.

Local testing of the real insert (optional): put the same vars in `apps/web/.env.local` and `npm run dev`.

## Reviewing submissions

They land in `job_submissions` with `status = 'new'`. Review by hand, post to the board (or the future admin path), and move `status` to `reviewing` / `posted` / `declined`. This is the concierge step that stays manual by design at hobbyist scale.

## Still to do for launch (unrelated to this wiring)

- The host-level **301**: apex → www and http → https (see memory `canonical-host-www`). Add `www.pivothop.com` as the primary domain in Vercel and redirect the apex.
