'use client';
import { useMemo, useState } from 'react';
import { JobCard, type Job } from './JobCard';

/** The full occupation board: client-side search + remote filter over the listings. */
export default function JobsBoard({ jobs }: { jobs: Job[] }) {
  const [q, setQ] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return jobs.filter((j) => {
      if (remoteOnly && !j.remote) return false;
      if (!needle) return true;
      return `${j.title} ${j.company} ${j.location}`.toLowerCase().includes(needle);
    });
  }, [jobs, q, remoteOnly]);

  return (
    <>
      <div className="job-filter">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by title, company, place"
          aria-label="Filter listings"
        />
        <button
          type="button"
          className={`job-remote-toggle${remoteOnly ? ' on' : ''}`}
          aria-pressed={remoteOnly}
          onClick={() => setRemoteOnly((v) => !v)}
        >
          Remote only
        </button>
        <span className="lbl job-count">{shown.length} of {jobs.length}</span>
      </div>
      <ul className="job-list job-list-full">
        {shown.map((j) => <JobCard key={j.url} j={j} />)}
      </ul>
      {shown.length === 0 && <p className="rt-note">Nothing matches that filter. Clear it to see all {jobs.length} roles.</p>}
    </>
  );
}
