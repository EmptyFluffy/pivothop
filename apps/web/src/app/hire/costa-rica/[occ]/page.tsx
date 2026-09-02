import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '../../../components/SiteChrome';
import { hireOccSlugs, getHireOcc, crJobsFor } from '../hire-data';
import { occTitle } from '../../../jobs/jobs-data';
import { careerFacts } from '../../../career-guides/facts';
import { getSalary, usBand, coverableSlugs } from '../../../salary/salary-data';
import { CR_BENCHMARKS } from '../../../salary/by-country/costa-rica/benchmarks';
import { salaryLabel, postedLabel } from '../../../jobs/JobCard';

/* Per-role employer page for Costa Rica. The two-figure comparison (CR posted
   vs US) shows both numbers with their sources and sample sizes and lets the
   reader subtract — it never computes a "% cheaper" claim, because the two
   figures measure different things and pretending otherwise is the
   "directional" agency-table trick this family exists to beat. */

export function generateStaticParams() {
  return hireOccSlugs().map((occ) => ({ occ }));
}

export async function generateMetadata({ params }: { params: Promise<{ occ: string }> }): Promise<Metadata> {
  const { occ } = await params;
  const h = getHireOcc(occ);
  if (!h) return {};
  const title = occTitle(occ);
  return {
    title: `Hire ${title.toLowerCase()}s in Costa Rica: ${h.n} live postings measured`,
    description: `What hiring a ${title.toLowerCase()} in Costa Rica looks like right now: ${h.n} live local postings${h.band ? `, posted pay $${h.band.p25}k–$${h.band.p75}k` : ''}, the companies already hiring, and the skills postings ask for. Computed nightly, sample sizes included.`,
    alternates: { canonical: `/hire/costa-rica/${occ}` },
  };
}

