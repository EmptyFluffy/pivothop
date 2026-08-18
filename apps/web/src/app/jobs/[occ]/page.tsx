import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '../../components/SiteChrome';
import { getJobs, jobOccupations, jobCount, occTitle, occField, occSearchText, occMaps } from '../jobs-data';
import JobsBrowse from '../JobsBrowse';
import { coverableSlugs } from '../../salary/salary-data';
import { routableSlugs, routePair, destRole, originMeta, routeOrigins } from '../../routes/routes-data';
import { getCategory, categorySlugs, categoryJobs, categoryBlurb, categoryShowAll, categoryStats, slugifyName, allCategories, type Category } from '../categories-data';
import { countryName } from '../countries';
import { REGION_META, type RegionKey } from '../regions';
import { postedLabel } from '../JobCard';
import { originAnchors, pickAnchor } from '../../../lib/site';
import { article } from '../../../lib/site';

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
      title: `${title} jobs: ${jobCount(occ)} open roles`,
      description: `${jobCount(occ)} live ${title.toLowerCase()} openings from company career pages and remote boards, with salary where posted, plus the adjacent routes that lead into the role.`,
      alternates: { canonical: `/jobs/${occ}` },
    };
  }
  const cat = getCategory(occ);
  if (cat) return {
    title: `${cat.title}: ${cat.count.toLocaleString()} open roles`,
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
  // This occupation's preloaded searches (remote, by country, by level, by pay) —
  // the internal-link mesh that surfaces the category long tail.
  const variants = allCategories().filter((c) => c.destOcc === occ);

  return (
    <PageShell wide>
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

        {variants.length > 0 && (
          <section className="rt-sec jb-byocc">
            <h2>More {tl} searches</h2>
            <p className="rt-note">Preloaded filters over this board, refreshed with the nightly scrape. <Link className="gl" href="/jobs/browse">All preloaded searches</Link>.</p>
            <span className="jb-occlinks">
              {variants.map((c) => (
                <Link key={c.slug} href={`/jobs/${c.slug}`}>{c.title} <span className="lbl">{c.count.toLocaleString()}</span></Link>
              ))}
            </span>
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

// Data-driven FAQ per category page: every answer carries this filter's own
// numbers and at least one internal link toward the surface that answers it
// deeper (salary, routes, sibling categories, the instrument). Question intent
// + FAQPage schema + link mesh in one block; nothing writable-prose about it.
type FaqItem = { q: string; text: string; jsx: React.ReactNode };
function categoryFaq(cat: Category, waysIn: ReturnType<typeof routesInto>): FaqItem[] {
  const s = categoryStats(cat);
  // Decapitalize only the first letter: "Jobs in Germany" -> "jobs in Germany"
  // (a full toLowerCase() would strip the proper nouns).
  const tl = cat.title.charAt(0).toLowerCase() + cat.title.slice(1);
  const catSet = new Set(categorySlugs());
  const qs = new URLSearchParams(cat.query);
  const ccode = qs.get('c');
  const out: FaqItem[] = [];

  // 1. The count, honestly framed.
  const fresh = s.newest ? `; the newest was posted ${postedLabel(s.newest)}` : '';
  out.push({
    q: `How many ${tl} are open right now?`,
    text: `${cat.count.toLocaleString()} live openings, refreshed with the nightly scrape${fresh}. A page like this only exists while it clears a minimum of live listings, so the count is real inventory, never padding.`,
    jsx: <>{cat.count.toLocaleString()} live openings, refreshed with the nightly scrape{fresh}. A page like this only exists while it clears a minimum of live listings, so the count is real inventory, never padding. Every preloaded search: <Link className="gl" href="/jobs/browse">browse the board</Link>.</>,
  });

  // 2. Pay, from this filter's own postings.
  if (s.p25 != null && s.p75 != null) {
    const band = `$${s.p25}k–$${s.p75}k`;
    const salLink = cat.destOcc && coverableSlugs().includes(cat.destOcc)
      ? <> Full {occTitle(cat.destOcc).toLowerCase()} pay data, by seniority and country: <Link className="gl" href={`/salary/${cat.destOcc}`}>{occTitle(cat.destOcc).toLowerCase()} salary</Link>.</>
      : <> Posted pay across every occupation: <Link className="gl" href="/salary">the salary index</Link>.</>;
    out.push({
      q: `How much do ${tl} pay?`,
      text: `Of the ${cat.count.toLocaleString()} openings, ${s.salaried.toLocaleString()} state a salary. The posted middle band runs ${band} a year. Only postings that state pay are counted; nothing is inferred.`,
      jsx: <>Of the {cat.count.toLocaleString()} openings, {s.salaried.toLocaleString()} state a salary. The posted middle band runs {band} a year. Only postings that state pay are counted; nothing is inferred.{salLink}</>,
    });
  }

  // 3. The kind-specific question.
  if (cat.destOcc && waysIn.length > 0) {
    const occTl = occTitle(cat.destOcc).toLowerCase();
    const tops = waysIn.slice(0, 3);
    const originPage = routeOrigins().includes(cat.destOcc);
    out.push({
      q: `Can I get ${article(occTl)} ${occTl} job from an adjacent career?`,
      text: `Measurably, yes. The closest measured pivots in: ${tops.map(({ r, om }) => `${om.title.toLowerCase()} (${r!.match}% skill readiness)`).join(', ')}. Each route page lists exactly which skills carry over and which are missing, read from live postings.`,
      jsx: <>Measurably, yes. The closest measured pivots in: {tops.map(({ slug, r, om }, i) => (<span key={slug}>{i > 0 ? ', ' : ''}<Link className="gl" href={`/routes/${slug}`}>{om.title.toLowerCase()}</Link> ({r!.match}% skill readiness)</span>))}. Each route page lists exactly which skills carry over and which are missing.{originPage && <>{' '}Moving out instead: <Link className="gl" href={`/routes/${cat.destOcc}`}>{pickAnchor(originAnchors(occTitle(cat.destOcc)), cat.destOcc, 1).toLowerCase()}</Link>.</>}</>,
    });
  } else if (cat.destOcc && routeOrigins().includes(cat.destOcc)) {
    const occTl = occTitle(cat.destOcc).toLowerCase();
    out.push({
      q: `What careers can ${article(occTl)} ${occTl} move into?`,
      text: `Every measured route out of ${occTl}, ranked by skill readiness with the salary and license gate for each, lives on one page: pivothop.com/routes/${cat.destOcc}.`,
      jsx: <>Every measured route out of {occTl}, ranked by skill readiness with the salary and license gate for each: <Link className="gl" href={`/routes/${cat.destOcc}`}>{pickAnchor(originAnchors(occTitle(cat.destOcc)), cat.destOcc).toLowerCase()}</Link>.</>,
    });
  } else if (qs.get('t') === 'vi') {
    out.push({
      q: 'Are these visa-sponsorship offers verified?',
      text: 'The flag is read from the posting text with negation checks, so a line like "no visa sponsorship" never counts as an offer. Boards change fast, though — confirm on the original posting before you plan around it. Every card here links to the source.',
      jsx: <>The flag is read from the posting text with negation checks, so a line like &ldquo;no visa sponsorship&rdquo; never counts as an offer. Boards change fast, though &mdash; confirm on the original posting before you plan around it. Every card links to the source.</>,
    });
  } else if (ccode && s.topFields.length > 0) {
    const name = countryName(ccode);
    const link = (f: string) => {
      const combo = `${slugifyName(f)}-in-${slugifyName(name)}`;
      const single = slugifyName(f);
      return catSet.has(combo) ? `/jobs/${combo}` : catSet.has(single) ? `/jobs/${single}` : null;
    };
    out.push({
      q: `Which fields hire the most in ${name}?`,
      text: `In this set: ${s.topFields.map(([f, n]) => `${f} (${n})`).join(', ')}.`,
      jsx: <>In this set: {s.topFields.map(([f, n], i) => { const h = link(f); return (<span key={f}>{i > 0 ? ', ' : ''}{h ? <Link className="gl" href={h}>{f}</Link> : f} ({n})</span>); })}.</>,
    });
  } else if (qs.get('region') && s.topCountries.length > 1) {
    const rk = qs.get('region') as RegionKey;
    const rname = REGION_META[rk]?.name ?? 'this region';
    const clink = (cc: string) => { const slug = `in-${slugifyName(countryName(cc))}`; return catSet.has(slug) ? `/jobs/${slug}` : null; };
    out.push({
      q: `Which countries in ${rname} have the most openings?`,
      text: `In this set: ${s.topCountries.map(([cc, n]) => `${countryName(cc)} (${n})`).join(', ')}. Each country has its own board.`,
      jsx: <>In this set: {s.topCountries.map(([cc, n], i) => { const h = clink(cc); return (<span key={cc}>{i > 0 ? ', ' : ''}{h ? <Link className="gl" href={h}>{countryName(cc)}</Link> : countryName(cc)} ({n})</span>); })}.</>,
    });
  } else if (s.topOccs.length > 1) {
    out.push({
      q: 'Which roles have the most openings here?',
      text: `${s.topOccs.map(([o, n]) => `${occTitle(o)} (${n})`).join(', ')}.`,
      jsx: <>{s.topOccs.map(([o, n], i) => (<span key={o}>{i > 0 ? ', ' : ''}<Link className="gl" href={`/jobs/${o}`}>{occTitle(o)}</Link> ({n})</span>))}.</>,
    });
  }

  // 4. The funnel into the instrument.
  out.push({
    q: 'Which of these jobs do my skills already reach?',
    text: 'Run the instrument with your current role and it measures your readiness for every occupation on this board from live postings — the same data these listings are tagged with. Free, no account.',
    jsx: <>Run <Link className="gl" href="/">the instrument</Link> with your current role and it measures your readiness for every occupation on this board from live postings &mdash; the same data these listings are tagged with. Free, no account.</>,
  });

  return out;
}

function CategoryBoard({ cat }: { cat: Category }) {
  const jobs = categoryJobs(cat);
  const maps = occMaps();
  const showAll = categoryShowAll(cat);
  // The adjacency moat: occupation-scoped categories show the measured routes IN.
  const destTitle = cat.destOcc ? occTitle(cat.destOcc) : '';
  const waysIn = cat.destOcc ? routesInto(cat.destOcc) : [];
  const destHasSalary = cat.destOcc ? coverableSlugs().includes(cat.destOcc) : false;
  const faq = categoryFaq(cat, waysIn);
  // Same-kind siblings first, then the top pages of other kinds.
  const rest = allCategories().filter((c) => c.slug !== cat.slug);
  const related = [...rest.filter((c) => c.kind === cat.kind).slice(0, 8), ...rest.filter((c) => c.kind !== cat.kind).slice(0, 8)];

  return (
    <PageShell wide>
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

        <div className="post-faq rt-faq">
          <h2>Quick answers</h2>
          {faq.map((f) => (
            <details key={f.q} name="pagefaq"><summary>{f.q}</summary><p>{f.jsx}</p></details>
          ))}
        </div>

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: cat.title,
        numberOfItems: cat.count,
        itemListElement: jobs.slice(0, 20).map((j, i) => ({
          '@type': 'ListItem', position: i + 1,
          name: `${j.title} — ${j.company}`,
          url: `https://www.pivothop.com/jobs/${j.occ}/${j.id}`,
        })),
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.text } })),
      }) }} />
    </PageShell>
  );
}
