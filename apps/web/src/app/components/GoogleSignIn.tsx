'use client';
import { useState } from 'react';
import posthog from 'posthog-js';
import { supabaseBrowser } from '../../lib/supabase-browser';

export const NOT_LIVE = 'Sign-in is not live yet. Your saved jobs stay in this browser meanwhile.';

/* The one Google button (Supabase OAuth, PKCE; the return leg is
   /auth/callback). `next` is where the reader lands afterwards; it defaults
   to the current page so a locked posting reopens unlocked. */
export default function GoogleSignIn({ next, label = 'Continue with Google', where }: { next?: string; label?: string; where?: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const go = async () => {
    const sb = supabaseBrowser();
    if (!sb) { setMsg(NOT_LIVE); return; }
    let to = next ?? `${window.location.pathname}${window.location.search}`;
    if (!to.startsWith('/') || to.startsWith('//')) to = '/dashboard';
    setBusy(true);
    posthog.capture('google_signin_started', { where: where ?? 'signin' });
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(to)}` },
    });
    if (error) { setBusy(false); setMsg('Google sign-in did not start. Try the email link.'); }
  };
  return (
    <>
      <button type="button" className="auth-go auth-google-btn" onClick={go} disabled={busy}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z"/><path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
        {busy ? 'Opening Google…' : label}
      </button>
      {msg && <p className="auth-err">{msg}</p>}
    </>
  );
}
