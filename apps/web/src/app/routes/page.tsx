import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../components/SiteChrome';
import { ROUTES, ROUTE_SLUGS, ORIGIN, destRole } from './routes-data';

export const metadata: Metadata = {
  title: 'Career routes out of architecture, measured — PivotHop',
  description: `Every first-hop route from architecture our instrument currently ranks, measured from ${ORIGIN.postings.toLocaleString()} live postings: skill readiness, salary band, the gap, and observed worker transitions.`,
  alternates: { canonical: '/routes' },
};

export default function RoutesIndex() {
  return (
    <PageShell>
      <div className="rtp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb"><Link href="/">Instrument</Link><span>/</span><span>Routes</span></nav>
        <h1 className="rt-h1">Routes out of architecture, measured.</h1>
        <p className="rt-dek">
          The first ring of the graph as pages: each route preloaded on the working instrument, with the readiness number,
          the posted salary band, the exact gap, and the judgment call. In a typical year {ORIGIN.separations?.transfer ?? '—'}%
          of architects move to a different occupation. These are the places they can reach.
        </p>
        <ul className="rt-index">
          {ROUTE_SLUGS.map((slug) => {
            const r = destRole(ROUTES[slug].dest);
            return r ? (
              <li key={slug}>
                <Link href={`/routes/${slug}`}>
                  <span className="t">Architect &rarr; {r.title}</span>
                  <span className="m">{r.match}%</span>
                  <span className="s lbl">{r.salary} &middot; {r.demand} demand{(r.mobility_source ?? '').startsWith('observed') ? ' · observed flow' : ''}</span>
                </Link>
              </li>
            ) : null;
          })}
        </ul>
        <p className="rt-method lbl">Batch one covers the first-hop ring. More routes ship as their search demand and data confidence are verified (docs-driven, never combinatorial).</p>
      </div>
    </PageShell>
  );
}
