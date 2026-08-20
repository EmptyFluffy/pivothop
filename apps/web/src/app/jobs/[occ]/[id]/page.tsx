import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '../../../components/SiteChrome';
import { getJob, getJobs, getJobSections, jobOccupations, occTitle, companyLogo, type JobSection , getJobSkills, getJobBenefits, getJobGates, skillDisplayName } from '../../jobs-data';
import { salaryLabel, postedLabel, agoLabel, sourceName, Arrow45, JobCard } from '../../JobCard';
import SkillStrip from '../../SkillStrip';
import BenefitStrip from '../../BenefitStrip';
import { gateRows } from '../../gates';
import { benefitEntries } from '../../benefit-entries';
import { skillEntries } from '../../skill-entries';
import { coverableSlugs, getSalary, usBand, fmtk } from '../../../salary/salary-data';
import { routableSlugs, routePair, destRole, originMeta, hasOriginPage, originRoles } from '../../../routes/routes-data';
import { jobCount } from '../../jobs-data';
import { SITE_EMAIL, article, originAnchors, pickAnchor } from '../../../../lib/site';

// ON DEMAND, NOT PREBUILT. These pages are deliberately noindexed (below), so
// prerendering bought nothing — and at 14,504 listings it produced enough
// output files to crash Vercel's own deploy walker with a stack overflow
// ("Maximum call stack size exceeded", 2026-08-04, both deploys of the Swiss
// unlock). Rendered on first request, cached for a day by ISR; the board data
// this reads is republished nightly anyway. This also decouples deploy size
// from board growth permanently: 30k listings cost the same as 3k.
export const dynamicParams = true;
export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ occ: string; id: string }> }): Promise<Metadata> {
  const { occ, id } = await params;
  const j = getJob(occ, id);
  if (!j) return {};
  return {
    title: `${j.title} at ${j.company} | PivotHop jobs`,
    description: `${j.title} at ${j.company}${j.location ? `, ${j.location}` : ''}. Live ${occTitle(occ).toLowerCase()} opening with the pay, the posting, and the skill routes that lead into the role.`,
    // Backfilled descriptions are the source's words; keep them out of the index
    // so the board's own pages carry the site's content signal.
    robots: { index: false, follow: true },
  };
}

// One description section: every text line is its own paragraph (flattened
// sources ship sentence-lines; merging them back rebuilds the wall), and
// consecutive "· " lines group into real lists.
function SectionBody({ t }: { t: string }) {
  const blocks: ({ ul: string[] } | { p: string })[] = [];
  let ul: string[] | null = null;
  const flushU = () => { if (ul?.length) blocks.push({ ul }); ul = null; };
  for (const raw of t.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('· ')) (ul ??= []).push(line.slice(2));
    else if (line === '') flushU();
    else { flushU(); blocks.push({ p: line }); }
  }
  flushU();
  return (
    <>
      {blocks.map((b, i) => 'ul' in b
        ? <ul key={i} className="jd-ul">{b.ul.map((li, k) => <li key={k}>{li}</li>)}</ul>
        : <p key={i}>{b.p}</p>)}
    </>
  );
}

