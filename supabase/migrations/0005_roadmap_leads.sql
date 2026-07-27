-- Route-report requests from the graph export (the "Send my report" flow).
-- One row per PDF request: who, which route, whether they opted into board
-- alerts, and whether the email actually went out. Server-only: RLS is enabled
-- with no policies, so the anon/authenticated roles are denied all access, while
-- the /api/roadmap route (service_role key) bypasses RLS. Same convention as
-- job_submissions (0002).

create table if not exists roadmap_leads (
  id            bigint generated always as identity primary key,
  email         text not null,
  origin_slug   text,
  origin_title  text,
  dest_slug     text,
  dest_title    text,
  match         integer,                         -- readiness % at request time
  notify        boolean not null default false,  -- "email me when the board adds matching roles"
  personalized  boolean not null default false,  -- did they edit their skills first
  ai            boolean not null default false,  -- AI prose vs templated fallback
  delivered     boolean not null default false,  -- did Postmark accept the send
  report_id     text,                            -- PH·XXX→YYY·MMDD, ties back to the PDF
  source        text not null default 'graph-export',  -- 'graph-export' | 'capture-band'
  user_agent    text,
  created_at    timestamptz not null default now()
);

create index if not exists roadmap_leads_created_idx on roadmap_leads (created_at desc);
create index if not exists roadmap_leads_notify_idx  on roadmap_leads (dest_slug) where notify = true;

alter table roadmap_leads enable row level security;
-- no policies on purpose: only the service key (server-side) may read or write.
