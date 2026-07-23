import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '../../components/SiteChrome';
import { getJobs, jobOccupations, jobCount, occTitle } from '../jobs-data';
import { JobCard } from '../JobsList';
import { coverableSlugs } from '../../salary/salary-data';

export function generateStaticParams() {
  return jobOccupations().map((occ) => ({ occ }));
}

export async function generateMetadata({ params }: { params: Promise<{ occ: string }> }): Promise<Metadata> {
  const { occ } = await params;
  if (jobCount(occ) === 0) return {};
  const title = occTitle(occ);
  return {
    title: `${title} jobs: ${jobCount(occ)} open roles — PivotHop`,
    description: `${jobCount(occ)} live ${title.toLowerCase()} openings from company career pages and remote boards, with salary where posted, plus the adjacent roles a ${title.toLowerCase()} can pivot into.`,
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

  return (
    <PageShell>
      <div className="rtp salp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb">
          <Link href="/">Instrument</Link><span>/</span><Link href="/jobs">Jobs</Link><span>/</span><span>{title}</span>
        </nav>
        <h1 className="rt-h1">{title} jobs</h1>
        <p className="rt-dek">
          {`${jobs.length} live ${tl} openings, tagged to this occupation from company career pages and remote boards. Apply at the source. Weighing whether this is your next move? See what a ${tl} earns and which roles the skills reach.`}
        </p>
        <div className="jobs-cross">
          {hasSalary && <Link className="gl" href={`/salary/${occ}`}>{title} salary &rarr;</Link>}
          <Link className="gl" href="/">Run the instrument &rarr;</Link>
        </div>

        <ul className="job-list job-list-full">
          {jobs.map((j) => <JobCard key={j.url} j={j} />)}
        </ul>

        <p className="rt-method lbl">
          Listings backfilled from re-displayable sources (company career pages, remote-job boards, and public-sector postings), freshest first, refreshed with the nightly scrape. Each links out to apply at the original posting; PivotHop does not host applications. Hiring for a role open to adjacent candidates? <Link className="gl" href="/employers">Feature it here</Link>.
        </p>
      </div>
    </PageShell>
  );
}
