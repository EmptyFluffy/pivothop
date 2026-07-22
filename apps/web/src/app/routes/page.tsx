import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../components/SiteChrome';
import { ROUTES, ROUTE_SLUGS, originMeta, destRole } from './routes-data';

export const metadata: Metadata = {
  title: 'Career pivots, measured from live job postings — PivotHop',
  description: 'Every career pivot our instrument ranks with confident data, each preloaded on the working graph: skill readiness, salary band, the exact gap, and observed worker transitions. Tech, healthcare, finance, design, and more.',
  alternates: { canonical: '/routes' },
};

export default function RoutesIndex() {
  // Group routes by origin, origins ordered by their first appearance.
  const byOrigin = new Map<string, string[]>();
  for (const slug of ROUTE_SLUGS) {
    const o = ROUTES[slug].origin;
    if (!byOrigin.has(o)) byOrigin.set(o, []);
    byOrigin.get(o)!.push(slug);
  }

  return (
    <PageShell>
      <div className="rtp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb"><Link href="/">Instrument</Link><span>/</span><span>Routes</span></nav>
        <h1 className="rt-h1">Career pivots, measured.</h1>
        <p className="rt-dek">
          Each route is a saved state of the working instrument, with the readiness number, the posted salary band,
          the exact skill gap, and the observed-transition data behind it. Not advice in the abstract, the specific
          places a specific starting point can reach. Pick your origin.
        </p>
        {[...byOrigin.entries()].map(([oSlug, slugs]) => {
          const om = originMeta(oSlug);
          return (
            <section key={oSlug} className="rt-cluster">
              <h2 className="rt-cluster-h">From {om.title}</h2>
              <ul className="rt-index">
                {slugs.map((slug) => {
                  const r = destRole(ROUTES[slug].origin, ROUTES[slug].dest);
                  return r ? (
                    <li key={slug}>
                      <Link href={`/routes/${slug}`}>
                        <span className="t">{om.title} &rarr; {r.title}</span>
                        <span className="m">{r.match}%</span>
                        <span className="s lbl">{r.salary} &middot; {`${r.demand} demand`}{(r.mobility_source ?? '').startsWith('observed') ? ' · observed flow' : ''}</span>
                      </Link>
                    </li>
                  ) : null;
                })}
              </ul>
            </section>
          );
        })}
        <p className="rt-method lbl">Every route above has confident scrape data behind both its origin and destination. More ship as their search demand and data confidence are verified (docs-driven, never combinatorial).</p>
      </div>
    </PageShell>
  );
}
