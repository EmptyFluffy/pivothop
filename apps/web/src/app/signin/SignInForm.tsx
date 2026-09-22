'use client';
import { useActionState, useEffect, useState } from 'react';
import posthog from 'posthog-js';
import { requestMagicLink } from '../auth/actions';
import GoogleSignIn from '../components/GoogleSignIn';

/* /signin: Google first (components/GoogleSignIn), the email link as the
   fallback for people without a Google account. ?next= carries the page to
   return to, so a reader who hit "Sign in to view this job" lands back on
   that posting. */
export default function SignInForm() {
  const [state, action, pending] = useActionState(requestMagicLink, null);
  const [next, setNext] = useState<string | undefined>(undefined);
  const [oauthErr, setOauthErr] = useState(false);
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const n = p.get('next');
      if (n && n.startsWith('/') && !n.startsWith('//')) setNext(n);
      if (p.get('error') === 'oauth') setOauthErr(true);
    } catch { /* no window */ }
  }, []);

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
      <div className="auth-google">
        <GoogleSignIn next={next ?? '/dashboard'} />
        {oauthErr && <p className="auth-err">Google did not complete the sign-in. Try again, or use the email link below.</p>}
        <p className="auth-or lbl">or with an email link</p>
      </div>
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
