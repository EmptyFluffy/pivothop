# 34 — Accounts: saved jobs, magic-link sign-in, the dashboard

*Shipped 2026-08-24 (phase 1). Research: 5-lens workflow, synthesis in the
session log. Phase 2 (welcome email + digest) blocked on provisioning below.*

## Architecture

- **Auth**: Supabase Auth, magic link (`signInWithOtp`, no passwords). Session
  refresh lives in `apps/web/src/proxy.ts` only — the `@supabase/ssr`
  getAll/setAll bridge; the response object the bridge builds is the one
  returned (a fresh NextResponse drops Set-Cookie and logs users out).
- **Scanner defense**: the email links to `/auth/confirm?token_hash=...` which
  GET-renders an auto-submitting form; only the POST calls `verifyOtp`. Mail
  scanners prefetch GETs and would consume a one-time link. The same email
  carries a typeable 6-digit `{{ .Token }}` for the cross-device case.
- **Guest-first saves**: the bookmark toggle works with no account —
  localStorage `ph-saved`, FULL snapshots (job ids are sha1(url)[:10] and
  rotate out of the nightly build; a save must outlive its row), cap 50.
  Signing in merges into `saved_jobs` with the furthest-progressed status
  winning; localStorage then mirrors the server.
- **Static posture holds**: no per-user HTML anywhere. `/dashboard` is a
  static shell; saves, session, and counts hydrate client-side.
- **Data**: `supabase/migrations/0010_accounts.sql` — `saved_jobs` +
  `email_prefs`, per-user RLS (`auth.uid() = user_id`); the first tables real
  browsers touch through the anon key. `email_prefs.frequency` defaults
  `'off'`: the digest is explicit opt-in. A missing `email_prefs` row is the
  first-sign-in detector (drives the phase-2 welcome email).
- **Emails (phase 2)**: everything through the existing Postmark account.
  Magic links via Supabase custom SMTP; welcome on the transactional stream;
  the digest on a new Broadcast stream computed in the nightly CI job after
  the data commit (never Vercel cron). PostHog stays analytics-only.

## Surfaces

- Save toggle: job cards (icon, hover-revealed), the desktop pane and the
  phone sheet footers (labeled). Class `jv-save`; the board's capture-phase
  click interceptor skips it by class.
- Rail: "Saved" section on `/jobs` with a live mono count → `/dashboard`.
- Nav (v2): bookmark with count badge + a burger-menu row.
- `/dashboard`: one list, status tabs (Saved / Applied / Interviewing /
  Offer / Rejected), per-row status select (Applied stamps `applied_at`),
  autosaved notes, remove. Expired listings render from snapshot tagged
  "No longer listed", never auto-deleted.
- `/signin`: email → link. Degrades to an honest "not live yet" note until
  Supabase is provisioned.

## Provisioning checklist (Carlos, one-time)

1. Create the Supabase project (free tier). Run every file in
   `supabase/migrations/` in order, including `0010_accounts.sql`.
2. **Before touching templates**: Auth → SMTP Settings → custom SMTP:
   host `smtp.postmarkapp.com`, port 587, user AND password = the
   `POSTMARK_SERVER_TOKEN` value, sender = `POSTMARK_FROM`. (Free-tier
   projects on the default provider cannot edit auth templates since
   2026-06; custom-SMTP projects can.) Then Auth → Rate Limits: raise the
   email rate (default 30/hr).
3. Edit the Magic Link template: link to
   `https://www.pivothop.com/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard`
   and add a line "or enter this code: {{ .Token }}". Auth → URL config:
   Site URL `https://www.pivothop.com`, redirect allowlist
   `https://www.pivothop.com/**`.
4. Vercel env (Production + Preview): `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`; also fill the server-only
   `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` the API routes already read.
5. Phase 2 extras (when the digest lands): GitHub secrets `SUPABASE_URL`,
   `SUPABASE_SERVICE_KEY`; Postmark Broadcast stream `digest` with managed
   unsubscribes + SubscriptionChange webhook; Return-Path CNAME
   `pm-bounces` → `pm.mtasv.net`; DMARC TXT at `_dmarc` (`p=none`, rua to
   the inbox); a postal address for the digest footer.

Zero env vars set = today's behavior: guest saves, dashboard, honest
sign-in message. Nothing breaks.

## 2026-09-22 addendum: Google sign-in and the direct-jobs lock

**Sign-in.** `/signin` now leads with "Continue with Google"
(`supabase.auth.signInWithOAuth`, PKCE; the return leg is the route handler
`/auth/callback`, which exchanges the code and writes the session cookies on
the redirect). The email link stays as the fallback. `?next=` returns the
reader to the page that asked (a locked posting, the dashboard).

