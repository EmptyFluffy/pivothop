import Link from 'next/link';
import { PageShell } from '../components/SiteChrome';
import { Crumbs } from '../components/Crumbs';
import { PageHead } from '../components/PageHead';
import { IndexSearch, type IxRow, type IxGroup } from '../components/IndexSearch';
import { companyInitial, monoTint } from '../jobs/JobCard';
import JobsList from '../jobs/JobsList';
import { getCategory } from '../jobs/categories-data';
import type { CountryCompanies } from './companies-data';

/* "Companies hiring in Switzerland" (2026-09-11). The same ranked index the
   companies hub uses, scoped to one country and carrying that country's own
   counts, then the freshest roles there, the employer ask, and answers in
   the house register. Every figure is the nightly board. */

const slugify = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function CountryCompaniesPage({ c }: { c: CountryCompanies }) {
  const groupTotals = new Map<string, number>();
  const rows: IxRow[] = c.companies.map((r) => {
    const field = r.field ?? 'Other';
    groupTotals.set(field, (groupTotals.get(field) ?? 0) + r.n);
    const [bg, fg] = monoTint(r.name);
    return {
      slug: r.slug,
      href: `/companies/${r.slug}`,
      t: r.name,
      m: r.n.toLocaleString(),
      s: [r.remoteN > 0 ? `${r.remoteN} remote` : '', r.total > r.n ? `${r.total.toLocaleString()} roles worldwide` : ''].filter(Boolean).join(' · '),
      hay: `${r.name} ${field}`.toLowerCase(),
      group: field,
      logo: r.logo,
      initial: companyInitial(r.name),
      tint: [bg, fg],
    };
  });
  const groups: IxGroup[] = [...groupTotals.entries()].sort((a, b) => b[1] - a[1]).map(([key]) => ({ key, label: key, unit: 'companies' }));
  const jobsPage = getCategory(`in-${slugify(c.name)}`);
  const top = c.companies.slice(0, 3);
  const remoteCos = c.companies.filter((r) => r.remoteN > 0);
  const remoteRoles = c.companies.reduce((s, r) => s + r.remoteN, 0);
  const fieldsText = c.fields.slice(0, 3).map(([f, n]) => `${f.toLowerCase()} (${n})`).join(', ');

  const faq: { q: string; text: string; jsx: React.ReactNode }[] = [
    {
      q: `Which companies are hiring the most in ${c.inName}?`,
      text: `Right now the biggest hirers in ${c.inName} on our board are ${top.map((r) => `${r.name} with ${r.n} open roles`).join(', ')}. That is counted from the postings that name ${c.name} as the location, so a global company shows only what it is hiring here.`,
      jsx: <>Right now the biggest hirers in {c.inName} on our board are {top.map((r, i) => <span key={r.slug}>{i > 0 ? ', ' : ''}<Link className="gl" href={`/companies/${r.slug}`}>{r.name}</Link> with {r.n} open roles</span>)}. That is counted from the postings that name {c.name} as the location, so a global company shows only what it is hiring here.</>,
    },
    {
      q: `How many companies are hiring in ${c.inName} right now?`,
      text: `${c.companies.length} companies with ${c.floor} or more open roles in ${c.inName}, ${c.jobs.toLocaleString()} roles between them, out of ${c.allJobs.toLocaleString()} live roles in the country on our board. The list refreshes every night and a company drops off when it falls under that many roles here.`,
      jsx: <>{c.companies.length} companies with {c.floor} or more open roles in {c.inName}, {c.jobs.toLocaleString()} roles between them, out of {jobsPage ? <Link className="gl" href={`/jobs/${jobsPage.slug}`}>{c.allJobs.toLocaleString()} live roles in the country</Link> : `${c.allJobs.toLocaleString()} live roles in the country`} on our board. The list refreshes every night and a company drops off when it falls under that many roles here.</>,
    },
    {
      q: `What are they hiring for in ${c.inName}?`,
      text: `Mostly ${fieldsText}. The grouping above follows the field each company hires in most here, and every profile lists its roles by occupation.`,
      jsx: <>Mostly {fieldsText}. The grouping above follows the field each company hires in most here, and every profile lists its roles by occupation.</>,
    },
    remoteRoles > 0 ? {
      q: `Do these companies hire remote in ${c.inName}?`,
      text: `Some do. ${remoteCos.length} of the ${c.companies.length} companies have at least one fully remote role posted in ${c.inName}, ${remoteRoles} remote roles in all. The rest name a city or say on-site, and each company page shows which.`,
      jsx: <>Some do. {remoteCos.length} of the {c.companies.length} companies have at least one fully remote role posted in {c.inName}, {remoteRoles} remote roles in all. The rest name a city or say on-site, and each company page shows which.</>,
    } : {
      q: `Do these companies hire remote in ${c.inName}?`,
      text: `Not at the moment. None of the roles these companies have posted in ${c.inName} are marked fully remote; they name a city or say on-site. That can change with the nightly refresh.`,
      jsx: <>Not at the moment. None of the roles these companies have posted in {c.inName} are marked fully remote; they name a city or say on-site. That can change with the nightly refresh.</>,
    },
  ];

  return (
    <PageShell v2 active="companies">
      <div className="rtp">
        <Crumbs trail={[{ label: 'Companies', href: '/companies' }, { label: `Hiring in ${c.name}` }]} />
        <PageHead
          kicker="The employers, by country"
          title={<>Companies hiring in {c.inName}</>}
          lede={`${c.companies.length} companies with ${c.floor} or more open roles in ${c.inName} right now, ranked by how many they have open here and grouped by the field each one hires in most. Every profile is built from the company's own postings. Nothing is self-reported.`}
          meta={<><span className="lbl">{c.jobs.toLocaleString()}</span> live roles at these companies &middot;{' '}
            <span className="lbl">{c.companies.length}</span> companies &middot; refreshed nightly</>}
        />
        <IndexSearch rows={rows} groups={groups} placeholder={`Search a company hiring in ${c.name}`} unit="companies" />

        <JobsList
          jobs={c.latest}
          limit={6}
          total={c.allJobs}
          heading={`Newest roles in ${c.inName}`}
          note={`The freshest postings from these companies in ${c.inName}. Apply at the source.`}
          allHref={jobsPage ? `/jobs/${jobsPage.slug}` : `/jobs?c=${c.cc}`}
          allLabel={`All ${c.allJobs.toLocaleString()} roles in ${c.inName}`}
        />

        <section className="rt-cta">
          <div>
            <h2>Hiring in {c.inName}?</h2>
            <p>Your company may already be on this list. Claim its profile, or post a role directly, and it is shown first to the candidates whose skills already reach it.</p>
          </div>
          <Link className="rt-go" href={`/employers?src=companies-${c.cc.toLowerCase()}`}>Feature a role &rarr;</Link>
        </section>

        <div className="post-faq rt-faq">
          <h2>Quick answers</h2>
          {faq.map((f) => (
            <details key={f.q} name="pagefaq"><summary>{f.q}</summary><p>{f.jsx}</p></details>
          ))}
        </div>

        <p className="rt-method lbl">
          A company appears here while it holds {c.floor} or more live roles located in {c.inName} on the board (the bar rises in countries where the list would otherwise run past 250 companies), and re-ranks with the nightly scrape. Counts are that country&rsquo;s postings only. PivotHop is not affiliated with any company listed; each role links out to apply at the original posting.
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
          { '@type': 'ListItem', position: 2, name: 'Companies', item: 'https://www.pivothop.com/companies' },
          { '@type': 'ListItem', position: 3, name: `Companies hiring in ${c.inName}`, item: `https://www.pivothop.com/companies/${c.slug}` },
        ],
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `Companies hiring in ${c.inName}`,
        numberOfItems: c.companies.length,
        itemListElement: c.companies.slice(0, 20).map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: r.name, url: `https://www.pivothop.com/companies/${r.slug}` })),
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.text } })),
      }) }} />
    </PageShell>
  );
}
