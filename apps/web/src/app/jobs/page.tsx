import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../components/SiteChrome';
import { allCategories } from './categories-data';
import { jobsIndex, jobOccupations, occTitle, occField, occSearchText, getJobs, featuredJobs, boardStats } from './jobs-data';
import { JobCard } from './JobCard';
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
            <ul key="featured" className="job-list job-list-full jb-featlist" aria-label="Featured roles">
              {/* one role per company first, so the strip reads as a roster of distinct names */}
              {(() => {
                const all = featuredJobs();
                const seen = new Set<string>();
                const firsts = all.filter((j) => !seen.has(j.company) && seen.add(j.company) !== undefined);
                const rest = all.filter((j) => !firsts.includes(j));
                return [...firsts, ...rest].slice(0, 6);
              })().map((j) => <JobCard key={j.id} j={j} v2 />)}
            </ul>
          ) : undefined
        } />

        <section className="empband" aria-label="For employers">
          <div className="eb-copy">
            <span className="lbl eb-eyebrow">For employers</span>
            <h2 className="eb-h2"><Link className="eb-post" href="/employers">Post a job</Link></h2>
            <p className="lbl eb-half">Launch pricing, half off</p>
            <p className="eb-lede">The applicants you never see are already measuring your role.</p>
            <div className="eb-stats">
              <div><b>{total.toLocaleString()}</b><span className="lbl">live roles</span></div>
              <div><b>{occs.length}</b><span className="lbl">occupations</span></div>
              <div><b>{routeCount}</b><span className="lbl">measured routes in</span></div>
            </div>
          </div>
        </section>

        <section className="rt-sec jb-byocc">
          <h2>Browse by occupation</h2>
          <p className="rt-note">Or browse by filter — remote, location, seniority, pay, and combinations: <Link className="gl" href="/jobs/browse">all preloaded searches</Link>.</p>
          {fieldGroups.map(([field, list]) => {
            // this field's rows on /jobs/browse/fields — the count states
            // exactly what the link lands on, nothing broader
            const FIELD_KINDS = new Set(['field', 'level-field', 'pay-field', 'flag-field', 'field-region']);
            const nSearches = allCategories().filter((c) => FIELD_KINDS.has(c.kind) && c.title.includes(field)).length;
            return (
              <div key={field} className="jb-occrow">
                <span className="lbl jb-occfield">{field}</span>
                <span className="jb-occlinks">
                  {list.sort((a, b) => idx[b] - idx[a]).map((o) => (
                    <Link key={o} href={`/jobs/${o}`}>{titles[o]} <span className="lbl">{idx[o]}</span></Link>
                  ))}
                  {nSearches > 0 && (
                    <Link className="jb-occall" href="/jobs/browse/fields">All {nSearches} {field} searches &rarr;</Link>
                  )}
                </span>
              </div>
            );
          })}
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
