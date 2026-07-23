import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../components/SiteChrome';
import { jobsIndex, jobOccupations, occTitle, occField, occSearchText, getJobs, featuredJobs } from './jobs-data';
import { salaryLabel } from './JobCard';
import { routableSlugs } from '../routes/routes-data';
import JobsBrowse from './JobsBrowse';

export const metadata: Metadata = {
  title: 'Job board: live roles across every field, searchable — PivotHop',
  description:
    'Search thousands of live job openings across technology, healthcare, business, design, engineering, and more. Filter by field, remote, and salary; every role is tagged to the skills that reach it and links out to apply at the source.',
  alternates: { canonical: '/jobs' },
};

export default function JobsHub() {
  const idx = jobsIndex();
  const occs = jobOccupations();
  const total = Object.values(idx).reduce((a, b) => a + b, 0);
  const remoteN = occs.reduce((s, o) => s + getJobs(o).filter((j) => j.remote).length, 0);
  const fields: Record<string, string> = {};
  const titles: Record<string, string> = {};
  const search: Record<string, string> = {};
  for (const o of occs) { fields[o] = occField(o); titles[o] = occTitle(o); search[o] = occSearchText(o); }
  const byField = new Map<string, string[]>();
  for (const o of occs) (byField.get(fields[o]) ?? byField.set(fields[o], []).get(fields[o])!).push(o);
  const fieldGroups = [...byField.entries()].sort((a, b) => b[1].length - a[1].length);
  const routeCount = routableSlugs().length;

  return (
    <PageShell>
      <div className="rtp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb"><Link href="/">Instrument</Link><span>/</span><span>Jobs</span></nav>
        <div className="jb-head">
          <div>
            <h1 className="rt-h1">The job board, by skill.</h1>
            <p className="rt-dek">
              {`${total.toLocaleString()} live openings across ${occs.length} occupations, ${remoteN.toLocaleString()} fully remote. Each role is tagged to the skills that reach it and links out to apply at the source. Not sure what to search? Run the `}
              <Link className="gl" href="/">instrument</Link>
              {` and it will tell you which of these roles your skills already cover.`}
            </p>
          </div>
        </div>

        {featuredJobs().length >= 3 && (
          <section className="feat" aria-label="Featured roles">
            <div className="feat-head">
              <span className="lbl acc">Featured roles</span>
              <span className="lbl">Shown first to the candidates whose skills reach them</span>
            </div>
            <ul className="feat-grid">
              {featuredJobs().map((j) => (
                <li key={j.id}>
                  <Link href={`/jobs/${j.occ}/${j.id}`} className="feat-card">
                    <span className="feat-co">{j.company}</span>
                    <span className="feat-t">{j.title}</span>
                    <span className="feat-m lbl">
                      {salaryLabel(j.smin, j.smax) && <b>{salaryLabel(j.smin, j.smax)}</b>}
                      {j.remote && <span>Remote</span>}
                      <span>{titles[j.occ]}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <JobsBrowse fields={fields} titles={titles} search={search} />

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
          <Link className="eb-cta" href="/employers#post">Post a role<span className="eb-sub">First month featured, free</span></Link>
        </section>

        <section className="rt-sec jb-byocc">
          <h2>Browse by occupation</h2>
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
          Listings are backfilled from company career pages, remote-job boards, and public-sector sources, refreshed with the nightly scrape, and link out to apply at the origin. Hiring for adjacent-friendly roles? <Link className="gl" href="/employers#post">Post a role</Link>, the first month featured is free while the board fills.
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
