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



## Reviewing submissions: /admin

A password-gated console at `/admin` lists everything in `job_submissions` (newest first): company, role, tier, contact, salary, skills, benefits, the full description, and the apply destination. Each card has a status dropdown (new / reviewing / posted / declined, written straight back to Supabase) and a one-click prefilled "Reply to {company}" mailto.

Gate: HTTP Basic Auth via `apps/web/src/middleware.ts`. Set **ADMIN_PASSWORD** (and optionally ADMIN_USER, default `admin`) in the Vercel env. The page is noindexed and disallowed in robots. Without the Supabase env it shows a "not connected" note.



## Stripe: automated employer payments

The post-a-job form is pay-to-publish, no concierge. Flow: form submit -> `startCheckout` inserts the row as `pending_payment` and creates a Stripe Checkout session -> employer pays on Stripe's hosted page -> `/api/stripe/webhook` (checkout.session.completed, signature-verified) flips the row to `paid` -> the board's `/api/employer-jobs` returns paid rows and JobsBrowse merges them in, so the listing appears instantly. Amounts come from `apps/web/src/app/employers/pricing.ts` server-side (never the client). Employer cards link straight to the apply URL; `/admin` can set status to `declined` to pull a post.

Dashboard setup (once):
1. Create a Stripe account. Start in **Test mode** to try it end to end.
2. Developers -> API keys: copy the **Secret key** (`sk_...`).
3. Developers -> Webhooks -> Add endpoint: URL `https://www.pivothop.com/api/stripe/webhook`, event **checkout.session.completed**. Copy the **Signing secret** (`whsec_...`).
4. In Vercel env set **STRIPE_SECRET_KEY** and **STRIPE_WEBHOOK_SECRET**, redeploy.
5. Test with card 4242 4242 4242 4242 (any future date / CVC), confirm the row goes `paid` and the job shows on /jobs. Then swap to live keys.

Without the Stripe env the form degrades to concierge (saves the lead as `new`, shows the queue message).

## Still to do for launch (unrelated to this wiring)

- The host-level **301**: apex → www and http → https (see memory `canonical-host-www`). Add `www.pivothop.com` as the primary domain in Vercel and redirect the apex.
