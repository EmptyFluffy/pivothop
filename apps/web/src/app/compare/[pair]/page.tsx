import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '../../components/SiteChrome';
import { getPair, compareSlugs, relatedPairs, fmtBand, mid, pairVerdict, type ComparePair, type CompareDir } from '../compare-data';
import { occTitle, occField, jobCount } from '../../jobs/jobs-data';
import { coverableSlugs } from '../../salary/salary-data';
import { routePair, routeOrigins } from '../../routes/routes-data';

export function generateStaticParams() {
  return compareSlugs().map((pair) => ({ pair }));
}

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const { pair } = await params;
  const p = getPair(pair);
  if (!p) return {};
  const tA = occTitle(p.a), tB = occTitle(p.b);
  return {
    title: `${tA} vs ${tB}: salary, skills, and the measured overlap — PivotHop`,
    description: `${tA} vs ${tB}, measured from live postings: posted salary bands (${fmtBand(p.bandA) ?? 'n/a'} vs ${fmtBand(p.bandB) ?? 'n/a'}), skill readiness in both directions, the shared skills, and which switch is easier.`,
    alternates: { canonical: `/compare/${pair}` },
  };
}

function DirBlock({ from, to, d }: { from: string; to: string; d: CompareDir | null }) {
  const tFrom = occTitle(from), tTo = occTitle(to);
  const route = routePair(`${from}-to-${to}`) ? `/routes/${from}-to-${to}` : null;
  if (!d) {
    return (
      <div className="cmp-dir">
        <h3>{tFrom} &rarr; {tTo}</h3>
        <p className="rt-note">Not scored: the pair shares too few skills in this direction to measure honestly. <Link className="gl" href={`/?from=${from}`}>Run the instrument</Link> with your own skill set for a personal read.</p>
      </div>
    );
  }
  return (
    <div className="cmp-dir">
      <h3>{tFrom} &rarr; {tTo}</h3>
      <div className="d-match"><span className="n">{d.match}</span><span className="u">% skill readiness</span></div>
      {d.license && <p className="rt-lic lbl">{d.license.label}</p>}
      {d.time && <p className="rt-note">Transition estimate: {d.time}.</p>}
      {(d.unique?.length ?? 0) > 0 && (
        <p className="rt-note">The gap, from {tTo.toLowerCase()} postings: {d.unique!.slice(0, 4).join(', ')}.</p>
      )}
      <p className="rt-note">
        {route
          ? <Link className="gl" href={route}>The full route page: {tFrom.toLowerCase()} to {tTo.toLowerCase()}</Link>
          : <Link className="gl" href={`/?from=${from}`}>Run this direction on the instrument</Link>}
      </p>
    </div>
  );
}

