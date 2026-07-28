import crypto from 'node:crypto';
import { getPostHogClient } from '@/lib/posthog-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* Lemon Squeezy -> us. On order_created we flip the matching submission to
   'paid', which is what makes it appear on the board. HMAC-SHA256 verified with
   LEMONSQUEEZY_WEBHOOK_SECRET (the X-Signature header) so nobody can forge it. */
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

  let payload: { meta?: { event_name?: string; custom_data?: { submission_id?: string } }; data?: { id?: string } };
  try { payload = JSON.parse(body); } catch { return new Response('bad body', { status: 400 }); }

  const id = payload.meta?.custom_data?.submission_id;
  if (payload.meta?.event_name === 'order_created' && id) {
    await fetch(`${base}/rest/v1/job_submissions?id=eq.${id}`, {
      method: 'PATCH',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'paid', paid_at: new Date().toISOString(), ls_order_id: String(payload.data?.id ?? '') }),
    }).catch(() => {});
    try {
      const ph = getPostHogClient();
      ph.capture({
        distinctId: `ls_order_${payload.data?.id ?? id}`,
        event: 'job_post_paid',
        properties: { submission_id: id, ls_order_id: String(payload.data?.id ?? '') },
      });
      await ph.shutdown();
    } catch { /* PostHog not configured — no-op */ }
  }
  return new Response('ok', { status: 200 });
}
