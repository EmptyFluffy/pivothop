-- User accounts surface: saved jobs + email preferences.
--
-- DELIBERATE DEPARTURE from the repo's RLS convention. Every earlier table
-- (0002, 0005, 0009) enables RLS with no policies because only server routes
-- holding the service_role key touch them. These two tables are different:
-- they are read and written by signed-in browsers through the anon key, so
-- they carry real per-user policies — auth.uid() must own the row. The
-- service key still bypasses RLS for the nightly digest job in CI.
--
-- Jobs themselves stay in the static JSON files. A saved job stores the
-- (occ, job_id) pair — job_id is the scraper's sha1(posting url)[:10], stable
-- for a living posting — plus a full snapshot, because listings rotate out of
-- the CAP-600-per-occupation build nightly and a save must outlive its row.

create table if not exists saved_jobs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  occ               text not null,
  job_id            text not null,
  snapshot          jsonb not null,
  status            text not null default 'saved'
                    check (status in ('saved','applied','interviewing','offer','rejected')),
  saved_at          timestamptz not null default now(),
  applied_at        timestamptz,
  status_changed_at timestamptz,
  notes             text not null default '',
  unique (user_id, occ, job_id)
);

alter table saved_jobs enable row level security;

create policy "saved_jobs_select_own" on saved_jobs
  for select using (auth.uid() = user_id);
create policy "saved_jobs_insert_own" on saved_jobs
  for insert with check (auth.uid() = user_id);
create policy "saved_jobs_update_own" on saved_jobs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "saved_jobs_delete_own" on saved_jobs
  for delete using (auth.uid() = user_id);

create index if not exists saved_jobs_user_idx on saved_jobs (user_id, saved_at desc);

-- Email preferences. One row per user; the row's absence is the first-sign-in
-- detector (the welcome email fires when /auth/confirm finds no row and
-- inserts the default). frequency starts 'off' — the digest is explicit
-- opt-in, never auto-enrolment. suppressed is written by the Postmark
-- SubscriptionChange webhook so the settings page never claims a digest is on
-- for an address Postmark has suppressed.

create table if not exists email_prefs (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  tags                text[] not null default '{}',
  countries           text[] not null default '{}',
  frequency           text not null default 'off'
                      check (frequency in ('off','weekly','daily')),
  paused_until        date,
  digest_last_sent_at timestamptz,
  suppressed          boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table email_prefs enable row level security;

create policy "email_prefs_select_own" on email_prefs
  for select using (auth.uid() = user_id);
create policy "email_prefs_insert_own" on email_prefs
  for insert with check (auth.uid() = user_id);
create policy "email_prefs_update_own" on email_prefs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
