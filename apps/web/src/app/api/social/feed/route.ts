import { NextRequest, NextResponse } from 'next/server';
import { recentPosts, mark } from '../../../../lib/social/store';
import { stillLive } from '../../../../lib/social/select';

export const dynamic = 'force-dynamic';

/* The Zapier-facing queue. Returns approved (`scheduled`) items as a JSON
   array, newest first, each with a stable unique `id` · Zapier's polling
   trigger deduplicates on that key, so an item fires exactly one Zap run even
   though the feed keeps returning it until consumed. Expired jobs are flipped
   to `skipped` here, before any publisher can see them.

   Auth: SOCIAL_FEED_TOKEN as ?token= (Zapier-friendly) or a Bearer header.
   Provider-agnostic on purpose: replacing Zapier with LinkedIn's direct API
   later means pointing a different consumer at this same queue. */

function authorized(req: NextRequest): boolean {
  const t = process.env.SOCIAL_FEED_TOKEN;
  if (!t) return false;
  return req.nextUrl.searchParams.get('token') === t || req.headers.get('authorization') === `Bearer ${t}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const rows = await recentPosts('linkedin', 30);
  const items = [];
  for (const r of rows) {
    if (r.status !== 'scheduled') continue;
    if (!stillLive(r.job_occ, r.job_id)) {
      await mark(r.id, { status: 'skipped', last_error: 'expired before publication' });
      continue;
    }
    items.push({
      id: `ph-li-${r.id}`,                    // unique publication id; Zapier dedup key
      publication_id: `ph-li-${r.id}`,
      job_id: r.job_id,
      job_title: r.job_title,
      company: r.job_company,
      location: null as string | null,        // location and salary live inside the copy; kept for mapping
      salary: null as string | null,
      generated_post_copy: r.generated_copy,
      job_url: r.job_url,
      social_score: r.selection_score,
      selection_reason: r.selection_reason,
      scheduled_at: r.scheduled_at,
    });
  }
  return NextResponse.json(items);
}