**The lock is in the data, not in CSS.** With the repo variable
`DIRECT_REDACT=1`, build-jobs ships every employer-site row (Greenhouse,
Lever, Ashby, SmartRecruiters, Workable, Recruitee, Workday, Personio, the
studio fleet) as `company: "Direct employer"`, no logo, no apply URL, and a
280-character teaser of the posting with the employer's name replaced. The
real fields go to `apps/web/private-src/direct/<occ>.json` (git-ignored) and
`seal-direct.mjs` encrypts them into `apps/web/private/direct/<occ>.enc`
(AES-256-GCM under `DIRECT_KEY`, committed: the ciphertext is safe in a public
repo). Readers of the vault: `/api/direct` (session or share token; 300
unlocks per user per day, logged in `unlocks`, migration 0011) and the company
pages at build time (a direct row is attributed to its employer for counts
and pay, never listed by title). Inspect element, the JSON under /data, the
social cards, the RSS feed, saved-job snapshots: none of them carry the
employer of a direct row any more.

**What a signed-in reader gets (free until the paywall):** the phone sheet,
the desktop pane and the detail page fetch the real employer, logo, apply
link and full text per posting. Anonymous readers see "Sign in to unlock".
The plan check goes into `/api/direct` the day Lemon Squeezy is live.

**Share tokens:** `shareToken(occ, id)` (lib/direct-vault) mints `?u=` for
links we post ourselves; it opens that one posting without an account.

### Provisioning additions (Carlos)

6. Google: Google Cloud Console → APIs & Services → Credentials → OAuth
   client (Web). Authorised redirect URI:
   `https://<project-ref>.supabase.co/auth/v1/callback`. In Supabase: Auth →
   Providers → Google → paste client ID and secret. Auth → URL configuration:
   Site URL `https://www.pivothop.com`, redirect allowlist
   `https://www.pivothop.com/**` (add the Vercel preview host too if you
   want previews to sign in).
7. Run `supabase/migrations/0011_unlocks.sql` after 0010.
8. Vercel env (Production + Preview): `DIRECT_KEY` = the value in
   `~/.pivothop-secrets/DIRECT_KEY.txt` on the laptop (already set as the
   GitHub Actions secret of the same name). Never paste it anywhere else.
9. Flip the lock on: `gh variable set DIRECT_REDACT --body 1` and dispatch
   the nightly. The next data commit ships redacted; until then the site
   behaves as before. Do this only after steps 4, 6 and 8, or nobody can
   open a direct posting.

## Direct plans (2026-10-01)

$8 a month or $50 once, sold through Lemon Squeezy (merchant of record). Signed in without a plan, 3 distinct direct postings a month open in full (`FREE_PER_MONTH`, calendar month, UTC); employer names and logos in lists (`/api/direct/peek`) are for members only. Share tokens stay unmetered. Code: `lib/plans.ts` (shared), `lib/paywall.ts` (server), `/api/checkout`, `/api/billing`, `/api/plan`, the store webhook `/api/lemonsqueezy/webhook`, `components/PlanSheet.tsx`.

Activation, in order:

1. Run `supabase/migrations/0013_memberships.sql` in the Supabase SQL editor.
2. Lemon Squeezy, **test mode** first: one product with two variants, monthly subscription ($8) and single payment ($50). An API key. One store webhook to `https://www.pivothop.com/api/lemonsqueezy/webhook` with a signing secret and the events `order_created`, `order_refunded`, `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_resumed`, `subscription_expired`, `subscription_paused`, `subscription_unpaused`.
3. Vercel env (Production): `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_WEBHOOK_SECRET`, `LEMONSQUEEZY_VARIANT_MONTHLY`, `LEMONSQUEEZY_VARIANT_LIFETIME`, and `PAYWALL_TEST_EMAILS` (comma-separated accounts the gate applies to). Redeploy. Everyone else keeps the free lock.
4. Test with a listed account: 3 free opens, the 4th shows the plans sheet, test card checkout, return with `?plan=welcome`, the page reloads as a member, `/dashboard` shows the plan, Manage billing opens the portal, cancelling shows "open until".
5. Live: swap the five values for live-mode ones, add `NEXT_PUBLIC_PAYWALL=1` (gate and public copy for everyone), remove `PAYWALL_TEST_EMAILS`, redeploy.

Do not set `LEMONSQUEEZY_VARIANT_STD`/`_FEAT` unless employer posts should stop being free: those two turn the employer form into a paid checkout.
