import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/* HTTP Basic Auth for /admin. Password lives in ADMIN_PASSWORD (Vercel env);
   user defaults to "admin". Credentials never touch a cookie and the browser
   resends them on every /admin request, so the review console and its server
   actions are both covered. */
export function middleware(req: NextRequest) {
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

export const config = { matcher: ['/admin', '/admin/:path*'] };
