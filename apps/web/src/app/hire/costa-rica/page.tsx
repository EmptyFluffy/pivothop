import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../../components/SiteChrome';
import { hireOccSlugs, getHireOcc } from './hire-data';
import { crMarketStats } from '../../salary/by-country/costa-rica/live-data';
import { CR_BENCHMARKS } from '../../salary/by-country/costa-rica/benchmarks';
import { occTitle } from '../../jobs/jobs-data';
import { Crumbs } from '../../components/Crumbs';
import { PageHead } from '../../components/PageHead';

/* The employer hub for Costa Rica. Everything on it is either a computed
   figure from our own live CR postings, a benchmark with a named source and
   date, or a verifiable fact (the time zone). Labor-law context is linked to
   the authorities, never restated — see hire-data.ts for the line this
   family never crosses. */

export const metadata: Metadata = {
  title: 'Hire remote talent in Costa Rica: live market data',
  description:
    'What hiring in Costa Rica actually looks like right now: live openings by role, posted pay with sample sizes, the companies already hiring there, and salary benchmarks with named sources. No agency numbers, no guesses.',
  alternates: { canonical: '/hire/costa-rica' },
};

export default function HireCostaRica() {
  const m = crMarketStats();
  const occs = hireOccSlugs().map((o) => getHireOcc(o)!);
  const benchSlugs = new Set(CR_BENCHMARKS.map((b) => b.slug));

  const faq = [
    {
      q: 'How active is the Costa Rica hiring market right now?',
      text: `This board holds ${m.total.toLocaleString()} live Costa Rica openings from ${m.companies.toLocaleString()} companies, refreshed nightly; ${m.remote.toLocaleString()} are fully remote. Counts are live inventory, not estimates.`,
    },
    {
      q: 'What time zone is Costa Rica in?',
      text: 'UTC−6 (Central Standard Time) all year. Costa Rica does not observe daylight saving. That is a full-day overlap with US Central time year-round, and five or more shared hours with both US coasts.',
    },
    {
      q: 'Where do the salary figures come from?',
      text: 'Two places, always labeled: posted pay computed from live postings on this board (with the sample size on every figure), and, for benchmarked roles, published sources with names and dates on the Costa Rica salary pages. Nothing is inferred and no "directional" agency ranges are used.',
    },
    {
      q: 'What about Costa Rican labor law and employer costs?',
      text: 'Outside our data, deliberately. Statutory questions (minimum wages, social contributions, leave) belong to the Ministry of Labor (MTSS) and the CCSS, and rules change; quote them from the source, not from a job board. We publish what we measure: the market.',
    },
  ];

  return (
    <PageShell v2 active="hire">
      <div className="rtp">
        <Crumbs trail={[{ label: 'Employers', href: '/employers' }, { label: 'Hire in Costa Rica' }]} />
        <PageHead
          kicker="For employers"
          title="Hire remote talent in Costa Rica"
          lede={<>The pages that rank for this query quote &ldquo;directional&rdquo; salary ranges with no source.
            This one is computed from live postings: what is actually being hired in Costa Rica right now, what
            the postings pay, and who is already hiring, with the sample size on every number.</>}
          meta={<><span className="lbl">{m.total.toLocaleString()}</span> live CR openings &middot;{' '}
            <span className="lbl">{m.companies.toLocaleString()}</span> companies &middot;{' '}
            <span className="lbl">{m.remote.toLocaleString()}</span> fully remote &middot; UTC&minus;6 year-round, no DST</>}
        />

        <section className="rt-sec">
          <h2>The market, by role</h2>
          <p className="rt-note">
            Every role with six or more live Costa Rica openings on the board. Posted band covers only
            postings that state pay, and only where five or more do.
          </p>
          <div className="occ-tblwrap">
            <table className="occ-tbl">
              <thead><tr><th>Role</th><th>Live CR roles</th><th>State pay</th><th>Posted band</th><th></th></tr></thead>
              <tbody>
                {occs.map((o) => (
                  <tr key={o.occ}>
                    <td><Link className="gl" href={`/hire/costa-rica/${o.occ}`}>{occTitle(o.occ)}</Link></td>
                    <td className="n">{o.n}</td>
                    <td className="n">{o.withSalary || '—'}</td>
                    <td className="n">{o.band ? `$${o.band.p25}k–$${o.band.p75}k` : '—'}</td>
                    <td>{benchSlugs.has(o.occ) && <Link className="gl" href={`/salary/by-country/costa-rica/${o.occ}`}>benchmarks</Link>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rt-sec">
          <h2>Sourced benchmarks, where we have them</h2>
          <p className="rt-note">
            For {CR_BENCHMARKS.length} roles we maintain salary benchmarks with a named source, a date, and a
            lens (multinational compensation, remote foreign employers, contractor market) on each figure:
          </p>
          <ul className="rt-rel">
            {CR_BENCHMARKS.map((b) => (
              <li key={b.slug}>
                <Link href={`/salary/by-country/costa-rica/${b.slug}`}>{b.title} salary in Costa Rica</Link>
                <span className="lbl">{b.sources.length} sources</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rt-sec">
          <h2>What this page will not tell you</h2>
          <p className="rt-note" style={{ maxWidth: '68ch' }}>
            Employer costs, tax brackets, severance rules, work permits. Those are statutory, they change, and
            a job board is the wrong source for them. Quote the{' '}
            <a className="gl" href="https://www.mtss.go.cr/" rel="noopener noreferrer" target="_blank">Ministerio de Trabajo (MTSS)</a>{' '}
            and the{' '}
            <a className="gl" href="https://inec.cr/" rel="noopener noreferrer" target="_blank">national statistics institute (INEC)</a>{' '}
            directly, or your counsel. We publish what we measure: the live market.
          </p>
        </section>

        <section className="rt-cta">
          <div>
            <h2>Hiring in Costa Rica?</h2>
            <p>Post the role free during early access. It is reviewed by a person, then shown to the candidates whose skills already reach it, including the Costa Rican audience reading this board daily.</p>
          </div>
          <Link className="rt-go" href="/employers">Post a job &rarr;</Link>
        </section>

        <div className="post-faq rt-faq">
          <h2>Quick answers</h2>
          {faq.map((f) => (
            <details key={f.q} name="pagefaq"><summary>{f.q}</summary><p>{f.text}</p></details>
          ))}
        </div>

        <p className="rt-method lbl">
          Live figures computed nightly from Costa Rica postings on re-displayable sources; benchmark figures
          carry their own source and date on the salary pages. PivotHop is a job board, not an employer of
          record, and offers no legal or tax guidance.
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
          { '@type': 'ListItem', position: 2, name: 'Employers', item: 'https://www.pivothop.com/employers' },
          { '@type': 'ListItem', position: 3, name: 'Hire in Costa Rica', item: 'https://www.pivothop.com/hire/costa-rica' },
        ],
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.text } })),
      }) }} />
    </PageShell>
  );
}
