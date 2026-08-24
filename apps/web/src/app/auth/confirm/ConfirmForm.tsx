'use client';
import { useEffect, useRef, useState } from 'react';
import { verifyToken } from '../actions';

/* Auto-submits the token_hash POST once on mount; the button stays as the
   no-JS fallback and as the retry affordance. Without a token_hash (or after
   an expired one) it collects the 6-digit code from the same email. */

export default function ConfirmForm({ tokenHash, next, expired, email }: {
  tokenHash: string; next: string; expired: boolean; email: string;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const auto = !!tokenHash && !expired;

  useEffect(() => {
    if (auto) {
      setBusy(true);
      ref.current?.requestSubmit();
    }
  }, [auto]);

  if (auto) {
    return (
      <form ref={ref} action={verifyToken} onSubmit={() => setBusy(true)}>
        <input type="hidden" name="token_hash" value={tokenHash} />
        <input type="hidden" name="next" value={next} />
        <p className="auth-sub">One click and you are in.</p>
        <button className="auth-go" type="submit" disabled={busy}>
          {busy ? 'Confirming…' : 'Confirm sign-in'}
        </button>
      </form>
    );
  }

  return (
    <form action={verifyToken}>
      <input type="hidden" name="next" value={next} />
      {expired && (
        <p className="auth-err">
          That link was already used or has expired. Enter the 6-digit code from
          the same email, or request a new link.
        </p>
      )}
      <label className="auth-field">
        <span>Email</span>
        <input type="email" name="email" defaultValue={email} required autoComplete="email" />
      </label>
      <label className="auth-field">
        <span>6-digit code</span>
        <input type="text" name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" />
      </label>
      <button className="auth-go" type="submit">Confirm sign-in</button>
      <p className="auth-alt"><a href="/signin">Request a new link</a></p>
    </form>
  );
}
