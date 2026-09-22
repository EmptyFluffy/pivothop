'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Arrow45 } from './JobCard';
import { unlockJob, signInHref, signedIn, type Unlocked } from '../../lib/unlock';

/* The apply row of a direct posting's detail page. The static HTML carries no
   company and no link; with a session (or a share token in the URL) this
   fetches them and renders the real apply button, the employer's name and the
   full posting text. Without one it offers sign-in and returns the reader
   here afterwards. */
export default function UnlockRow({ occ, id, backHref, backLabel }: { occ: string; id: string; backHref: string; backLabel: string }) {
  const [state, setState] = useState<'checking' | 'anon' | 'locked' | 'open'>('checking');
  const [real, setReal] = useState<Unlocked | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const r = await unlockJob(occ, id);
      if (!live) return;
      if (r) { setReal(r); setState('open'); return; }
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
  return (
    <div className="jd-applyrow jd-locked">
      {state === 'anon'
        ? <Link className="rt-go jd-apply" href={signInHref()}>Sign in to unlock <Arrow45 size={24} /></Link>
        : <span className="rt-go jd-apply" aria-busy={state === 'checking'}>{state === 'checking' ? 'Checking…' : 'Unlock unavailable'}</span>}
      <Link className="jd-back" href={backHref}>{backLabel}</Link>
      <span className="lbl">Posted on the employer&rsquo;s own site. Sign in with Google, free, to see who and apply there.</span>
    </div>
  );
}