export default async function ComparePage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const p = getPair(pair);
  if (!p) notFound();
  const tA = occTitle(p.a), tB = occTitle(p.b);
  const lA = tA.toLowerCase(), lB = tB.toLowerCase();
  const rich = p.ab?.rich ? p.ab : p.ba?.rich ? p.ba : null;
  const shared = rich?.shared ?? [];
  const boardA = jobCount(p.a), boardB = jobCount(p.b);
  const mA = mid(p.bandA), mB = mid(p.bandB);
  const asym = p.ab && p.ba && Math.abs(p.ab.match - p.ba.match) >= 15
    ? (p.ab.match > p.ba.match ? { from: tA, to: tB, hi: p.ab.match, lo: p.ba.match } : { from: tB, to: tA, hi: p.ba.match, lo: p.ab.match })
    : null;
  const related = relatedPairs(pair);

  const faq = [
    {
      q: `Which pays more, ${lA} or ${lB}?`,
      a: `Posted mid-bands from each occupation's own corpus: ${tA} ${fmtBand(p.bandA) ?? 'not enough stated salaries'}, ${tB} ${fmtBand(p.bandB) ?? 'not enough stated salaries'}.${mA && mB ? ` At the midpoint that favors the ${(mA >= mB ? lA : lB)} by about $${Math.round(Math.abs(mA - mB) / 1000)}k a year.` : ''} Only postings that state pay are counted.`,
    },
    {
      q: `Are ${lA} and ${lB} the same job?`,
      a: `${Math.max(p.ab?.match ?? 0, p.ba?.match ?? 0) >= 65 ? 'Close: the skill sets largely overlap in live postings, and the difference is mostly emphasis and title.' : Math.max(p.ab?.match ?? 0, p.ba?.match ?? 0) >= 40 ? 'Related but distinct: postings share a real core and then diverge.' : 'No — despite the similar names, their postings demand mostly different skills.'}${shared.length ? ` Skills both sets of postings ask for: ${shared.slice(0, 5).join(', ')}.` : ''}`,
    },
    ...(p.ab ? [{
      q: `Can a ${lA} become a ${lB}?`,
      a: `Skill readiness is ${p.ab.match} percent: that share of what ${lB} postings demand, a typical ${lA} profile already covers.${p.ab.license ? ` Note the credential gate: ${p.ab.license.label.toLowerCase()}.` : ''}${p.ab.time ? ` Estimated transition: ${p.ab.time}.` : ''}`,
    }] : []),
    ...(p.ba ? [{
      q: `Can a ${lB} become a ${lA}?`,
      a: `Skill readiness is ${p.ba.match} percent in this direction.${p.ba.license ? ` Note the credential gate: ${p.ba.license.label.toLowerCase()}.` : ''}${p.ba.time ? ` Estimated transition: ${p.ba.time}.` : ''}${asym ? ` The asymmetry is the finding: ${asym.from.toLowerCase()} to ${asym.to.toLowerCase()} is the easier direction (${asym.hi}% vs ${asym.lo}%).` : ''}`,
    }] : []),
  ];

  return (
    <PageShell>
      <div className="rtp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb">
          <Link href="/">Instrument</Link><span>/</span><Link href="/compare">Compare</Link><span>/</span><span>{tA} vs {tB}</span>
        </nav>
        <h1 className="rt-h1">{tA} vs {tB}</h1>
        <p className="rt-dek">{pairVerdict(p)} Salary bands, both switching directions, and the shared skills below — every number from live postings, refreshed nightly.</p>

        <div className="cmp-grid">
          <div className="cmp-col">
            <h2>{tA}</h2>
            <div className="drow"><span className="k">Posted band</span><span className="v">{fmtBand(p.bandA) ?? '—'}</span></div>
            <div className="drow"><span className="k">Field</span><span className="v">{occField(p.a)}</span></div>
            <div className="drow"><span className="k">Postings read</span><span className="v">{p.postingsA.toLocaleString()}</span></div>
            {p.ba?.demand && <div className="drow"><span className="k">Demand</span><span className="v">{p.ba.demand}</span></div>}
            {p.ba?.remote && <div className="drow"><span className="k">Fully remote</span><span className="v">{p.ba.remote}</span></div>}
            {p.ba?.license && <div className="drow"><span className="k">License</span><span className="v">{p.ba.license.req === 'required' ? 'Required' : 'Some roles'}</span></div>}
            <p className="rt-note cmp-links">
              {boardA > 0 && <><Link className="gl" href={`/jobs/${p.a}`}>{boardA.toLocaleString()} open roles</Link>{' · '}</>}
              {coverableSlugs().includes(p.a) && <><Link className="gl" href={`/salary/${p.a}`}>{lA} salary</Link>{' · '}</>}
              {routeOrigins().includes(p.a) && <Link className="gl" href={`/routes/${p.a}`}>careers for {lA}s</Link>}
            </p>
          </div>
          <div className="cmp-col">
            <h2>{tB}</h2>
            <div className="drow"><span className="k">Posted band</span><span className="v">{fmtBand(p.bandB) ?? '—'}</span></div>
            <div className="drow"><span className="k">Field</span><span className="v">{occField(p.b)}</span></div>
            <div className="drow"><span className="k">Postings read</span><span className="v">{p.postingsB.toLocaleString()}</span></div>
            {p.ab?.demand && <div className="drow"><span className="k">Demand</span><span className="v">{p.ab.demand}</span></div>}
            {p.ab?.remote && <div className="drow"><span className="k">Fully remote</span><span className="v">{p.ab.remote}</span></div>}
            {p.ab?.license && <div className="drow"><span className="k">License</span><span className="v">{p.ab.license.req === 'required' ? 'Required' : 'Some roles'}</span></div>}
            <p className="rt-note cmp-links">
              {boardB > 0 && <><Link className="gl" href={`/jobs/${p.b}`}>{boardB.toLocaleString()} open roles</Link>{' · '}</>}
              {coverableSlugs().includes(p.b) && <><Link className="gl" href={`/salary/${p.b}`}>{lB} salary</Link>{' · '}</>}
              {routeOrigins().includes(p.b) && <Link className="gl" href={`/routes/${p.b}`}>careers for {lB}s</Link>}
            </p>
          </div>
        </div>

        {shared.length > 0 && (
          <section className="rt-sec">
            <h2>The overlap, measured</h2>
            <p className="rt-note">Skills that appear in both occupations&rsquo; posting demand. This is the shared core; everything else on each side is the difference.</p>
            <div className="tags">{shared.map((s) => <span key={s} className="tag have">{s}</span>)}</div>
          </section>
        )}

        <section className="rt-sec">
          <h2>Switching, both directions</h2>
          {asym && <p className="rt-note"><strong>The asymmetry is the finding:</strong> {asym.from.toLowerCase()} &rarr; {asym.to.toLowerCase()} reads {asym.hi}% ready; the reverse only {asym.lo}%. Skill overlap is not symmetric, and the direction you travel matters.</p>}
          <div className="cmp-grid">
            <DirBlock from={p.a} to={p.b} d={p.ab} />
            <DirBlock from={p.b} to={p.a} d={p.ba} />
          </div>
        </section>

        {related.length > 0 && (
          <section className="rt-sec">
            <h2>Related comparisons</h2>
            <ul className="rt-rel">
              {related.map((q) => (
                <li key={q.slug}><Link href={`/compare/${q.slug}`}>{occTitle(q.a)} vs {occTitle(q.b)}</Link><span className="lbl">{Math.max(q.ab?.match ?? 0, q.ba?.match ?? 0)}% peak overlap</span></li>
              ))}
            </ul>
          </section>
        )}

        <section className="rt-cta">
          <div>
            <h2>Which one do your skills favor?</h2>
            <p>Run the instrument with your own skill set and both readiness numbers recompute for you. Free, no account.</p>
          </div>
          <Link className="rt-go" href="/">Run your own numbers &rarr;</Link>
        </section>

        <div className="post-faq rt-faq">
          <h2>Quick answers</h2>
          {faq.map((f) => (
            <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
          ))}
        </div>

        <p className="rt-method lbl">
          Method: each occupation&rsquo;s salary band is the posted 25th&ndash;75th percentile from its own corpus; readiness is coverage of the destination&rsquo;s posting-skill weight; shared skills are read from the overlap waterfall. Pairs sharing too few skills are not scored in that direction. Refreshed with the nightly scrape.
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `${tA} vs ${tB}: the measured comparison`,
        description: pairVerdict(p),
        datePublished: '2026-07-26',
        author: { '@type': 'Person', name: 'Carlos', url: 'https://www.pivothop.com/about' },
        publisher: { '@type': 'Organization', name: 'PivotHop' },
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
          { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://www.pivothop.com/compare' },
          { '@type': 'ListItem', position: 3, name: `${tA} vs ${tB}`, item: `https://www.pivothop.com/compare/${pair}` },
        ],
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      }) }} />
    </PageShell>
  );
}
