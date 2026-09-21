import type { Metadata } from 'next';
import { PageShell } from '../components/SiteChrome';
import { Crumbs } from '../components/Crumbs';
import { PageHead } from '../components/PageHead';
import { IndexSearch, type IxRow, type IxGroup } from '../components/IndexSearch';
import { companiesRanked, countryCompanyPages, equityCompanies } from './companies-data';
import Link from 'next/link';
import { companyInitial, monoTint } from '../jobs/JobCard';
import { countryName } from '../jobs/countries';

/* The count is the live one; the copy stays short on purpose (house rule
   2026-09-21: say the thing, not the method). */
export function generateMetadata(): Metadata {
  const n = companiesRanked().length;
  return {
    title: 'Companies hiring now',
    description: `${n.toLocaleString()} companies with open roles. See what each one is hiring for, where, and what it pays.`,
    alternates: { canonical: '/companies' },
  };
}

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
          lede={`${cos.length.toLocaleString()} companies with open roles. What each one is hiring for, where, and what it pays.`}
          meta={<><span className="lbl">{total.toLocaleString()}</span> open roles &middot;{' '}
            <span className="lbl">{cos.length.toLocaleString()}</span> companies</>}
        />
        <IndexSearch rows={rows} groups={groups} placeholder="Search a company" unit="companies" />

        <section className="rt-sec jb-byocc">
          <h2>By country</h2>
          <span className="jb-occlinks">
            <Link href="/companies/with-equity">Hiring with equity <span className="lbl">{equityCompanies().length}</span></Link>
            {countryCompanyPages().map((k) => (
              <Link key={k.slug} href={`/companies/${k.slug}`}>Hiring in {k.inName} <span className="lbl">{k.companies.length}</span></Link>
            ))}
          </span>
        </section>
        <p className="rt-method lbl">
          Profiles are built from each company&rsquo;s own postings and refreshed nightly. PivotHop is not affiliated with the companies listed.
        </p>
      </div>
    </PageShell>
  );
}
