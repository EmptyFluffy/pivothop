-- Employer waitlist: the gate in front of the post-a-job form while checkout
-- isn't wired (V0 concierge, docs/00). One row per signup. Service-key only
-- (no RLS policies -> no anonymous read/write); the joinWaitlist server action
-- inserts with the service key, nothing client-side touches it.

create table if not exists employer_waitlist (
  id            bigint generated always as identity primary key,
  email         text not null,
  company       text,
  role_title    text,                                  -- what they're hiring for, freeform
  source        text not null default 'employers-page',
  user_agent    text,
  created_at    timestamptz not null default now()
);

create index if not exists employer_waitlist_created_idx on employer_waitlist (created_at desc);
