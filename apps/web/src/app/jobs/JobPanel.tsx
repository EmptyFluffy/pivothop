'use client';

// The listing as a right-hand pane, desktop only. The split view every major
// board converged on: the list stays as the spine, the detail is disposable,
// clicking another card swaps the pane. Non-modal on purpose: no veil, no
// focus trap, the list keeps scrolling. URL contract matches the phone sheet
// (pushState to the listing's static page, Back closes), so refresh and
// sharing land on the same page either way.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Job } from './JobCard';
import { salaryLabel, postedLabel, agoLabel, sourceName, companyInitial, Arrow45 } from './JobCard';
import { type Listing, loadListing } from './detail';
import SkillStrip, { type SkillEntry } from './SkillStrip';

/* Sources that are the company's own board rather than an aggregator feed.
   Saying so on the pane is the provenance line (docs/26): a listing from the
   company's board dies when the company kills it. */
const DIRECT = new Set(['greenhouse', 'lever', 'ashby', 'smartrecruiters', 'workable', 'recruitee', 'employer']);

export default function JobPanel({ job, onClose, glossary }: { job: Job; onClose: () => void; glossary?: SkillEntry[] | null }) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loaded, setLoaded] = useState(false);
  const paneRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    setListing(null); setLoaded(false);
    loadListing(job.occ, job.id).then((l) => { if (live) { setListing(l); setLoaded(true); } });
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    return () => { live = false; };
  }, [job]);

  // Pin below the sticky search band, and always end at the viewport bottom:
  // before the band pins, the pane's top rides with the page, so the height is
  // fitted live rather than fixed, and the Apply footer never leaves the fold.
  useEffect(() => {
    const place = () => {
      const el = paneRef.current;
      if (!el) return;
      const band = document.querySelector('.jb-stick');
      const top = band ? Math.max(59, Math.round(band.getBoundingClientRect().height) + 59) : 133;
      el.style.setProperty('--jpane-top', `${top}px`);
      el.style.height = `${Math.max(320, window.innerHeight - Math.max(top, el.getBoundingClientRect().top))}px`;
    };
    let queued = false;
    const onScroll = () => {
      if (queued) return; queued = true;
      requestAnimationFrame(() => { queued = false; place(); });
    };
    place();
    requestAnimationFrame(place);
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('resize', onScroll); window.removeEventListener('scroll', onScroll); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (document.querySelector('.skmodal')) return; // the skill sheet is on top; Esc peels one layer
      onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const j = job;
  const pay = salaryLabel(j.smin, j.smax);
  const date = postedLabel(j.posted);
  const remote = j.remote || /\bremote\b/i.test(j.location);
  const direct = DIRECT.has(j.source);
  const applyUrl = listing?.applyUrl ?? j.url ?? null;

  return (
    <aside className="jpane" ref={paneRef} aria-label={`${j.title} at ${j.company}`}>
      <div className="jpane-scroll" ref={scrollRef}>
        <button type="button" className="jpane-x" onClick={onClose} aria-label="Close listing">&times;</button>
        {/* keyed so a swap re-runs the entrance fade */}
        <div className="jpane-body" key={j.id}>
          <div className="jpane-head">
            {j.logo
              ? <span className="jd-mark"><img src={j.logo} alt="" width={30} height={30} /></span>
              : <span className="jd-mark jd-mono" aria-hidden="true">{companyInitial(j.company)}</span>}
            <div>
              <h2 className="jpane-title">{j.title}</h2>
              <p className="jpane-co">{j.company}{j.location ? ` · ${j.location}` : ''}</p>
              <p className="jpane-prov lbl" suppressHydrationWarning>
                {direct ? 'Direct from the company’s board' : `Indexed from ${sourceName(j.source)}`}
                {' · first seen '}{agoLabel(j.posted).toLowerCase()}
              </p>
            </div>
          </div>

          <div className="jsheet-facts">
            {pay && <div><span className="v">{pay}</span><span className="k">Posted pay</span></div>}
            <div><span className="v">{remote ? 'Remote' : 'On-site'}</span><span className="k">Workplace</span></div>
            {date && <div><span className="v" suppressHydrationWarning>{agoLabel(j.posted)}</span><span className="k">Posted · {date}</span></div>}
            <div><span className="v">{sourceName(j.source)}</span><span className="k">Source</span></div>
          </div>

          {!loaded && (
            <div className="jpane-skel" aria-hidden="true">
              <span style={{ width: '42%' }} /><span style={{ width: '96%' }} /><span style={{ width: '88%' }} />
              <span style={{ width: '93%' }} /><span style={{ width: '60%' }} />
            </div>
          )}

          {listing && listing.skills.length > 0 && (() => {
            /* the same strip as the listing page: marks, hover, and the
               definition sheet on click; plain glossary links until the
               glossary json arrives or for terms outside it */
            const bySlug = new Map((glossary ?? []).map((e) => [e.slug, e]));
            const entries = listing.skills
              .map((s) => bySlug.get(s.href.split('#skill-')[1] ?? ''))
              .filter((e): e is SkillEntry => !!e);
            return (
              <div className="jsheet-sec">
                <h3>Skills in this posting</h3>
                {entries.length === listing.skills.length ? (
                  <SkillStrip skills={entries} />
                ) : (
                  <div className="jd-skillgrid">
                    {listing.skills.map((s) => (
                      <Link key={s.href} className="jd-skill" href={s.href}>{s.term}</Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {listing && listing.sections.length > 0 && (
            <div className="jsheet-sec jsheet-desc">
              <h3>The posting</h3>
              {listing.sections.map((sec, i) => (
                <div key={i}>
                  {sec.h && <h4>{sec.h}</h4>}
                  {sec.parts.map((part, k) =>
                    'ul' in part
                      ? <ul className="jd-ul" key={k}>{part.ul.map((li, x) => <li key={x}>{li}</li>)}</ul>
                      : 'h4' in part
                        ? <h4 key={k}>{part.h4}</h4>
                        : <p key={k}>{part.p}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {loaded && !listing?.sections.length && (
            <p className="jpane-none">
              This source publishes the posting text on its own site only, so the full
              description is one click away at {j.company}.
            </p>
          )}

        </div>
      </div>

      <div className="jpane-foot">
        {applyUrl && (
          <a className="rt-go jsheet-apply" href={applyUrl} target="_blank" rel="nofollow noopener noreferrer" title={`Opens the original posting at ${j.company}`}>
            Apply now <Arrow45 size={22} />
          </a>
        )}
        <Link className="jpane-ghost" href={`/jobs/${j.occ}/${j.id}`} title="Routes into this role and similar listings">Full posting</Link>
      </div>
    </aside>
  );
}
