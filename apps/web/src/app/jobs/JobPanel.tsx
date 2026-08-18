'use client';

// The listing as a right-hand pane, desktop only. The split view every major
// board converged on: the list stays as the spine, the detail is disposable,
// clicking another card swaps the pane. Non-modal on purpose: no veil, no
// focus trap, the list keeps scrolling. URL contract matches the phone sheet
// (pushState to the listing's static page, Back closes), so refresh and
// sharing land on the same statically generated page either way.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Job } from './JobCard';
import { salaryLabel, agoLabel, sourceName, Arrow45 } from './JobCard';
import { type Detail, cleanLine, loadDetail, loadJobUrl, loadSkillNames } from './detail';

/* Sources that are the company's own board rather than an aggregator feed.
   Saying so on the pane is the provenance line (docs/26): a listing from the
   company's board dies when the company kills it. */
const DIRECT = new Set(['greenhouse', 'lever', 'ashby', 'smartrecruiters', 'workable', 'recruitee', 'employer']);

export default function JobPanel({ job, onClose }: { job: Job; onClose: () => void }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [names, setNames] = useState<Record<string, string>>({});
  const [applyUrl, setApplyUrl] = useState<string | null>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    setDetail(null); setLoaded(false);
    loadDetail(job.occ, job.id).then((d) => { if (live) { setDetail(d); setLoaded(true); } });
    loadSkillNames().then((n) => { if (live) setNames(n); });
    setApplyUrl(job.url ?? null);
    if (!job.url) loadJobUrl(job.occ, job.id).then((u) => { if (live) setApplyUrl(u); });
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    return () => { live = false; };
  }, [job]);

  // Pin below the sticky search band, whatever height it currently is.
  useEffect(() => {
    const place = () => {
      const band = document.querySelector('.jb-stick');
      const top = band ? Math.max(59, Math.round(band.getBoundingClientRect().height) + 59) + 14 : 90;
      paneRef.current?.style.setProperty('--jpane-top', `${top}px`);
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const j = job;
  const pay = salaryLabel(j.smin, j.smax);
  const direct = DIRECT.has(j.source);

  return (
    <aside className="jpane" ref={paneRef} aria-label={`${j.title} at ${j.company}`}>
      <div className="jpane-scroll" ref={scrollRef}>
        <button type="button" className="jpane-x" onClick={onClose} aria-label="Close listing">&times;</button>
        <h2 className="jpane-title">{j.title}</h2>
        <p className="jpane-co">{j.company}{j.location ? ` · ${j.location}` : ''}</p>
        <p className="jpane-prov lbl" suppressHydrationWarning>
          {direct ? 'Direct from the company’s board' : `Indexed from ${sourceName(j.source)}`}
          {' · first seen '}{agoLabel(j.posted).toLowerCase()}
        </p>

        <div className="jsheet-facts">
          {pay && <div><span className="v">{pay}</span><span className="k">Posted pay</span></div>}
          <div><span className="v">{j.remote ? 'Remote' : 'On-site'}</span><span className="k">Workplace</span></div>
          <div><span className="v">{sourceName(j.source)}</span><span className="k">Source</span></div>
        </div>

        {detail?.k?.length ? (
          <div className="jsheet-sec">
            <h3>Skills in this posting</h3>
            <div className="jd-skillgrid">
              {detail.k.map((s) => (
                <Link key={s} className="jd-skill" href={`/glossary#skill-${s}`}>{names[s] ?? s.replace(/-/g, ' ')}</Link>
              ))}
            </div>
          </div>
        ) : null}

        {detail?.s?.length ? (
          <div className="jsheet-sec jsheet-desc">
            <h3>The posting</h3>
            {detail.s.map((sec, i) => (
              <div key={i}>
                {sec.h && <h4>{sec.h}</h4>}
                {sec.t.split('\n').map(cleanLine).filter((l): l is string => !!l).map((line, k) =>
                  line.startsWith('· ') ? <li key={k}>{line.slice(2)}</li> : <p key={k}>{line}</p>
                )}
              </div>
            ))}
          </div>
        ) : loaded ? (
          <p className="jpane-none lbl">The full text lives on the listing page.</p>
        ) : (
          <p className="jpane-none lbl">Loading the posting&hellip;</p>
        )}

        <Link className="jsheet-full lbl" href={`/jobs/${j.occ}/${j.id}`}>
          Open the full listing &rarr;
        </Link>
      </div>

      <div className="jpane-foot">
        {applyUrl ? (
          <>
            <a className="rt-go jsheet-apply" href={applyUrl} target="_blank" rel="nofollow noopener noreferrer">
              Apply now <Arrow45 size={22} />
            </a>
            <span className="jsheet-src lbl">Opens the original posting at {j.company}</span>
          </>
        ) : (
          <>
            <Link className="rt-go jsheet-apply" href={`/jobs/${j.occ}/${j.id}`}>
              Open the full listing <Arrow45 size={22} />
            </Link>
            <span className="jsheet-src lbl">The apply link lives on the listing page</span>
          </>
        )}
      </div>
    </aside>
  );
}
