import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/* Visitor country for lib/geo.ts: one call per visitor per 30 days, made by
   the browser, never by a crawler. Suggest, never force (docs/32): nothing
   here redirects or varies a page; the cookie only feeds two client-side
   niceties. "ZZ" records "Vercel could not place this visitor" so the
   question is not asked again on every page. */
export function GET(req: NextRequest) {
  const raw = req.headers.get('x-vercel-ip-country') || '';
  const cc = /^[A-Z]{2}$/.test(raw) ? raw : '';
  const res = NextResponse.json({ cc }, { headers: { 'Cache-Control': 'private, no-store' } });
  res.cookies.set('ph-cc', cc || 'ZZ', { maxAge: 60 * 60 * 24 * 30, path: '/', sameSite: 'lax' });
  return res;
}
