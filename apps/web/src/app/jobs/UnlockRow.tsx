'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Arrow45 } from './JobCard';
import { unlockJob, signedIn, lockReason, type Unlocked } from '../../lib/unlock';
import { requestSignIn, requestPlans } from '../../lib/auth-ui';
import { FREE_PER_MONTH, PLANS, PLANS_PUBLIC } from '../../lib/plans';

/* The apply row of a direct posting's detail page. The static HTML carries no
   company and no link; with a session (or a share token in the URL) this
   fetches them and renders the real apply button, the employer's name and the
   full posting text. Without one it offers sign-in and returns the reader
   here afterwards. Signed in past this month's free opens (plans live), it
   offers the plans instead. */
export default function UnlockRow({ occ, id, backHref, backLabel }: { occ: string; id: string; backHref: string; backLabel: string }) {
  const [state, setState] = useState<'checking' | 'anon' | 'locked' | 'plan' | 'open'>('checking');
  const [real, setReal] = useState<Unlocked | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const r = await unlockJob(occ, id);
      if (!live) return;
      if (r) { setReal(r); setState('open'); return; }
      if (lockReason(occ, id) === 'plan') { setState('plan'); return; }
      setState((await signedIn()) ? 'locked' : 'anon');
    })();
    return () => { live = false; };
  }, [occ, id]);

  if (state === 'open' && real) {
    return (
      <>
        <p className="jd-co jd-unlocked"><strong>{real.company}</strong></p>
        <div className="jd-applyrow">
          <a className="rt-go jd-apply" href={real.url} target="_blank" rel="nofollow noopener noreferrer">Apply now <Arrow45 size={24} /></a>
          <Link className="jd-back" href={backHref}>{backLabel}</Link>
          {real.access?.plan === 'free' && <FreeLeft left={real.access.left} />}
        </div>
        {real.sections && real.sections.length > 0 && (
          <section className="jd-desc jd-desc-full">
            <h2>The posting</h2>
            {real.sections.map((s, i) => (
              <div className="jd-sec" key={i}>
                {s.h && <h3>{s.h}</h3>}
                {s.t.split('\n').map((line) => line.trim()).filter(Boolean).map((line, k) => <p key={k}>{line}</p>)}
              </div>
            ))}
          </section>
        )}
      </>
    );
  }
  if (state === 'plan') {
    return (
      <div className="jd-applyrow jd-locked">
        <button type="button" className="rt-go jd-apply" onClick={() => requestPlans('limit')}>See plans <Arrow45 size={24} /></button>
        <Link className="jd-back" href={backHref}>{backLabel}</Link>
        <span className="lbl">You opened this month&rsquo;s {FREE_PER_MONTH} free direct jobs. ${PLANS.monthly} a month or ${PLANS.lifetime} once opens all of them.</span>
      </div>
    );
  }
  return (
    <div className="jd-applyrow jd-locked">
      {state === 'anon'
        ? <button type="button" className="rt-go jd-apply" onClick={() => requestSignIn('job')}>Sign in to view this job <Arrow45 size={24} /></button>
        : <span className="rt-go jd-apply" aria-busy={state === 'checking'}>{state === 'checking' ? 'Checking…' : 'Unlock unavailable'}</span>}
      <Link className="jd-back" href={backHref}>{backLabel}</Link>
      <span className="lbl">{PLANS_PUBLIC
        ? <>Posted on the employer&rsquo;s own site. Sign in with Google: {FREE_PER_MONTH} a month open free.</>
        : <>Posted on the employer&rsquo;s own site. Sign in with Google, free, to see who and apply there.</>}</span>
    </div>
  );
}

/** After a free open: how many are left this month, and the way past them. */
export function FreeLeft({ left }: { left: number }) {
  return (
    <span className="lbl jd-freeleft">
      {left === 0 ? 'That was your last free direct job this month.' : `${left} of ${FREE_PER_MONTH} free direct jobs left this month.`}{' '}
      <button type="button" className="gl-btn" onClick={() => requestPlans('generic')}>See plans</button>
    </span>
  );
}
