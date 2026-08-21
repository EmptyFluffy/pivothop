import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '../../components/SiteChrome';
import { careerFacts, guidedSlugs } from '../facts';
import { skillEntries } from '../../jobs/skill-entries';
import { benefitEntries } from '../../jobs/benefit-entries';
import SkillStrip from '../../jobs/SkillStrip';
import BenefitStrip from '../../jobs/BenefitStrip';
import JobsList from '../../jobs/JobsList';
import { COUNTRY_NAMES } from '../../salary/salary-data';
import { hasOriginPage, routePair } from '../../routes/routes-data';
import { article } from '../../../lib/site';

/* The career guide. Everything numeric on this page is computed at request time
   from the live corpus (facts.ts); only the judgement prose comes from the
   generated file, and it carries the date it was written. That split is the
   point: a competitor's guide is a language model's recollection of a job, this
   one re-prices itself every night and every figure links to the page that
   proves it. */

export const dynamic = 'force-static';

export function generateStaticParams() {
  return guidedSlugs().map((occ) => ({ occ }));
}

export async function generateMetadata({ params }: { params: Promise<{ occ: string }> }): Promise<Metadata> {
  const { occ } = await params;
  const f = careerFacts(occ);
  if (!f) return {};
  const pay = f.salary ? `Median ${fmt(f.salary.p50)}.` : '';
  const tl = f.title.toLowerCase();
  return {
    // The head term for this page is the how-to query, not "career guide".
    title: `How to become ${article(f.title)} ${tl}: the job, the pay, and the way in`,
    description: `What ${article(f.title)} ${tl} does day to day, what the work pays, how long it takes to qualify, and which occupations already have most of what it asks for. ${pay} Measured from ${f.liveOpenings.toLocaleString()} live openings and updated nightly.`,
    alternates: { canonical: `/careers/${occ}` },
  };
}

