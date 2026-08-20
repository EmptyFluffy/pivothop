import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '../../components/SiteChrome';
import { getRouteDef, routableSlugs, routePair, originMeta, destRole, unlocks, routeOrigins, originRoles, hasOriginPage } from '../routes-data';
// coverableSlugs is the SAME predicate the salary generator uses — linking on
// anything else (e.g. the curated SALARY_SLUGS list) can point at pages the
// data floor didn't generate. The CI link gate caught exactly that.
import { coverableSlugs, getSalary, usBand, fmt } from '../../salary/salary-data';
import { jobCount } from '../../jobs/jobs-data';
import JobsList from '../../jobs/JobsList';
import RouteInstrument from '../RouteInstrument';
import { pickAnchor } from '../../../lib/site';
import { article } from '../../../lib/site';

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
      title: `${om.title} to ${r.title}: match, salary, gap`,
      description: `The ${om.title.toLowerCase()} to ${r.title.toLowerCase()} pivot, measured from ${om.postings.toLocaleString()} live ${om.title.toLowerCase()} postings: ${r.match}% skill readiness, ${r.salary} posted salary band, the exact gap, and the working graph preloaded to this route.`,
      alternates: { canonical: `/routes/${route}` },
    };
  }
  if (routeOrigins().includes(route)) {
    const om = originMeta(route);
    const roles = originRoles(route);
    const top = roles[0];
    return {
      title: `Alternative careers for ${om.title.toLowerCase()}s: ${roles.length} measured routes`,
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
  const destBoard = jobCount(def.dest);
  const destLc = r.title.toLowerCase();

  return (
    <PageShell v2 active="routes">
      <div className="rtp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb">
          <Link href="/">Instrument</Link><span>/</span><Link href="/routes">Routes</Link><span>/</span>
          {/* The origin hub belongs in the trail: a pair page is a child of
              "alternative careers for X", and this was the only surface that
              never linked back to it. Guarded — the origin set is gated. */}
          {hasOriginPage(def.origin)
            ? <><Link href={`/routes/${def.origin}`}>{om.title}</Link><span>/</span></>
            : null}
          <span>{om.title} to {r.title}</span>
        </nav>
        <h1 className="rt-h1">{om.title} <span className="rt2-arrow">&rarr;</span> {r.title}</h1>
        <p className="rt-dek">
          Measured from <strong>{om.postings.toLocaleString()}</strong>{` live ${originLc} postings and the destination’s own corpus.`}
          {observed ? ' Corroborated by observed US worker transitions.' : ''} Updated with the nightly scrape.
        </p>
        {r.license && <p className="rt-lic lbl"><Link href={`/licenses#occ-${r.id}`} data-license={r.id}>{r.license.label}</Link></p>}

        <div className="rt2-measure" aria-hidden="true">
          <div className="line"><span>{om.title}</span><span className="bar"><i style={{ width: `${Math.max(2, Math.min(100, r.match))}%` }} /></span><span>{r.title}</span></div>
          <div className="pct">{r.match}% of posted demand covered</div>
        </div>

        <div className="rt2-stats">
          <div><span className="v">{r.match}%</span><span className="k">Skill readiness</span></div>
          <div><span className="v">{r.salary}</span><span className="k">Posted salary band</span></div>
          {destBoard > 0
            ? <div><span className="v">{destBoard}</span><span className="k">Live openings today</span></div>
            : <div><span className="v">{r.time}</span><span className="k">Transition estimate</span></div>}
        </div>
        <p className="rt2-meta lbl">
          {r.time} transition &middot; {r.demand} job demand &middot; {r.remote} fully remote
          {r.mobility != null ? <> &middot; {observed ? 'observed flow' : 'relatedness'} {r.mobility}/100</> : null}
        </p>

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
          <div className="rt2-ev2">
            <div>
              <span className="rt2-evh have">You already have</span>
              <ul className="rt-ev">
                {def.evidence.filter((e) => e.state !== 'gap').map((e) => (
                  <li key={e.label} data-state={e.state}>
                    <span className="mk">{EV[e.state].mark}</span>
                    <span className="lb">{e.label}</span>
                    <span className="st">{EV[e.state].word}</span>
                    <span className="nt">{e.note}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="rt2-evh gap">The gap</span>
              {def.evidence.some((e) => e.state === 'gap') ? (
                <ul className="rt-ev">
                  {def.evidence.filter((e) => e.state === 'gap').map((e) => (
                    <li key={e.label} data-state={e.state}>
                      <span className="mk">{EV[e.state].mark}</span>
                      <span className="lb">{e.label}</span>
                      <span className="st">{EV[e.state].word}</span>
                      <span className="nt">{e.note}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rt-note">No named gap skills in this route&rsquo;s data; the residual is depth, not breadth.</p>
              )}
            </div>
          </div>
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

        {/* Intent is legible here: this reader has already chosen a destination,
            so the board is the next step, not the instrument. Count-gated — a
            route with no live listings falls back to the tool rather than
            promising an empty page. */}
        <section className="rt2-ctas" aria-label="Next steps">
          {destBoard > 0 && (
            <Link className="rt2-cta" href={`/jobs/${def.dest}`}>
              <span className="rt2-cta-main">
                <span className="rt2-cta-t">{destBoard} open {destLc} {destBoard === 1 ? 'role' : 'roles'} <span className="jv-at">on the board now</span></span>
                <span className="rt2-cta-s">{`Pay where it is posted. Your ${originLc} profile already covers ${r.match}% of what they ask.`}</span>
              </span>
              <span className="jv-apply">Browse</span>
            </Link>
          )}
          <Link className="rt2-cta" href={`/?from=${def.origin}`}>
            <span className="rt2-cta-main">
              <span className="rt2-cta-t">Run your own numbers <span className="jv-at">on the instrument</span></span>
              <span className="rt2-cta-s">Edit the skills, watch the map recompute, export the six-page report for this route. Free, no account.</span>
            </span>
            <span className="jv-apply">Open</span>
          </Link>
        </section>

        {def.faq.length > 0 && (
          <div className="post-faq rt-faq">
            <h2>Quick answers</h2>
            {def.faq.map((f) => (
              <details key={f.q} name="pagefaq"><summary>{f.q}</summary><p>{f.a}</p></details>
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
          // Mirrors the visible trail; the origin rung only exists when it does.
          ...(hasOriginPage(def.origin)
            ? [{ '@type': 'ListItem', position: 3, name: om.title, item: `https://www.pivothop.com/routes/${def.origin}` },
               { '@type': 'ListItem', position: 4, name: `${om.title} to ${r.title}`, item: `https://www.pivothop.com/routes/${route}` }]
            : [{ '@type': 'ListItem', position: 3, name: `${om.title} to ${r.title}`, item: `https://www.pivothop.com/routes/${route}` }]),
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
  // Openings across every destination this origin measurably reaches. The
  // reader here has not picked a destination yet, so the instrument is still
  // the honest next step — but the promise should be the outcome, and this is
  // the number that states it.
  const reach = rows
    .map((x) => ({ title: x.r.title, id: x.r.id, match: x.r.match, n: jobCount(x.r.id) }))
    .filter((x) => x.n > 0 && x.id !== origin);
  const reachTotal = reach.reduce((s, x) => s + x.n, 0);
  const reachBest = [...reach].sort((a, b) => b.n - a.n)[0];

  // ── Per-page findings, computed ───────────────────────────────────────────
  // Origin pages were 72% word-for-word identical to each other: a ranked table,
  // a CTA, an FAQ, and the same prose around different numbers. These four read
  // the payload we already emit and produce different sentences per occupation,
  // which is the difference between structured data and a filled-in template.
  const all = rows.map((x) => x.r);
  const findings: string[] = [];
  // Phrasing varies by origin so 125 pages do not share one connective tissue.
  // The facts are computed; only the wording around them rotates.
  const V = (opts: string[]) => pickAnchor(opts, origin);
  const V2 = (opts: string[]) => pickAnchor(opts, origin, 1);

  // 1. Where the routes actually go — same field, or out of it.
  const sameField = all.filter((r) => (r.field || '').toLowerCase() === (om.field || '').toLowerCase()).length;
  const outField = all.length - sameField;
  const fieldNames = [...new Set(all.map((r) => r.field).filter(Boolean))];
  if (all.length >= 3 && om.field) {
    findings.push(
      sameField === 0
        ? `Every measured route leaves ${om.field.toLowerCase()}. There is no adjacent move that keeps ${article(ol)} ${ol} inside the same field, which makes this a field change rather than a step sideways.`
        : outField === 0
          ? `All ${all.length} routes stay inside ${om.field.toLowerCase()}. The skills that transfer are the ones this field already trains, so none of these moves means starting over.`
          : V([
              `${sameField} of ${all.length} routes stay inside ${om.field.toLowerCase()}; ${outField} leave it, into ${fieldNames.filter((fx) => fx.toLowerCase() !== om.field!.toLowerCase()).slice(0, 3).map((fx) => fx.toLowerCase()).join(', ')}.`,
              `The set splits ${sameField}/${outField}: ${sameField} destinations sit inside ${om.field.toLowerCase()}, ${outField} outside it (${fieldNames.filter((fx) => fx.toLowerCase() !== om.field!.toLowerCase()).slice(0, 3).map((fx) => fx.toLowerCase()).join(', ')}).`,
              `Most of this list is not a field change: ${sameField} of ${all.length} destinations remain in ${om.field.toLowerCase()}, ${outField} reaching into ${fieldNames.filter((fx) => fx.toLowerCase() !== om.field!.toLowerCase()).slice(0, 2).map((fx) => fx.toLowerCase()).join(' and ')}.`,
            ])
    );
  }

  // 2. What the ranking rests on — observed worker flow, or skill overlap alone.
  const obsUS = all.filter((r) => (r.mobility_source ?? '').startsWith('observed-flow-us')).length;
  const obsEU = all.filter((r) => r.mobility_source === 'observed-flow-eu').length;
  const rel = all.filter((r) => r.mobility_source === 'related').length;
  const none = all.length - obsUS - obsEU - rel;
  if (all.length >= 3) {
    const parts: string[] = [];
    if (obsUS) parts.push(`${obsUS} ${obsUS === 1 ? 'is' : 'are'} corroborated by observed US worker transitions`);
    if (obsEU) parts.push(`${obsEU} by European résumé trajectories`);
    if (rel) parts.push(`${rel} by the O*NET related-occupations list`);
    if (parts.length) {
      findings.push(V2([
        `Of the ${all.length}, ${parts.join(', ')}${none ? `; ${none} rest${none === 1 ? 's' : ''} on skill overlap alone` : ''}.`,
        `Evidence behind the ranking: ${parts.join(', ')}${none ? `, with ${none} on posted skills only` : ''}.`,
        `${parts.join(', ')}${none ? `. The remaining ${none} ${none === 1 ? 'is' : 'are'} scored from posted skills alone` : ''}.`,
      ]));
    }
  }

  // 3. Which way the pay moves, priced from each destination's own corpus.
  const originP50 = usBand(getSalary(origin) ?? ({} as never))?.p50 ?? 0;
  const paid = all
    .map((r) => ({ r, p50: usBand(getSalary(r.id) ?? ({} as never))?.p50 ?? 0 }))
    .filter((x) => x.p50 > 0);
  if (originP50 && paid.length >= 3) {
    const up = paid.filter((x) => x.p50 > originP50);
    const best = [...up].sort((a, b) => b.p50 - a.p50)[0];
    findings.push(
      up.length === 0
        ? `None of the priced destinations pays more than ${ol} work at the median. A move from here buys a different kind of job, not a raise.`
        : V([
            `${up.length} of ${paid.length} priced destinations pay above the ${ol} median${best ? `, topping out at ${best.r.title.toLowerCase()} on ${fmt(best.p50)}` : ''}.`,
            `Pay rises on ${up.length} of ${paid.length} priced routes${best ? `; ${best.r.title.toLowerCase()} is the highest at ${fmt(best.p50)}` : ''}.`,
            `${up.length} destinations out of ${paid.length} priced pay more than ${ol} work does${best ? `, the furthest being ${best.r.title.toLowerCase()} at ${fmt(best.p50)}` : ''}.`,
          ])
    );
  }

  // 4. Which skills are doing the carrying across the whole set.
  const skillFreq = new Map<string, number>();
  for (const r of all) for (const s of new Set(r.have ?? [])) skillFreq.set(s, (skillFreq.get(s) ?? 0) + 1);
  const carriers = [...skillFreq.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (carriers.length >= 2 && all.length >= 3) {
    findings.push(V2([
      `${carriers.map(([sk, n]) => `${sk} carries into ${n} of ${all.length}`).join(', ')}.`,
      `The skills doing the work: ${carriers.map(([sk, n]) => `${sk} (${n}/${all.length})`).join(', ')}.`,
      `${carriers[0][0]} appears in ${carriers[0][1]} of ${all.length} destinations, ${carriers.slice(1).map(([sk, n]) => `${sk} in ${n}`).join(', ')}.`,
    ]));
  }

  const faq = [
    { q: `What are the best alternative careers for ${ol}s?`, a: `Ranked by measured skill readiness from live postings, the closest moves are ${rows.slice(0, 3).map((x) => `${x.r.title.toLowerCase()} (${x.r.match}%)`).join(', ')}. Readiness is the share of the destination's posted skill demand a typical ${ol} profile already covers.` },
    { q: `How many careers can ${article(ol)} ${ol} actually reach?`, a: `We measure ${rows.length} routes out of ${ol} with real skill overlap, from ${om.postings.toLocaleString()} live postings. Most occupation pairs share almost no skills, so a ranked list of ${rows.length} is the honest count, not a limitation.${gated ? ` ${gated} of them are licensed professions where a credential, not the skill gap, sets the timeline.` : ''}` },
    { q: `Do ${ol} skills transfer to other jobs?`, a: `Yes, measurably${top ? `: the closest destination, ${top.title.toLowerCase()}, is ${top.match}% covered by a typical ${ol} profile before any retraining` : ''}. Each route page lists exactly which skills carry and which are missing, read from the destination's own postings.` },
  ];

  return (
    <PageShell v2 active="routes">
      <div className="rtp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb">
          <Link href="/">Instrument</Link><span>/</span><Link href="/routes">Routes</Link><span>/</span><span>{om.title}</span>
        </nav>
        <h1 className="rt-h1">Alternative careers for {ol}s</h1>
        <p className="rt-dek">
          {V([
            `Every career change from ${ol} we can measure, ranked by skill readiness against ${om.postings.toLocaleString()} live postings. No quiz, no vibes: the salary, the transition estimate, and the license gate for each route.`,
            `${rows.length} measured moves out of ${ol}, scored against ${om.postings.toLocaleString()} live postings and ranked by how much of each destination a typical profile already covers. Salary, timeline, and licence gate attached to every one.`,
            `What ${article(ol)} ${ol} can move into, measured rather than suggested: ${rows.length} destinations read from ${om.postings.toLocaleString()} live postings, each with its pay band, its realistic timeline, and whether a credential stands in the way.`,
          ])}
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
          <p className="rt-note">{V2([
            `Readiness is the share of the destination's posted skill demand a typical ${ol} profile already covers. Click through for the full skill map, the gap, and the evidence checklist.`,
            `Each percentage is how much of that role's posted demand ${article(ol)} ${ol} profile covers before retraining. The route pages break it down skill by skill.`,
            `The number is coverage, not a guess: what share of the destination's own postings ${article(ol)} ${ol} already answers. Open a route for the full gap.`,
          ])}</p>
          <div className="rt2-thead lbl" aria-hidden="true"><span>Route</span><span>Readiness</span><span>Posted band</span><span>Timeline</span></div>
          <ul className="rt2-ranked">
            {rows.map(({ slug, r }) => (
              <li key={r.id}>
                <span className="rt2-r-main">
                  {slug
                    ? <Link href={`/routes/${slug}`}>{om.title} &rarr; {r.title}</Link>
                    : <span className="rt2-r-dead">{om.title} &rarr; {r.title}</span>}
                  <span className="rt-bar" aria-hidden="true"><i style={{ width: `${Math.max(2, Math.min(100, r.match))}%` }} /></span>
                </span>
                <span className="rt2-r-m">{r.match}%</span>
                <span className="rt2-r-s">{r.salary ?? '\u00B7'}</span>
                <span className="rt2-r-x">{r.time}{r.license?.req === 'required' ? ' \u00B7 license' : ''}</span>
              </li>
            ))}
          </ul>
        </section>

        {findings.length >= 2 && (
          <section className="rt-sec">
            <h2>What the ranking shows</h2>
            <p className="rt-note">{V([`Read off the ${rows.length} routes above and the corpus behind them. It changes when the data does.`, `Derived from the ${rows.length} routes above, recomputed each night.`, `What the ${rows.length} measured routes say when read together.`])}</p>
            <ul className="rt-find">
              {findings.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </section>
        )}

        <section className="rt-cta">
          <div>
            <h2>{reachTotal > 0 ? `${reachTotal.toLocaleString()} of these roles are open right now.` : 'Your skills are not the typical profile.'}</h2>
            <p>
              {reachTotal > 0
                ? V2([
                    `Across the ${reach.length} ${reach.length === 1 ? 'career' : 'careers'} above with live listings. Run the instrument with your own skill set and the readiness recomputes for you, route by route. Free, no account.`,
                    `Spread over ${reach.length} of the destinations above. Put your own skills in and every number on this page recalculates against them. Free, no account.`,
                    `Counted across ${reach.length} ${reach.length === 1 ? 'destination' : 'destinations'} hiring now. Your skill set is not the typical ${ol} profile, so run it and see where the ranking moves. Free, no account.`,
                  ])
                : 'Run the instrument with your own skill set and the readiness numbers recompute for you, route by route. Free, no account.'}
            </p>
          </div>
          <Link className="rt-go" href={`/?from=${origin}`}>See which ones your skills reach &rarr;</Link>
        </section>

        {reachBest && (
          <p className="rt-method lbl">
            Skipping ahead:{' '}
            <Link className="gl" href={`/jobs/${reachBest.id}`}>
              {reachBest.n} open {reachBest.title.toLowerCase()} {reachBest.n === 1 ? 'role' : 'roles'}
            </Link>
            {` — the largest live board among them, at ${reachBest.match}% readiness from ${ol}.`}
          </p>
        )}

        <div className="post-faq rt-faq">
          <h2>Quick answers</h2>
          {faq.map((f) => (
            <details key={f.q} name="pagefaq"><summary>{f.q}</summary><p>{f.a}</p></details>
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
