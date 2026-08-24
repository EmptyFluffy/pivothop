import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/* Three duties, one edge function (renamed middleware -> proxy per Next 16):

   1. HTTP Basic Auth for /admin. Password lives in ADMIN_PASSWORD (Vercel env);
      user defaults to "admin". Credentials never touch a cookie and the browser
      resends them on every /admin request, so the review console and its server
      actions are both covered.

   2. Visitor country (docs/32: SUGGEST, NEVER FORCE). Vercel stamps
      x-vercel-ip-country on every request; a CH visitor gets a 30-day cookie
      and a client component offers the Swiss board once, dismissibly. No
      redirect, ever: Google crawls from the US and a forced redirect would
      cloak the site from its own index, and a quarter of Swiss residents are
      foreign nationals who may want exactly the page they asked for. The
      static HTML stays byte-identical for every visitor — the banner hydrates
      client-side off the cookie, so prerendering and SEO are untouched.

   3. Supabase session refresh — the ONLY place tokens are refreshed. The
      getAll/setAll bridge writes refreshed cookies onto BOTH the request (so
      downstream server components see the new token this same request) and
      the response. The response object the bridge built is the one that must
      be returned: a fresh NextResponse created afterwards would silently drop
      the Set-Cookie headers and users would randomly log out. Auth state
      never varies the prerendered HTML (same doctrine as the geo cookies);
      pages hydrate their signed-in chrome client-side. */
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

  const cc = req.headers.get('x-vercel-ip-country') || '';
  if (cc === 'CH' && !req.cookies.get('ph-ch')) {
    res.cookies.set('ph-ch', '1', { maxAge: 60 * 60 * 24 * 30, path: '/', sameSite: 'lax' });
  }
  // The same courtesy for everyone else. A board sorted by date alone shows a
  // US nurse 390 Swiss listings first, because that is where the supply is.
  // Two letters, readable by the client, never used to redirect or to vary the
  // prerendered HTML.
  if (/^[A-Z]{2}$/.test(cc) && req.cookies.get('ph-cc')?.value !== cc) {
    res.cookies.set('ph-cc', cc, { maxAge: 60 * 60 * 24 * 30, path: '/', sameSite: 'lax' });
  }
  return res;
}

export const config = {
  matcher: [
    '/admin', '/admin/:path*',
    // geo cookie: page routes only — never assets, data files or the API
    '/((?!_next|api|data|logos|.*\\..*).*)',
  ],
};
