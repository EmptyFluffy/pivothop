import { NextRequest, NextResponse } from 'next/server';
import { findSocialPostByJobId } from '../../../lib/social/store';

export const dynamic = 'force-dynamic';

/* Branded social URL. The post only shows /j/{job-id}; this route recovers the
   occupation from the social ledger and redirects to the canonical job detail
   with the full campaign attribution. It renders no duplicate indexable page. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(id)) {
    return new NextResponse('Not found', {
      status: 404,
      headers: { 'X-Robots-Tag': 'noindex, nofollow' },
    });
  }

  const row = await findSocialPostByJobId(id);
  if (!row) {
    return new NextResponse('Not found', {
      status: 404,
      headers: { 'X-Robots-Tag': 'noindex, nofollow' },
    });
  }

  const target = new URL(
    `/jobs/${encodeURIComponent(row.job_occ)}/${encodeURIComponent(row.job_id)}`,
    req.url,
  );
  target.searchParams.set('utm_source', 'linkedin');
  target.searchParams.set('utm_medium', 'organic_social');
  target.searchParams.set('utm_campaign', 'daily_jobs');
  target.searchParams.set('utm_content', `${row.job_occ}-${row.job_id}`);

  const response = NextResponse.redirect(target, 307);
  response.headers.set('X-Robots-Tag', 'noindex, follow');
  response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  return response;
}
