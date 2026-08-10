import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../components/SiteChrome';
import { comparePairs } from './compare-data';
import { occTitle, occField } from '../jobs/jobs-data';

export const metadata: Metadata = {
  title: 'Careers compared: salary, skills, and overlap, measured | PivotHop',
  description:
    'Side-by-side career comparisons measured from live job postings: posted salary bands, skill readiness in both directions, the shared skills, and which switch is easier. Data analyst vs data scientist, UX vs graphic design, and hundreds more.',
  alternates: { canonical: '/compare' },
};

export default function CompareHub() {
  const pairs = comparePairs();
  // Group by the field of the pair's first occupation; cross-field pairs land
  // under the field of whichever side leads the slug — good enough for browsing.
  const byField = new Map<string, typeof pairs>();
  for (const p of pairs) {
    const f = occField(p.a);
    if (!byField.has(f)) byField.set(f, []);
    byField.get(f)!.push(p);
  }
  const groups = [...byField.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <PageShell>
      <div className="rtp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb"><Link href="/">Instrument</Link><span>/</span><span>Compare</span></nav>
        <h1 className="rt-h1">Careers, compared.</h1>
        <p className="rt-dek">
          {`${pairs.length} side-by-side comparisons, each measured from both occupations' own live postings: the posted salary bands, skill readiness in both directions, the shared core, and which way the switch is easier. No quiz logic — the same numbers the instrument runs on.`}
        </p>

        {groups.map(([field, list]) => (
          <section key={field} className="rt-sec jb-byocc">
            <h2>{field}</h2>
            <span className="jb-occlinks">
              {list.map((p) => (
                <Link key={p.slug} href={`/compare/${p.slug}`}>
                  {occTitle(p.a)} vs {occTitle(p.b)} <span className="lbl">{Math.max(p.ab?.match ?? 0, p.ba?.match ?? 0)}%</span>
                </Link>
              ))}
            </span>
          </section>
        ))}

        <p className="rt-method lbl">
          A pair earns a page only when the skill overlap is measured in at least one direction from live postings. Bands are posted 25th&ndash;75th percentiles; readiness is coverage of the destination&rsquo;s posting-skill demand. Refreshed with the nightly scrape. Not sure where you stand? <Link className="gl" href="/">Run the instrument</Link>.
        </p>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
          { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://www.pivothop.com/compare' },
        ],
      }) }} />
    </PageShell>
  );
}
