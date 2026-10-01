import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase-server';
import { paywallFor, membershipOf, openedThisMonth } from '../../../lib/paywall';
import { FREE_PER_MONTH, isMember } from '../../../lib/plans';

/* The signed-in account's standing, for the dashboard: whether plans apply to
   it, its membership, and the free opens left this month. */
export const dynamic = 'force-dynamic';

export async function GET() {
  const noStore = { 'cache-control': 'private, no-store' };
  const sb = await supabaseServer();
  const { data } = sb ? await sb.auth.getUser() : { data: null };
  if (!sb || !data?.user) return NextResponse.json({ error: 'sign-in' }, { status: 401, headers: noStore });
  if (!paywallFor(data.user.email)) return NextResponse.json({ paywall: false }, { headers: noStore });

  const m = await membershipOf(sb);
  const member = isMember(m);
  const left = member ? null : Math.max(0, FREE_PER_MONTH - (await openedThisMonth(sb)).size);
  return NextResponse.json({
    paywall: true,
    member,
    lifetime: !!m?.lifetime,
    status: m?.sub_status ?? null,
    renews_at: m?.sub_renews_at ?? null,
    ends_at: m?.sub_ends_at ?? null,
    left,
    free: FREE_PER_MONTH,
  }, { headers: noStore });
}
