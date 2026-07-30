-- Manual leads + category metadata for the outreach console (docs/28).
--
-- The corpus-derived and curated lists cover what our data can see; a lead met at
-- an event, a studio with no ATS, a journalist who replied out of the blue need a
-- row too. Rather than a second table, manual leads ARE outreach_status rows with
-- manual=true — the status machinery, ownership, and notes come for free, and the
-- console partitions them into the right tab by `category`.
--
-- Columns are additive and nullable, so rows written before this migration are
-- untouched. Same RLS posture as 0007: no policies, service key only.

alter table outreach_status add column if not exists category text;      -- employers | launch | press | backlink | studio
alter table outreach_status add column if not exists url text;
alter table outreach_status add column if not exists manual boolean not null default false;

create index if not exists outreach_status_manual_idx on outreach_status (manual) where manual;
