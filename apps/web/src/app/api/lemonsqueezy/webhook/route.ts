import crypto from 'node:crypto';
import { getPostHogClient } from '@/lib/posthog-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* Lemon Squeezy -> us. One store webhook, two products, HMAC-SHA256 verified
   with LEMONSQUEEZY_WEBHOOK_SECRET (the X-Signature header) so nobody can
   forge it.
   - Direct plans (custom_data.user_id, set by /api/checkout): subscription
     events write the subscription's status and dates; a paid order for the
     lifetime variant sets `lifetime`, and a refund of it clears it. Rows live
     in `memberships` (migration 0013).
   - Employer job posts (custom_data.submission_id): order_created flips the
     matching submission to 'paid', which is what makes it appear on the board. */

type LsData = { id?: string | number; type?: string; attributes?: Record<string, unknown> };
type Payload = { meta?: { event_name?: string; custom_data?: Record<string, unknown> }; data?: LsData };

export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!secret || !base || !key) return new Response('not configured', { status: 503 });

  const body = await req.text();
  const sig = req.headers.get('x-signature') || '';
  const expected = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return new Response('bad signature', { status: 400 });

  let payload: Payload;
  try { payload = JSON.parse(body); } catch { return new Response('bad body', { status: 400 }); }

  const event = payload.meta?.event_name ?? '';
  const custom = payload.meta?.custom_data ?? {};
  const sb = { base, h: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } };

  if (typeof custom.user_id === 'string' && /^[0-9a-f-]{36}$/i.test(custom.user_id)) {
    // A failed write must come back as a 500 so Lemon Squeezy retries it.
    const ok = await membershipEvent(event, custom.user_id, payload.data ?? {}, sb);
    return new Response(ok ? 'ok' : 'retry', { status: ok ? 200 : 500 });
  }

  const id = custom.submission_id;
  if (event === 'order_created' && typeof id === 'string' && id) {
    await fetch(`${base}/rest/v1/job_submissions?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { ...sb.h, Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'paid', paid_at: new Date().toISOString(), ls_order_id: String(payload.data?.id ?? '') }),
    }).catch(() => {});
    await capture(`ls_order_${payload.data?.id ?? id}`, 'job_post_paid', { submission_id: id, ls_order_id: String(payload.data?.id ?? '') });
  }
  return new Response('ok', { status: 200 });
}

const SUB_EVENTS = new Set([
  'subscription_created', 'subscription_updated', 'subscription_cancelled', 'subscription_resumed',
  'subscription_expired', 'subscription_paused', 'subscription_unpaused',
]);

async function membershipEvent(
  event: string, userId: string, data: LsData,
  sb: { base: string; h: Record<string, string> },
): Promise<boolean> {
  const at = data.attributes ?? {};
  const str = (v: unknown) => (v == null || v === '' ? null : String(v));
  const upsert = async (fields: Record<string, unknown>) => {
    const res = await fetch(`${sb.base}/rest/v1/memberships?on_conflict=user_id`, {
      method: 'POST',
      headers: { ...sb.h, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ user_id: userId, ...fields, updated_at: new Date().toISOString() }),
    }).catch(() => null);
    return !!res?.ok;
  };

  // subscription_payment_* events carry invoices, not the subscription; the
  // subscription_updated that follows each payment carries the new dates.
  if (SUB_EVENTS.has(event) && data.type === 'subscriptions') {
    const ok = await upsert({
      sub_id: str(data.id),
      sub_status: str(at.status),
      sub_renews_at: str(at.renews_at),
      sub_ends_at: str(at.ends_at),
      customer_id: str(at.customer_id),
    });
    if (ok && event === 'subscription_created') await capture(userId, 'direct_plan_started', { plan: 'monthly' });
    return ok;
  }

  const item = at.first_order_item as { variant_id?: unknown } | undefined;
  const lifetimeOrder = data.type === 'orders' && String(item?.variant_id ?? '') === (process.env.LEMONSQUEEZY_VARIANT_LIFETIME ?? '-');
  if (event === 'order_created' && lifetimeOrder && at.status === 'paid') {
    const ok = await upsert({ lifetime: true, lifetime_order_id: str(data.id), customer_id: str(at.customer_id) });
    if (ok) {
      await capture(userId, 'direct_plan_started', { plan: 'lifetime' });
      await cancelMonthly(userId, sb);   // never charge a lifetime buyer again
    }
    return ok;
  }
  if (event === 'order_refunded' && lifetimeOrder) return upsert({ lifetime: false });
  return true;   // an event we do not act on (the monthly plan's own order, invoices)
}

/* A monthly member who buys lifetime: cancel the subscription so it does not
   renew. Lemon Squeezy keeps it running to the end of the paid month, which
   is harmless now that lifetime covers them. */
async function cancelMonthly(userId: string, sb: { base: string; h: Record<string, string> }) {
  const key = process.env.LEMONSQUEEZY_API_KEY;
  if (!key) return;
  try {
    const r = await fetch(`${sb.base}/rest/v1/memberships?user_id=eq.${userId}&select=sub_id,sub_status`, { headers: sb.h });
    const row = r.ok ? ((await r.json()) as { sub_id: string | null; sub_status: string | null }[])[0] : null;
    if (!row?.sub_id || !['active', 'on_trial', 'past_due', 'paused'].includes(row.sub_status ?? '')) return;
    await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${encodeURIComponent(row.sub_id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/vnd.api+json' },
    });
  } catch { /* the buyer can still cancel from billing */ }
}

async function capture(distinctId: string, event: string, properties: Record<string, unknown>) {
  try {
    const ph = getPostHogClient();
    ph.capture({ distinctId, event, properties });
    await ph.shutdown();   // flush before the function returns
  } catch { /* PostHog not configured, no-op */ }
}
