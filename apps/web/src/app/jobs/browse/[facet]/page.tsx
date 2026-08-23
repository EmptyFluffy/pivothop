import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '../../../components/SiteChrome';
import type { Category } from '../../categories-data';
import { FACETS, facetCats, Row, Cell, shortLabel, countryOf } from '../shared';

/* Tier 2 of the browse spine: one exhaustive page per facet, every category
   of its kinds server-rendered, combinations nested under their parent so a
   country's cell reads Business / Senior Technology / Architect instead of
   three hundred repetitions of "jobs in the United States". */

export function generateStaticParams() {
  return FACETS.map((f) => ({ facet: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ facet: string }> }): Promise<Metadata> {
  const { facet } = await params;
  const f = FACETS.find((x) => x.slug === facet);
  if (!f) return {};
  return {
    title: `${f.title} — every preloaded search | PivotHop`,
    description: `${f.note} Live counts, refreshed nightly.`,
    alternates: { canonical: `/jobs/browse/${facet}` },
  };
}

/* Cells for a facet: single-dimension pages first, then combinations grouped
   under their natural parent. */
function cellsFor(slug: string, list: Category[]): { title: string; rows: { c: Category; label: string }[] }[] {
  const byCountry = new Map<string, { c: Category; label: string }[]>();
  const cells: { title: string; rows: { c: Category; label: string }[] }[] = [];
  const push = (title: string, rows: { c: Category; label: string }[]) => {
    if (rows.length) cells.push({ title, rows: rows.sort((a, b) => b.c.count - a.c.count) });
  };
  const of = (kinds: string[], label: (c: Category) => string) =>
    list.filter((c) => kinds.includes(c.kind)).map((c) => ({ c, label: label(c) }));

  if (slug === 'remote') {
    push('The whole board', of(['remote'], (c) => c.title));
    push('By field', of(['remote-field'], (c) => shortLabel(c, { dropRemote: true })));
    push('By role', of(['remote-occ'], (c) => shortLabel(c, { dropRemote: true })));
    push('By region', of(['remote-region'], (c) => shortLabel(c, { dropRemote: true, dropJobs: false })));
    for (const c of list.filter((x) => ['remote-country', 'remote-field-country', 'remote-occ-country'].includes(x.kind))) {
      const cty = countryOf(c) ?? 'Elsewhere';
      if (!byCountry.has(cty)) byCountry.set(cty, []);
      byCountry.get(cty)!.push({ c, label: shortLabel(c, { dropCountry: true, dropRemote: true }) || 'All remote roles' });
    }
  } else if (slug === 'fields') {
    push('Every field', of(['field'], (c) => shortLabel(c)));
    push('Senior & entry, by field', of(['level-field'], (c) => shortLabel(c)));
    push('Pay floors, by field', of(['pay-field'], (c) => shortLabel(c)));
    push('Equity & visa, by field', of(['flag-field'], (c) => shortLabel(c)));
    push('Fields, by region', of(['field-region'], (c) => shortLabel(c)));
  } else if (slug === 'countries') {
    push('Whole countries', of(['country'], (c) => c.title.replace(/^Jobs in (the )?/, '')));
    // regions group exactly like countries: Europe's cell holds Europe's pages
    for (const c of list.filter((x) => ['region', 'occ-region', 'field-country', 'occ-country'].includes(x.kind))) {
      const cty = countryOf(c) ?? 'Elsewhere';
      if (!byCountry.has(cty)) byCountry.set(cty, []);
      byCountry.get(cty)!.push({ c, label: shortLabel(c, { dropCountry: true }) || 'All roles' });
    }
  } else if (slug === 'seniority') {
    push('The two levels', of(['level'], (c) => shortLabel(c)));
    push('Senior, by role', of(['level-occ'], (c) => shortLabel(c)).filter((r) => r.c.title.startsWith('Senior')));
    push('Entry-level, by role', of(['level-occ'], (c) => shortLabel(c)).filter((r) => !r.c.title.startsWith('Senior')));
    for (const c of list.filter((x) => ['level-field-country', 'level-occ-country'].includes(x.kind))) {
      const cty = countryOf(c) ?? 'Elsewhere';
      if (!byCountry.has(cty)) byCountry.set(cty, []);
      byCountry.get(cty)!.push({ c, label: shortLabel(c, { dropCountry: true }) });
    }
  } else if (slug === 'pay') {
    push('Pay floors', of(['pay'], (c) => shortLabel(c)));
    push('Pay floors, by role', of(['pay-occ'], (c) => shortLabel(c)));
    push('Pay floors, by country', of(['pay-country'], (c) => shortLabel(c)));
    push('Equity & visa sponsorship', of(['flag', 'flag-country'], (c) => shortLabel(c)));
  }

  const countryCells = [...byCountry.entries()]
    .sort((a, b) => b[1].reduce((s, r) => s + r.c.count, 0) - a[1].reduce((s, r) => s + r.c.count, 0))
    .map(([cty, rows]) => ({ title: cty, rows: rows.sort((a, b) => b.c.count - a.c.count) }));
  return [...cells, ...countryCells];
}

export default async function BrowseFacet({ params }: { params: Promise<{ facet: string }> }) {
  const { facet } = await params;
  const f = FACETS.find((x) => x.slug === facet);
  if (!f) notFound();
  const list = facetCats(f).sort((a, b) => b.count - a.count);
  const cells = cellsFor(f.slug, list);

  return (
    <PageShell v2 active="jobs">
      <div className="rtp bh">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb">
          <Link href="/">Instrument</Link><span>/</span><Link href="/jobs">Jobs</Link><span>/</span>
          <Link href="/jobs/browse">Browse</Link><span>/</span><span>{f.title.replace(/^By /, '')}</span>
        </nav>
        <h1 className="rt-h1">{f.h1}</h1>
        <p className="rt-dek">
          {f.note} {list.length.toLocaleString()} live pages; the largest holds {list[0]?.count.toLocaleString()} open roles.
          Counts move with the nightly scrape.
        </p>

        <div className="bh-grid">
          {cells.map((cell) => (
            <Cell key={cell.title} title={cell.title}>
              {cell.rows.map(({ c, label }) => (
                <Row key={c.slug} href={`/jobs/${c.slug}`} label={label} title={c.title} count={c.count} />
              ))}
            </Cell>
          ))}
        </div>

        <p className="rt-method lbl">
          Back to <Link className="gl" href="/jobs/browse">the browse hub</Link>, or straight to <Link className="gl" href="/jobs">the live board</Link>.
        </p>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
          { '@type': 'ListItem', position: 2, name: 'Jobs', item: 'https://www.pivothop.com/jobs' },
          { '@type': 'ListItem', position: 3, name: 'Browse', item: 'https://www.pivothop.com/jobs/browse' },
          { '@type': 'ListItem', position: 4, name: f.title, item: `https://www.pivothop.com/jobs/browse/${f.slug}` },
        ],
      }) }} />
    </PageShell>
  );
}
