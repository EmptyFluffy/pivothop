import type { Metadata } from 'next';
import { PageShell } from '../components/SiteChrome';
import { Crumbs } from '../components/Crumbs';
import { PageHead } from '../components/PageHead';
import { IndexSearch, type IxRow, type IxGroup } from '../components/IndexSearch';
import { companiesRanked } from './companies-data';
import { companyInitial, monoTint } from '../jobs/JobCard';
import { countryName } from '../jobs/countries';

export const metadata: Metadata = {
  title: 'Companies hiring now: who is hiring, for what, and what they pay',
  description: 'Every company with live openings on the board, ranked by open roles and grouped by field. Each profile is built from the company’s own postings: roles, countries, posted pay, stated benefits. Search by name.',
  alternates: { canonical: '/companies' },
};

/* One list for every company (2026-09-02). The first version showed cards
   for the 20-plus-role names and dropped everyone else into an inline A to Z:
   two treatments for one kind of thing. Now it is the same ranked index the
   salary and route hubs use, with a mark on every row, grouped by the field
   the company mostly hires in, searchable by name. */
export default function CompaniesHub() {
  const cos = companiesRanked();
  const total = cos.reduce((s, c) => s + c.count, 0);
  const groupTotals = new Map<string, number>();
  const rows: IxRow[] = cos.map((c) => {
    const field = c.fields[0]?.[0] ?? 'Other';
    groupTotals.set(field, (groupTotals.get(field) ?? 0) + c.count);
    const where = c.countries.slice(0, 2).map(([cc]) => countryName(cc)).join(' · ');
    const [bg, fg] = monoTint(c.name);
    return {
      slug: c.slug,
      href: `/companies/${c.slug}`,
      t: c.name,
      m: c.count.toLocaleString(),
      s: [where, c.remoteN > 0 ? `${c.remoteN} remote` : ''].filter(Boolean).join(' · '),
      hay: `${c.name} ${field} ${c.countries.map(([cc]) => countryName(cc)).join(' ')}`.toLowerCase(),
      group: field,
      logo: c.logo,
      initial: companyInitial(c.name),
      tint: [bg, fg],
    };
  });
  const groups: IxGroup[] = [...groupTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => ({ key, label: key, unit: 'companies' }));

  return (
    <PageShell v2 active="companies">
      <div className="rtp">
        <Crumbs trail={[{ label: 'Companies' }]} />
        <PageHead
          kicker="The employers"
          title="Who is hiring right now"
          lede={`${cos.length.toLocaleString()} companies with live openings on this board, ranked by how many roles each has open today and grouped by the field it mostly hires in. Every profile is built from the company’s own postings: what it hires for, where, what it pays and the benefits it states. Nothing is self-reported.`}
          meta={<><span className="lbl">{total.toLocaleString()}</span> live roles &middot;{' '}
            <span className="lbl">{cos.length.toLocaleString()}</span> companies &middot; refreshed nightly</>}
        />
        <IndexSearch rows={rows} groups={groups} placeholder="Search a company" unit="companies" />
        <p className="rt-method lbl">
          A company appears while it holds three or more live roles on the board and re-ranks with the nightly
          scrape. PivotHop is not affiliated with any company listed; a company can claim its profile from its
          own page.
        </p>
      </div>
    </PageShell>
  );
}
