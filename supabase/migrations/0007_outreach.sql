-- Outreach queue state for the employer campaign (docs/28).
--
-- The TARGET LIST itself is not stored here — it is recomputed from the corpus by
-- build-outreach-targets.py and shipped as packages/data/outreach/targets.json.
-- This table holds only the mutable human layer: who has been contacted, by whom,
-- what happened. Keeping the ranking in the build and the state in the database
-- means a re-rank never loses the campaign history, and the history never pins a
-- stale ranking.
--
-- Shared state is the point. Two people working one list from localStorage would
-- double-email the same company, which is worse for the sender's reputation than
-- not emailing at all.
--
-- Server-only: RLS enabled with no policies, so anon/authenticated are denied
-- everything while the service_role key used by the admin server actions bypasses
-- RLS. Same convention as job_submissions (0002) and employer_waitlist (0006).

create table if not exists outreach_status (
  company_key   text primary key,                     -- slugified company, the join key to targets.json
  company       text not null,                        -- display name at the time it was queued
  status        text not null default 'new',          -- new | queued | contacted | replied | won | declined | skip
  owner         text,                                 -- who claimed it, free text ("carlos", "partner")
  contact_email text,                                 -- filled in from the provider lookup, if any
  contact_name  text,
  note          text,
  contacted_at  timestamptz,
  updated_at    timestamptz not null default now()
);

create index if not exists outreach_status_status_idx  on outreach_status (status);
create index if not exists outreach_status_updated_idx on outreach_status (updated_at desc);

alter table outreach_status enable row level security;
-- no policies on purpose: only the service key (server-side) may read or write.
