import Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* Stripe -> us. On checkout.session.completed we flip the matching submission
   to 'paid', which is what makes it appear on the board. Signature-verified with
   STRIPE_WEBHOOK_SECRET so nobody can forge a "paid" event. */
export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!stripeKey || !whSecret || !base || !key) return new Response('not configured', { status: 503 });

  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = new Stripe(stripeKey).webhooks.constructEvent(body, sig ?? '', whSecret);
  } catch {
    return new Response('bad signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const id = (event.data.object as Stripe.Checkout.Session).metadata?.submission_id;
    if (id) {
      await fetch(`${base}/rest/v1/job_submissions?id=eq.${id}`, {
        method: 'PATCH',
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ status: 'paid', paid_at: new Date().toISOString() }),
      }).catch(() => {});
    }
  }
  return new Response('ok', { status: 200 });
}
