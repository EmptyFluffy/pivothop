-- Why an AI-written report fell back to the template.
--
-- `ai` alone said only that something failed. Diagnosing it meant hunting Vercel
-- function logs for a single line, which is fine once and useless as a habit —
-- so the reason now sits beside the row that failed. Values look like
-- "http 401: ...", "unparseable (stop_reason=max_tokens, 5012 chars)",
-- "no-json: I'll help you...", "threw: fetch failed". NULL when the model
-- answered normally.
alter table roadmap_leads add column if not exists ai_error text;
