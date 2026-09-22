'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import GoogleSignIn from './GoogleSignIn';
import { onSignInRequest, primeSession, type SignInReason } from '../../lib/auth-ui';

/* The sign-in sheet: opens over any page when something asks for a session
   (a locked posting, the save button). Google in one click; the email link
   as the fallback. Mounted once in the page shell. Nothing in it is
   personal, so the prerendered HTML stays identical for every visitor. */
const COPY: Record<SignInReason, { h: string; p: string }> = {
  job: { h: 'Sign in to view this job.', p: 'This posting is on the employer’s own site. A free account shows who is hiring, the full posting and the link to apply.' },
  save: { h: 'Sign in to save jobs.', p: 'Saved jobs live in your dashboard and follow you across devices.' },
  generic: { h: 'Sign in.', p: 'A free account keeps your saved jobs and opens the postings employers publish on their own sites.' },
};

export default function SignInSheet() {
  const [open, setOpen] = useState<{ reason: SignInReason; next?: string } | null>(null);
  useEffect(() => {
    primeSession();
    return onSignInRequest((d) => setOpen(d));
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('ss-open');
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('ss-open'); };
  }, [open]);
  if (!open) return null;
  const c = COPY[open.reason] ?? COPY.generic;
  const next = open.next ?? (typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/dashboard');
  return (
    <div className="ss-wrap" role="dialog" aria-modal="true" aria-labelledby="ss-h">
      <div className="ss-veil" onClick={() => setOpen(null)} />
      <div className="ss-sheet">
        <button type="button" className="ss-x" onClick={() => setOpen(null)} aria-label="Close">&times;</button>
        <h2 id="ss-h" className="ss-h">{c.h}</h2>
        <p className="ss-p">{c.p}</p>
        <GoogleSignIn next={next} where={open.reason} />
        <p className="ss-alt lbl">
          No Google account? <Link href={`/signin?next=${encodeURIComponent(next)}`}>Use an email link</Link>.
        </p>
      </div>
    </div>
  );
}
