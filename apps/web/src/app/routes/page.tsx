import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../components/SiteChrome';
import { routableSlugs, routePair, occField, originMeta, destRole } from './routes-data';

export const metadata: Metadata = {
  title: 'Career pivots, measured from live job postings — PivotHop',
  description:
    'Career pivots our instrument ranks with confident data, across technology, healthcare, business, finance, design, engineering, trades, and more. Skill readiness, salary band, the exact gap, and observed worker transitions, each preloaded on the working graph.',
  alternates: { canonical: '/routes' },
};

export default function RoutesIndex() {
  // Every routable pivot, grouped by the origin's field, fields ordered by breadth.
  const byField = new Map<string, string[]>();
  for (const slug of routableSlugs()) {
    const pair = routePair(slug);
    if (!pair) continue;
    const f = occField(pair.origin);
    (byField.get(f) ?? byField.set(f, []).get(f)!).push(slug);
  }
  const fields = [...byField.entries()].sort((a, b) => b[1].length - a[1].length);
  const total = routableSlugs().length;

  return (
    <PageShell>
      <div className="rtp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb"><Link href="/">Instrument</Link><span>/</span><span>Routes</span></nav>
        <h1 className="rt-h1">Career pivots, measured.</h1>
        <p className="rt-dek">
          {`${total} routes across every field our data covers, each a saved state of the working instrument: the readiness number, the posted salary band, the exact skill gap, and the observed-transition data behind it. Not advice in the abstract, the specific places a specific starting point can reach.`}
        </p>
        {fields.map(([field, slugs]) => {
          const rows = slugs
            .map((slug) => { const p = routePair(slug)!; return { slug, r: destRole(p.origin, p.dest), om: originMeta(p.origin) }; })
            .filter((x) => x.r)
            .sort((a, b) => (b.r!.match) - (a.r!.match));
          return (
            <section key={field} className="rt-cluster">
              <h2 className="rt-cluster-h">{field} <span className="lbl">{rows.length} routes</span></h2>
              <ul className="rt-index">
                {rows.map(({ slug, r, om }) => (
                  <li key={slug}>
                    <Link href={`/routes/${slug}`}>
                      <span className="t">{om.title} &rarr; {r!.title}</span>
                      <span className="m">{r!.match}%</span>
                      <span className="s lbl">{r!.salary} &middot; {`${r!.demand} demand`}{(r!.mobility_source ?? '').startsWith('observed') ? ' · observed flow' : ''}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        <p className="rt-method lbl">Every route has confident scrape data behind both its origin and destination. Curated routes carry a hand-written judgment layer; the rest draft a read from the numbers, refined over time.</p>
      </div>
    </PageShell>
  );
}
