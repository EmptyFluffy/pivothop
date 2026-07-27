-- Employer waitlist: the gate in front of the post-a-job form while checkout
-- isn't wired (V0 concierge, docs/00). One row per signup. Server-only: RLS is
-- enabled with no policies, so the anon/authenticated roles are denied all
-- access, while the joinWaitlist server action (service_role key) bypasses RLS.
-- Same convention as job_submissions (0002).

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

alter table employer_waitlist enable row level security;
-- no policies on purpose: only the service key (server-side) may read or write.
