'use client';
import { useState } from 'react';
import { joinWaitlist } from './actions';
import { SITE_EMAIL } from '../../lib/site';

/* The gate in front of the post-a-job form while checkout isn't wired: one calm
   card, three fields, honest states. The full EmployerForm stays built behind a
   flag on the page — flipping it back on is one line when payment lands. */

export function Waitlist({ pricing }: { pricing: { std: number; feat: number } }) {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'mail' | 'err'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setState('err'); return; }
    setState('busy');
    const r = await joinWaitlist({ email, company, role }).catch(() => ({ error: 'network' as const }));
    if ('ok' in r && r.ok) setState('done');
    else if (r.error === 'not-configured') setState('mail'); // no backend -> hand them the inbox
    else if (r.error === 'invalid-email') setState('err');
    else setState('mail');
  }

  if (state === 'done') {
    return (
      <div className="wl-card">
        <h2>You&rsquo;re on the list.</h2>
        <p className="wl-p">
          First posts run as concierge introductions: we match the role against the skill graph by hand
          and reply from {SITE_EMAIL} when your slot opens. Launch pricing stays locked for the waitlist:
          ${pricing.std} standard, ${pricing.feat} featured.
        </p>
      </div>
    );
  }

  return (
    <div className="wl-card">
      <h2>The board opens by hand first.</h2>
      <p className="wl-p">
        Posting isn&rsquo;t self-serve yet. Join the waitlist and the first listings run as concierge
        introductions: your role, matched against the skill graph to the candidates whose skills already
        reach it, adjacent professions included. Launch pricing locked for the list:
        <strong> ${pricing.std} standard &middot; ${pricing.feat} featured</strong>, half off while the board fills.
      </p>
      <form className="wl-form" onSubmit={submit}>
        <input type="email" required placeholder="Work email" aria-label="Work email"
          value={email} onChange={(e) => { setEmail(e.target.value); if (state === 'err') setState('idle'); }} autoComplete="email" />
        <input type="text" placeholder="Company (optional)" aria-label="Company"
          value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" />
        <input type="text" placeholder="Role you're hiring for (optional)" aria-label="Role you're hiring for"
          value={role} onChange={(e) => setRole(e.target.value)} />
        <button type="submit" className="wl-go" disabled={state === 'busy'}>
          {state === 'busy' ? 'Joining…' : 'Join the waitlist'}
        </button>
      </form>
      {state === 'err' && <p className="wl-note lbl">That email doesn&rsquo;t look right &mdash; check it and try again.</p>}
      {state === 'mail' && (
        <p className="wl-note lbl">
          The list is busy right now &mdash; email <a className="gl" href={`mailto:${SITE_EMAIL}?subject=Job%20post%20waitlist`}>{SITE_EMAIL}</a> and you&rsquo;re on it.
        </p>
      )}
      <p className="wl-alt lbl">
        Prefer email? <a className="gl" href={`mailto:${SITE_EMAIL}?subject=Job%20post%20waitlist`}>{SITE_EMAIL}</a> reaches a person.
      </p>
    </div>
  );
}
