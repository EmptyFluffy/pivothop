'use client';
import { useState } from 'react';
import posthog from 'posthog-js';
import { joinWaitlist } from './actions';
import { SITE_EMAIL } from '../../lib/site';

/* The gate in front of the post-a-job form while checkout isn't wired.
   One status line, one field, one button — the hero above already made the
   pitch, so this block only states the deal and takes the email. The full
   EmployerForm stays built behind the WAITLIST flag on the page. */

export function Waitlist({ pricing }: { pricing: { std: number; feat: number } }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'mail' | 'err'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setState('err'); return; }
    setState('busy');
    const r = await joinWaitlist({ email }).catch(() => ({ error: 'network' as const }));
    if ('ok' in r && r.ok) {
      posthog.capture('waitlist_joined', { waitlist: 'employer_job_post' });
      setState('done');
    } else if (r.error === 'invalid-email') setState('err');
    else setState('mail'); // no backend right now -> hand them the inbox
  }

  if (state === 'done') {
    return (
      <div className="wl">
        <p className="wl-done">You&rsquo;re on the list.</p>
        <p className="wl-alt lbl">First posts run by hand. We reply from {SITE_EMAIL}.</p>
      </div>
    );
  }

  return (
    <div className="wl">
      <p className="lbl wl-status">Self-serve posting opens soon &middot; first slots run by hand</p>
      <form className="wl-row" onSubmit={submit}>
        <input
          type="email" required placeholder="Work email" aria-label="Work email" autoComplete="email"
          value={email} onChange={(e) => { setEmail(e.target.value); if (state === 'err') setState('idle'); }}
        />
        <button type="submit" className="wl-go" disabled={state === 'busy'}>
          {state === 'busy' ? 'Joining…' : 'Join the waitlist'}
        </button>
      </form>
      {state === 'err' && <p className="wl-note lbl">That email doesn&rsquo;t look right.</p>}
      {state === 'mail' && (
        <p className="wl-note lbl">
          Could not save just now &mdash; email <a className="gl" href={`mailto:${SITE_EMAIL}?subject=Job%20post%20waitlist`}>{SITE_EMAIL}</a> and you&rsquo;re on the list.
        </p>
      )}
      <p className="wl-alt lbl">
        ${pricing.std} standard &middot; ${pricing.feat} featured &middot; launch pricing, locked for the list &middot; <a className="gl" href={`mailto:${SITE_EMAIL}?subject=Job%20post%20waitlist`}>{SITE_EMAIL}</a>
      </p>
    </div>
  );
}
