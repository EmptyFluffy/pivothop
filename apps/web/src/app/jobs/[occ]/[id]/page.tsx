import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '../../../components/SiteChrome';
import { getJob, getJobs, getJobSections, jobOccupations, occTitle, type JobSection } from '../../jobs-data';
import { salaryLabel, postedLabel, sourceName, Arrow45 } from '../../JobCard';
import { coverableSlugs } from '../../../salary/salary-data';
import { routableSlugs, routePair, destRole, originMeta } from '../../../routes/routes-data';
import { SITE_EMAIL } from '../../../../lib/site';

export function generateStaticParams() {
  return jobOccupations().flatMap((occ) => getJobs(occ).map((j) => ({ occ, id: j.id })));
}

export async function generateMetadata({ params }: { params: Promise<{ occ: string; id: string }> }): Promise<Metadata> {
  const { occ, id } = await params;
  const j = getJob(occ, id);
  if (!j) return {};
  return {
    title: `${j.title} at ${j.company} — PivotHop jobs`,
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
  const pay = salaryLabel(j.smin, j.smax);
  const date = postedLabel(j.posted);
  const hasSalary = coverableSlugs().includes(occ);
  const waysIn = routableSlugs()
    .filter((s) => routePair(s)?.dest === occ)
    .map((s) => { const p = routePair(s)!; return { slug: s, r: destRole(p.origin, p.dest), om: originMeta(p.origin) }; })
    .filter((x) => x.r)
    .sort((a, b) => b.r!.match - a.r!.match)
    .slice(0, 3);
  const claim = `mailto:${SITE_EMAIL}?subject=${encodeURIComponent(`Claim listing: ${j.title} at ${j.company}`)}&body=${encodeURIComponent(`We are the employer behind "${j.title}" (${j.company}) listed on PivotHop. We want to claim it and hear about featured placement.\n\nWork email:\nName:`)}`;

  return (
    <PageShell>
      <div className="rtp salp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb">
          <Link href="/">Instrument</Link><span>/</span><Link href="/jobs">Jobs</Link><span>/</span><Link href={`/jobs/${occ}`}>{title}</Link><span>/</span><span>{j.company}</span>
        </nav>
        <h1 className="rt-h1 jd-h1">{j.title}</h1>
        <p className="jd-co">{j.company}{j.location ? ` · ${j.location}` : ''}</p>

        <div className="rt-facts">
          {pay && <div><span className="v">{pay}</span><span className="k">Posted pay</span></div>}
          <div><span className="v">{j.remote ? 'Yes' : 'On-site'}</span><span className="k">Fully remote</span></div>
          {date && <div><span className="v">{date}</span><span className="k">Posted</span></div>}
          <div><span className="v">{sourceName(j.source)}</span><span className="k">Source</span></div>
        </div>

        <div className="jd-applyrow">
          <a className="rt-go jd-apply" href={j.url} target="_blank" rel="nofollow noopener noreferrer">Apply at {j.company} <Arrow45 size={24} /></a>
          <span className="lbl">Opens the original posting. PivotHop does not host applications.</span>
        </div>

        {sections.length > 0 && (
          <section className="rt-sec jd-desc">
            <h2>The posting</h2>
            {sections.map((s, i) => (
              <div key={i} className="jd-sec">
                {s.h && <h3 className="jd-h3">{s.h}</h3>}
                <SectionBody t={s.t} />
              </div>
            ))}
            <p className="rt-note">Excerpt from the original listing. The full, current text lives at the source. <a className="gl" href={j.url} target="_blank" rel="nofollow noopener noreferrer">Read and apply there &rarr;</a></p>
          </section>
        )}

        <section className="rt-sec">
          <h2>The PivotHop read</h2>
          <ul className="rt-rel">
            {hasSalary && <li><Link href={`/salary/${occ}`}>What a {tl} actually earns</Link><span className="lbl">median, seniority, by country</span></li>}
            {waysIn.map(({ slug, r, om }) => (
              <li key={slug}><Link href={`/routes/${slug}`}>{om.title} &rarr; {title}</Link><span className="lbl">{r!.match}% readiness</span></li>
            ))}
            <li><Link href={`/jobs/${occ}`}>All open {tl} roles</Link><span className="lbl">the full board</span></li>
          </ul>
        </section>

        <p className="rt-method lbl">
          Backfilled listing, refreshed with the nightly scrape; the employer has not claimed it yet.
          Are you the employer? <a className="gl" href={claim}>Claim this listing</a> and it can be featured to the candidates whose skills already reach it, first month free.
        </p>
      </div>
    </PageShell>
  );
}
