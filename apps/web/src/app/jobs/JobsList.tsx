import Link from 'next/link';
import { getJobs, jobCount, occTitle } from './jobs-data';
import { JobCard } from './JobCard';

/** Embeddable teaser of open roles for one occupation, for salary and route pages. Server-only. */
export default function JobsList({ occ, limit = 6, heading }: { occ: string; limit?: number; heading?: string }) {
  const jobs = getJobs(occ).slice(0, limit);
  if (jobs.length === 0) return null;
  const total = jobCount(occ);
  const title = occTitle(occ).toLowerCase();
  return (
    <section className="rt-sec">
      <h2>{heading ?? `Open ${title} roles`}</h2>
      <p className="rt-note">Live openings tagged to this occupation, from company career pages and remote boards. Apply at the source.</p>
      <ul className="job-list">
        {jobs.map((j) => <JobCard key={j.url} j={j} />)}
      </ul>
      {total > limit && <Link className="jobs-all lbl" href={`/jobs/${occ}`}>See all {total} {title} jobs &rarr;</Link>}
    </section>
  );
}
