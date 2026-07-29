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
import { salaryLabel, postedLabel, agoLabel, sourceName, Arrow45 } from './JobCard';

type Detail = { s: { h: string | null; t: string }[]; k: string[] };

const cache = new Map<string, Record<string, Detail>>();
let skillNames: Record<string, string> | null = null;
async function loadSkillNames(): Promise<Record<string, string>> {
  if (skillNames) return skillNames;
  try {
    const r = await fetch('/data/skills-meta.json');
    skillNames = r.ok ? (await r.json()).names ?? {} : {};
  } catch { skillNames = {}; }
  return skillNames ?? {};
}
const boardCache = new Map<string, Job[]>();
async function loadJobUrl(occ: string, id: string): Promise<string | null> {
  try {
    if (!boardCache.has(occ)) {
      const r = await fetch(`/data/jobs/${occ}.json`);
      boardCache.set(occ, r.ok ? await r.json() : []);
    }
    return boardCache.get(occ)?.find((j) => j.id === id)?.url ?? null;
  } catch {
    return null;
  }
}
async function loadDetail(occ: string, id: string): Promise<Detail | null> {
  try {
    if (!cache.has(occ)) {
      const r = await fetch(`/data/jobs-detail/${occ}.json`);
      cache.set(occ, r.ok ? await r.json() : {});
    }
    return cache.get(occ)?.[id] ?? null;
  } catch {
    return null;
  }
}

export default function JobSheet({ job, onClose }: { job: Job | null; onClose: () => void }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [applyUrl, setApplyUrl] = useState<string | null>(null);
  const [drag, setDrag] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const startY = useRef<number | null>(null);

  const close = useCallback(() => { setDrag(0); onClose(); }, [onClose]);

  useEffect(() => {
    if (!job) { setDetail(null); return; }
    let live = true;
    loadDetail(job.occ, job.id).then((d) => { if (live) setDetail(d); });
    loadSkillNames().then((n) => { if (live) setNames(n); });
    setApplyUrl(job.url ?? null);
    if (!job.url) loadJobUrl(job.occ, job.id).then((u) => { if (live) setApplyUrl(u); });
    return () => { live = false; };
  }, [job]);

  // Scroll lock. iOS ignores overflow:hidden on body, so pin it and restore the
  // exact offset on close, otherwise dismissing throws the board to the top.
  useEffect(() => {
    if (!job) return;
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
  }, [job]);

  // Focus: remember what opened it, move in, trap, restore on close.
  useEffect(() => {
    if (!job) return;
    restoreFocus.current = document.activeElement as HTMLElement | null;
    sheetRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); return; }
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
  }, [job, close]);

  if (!job) return null;

  const pay = salaryLabel(job.smin, job.smax);
  const date = postedLabel(job.posted);

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
    <div className="jsheet-wrap" role="dialog" aria-modal="true" aria-label={`${job.title} at ${job.company}`}>
      <div className="jsheet-veil" onClick={close} />
      <div
        ref={sheetRef}
        tabIndex={-1}
        className="jsheet"
        style={drag ? { transform: `translateY(${drag}px)`, transition: 'none' } : undefined}
      >
        <div className="jsheet-grab" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <span className="jsheet-bar" aria-hidden="true" />
          <button type="button" className="jsheet-x" onClick={close} aria-label="Close">&times;</button>
        </div>

        <div className="jsheet-scroll" ref={scrollRef}>
          <h2 className="jsheet-title">{job.title}</h2>
          <p className="jsheet-co">{job.company}{job.location ? ` · ${job.location}` : ''}</p>

          <div className="jsheet-facts">
            {pay && <div><span className="v">{pay}</span><span className="k">Posted pay</span></div>}
            <div><span className="v">{job.remote ? 'Remote' : 'On-site'}</span><span className="k">Workplace</span></div>
            {date && <div><span className="v" suppressHydrationWarning>{agoLabel(job.posted)}</span><span className="k">Posted</span></div>}
            <div><span className="v">{sourceName(job.source)}</span><span className="k">Source</span></div>
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
                  {sec.t.split('\n').filter(Boolean).map((line, k) =>
                    line.startsWith('· ') ? <li key={k}>{line.slice(2)}</li> : <p key={k}>{line}</p>
                  )}
                </div>
              ))}
            </div>
          ) : null}

          <Link className="jsheet-full lbl" href={`/jobs/${job.occ}/${job.id}`}>
            Open the full listing &rarr;
          </Link>
        </div>

        <div className="jsheet-foot">
          {applyUrl ? (
            <>
              <a className="rt-go jsheet-apply" href={applyUrl} target="_blank" rel="nofollow noopener noreferrer">
                Apply now <Arrow45 size={22} />
              </a>
              <span className="jsheet-src lbl">Opens the original posting at {job.company}</span>
            </>
          ) : (
            // No outbound link resolved — send them to the full listing rather
            // than render a button that does nothing when tapped.
            <>
              <Link className="rt-go jsheet-apply" href={`/jobs/${job.occ}/${job.id}`}>
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
