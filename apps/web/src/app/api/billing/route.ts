import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer } from '../../../lib/supabase-server';
import { LS_API, lsHeaders } from '../../../lib/paywall';

/* "Manage billing": a monthly member goes to their Lemon Squeezy customer
   portal (cancel, change card, invoices). The portal link is signed and short
   lived, so it is fetched fresh from the subscription on every click. Lifetime
   buyers have no subscription and get Lemon Squeezy's order lookup. */
export const dynamic = 'force-dynamic';

const ORDERS = 'https://app.lemonsqueezy.com/my-orders';

export async function GET(req: NextRequest) {
  const sb = await supabaseServer();
  const { data } = sb ? await sb.auth.getUser() : { data: null };
  if (!sb || !data?.user) return NextResponse.redirect(new URL('/signin?next=/dashboard', req.url), 303);

  const { data: m } = await sb.from('memberships').select('sub_id').maybeSingle();
  const subId = (m as { sub_id?: string | null } | null)?.sub_id;
  if (!subId || !process.env.LEMONSQUEEZY_API_KEY) return NextResponse.redirect(ORDERS, 303);
  try {
    const res = await fetch(`${LS_API}/subscriptions/${encodeURIComponent(subId)}`, { headers: lsHeaders() });
    const portal = res.ok ? (await res.json())?.data?.attributes?.urls?.customer_portal : null;
    return NextResponse.redirect(typeof portal === 'string' && portal ? portal : ORDERS, 303);
  } catch {
    return NextResponse.redirect(ORDERS, 303);
  }
}
