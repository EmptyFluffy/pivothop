-- Employer job submissions from the /employers post-a-job form.
-- Supersedes the concierge-era employer_leads table; captures a full posting.
-- Service-key only: no RLS policies means no anonymous read/write (the Next.js
-- server action inserts with the service key; nothing client-side touches it).

create table if not exists job_submissions (
  id              bigint generated always as identity primary key,
  tier            text not null default 'featured',   -- 'standard' | 'featured'
  role            text not null,
  occupation_slug text,                                -- matched occupation on the graph
  employment_type text,                                -- Full-time | Part-time | Contract | Internship
  workplace       text,                                -- onsite | hybrid | remote
  region          text,
  salary_min      integer,
  salary_max      integer,
  about           text,
  responsibilities text,
  qualifications  text,
  skills          text[] not null default '{}',
  benefits        text[] not null default '{}',
  company         text not null,
  logo_url        text,
  contact_email   text not null,
  contact_name    text,
  apply_url       text,
  apply_email     text,
  status          text not null default 'new',         -- new | reviewing | posted | declined
  created_at      timestamptz not null default now()
);

create index if not exists job_submissions_created_idx on job_submissions (created_at desc);
create index if not exists job_submissions_status_idx on job_submissions (status);

alter table job_submissions enable row level security;
-- no policies on purpose: only the service key (server-side) may read or write.
