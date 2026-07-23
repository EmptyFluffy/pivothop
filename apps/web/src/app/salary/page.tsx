import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../components/SiteChrome';
import { coverableSlugs, getSalary, usBand, fmt } from './salary-data';

export const metadata: Metadata = {
  title: 'Salaries by occupation, measured from live postings — PivotHop',
  description: 'What each occupation actually pays, from live US job postings blended with official BLS OEWS data: median, range, the trend over time, and how pay splits by seniority and country. A growing salary reference.',
  alternates: { canonical: '/salary' },
};

export default function SalaryIndex() {
  const rows = coverableSlugs().map((s) => ({ slug: s, f: getSalary(s) })).filter((r) => r.f).sort((a, b) => (usBand(b.f!)?.p50 ?? 0) - (usBand(a.f!)?.p50 ?? 0));
  return (
    <PageShell>
      <div className="rtp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb"><Link href="/">Instrument</Link><span>/</span><span>Salaries</span></nav>
        <h1 className="rt-h1">Salaries, measured.</h1>
        <p className="rt-dek">
          What each occupation actually pays, from live US postings blended with official{' '}
          <a className="gl" href="/glossary#oews">OEWS</a> (Occupational Employment and Wage Statistics) wage data from
          the US <a className="gl" href="/glossary#bls">BLS</a> (Bureau of Labor Statistics), with the trend over time and
          the split by seniority and country. Not one scraped number, the whole distribution and where it is heading.
          Starting with the most-searched roles; more added as their data firms up.
        </p>
        <p className="rt-dek" style={{ marginTop: '-8px' }}>
          Comparing one job across markets? See <Link className="gl" href="/salary/by-country">the same job, priced across countries</Link>, nominal and adjusted for cost of living.
        </p>
        <ul className="rt-index">
          {rows.map(({ slug, f }) => {
            const b = usBand(f!);
            return (
              <li key={slug}>
                <Link href={`/salary/${slug}`}>
                  <span className="t">{f!.title} salary</span>
                  <span className="m">{fmt(b?.p50)}</span>
                  <span className="s lbl">{fmt(b?.p25)}&ndash;{fmt(b?.p75)} typical &middot; {f!.observations.toLocaleString()} postings</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="rt-method lbl">Every page blends live postings with the official OEWS anchor for the occupation. Numbers refresh with the nightly scrape.</p>
      </div>
    </PageShell>
  );
}
