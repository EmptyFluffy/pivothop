import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '../../../../components/SiteChrome';
import { CR_BENCHMARKS, CR_BY_SLUG, type BenchmarkSource } from '../benchmarks';
import { crRoleStats } from '../live-data';
import { Crumbs } from '../../../../components/Crumbs';
import { PageHead } from '../../../../components/PageHead';

export function generateStaticParams() {
  return CR_BENCHMARKS.map((r) => ({ occ: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ occ: string }> }): Promise<Metadata> {
  const { occ } = await params;
  const role = CR_BY_SLUG[occ];
  if (!role) return {};
  return {
    title: `${role.title} Salary in Costa Rica 2026 | Local, remote and total comp`,
    description: `${role.title} salary benchmarks in Costa Rica, with each source labeled by what it measures: local market, multinational total compensation, remote foreign-employer pay, contractor rates and live jobs.`,
    alternates: { canonical: `/salary/by-country/costa-rica/${role.slug}` },
  };
}

const crc = (n?: number) => n == null ? '—' : `₡${Math.round(n).toLocaleString('en-US')}`;
const usd = (n?: number) => n == null ? '—' : `$${Math.round(n).toLocaleString('en-US')}`;
const lensName: Record<BenchmarkSource['lens'], string> = {
  'multinational-total-comp': 'Multinational total comp',
  'remote-foreign-employer': 'Remote foreign employer',
  'contractor-market': 'Contractor market',
};
function val(s: BenchmarkSource) {
  const f = s.currency === 'CRC' ? crc : usd;
  const suffix = s.unit === 'hour' ? '/hr' : '/yr';
  if (s.p25 != null && s.p50 != null && s.p75 != null) return `${f(s.p50)} median · ${f(s.p25)}–${f(s.p75)} middle 50%`;
  if (s.low != null && s.p50 != null && s.high != null) return `${f(s.p50)} midpoint · ${f(s.low)}–${f(s.high)} range`;
  if (s.p50 != null) return `${f(s.p50)}${suffix}`;
  if (s.low != null && s.high != null) return `${f(s.low)}–${f(s.high)}${suffix}`;
  return 'See source';
}

export default async function CostaRicaRoleSalaryPage({ params }: { params: Promise<{ occ: string }> }) {
  const { occ } = await params;
  const role = CR_BY_SLUG[occ];
  if (!role) notFound();
  const live = crRoleStats(role.slug);

  return (
    <PageShell v2 active="salaries">
      <div className="rtp salp">
        <Crumbs trail={[{ label: 'Salaries', href: '/salary' }, { label: 'By country', href: '/salary/by-country' }, { label: 'Costa Rica', href: '/salary/by-country/costa-rica' }, { label: role.title }]} />
        <PageHead kicker={<>Costa Rica · {role.title}</>} title={<>{role.title} salary in Costa Rica</>} lede={<>There is no honest single number for this market. Below, each benchmark stays attached to the market it actually measures so a local salary is not quietly averaged with equity-heavy total compensation or a remote US-company budget.</>} />

        <section className="rt-sec">
          <h2>The benchmarks</h2>
          <table className="post-table">
            <caption>{role.title} · Costa Rica · source ledger</caption>
            <thead><tr><th>Market lens</th><th>Source</th><th>Benchmark</th><th>As of</th></tr></thead>
            <tbody>
              {role.sources.map((s) => (
                <tr key={s.id}>
                  <td><strong>{lensName[s.lens]}</strong><br /><span className="lbl">{s.measure}</span></td>
                  <td><a href={s.url} target="_blank" rel="noreferrer">{s.label} ↗</a>{s.sample && <><br /><span className="lbl">{s.sample}</span></>}</td>
                  <td>{val(s)}</td>
                  <td>{s.asOf}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {role.sources.map((s) => s.note ? <p className="rt-note" key={`${s.id}-note`}><strong>{s.label}:</strong> {s.note}</p> : null)}
        </section>

        <section className="rt-sec">
          <h2>Official Costa Rica benchmark</h2>
          {role.cocrCodes ? (
            <>
              <p>
                The official local employee layer maps this role to COCR-2011 {role.cocrCodes.join(', ')}{role.cocrLabel ? ` (${role.cocrLabel})` : ''}. PivotHop will calculate the distribution from INEC ECE microdata using salaried workers, gross monthly monetary income and survey weights across the latest four completed quarters.
              </p>
              <p className="rt-note">{role.cocrNote}</p>
            </>
          ) : (
            <p className="rt-note">{role.cocrNote} That is why this page does not display a made-up “official” local median.</p>
          )}
          <p><a className="gl" href="https://sistemas.inec.cr/nada5.4/index.php/catalog/384" target="_blank" rel="noreferrer">INEC ECE source catalog ↗</a></p>
        </section>

        <section className="rt-sec">
          <h2>What PivotHop sees right now</h2>
          <table className="post-table">
            <caption>Current Costa Rica-located listings tagged to {role.title}</caption>
            <thead><tr><th>Live jobs</th><th className="num">Remote</th><th className="num">With stated pay</th><th>Advertised-pay median</th></tr></thead>
            <tbody><tr><td><strong>{live.jobs}</strong></td><td className="num">{live.remote}</td><td className="num">{live.withSalary}</td><td>{live.salaryMedian != null ? `${usd(live.salaryMedian)}/yr` : 'Not enough stated-pay observations'}</td></tr></tbody>
          </table>
          {live.companies.length > 0 && <p className="rt-note">Companies in the current sample include {live.companies.join(', ')}.</p>}
          <p className="rt-note">PivotHop only publishes an advertised-pay median here when at least 10 current Costa Rica listings for this occupation state pay. That figure describes open job ads, not the entire workforce.</p>
        </section>

        <section className="rt-cta">
          <div><h2>Hiring a {role.title}?</h2><p>Model a location-adjusted offer, or publish the role free while PivotHop&apos;s employer product is in early access.</p></div>
          <div><Link className="rt-go" href="/salary/calculator">Run the calculator →</Link><br /><Link className="gl" href="/employers">Post this job free →</Link></div>
        </section>

        <section className="rt-sec">
          <h2>Why the numbers disagree</h2>
          <p>
            Total compensation can include equity and bonus. Remote foreign-employer benchmarks describe companies hiring across borders, often in USD. Contractor data prices a commercial contract rather than payroll employment. The INEC layer measures Costa Rica&apos;s local salaried workforce. The disagreement is information about the market, not noise to average away.
          </p>
          <p><Link className="gl" href="/salary/by-country/costa-rica">Back to the Costa Rica salary guide →</Link></p>
        </section>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'Dataset', name: `${role.title} salary benchmarks in Costa Rica`, description: `Source-ledger salary benchmarks for ${role.title} in Costa Rica, separated by market type.`, url: `https://www.pivothop.com/salary/by-country/costa-rica/${role.slug}`, creator: { '@type': 'Organization', name: 'PivotHop' }, isAccessibleForFree: true },
          { '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
            { '@type': 'ListItem', position: 2, name: 'Salaries', item: 'https://www.pivothop.com/salary' },
            { '@type': 'ListItem', position: 3, name: 'Costa Rica', item: 'https://www.pivothop.com/salary/by-country/costa-rica' },
            { '@type': 'ListItem', position: 4, name: role.title, item: `https://www.pivothop.com/salary/by-country/costa-rica/${role.slug}` },
          ] },
        ],
      }) }} />
    </PageShell>
  );
}
