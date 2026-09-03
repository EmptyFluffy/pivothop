import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../../components/SiteChrome';
import { hireOccSlugs, getHireOcc, crTopCompanies } from './hire-data';
import { crMarketStats } from '../../salary/by-country/costa-rica/live-data';
import { CR_BENCHMARKS } from '../../salary/by-country/costa-rica/benchmarks';
import { occTitle } from '../../jobs/jobs-data';
import { companiesRanked } from '../../companies/companies-data';
import { Crumbs } from '../../components/Crumbs';
import { PageHead } from '../../components/PageHead';

/* The employer hub for Costa Rica, rewritten 2026-09-02 after the founder
   read the first version as an academic document that invited nobody. It now
   makes the case: why teams hire here (each reason with a figure and a source
   a reader can open), what the roles pay today (our live postings), who is
   already hiring (our board), and how posting works. The line the family
   never crosses still holds: no employer-cost tables, no tax or severance
   guidance, no permit advice. Statutory questions are pointed at the
   authorities. */

export const metadata: Metadata = {
  title: 'Hire in Costa Rica: what roles pay, who is hiring, and why teams choose it',
  description:
    'Hire remote talent in Costa Rica with the numbers in hand: live openings and posted pay by role, the companies already hiring there, and the reasons 400-plus multinationals operate in the country, each with a source. Post a role free.',
  alternates: { canonical: '/hire/costa-rica' },
};

const SOURCES = {
  cinde: { label: 'CINDE, 2024 investment results', url: 'https://www.cinde.org/en/essential-news/73-new-investment-projects-were-developed-in-2024-with-cindes-support' },
  procomer: { label: 'PROCOMER, services export figures 2024', url: 'https://www.prnewswire.com/news-releases/costa-rica-accelerates-its-rise-in-the-global-services-economy-302650903.html' },
  wto: { label: 'WTO case study, Costa Rica services exports', url: 'https://www.wto.org/english/tratop_e/ts4d_e/case_studies_e/costa_rica.pdf' },
  ef: { label: 'EF English Proficiency Index 2025, Costa Rica', url: 'https://www.ef.com/wwen/epi/regions/latin-america/costa-rica/' },
  oecd: { label: 'OECD, Costa Rica member page', url: 'https://www.oecd.org/en/countries/costa-rica.html' },
};

