-- Who signed up: one visible row per user, filled by a trigger from auth.users
-- (email, name and avatar from the Google profile, provider, first and last
-- sign-in). auth.users is the source of truth; this is the readable copy for
-- the Table Editor and for the admin views. Users read their own row only.

create table if not exists profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  email          text,
  full_name      text,
  avatar_url     text,
  provider       text,
  created_at     timestamptz not null default now(),
  last_sign_in   timestamptz
);

alter table profiles enable row level security;
create policy "profiles_select_own" on profiles for select using (auth.uid() = user_id);

create or replace function public.sync_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email, full_name, avatar_url, provider, created_at, last_sign_in)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_app_meta_data->>'provider', 'email'),
    new.created_at,
    new.last_sign_in_at
  )
  on conflict (user_id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    provider = excluded.provider,
    last_sign_in = excluded.last_sign_in;
  return new;
end $$;

drop trigger if exists on_auth_user_change on auth.users;
create trigger on_auth_user_change
  after insert or update of email, last_sign_in_at, raw_user_meta_data on auth.users
  for each row execute function public.sync_profile();

-- backfill the accounts that signed in before this table existed
insert into profiles (user_id, email, full_name, avatar_url, provider, created_at, last_sign_in)
select id, email,
  coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name'),
  raw_user_meta_data->>'avatar_url',
  coalesce(raw_app_meta_data->>'provider', 'email'),
  created_at, last_sign_in_at
from auth.users
on conflict (user_id) do nothing;
