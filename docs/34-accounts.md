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
