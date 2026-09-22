'use client';
import { useActionState, useEffect, useState } from 'react';
import posthog from 'posthog-js';
import { requestMagicLink } from '../auth/actions';
import { supabaseBrowser } from '../../lib/supabase-browser';

const NOT_LIVE = 'Sign-in is not live yet. Your saved jobs stay in this browser meanwhile.';

/* One click with Google (Supabase OAuth, PKCE; the return leg is
   /auth/callback), the email link as the fallback for people without a
   Google account. Both degrade to the same honest note until the project is
   provisioned. ?next= carries the page to return to, so a reader who hit
   "Sign in to unlock" on a posting lands back on that posting. */
function GoogleButton() {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get('error') === 'oauth') {
        setMsg('Google did not complete the sign-in. Try again, or use the email link below.');
      }
    } catch { /* no window */ }
  }, []);
  const go = async () => {
    const sb = supabaseBrowser();
    if (!sb) { setMsg(NOT_LIVE); return; }
    let next = '/dashboard';
    try { next = new URLSearchParams(window.location.search).get('next') || '/dashboard'; } catch { /* keep default */ }
    if (!next.startsWith('/') || next.startsWith('//')) next = '/dashboard';
    setBusy(true);
    posthog.capture('google_signin_started');
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) { setBusy(false); setMsg('Google sign-in did not start. Use the email link below.'); }
  };
  return (
    <div className="auth-google">
      <button type="button" className="auth-go auth-google-btn" onClick={go} disabled={busy}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z"/><path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
        {busy ? 'Opening Google…' : 'Continue with Google'}
      </button>
      {msg && <p className="auth-err">{msg}</p>}
      <p className="auth-or lbl">or with an email link</p>
    </div>
  );
}

export default function SignInForm() {
  const [state, action, pending] = useActionState(requestMagicLink, null);

  if (state?.ok) {
    return (
      <div className="auth-sent">
        <p>
          Link sent to <strong>{state.msg}</strong>. Open it on this device, or
          type the 6-digit code from the email at{' '}
          <a href={`/auth/confirm?email=${encodeURIComponent(state.msg)}`}>the code page</a>.
        </p>
        <p className="auth-alt">Wrong address? <a href="/signin">Start over.</a></p>
      </div>
    );
  }

  return (
    <>
      <GoogleButton />
      <form
        action={action}
        onSubmit={() => posthog.capture('magic_link_requested')}
        className="auth-form"
      >
        <label className="auth-field">
          <span>Email</span>
          <input type="email" name="email" required autoComplete="email" placeholder="you@example.com" />
        </label>
        <button className="auth-go" type="submit" disabled={pending}>
          {pending ? 'Sending…' : 'Send the link'}
        </button>
        {state && !state.ok && <p className="auth-err">{state.msg}</p>}
      </form>
    </>
  );
}
