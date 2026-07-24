import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '../../components/SiteChrome';
import { getJobs, jobOccupations, jobCount, occTitle, occField, occSearchText } from '../jobs-data';
import JobsBrowse from '../JobsBrowse';
import { coverableSlugs } from '../../salary/salary-data';
import { routableSlugs, routePair, destRole, originMeta } from '../../routes/routes-data';

export function generateStaticParams() {
  return jobOccupations().map((occ) => ({ occ }));
}

export async function generateMetadata({ params }: { params: Promise<{ occ: string }> }): Promise<Metadata> {
  const { occ } = await params;
  if (jobCount(occ) === 0) return {};
  const title = occTitle(occ);
  return {
    title: `${title} jobs: ${jobCount(occ)} open roles — PivotHop`,
    description: `${jobCount(occ)} live ${title.toLowerCase()} openings from company career pages and remote boards, with salary where posted, plus the adjacent routes that lead into the role.`,
    alternates: { canonical: `/jobs/${occ}` },
  };
}

export default async function OccJobsPage({ params }: { params: Promise<{ occ: string }> }) {
  const { occ } = await params;
  const jobs = getJobs(occ);
  if (jobs.length === 0) notFound();
  const title = occTitle(occ);
  const tl = title.toLowerCase();
  const hasSalary = coverableSlugs().includes(occ);
  const remoteN = jobs.filter((j) => j.remote).length;
  // The adjacency layer: measured routes that lead INTO this occupation.
  const waysIn = routableSlugs()
    .filter((s) => routePair(s)?.dest === occ)
    .map((s) => { const p = routePair(s)!; return { slug: s, r: destRole(p.origin, p.dest), om: originMeta(p.origin) }; })
    .filter((x) => x.r)
    .sort((a, b) => b.r!.match - a.r!.match)
    .slice(0, 5);

  return (
    <PageShell>
      <div className="rtp salp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb">
          <Link href="/">Instrument</Link><span>/</span><Link href="/jobs">Jobs</Link><span>/</span><span>{title}</span>
        </nav>
        <h1 className="rt-h1">{title} jobs</h1>
        <p className="rt-dek">
          {`${jobs.length} live ${tl} openings from company career pages and remote boards, freshest first${remoteN > 0 ? `, ${remoteN} fully remote` : ''}. Apply at the source.`}
          {hasSalary && <>{' '}What the role pays, across markets and seniority: <Link className="gl" href={`/salary/${occ}`}>{tl} salary</Link>.</>}
        </p>

        <JobsBrowse
          fields={{ [occ]: occField(occ) }}
          titles={{ [occ]: title }}
          search={{ [occ]: occSearchText(occ) }}
          initialJobs={jobs}
          scope={{ occ, title }}
        />

        {waysIn.length > 0 && (
          <section className="rt-sec">
            <h2>Routes into {tl}</h2>
            <p className="rt-note">The measured pivots that lead here, ranked by how much of the destination a typical origin profile already covers.</p>
            <ul className="rt-rel">
              {waysIn.map(({ slug, r, om }) => (
                <li key={slug}><Link href={`/routes/${slug}`}>{om.title} &rarr; {title}</Link><span className="lbl">{r!.match}% readiness</span></li>
              ))}
            </ul>
          </section>
        )}

        <section className="rt-cta">
          <div>
            <h2>Hiring {tl}s?</h2>
            <p>Your role may already be listed here. Claim it, or post directly, and it gets featured to the candidates whose skills already reach it.</p>
          </div>
          <Link className="rt-go" href="/employers">Feature a role &rarr;</Link>
        </section>

        <p className="rt-method lbl">
          Listings backfilled from re-displayable sources (company career pages, remote-job boards, and public-sector postings), freshest first, refreshed with the nightly scrape. Each links out to apply at the original posting; PivotHop does not host applications. Salary shown where the posting states it.
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
          { '@type': 'ListItem', position: 2, name: 'Jobs', item: 'https://www.pivothop.com/jobs' },
          { '@type': 'ListItem', position: 3, name: `${title} jobs`, item: `https://www.pivothop.com/jobs/${occ}` },
        ],
      }) }} />
    </PageShell>
  );
}
