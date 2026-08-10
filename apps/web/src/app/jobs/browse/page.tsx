import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../../components/SiteChrome';
import { allCategories, type CategoryKind } from '../categories-data';

/* The directory hub: every preloaded search in one place, grouped. The long-tail
   index + the internal-linking spine (so no category page is orphaned) + the
   human browse surface. A static segment, so it wins over /jobs/[occ]. */

export const metadata: Metadata = {
  title: 'Browse the job board: every filter, preloaded | PivotHop',
  description:
    'Every way to browse the board: remote, by field, by country, by seniority, by pay, and the combinations. Each is a live, preloaded page of openings tagged to the skills that reach them.',
  alternates: { canonical: '/jobs/browse' },
};

const GROUPS: { title: string; note: string; kinds: CategoryKind[] }[] = [
  { title: 'Remote & flexible', note: 'Work-from-anywhere roles — whole board, by field, by role, and by country.', kinds: ['remote', 'remote-field', 'remote-occ', 'remote-country', 'remote-field-country', 'remote-occ-country'] },
  { title: 'By field', note: 'Every field, and the same split by seniority.', kinds: ['field', 'level-field'] },
  { title: 'By location', note: 'Where the roles are — whole country, by field, by role, and by seniority.', kinds: ['country', 'field-country', 'occ-country', 'level-field-country', 'level-occ-country'] },
  { title: 'By level', note: 'Senior and entry-level — overall, and by role.', kinds: ['level', 'level-occ'] },
  { title: 'By pay & benefits', note: 'Salary floors by field, role, and country — plus equity and visa sponsorship.', kinds: ['pay', 'pay-field', 'pay-occ', 'pay-country', 'flag', 'flag-field', 'flag-country'] },
];

export default function JobsBrowseHub() {
  const cats = allCategories();
  const byKinds = (ks: CategoryKind[]) => cats.filter((c) => ks.includes(c.kind)).sort((a, b) => b.count - a.count);

  return (
    <PageShell>
      <div className="rtp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb"><Link href="/">Instrument</Link><span>/</span><Link href="/jobs">Jobs</Link><span>/</span><span>Browse</span></nav>
        <h1 className="rt-h1">Browse the board</h1>
        <p className="rt-dek">
          {`${cats.length} preloaded searches across the live board — remote, by field, by country, by seniority, by pay, and the useful combinations. Each is a page of real openings, tagged to the skills that reach them and refreshed with the nightly scrape.`}
        </p>

        {GROUPS.map((g) => {
          const list = byKinds(g.kinds);
          if (!list.length) return null;
          return (
            <section key={g.title} className="rt-sec jb-byocc">
              <h2>{g.title}</h2>
              <p className="rt-note">{g.note}</p>
              <span className="jb-occlinks">
                {list.map((c) => (
                  <Link key={c.slug} href={`/jobs/${c.slug}`}>{c.title} <span className="lbl">{c.count.toLocaleString()}</span></Link>
                ))}
              </span>
            </section>
          );
        })}

        <p className="rt-method lbl">
          A search only becomes a page once it clears a real threshold of open roles, so none of these are empty. Not sure which of them your skills reach? <Link className="gl" href="/">Run the instrument</Link> and it maps the roles your current skills already cover.
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
