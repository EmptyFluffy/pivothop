'use client';

// The job-detail skill strip. Chips keep their real /glossary#skill-<id> href —
// cmd-click, middle-click, and no-JS still reach the glossary — but a plain
// left-click opens the definition sheet over the posting instead of navigating
// away from the job. Same sheet markup and CSS as the instrument's, so the two
// surfaces stay identical.

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
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

      {open && (
        <div className="skmodal open" role="dialog" aria-modal="true" aria-label={`${open.term} definition`}>
          <div className="veil" onClick={() => setOpen(null)} />
          <div className="sksheet" tabIndex={-1} ref={(el) => el?.focus()}>
            <button className="xclose sk-close" aria-label="Close" onClick={() => setOpen(null)}>&times;</button>
            <span className="lbl">{open.field || 'Skill bank'}</span>
            <div className="sk-term">
              <span className="sk-mark"><SkillMarkSvg id={open.slug} /></span>
              <span>{open.term}</span>
            </div>
            <p className="sk-def">{open.def}</p>
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
        </div>
      )}
    </>
  );
}
