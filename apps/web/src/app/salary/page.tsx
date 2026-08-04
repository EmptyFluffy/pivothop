import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../components/SiteChrome';
import { IndexSearch, type IxRow } from '../components/IndexSearch';
import { coverableSlugs, getSalary, usBand, fmt, getSwissFile, fmtChf } from './salary-data';

export const metadata: Metadata = {
  title: 'Salaries by occupation, measured from live postings — PivotHop',
  description: 'What each occupation actually pays, from live US job postings blended with official BLS OEWS data: median, range, the trend over time, and how pay splits by seniority and country. A growing salary reference.',
  alternates: { canonical: '/salary' },
};

export default function SalaryIndex() {
  const rows: IxRow[] = coverableSlugs()
    .map((s) => ({ slug: s, f: getSalary(s) }))
    .filter((r) => r.f)
    .sort((a, b) => (usBand(b.f!)?.p50 ?? 0) - (usBand(a.f!)?.p50 ?? 0))
    .map(({ slug, f }) => {
      const b = usBand(f!);
      return {
        slug,
        href: `/salary/${slug}`,
        t: `${f!.title} salary`,
        m: fmt(b?.p50),
        s: `${fmt(b?.p25)}–${fmt(b?.p75)} typical · ${f!.observations.toLocaleString()} postings`,
        hay: f!.title.toLowerCase(),
      };
    });
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
        <IndexSearch rows={rows} placeholder="Search a job title" unit="occupations" />

        {(() => {
          const ch = getSwissFile();
          if (!ch?.groups) return null;
          const groups = Object.entries(ch.groups).sort((a, b) => b[1].month.p50 - a[1].month.p50);
          return (
            <section className="rt-sec">
              <details className="ch-sal">
                <summary>
                  <span className="ch-sal-flag" aria-hidden="true"><svg viewBox="0 0 32 32" width="13" height="13"><rect width="32" height="32" fill="#d52b1e" /><rect x="13" y="6" width="6" height="20" fill="#fff" /><rect x="6" y="13" width="20" height="6" fill="#fff" /></svg></span>
                  <h2>Swiss salary bands &middot; every occupation group</h2>
                  <span className="ch-sal-med lbl">{ch.total ? `national median ${fmtChf(ch.total.month.p50)}/month` : `LSE ${ch.year}`}</span>
                </summary>
                <div className="ch-sal-body">
                  <p className="rt-note">
                    Swiss job ads do not post pay, so these are the official federal numbers instead: the Lohnstrukturerhebung {ch.year}
                    (Swiss wage-structure survey), standardized gross monthly pay, full-time, 13th salary pro&nbsp;rata, all of Switzerland.
                    Sorted by median. Every occupation page with a Swiss group carries its own band further down its page.
                  </p>
                  <ul className="rt-rel sal-countries">
                    {groups.map(([code, g]) => (
                      <li key={code}><span>{g.label_de}</span><span className="lbl">{fmtChf(g.month.p25)} &ndash; {fmtChf(g.month.p75)} &middot; median {fmtChf(g.month.p50)}</span></li>
                    ))}
                  </ul>
                  <p className="rt-note">Source: Bundesamt f&uuml;r Statistik, LSE {ch.year}, ISCO-08 occupation groups.</p>
                </div>
              </details>
            </section>
          );
        })()}

        <p className="rt-method lbl">Every page blends live postings with the official OEWS anchor for the occupation. US numbers refresh with the nightly scrape; the Swiss bands come from the federal wage survey.</p>
      </div>
    </PageShell>
  );
}
