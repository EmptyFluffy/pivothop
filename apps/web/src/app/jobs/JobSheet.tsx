'use client';

// The job listing as a bottom sheet, on phones only.
//
// Why not Next's intercepting routes, which is the canonical answer: the board
// already holds every card's data in state, so a sheet opens with zero network
// and no route transition. Interception would mean either 4,477 extra
// statically generated variants, or making them dynamic — turning a fully
// static site into one with serverless functions, which this project
// deliberately avoids. The URL guarantees are identical either way: pushState
// gives a real address, a refresh or a shared link lands on the existing static
// page, and Back closes the sheet instead of leaving the board.
//
// Accessibility follows the standard sheet contract: focus moves in on open and
// returns on close, focus is trapped while open, the background is inert, and
// there is an explicit close button and Escape — never swipe as the only way
// out.

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Job } from './JobCard';
import SaveButton from './SaveButton';
import { salaryLabel, postedLabel, agoLabel, sourceName, Arrow45 } from './JobCard';
import { type Listing, loadListing } from './detail';
import SkillStrip, { type SkillEntry } from './SkillStrip';


export default function JobSheet({ job, onClose, glossary }: { job: Job | null; onClose: () => void; glossary?: SkillEntry[] | null }) {
  const [listing, setListing] = useState<Listing | null>(null);
  // The sheet outlives the `job` prop by one transition. Without this it
  // unmounted the instant the parent cleared the job, so it vanished rather
  // than sliding away — the reason dismissing felt abrupt.
  const [local, setLocal] = useState<Job | null>(null);
  const [shown, setShown] = useState(false);
  const [drag, setDrag] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const startY = useRef<number | null>(null);

  const close = useCallback(() => { setDrag(0); onClose(); }, [onClose]);

  useEffect(() => {
    if (job) {
      setLocal(job);
      // Two frames: one to mount at translateY(100%), one to flip the class so
      // the transition actually has a start value to animate from.
      const r1 = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(r1);
    }
    setShown(false);
    const t = setTimeout(() => { setLocal(null); setListing(null); setDrag(0); }, 460);
    return () => clearTimeout(t);
  }, [job]);

  useEffect(() => {
    if (!job) return;
    let live = true;
    loadListing(job.occ, job.id).then((l) => { if (live) setListing(l); });
    return () => { live = false; };
  }, [job]);

  // Scroll lock. iOS ignores overflow:hidden on body, so pin it and restore the
  // exact offset on close, otherwise dismissing throws the board to the top.
  useEffect(() => {
    if (!local) return;
    const y = window.scrollY;
    const { body } = document;
    const prev = { position: body.style.position, top: body.style.top, width: body.style.width };
    body.style.position = 'fixed';
    body.style.top = `-${y}px`;
    body.style.width = '100%';
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      window.scrollTo(0, y);
    };
  }, [local]);

  // Focus: remember what opened it, move in, trap, restore on close.
  useEffect(() => {
    if (!local) return;
    restoreFocus.current = document.activeElement as HTMLElement | null;
    sheetRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (document.querySelector('.skmodal')) return; close(); return; }
      if (e.key !== 'Tab' || !sheetRef.current) return;
      const f = sheetRef.current.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])'
      );
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      restoreFocus.current?.focus?.();
    };
  }, [local, close]);

  if (!local) return null;
  const j = local;

  const pay = salaryLabel(j.smin, j.smax);
  const date = postedLabel(j.posted);

  // Drag to dismiss from the handle/header only — the body scrolls normally.
  const onTouchStart = (e: React.TouchEvent) => {
    if ((scrollRef.current?.scrollTop ?? 0) > 0) return;
    startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setDrag(dy);
  };
  const onTouchEnd = () => {
    if (startY.current == null) return;
    startY.current = null;
    if (drag > 110) close(); else setDrag(0);
  };

  return (
    <div className={`jsheet-wrap${shown ? ' in' : ''}`} role="dialog" aria-modal="true" aria-label={`${j.title} at ${j.company}`}>
      <div className="jsheet-veil" onClick={close} />
      <div
        ref={sheetRef}
        tabIndex={-1}
        className="jsheet"
        style={shown && drag ? { transform: `translateY(${drag}px)`, transition: 'none' } : undefined}
      >
        <div className="jsheet-grab" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <span className="jsheet-bar" aria-hidden="true" />
          <button type="button" className="jsheet-x" onClick={close} aria-label="Close">&times;</button>
        </div>

        <div className="jsheet-scroll" ref={scrollRef}>
          <h2 className="jsheet-title">{j.title}</h2>
          <p className="jsheet-co">{j.company}{j.location ? ` · ${j.location}` : ''}</p>

          <div className="jsheet-facts">
            {pay && <div><span className="v">{pay}</span><span className="k">Posted pay</span></div>}
            <div><span className="v">{j.remote ? 'Remote' : 'On-site'}</span><span className="k">Workplace</span></div>
            {date && <div><span className="v" suppressHydrationWarning>{agoLabel(j.posted)}</span><span className="k">Posted</span></div>}
            <div><span className="v">{sourceName(j.source)}</span><span className="k">Source</span></div>
          </div>

          {listing?.skills?.length ? (() => {
            const bySlug = new Map((glossary ?? []).map((e) => [e.slug, e]));
            const entries = listing.skills
              .map((sk) => bySlug.get(sk.href.split('#skill-')[1] ?? ''))
              .filter((e): e is SkillEntry => !!e);
            return (
              <div className="jsheet-sec">
                <h3>Skills in this posting</h3>
                {entries.length === listing.skills.length ? (
                  <SkillStrip skills={entries} />
                ) : (
                  <div className="jd-skillgrid">
                    {listing.skills.map((sk) => (
                      <Link key={sk.href} className="jd-skill" href={sk.href}>{sk.term}</Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })() : null}

          {listing?.sections?.length ? (
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
          ) : null}

          <Link className="jsheet-full lbl" href={`/jobs/${j.occ}/${j.id}`}>
            Open the full listing &rarr;
          </Link>
        </div>

        <div className="jsheet-foot">
          <SaveButton j={j} label />
          {(listing?.applyUrl ?? j.url) ? (
            <>
              <a className="rt-go jsheet-apply" href={listing?.applyUrl ?? j.url} target="_blank" rel="nofollow noopener noreferrer">
                Apply now <Arrow45 size={22} />
              </a>
              <span className="jsheet-src lbl">Opens the original posting at {j.company}</span>
            </>
          ) : (
            // No outbound link resolved — send them to the full listing rather
            // than render a button that does nothing when tapped.
            <>
              <Link className="rt-go jsheet-apply" href={`/jobs/${j.occ}/${j.id}`}>
                Open the full listing <Arrow45 size={22} />
              </Link>
              <span className="jsheet-src lbl">The apply link lives on the listing page</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
