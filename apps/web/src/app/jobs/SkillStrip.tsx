'use client';

// The job-detail skill strip. The definition sheet PORTALS to <body>: the
// full-posting sheet (.jsheet) keeps a translateY transform after opening,
// which makes it the containing block for any fixed descendant — the modal
// was centering inside the pane instead of the viewport. The portal root
// carries .v2t so the sheet keeps the theme tokens outside the wrapper.
//
// The job-detail skill strip. Chips keep their real /glossary#skill-<id> href —
// cmd-click, middle-click, and no-JS still reach the glossary — but a plain
// left-click opens the definition sheet over the posting instead of navigating
// away from the job. Same sheet markup and CSS as the instrument's, so the two
// surfaces stay identical.

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { SkillMarkSvg } from './SkillMark';

export type SkillEntry = {
  slug: string;
  term: string;
  field: string;
  def: string;
  unlocks: { slug: string; title: string; count: number }[];
};

export default function SkillStrip({ skills }: { skills: SkillEntry[] }) {
  const [open, setOpen] = useState<SkillEntry | null>(null);
  const [closing, setClosing] = useState(false);
  // Exit plays before unmount: .closing runs the out animation, then we clear.
  const close = () => { setClosing(true); setTimeout(() => { setOpen(null); setClosing(false); }, 190); };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <div className="jd-skillgrid">
        {skills.map((s) => (
          <Link
            key={s.slug} className="jd-skill" href={`/glossary#skill-${s.slug}`}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              // Phones keep the plain glossary link. A job listing is itself a
              // sheet on mobile, and a sheet opening inside a sheet is a trap:
              // two stacked dismiss gestures, ambiguous back behaviour.
              if (window.matchMedia('(max-width: 760px)').matches) return;
              e.preventDefault();
              setOpen(s);
            }}
          >
            <SkillMarkSvg id={s.slug} />
            {s.term}
          </Link>
        ))}
      </div>

      {open && createPortal(
        <div className={`skmodal v2t open${closing ? ' closing' : ''}`} role="dialog" aria-modal="true" aria-label={`${open.term} definition`}>
          <div className="veil" onClick={close} />
          <div className="sksheet" tabIndex={-1} ref={(el) => el?.focus()}>
            <button className="xclose sk-close" aria-label="Close" onClick={close}>&times;</button>
            <span className="lbl">{open.field || 'Skill bank'}</span>
            <div className="sk-term">
              <span className="sk-mark"><SkillMarkSvg id={open.slug} /></span>
              <span>{open.term}</span>
            </div>
            <p className="sk-def">{open.def}</p>
            {open.unlocks.length > 0 && (
              <div className="sk-spec" aria-label="Measured from the board">
                <div className="spec-row"><span className="spec-k">Unlocks</span><span className="spec-lead" /><span className="spec-v">{open.unlocks.length} occupation{open.unlocks.length === 1 ? '' : 's'}</span></div>
                <div className="spec-row"><span className="spec-k">Open roles</span><span className="spec-lead" /><span className="spec-v">{open.unlocks.reduce((s, u) => s + u.count, 0).toLocaleString()}</span></div>
              </div>
            )}
            {open.unlocks.length > 0 && (
              <div className="gloss-unlocks">
                <span className="lbl">Open roles it unlocks</span>
                <span className="gu-list">
                  {open.unlocks.map((u) => (
                    <Link key={u.slug} href={`/jobs/${u.slug}`} className="gu-link">
                      {u.title}<span className="gu-n">{u.count}</span>
                    </Link>
                  ))}
                </span>
              </div>
            )}
            <Link className="lbl sk-gloss" href={`/glossary#skill-${open.slug}`}>Show in glossary &rarr;</Link>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