export default async function JobDetailPage({ params }: { params: Promise<{ occ: string; id: string }> }) {
  const { occ, id } = await params;
  const j = getJob(occ, id);
  if (!j) notFound();
  const title = occTitle(occ);
  const tl = title.toLowerCase();
  const sections: JobSection[] = getJobSections(occ, id);
  const skills = getJobSkills(occ, id);
  const benefits = benefitEntries(getJobBenefits(occ, id));
  const gates = gateRows(getJobGates(occ, id));
  const pay = salaryLabel(j.smin, j.smax);
  const date = postedLabel(j.posted);
  const hasSalary = coverableSlugs().includes(occ);
  const logo = companyLogo(j.company);
  const initial = (j.company.match(/[a-z0-9]/i)?.[0] ?? '?').toUpperCase();
  const waysIn = routableSlugs()
    .filter((s) => routePair(s)?.dest === occ)
    .map((s) => { const p = routePair(s)!; return { slug: s, r: destRole(p.origin, p.dest), om: originMeta(p.origin) }; })
    .filter((x) => x.r)
    .sort((a, b) => b.r!.match - a.r!.match)
    .slice(0, 3);
  // More of the same role. The obvious next click on any board, and the moment
  // of highest intent — one listing is rarely the right one.
  const siblings = getJobs(occ).filter((s) => s.id !== id).slice(0, 5);
  // The occupation's own measured median, so a posting that states no pay still
  // tells a reader what the role goes for, and links to the full salary page.
  const occMedian = hasSalary ? (usBand(getSalary(occ)!)?.p50 ?? null) : null;
  // Where these skills also reach. The differentiated half: every other board
  // shows more of the same title, we can show adjacent occupations with the
  // readiness attached. Gated on a live board so no one lands on an empty page.
  const alsoReach = originRoles(occ)
    .map((r) => ({ ...r, n: jobCount(r.id) }))
    .filter((r) => r.n > 0 && r.id !== occ)
    .slice(0, 4);
  // Anchor variation: 4,477 pages pointing at 125 targets with one identical
  // phrase reads as automated. Deterministic per page, so it stays stable.
  const anchor = pickAnchor(originAnchors(title), id);
  const claim = `mailto:${SITE_EMAIL}?subject=${encodeURIComponent(`Claim listing: ${j.title} at ${j.company}`)}&body=${encodeURIComponent(`We are the employer behind "${j.title}" (${j.company}) listed on PivotHop. We want to claim it and hear about featured placement.\n\nWork email:\nName:`)}`;

  return (
    <PageShell v2 active="jobs">
      <div className="rtp salp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb">
          <Link href="/">Instrument</Link><span>/</span><Link href="/jobs">Jobs</Link><span>/</span><Link href={`/jobs/${occ}`}>{title}</Link><span>/</span><span>{j.company}</span>
        </nav>
        <div className="jd-head">
          {logo
            ? <span className="jd-mark"><img src={logo} alt="" width={40} height={40} /></span>
            : <span className="jd-mark jd-mono">{initial}</span>}
          <div className="jd-headtext">
            <h1 className="rt-h1 jd-h1">{j.title}</h1>
            <p className="jd-co">{j.company}{j.location ? ` · ${j.location}` : ''}</p>
          </div>
        </div>

        <div className="rt-facts">
          {pay && <div><span className="v">{pay}</span><span className="k">Posted pay</span></div>}
          <div><span className="v">{j.remote ? 'Remote' : 'On-site'}</span><span className="k">Workplace</span></div>
          {date && <div><span className="v" suppressHydrationWarning>{agoLabel(j.posted)}</span><span className="k">Posted · {date}</span></div>}
          <div><span className="v">{sourceName(j.source)}</span><span className="k">Source</span></div>
          {occMedian != null && (
            <div>
              <span className="v"><Link href={`/salary/${occ}`}>{fmtk(occMedian)}</Link></span>
              <span className="k">{tl} median</span>
            </div>
          )}
        </div>

        <div className="jd-applyrow">
          <a className="rt-go jd-apply" href={j.url} target="_blank" rel="nofollow noopener noreferrer">Apply now <Arrow45 size={24} /></a>
          <span className="lbl">Opens the original posting at {j.company}. PivotHop does not host applications.</span>
        </div>

        {gates.length > 0 && (
          <div className="jd-gates" aria-label="What the posting asks for">
            {gates.map((g) => (
              <div key={g.key} data-gate={g.key}>
                <span className="k">{g.label}</span>
                <span className="v">{g.value}</span>
              </div>
            ))}
          </div>
        )}

        {skills.length > 0 && (
          <section className="rt-sec jd-skills">
            <h2>Skills in this posting</h2>
            <SkillStrip skills={skillEntries(skills)} />
          </section>
        )}

        {benefits.length > 0 && (
          <section className="rt-sec jd-benefits">
            <h2>Benefits</h2>
            <BenefitStrip benefits={benefits} />
          </section>
        )}

        {sections.length > 0 && (
          <section className="rt-sec jd-desc">
            <h2>The posting</h2>
            {sections.map((s, i) => (
              <div key={i} className="jd-sec">
                {s.h && <h3 className="jd-h3">{s.h}</h3>}
                <SectionBody t={s.t} />
              </div>
            ))}
          </section>
        )}

        <section className="rt-sec">
          <h2>The PivotHop read</h2>
          <ul className="rt-rel">
            {hasSalary && <li><Link href={`/salary/${occ}`}>What {article(title)} {tl} actually earns</Link><span className="lbl">median, seniority, by country</span></li>}
            {hasOriginPage(occ) && (
              <li><Link href={`/routes/${occ}`}>{anchor}</Link><span className="lbl">every measured route out</span></li>
            )}
            {waysIn.map(({ slug, r, om }) => (
              <li key={slug}><Link href={`/routes/${slug}`}>{om.title} &rarr; {title}</Link><span className="lbl">{r!.match}% readiness</span></li>
            ))}
            <li><Link href={`/jobs/${occ}`}>All open {tl} roles</Link><span className="lbl">the full board</span></li>
          </ul>
        </section>

        {alsoReach.length > 0 && (
          <section className="rt-sec">
            <h2>Where these skills also reach</h2>
            <ul className="rt-rel">
              {alsoReach.map((r) => (
                <li key={r.id}>
                  <Link href={`/jobs/${r.id}`}>{r.n} open {r.title.toLowerCase()} role{r.n === 1 ? '' : 's'}</Link>
                  <span className="lbl">{r.match}% readiness from {tl}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {siblings.length > 0 && (
          <section className="rt-sec">
            <h2>More {tl} roles</h2>
            <ul className="job-list job-list-full">
              {siblings.map((s) => <JobCard key={s.id} j={s} v2 />)}
            </ul>
          </section>
        )}

        <p className="rt-method lbl">
          Backfilled listing, refreshed with the nightly scrape; the employer has not claimed it yet.
          Are you the employer? <a className="gl" href={claim}>Claim this listing</a> and it can be featured to the candidates whose skills already reach it, first month free.
        </p>
      </div>
    </PageShell>
  );
}
