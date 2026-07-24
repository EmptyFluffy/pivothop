-- Payment fields for the Lemon Squeezy (Merchant of Record) flow.
-- Idempotent, so it's safe whether or not 0003 was run. A submission moves
-- pending_payment -> paid (webhook); only 'paid' rows show on the board.
alter table job_submissions add column if not exists amount integer;        -- cents
alter table job_submissions add column if not exists paid_at timestamptz;
alter table job_submissions add column if not exists ls_order_id text;       -- Lemon Squeezy order id

create index if not exists job_submissions_paid_idx
  on job_submissions (status, created_at desc) where status = 'paid';
