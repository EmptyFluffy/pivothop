import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../../components/SiteChrome';
import { allCategories } from '../categories-data';
import { FACETS, facetCats, Row } from './shared';

/* The thin hub (tier 1 of the browse spine). A curated head band for humans,
   the top of each facet with a link into its exhaustive sub-hub, ~90 links
   total. The 2,000-page tail lives on the five sub-hubs; nothing is orphaned
   because every category appears on exactly one of them. */

export const metadata: Metadata = {
  title: 'Browse the job board: every filter, preloaded | PivotHop',
  description:
    'Every way to browse the board: remote, by field, by country, by seniority, by pay, and the combinations. Each is a live, preloaded page of openings tagged to the skills that reach them.',
  alternates: { canonical: '/jobs/browse' },
};

const TOP_PER_FACET = 12;

export default function JobsBrowseHub() {
  const cats = allCategories();
  const head = [...cats].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <PageShell v2 active="jobs">
      <div className="rtp bh">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb"><Link href="/">Instrument</Link><span>/</span><Link href="/jobs">Jobs</Link><span>/</span><span>Browse</span></nav>
        <h1 className="rt-h1">Browse the board.</h1>
        <p className="rt-dek">
          {cats.length.toLocaleString()} preloaded searches across the live board. Each is a page of real openings,
          tagged to the skills that reach them and refreshed with the nightly scrape. A search only becomes a page
          once it clears a threshold of open roles, so none of these are empty.
        </p>

        <nav className="bh-jump lbl" aria-label="Sections">
          {FACETS.map((f) => <a key={f.slug} href={`#${f.slug}`}>{f.short}</a>)}
        </nav>

        <section className="rt-sec bh-sec" aria-label="The biggest searches">
          <h2>The head of the board</h2>
          <p className="rt-note">The eight densest searches tonight, by open roles.</p>
          <ul className="bh-band">
            {head.map((c) => (
              <Row key={c.slug} href={`/jobs/${c.slug}`} label={c.title} count={c.count} big />
            ))}
          </ul>
        </section>

        {FACETS.map((f) => {
          const list = facetCats(f).sort((a, b) => b.count - a.count);
          if (!list.length) return null;
          const top = list.slice(0, TOP_PER_FACET);
          return (
            <section key={f.slug} id={f.slug} className="rt-sec bh-sec">
              <h2>{f.title}</h2>
              <p className="rt-note">{f.note} {list.length.toLocaleString()} pages; the largest holds {list[0].count.toLocaleString()} roles.</p>
              <ul className="bh-list">
                {top.map((c) => (
                  <Row key={c.slug} href={`/jobs/${c.slug}`} label={c.title} count={c.count} />
                ))}
              </ul>
              <Link className="bh-all lbl" href={`/jobs/browse/${f.slug}`}>All {list.length.toLocaleString()} {f.title.replace(/^By /, '').toLowerCase()} searches &rarr;</Link>
            </section>
          );
        })}

        <p className="rt-method lbl">
          Not sure which of these your skills reach? <Link className="gl" href="/">Run the instrument</Link> and it maps the roles your current skills already cover.
        </p>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
          { '@type': 'ListItem', position: 2, name: 'Jobs', item: 'https://www.pivothop.com/jobs' },
          { '@type': 'ListItem', position: 3, name: 'Browse', item: 'https://www.pivothop.com/jobs/browse' },
        ],
      }) }} />
    </PageShell>
  );
}
