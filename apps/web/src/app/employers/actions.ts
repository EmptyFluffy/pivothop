'use server';
import { headers } from 'next/headers';
import { centsFor } from './pricing';
import { SITE_EMAIL } from '../../lib/site';

/* Automated post-a-job flow via Lemon Squeezy (Merchant of Record — they are
   the legal seller and handle worldwide tax, so this works from anywhere).
   - startCheckout: insert the submission (pending_payment), create a Lemon
     Squeezy checkout for the chosen tier's variant, return its URL for the
     client to redirect to. The webhook flips it to 'paid' and the board shows
     it live.
   - Graceful: no LS env -> saves the lead as 'new' (concierge); no Supabase
     env -> the form falls back to a mailto. */

export type JobPayload = {
  tier: string; role: string; occupation_slug: string | null;
  employment_type: string; workplace: string; region: string;
  salary_min: number | null; salary_max: number | null;
  about: string; responsibilities: string; qualifications: string;
  skills: string[]; benefits: string[];
  company: string; logo_url: string; contact_email: string; contact_name: string;
  apply_url: string; apply_email: string;
};

function rowFrom(p: JobPayload, status: string, amount: number | null) {
  return {
    tier: p.tier, role: p.role, occupation_slug: p.occupation_slug,
    employment_type: p.employment_type, workplace: p.workplace, region: p.region || null,
    salary_min: p.salary_min, salary_max: p.salary_max,
    about: p.about || null, responsibilities: p.responsibilities || null, qualifications: p.qualifications || null,
    skills: p.skills, benefits: p.benefits,
    company: p.company, logo_url: p.logo_url || null,
    contact_email: p.contact_email, contact_name: p.contact_name || null,
    apply_url: p.apply_url || null, apply_email: p.apply_email || null,
    status, amount,
  };
}

const SB = () => {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_KEY;
  return base && key ? { base, key, h: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } } : null;
};

export async function startCheckout(p: JobPayload): Promise<{ url?: string; ok?: boolean; error?: string }> {
  const sb = SB();
  if (!sb) return { error: 'not-configured' };                 // no backend -> form does mailto

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variant = p.tier === 'featured' ? process.env.LEMONSQUEEZY_VARIANT_FEAT : process.env.LEMONSQUEEZY_VARIANT_STD;
  const cents = centsFor(p.tier);

  // Not wired to Lemon Squeezy yet -> capture the lead as 'new' (concierge).
  if (!apiKey || !storeId || !variant) {
    const res = await fetch(`${sb.base}/rest/v1/job_submissions`, {
      method: 'POST', headers: { ...sb.h, Prefer: 'return=minimal' }, body: JSON.stringify(rowFrom(p, 'new', null)),
    }).catch(() => null);
    await notify(p).catch(() => {});
    return res?.ok ? { ok: true, error: 'ls-not-configured' } : { error: 'db' };
  }

  // 1. insert as pending_payment, get the id back
  let id: number;
  try {
    const res = await fetch(`${sb.base}/rest/v1/job_submissions`, {
      method: 'POST', headers: { ...sb.h, Prefer: 'return=representation' }, body: JSON.stringify(rowFrom(p, 'pending_payment', cents)),
    });
    if (!res.ok) return { error: `db-${res.status}` };
    id = (await res.json())[0].id;
  } catch { return { error: 'network' }; }

  // 2. create the Lemon Squeezy checkout
  try {
    const h = await headers();
    const host = h.get('host') || 'www.pivothop.com';
    const origin = `${host.includes('localhost') ? 'http' : 'https'}://${host}`;
    const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: p.contact_email || undefined,
              custom: { submission_id: String(id) },
            },
            product_options: { redirect_url: `${origin}/employers?paid=1` },
          },
          relationships: {
            store: { data: { type: 'stores', id: String(storeId) } },
            variant: { data: { type: 'variants', id: String(variant) } },
          },
        },
      }),
    });
    if (!res.ok) return { error: `ls-${res.status}` };
    const url = (await res.json())?.data?.attributes?.url;
    return url ? { url } : { error: 'ls-no-url' };
  } catch {
    return { error: 'ls' };
  }
}

/* Waitlist gate (checkout not wired yet — docs/25 §C): capture the employer's
   intent honestly instead of walking them through a form that can't take
   payment. Same graceful ladder as everything else: Supabase insert when
   configured, Postmark heads-up to hello@ when configured, and the client
   falls back to a plain mailto when neither is. */
export async function joinWaitlist(input: { email: string; company?: string; role?: string }): Promise<{ ok?: boolean; error?: string }> {
  const email = String(input.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'invalid-email' };
  const sb = SB();
  if (!sb) return { error: 'not-configured' };            // client falls back to mailto
  const ua = (await headers()).get('user-agent')?.slice(0, 300) || null;
  const res = await fetch(`${sb.base}/rest/v1/employer_waitlist`, {
    method: 'POST', headers: { ...sb.h, Prefer: 'return=minimal' },
    body: JSON.stringify({
      email, company: input.company?.trim().slice(0, 120) || null,
      role_title: input.role?.trim().slice(0, 160) || null, user_agent: ua,
    }),
  }).catch(() => null);
  if (!res?.ok) return { error: 'db' };
  // Heads-up to hello@ — silent no-op until Postmark env lands (docs/25 §C).
  const token = process.env.POSTMARK_SERVER_TOKEN, from = process.env.POSTMARK_FROM;
  if (token && from) {
    await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: { 'X-Postmark-Server-Token': token, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        From: from, To: process.env.POSTMARK_NOTIFY_TO || SITE_EMAIL,
        Subject: `Employer waitlist: ${input.company?.trim() || email}`,
        TextBody: `${email}${input.company ? ` · ${input.company.trim()}` : ''}${input.role ? `\nHiring: ${input.role.trim()}` : ''}\n\nRows live in the Supabase employer_waitlist table.`,
        MessageStream: 'outbound',
      }),
    }).catch(() => {});
  }
  return { ok: true };
}

async function notify(p: JobPayload): Promise<void> {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  const from = process.env.POSTMARK_FROM;
  const to = process.env.POSTMARK_NOTIFY_TO || SITE_EMAIL;
  if (!token || !from) return;
  await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: { 'X-Postmark-Server-Token': token, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      From: from, To: to,
      Subject: `New job post: ${p.role} at ${p.company} (${p.tier})`,
      TextBody: `${p.company} submitted "${p.role}".\nContact: ${p.contact_email}${p.contact_name ? ` (${p.contact_name})` : ''}\nTier: ${p.tier}\nApply: ${p.apply_url || p.apply_email || '—'}\n\nReview it in the Supabase job_submissions table.`,
      MessageStream: 'outbound',
    }),
  });
}
