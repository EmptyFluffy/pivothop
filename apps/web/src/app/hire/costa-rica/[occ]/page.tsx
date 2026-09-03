import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '../../../components/SiteChrome';
import { hireOccSlugs, getHireOcc, crJobsFor } from '../hire-data';
import { occTitle } from '../../../jobs/jobs-data';
const article = (w: string) => (/^[aeiou]/i.test(w) ? 'an' : 'a');
import { careerFacts } from '../../../career-guides/facts';
import { getSalary, usBand, coverableSlugs } from '../../../salary/salary-data';
import { CR_BENCHMARKS } from '../../../salary/by-country/costa-rica/benchmarks';
import { postedLabel } from '../../../jobs/JobCard';
import JobsList from '../../../jobs/JobsList';
import { Crumbs } from '../../../components/Crumbs';
import { PageHead } from '../../../components/PageHead';

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

  /* Answers written for the person asking, in full sentences that still say
     where every number comes from (founder note, 2026-09-02). */
  const cos = h.companies.slice(0, 3).map(([co]) => co);
  const coList = cos.length === 3 ? `${cos[0]}, ${cos[1]} and ${cos[2]}` : cos.join(' and ');
  const faq: { q: string; text: string }[] = [
    {
      q: `Who is hiring ${tl}s in Costa Rica right now?`,
      text: `${h.companies.length >= 6 ? 'At least ' : ''}${h.companies.length} companies have live ${tl} postings located in Costa Rica on our board right now${cos.length ? `, among them ${coList}` : ''}. The newest posting went up ${postedLabel(h.newest)}, and the list refreshes every night.`,
    },
  ];
  if (h.band) faq.push({
    q: `What does a ${tl} cost in Costa Rica?`,
    text: `Here is what employers are offering in public, not an estimate: ${h.band.n} of the ${h.n} live Costa Rica postings for this role state pay, and across those the middle half runs from $${h.band.p25}k to $${h.band.p75}k a year. Postings that stay silent are not guessed at. If you want the published benchmarks with their sources, the Costa Rica salary page for this role has them.`,
  });
  if (skills.length >= 3) faq.push({
    q: `What should a ${tl} job description ask for?`,
    text: `Start with what the market already asks for. Across the ${tl} postings our board reads, the skills named most often are ${skills.slice(0, 3).map((s) => s.skill.replace(/-/g, ' ')).join(', ')}. Those are board-wide shares, so treat them as the baseline a Costa Rican candidate will expect to see, then add what makes your role different.`,
  });
  faq.push({
    q: 'Does the time zone work with a US or European team?',
    text: 'Yes, and better than most nearshore options. Costa Rica sits at UTC−6 all year with no daylight saving, so a team there shares the full working day with US Central time, five to six hours with both US coasts, and a two-to-three-hour morning overlap with Western Europe.',
  });
  faq.push({
    q: 'How do I post the role?',
    text: 'Use the Post a job form; it is free during early access. A person reviews it, usually within one business day, and it goes live on the board and on this page, where the Costa Rican candidates whose skills already match will see it.',
  });

  return (
    <PageShell v2 active="hire">
      <div className="rtp">
        <Crumbs trail={[{ label: 'Employers', href: '/employers' }, { label: 'Hire in Costa Rica', href: '/hire/costa-rica' }, { label: title }]} />
        <PageHead
          kicker={<>For employers &middot; Costa Rica</>}
          title={<>Hire {tl}s in Costa Rica</>}
          lede={<>Hiring {article(tl)} {tl} in Costa Rica? Here is what the {h.n} live local postings pay, who else is
            hiring for it, and the skills they ask for. Read it before you write the job description and your
            posting will sound like the market it is entering.</>}
          meta={<><span className="lbl">{h.n}</span> live CR postings &middot;{' '}
            <span className="lbl">{h.remote}</span> remote &middot; newest {postedLabel(h.newest)}</>}
        />
        <p className="rt-head-cta">
          <Link className="rt-go" href={`/employers?src=hire-cr&occ=${occ}`}>Post {article(tl)} {tl} role free &rarr;</Link>
          <Link className="gl" href="/hire/costa-rica">Why teams hire in Costa Rica</Link>
        </p>

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
                claim is computed between them. Subtract for yourself.
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
            <p className="rt-note">The skills most named in {tl} postings across this board (board-wide shares), a base for writing a description that reads like the market.</p>
            <ul className="rt-rel">
              {skills.map((s) => (
                <li key={s.skill}><span>{s.skill.replace(/-/g, ' ')}</span><span className="lbl">{s.sharePct}% of postings</span></li>
              ))}
            </ul>
          </section>
        )}

        <JobsList
          jobs={jobs}
          limit={8}
          total={jobs.length}
          heading="The live CR postings"
          note={`Every ${tl} posting located in Costa Rica on this board, freshest first. Apply at the source.`}
          allHref={`/jobs/${occ}?c=CR`}
          allLabel={`All ${jobs.length} Costa Rican ${tl} postings on the board`}
        />

        <section className="rt-cta">
          <div>
            <h2>Ready to hire {article(tl)} {tl} in Costa Rica?</h2>
            <p>Post the role free. A person reviews it within a business day, and it is shown to the Costa Rican candidates whose skills already match, on the board and on this page.</p>
          </div>
          <Link className="rt-go" href={`/employers?src=hire-cr&occ=${occ}`}>Post a role free &rarr;</Link>
        </section>

        <div className="post-faq rt-faq">
          <h2>Quick answers</h2>
          {faq.map((f) => (
            <details key={f.q} name="pagefaq"><summary>{f.q}</summary><p>{f.text}</p></details>
          ))}
        </div>

        <p className="rt-method lbl">
          Computed nightly from live Costa Rica postings on re-displayable sources. PivotHop is a job board,
          not an employer of record or an agency, and offers no legal or tax guidance. For statutory
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
