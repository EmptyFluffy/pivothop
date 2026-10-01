import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer } from '../../../lib/supabase-server';
import { plansConfigured, variantFor, membershipOf, LS_API, lsHeaders } from '../../../lib/paywall';
import { isMember } from '../../../lib/plans';

/* Start a Direct plan: a Lemon Squeezy checkout for the signed-in account.
   The account id rides along as custom data, so the webhook can write the
   membership without trusting anything the browser says; the email is only
   prefilled. Lemon Squeezy returns the buyer to the page they came from. */
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const noStore = { 'cache-control': 'private, no-store' };
  if (!plansConfigured()) return NextResponse.json({ error: 'not-configured' }, { status: 503, headers: noStore });

  let body: { plan?: unknown; next?: unknown } = {};
  try { body = await req.json(); } catch { /* empty */ }
  const plan = body.plan === 'monthly' || body.plan === 'lifetime' ? body.plan : null;
  if (!plan) return NextResponse.json({ error: 'bad-request' }, { status: 400, headers: noStore });
  // same-site paths only: never an open redirect
  const next = typeof body.next === 'string' && /^\/(?!\/)[^\s]*$/.test(body.next) ? body.next : '/dashboard';

  const sb = await supabaseServer();
  const { data } = sb ? await sb.auth.getUser() : { data: null };
  const user = data?.user;
  if (!sb || !user) return NextResponse.json({ error: 'sign-in' }, { status: 401, headers: noStore });

  const m = await membershipOf(sb);
  if (m?.lifetime || (plan === 'monthly' && isMember(m))) {
    return NextResponse.json({ error: 'already' }, { status: 409, headers: noStore });
  }

  const back = `${req.nextUrl.origin}${next}${next.includes('?') ? '&' : '?'}plan=welcome`;
  try {
    const res = await fetch(`${LS_API}/checkouts`, {
      method: 'POST',
      headers: lsHeaders(),
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: { email: user.email || undefined, custom: { user_id: user.id, plan } },
            product_options: { redirect_url: back },
          },
          relationships: {
            store: { data: { type: 'stores', id: String(process.env.LEMONSQUEEZY_STORE_ID) } },
            variant: { data: { type: 'variants', id: variantFor(plan) } },
          },
        },
      }),
    });
    if (!res.ok) return NextResponse.json({ error: `ls-${res.status}` }, { status: 502, headers: noStore });
    const url = (await res.json())?.data?.attributes?.url;
    return url
      ? NextResponse.json({ url }, { headers: noStore })
      : NextResponse.json({ error: 'ls-no-url' }, { status: 502, headers: noStore });
  } catch {
    return NextResponse.json({ error: 'ls' }, { status: 502, headers: noStore });
  }
}
