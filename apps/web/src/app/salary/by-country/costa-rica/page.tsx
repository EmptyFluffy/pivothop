import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../../../components/SiteChrome';
import { CR_BENCHMARKS, type BenchmarkSource } from './benchmarks';
import { crMarketStats, crRoleStats } from './live-data';
import { Crumbs } from '../../../components/Crumbs';
import { PageHead } from '../../../components/PageHead';

export const metadata: Metadata = {
  title: 'Costa Rica Salary Guide 2026 | Local, remote and total compensation',
  description:
    'Costa Rica salary benchmarks by occupation, separating local employee pay, multinational total compensation, remote foreign-employer rates, contractor rates, and live PivotHop job postings. Sources and methodology shown.',
  alternates: { canonical: '/salary/by-country/costa-rica' },
};

const crc = (n?: number) => n == null ? '—' : `₡${Math.round(n).toLocaleString('en-US')}`;
const usd = (n?: number) => n == null ? '—' : `$${Math.round(n).toLocaleString('en-US')}`;
function yearly(s?: BenchmarkSource) {
  if (!s) return '—';
  const f = s.currency === 'CRC' ? crc : usd;
  if (s.p50 != null) return `${f(s.p50)}${s.unit === 'hour' ? '/hr' : '/yr'}`;
  if (s.low != null && s.high != null) return `${f(s.low)}–${f(s.high)}${s.unit === 'hour' ? '/hr' : '/yr'}`;
  return '—';
}
function sourceFor(role: typeof CR_BENCHMARKS[number], lens: BenchmarkSource['lens']) {
  return role.sources.find((s) => s.lens === lens);
}