const fmt = (v: number) => '$' + Math.round(v / 1000) + 'k';
const pretty = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default async function CareerGuide({ params }: { params: Promise<{ occ: string }> }) {
  const { occ } = await params;
  const f = careerFacts(occ);
  if (!f || !f.guide) notFound();
  const p = f.guide.prose;
  const tl = f.title.toLowerCase();
  const edu = f.gates.education;
  const eduPct = (state: string) => (f.gates.educationTotal ? Math.round(((edu[state] ?? 0) / f.gates.educationTotal) * 100) : 0);

  return (
    <PageShell v2 active="careers">
      <div className="rtp cg">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb">
          <Link href="/">Instrument</Link><span>/</span><Link href="/careers">Careers</Link><span>/</span><span>{f.title}</span>
        </nav>

        <p className="jb-vmeta">
          {f.field} &middot; {f.liveOpenings.toLocaleString()} open now
          {f.postingsRead ? <> &middot; {f.postingsRead.toLocaleString()} postings read</> : null}
        </p>
        <h1 className="rt-h1">{f.title}</h1>
        <p className="cg-summary">{p.summary}</p>

        <div className="rt-facts">
          {f.salary && <div><span className="v">{fmt(f.salary.p50)}</span><span className="k">Median pay</span></div>}
          <div><span className="v">{f.liveOpenings.toLocaleString()}</span><span className="k">Open right now</span></div>
          <div><span className="v">{f.remoteSharePct}%</span><span className="k">Fully remote</span></div>
          {f.gates.expMedianYears != null && (
            <div><span className="v">{f.gates.expMedianYears}+ yrs</span><span className="k">Experience asked</span></div>
          )}
          {f.yearlySwitchPct != null && (
            <div><span className="v">{f.yearlySwitchPct}%</span><span className="k">Switch out yearly</span></div>
          )}
        </div>

        <section className="cg-lead">
          <h2>What the work looks like</h2>
          <p>{p.day_to_day}</p>
        </section>

        <section className="rt-sec">
          <h2>Where you do it</h2>
          <p className="cg-p">{p.work_environment}</p>
        </section>

        {f.salary && (
          <section className="rt-sec">
            <h2>What it pays</h2>
            <p className="rt-note">
              Blended from live postings and the official OEWS anchor
              {f.salary.n ? `, ${f.salary.n.toLocaleString()} stated salaries` : ''}. The full picture, by seniority
              and by market, is on the <Link className="gl" href={`/salary/${occ}`}>{tl} salary page</Link>.
            </p>
            <div className="cg-band">
              <div><span className="v">{fmt(f.salary.p25)}</span><span className="k">25th</span></div>
              <div className="mid"><span className="v">{fmt(f.salary.p50)}</span><span className="k">Median</span></div>
              <div><span className="v">{fmt(f.salary.p75)}</span><span className="k">75th</span></div>
            </div>
          </section>
        )}

        <section className="rt-sec">
          <h2>What it asks for</h2>
          <p className="rt-note">The skills these postings name most often, and the gates they state.</p>
          <SkillStrip skills={skillEntries(f.topSkills.map((s) => s.skill))} />
          {p.tools && <p className="cg-p cg-tools">{p.tools}</p>}
          <div className="jd-gates" aria-label="Stated gates">
            {f.gates.expMedianYears != null && (
              <div data-gate="exp">
                <span className="k">Experience</span>
                <span className="v">{f.gates.expMedianYears}+ years</span>
              </div>
            )}
            {f.gates.educationTotal > 0 && (
              <div data-gate="edu">
                <span className="k">Degree</span>
                <span className="v">{eduPct('required')}% require it</span>
              </div>
            )}
            {eduPct('waived') > 0 && (
              <div data-gate="waived">
                <span className="k">Degree waived</span>
                <span className="v">{eduPct('waived')}% accept equivalent</span>
              </div>
            )}
            {f.gates.languages.length > 0 && (
              <div data-gate="lang">
                <span className="k">Language</span>
                <span className="v">{f.gates.languages.map((l) => l.language).join(' · ')}</span>
              </div>
            )}
          </div>
        </section>

        <section className="rt-sec">
          <h2>How to become {article(f.title)} {tl}</h2>
          <p className="cg-p">{p.getting_in}</p>
          {f.licence && (
            <div className="cg-lic">
              <span className="lbl">The credential gate</span>
              <h3>{f.licence.gate}</h3>
              <p className="cg-lic-path">{f.licence.path}</p>
              <div className="cg-lic-meta">
                <div><span className="k">How long</span><span className="v">{f.licence.time}</span></div>
                {f.licence.body && (
                  <div><span className="k">Awarded by</span><span className="v">
                    <a href={f.licence.body.url} target="_blank" rel="noopener noreferrer">{f.licence.body.name}</a>
                  </span></div>
                )}
              </div>
              {f.licence.note && <p className="cg-lic-note">{f.licence.note}</p>}
              <Link className="gl" href={`/licenses#${f.licence.anchor ?? `occ-${occ}`}`}>Full licence detail</Link>
            </div>
          )}
        </section>

        <section className="rt-sec">
          <h2>How it progresses</h2>
          <p className="cg-p">{p.ladder}</p>
        </section>

        {f.topBenefits.length > 0 && (
          <section className="rt-sec">
            <h2>What it offers</h2>
            <p className="rt-note">Benefits these postings state, most common first. Silence means the employer said nothing, not that the benefit is missing.</p>
            <BenefitStrip benefits={benefitEntries(f.topBenefits.map((b) => b.benefit))} />
          </section>
        )}

        {/* The section no competitor's guide can generate. */}
        {f.routesIn.length > 0 && (
          <section className="rt-sec">
            <h2>Who already qualifies</h2>
            <p className="rt-note">{p.who_qualifies}</p>
            <ul className="rt2-ranked cg-in">
              {f.routesIn.map((r) => {
                const slug = `${r.from}-to-${occ}`;
                const linked = !!routePair(slug);
                const label = <>{r.fromTitle} &rarr; {f.title}</>;
                return (
                  <li key={r.from}>
                    <span className="rt2-r-main">
                      {linked ? <Link href={`/routes/${slug}`}>{label}</Link> : <span className="rt2-r-dead">{label}</span>}
                      <span className="rt-bar" aria-hidden="true"><i style={{ width: `${Math.max(2, Math.min(100, r.matchPct))}%` }} /></span>
                    </span>
                    <span className="rt2-r-m">{r.matchPct}%</span>
                    <span className="rt2-r-s">already covered</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {f.routesOut.length > 0 && (
          <section className="rt-sec">
            <h2>Where it leads</h2>
            <p className="rt-note">
              The measured moves out of {tl}, ranked by how much of the destination a typical profile already covers.
              {hasOriginPage(occ) ? <> The full set is on <Link className="gl" href={`/routes/${occ}`}>alternative careers for {tl}s</Link>.</> : null}
            </p>
            <ul className="rt2-ranked">
              {f.routesOut.map((r) => {
                const slug = `${occ}-to-${r.id}`;
                const linked = !!routePair(slug);
                const label = <>{f.title} &rarr; {r.to}</>;
                return (
                  <li key={r.id}>
                    <span className="rt2-r-main">
                      {linked ? <Link href={`/routes/${slug}`}>{label}</Link> : <span className="rt2-r-dead">{label}</span>}
                      <span className="rt-bar" aria-hidden="true"><i style={{ width: `${Math.max(2, Math.min(100, r.matchPct))}%` }} /></span>
                    </span>
                    <span className="rt2-r-m">{r.matchPct}%</span>
                    <span className="rt2-r-s">{r.salary ?? '·'}{r.licensed ? ' · licence' : ''}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="rt-sec">
          <h2>Who it suits</h2>
          <p className="cg-p">{p.suits}</p>
          {(p.pros?.length || p.cons?.length) ? (
            <div className="cg-pc">
              <div>
                <span className="lbl good">What is good about it</span>
                <ul>{p.pros?.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
              <div>
                <span className="lbl bad">What is not</span>
                <ul>{p.cons?.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            </div>
          ) : null}
        </section>

        {p.misconceptions && (
          <section className="rt-sec">
            <h2>What people get wrong</h2>
            <p className="cg-p">{p.misconceptions}</p>
          </section>
        )}

        {p.industries?.length > 0 && (
          <section className="rt-sec">
            <h2>Where the work sits</h2>
            <ul className="cg-list">
              {p.industries.map((i) => (
                <li key={i.name}><span className="t">{i.name}</span><span className="d">{i.note}</span></li>
              ))}
            </ul>
          </section>
        )}

        {p.specializations?.length > 0 && (
          <section className="rt-sec">
            <h2>Where to go deep</h2>
            <ul className="cg-list">
              {p.specializations.map((i) => (
                <li key={i.name}><span className="t">{i.name}</span><span className="d">{i.why}</span></li>
              ))}
            </ul>
          </section>
        )}

        {f.countries.length > 1 && (
          <section className="rt-sec">
            <h2>Where it hires</h2>
            <ul className="sal-states cg-countries">
              {f.countries.map((c) => (
                <li key={c.country}>
                  <span className="c">{COUNTRY_NAMES[c.country] ?? c.country}</span>
                  <span className="n">{c.n.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rt-sec">
          <h2>What the numbers miss</h2>
          <p className="rt-note cg-miss">{p.what_the_numbers_miss}</p>
        </section>

        {p.faq?.length > 0 && (
          <div className="post-faq rt-faq">
            <h2>Quick answers</h2>
            {p.faq.map((q) => (
              <details key={q.q} name="pagefaq"><summary>{q.q}</summary><p>{q.a}</p></details>
            ))}
          </div>
        )}

        <JobsList occ={occ} v2 heading={`Open ${tl} roles`} />

        <p className="rt-method lbl">
          Every figure here is computed from the live corpus at build time and moves with the nightly scrape:
          pay from posted salaries blended with the official <a className="gl" href="/glossary#oews">OEWS</a> anchor,
          skills and benefits read from posting text, readiness from measured skill overlap. The judgement,
          who-qualifies and answers above were written on {f.guide.generated} against those same measurements and
          are reviewed by hand.
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
        {
          '@context': 'https://schema.org', '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Careers', item: 'https://www.pivothop.com/careers' },
            { '@type': 'ListItem', position: 2, name: f.title, item: `https://www.pivothop.com/careers/${occ}` },
          ],
        },
        {
          '@context': 'https://schema.org', '@type': 'Occupation',
          name: f.title, occupationalCategory: f.field, description: p.summary,
          ...(f.salary ? {
            estimatedSalary: {
              '@type': 'MonetaryAmountDistribution', name: 'base', currency: 'USD', unitText: 'YEAR',
              percentile25: f.salary.p25, median: f.salary.p50, percentile75: f.salary.p75,
            },
          } : {}),
          occupationLocation: f.countries.map((c) => ({ '@type': 'Country', name: COUNTRY_NAMES[c.country] ?? c.country })),
          skills: f.topSkills.map((s) => pretty(s.skill)).join(', '),
        },
        ...(p.faq?.length ? [{
          '@context': 'https://schema.org', '@type': 'FAQPage',
          mainEntity: p.faq.map((q) => ({
            '@type': 'Question', name: q.q,
            acceptedAnswer: { '@type': 'Answer', text: q.a },
          })),
        }] : []),
      ]) }} />
    </PageShell>
  );
}
