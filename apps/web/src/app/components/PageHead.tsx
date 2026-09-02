import type { ReactNode } from 'react';

/* The page head, in one order on every template with a head of its own
   (audit pass 3, 2026-09-02): kicker, title, lede, meta line. Before this,
   four anatomies coexisted: meta above the title (guides), kicker above
   (hire, skills), nothing (salary, routes), and a logo beside the title with
   the meta line indented under it (companies). The kicker is words, so it
   takes the sans label; the meta line carries numbers and dates, so it takes
   mono. A mark (company logo) sits on the title's first line and never
   pushes the meta off the column edge. */
export function PageHead({ kicker, title, lede, meta, mark, className }: {
  kicker?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  meta?: ReactNode;
  mark?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`rt-head${className ? ` ${className}` : ''}`}>
      {kicker && <p className="lbl acc">{kicker}</p>}
      {mark
        ? <div className="rt-titlerow"><span className="co-logo" aria-hidden="true">{mark}</span><h1 className="rt-h1">{title}</h1></div>
        : <h1 className="rt-h1">{title}</h1>}
      {lede && <p className="rt-dek">{lede}</p>}
      {meta && <p className="jb-vmeta">{meta}</p>}
    </header>
  );
}
