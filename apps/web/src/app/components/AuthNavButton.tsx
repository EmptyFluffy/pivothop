'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '../../lib/supabase-browser';

/* The nav pill. Server-renders "Sign in" for everyone (static posture);
   a signed-in browser swaps it to Dashboard after mount. */

export default function AuthNavButton() {
  const [inSession, setInSession] = useState(false);
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    void sb.auth.getSession().then(({ data }) => setInSession(!!data.session));
  }, []);
  return inSession
    ? <Link className="nav-run" href="/dashboard">Dashboard</Link>
    : <Link className="nav-run" href="/signin">Sign in</Link>;
}
