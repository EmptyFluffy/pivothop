-- Social autoposter ledger (docs/35). One row per selected job per platform.
-- The unique (platform, job_id) pair is the idempotency backbone: a retry can
-- flip status but can never mint a second row, so it can never double-post.
create table if not exists social_posts (
  id bigint generated always as identity primary key,
  platform text not null default 'linkedin',
  job_id text not null,
  job_occ text not null,
  job_title text not null,
  job_company text not null,
  job_url text not null,
  generated_copy text not null,
  template_variant int not null default 0,
  selection_score numeric not null,
  selection_reason text not null,
  status text not null default 'draft',          -- draft | scheduled | published | failed | skipped
  scheduled_at timestamptz,
  published_at timestamptz,
  external_post_id text,
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, job_id)
);
create index if not exists social_posts_status_idx on social_posts (status, scheduled_at desc);
create index if not exists social_posts_recent_idx on social_posts (platform, created_at desc);
