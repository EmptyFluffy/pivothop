import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '../../components/SiteChrome';
import { getRouteDef, routableSlugs, routePair, originMeta, destRole, unlocks, routeOrigins, originRoles } from '../routes-data';
// coverableSlugs is the SAME predicate the salary generator uses — linking on
// anything else (e.g. the curated SALARY_SLUGS list) can point at pages the
// data floor didn't generate. The CI link gate caught exactly that.
import { coverableSlugs } from '../../salary/salary-data';
import { jobCount } from '../../jobs/jobs-data';
import JobsList from '../../jobs/JobsList';
import RouteInstrument from '../RouteInstrument';

/* One slug space, two kinds of page:
   - "architect-to-interior-designer" (has "-to-")  -> the route page
   - "architect"                                    -> the per-origin page:
     "Alternative careers for architects", every measured route out, ranked.
     The SERP for that query class is held by niche blogs; the content here is
     the adjacency data verbatim (docs/24). Origin slugs never contain "-to-",
     so the two can't collide. */

export function generateStaticParams() {
  return [...routableSlugs(), ...routeOrigins()].map((route) => ({ route }));
}

export async function generateMetadata({ params }: { params: Promise<{ route: string }> }): Promise<Metadata> {
  const { route } = await params;
  const def = getRouteDef(route);
  const r = def && destRole(def.origin, def.dest);
  if (def && r) {
    const om = originMeta(def.origin);
    return {
      title: `${om.title} to ${r.title}: match, salary, skill gap — PivotHop`,
      description: `The ${om.title.toLowerCase()} to ${r.title.toLowerCase()} pivot, measured from ${om.postings.toLocaleString()} live ${om.title.toLowerCase()} postings: ${r.match}% skill readiness, ${r.salary} posted salary band, the exact gap, and the working graph preloaded to this route.`,
      alternates: { canonical: `/routes/${route}` },
    };
  }
  if (routeOrigins().includes(route)) {
    const om = originMeta(route);
    const roles = originRoles(route);
    const top = roles[0];
    return {
      title: `Alternative careers for ${om.title.toLowerCase()}s: ${roles.length} measured routes — PivotHop`,
      description: `Every career change from ${om.title.toLowerCase()} we can measure, ranked by skill readiness from ${om.postings.toLocaleString()} live postings${top ? ` — starting with ${top.title.toLowerCase()} at ${top.match}%` : ''}. Salary, transition time, and license gates for each.`,
      alternates: { canonical: `/routes/${route}` },
    };
  }
  return {};
}

const EV = { have: { mark: '✓', word: 'Covered' }, partial: { mark: '◑', word: 'Partial' }, gap: { mark: '○', word: 'Gap' } } as const;