export default async function HireOccPage({ params }: { params: Promise<{ occ: string }> }) {
  const { occ } = await params;
  const h = getHireOcc(occ);
  if (!h) notFound();
  const title = occTitle(occ);
  const tl = title.toLowerCase();
  const jobs = crJobsFor(occ).sort((a, b) => (b.posted || '').localeCompare(a.posted || ''));
  const facts = careerFacts(occ);
  const skills = (facts?.topSkills ?? []).slice(0, 6);
  const us = coverableSlugs().includes(occ) ? usBand(getSalary(occ)!) : null;
  const bench = CR_BENCHMARKS.find((b) => b.slug === occ) ?? null;

  const faq: { q: string; text: string }[] = [
    {
      q: `How many companies are hiring ${tl}s in Costa Rica right now?`,
      text: `${h.companies.length >= 6 ? 'At least ' : ''}${h.companies.length} companies hold the ${h.n} live CR postings on this board; the newest was posted ${postedLabel(h.newest)}. Refreshed nightly.`,
    },
  ];
  if (h.band) faq.push({
    q: `What does a ${tl} cost in Costa Rica?`,
    text: `Of the ${h.n} live CR postings, ${h.band.n} state pay; the posted middle band runs $${h.band.p25}k–$${h.band.p75}k a year. That is what employers are offering in public postings right now — not an estimate.`,
  });
  if (skills.length >= 3) faq.push({
    q: `What skills should a ${tl} job description ask for?`,
    text: `Across the postings this board reads for the role, the most-named skills are ${skills.slice(0, 3).map((s) => s.skill.replace(/-/g, ' ')).join(', ')} — board-wide shares, a starting point for a realistic description.`,
  });
  faq.push({
    q: 'Does the time zone work with a US or European team?',
    text: 'Costa Rica sits at UTC−6 year-round with no daylight saving: full overlap with US Central time, five or more shared hours with both US coasts, and a two-to-three-hour morning overlap with Western Europe.',
  });

  return (
    <PageShell v2 active="employers">
      <div className="rtp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb">
          <Link href="/">PivotHop</Link><span>/</span>
          <Link href="/hire/costa-rica">Hire in Costa Rica</Link><span>/</span>
          <span>{title}</span>
        </nav>
        <header className="rt-head">
          <p className="lbl acc">For employers &middot; Costa Rica</p>
          <h1 className="rt-h1">Hire {tl}s in Costa Rica</h1>
          <p className="jb-lede">
            The live market, measured: what Costa Rican {tl} postings pay, who is already hiring, and what the
            postings ask for. Every figure carries its sample size and regenerates nightly.
          </p>
          <p className="jb-vmeta">
            <span className="lbl">{h.n}</span> live CR postings &middot;{' '}
            <span className="lbl">{h.remote}</span> remote &middot; newest {postedLabel(h.newest)}
          </p>
        </header>

        {(h.band || us) && (
          <section className="rt-sec">
            <h2>What the postings pay</h2>
            <div className="occ-tblwrap">
              <table className="occ-tbl">
                <thead><tr><th>Measure</th><th>Band</th><th>Sample</th></tr></thead>
                <tbody>
                  {h.band && (
                    <tr>
                      <td>Costa Rica, posted pay (this board)</td>
                      <td className="n">${h.band.p25}k–${h.band.p75}k</td>
                      <td className="n">{h.band.n} postings</td>
                    </tr>
                  )}
                  {us && us.p25 != null && us.p75 != null && (
                    <tr>
                      <td>United States, same role (<Link className="gl" href={`/salary/${occ}`}>method</Link>)</td>
                      <td className="n">${Math.round(us.p25 / 1000)}k–${Math.round(us.p75 / 1000)}k</td>
                      <td className="n">{facts?.salary?.n ? `${facts.salary.n.toLocaleString()} postings` : 'blended'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className="rt-note occ-tbl-note">
                Two different measures, shown side by side on purpose: the CR figure is pay posted in Costa
                Rica listings on this board; the US figure is the same role&rsquo;s US band. No percentage
                claim is computed between them — subtract for yourself.
                {bench && <>{' '}Sourced CR benchmarks for this role, with lenses and dates: <Link className="gl" href={`/salary/by-country/costa-rica/${occ}`}>{tl} salary in Costa Rica</Link>.</>}
              </p>
            </div>
          </section>
        )}

        {h.companies.length >= 3 && (
          <section className="rt-sec">
            <h2>Already hiring {tl}s in Costa Rica</h2>
            <p className="rt-note">Your competition for this talent, from live postings.</p>
            <ul className="rt-rel">
              {h.companies.map(([co, n]) => (
                <li key={co}><span>{co}</span><span className="lbl">{n} live</span></li>
              ))}
            </ul>
          </section>
        )}

        {skills.length >= 3 && (
          <section className="rt-sec">
            <h2>What the postings ask for</h2>
            <p className="rt-note">The skills most named in {tl} postings across this board (board-wide shares) — a base for writing a description that reads like the market.</p>
            <ul className="rt-rel">
              {skills.map((s) => (
                <li key={s.skill}><span>{s.skill.replace(/-/g, ' ')}</span><span className="lbl">{s.sharePct}% of postings</span></li>
              ))}
            </ul>
          </section>
        )}

        <section className="rt-sec">
          <h2>The live CR postings</h2>
          <ul className="rt-rel">
            {jobs.slice(0, 8).map((j) => (
              <li key={`${j.occ}-${j.id}`}>
                <Link href={`/jobs/${j.occ}/${j.id}`}>{j.title}</Link>
                <span className="lbl">{[j.company, salaryLabel(j.smin, j.smax), postedLabel(j.posted)].filter(Boolean).join(' · ')}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rt-cta">
          <div>
            <h2>Post your {tl} role</h2>
            <p>Free during early access, reviewed by a person, and shown to the candidates whose skills already reach it — including the Costa Rican audience on this board.</p>
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
          Computed nightly from live Costa Rica postings on re-displayable sources. PivotHop is a job board,
          not an employer of record or an agency, and offers no legal or tax guidance — for statutory
          questions, start at the MTSS.
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
          { '@type': 'ListItem', position: 2, name: 'Hire in Costa Rica', item: 'https://www.pivothop.com/hire/costa-rica' },
          { '@type': 'ListItem', position: 3, name: `Hire ${tl}s in Costa Rica`, item: `https://www.pivothop.com/hire/costa-rica/${occ}` },
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
