import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { firstSignIn } from '../../../lib/first-signin';

/* The OAuth return leg (Google). Supabase sends the browser back here with
   ?code=; the code is exchanged for a session and the auth cookies are set on
   the redirect we return (a route handler may write cookies; a server
   component may not, which is why this is not a page). The PKCE verifier the
   browser client stored in a cookie when it started the flow is read through
   the same cookie bridge. Same first-sign-in detector as the magic-link path:
   a missing email_prefs row is inserted with the defaults. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const nextPath = url.searchParams.get('next') || '/dashboard';
  const next = nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/dashboard';
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!code || !supaUrl || !key) return NextResponse.redirect(new URL('/signin?error=oauth', url.origin));

  const res = NextResponse.redirect(new URL(next, url.origin));
  const supabase = createServerClient(supaUrl, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (toSet) => { for (const { name, value, options } of toSet) res.cookies.set(name, value, options); },
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL('/signin?error=oauth', url.origin));
  const { data: u } = await supabase.auth.getUser();
  if (u?.user) await firstSignIn(supabase, u.user);
  return res;
}