export default async function RoutePage({ params }: { params: Promise<{ route: string }> }) {
  const { route } = await params;
  const def = getRouteDef(route);
  if (!def) {
    if (routeOrigins().includes(route)) return <OriginPage origin={route} />;
    notFound();
  }
  const r = destRole(def.origin, def.dest);
  if (!r) notFound();
  const om = originMeta(def.origin);
  const kids = unlocks(def.origin, def.dest);
  const observed = r.mobility != null && (r.mobility_source ?? '').startsWith('observed');
  const originLc = om.title.toLowerCase();

  return (
    <PageShell>
      <div className="rtp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb">
          <Link href="/">Instrument</Link><span>/</span><Link href="/routes">Routes</Link><span>/</span><span>{om.title} to {r.title}</span>
        </nav>
        <h1 className="rt-h1">{om.title} &rarr; {r.title}</h1>
        <p className="rt-dek">
          Measured from <strong>{om.postings.toLocaleString()}</strong>{` live ${originLc} postings and the destination’s own corpus.`}
          {observed ? ' Corroborated by observed US worker transitions.' : ''} Updated with the nightly scrape.
        </p>
        {r.license && <p className="rt-lic lbl">{r.license.label}</p>}

        <div className="rt-facts">
          <div><span className="v">{r.match}%</span><span className="k">Skill readiness</span></div>
          <div><span className="v">{r.salary}</span><span className="k">Posted salary band</span></div>
          <div><span className="v">{r.time}</span><span className="k">Transition estimate</span></div>
          <div><span className="v">{r.demand}</span><span className="k">Job demand</span></div>
          <div><span className="v">{r.remote}</span><span className="k">Fully remote share</span></div>
          {r.mobility != null && <div><span className="v">{r.mobility}</span><span className="k">{observed ? 'Observed flow (0–100)' : 'Relatedness (0–100)'}</span></div>}
        </div>

        {coverableSlugs().includes(def.dest) && (
          <Link className="rt-sallink lbl" href={`/salary/${def.dest}`}>
            {`Full ${r.title.toLowerCase()} pay data: median, seniority curve, by country and US state `}&rarr;
          </Link>
        )}

        <RouteInstrument origin={def.origin} focus={def.dest} />
        <p className="rt-hint lbl">The full instrument, preloaded to this route &middot; click any node to compare &middot; double-click to recenter</p>

        <section className="rt-sec">
          <h2>The judgment call</h2>
          {def.editorial}
        </section>

        <section className="rt-sec">
          <h2>Evidence checklist</h2>
          <p className="rt-note">{`What ${r.title.toLowerCase()} postings ask for, against what a typical ${originLc} already demonstrates. Drawn from the skill-overlap data, curated by hand.`}</p>
          <ul className="rt-ev">
            {def.evidence.map((e) => (
              <li key={e.label} data-state={e.state}>
                <span className="mk">{EV[e.state].mark}</span>
                <span className="lb">{e.label}</span>
                <span className="st">{EV[e.state].word}</span>
                <span className="nt">{e.note}</span>
              </li>
            ))}
          </ul>
        </section>

        {kids.length > 0 && (
          <section className="rt-sec">
            <h2>What this seat unlocks next</h2>
            <p className="rt-note">
              {`Second-ring routes that open once you hold the ${r.title.toLowerCase()} skill set: `}
              {kids.map((k, i) => (
                <span key={k.t}>{i > 0 ? ' · ' : ''}<strong>{k.t}</strong>{k.after != null ? ` (readiness rises to ${k.after}%)` : ''}</span>
              ))}. The graph above shows them attached to this node.
            </p>
          </section>
        )}

        <JobsList occ={def.dest} heading={`Open ${r.title.toLowerCase()} roles you could move into`} />

        <section className="rt-sec">
          <h2>Related routes</h2>
          <ul className="rt-rel">
            {def.related.map((slug) => {
              const rd = routePair(slug);
              const rr = rd && destRole(rd.origin, rd.dest);
              const rom = rd && originMeta(rd.origin);
              return rr && rom ? <li key={slug}><Link href={`/routes/${slug}`}>{rom.title} &rarr; {rr.title}</Link><span className="lbl">{rr.match}% readiness</span></li> : null;
            })}
          </ul>
        </section>

        <section className="rt-cta">
          <div>
            <h2>Take this route with you.</h2>
            <p>Run the graph with your own skills, then export the six-page report for this route. Free, no account.</p>
          </div>
          <Link className="rt-go" href={`/?from=${def.origin}`}>Run your own numbers &rarr;</Link>
        </section>

        {def.faq.length > 0 && (
          <div className="post-faq rt-faq">
            <h2>Quick answers</h2>
            {def.faq.map((f) => (
              <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
            ))}
          </div>
        )}

        <p className="rt-method lbl">
          {`Method: skill readiness is coverage of the destination’s posting-skill weight by a typical ${originLc} profile; salary bands are posted 25th–75th percentiles; observed flow is worker-transition data derived from the `}
          <a className="gl" href="/glossary#cps">CPS</a>
          {` (Current Population Survey; see the method section on the instrument). July 2026 corpus.`}
          {om.separations?.transfer != null ? (
            <>{` In a typical year ${om.separations.transfer}% of ${originLc} workers move to a different occupation (`}<a className="gl" href="/glossary#bls">BLS</a>{` Employment Projections, 2024–34).`}</>
          ) : ''}
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `${om.title} to ${r.title}: the measured route`,
        description: `Skill readiness ${r.match}%, posted band ${r.salary}, transition estimate ${r.time}.`,
        datePublished: '2026-07-22',
        author: { '@type': 'Person', name: 'Carlos Alvarez', url: 'https://www.pivothop.com/about' },
        publisher: { '@type': 'Organization', name: 'PivotHop' },
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
          { '@type': 'ListItem', position: 2, name: 'Routes', item: 'https://www.pivothop.com/routes' },
          { '@type': 'ListItem', position: 3, name: `${om.title} to ${r.title}`, item: `https://www.pivothop.com/routes/${route}` },
        ],
      }) }} />
      {def.faq.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: def.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
        }) }} />
      )}
    </PageShell>
  );
}

