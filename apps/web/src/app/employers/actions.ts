'use server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { centsFor } from './pricing';
import { SITE_EMAIL } from '../../lib/site';

/* Automated post-a-job flow, server side.
   - startCheckout: insert the submission (pending_payment), create a Stripe
     Checkout session, return its URL for the client to redirect to. The webhook
     flips it to 'paid' and the board shows it live.
   - Degrades gracefully: no Stripe env -> saves the row as 'new' and tells the
     form to fall back to the concierge success; no Supabase env -> the form
     falls back to a mailto. */

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
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const cents = centsFor(p.tier);

  // If Stripe isn't wired yet, still capture the lead as 'new' (concierge).
  if (!stripeKey) {
    const res = await fetch(`${sb.base}/rest/v1/job_submissions`, {
      method: 'POST', headers: { ...sb.h, Prefer: 'return=minimal' }, body: JSON.stringify(rowFrom(p, 'new', null)),
    }).catch(() => null);
    await notify(p).catch(() => {});
    return res?.ok ? { ok: true, error: 'stripe-not-configured' } : { error: 'db' };
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

  // 2. create the Checkout session
  try {
    const stripe = new Stripe(stripeKey);
    const h = await headers();
    const host = h.get('host') || 'www.pivothop.com';
    const origin = `${host.includes('localhost') ? 'http' : 'https'}://${host}`;
    const label = p.tier === 'featured' ? 'Featured' : 'Standard';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: cents,
          product_data: { name: `${label} job post — ${p.role} at ${p.company}`, description: '30-day listing on the PivotHop adjacent-talent board (launch rate).' },
        },
      }],
      customer_email: p.contact_email || undefined,
      metadata: { submission_id: String(id) },
      success_url: `${origin}/employers?paid=1`,
      cancel_url: `${origin}/employers?canceled=1`,
    });
    await fetch(`${sb.base}/rest/v1/job_submissions?id=eq.${id}`, {
      method: 'PATCH', headers: { ...sb.h, Prefer: 'return=minimal' }, body: JSON.stringify({ stripe_session_id: session.id }),
    }).catch(() => {});
    return { url: session.url ?? undefined };
  } catch {
    return { error: 'stripe' };
  }
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
