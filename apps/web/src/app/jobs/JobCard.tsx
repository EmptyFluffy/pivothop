import Link from 'next/link';

/* Pure presentation: no fs, importable from both server and client components. */

export type Job = {
  id: string; occ: string;
  title: string; company: string; location: string; remote: boolean;
  smin: number | null; smax: number | null; source: string; posted: string;
  url?: string;        // outbound apply link; present in per-occupation files, stripped from the global browse file
  featured?: boolean;  // launch featured strip
  fl?: string[];       // derived tags: 4d four-day week, eq equity, vi visa sponsorship
  lv?: 's' | 'e';      // level from the title: senior / entry
};

const k = (v: number) => '$' + Math.round(v / 1000) + 'k';
export function salaryLabel(smin: number | null, smax: number | null): string {
  if (smin && smax && smax > smin) return `${k(smin)}–${k(smax)}`;
  const v = smin || smax;
  return v ? k(v) : '';
}

const SOURCE_NAMES: Record<string, string> = {
  greenhouse: 'Greenhouse', usajobs: 'USAJOBS', ashby: 'Ashby', lever: 'Lever',
  himalayas: 'Himalayas', arbeitnow: 'Arbeitnow', themuse: 'The Muse',
  smartrecruiters: 'SmartRecruiters', jobicy: 'Jobicy', remoteok: 'RemoteOK', remotive: 'Remotive',
};
export const sourceName = (s: string) => SOURCE_NAMES[s] ?? s;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function postedLabel(posted: string): string {
  // "2026-07-16" -> "Jul 16"; deterministic, no Date parsing.
  const m = /^\d{4}-(\d{2})-(\d{2})/.exec(posted);
  if (!m) return '';
  const mo = MONTHS[parseInt(m[1], 10) - 1];
  return mo ? `${mo} ${parseInt(m[2], 10)}` : '';
}

export function JobCard({ j }: { j: Job }) {
  const pay = salaryLabel(j.smin, j.smax);
  const date = postedLabel(j.posted);
  return (
    <li>
      <Link href={`/jobs/${j.occ}/${j.id}`} className="job-card">
        <span className="job-main">
          <span className="job-t">{j.title}</span>
          <span className="job-co">{j.company}{j.location ? <span className="job-loc"> · {j.location}</span> : null}</span>
        </span>
        <span className="job-side">
          {pay && <span className="job-pay">{pay}</span>}
          <span className="job-m lbl">
            {j.featured && <span className="job-tag">Featured</span>}
            {j.fl?.includes('4d') && <span className="job-tag">4-day week</span>}
            {j.remote && <span className="job-tag">Remote</span>}
            {date && <span>{date}</span>}
          </span>
        </span>
      </Link>
    </li>
  );
}
