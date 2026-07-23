import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../components/SiteChrome';
import { jobsIndex, jobOccupations, occTitle, occField } from './jobs-data';

export const metadata: Metadata = {
  title: 'The adjacent-talent job board — PivotHop',
  description:
    'Live job openings tagged by occupation and the skills that reach them, across technology, healthcare, business, design, and more. Browse open roles, or run the instrument to find the jobs your current skills can already pivot into.',
  alternates: { canonical: '/jobs' },
};

export default function JobsHub() {
  const idx = jobsIndex();
  const byField = new Map<string, string[]>();
  for (const occ of jobOccupations()) {
    const f = occField(occ);
    (byField.get(f) ?? byField.set(f, []).get(f)!).push(occ);
  }
  const fields = [...byField.entries()].sort((a, b) => b[1].length - a[1].length);
  const total = Object.values(idx).reduce((a, b) => a + b, 0);

  return (
    <PageShell>
      <div className="rtp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb"><Link href="/">Instrument</Link><span>/</span><span>Jobs</span></nav>
        <h1 className="rt-h1">The job board, by skill.</h1>
        <p className="rt-dek">
          {`${total.toLocaleString()} live openings across ${jobOccupations().length} occupations, each tagged to the skills that reach it. Browse a field below, or run the `}
          <Link className="gl" href="/">instrument</Link>
          {` to see the jobs your current skills can already pivot into. Every role links out to apply at the source.`}
        </p>
        {fields.map(([field, occs]) => {
          const rows = occs.slice().sort((a, b) => idx[b] - idx[a]);
          const fieldTotal = rows.reduce((s, o) => s + idx[o], 0);
          return (
            <section key={field} className="rt-cluster">
              <h2 className="rt-cluster-h">{field} <span className="lbl">{fieldTotal} jobs</span></h2>
              <ul className="rt-index">
                {rows.map((occ) => (
                  <li key={occ}>
                    <Link href={`/jobs/${occ}`}>
                      <span className="t">{occTitle(occ)}</span>
                      <span className="m">{idx[occ]}</span>
                      <span className="s lbl">open roles</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        <p className="rt-method lbl">
          Listings are backfilled from company career pages, remote-job boards, and public-sector sources, refreshed with the nightly scrape, and link out to apply at the origin. Hiring for adjacent-friendly roles? <Link className="gl" href="/employers">Feature a role</Link>.
        </p>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
          { '@type': 'ListItem', position: 2, name: 'Jobs', item: 'https://www.pivothop.com/jobs' },
        ],
      }) }} />
    </PageShell>
  );
}