export default function CostaRicaSalaryGuide() {
  const market = crMarketStats();
  return (
    <PageShell v2 active="salaries">
      <div className="rtp salp">
        <Crumbs trail={[{ label: 'Salaries', href: '/salary' }, { label: 'By country', href: '/salary/by-country' }, { label: 'Costa Rica' }]} />
        <PageHead kicker={<>Costa Rica salary guide · 2026</>} title={<>One country. Several salary markets.</>} lede={<>A local payroll salary, multinational total compensation, a remote US-company offer and a contractor rate are not
          the same number. This guide keeps them separate, names the source behind each one, and adds the live Costa Rica
          market visible in PivotHop instead of averaging incompatible benchmarks into a fake median.</>} />

        <section className="rt-sec">
          <h2>The live market we can see</h2>
          <p className="rt-note">Current Costa Rica-located listings in PivotHop. These counts move with the board and are not used as a substitute for official wage statistics.</p>
          <div className="occ-tblwrap"><table className="post-table">
            <caption>PivotHop Costa Rica job market · refreshed with the board</caption>
            <thead><tr><th>Live listings</th><th className="num">Companies</th><th className="num">Remote</th><th className="num">With stated pay</th></tr></thead>
            <tbody><tr><td><strong>{market.total.toLocaleString()}</strong></td><td className="num">{market.companies.toLocaleString()}</td><td className="num">{market.remote.toLocaleString()}</td><td className="num">{market.withSalary.toLocaleString()}</td></tr></tbody>
          </table></div>
        </section>

        <section className="rt-sec">
          <h2>Benchmarks by role</h2>
          <p className="rt-note">
            Total comp is shown in CRC; remote-for-foreign-employer figures are generally USD annual pay. Read across, not as if the columns were interchangeable. Each role page shows the source ledger and what each figure measures.
          </p>
          <div className="occ-tblwrap"><table className="post-table">
            <caption>Selected roles with direct Costa Rica benchmark coverage · source dates shown on role pages</caption>
            <thead><tr><th>Role</th><th className="num">Multinational total comp</th><th className="num">Remote foreign employer</th><th className="num">Live CR jobs</th></tr></thead>
            <tbody>
              {CR_BENCHMARKS.map((role) => {
                const tc = sourceFor(role, 'multinational-total-comp');
                const remote = sourceFor(role, 'remote-foreign-employer');
                const live = crRoleStats(role.slug);
                return (
                  <tr key={role.slug}>
                    <td><Link href={`/salary/by-country/costa-rica/${role.slug}`}><strong>{role.title}</strong></Link></td>
                    <td className="num">{yearly(tc)}</td>
                    <td className="num">{yearly(remote)}</td>
                    <td className="num">{live.jobs}</td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </section>

        <section className="rt-sec">
          <h2>The official layer: INEC ECE</h2>
          <p>
            The official local benchmark will be calculated from Costa Rica&apos;s Encuesta Continua de Empleo, not inferred from a global cost-of-living multiplier. The ECE exposes a four-digit COCR-2011 occupation code, monthly gross monetary income, hourly gross income, employment position and survey weights. PivotHop will pool the latest four completed quarters, keep salaried workers only, and publish weighted P25, median and P75 with the raw sample size beside the result.
          </p>
          <p className="rt-note">
            We do not publish an official role median until the occupation mapping is defensible and the pooled sample clears the floor. Modern titles that do not map cleanly to one COCR code keep their other market lenses rather than receiving an invented INEC number.
          </p>
          <ul className="rt-rel">
            <li><a href="https://sistemas.inec.cr/nada5.4/index.php/catalog/384" target="_blank" rel="noreferrer">INEC · Encuesta Continua de Empleo, II Trimestre 2026</a><span className="lbl">official microdata</span></li>
            <li><a href="https://sistemas.inec.cr/sitiosen/sitiosen/Archivos/COCR_2011.pdf" target="_blank" rel="noreferrer">COCR-2011 occupation classification</a><span className="lbl">role mapping</span></li>
          </ul>
        </section>

        <section className="rt-sec">
          <h2>Legal floor is not market pay</h2>
          <p>
            Costa Rica&apos;s 2026 minimum-wage list includes qualification-based generic floors such as ₡664,078.07 per month for a university bachelor and ₡796,921.00 for a licentiate. Those are useful compliance context, but they are not evidence that a software engineer, accountant or designer should be paid that amount.
          </p>
          <p><a className="gl" href="https://www.mtss.go.cr/temas-laborales/salarios/lista_salarios_minimos_2026.pdf" target="_blank" rel="noreferrer">Official MTSS 2026 minimum-wage list ↗</a></p>
        </section>

        <section className="rt-cta">
          <div><h2>Pricing a real hire?</h2><p>Use the calculator for the role and countries you are comparing, then post the role directly to PivotHop while employer posting is free.</p></div>
          <div><Link className="rt-go" href="/salary/calculator">Price the role →</Link><br /><Link className="gl" href="/employers">Post a job free →</Link></div>
        </section>

        <section className="rt-sec">
          <h2>How to read this guide</h2>
          <ul className="rt-rel">
            <li><span><strong>Official local employee</strong></span><span className="lbl">INEC ECE, weighted local payroll distribution</span></li>
            <li><span><strong>Multinational total comp</strong></span><span className="lbl">base + stock + bonus where reported</span></li>
            <li><span><strong>Remote foreign employer</strong></span><span className="lbl">remote pay for workers located in Costa Rica</span></li>
            <li><span><strong>Contractor market</strong></span><span className="lbl">hourly/contract rates, never labeled salary</span></li>
            <li><span><strong>PivotHop live market</strong></span><span className="lbl">current advertised jobs and stated pay</span></li>
          </ul>
        </section>

        <p className="rt-method lbl">
          Source ledger updated August 2026. External benchmark figures remain attributed to their original publishers and are kept as separate measurements. PivotHop live listings refresh with the board. INEC figures will use a reproducible rolling-four-quarter weighted calculation once each occupation clears the sample and mapping gates.
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'Dataset', name: 'PivotHop Costa Rica salary benchmark source ledger', description: 'Multi-source Costa Rica salary benchmarks by occupation, separated by local, total-compensation, remote and contractor market.', url: 'https://www.pivothop.com/salary/by-country/costa-rica', creator: { '@type': 'Organization', name: 'PivotHop' }, isAccessibleForFree: true },
          { '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
            { '@type': 'ListItem', position: 2, name: 'Salaries', item: 'https://www.pivothop.com/salary' },
            { '@type': 'ListItem', position: 3, name: 'By country', item: 'https://www.pivothop.com/salary/by-country' },
            { '@type': 'ListItem', position: 4, name: 'Costa Rica', item: 'https://www.pivothop.com/salary/by-country/costa-rica' },
          ] },
        ],
      }) }} />
    </PageShell>
  );
}
