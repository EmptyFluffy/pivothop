import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../components/SiteChrome';
import { companiesRanked } from './companies-data';
import { companyInitial, monoTint } from '../jobs/JobCard';
import { Crumbs } from '../components/Crumbs';
import { PageHead } from '../components/PageHead';

export const metadata: Metadata = {
  title: 'Companies hiring now: live roles, benefits and posted pay',
  description: 'Every company with live openings on the board: what each is hiring for, where, the benefits its postings declare, and posted pay, computed nightly from the listings themselves.',
  alternates: { canonical: '/companies' },
};

export default function CompaniesHub() {
  const cos = companiesRanked();
  const total = cos.reduce((s, c) => s + c.count, 0);
  const strong = cos.filter((c) => c.count >= 20);
  const rest = cos.filter((c) => c.count < 20).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <PageShell v2 active="companies">
      <div className="rtp">
        <Crumbs trail={[{ label: 'Companies' }]} />
        <PageHead
          kicker="The employers, measured"
          title="Companies hiring now"
          lede={<>{cos.length.toLocaleString()} companies with live openings on the board, {total.toLocaleString()} roles
            between them. Each profile is computed nightly from the company&rsquo;s own postings: occupations,
            countries, declared benefits, posted pay. Nothing self-reported, and a company can claim its
            profile from its own page.</>}
        />
        <ul className="co-grid">
          {strong.map((c) => {
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
        {rest.length > 0 && (
          <section className="rt-sec">
            <h2>Every other company hiring</h2>
            <p className="rt-note">{rest.length.toLocaleString()} more companies with live roles, A to Z.</p>
            <p className="co-az">
              {rest.map((c) => (
                <Link key={c.slug} href={`/companies/${c.slug}`}>{c.name}<span className="lbl"> {c.count}</span></Link>
              ))}
            </p>
          </section>
        )}

        <p className="rt-method lbl">
          A profile appears while the company holds live roles on the board (three or more) and re-ranks with
          the nightly scrape. PivotHop is not affiliated with any company listed.
        </p>
      </div>
    </PageShell>
  );
}
