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
import { COUNTRY_NAMES, coverable } from '../../salary/salary-data';
import { hasOriginPage, routePair } from '../../routes/routes-data';
import { article } from '../../../lib/site';
import { Crumbs } from '../../components/Crumbs';
import { PageHead } from '../../components/PageHead';
import { companiesRanked } from '../../companies/companies-data';

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
  const pay = f.salary ? `${f.salary.scope === 'US' ? 'U.S. median' : 'Global median'} ${fmt(f.salary.p50)}.` : '';
  const tl = f.title.toLowerCase();
  return {
    title: `How to become ${article(f.title)} ${tl}: salary, skills and steps`,
    description: `Learn what ${article(f.title)} ${tl} does, how to qualify, what employers ask for and where the career can lead. ${pay} Updated from current PivotHop listings.`,
    alternates: { canonical: `/career-guides/${occ}` },
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
  const coSlug = new Map(companiesRanked().map((c) => [c.name, c.slug]));
  // the written FAQ plus the questions the board can answer today, in full sentences
  const faq: { q: string; a: string }[] = [
    ...(p.faq ?? []),
    {
      q: `Can ${article(f.title)} ${tl} work remotely?`,
      a: f.remoteSharePct >= 40
        ? `Often, yes. ${f.remoteSharePct}% of the ${f.liveOpenings.toLocaleString()} ${tl} openings on our board right now are fully remote, so it is a realistic ask rather than an exception. The rest name a city or say on-site, and every listing tells you which.`
        : f.remoteSharePct >= 10
          ? `Sometimes. ${f.remoteSharePct}% of the ${f.liveOpenings.toLocaleString()} ${tl} openings on our board right now are fully remote. It exists, but most employers still want you in a place, so filter for it early rather than assuming it.`
          : `Rarely. Only ${f.remoteSharePct}% of the ${f.liveOpenings.toLocaleString()} ${tl} openings on our board are fully remote, which tells you most of this work happens somewhere specific. Hybrid arrangements are more common than fully remote ones here.`,
    },
    {
      q: `How many ${tl} jobs are open right now?`,
      a: `Right now there are ${f.liveOpenings.toLocaleString()} ${tl} openings on our board${f.fresh.week > 0 ? `, and ${f.fresh.week.toLocaleString()} of them were posted in the last seven days` : ''}.${f.topCompanies[0] ? ` ${f.topCompanies[0].name} is hiring the most at the moment.` : ''} The board refreshes every night, so the number moves with the market.`,
    },
  ];
  const toc: [string, string][] = [
    ['work', 'What the work is like'],
    ...(p.responsibilities?.length ? [['does', `What ${article(f.title)} ${tl} does`] as [string, string]] : []),
    ...(f.salary ? [['pay', 'What it pays'] as [string, string]] : []),
    ['asks', 'What employers ask for'],
    ['become', `How to become ${article(f.title)} ${tl}`],
    ['path', 'How the career progresses'],
    ['market', 'The market this week'],
    ...(f.routesIn.length ? [['from', 'Who already has relevant skills'] as [string, string]] : []),
    ...(f.routesOut.length ? [['leads', 'Where it leads'] as [string, string]] : []),
    ['suit', 'Who this career tends to suit'],
    ...(p.faq?.length ? [['faq', 'Quick answers'] as [string, string]] : []),
  ];

  return (
    <PageShell v2 active="careers">
      <div className="rtp cg">
        <Crumbs trail={[{ label: 'Career guides', href: '/career-guides' }, { label: f.title }]} />

        <PageHead
          kicker={f.field}
          title={<>How to become {article(f.title)} {tl}</>}
          lede={p.summary}
          meta={<>
            <span className="lbl">{f.liveOpenings.toLocaleString()}</span> open on PivotHop now
            {f.postingsRead ? <> &middot; <span className="lbl">{f.postingsRead.toLocaleString()}</span> postings read</> : null}
          </>}
        />

        <div className="rt-facts">
          {f.salary && <div><span className="v">{fmt(f.salary.p50)}</span><span className="k">{f.salary.scope === 'US' ? 'U.S. median pay' : 'Global median pay'}</span></div>}
          <div><span className="v">{f.liveOpenings.toLocaleString()}</span><span className="k">Open on PivotHop</span></div>
          <div><span className="v">{f.remoteSharePct}%</span><span className="k">PivotHop listings remote</span></div>
          {f.gates.expMedianYears != null && (
            <div><span className="v">{f.gates.expMedianYears}+ yrs</span><span className="k">Median stated experience</span></div>
          )}
        </div>

        <nav className="cg-toc" aria-label="On this page">
          {toc.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
        </nav>

        <section className="cg-lead" id="work">
          <h2>What the work is like</h2>
          {/* prose carries paragraph breaks as blank lines (2026-09-08): render each as its own <p> */}
          {p.day_to_day.split(/\n\s*\n/).map((para, i) => <p key={`d${i}`}>{para}</p>)}
          {p.work_environment.split(/\n\s*\n/).map((para, i) => <p key={`w${i}`} className="cg-p">{para}</p>)}
        </section>

        {p.responsibilities && p.responsibilities.length > 0 && (
          <section className="rt-sec" id="does">
            <h2>What {article(f.title)} {tl} does</h2>
            <p className="rt-note">The work, as a list of things you are actually responsible for.</p>
            <ul className="cg-resp">{p.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul>
          </section>
        )}

        {f.salary && (
          <section className="rt-sec" id="pay">
            <h2>What it pays</h2>
            <p className="rt-note">
              This range uses {f.salary.scope === 'US' ? 'U.S.' : 'global'} {f.salary.source === 'blended' ? 'posted salaries blended with the OEWS benchmark' : f.salary.source === 'posted' ? 'posted salaries' : 'salary data'}
              {f.salary.n ? `, with ${f.salary.n.toLocaleString()} stated salaries` : ''}.
              {/* the salary page only builds for coverable slugs — link with the same gate, or the link gate catches a 404 */}
              {coverable(occ) && <> See the <Link className="gl" href={`/salary/${occ}`}>{tl} salary page</Link> for seniority and market detail.</>}
            </p>
            <div className="cg-band">
              <div><span className="v">{fmt(f.salary.p25)}</span><span className="k">25th</span></div>
              <div className="mid"><span className="v">{fmt(f.salary.p50)}</span><span className="k">Median</span></div>
              <div><span className="v">{fmt(f.salary.p75)}</span><span className="k">75th</span></div>
            </div>
            {f.tiers.some((t) => t.band) && (
              <div className="occ-tblwrap">
                <h3 className="cg-h3">By experience level</h3>
                <table className="occ-tbl">
                  <thead><tr><th>Level</th><th>Live roles</th><th>State pay</th><th>Posted band</th></tr></thead>
                  <tbody>
                    {f.tiers.map((t) => (
                      <tr key={t.key}>
                        <td>{t.label}</td>
                        <td className="n">{t.n.toLocaleString()}</td>
                        <td className="n">{t.band ? t.band.n.toLocaleString() : 'under 5'}</td>
                        <td className="n">{t.band ? `$${t.band.p25}k–$${t.band.p75}k` : 'too few to say'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="rt-note occ-tbl-note">Level is read from the posting title. Bands cover only postings that state pay, and only where five or more do, so a level marked too few simply has under five stated salaries.</p>
              </div>
            )}
            {f.countryBands.length > 1 && (
              <div className="occ-tblwrap">
                <h3 className="cg-h3">By country</h3>
                <table className="occ-tbl">
                  <thead><tr><th>Market</th><th>Stated salaries</th><th>25th</th><th>Median</th><th>75th</th></tr></thead>
                  <tbody>
                    {f.countryBands.map((c) => (
                      <tr key={c.country}>
                        <td>{COUNTRY_NAMES[c.country] ?? c.country}</td>
                        <td className="n">{c.n.toLocaleString()}</td>
                        <td className="n">{fmt(c.p25)}</td>
                        <td className="n">{fmt(c.p50)}</td>
                        <td className="n">{fmt(c.p75)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="rt-note occ-tbl-note">Posted pay converted to US dollars, from postings in each market that state a salary. Cost of living differs; the <Link className="gl" href="/salary/calculator">remote salary calculator</Link> adjusts for it.</p>
              </div>
            )}
          </section>
        )}

        <section className="rt-sec" id="asks">
          <h2>What employers ask for</h2>
          <p className="rt-note">The skills these postings name most often, and the gates they state.</p>
          <SkillStrip skills={skillEntries(f.topSkills.map((s) => s.skill))} />
          {p.tools && <p className="cg-p cg-tools">{p.tools}</p>}
          <div className="jd-gates" aria-label="Stated gates">
            {f.gates.expMedianYears != null && (
              <div data-gate="exp">
                <span className="k">Experience</span>
                <span className="v">{f.gates.expMedianYears}+ years <small>stated in {f.gates.expStatedPct}% of analyzed listings</small></span>
              </div>
            )}
            {f.gates.educationTotal > 0 && (
              <div data-gate="edu">
                <span className="k">Degree</span>
                <span className="v">{eduPct('required')}% of education mentions require it</span>
              </div>
            )}
            {eduPct('waived') > 0 && (
              <div data-gate="waived">
                <span className="k">Degree waived</span>
                <span className="v">{eduPct('waived')}% of education mentions accept equivalent experience</span>
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

        <section className="rt-sec" id="become">
          <h2>How to become {article(f.title)} {tl}</h2>
          <p className="cg-p">{p.getting_in}</p>
          {p.steps?.length > 0 && (
            <ol className="cg-steps">
              {p.steps.map((st, i) => (
                <li key={st.do}>
                  <span className="n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="b">
                    <span className="t">{st.do}</span>
                    <span className="d">{st.how}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
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

        <section className="rt-sec" id="path">
          <h2>How the career progresses</h2>
          {p.ladder.split(/\n\s*\n/).map((para, i) => <p key={`l${i}`} className="cg-p">{para}</p>)}
          {p.levels && p.levels.length > 0 && (
            <ol className="cg-levels">
              {p.levels.map((lv) => (
                <li key={lv.title}>
                  <span className="t">{lv.title}</span>
                  <span className="y">{lv.years}</span>
                  <span className="f">{lv.focus}</span>
                </li>
              ))}
            </ol>
          )}
          {f.similar.length > 0 && (
            <p className="rt-note">
              Titles people weigh against this one, compared from both sets of postings:{' '}
              {f.similar.map((sm, i) => (
                <span key={sm.slug}>{i > 0 ? ' · ' : ''}<Link className="gl" href={`/compare/${sm.slug}`}>{f.title} vs {sm.title}</Link></span>
              ))}.
            </p>
          )}
        </section>

        <section className="rt-sec" id="market">
          <h2>The market this week</h2>
          <p className="rt-note">Live from the board on the day this page was built. The counts move every night.</p>
          <div className="cg-market">
            <div><span className="v">{f.liveOpenings.toLocaleString()}</span><span className="k">open {tl} roles on PivotHop</span></div>
            <div><span className="v">{f.fresh.week.toLocaleString()}</span><span className="k">posted in the last 7 days</span></div>
            {f.fresh.medianDays != null && <div><span className="v">{f.fresh.medianDays}d</span><span className="k">median listing age</span></div>}
            <div><span className="v">{f.remoteSharePct}%</span><span className="k">fully remote</span></div>
            {f.topCompanies.length > 0 && (
              <div>
                <span className="k">Hiring the most right now</span>
                <ul>
                  {f.topCompanies.map((c) => (
                    <li key={c.name}>
                      {coSlug.get(c.name) ? <Link className="gl" href={`/companies/${coSlug.get(c.name)}`}>{c.name}</Link> : <span>{c.name}</span>}
                      <span className="n">{c.n} open</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {f.countries.length > 0 && (
              <div>
                <span className="k">Where the roles are</span>
                <ul>
                  {f.countries.slice(0, 5).map((c) => (
                    <li key={c.country}><span>{COUNTRY_NAMES[c.country] ?? c.country}</span><span className="n">{c.n} open</span></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
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
          <section className="rt-sec" id="from">
            <h2>Who already has relevant skills</h2>
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
          <section className="rt-sec" id="leads">
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

        <section className="rt-sec" id="suit">
          <h2>Who this career tends to suit</h2>
          <p className="cg-p">{p.suits}</p>
          {p.soft_skills && p.soft_skills.length > 0 && (
            <div className="cg-soft" aria-label="Soft skills that matter">{p.soft_skills.map((sk) => <span key={sk}>{sk}</span>)}</div>
          )}
          {(p.pros?.length || p.cons?.length) ? (
            <div className="cg-pc">
              <div>
                <span className="lbl good">What people tend to value</span>
                <ul>{p.pros?.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
              <div>
                <span className="lbl bad">Tradeoffs to understand</span>
                <ul>{p.cons?.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            </div>
          ) : null}
          {p.misconceptions && (
            <>
              <h3>One common misconception</h3>
              <p className="cg-p">{p.misconceptions}</p>
            </>
          )}
          {p.what_the_numbers_miss && (
            <>
              <h3>What listings cannot tell you</h3>
              <p className="rt-note cg-miss">{p.what_the_numbers_miss}</p>
            </>
          )}
        </section>

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


        {faq.length > 0 && (
          <div className="post-faq rt-faq" id="faq">
            <h2>Quick answers</h2>
            {faq.map((q) => (
              <details key={q.q} name="pagefaq"><summary>{q.q}</summary><p>{q.a}</p></details>
            ))}
          </div>
        )}

        <JobsList occ={occ} v2 heading={`Open ${tl} roles`} />

        <p className="rt-method lbl">
          Figures are recomputed from the current PivotHop corpus at build time: salaries from posted ranges and the OEWS benchmark where available, skills and benefits from posting text, and career routes from measured skill overlap. Editorial guidance was produced on {f.guide.generated}; live figures update independently as the job corpus changes.
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
        {
          '@context': 'https://schema.org', '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Career guides', item: 'https://www.pivothop.com/career-guides' },
            { '@type': 'ListItem', position: 2, name: f.title, item: `https://www.pivothop.com/career-guides/${occ}` },
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
        ...(faq.length ? [{
          '@context': 'https://schema.org', '@type': 'FAQPage',
          mainEntity: faq.map((q) => ({
            '@type': 'Question', name: q.q,
            acceptedAnswer: { '@type': 'Answer', text: q.a },
          })),
        }] : []),
      ]) }} />
    </PageShell>
  );
}
