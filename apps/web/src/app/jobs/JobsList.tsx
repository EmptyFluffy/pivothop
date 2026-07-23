import Link from 'next/link';
import { getJobs, jobCount, occTitle, salaryLabel, sourceName, type Job } from './jobs-data';

export function JobCard({ j }: { j: Job }) {
  const meta = [salaryLabel(j.smin, j.smax), j.remote ? 'Remote' : '', `via ${sourceName(j.source)}`].filter(Boolean).join(' · ');
  return (
    <li>
      <a href={j.url} target="_blank" rel="nofollow noopener noreferrer" className="job-card">
        <span className="job-t">{j.title}</span>
        <span className="job-co">{j.company}{j.location ? ` · ${j.location}` : ''}</span>
        <span className="job-m lbl">{meta}</span>
      </a>
    </li>
  );
}

/** Embeddable teaser of open roles for one occupation, for salary and route pages. */
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
