import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '../../components/SiteChrome';
import { getJobs, jobOccupations, jobCount, occTitle, occField, occSearchText, occMaps } from '../jobs-data';
import JobsBrowse from '../JobsBrowse';
import { coverableSlugs } from '../../salary/salary-data';
import { routableSlugs, routePair, destRole, originMeta } from '../../routes/routes-data';
import { getCategory, categorySlugs, categoryJobs, categoryBlurb, categoryShowAll, allCategories, type Category } from '../categories-data';

/* One slug space, two kinds of page:
   - an occupation (in jobs-index)      -> the single-occupation board + routes in
   - a category (remote, a field, ...)  -> the filter/tag landing page (pSEO)
   Occupations resolve first, so a real occupation slug can never be shadowed. */

export function generateStaticParams() {
  return [...jobOccupations().map((occ) => ({ occ })), ...categorySlugs().map((occ) => ({ occ }))];
}

export async function generateMetadata({ params }: { params: Promise<{ occ: string }> }): Promise<Metadata> {
  const { occ } = await params;
  if (jobCount(occ) > 0) {
    const title = occTitle(occ);
    return {
      title: `${title} jobs: ${jobCount(occ)} open roles — PivotHop`,
      description: `${jobCount(occ)} live ${title.toLowerCase()} openings from company career pages and remote boards, with salary where posted, plus the adjacent routes that lead into the role.`,
      alternates: { canonical: `/jobs/${occ}` },
    };
  }
  const cat = getCategory(occ);
  if (cat) return {
    title: `${cat.title}: ${cat.count.toLocaleString()} open roles — PivotHop`,
    description: categoryBlurb(cat),
    alternates: { canonical: `/jobs/${occ}` },
  };
  return {};
}

export default async function JobsSlugPage({ params }: { params: Promise<{ occ: string }> }) {
  const { occ } = await params;
  if (jobCount(occ) > 0) return <OccupationBoard occ={occ} />;
  const cat = getCategory(occ);
  if (cat) return <CategoryBoard cat={cat} />;
  notFound();
}

// The measured routes that lead INTO an occupation — the adjacency layer, shared
// by the occupation board and the occupation-scoped category pages.
function routesInto(occ: string) {
  return routableSlugs()
    .filter((s) => routePair(s)?.dest === occ)
    .map((s) => { const p = routePair(s)!; return { slug: s, r: destRole(p.origin, p.dest), om: originMeta(p.origin) }; })
    .filter((x) => x.r)
    .sort((a, b) => b.r!.match - a.r!.match)
    .slice(0, 5);
}

function OccupationBoard({ occ }: { occ: string }) {
  const jobs = getJobs(occ);
  if (jobs.length === 0) notFound();
  const title = occTitle(occ);
  const tl = title.toLowerCase();
  const hasSalary = coverableSlugs().includes(occ);
  const remoteN = jobs.filter((j) => j.remote).length;
  const waysIn = routesInto(occ);

  return (
    <PageShell>
      <div className="rtp salp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb">
          <Link href="/">Instrument</Link><span>/</span><Link href="/jobs">Jobs</Link><span>/</span><span>{title}</span>
        </nav>
        <h1 className="rt-h1">{title} jobs</h1>
        <p className="rt-dek">
          {`${jobs.length} live ${tl} openings from company career pages and remote boards, freshest first${remoteN > 0 ? `, ${remoteN} fully remote` : ''}. Apply at the source.`}
          {hasSalary && <>{' '}What the role pays, across markets and seniority: <Link className="gl" href={`/salary/${occ}`}>{tl} salary</Link>.</>}
        </p>

        <JobsBrowse
          fields={{ [occ]: occField(occ) }}
          titles={{ [occ]: title }}
          search={{ [occ]: occSearchText(occ) }}
          initialJobs={jobs}
          scope={{ occ, title }}
        />

        {waysIn.length > 0 && (
          <section className="rt-sec">
            <h2>Routes into {tl}</h2>
            <p className="rt-note">The measured pivots that lead here, ranked by how much of the destination a typical origin profile already covers.</p>
            <ul className="rt-rel">
              {waysIn.map(({ slug, r, om }) => (
                <li key={slug}><Link href={`/routes/${slug}`}>{om.title} &rarr; {title}</Link><span className="lbl">{r!.match}% readiness</span></li>
              ))}
            </ul>
          </section>
        )}

        <section className="rt-cta">
          <div>
            <h2>Hiring {tl}s?</h2>
            <p>Your role may already be listed here. Claim it, or post directly, and it gets featured to the candidates whose skills already reach it.</p>
          </div>
          <Link className="rt-go" href="/employers">Feature a role &rarr;</Link>
        </section>

        <p className="rt-method lbl">
          Listings backfilled from re-displayable sources (company career pages, remote-job boards, and public-sector postings), freshest first, refreshed with the nightly scrape. Each links out to apply at the original posting; PivotHop does not host applications. Salary shown where the posting states it.
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
          { '@type': 'ListItem', position: 2, name: 'Jobs', item: 'https://www.pivothop.com/jobs' },
          { '@type': 'ListItem', position: 3, name: `${title} jobs`, item: `https://www.pivothop.com/jobs/${occ}` },
        ],
      }) }} />
    </PageShell>
  );
}

