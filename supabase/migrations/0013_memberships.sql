-- Direct plans: who pays for the direct-jobs lock, written only by the Lemon
-- Squeezy webhook (service key, bypasses RLS). Two independent grants so one
-- can never overwrite the other: a one-time lifetime purchase, and a monthly
-- subscription whose status follows Lemon Squeezy (on_trial, active, paused,
-- past_due, unpaid, cancelled, expired). A cancelled subscription keeps access
-- until sub_ends_at. Users read their own row only (the dashboard, the board).

create table if not exists memberships (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  lifetime          boolean not null default false,
  lifetime_order_id text,
  sub_id            text,
  sub_status        text,
  sub_renews_at     timestamptz,
  sub_ends_at       timestamptz,
  customer_id       text,
  updated_at        timestamptz not null default now()
);

alter table memberships enable row level security;

create policy "memberships_select_own" on memberships
  for select using (auth.uid() = user_id);

create index if not exists memberships_sub_idx on memberships (sub_id);
