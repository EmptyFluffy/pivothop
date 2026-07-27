import Link from 'next/link';

/* Pure presentation: no fs, importable from both server and client components. */

export type Job = {
  id: string; occ: string;
  title: string; company: string; location: string; remote: boolean;
  smin: number | null; smax: number | null; source: string; posted: string;
  url?: string;        // outbound apply link; present in per-occupation files, stripped from the global browse file
  featured?: boolean;  // launch featured strip
  logo?: string;       // locally-served company logo path when one resolved (else a monogram)
  fl?: string[];       // derived tags: 4d four-day week, eq equity, vi visa sponsorship
  lv?: 's' | 'e';      // level from the title: senior / entry
  c?: string;          // resolved ISO country code
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

/** Relative freshness ("Today", "3d ago", "2w ago"), falling back to the absolute
    date past four weeks. Dates are honest first-seen dates (a repost cannot reset
    them — the ledger), so the label means what it says. Computed at render: build
    time on the server, live on the client; the span carries
    suppressHydrationWarning so the client value wins without a mismatch warning. */
export function agoLabel(posted: string): string {
  const m = /^\d{4}-\d{2}-\d{2}/.exec(posted);
  if (!m) return '';
  const then = Date.parse(`${m[0]}T12:00:00Z`); // noon UTC dodges timezone edges
  if (!Number.isFinite(then)) return '';
  const d = Math.max(0, Math.floor((Date.now() - then) / 864e5));
  if (d === 0) return 'Today';
  if (d < 7) return `${d}d ago`;
  if (d < 28) return `${Math.floor(d / 7)}w ago`;
  return postedLabel(posted);
}

/** The house 45-degree arrow (the FairElephant export glyph), stroke follows text color. */
export function Arrow45({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 7h10v10" /><path d="M7 17 17 7" />
    </svg>
  );
}

/** First letter of the company, for the monogram fallback when no logo resolved. */
export function companyInitial(company: string): string {
  const m = String(company).match(/[a-z0-9]/i);
  return m ? m[0].toUpperCase() : '·';
}

export function JobCard({ j }: { j: Job }) {
  const pay = salaryLabel(j.smin, j.smax);
  const date = postedLabel(j.posted);
  // Paid employer posts aren't statically generated, so they link straight out
  // to the employer's apply destination rather than an internal detail page.
  const employer = j.source === 'employer' && !!j.url;
  const inner = (
    <>
      <span className="job-logo">
        {j.logo
          ? <img src={j.logo} alt="" width={38} height={38} loading="lazy" />
          : <span className="job-mono" aria-hidden="true">{companyInitial(j.company)}</span>}
      </span>
      <span className="job-body">
        <span className="job-main">
          <span className="job-t">{j.title}</span>
          <span className="job-co">{j.company}{j.location ? <span className="job-loc"> · {j.location}</span> : null}</span>
        </span>
        <span className="job-side">
          {pay && <span className="job-pay">{pay}</span>}
          <span className="job-m lbl">
            {employer && <span className="job-tag job-tag-hire">Hiring</span>}
            {j.featured && <span className="job-tag">Featured</span>}
            {j.fl?.includes('4d') && <span className="job-tag">4-day week</span>}
            {j.remote && <span className="job-tag">Remote</span>}
            {date && <span suppressHydrationWarning>{agoLabel(j.posted)}</span>}
          </span>
        </span>
        <span className="job-arrow"><Arrow45 size={22} /></span>
      </span>
    </>
  );
  return (
    <li>
      {employer
        ? <a href={j.url} target="_blank" rel="nofollow noopener noreferrer" className="job-card">{inner}</a>
        : <Link href={`/jobs/${j.occ}/${j.id}`} className="job-card">{inner}</Link>}
    </li>
  );
}
