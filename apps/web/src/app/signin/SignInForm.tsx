'use client';
import { useActionState } from 'react';
import posthog from 'posthog-js';
import { requestMagicLink } from '../auth/actions';

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
  );
}
