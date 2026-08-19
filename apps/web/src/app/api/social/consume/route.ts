import { NextRequest, NextResponse } from 'next/server';
import { recentPosts, claim, mark } from '../../../../lib/social/store';

export const dynamic = 'force-dynamic';

/* Burn a publication id after the external publisher (Zapier) has posted it.
   Compare-and-set from `scheduled`, so a second call, a Zapier replay, or a
   race returns already=true and can never cause a duplicate publication. */

export async function POST(req: NextRequest) {
  const t = process.env.SOCIAL_FEED_TOKEN;
  const auth = req.nextUrl.searchParams.get('token') === t || req.headers.get('authorization') === `Bearer ${t}`;
  if (!t || !auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: { publication_id?: string; external_url?: string } = {};
  try { body = await req.json(); } catch { /* allow query param form */ }
  const pubId = body.publication_id ?? req.nextUrl.searchParams.get('publication_id') ?? '';
  const id = Number(/^ph-li-(\d+)$/.exec(pubId)?.[1]);
  if (!id) return NextResponse.json({ error: 'bad publication_id' }, { status: 400 });

  const claimed = await claim(id, 'scheduled', {
    status: 'published',
    published_at: new Date().toISOString(),
    external_post_id: body.external_url ?? null,
    last_error: null,
  });
  if (!claimed) {
    const row = (await recentPosts('linkedin', 50)).find((r) => r.id === id);
    return NextResponse.json({ ok: true, already: true, status: row?.status ?? 'unknown' });
  }
  await mark(id, { attempts: claimed.attempts + 1 });
  console.log(`[social] consumed ph-li-${id}`);
  return NextResponse.json({ ok: true, published: `ph-li-${id}` });
}