function CategoryBoard({ cat }: { cat: Category }) {
  const jobs = categoryJobs(cat);
  const maps = occMaps();
  const showAll = categoryShowAll(cat);
  // The adjacency moat: occupation-scoped categories show the measured routes IN.
  const destTitle = cat.destOcc ? occTitle(cat.destOcc) : '';
  const waysIn = cat.destOcc ? routesInto(cat.destOcc) : [];
  const destHasSalary = cat.destOcc ? coverableSlugs().includes(cat.destOcc) : false;
  // Same-kind siblings first, then the top pages of other kinds.
  const rest = allCategories().filter((c) => c.slug !== cat.slug);
  const related = [...rest.filter((c) => c.kind === cat.kind).slice(0, 8), ...rest.filter((c) => c.kind !== cat.kind).slice(0, 8)];

  return (
    <PageShell>
      <div className="rtp salp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb">
          <Link href="/">Instrument</Link><span>/</span><Link href="/jobs">Jobs</Link><span>/</span><span>{cat.title}</span>
        </nav>
        <h1 className="rt-h1">{cat.title}</h1>
        <p className="rt-dek">
          {categoryBlurb(cat)}{' '}
          <Link className="gl" href="/">See which of these your skills already reach</Link>.
        </p>

        <JobsBrowse
          fields={maps.fields}
          titles={maps.titles}
          search={maps.search}
          initialJobs={jobs}
          scope={{ title: cat.searchTitle, showAllHref: showAll, showAllLabel: `See all ${cat.count.toLocaleString()}` }}
        />

        {waysIn.length > 0 && (
          <section className="rt-sec">
            <h2>Routes into {destTitle.toLowerCase()}</h2>
            <p className="rt-note">
              The measured pivots that lead here, ranked by how much of the destination a typical origin profile already covers.
              {destHasSalary && <>{' '}What it pays: <Link className="gl" href={`/salary/${cat.destOcc}`}>{destTitle.toLowerCase()} salary</Link>.</>}
            </p>
            <ul className="rt-rel">
              {waysIn.map(({ slug, r, om }) => (
                <li key={slug}><Link href={`/routes/${slug}`}>{om.title} &rarr; {destTitle}</Link><span className="lbl">{r!.match}% readiness</span></li>
              ))}
            </ul>
          </section>
        )}

        <section className="rt-sec">
          <h2>More ways to browse</h2>
          <p className="rt-note">Every filter on the board is a page like this one, preloaded and refreshed nightly. <Link className="gl" href="/jobs/browse">Browse them all</Link>.</p>
          <ul className="rt-rel">
            {related.map((c) => (
              <li key={c.slug}><Link href={`/jobs/${c.slug}`}>{c.title}</Link><span className="lbl">{c.count.toLocaleString()} open</span></li>
            ))}
          </ul>
        </section>

        <section className="rt-cta">
          <div>
            <h2>Hiring for a role like these?</h2>
            <p>Post it once and it is shown first to the candidates whose skills already reach it, with the gap itemized before they apply.</p>
          </div>
          <Link className="rt-go" href="/employers">Feature a role &rarr;</Link>
        </section>

        <p className="rt-method lbl">
          Listings backfilled from re-displayable sources (company career pages, remote-job boards, and public-sector postings), freshest first, refreshed with the nightly scrape. A sample is shown here; <Link className="gl" href={showAll}>see the full filtered board</Link>. Each links out to apply at the original posting; salary shown where the posting states it.
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
          { '@type': 'ListItem', position: 2, name: 'Jobs', item: 'https://www.pivothop.com/jobs' },
          { '@type': 'ListItem', position: 3, name: cat.title, item: `https://www.pivothop.com/jobs/${cat.slug}` },
        ],
      }) }} />
    </PageShell>
  );
}
