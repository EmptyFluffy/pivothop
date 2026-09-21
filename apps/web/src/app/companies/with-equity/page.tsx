import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../../components/SiteChrome';
import { Crumbs } from '../../components/Crumbs';
import { PageHead } from '../../components/PageHead';
import { IndexSearch, type IxRow, type IxGroup } from '../../components/IndexSearch';
import { companyInitial, monoTint } from '../../jobs/JobCard';
import JobsList from '../../jobs/JobsList';
import { equityCompanies, equityJobs } from '../companies-data';

export function generateMetadata(): Metadata {
  const rows = equityCompanies();
  const jobs = rows.reduce((s, r) => s + r.n, 0);
  return {
    title: 'Companies hiring with equity',
    description: `${rows.length} companies with open roles that include equity, ${jobs.toLocaleString()} roles in all: ${rows.slice(0, 3).map((r) => r.name).join(', ')} and more.`,
    alternates: { canonical: '/companies/with-equity' },
  };
}

export default function EquityCompaniesPage() {
  const cos = equityCompanies();
  const total = cos.reduce((s, r) => s + r.n, 0);
  const groupTotals = new Map<string, number>();
  const rows: IxRow[] = cos.map((r) => {
    const field = r.field ?? 'Other';
    groupTotals.set(field, (groupTotals.get(field) ?? 0) + r.n);
    const [bg, fg] = monoTint(r.name);
    return {
      slug: r.slug, href: `/companies/${r.slug}`, t: r.name, m: r.n.toLocaleString(),
      s: [r.remoteN > 0 ? `${r.remoteN} remote` : '', r.total > r.n ? `${r.total.toLocaleString()} roles in all` : ''].filter(Boolean).join(' · '),
      hay: `${r.name} ${field}`.toLowerCase(), group: field, logo: r.logo, initial: companyInitial(r.name), tint: [bg, fg],
    };
  });
  const groups: IxGroup[] = [...groupTotals.entries()].sort((a, b) => b[1] - a[1]).map(([key]) => ({ key, label: key, unit: 'companies' }));
  const top = cos.slice(0, 3);
  const faq = [
    { q: 'Which companies offer equity right now?', text: `The biggest hirers with equity on our board are ${top.map((r) => `${r.name} (${r.n} roles)`).join(', ')}. A company is listed when three or more of its open postings say the role includes equity.`, jsx: <>The biggest hirers with equity on our board are {top.map((r, i) => <span key={r.slug}>{i > 0 ? ', ' : ''}<Link className="gl" href={`/companies/${r.slug}`}>{r.name}</Link> ({r.n} roles)</span>)}. A company is listed when three or more of its open postings say the role includes equity.</> },
    { q: 'How do you know a role includes equity?', text: 'The posting says so. We read the text for stock options, RSUs or an equity grant, with negation checks, so a line like "no equity" never counts. Confirm on the original posting before you plan around it.', jsx: <>The posting says so. We read the text for stock options, RSUs or an equity grant, with negation checks, so a line like &ldquo;no equity&rdquo; never counts. Confirm on the original posting before you plan around it.</> },
    { q: 'Where are the roles themselves?', text: `All ${total.toLocaleString()} roles with equity are on the board, filterable by field, country and pay.`, jsx: <>All <Link className="gl" href="/jobs/with-equity">{total.toLocaleString()} roles with equity</Link> are on the board, filterable by field, country and pay.</> },
  ];
  return (
    <PageShell v2 active="companies">
      <div className="rtp">
        <Crumbs trail={[{ label: 'Companies', href: '/companies' }, { label: 'With equity' }]} />
        <PageHead
          kicker="The employers"
          title="Companies hiring with equity"
          lede={`${cos.length} companies with open roles that include equity, and how many each one has.`}
          meta={<><span className="lbl">{total.toLocaleString()}</span> roles with equity &middot; <span className="lbl">{cos.length}</span> companies</>}
        />
        <IndexSearch rows={rows} groups={groups} placeholder="Search a company" unit="companies" />
        <JobsList jobs={equityJobs(8)} limit={8} total={total} heading="Newest roles with equity" note="" allHref="/jobs/with-equity" allLabel={`All ${total.toLocaleString()} roles with equity`} />
        <div className="post-faq rt-faq">
          <h2>Quick answers</h2>
          {faq.map((f) => <details key={f.q} name="pagefaq"><summary>{f.q}</summary><p>{f.jsx}</p></details>)}
        </div>
        <p className="rt-method lbl">Equity is counted only where the posting states it. Refreshed nightly. PivotHop is not affiliated with the companies listed.</p>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', name: 'Companies hiring with equity', numberOfItems: cos.length, itemListElement: cos.slice(0, 20).map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: r.name, url: `https://www.pivothop.com/companies/${r.slug}` })) }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.text } })) }) }} />
    </PageShell>
  );
}