export default function HireCostaRica() {
  const m = crMarketStats();
  const occs = hireOccSlugs().map((o) => getHireOcc(o)!).sort((a, b) => b.n - a.n);
  const benchSlugs = new Set(CR_BENCHMARKS.map((b) => b.slug));
  const slugByName = new Map(companiesRanked().map((c) => [c.name, c.slug]));
  const topCos = crTopCompanies(12);

  const faq = [
    {
      q: 'How active is the Costa Rica hiring market right now?',
      text: `Busy enough to hire from. Right now our board holds ${m.total.toLocaleString()} live openings located in Costa Rica from ${m.companies.toLocaleString()} companies, and ${m.remote.toLocaleString()} of them are fully remote. We refresh the board every night, so those counts move with the market.`,
    },
    {
      q: 'What time zone is Costa Rica in, and does it change for daylight saving?',
      text: 'Costa Rica runs on UTC−6 all year and never changes its clocks. In practice a team there shares the whole working day with Chicago and Dallas, and five to six hours with both New York and San Francisco depending on the season.',
    },
    {
      q: 'Is English a problem?',
      text: 'For the roles on this board, no. Costa Rica scores 516 on the EF English Proficiency Index 2025, the "moderate" band, which sounds unremarkable until you notice that more than 400 multinationals run shared-service, support and engineering teams here in English every day. Screen for it in the interview as you would anywhere.',
    },
    {
      q: 'Where do the salary figures come from?',
      text: 'From two places, and we label which is which. Posted pay is computed from live postings on our board, with the number of postings behind every figure. For a handful of roles we also keep benchmarks from named sources with dates (levels.fyi, hiretalent.lat, plane.com and others) on the Costa Rica salary pages. Nothing on this site is an agency\'s "directional" table.',
    },
    {
      q: 'How do I post a role?',
      text: 'Use the Post a job form; it is free during early access. A person reviews every listing, usually within one business day, and then it goes live on the board and on the Costa Rica pages, where the candidates whose skills already match will see it.',
    },
    {
      q: 'What about Costa Rican labor law and employer costs?',
      text: 'We leave that to the people who set it. Minimum wages, social security contributions and leave are statutory and they change; the Ministry of Labor (MTSS) and the CCSS publish them, and your counsel can apply them to your case. What we publish is the market: who is hiring, for what, and what they pay.',
    },
  ];

  return (
    <PageShell v2 active="hire">
      <div className="rtp">
        <Crumbs trail={[{ label: 'Employers', href: '/employers' }, { label: 'Hire in Costa Rica' }]} />
        <PageHead
          kicker="For employers"
          title="Hire in Costa Rica."
          lede={<>Same working hours as Chicago, a services workforce that already runs the back offices and
            engineering teams of more than 400 multinationals, and pay you can read from live postings instead
            of an agency table. Post a role free and it reaches the Costa Rican candidates whose skills already
            match.</>}
          meta={<><span className="lbl">{m.total.toLocaleString()}</span> live openings in Costa Rica &middot;{' '}
            <span className="lbl">{m.companies.toLocaleString()}</span> companies hiring &middot;{' '}
            <span className="lbl">{m.remote.toLocaleString()}</span> fully remote &middot; refreshed nightly</>}
        />
        <p className="rt-head-cta">
          <Link className="rt-go" href="/employers?src=hire-cr">Post a role free &rarr;</Link>
          <a className="gl" href="#pay">See what roles pay today</a>
        </p>

        <section className="rt-sec">
          <h2>Why teams hire here</h2>
          <p className="rt-note">Six reasons, each with a number and the place it comes from. We would rather you check than trust us.</p>
          <ul className="why">
            <li>
              <span className="v">UTC&minus;6</span>
              <span className="k">Your working hours, no clock changes</span>
              <p>Costa Rica does not observe daylight saving. A team there overlaps the full day with US Central time and most of the day with both coasts, all year.</p>
            </li>
            <li>
              <span className="v">400+</span>
              <span className="k">Multinationals already operating here</span>
              <p>More than 400 multinational companies run under the free-trade-zone regime, many of them shared-service, engineering and life-science operations. In 2024 alone CINDE supported 73 investment projects that added 5,482 net jobs.</p>
              <span className="src lbl"><a href={SOURCES.cinde.url} target="_blank" rel="noopener noreferrer">{SOURCES.cinde.label}</a></span>
            </li>
            <li>
              <span className="v">$16.1B</span>
              <span className="k">Services exported in 2024, 17% of GDP</span>
              <p>Business services were the largest slice at $6.7 billion and ICT added $2.4 billion, with services exports growing about 8% a year over five years. This is a workforce that already sells its work abroad.</p>
              <span className="src lbl"><a href={SOURCES.procomer.url} target="_blank" rel="noopener noreferrer">{SOURCES.procomer.label}</a> &middot; <a href={SOURCES.wto.url} target="_blank" rel="noopener noreferrer">{SOURCES.wto.label}</a></span>
            </li>
            <li>
              <span className="v">516</span>
              <span className="k">English, measured rather than promised</span>
              <p>Costa Rica sits in the EF English Proficiency Index&rsquo;s moderate band for 2025. That is an honest number, and it coexists with hundreds of multinationals working in English here daily. Screen for it in the interview; the candidates on this board expect you to.</p>
              <span className="src lbl"><a href={SOURCES.ef.url} target="_blank" rel="noopener noreferrer">{SOURCES.ef.label}</a></span>
            </li>
            <li>
              <span className="v">2021</span>
              <span className="k">OECD member since May 2021</span>
              <p>Not a hiring argument by itself, but it tells you what kind of institutions you are dealing with when you sign a contract there.</p>
              <span className="src lbl"><a href={SOURCES.oecd.url} target="_blank" rel="noopener noreferrer">{SOURCES.oecd.label}</a></span>
            </li>
            <li>
              <span className="v">{m.total.toLocaleString()}</span>
              <span className="k">Live openings on this board, today</span>
              <p>From {m.companies.toLocaleString()} companies, with the posted pay and the skills each posting asks for. The table below is that market, by role.</p>
              <span className="src lbl">PivotHop, live postings located in Costa Rica, refreshed nightly</span>
            </li>
          </ul>
        </section>

        <section className="rt-sec" id="pay">
          <h2>What roles pay here, today</h2>
          <p className="rt-note">
            Every role with six or more live Costa Rica openings on our board. The posted band is the middle half
            of pay across postings that state it, and we only show it where five or more do. Open a role for the
            companies hiring it and the skills they ask for.
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

        {topCos.length >= 3 && (
          <section className="rt-sec">
            <h2>Who is already hiring in Costa Rica</h2>
            <p className="rt-note">The companies with the most live Costa Rica postings on our board right now. Your competition for this talent, and proof the talent is there.</p>
            <ul className="rt-rel">
              {topCos.map(([co, n]) => {
                const slug = slugByName.get(co);
                return (
                  <li key={co}>
                    {slug ? <Link href={`/companies/${slug}`}>{co}</Link> : <span>{co}</span>}
                    <span className="lbl">{n} live in CR</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="rt-sec">
          <h2>How it works</h2>
          <ol className="cg-steps">
            <li><span className="n">01</span><span><span className="t">Post the role, free</span><span className="d">The form takes ten minutes, or paste a posting you already have and it fills itself. No account needed during early access.</span></span></li>
            <li><span className="n">02</span><span><span className="t">A person reviews it</span><span className="d">Usually within one business day. We check that it is a real role with a real way to apply, then publish it on the board and on the Costa Rica pages.</span></span></li>
            <li><span className="n">03</span><span><span className="t">The right people see it</span><span className="d">Every listing is matched to the candidates whose measured skills already reach it, including people in adjacent roles a title search would never show you. Applications go straight to you.</span></span></li>
          </ol>
        </section>

        {CR_BENCHMARKS.length > 0 && (
          <section className="rt-sec">
            <h2>Salary benchmarks with named sources</h2>
            <p className="rt-note">
              For {CR_BENCHMARKS.length} roles we also keep published benchmarks, each with its source, its date and
              the market it measures (multinational compensation, remote foreign employers, contractor rates), so a
              local salary is never quietly averaged with a US one.
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
        )}

        <section className="rt-cta">
          <div>
            <h2>Ready to hire in Costa Rica?</h2>
            <p>Post the role free. A person reviews it within a business day, and it is shown to the Costa Rican candidates whose skills already match, on the board and on these pages.</p>
          </div>
          <Link className="rt-go" href="/employers?src=hire-cr">Post a role free &rarr;</Link>
        </section>

        <div className="post-faq rt-faq">
          <h2>Questions employers ask us</h2>
          {faq.map((f) => (
            <details key={f.q} name="pagefaq"><summary>{f.q}</summary><p>{f.text}</p></details>
          ))}
        </div>

        <p className="rt-method lbl">
          Live figures are computed nightly from postings located in Costa Rica on sources that allow
          re-display; every external figure above links to its source. PivotHop is a job board, not an employer
          of record or an agency, and gives no legal or tax guidance. For statutory questions, start with the{' '}
          <a href="https://www.mtss.go.cr/" rel="noopener noreferrer" target="_blank">Ministerio de Trabajo (MTSS)</a>.
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
