import { Fragment, type ReactNode } from 'react';
import Link from 'next/link';

export type Crumb = { label: ReactNode; href?: string };

/* The breadcrumb, drawn one way on every page below the landing (audit pass
   3, 2026-09-02). Root is "PivotHop" to /: seven families used to root at
   "Instrument", a page that left the navigation, while three rooted at the
   site. The current page comes last and unlinked. Markup matches what the
   hand-built trails emitted (link, slash, link, slash, span) so the .rt-crumbs
   CSS and the BreadcrumbList schema each template already carries are
   untouched. */
export function Crumbs({ trail }: { trail: Crumb[] }) {
  return (
    <nav className="rt-crumbs lbl" aria-label="Breadcrumb">
      <Link href="/">PivotHop</Link>
      {trail.map((c, i) => (
        <Fragment key={i}>
          <span>/</span>
          {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
        </Fragment>
      ))}
    </nav>
  );
}
