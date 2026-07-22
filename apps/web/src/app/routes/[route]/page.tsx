import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '../../components/SiteChrome';
import { ROUTES, ROUTE_SLUGS, ORIGIN, destRole, unlocks } from '../routes-data';
import RouteInstrument from '../RouteInstrument';

export function generateStaticParams() {
  return ROUTE_SLUGS.map((route) => ({ route }));
}

export async function generateMetadata({ params }: { params: Promise<{ route: string }> }): Promise<Metadata> {
  const { route } = await params;
  const def = ROUTES[route];
  const r = def && destRole(def.dest);
  if (!def || !r) return {};
  return {
    title: `Architect to ${r.title}: match, salary, skill gap — PivotHop`,
    description: `The architect to ${r.title.toLowerCase()} pivot, measured from ${ORIGIN.postings.toLocaleString()} live architect postings: ${r.match}% skill readiness, ${r.salary} posted salary band, the exact gap, and the working graph preloaded to this route.`,
    alternates: { canonical: `/routes/${route}` },
  };
}

const EV = { have: { mark: '✓', word: 'Covered' }, partial: { mark: '◑', word: 'Partial' }, gap: { mark: '○', word: 'Gap' } } as const;

export default async function RoutePage({ params }: { params: Promise<{ route: string }> }) {
  const { route } = await params;
  const def = ROUTES[route];
  if (!def) notFound();
  const r = destRole(def.dest);
  if (!r) notFound();
  const kids = unlocks(def.dest);
  const observed = r.mobility != null && (r.mobility_source ?? '').startsWith('observed');

  return (
    <PageShell>
      <div className="rtp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb">
          <Link href="/">Instrument</Link><span>/</span><Link href="/routes">Routes</Link><span>/</span><span>Architect to {r.title}</span>
        </nav>
        <h1 className="rt-h1">Architect &rarr; {r.title}</h1>
        <p className="rt-dek">
          Measured from <strong>{ORIGIN.postings.toLocaleString()}</strong>{' '}live architect postings and the destination&rsquo;s own corpus.
          {observed ? ' Corroborated by observed US worker transitions.' : ''} Updated with the nightly scrape.
        </p>

        <div className="rt-facts">
          <div><span className="v">{r.match}%</span><span className="k">Skill readiness</span></div>
          <div><span className="v">{r.salary}</span><span className="k">Posted salary band</span></div>
          <div><span className="v">{r.time}</span><span className="k">Transition estimate</span></div>
          <div><span className="v">{r.demand}</span><span className="k">Job demand</span></div>
          <div><span className="v">{r.remote}</span><span className="k">Fully remote share</span></div>
          {r.mobility != null && <div><span className="v">{r.mobility}</span><span className="k">{observed ? 'Observed flow (0–100)' : 'Relatedness (0–100)'}</span></div>}
        </div>
        {r.license && <p className="rt-lic lbl">{r.license.label}</p>}

        <RouteInstrument focus={def.dest} />
        <p className="rt-hint lbl">The full instrument, preloaded to this route &middot; click any node to compare &middot; double-click to recenter</p>

        <section className="rt-sec">
          <h3>The judgment call</h3>
          {def.editorial}
        </section>

        <section className="rt-sec">
          <h3>Evidence checklist</h3>
          <p className="rt-note">What {r.title.toLowerCase()} postings ask for, against what architecture practice already demonstrates. Drawn from the skill-overlap data, curated by hand.</p>
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
            <h3>What this seat unlocks next</h3>
            <p className="rt-note">
              Second-ring routes that open once you hold the {r.title.toLowerCase()} skill set:
              {' '}{kids.map((k, i) => (
                <span key={k.t}>{i > 0 ? ' · ' : ''}<strong>{k.t}</strong>{k.after != null ? ` (readiness rises to ${k.after}%)` : ''}</span>
              ))}. The graph above shows them attached to this node.
            </p>
          </section>
        )}

        <section className="rt-sec">
          <h3>Related routes</h3>
          <ul className="rt-rel">
            {def.related.map((slug) => {
              const rd = ROUTES[slug];
              const rr = rd && destRole(rd.dest);
              return rr ? <li key={slug}><Link href={`/routes/${slug}`}>Architect &rarr; {rr.title}</Link><span className="lbl">{rr.match}% readiness</span></li> : null;
            })}
          </ul>
        </section>

        <section className="rt-cta">
          <div>
            <h3>Take this route with you.</h3>
            <p>Run the graph with your own skills, then export the six-page report for this route. Free, no account.</p>
          </div>
          <Link className="rt-go" href="/?from=architect">Run your own numbers &rarr;</Link>
        </section>

        {def.faq.length > 0 && (
          <div className="post-faq rt-faq">
            <h3>Quick answers</h3>
            {def.faq.map((f) => (
              <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
            ))}
          </div>
        )}

        <p className="rt-method lbl">
          Method: skill readiness is coverage of the destination&rsquo;s posting-skill weight by a typical architect profile; salary bands are posted 25th&ndash;75th percentiles; observed flow is CPS-derived worker-transition data (see the method section on the instrument). July 2026 corpus. In a typical year {ORIGIN.separations?.transfer ?? '—'}% of architects move to a different occupation (BLS EP 2024&ndash;34).
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `Architect to ${r.title}: the measured route`,
        description: `Skill readiness ${r.match}%, posted band ${r.salary}, transition estimate ${r.time}.`,
        datePublished: '2026-07-22',
        author: { '@type': 'Person', name: 'Carlos', url: 'https://pivothop.com/about' },
        publisher: { '@type': 'Organization', name: 'PivotHop' },
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://pivothop.com/' },
          { '@type': 'ListItem', position: 2, name: 'Routes', item: 'https://pivothop.com/routes' },
          { '@type': 'ListItem', position: 3, name: `Architect to ${r.title}`, item: `https://pivothop.com/routes/${route}` },
        ],
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: def.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      }) }} />
    </PageShell>
  );
}
