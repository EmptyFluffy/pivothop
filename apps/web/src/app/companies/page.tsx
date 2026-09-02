import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../components/SiteChrome';
import { companiesRanked } from './companies-data';
import { companyInitial, monoTint } from '../jobs/JobCard';

export const metadata: Metadata = {
  title: 'Companies hiring now: live roles, benefits and posted pay',
  description: 'Every company with 20 or more live openings on the board: what each is hiring for, where, the benefits its postings declare, and posted pay — computed nightly from the listings themselves.',
  alternates: { canonical: '/companies' },
};

export default function CompaniesHub() {
  const cos = companiesRanked();
  const total = cos.reduce((s, c) => s + c.count, 0);
  return (
    <PageShell v2 active="jobs">
      <div className="rtp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb">
          <Link href="/">PivotHop</Link><span>/</span><span>Companies</span>
        </nav>
        <header className="rt-head">
          <p className="lbl acc">The employers, measured</p>
          <h1 className="rt-h1">Companies hiring now</h1>
          <p className="jb-lede">
            The {cos.length} companies with 20 or more live openings on the board — {total.toLocaleString()} roles
            between them. Each page is computed nightly from the company&rsquo;s own postings: occupations,
            countries, declared benefits, posted pay. Nothing self-reported.
          </p>
        </header>
        <ul className="co-grid">
          {cos.map((c) => {
            const [tbg, tfg] = monoTint(c.name);
            return (
              <li key={c.slug}>
                <Link href={`/companies/${c.slug}`} className="co-card">
                  <span className="co-logo sm" aria-hidden="true">
                    {c.logo
                      ? <img src={c.logo} alt="" width={34} height={34} loading="lazy" />
                      : <i style={{ background: tbg, color: tfg }}>{companyInitial(c.name)}</i>}
                  </span>
                  <span className="co-name">{c.name}</span>
                  <span className="co-n lbl">{c.count.toLocaleString()}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="rt-method lbl">
          A company appears here while it holds 20 or more live roles on the board; the list re-ranks with the
          nightly scrape. PivotHop is not affiliated with any company listed.
        </p>
      </div>
    </PageShell>
  );
}
