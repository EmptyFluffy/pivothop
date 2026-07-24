-- Payment fields for the automated Stripe flow. A submission moves
-- pending_payment -> paid (webhook) and only 'paid' rows show on the board.
alter table job_submissions add column if not exists stripe_session_id text;
alter table job_submissions add column if not exists amount integer;          -- cents charged
alter table job_submissions add column if not exists paid_at timestamptz;

create index if not exists job_submissions_paid_idx
  on job_submissions (status, created_at desc) where status = 'paid';
