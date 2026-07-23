/* Pure presentation: no fs, importable from both server and client components. */

export type Job = {
  title: string; company: string; location: string; remote: boolean;
  smin: number | null; smax: number | null; url: string; source: string; posted: string;
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
      <a href={j.url} target="_blank" rel="nofollow noopener noreferrer" className="job-card">
        <span className="job-main">
          <span className="job-t">{j.title}</span>
          <span className="job-co">{j.company}{j.location ? <span className="job-loc"> · {j.location}</span> : null}</span>
        </span>
        <span className="job-side">
          {pay && <span className="job-pay">{pay}</span>}
          <span className="job-m lbl">
            {j.remote && <span className="job-tag">Remote</span>}
            {date && <span>{date}</span>}
            <span className="job-src">via {sourceName(j.source)}</span>
          </span>
        </span>
      </a>
    </li>
  );
}
