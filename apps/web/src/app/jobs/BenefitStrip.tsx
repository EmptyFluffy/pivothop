'use client';

// The benefit pills. Same anatomy as the skill strip (mark, term, ink outline,
// click for the definition) with one difference: benefits are capped. A
// generous employer states fifteen of them, and fifteen pills in a 356px
// inspector is a wall, so the pane passes cap={3} and the rest sit behind a
// count. The listing page passes no cap: on its own page, the full list is the
// point.

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { BENEFIT_ICON_PATHS } from './benefit-icons';

export type BenefitEntry = {
  slug: string;
  term: string;
  cat: string;
  glyph?: string;
  def: string;
  n?: number;          // listings on the board stating it, for the glossary
  i?: number;          // taxonomy index — the key rows use in their compact 'b' arrays
};

export function BenefitMarkSvg({ glyph, className }: { glyph?: string; className?: string }) {
  const m = glyph ? BENEFIT_ICON_PATHS[glyph] : null;
  if (!m) return null;
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
         strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d={m.d} /></svg>
  );
}

export default function BenefitStrip({ benefits, cap }: { benefits: BenefitEntry[]; cap?: number }) {
  const [open, setOpen] = useState<BenefitEntry | null>(null);
  const [closing, setClosing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const close = () => { setClosing(true); setTimeout(() => { setOpen(null); setClosing(false); }, 190); };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!benefits.length) return null;
  const limit = cap && !expanded ? cap : benefits.length;
  const shown = benefits.slice(0, limit);
  const more = benefits.length - limit;

  return (
    <>
      <div className="jd-skillgrid jd-benefitgrid">
        {shown.map((b) => (
          <button
            key={b.slug} type="button" className="jd-skill jd-benefit" data-benefit={b.slug}
            onClick={() => setOpen(b)} title={b.def}
          >
            <BenefitMarkSvg glyph={b.glyph} />
            {b.term}
          </button>
        ))}
      </div>
      {cap && (more > 0 || expanded) && (
        <button type="button" className="jv-skmore" onClick={() => setExpanded((v) => !v)}>
          {expanded
            ? 'Show fewer benefits'
            : `See ${more} more benefit${more === 1 ? '' : 's'} for this posting`}
        </button>
      )}

      {open && createPortal(
        <div className={`skmodal v2t open${closing ? ' closing' : ''}`} role="dialog" aria-modal="true" aria-label={`${open.term} definition`}>
          <div className="veil" onClick={close} />
          <div className="sksheet" tabIndex={-1} ref={(el) => el?.focus()}>
            <button className="xclose sk-close" aria-label="Close" onClick={close}>&times;</button>
            <span className="lbl">{open.cat}</span>
            <div className="sk-term">
              <span className="sk-mark"><BenefitMarkSvg glyph={open.glyph} /></span>
              <span>{open.term}</span>
            </div>
            <p className="sk-def">{open.def}</p>
            {!!open.n && (
              <div className="sk-spec" aria-label="Measured from the board">
                <div className="spec-row"><span className="spec-k">Stated in</span><span className="spec-lead" /><span className="spec-v">{open.n.toLocaleString()} postings</span></div>
              </div>
            )}
            <Link className="lbl sk-gloss" href={`/glossary#benefit-${open.slug}`}>Show in glossary &rarr;</Link>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
