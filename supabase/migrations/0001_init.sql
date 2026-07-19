-- PivotHop schema. No user accounts in V0 — the email capture is the identity.
-- Row-level security on everywhere; the scraper and site server use the service key.

create table if not exists postings_raw (
  source text not null,
  external_id text not null,
  title text not null default '',
  company text,
  location text,
  remote_flag boolean not null default false,
  salary_min numeric,
  salary_max numeric,
  currency text,
  salary_period text,
  description_text text,
  posted_at timestamptz,
  url text,
  ingested_at timestamptz not null default now(),
  primary key (source, external_id)
);

create table if not exists postings (
  source text not null,
  external_id text not null,
  role_id text not null,
  title_raw text,
  skills jsonb not null default '[]',
  salary_usd_min integer,
  salary_usd_max integer,
  salary_confidence text not null default 'absent',
  remote_flag boolean not null default false,
  country text,
  posted_at timestamptz,
  url text,
  normalized_at timestamptz not null default now(),
  primary key (source, external_id)
);
create index if not exists postings_role_idx on postings (role_id);

create table if not exists role_aggregates (
  role_id text primary key,
  count integer not null,
  salaried_count integer not null,
  salary_p25 integer,
  salary_p50 integer,
  salary_p75 integer,
  remote_share numeric,
  top_skills jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

create table if not exists adjacency (
  origin_role_id text not null,
  dest_role_id text not null,
  match integer not null,
  jaccard numeric,
  coverage numeric,
  updated_at timestamptz not null default now(),
  primary key (origin_role_id, dest_role_id)
);

create table if not exists route_exports (
  id bigint generated always as identity primary key,
  email text not null,
  route_id text not null,
  pilot_opt_in boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists employer_leads (
  id bigint generated always as identity primary key,
  name text not null,
  company text not null,
  role_description text,
  challenge text,
  email text not null,
  linkedin_url text,
  created_at timestamptz not null default now()
);

alter table postings_raw enable row level security;
alter table postings enable row level security;
alter table role_aggregates enable row level security;
alter table adjacency enable row level security;
alter table route_exports enable row level security;
alter table employer_leads enable row level security;

-- Aggregates and adjacency are the public read surface; raw data and captured
-- emails are service-key only (no policies = no anon access).
create policy role_aggregates_read on role_aggregates for select using (true);
create policy adjacency_read on adjacency for select using (true);
