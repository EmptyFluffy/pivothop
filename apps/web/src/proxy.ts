import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/* Two duties, one function (renamed middleware -> proxy per Next 16):

   1. HTTP Basic Auth for /admin. Password lives in ADMIN_PASSWORD (Vercel env);
      user defaults to "admin". Credentials never touch a cookie and the browser
      resends them on every /admin request, so the review console and its server
      actions are both covered.

   2. Supabase session refresh on the account routes (/dashboard, /auth,
      /signin). The getAll/setAll bridge writes refreshed cookies onto BOTH the
      request (so downstream server components see the new token this same
      request) and the response. The response object the bridge built is the
      one that must be returned: a fresh NextResponse created afterwards would
      silently drop the Set-Cookie headers.

   NARROW ON PURPOSE (2026-09-28). This used to match every page route, and
   also stamped the visitor-country cookies. Every page view, every crawler
   fetch of every job page included, was a function invocation: about a
   million a day on the September bill, for 2-3k human visits a month. No
   page reads the session on the server (pages hydrate signed-in chrome
   client-side; the browser client refreshes its own token; /api/direct and
   the server actions refresh through lib/supabase-server, which may write
   cookies there). The country cookie moved to /api/geo, asked once per
   visitor by lib/geo and never by a crawler. Widen the matcher only for a
   route that genuinely needs a server-side session in a Server Component. */
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    const pass = process.env.ADMIN_PASSWORD;
    if (!pass) return new NextResponse('Admin not configured. Set ADMIN_PASSWORD.', { status: 503 });
    const user = process.env.ADMIN_USER || 'admin';
    const expected = 'Basic ' + btoa(`${user}:${pass}`);
    if (req.headers.get('authorization') !== expected) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="PivotHop Admin", charset="UTF-8"' },
      });
    }
    return NextResponse.next();
  }

  let res = NextResponse.next({ request: req });

  // Session refresh, skipped entirely until the Supabase project exists.
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (sbUrl && sbKey) {
    const supabase = createServerClient(sbUrl, sbKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    // The call itself triggers the refresh when the access token is stale.
    await supabase.auth.getClaims();
  }

  return res;
}

export const config = {
  matcher: [
    '/admin', '/admin/:path*',
    '/dashboard', '/dashboard/:path*',
    '/auth/:path*',
    '/signin',
  ],
};
