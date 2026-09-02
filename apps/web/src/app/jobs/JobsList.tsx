import Link from 'next/link';
import { getJobs, jobCount, occTitle } from './jobs-data';
import { JobCard, type Job } from './JobCard';

/* The one way a list of jobs is drawn outside the board (audit pass 2,
   2026-09-02): every template that lists postings renders JobCard, with save
   and Apply, under a section heading and a "see all" link. Two ways to feed
   it: an occupation (salary, route and guide pages: the freshest roles of
   that occupation) or an explicit list (company and hire pages: their own
   postings). `.rt-rel` rows are for links to other pages, never for jobs.
   Server-only. */
export default function JobsList({
  occ, jobs: given, limit = 6, heading, note, v2 = true, total: givenTotal, allHref, allLabel,
}: {
  occ?: string;
  jobs?: Job[];
  limit?: number;
  heading?: string;
  note?: string;
  v2?: boolean;
  total?: number;
  allHref?: string;
  allLabel?: string;
}) {
  const jobs = (given ?? (occ ? getJobs(occ) : [])).slice(0, limit);
  if (jobs.length === 0) return null;
  const total = givenTotal ?? (occ ? jobCount(occ) : jobs.length);
  const title = occ ? occTitle(occ).toLowerCase() : '';
  const href = allHref ?? (occ ? `/jobs/${occ}` : null);
  return (
    <section className="rt-sec">
      <h2>{heading ?? `Open ${title} roles`}</h2>
      <p className="rt-note">{note ?? 'Live openings tagged to this occupation, from company career pages and remote boards. Apply at the source.'}</p>
      <ul className="job-list">
        {jobs.map((j) => <JobCard key={`${j.occ}-${j.id}`} j={j} v2={v2} />)}
      </ul>
      {href && total > jobs.length && (
        <Link className="jobs-all lbl" href={href}>{allLabel ?? `See all ${total.toLocaleString()} ${title} jobs`} &rarr;</Link>
      )}
    </section>
  );
}
