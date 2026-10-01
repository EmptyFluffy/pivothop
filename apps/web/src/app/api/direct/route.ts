import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer } from '../../../lib/supabase-server';
import { openShard, verifyShareToken } from '../../../lib/direct-vault';
import { paywallFor, accessFor, type Access } from '../../../lib/paywall';
import { FREE_PER_MONTH } from '../../../lib/plans';

/* Unlock one direct posting: the company, its logo, the apply URL and the
   full posting text, none of which exist in any public file (docs/34, the
   direct-jobs lock). Two grants:
     - a signed-in user (Supabase session cookie). Where the paywall applies
       (lib/paywall), a member opens everything and anyone else opens
       FREE_PER_MONTH distinct postings a month; past that the answer is 402.
     - a share token (?u=), minted by us for one posting, for the links we
       post ourselves. Never metered.
   Signed-in reads are counted in `unlocks` (per-user RLS) and capped per day
   so a subscription cannot be turned into a copy of the board. */
export const dynamic = 'force-dynamic';

const DAILY_CAP = 300;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const occ = q.get('occ') ?? '', id = q.get('id') ?? '', u = q.get('u') ?? '';
  if (!/^[a-z0-9-]{1,60}$/.test(occ) || !/^[a-z0-9]{1,24}$/.test(id)) {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }
  const noStore = { 'cache-control': 'private, no-store' };

  let grant: 'token' | 'user' | null = null;
  let sb: Awaited<ReturnType<typeof supabaseServer>> = null;
  let email: string | undefined;
  if (u && verifyShareToken(occ, id, u)) grant = 'token';
  else {
    sb = await supabaseServer();
    if (sb) {
      const { data } = await sb.auth.getUser();
      if (data?.user) { grant = 'user'; email = data.user.email; }
    }
  }
  if (!grant) return NextResponse.json({ error: 'sign-in' }, { status: 401, headers: noStore });

  const row = openShard(occ)?.[id];
  if (!row) return NextResponse.json({ error: 'not-found' }, { status: 404, headers: noStore });

  let access: Access | null = null;
  if (grant === 'user' && sb) {
    const since = new Date(Date.now() - 864e5).toISOString();
    const { count } = await sb.from('unlocks').select('*', { count: 'exact', head: true }).gte('at', since);
    if ((count ?? 0) >= DAILY_CAP) {
      return NextResponse.json({ error: 'daily-cap' }, { status: 429, headers: noStore });
    }
    if (paywallFor(email)) {
      const a = await accessFor(sb, `${occ}/${id}`);
      if (a === 'limit') return NextResponse.json({ error: 'plan', free: FREE_PER_MONTH }, { status: 402, headers: noStore });
      access = a;
    }
    // a missing table (migration not yet applied) must not block the unlock
    await sb.from('unlocks').insert({ occ, job_id: id }).then(() => undefined, () => undefined);
  }
  return NextResponse.json(access ? { ...row, access } : row, { headers: noStore });
}
