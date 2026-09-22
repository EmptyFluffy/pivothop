-- Direct-posting unlocks: one row per (user, posting) read through /api/direct.
-- The route counts a user's rows from the last 24 hours before answering and
-- refuses past the daily cap, so a subscription cannot be turned into a copy
-- of the direct board. user_id defaults to the caller: the browser never
-- sends it. Same per-user RLS shape as 0010 (anon key + session JWT).

create table if not exists unlocks (
  id      bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  occ     text not null,
  job_id  text not null,
  at      timestamptz not null default now()
);

alter table unlocks enable row level security;

create policy "unlocks_select_own" on unlocks
  for select using (auth.uid() = user_id);
create policy "unlocks_insert_own" on unlocks
  for insert with check (auth.uid() = user_id);

create index if not exists unlocks_user_at_idx on unlocks (user_id, at desc);