function OriginPage({ origin }: { origin: string }) {
  const om = originMeta(origin);
  const ol = om.title.toLowerCase();
  const rows = originRoles(origin).map((r) => {
    const slug = `${origin}-to-${r.id}`;
    return { r, slug: routePair(slug) ? slug : null }; // link only where a route page exists
  });
  const top = rows[0]?.r;
  const gated = rows.filter((x) => x.r.license?.req === 'required').length;
  const hasSalary = coverableSlugs().includes(origin);
  const boardN = jobCount(origin);

  const faq = [
    { q: `What are the best alternative careers for ${ol}s?`, a: `Ranked by measured skill readiness from live postings, the closest moves are ${rows.slice(0, 3).map((x) => `${x.r.title.toLowerCase()} (${x.r.match}%)`).join(', ')}. Readiness is the share of the destination's posted skill demand a typical ${ol} profile already covers.` },
    { q: `How many careers can a ${ol} actually reach?`, a: `We measure ${rows.length} routes out of ${ol} with real skill overlap, from ${om.postings.toLocaleString()} live postings. Most occupation pairs share almost no skills, so a ranked list of ${rows.length} is the honest count, not a limitation.${gated ? ` ${gated} of them are licensed professions where a credential, not the skill gap, sets the timeline.` : ''}` },
    { q: `Do ${ol} skills transfer to other jobs?`, a: `Yes, measurably${top ? `: the closest destination, ${top.title.toLowerCase()}, is ${top.match}% covered by a typical ${ol} profile before any retraining` : ''}. Each route page lists exactly which skills carry and which are missing, read from the destination's own postings.` },
  ];

  return (
    <PageShell>
      <div className="rtp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb">
          <Link href="/">Instrument</Link><span>/</span><Link href="/routes">Routes</Link><span>/</span><span>{om.title}</span>
        </nav>
        <h1 className="rt-h1">Alternative careers for {ol}s</h1>
        <p className="rt-dek">
          {`Every career change from ${ol} we can measure, ranked by skill readiness against ${om.postings.toLocaleString()} live postings. No quiz, no vibes: the salary, the transition estimate, and the license gate for each route.`}
          {om.separations?.transfer != null ? ` In a typical year ${om.separations.transfer}% of ${ol}s move to a different occupation.` : ''}
        </p>

        <div className="rt-facts">
          <div><span className="v">{rows.length}</span><span className="k">Measured routes</span></div>
          {top && <div><span className="v">{top.match}%</span><span className="k">Closest readiness</span></div>}
          <div><span className="v">{om.postings.toLocaleString()}</span><span className="k">Postings read</span></div>
          {om.separations?.transfer != null && <div><span className="v">{om.separations.transfer}%</span><span className="k">Switch occupations yearly</span></div>}
          {gated > 0 && <div><span className="v">{gated}</span><span className="k">Routes with a license gate</span></div>}
        </div>

        <section className="rt-sec">
          <h2>The routes, ranked</h2>
          <p className="rt-note">Readiness is the share of the destination&rsquo;s posted skill demand a typical {ol} profile already covers. Click through for the full skill map, the gap, and the evidence checklist.</p>
          <ul className="rt-rel">
            {rows.map(({ slug, r }) => (
              <li key={r.id}>
                {slug
                  ? <Link href={`/routes/${slug}`}>{om.title} &rarr; {r.title}</Link>
                  : <span>{om.title} &rarr; {r.title}</span>}
                <span className="lbl">{r.match}% &middot; {r.salary ?? 'salary n/a'} &middot; {r.time}{r.license?.req === 'required' ? ' · license' : ''}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rt-cta">
          <div>
            <h2>Your skills are not the typical profile.</h2>
            <p>Run the instrument with your own skill set and the readiness numbers recompute for you, route by route. Free, no account.</p>
          </div>
          <Link className="rt-go" href={`/?from=${origin}`}>Run your own numbers &rarr;</Link>
        </section>

        <div className="post-faq rt-faq">
          <h2>Quick answers</h2>
          {faq.map((f) => (
            <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
          ))}
        </div>

        <p className="rt-method lbl">
          {`Method: readiness is coverage of each destination's posting-skill weight by a typical ${ol} profile, from the same nightly corpus the instrument runs on. Routes sharing fewer than three skills are not scored. `}
          {hasSalary && <>What {ol}s earn today: <a className="gl" href={`/salary/${origin}`}>{ol} salary</a>. </>}
          {boardN > 0 && <>Open {ol} roles on the board: <a className="gl" href={`/jobs/${origin}`}>{boardN.toLocaleString()} live</a>. </>}
          Worker-transition context is <a className="gl" href="/glossary#bls">BLS</a> (Bureau of Labor Statistics) Employment Projections.
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `Alternative careers for ${ol}s: ${rows.length} measured routes`,
        description: `Career changes from ${ol}, ranked by skill readiness from ${om.postings.toLocaleString()} live postings.`,
        datePublished: '2026-07-25',
        author: { '@type': 'Person', name: 'Carlos Alvarez', url: 'https://www.pivothop.com/about' },
        publisher: { '@type': 'Organization', name: 'PivotHop' },
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
          { '@type': 'ListItem', position: 2, name: 'Routes', item: 'https://www.pivothop.com/routes' },
          { '@type': 'ListItem', position: 3, name: `Alternative careers for ${ol}s`, item: `https://www.pivothop.com/routes/${origin}` },
        ],
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `Alternative careers for ${ol}s`,
        numberOfItems: rows.length,
        itemListElement: rows.map(({ slug, r }, i) => ({
          '@type': 'ListItem', position: i + 1,
          name: `${om.title} to ${r.title} (${r.match}% readiness)`,
          ...(slug ? { url: `https://www.pivothop.com/routes/${slug}` } : {}),
        })),
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      }) }} />
    </PageShell>
  );
}
