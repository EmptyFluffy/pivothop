import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../components/SiteChrome';
import { jobsIndex, jobOccupations, occTitle, occField, occSearchText, getJobs, featuredJobs, boardStats } from './jobs-data';
import { salaryLabel, Arrow45, agoLabel } from './JobCard';
import { routableSlugs } from '../routes/routes-data';
import JobsBrowse from './JobsBrowse';

export const metadata: Metadata = {
  title: 'Job board: live roles across every field, searchable | PivotHop',
  description:
    'Search thousands of live job openings across technology, healthcare, business, design, engineering, and more. Filter by field, remote, and salary; every role is tagged to the skills that reach it and links out to apply at the source.',
  alternates: { canonical: '/jobs' },
};

export default function JobsHub() {
  const idx = jobsIndex();
  const occs = jobOccupations();
  // One source for every visible count — see boardStats(). Deriving these here
  // from the per-occupation files is what made the dek disagree with the board.
  const { total, remote: remoteN } = boardStats();
  const fields: Record<string, string> = {};
  const titles: Record<string, string> = {};
  const search: Record<string, string> = {};
  for (const o of occs) { fields[o] = occField(o); titles[o] = occTitle(o); search[o] = occSearchText(o); }
  const byField = new Map<string, string[]>();
  for (const o of occs) (byField.get(fields[o]) ?? byField.set(fields[o], []).get(fields[o])!).push(o);
  const fieldGroups = [...byField.entries()].sort((a, b) => b[1].length - a[1].length);
  const routeCount = routableSlugs().length;

  return (
    <PageShell wide v2 active="jobs">
      <div className="rtp">

        <JobsBrowse v2 hero={
          <header className="jb-hero">
            <p className="jb-vmeta">{total.toLocaleString()} live roles &middot; {occs.length} occupations &middot; {remoteN.toLocaleString()} fully remote &middot; <Link className="gl" href="/">run the instrument</Link></p>
            <h1 className="rt-h1">The job board, by skill.</h1>
          </header>
        } fields={fields} titles={titles} search={search} featured={
          featuredJobs().length >= 3 ? (
            <section key="featured" className="feat" aria-label="Featured roles">
              <div className="feat-head">
                <span className="lbl feat-cap">Featured roles</span>
                <span className="lbl feat-sub">Shown first to the candidates whose skills reach them</span>
              </div>
              <ul className="feat-ledger">
                {/* one role per company first, so the ledger reads as a roster of distinct names */}
                {(() => {
                  const all = featuredJobs();
                  const seen = new Set<string>();
                  const firsts = all.filter((j) => !seen.has(j.company) && seen.add(j.company) !== undefined);
                  const rest = all.filter((j) => !firsts.includes(j));
                  return [...firsts, ...rest].slice(0, 6);
                })().map((j, i) => (
                  <li key={j.id}>
                    <Link href={`/jobs/${j.occ}/${j.id}`} className="feat-row">
                      {j.logo
                        ? <span className="feat-logo"><img src={j.logo} alt="" width={30} height={30} loading="lazy" /></span>
                        : <span className="feat-i">0{i + 1}</span>}
                      <span className="feat-main">
                        <span className="feat-co">{j.company}</span>
                        <span className="feat-t">{j.title}</span>
                      </span>
                      <span className="feat-side">
                        {salaryLabel(j.smin, j.smax) && <b className="feat-pay">{salaryLabel(j.smin, j.smax)}</b>}
                        <span className="feat-meta lbl">{j.remote ? 'Remote · ' : ''}{titles[j.occ]}{j.posted ? <> · <span suppressHydrationWarning>{agoLabel(j.posted)}</span></> : null}</span>
                      </span>
                      <span className="feat-arrow"><Arrow45 size={26} /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : undefined
        } />

        <section className="empband" aria-label="For employers">
          <div className="eb-copy">
            <span className="lbl eb-eyebrow">For employers</span>
            <h2>The applicants you never see<br />are already measuring your role.</h2>
            <p>
              Every listing here sits on the skill graph. Candidates arrive from adjacent professions with the
              gap itemized before you ever talk to them. Post a role and it is shown first to the people whose
              skills already cover it.
            </p>
            <div className="eb-stats">
              <div><b>{total.toLocaleString()}</b><span className="lbl">live roles</span></div>
              <div><b>{occs.length}</b><span className="lbl">occupations</span></div>
              <div><b>{routeCount}</b><span className="lbl">measured routes in</span></div>
            </div>
          </div>
          <Link className="eb-cta" href="/employers">Post a job<span className="eb-sub">Launch pricing, half off</span></Link>
        </section>

        <section className="rt-sec jb-byocc">
          <h2>Browse by occupation</h2>
          <p className="rt-note">Or browse by filter — remote, location, seniority, pay, and combinations: <Link className="gl" href="/jobs/browse">all preloaded searches</Link>.</p>
          {fieldGroups.map(([field, list]) => (
            <div key={field} className="jb-occrow">
              <span className="lbl jb-occfield">{field}</span>
              <span className="jb-occlinks">
                {list.sort((a, b) => idx[b] - idx[a]).map((o) => (
                  <Link key={o} href={`/jobs/${o}`}>{titles[o]} <span className="lbl">{idx[o]}</span></Link>
                ))}
              </span>
            </div>
          ))}
        </section>

        <p className="rt-method lbl">
          Listings are backfilled from company career pages, remote-job boards, and public-sector sources, refreshed with the nightly scrape, and link out to apply at the origin. Hiring for adjacent-friendly roles? <Link className="gl" href="/employers">Post a job</Link>, at half-off launch pricing while the board fills.
        </p>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
          { '@type': 'ListItem', position: 2, name: 'Jobs', item: 'https://www.pivothop.com/jobs' },
        ],
      }) }} />
    </PageShell>
  );
}
