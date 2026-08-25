'use server';

import type { JobPayload } from './actions';
import { SITE_EMAIL } from '../../lib/site';

function supabase() {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_KEY;
  return base && key ? { base, h: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } } : null;
}

function rowFrom(p: JobPayload) {
  return {
    tier: 'free',
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
    // 'new' is the review vocabulary from migration 0002 (new | reviewing |
    // posted | declined) — the statuses /admin can actually set. A row written
    // outside it can never be moved to 'posted', so the listing would sit in
    // the table forever. tier:'free' + amount:0 already mark it as free.
    status: 'new',
    amount: 0,
  };
}

async function notify(p: JobPayload) {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  const from = process.env.POSTMARK_FROM;
  if (!token || !from) return;
  await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: { 'X-Postmark-Server-Token': token, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      From: from,
      To: process.env.POSTMARK_NOTIFY_TO || SITE_EMAIL,
      Subject: `Free job submission: ${p.role} at ${p.company}`,
      TextBody: [
        `${p.company} submitted “${p.role}”.`,
        `Contact: ${p.contact_email}${p.contact_name ? ` (${p.contact_name})` : ''}`,
        `Workplace: ${p.workplace}${p.region ? ` · ${p.region}` : ''}`,
        `Apply: ${p.apply_url || p.apply_email || '—'}`,
        '',
        'Review it in the Supabase job_submissions table. Status: pending_review.',
      ].join('\n'),
      MessageStream: 'outbound',
    }),
  }).catch(() => {});
}

export async function submitFreeJob(p: JobPayload): Promise<{ ok?: boolean; error?: string }> {
  if (!p.role?.trim() || !p.company?.trim() || !/.+@.+\..+/.test(p.contact_email || '') || (!p.apply_url && !p.apply_email)) {
    return { error: 'missing-fields' };
  }
  const sb = supabase();
  if (!sb) return { error: 'not-configured' };
  const res = await fetch(`${sb.base}/rest/v1/job_submissions`, {
    method: 'POST',
    headers: { ...sb.h, Prefer: 'return=minimal' },
    body: JSON.stringify(rowFrom(p)),
  }).catch(() => null);
  if (!res?.ok) return { error: `db-${res?.status || 'network'}` };
  await notify(p);
  return { ok: true };
}
