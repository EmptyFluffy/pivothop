'use server';

/* Server action: persist a job submission to Supabase, then (best-effort)
   notify by email. Runs on the server only — the SUPABASE_SERVICE_KEY never
   reaches the client. Returns 'not-configured' when the env is absent so the
   form can fall back to a mailto (which is how it behaves in local dev). */

export type JobPayload = {
  tier: string;
  role: string;
  occupation_slug: string | null;
  employment_type: string;
  workplace: string;
  region: string;
  salary_min: number | null;
  salary_max: number | null;
  about: string;
  responsibilities: string;
  qualifications: string;
  skills: string[];
  benefits: string[];
  company: string;
  logo_url: string;
  contact_email: string;
  contact_name: string;
  apply_url: string;
  apply_email: string;
};

export async function submitJob(p: JobPayload): Promise<{ ok: boolean; error?: string }> {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!base || !key) return { ok: false, error: 'not-configured' };

  const row = {
    tier: p.tier,
    role: p.role,
    occupation_slug: p.occupation_slug,
    employment_type: p.employment_type,
    workplace: p.workplace,
    region: p.region || null,
    salary_min: p.salary_min,
    salary_max: p.salary_max,
    about: p.about || null,
    responsibilities: p.responsibilities || null,
    qualifications: p.qualifications || null,
    skills: p.skills,
    benefits: p.benefits,
    company: p.company,
    logo_url: p.logo_url || null,
    contact_email: p.contact_email,
    contact_name: p.contact_name || null,
    apply_url: p.apply_url || null,
    apply_email: p.apply_email || null,
  };

  try {
    const res = await fetch(`${base}/rest/v1/job_submissions`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) return { ok: false, error: `db-${res.status}` };
    await notify(p).catch(() => {}); // best-effort; never blocks the submission
    return { ok: true };
  } catch {
    return { ok: false, error: 'network' };
  }
}

// Optional email notification via Postmark. No-op unless POSTMARK_SERVER_TOKEN
// and POSTMARK_FROM are set, so the insert works with or without email wired.
async function notify(p: JobPayload): Promise<void> {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  const from = process.env.POSTMARK_FROM;
  const to = process.env.POSTMARK_NOTIFY_TO || 'cvinocoura@gmail.com';
  if (!token || !from) return;
  await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: { 'X-Postmark-Server-Token': token, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      From: from,
      To: to,
      Subject: `New job post: ${p.role} at ${p.company} (${p.tier})`,
      TextBody: `${p.company} submitted "${p.role}".\nContact: ${p.contact_email}${p.contact_name ? ` (${p.contact_name})` : ''}\nTier: ${p.tier}\nApply: ${p.apply_url || p.apply_email || '—'}\n\nReview it in the Supabase job_submissions table.`,
      MessageStream: 'outbound',
    }),
  });
}
