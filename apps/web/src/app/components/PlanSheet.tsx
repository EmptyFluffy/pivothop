'use client';
import { useEffect, useState } from 'react';
import { onPlansRequest, isSignedInNow, requestSignIn, type PlansReason } from '../../lib/auth-ui';
import { PLANS, FREE_PER_MONTH, type PlanKind } from '../../lib/plans';
import { SITE_EMAIL } from '../../lib/site';

/* The Direct plans sheet: opens when a posting answers 402 (this month's free
   opens are used) or from any "See plans" link. Picking a plan asks
   /api/checkout for a Lemon Squeezy checkout and leaves for it; Lemon Squeezy
   sends the buyer back with ?plan=welcome, and this sheet then waits for the
   webhook to write the membership before reloading, so the first page after
   paying already opens everything. Mounted once in the page shell. */

const COPY: Record<PlansReason, string> = {
  limit: `That was this month’s ${FREE_PER_MONTH} free direct jobs.`,
  generic: 'Open every direct job.',
};

export default function PlanSheet() {
  const [open, setOpen] = useState<{ reason: PlansReason; next?: string } | null>(null);
  const [busy, setBusy] = useState<PlanKind | null>(null);
  const [err, setErr] = useState('');
  const [welcome, setWelcome] = useState<'waiting' | 'slow' | null>(null);

  useEffect(() => onPlansRequest((d) => { setErr(''); setBusy(null); setOpen(d); }), []);

  // back from Lemon Squeezy: wait for the webhook, then reload without the flag
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('plan') !== 'welcome') return;
    setWelcome('waiting');
    let tries = 0;
    const clean = () => { url.searchParams.delete('plan'); return url.pathname + (url.search || '') + url.hash; };
    const t = setInterval(async () => {
      tries += 1;
      const r = await fetch('/api/plan', { credentials: 'same-origin', cache: 'no-store' }).catch(() => null);
      const p = r?.ok ? await r.json().catch(() => null) : null;
      if (p?.member) { clearInterval(t); window.location.replace(clean()); return; }
      if (tries >= 15) { clearInterval(t); setWelcome('slow'); window.history.replaceState(null, '', clean()); }
    }, 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('ss-open');
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('ss-open'); };
  }, [open]);

  const go = async (plan: PlanKind) => {
    const next = open?.next ?? `${window.location.pathname}${window.location.search}`;
    if (!isSignedInNow()) { setOpen(null); requestSignIn('job', next); return; }
    setBusy(plan); setErr('');
    const r = await fetch('/api/checkout', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan, next }),
    }).catch(() => null);
    const j = r ? await r.json().catch(() => null) : null;
    if (j?.url) { window.location.href = j.url; return; }
    setBusy(null);
    setErr(j?.error === 'already'
      ? 'Your plan is already active. Reload the page to open the posting.'
      : `The checkout did not open. Try again, or write to ${SITE_EMAIL}.`);
  };

  if (welcome) {
    return (
      <div className="ss-wrap" role="status" aria-live="polite">
        <div className="ss-veil" />
        <div className="ss-sheet">
          <h2 className="ss-h">Payment received.</h2>
          <p className="ss-p">
            {welcome === 'waiting'
              ? 'Switching your plan on. This page reloads by itself in a few seconds.'
              : `Your plan is taking longer than usual to switch on. Reload in a minute; if the postings still do not open, write to ${SITE_EMAIL} and we will sort it out.`}
          </p>
          {welcome === 'slow' && <button type="button" className="rt-go ps-done" onClick={() => setWelcome(null)}>Close</button>}
        </div>
      </div>
    );
  }
  if (!open) return null;
  return (
    <div className="ss-wrap" role="dialog" aria-modal="true" aria-labelledby="ps-h">
      <div className="ss-veil" onClick={() => setOpen(null)} />
      <div className="ss-sheet">
        <button type="button" className="ss-x" onClick={() => setOpen(null)} aria-label="Close">&times;</button>
        <h2 id="ps-h" className="ss-h">{COPY[open.reason]}</h2>
        <p className="ss-p">A plan opens every posting employers publish on their own sites: who is hiring, the full text and the link to apply, with the employer named on every card.</p>
        <div className="ps-plans">
          <button type="button" className="ps-plan" onClick={() => go('monthly')} disabled={busy !== null}>
            <span className="ps-price">${PLANS.monthly}</span>
            <span className="ps-per">a month</span>
            <span className="ps-note">{busy === 'monthly' ? 'Opening checkout…' : 'Cancel anytime'}</span>
          </button>
          <button type="button" className="ps-plan" onClick={() => go('lifetime')} disabled={busy !== null}>
            <span className="ps-price">${PLANS.lifetime}</span>
            <span className="ps-per">once</span>
            <span className="ps-note">{busy === 'lifetime' ? 'Opening checkout…' : 'No renewal'}</span>
          </button>
        </div>
        {err && <p className="ps-err" role="alert">{err}</p>}
        <p className="ss-alt lbl">Lemon Squeezy takes the payment and sends the receipt. Without a plan, {FREE_PER_MONTH} direct jobs a month open free.</p>
      </div>
    </div>
  );
}
