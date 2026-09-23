import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase-server';
import { openShard } from '../../../../lib/direct-vault';

/* The signed-in board: employer name and logo for the direct rows on screen,
   so a member's list reads like a list (2026-09-22, Carlos: "no debería ver
   los logos blurred si ya estoy con la sesión iniciada"). Never the apply
   link or the text: those stay per-posting behind /api/direct and its daily
   cap. Session only, one occupation and at most 60 ids per call. */
export const dynamic = 'force-dynamic';

const MAX_IDS = 60;

export async function POST(req: NextRequest) {
  const noStore = { 'cache-control': 'private, no-store' };
  let body: { occ?: unknown; ids?: unknown } = {};
  try { body = await req.json(); } catch { /* empty */ }
  const occ = typeof body.occ === 'string' ? body.occ : '';
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === 'string' && /^[a-z0-9]{1,24}$/.test(x)).slice(0, MAX_IDS) : [];
  if (!/^[a-z0-9-]{1,60}$/.test(occ) || ids.length === 0) {
    return NextResponse.json({ error: 'bad-request' }, { status: 400, headers: noStore });
  }
  const sb = await supabaseServer();
  const { data } = sb ? await sb.auth.getUser() : { data: null };
  if (!data?.user) return NextResponse.json({ error: 'sign-in' }, { status: 401, headers: noStore });

  const shard = openShard(occ);
  const out: Record<string, { company: string; logo?: string }> = {};
  if (shard) for (const id of ids) { const r = shard[id]; if (r) out[id] = { company: r.company, ...(r.logo ? { logo: r.logo } : {}) }; }
  return NextResponse.json(out, { headers: noStore });
}
