import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import fs from 'node:fs';
import path from 'node:path';
import { PageShell } from '../../components/SiteChrome';
import { getPair, compareSlugs, relatedPairs, fmtBand, mid, pairVerdict, type ComparePair, type CompareDir } from '../compare-data';
import { occTitle, occField, jobCount, getJobs } from '../../jobs/jobs-data';
import { coverableSlugs } from '../../salary/salary-data';
import { routePair, routeOrigins } from '../../routes/routes-data';
import { guidedSlugs } from '../../career-guides/facts';
import { hasSkillPage } from '../../skills/skills-data';
import { companySlugFor } from '../../companies/companies-data';
import JobsList from '../../jobs/JobsList';
import { article } from '../../../lib/site';
import { Crumbs } from '../../components/Crumbs';

/* The comparison page, rewritten 2026-09-10 after the GSC read. This family
   earns the site's impressions (PT vs RN 799, aerospace vs EE 695, paramedic
   vs RN 397) at positions 5 to 15, and the queries behind them are "X vs Y
   salary", "who gets paid more", "is X higher than Y". So the title and the
   first block answer that question with the number, and the rest of the page
   is the evidence: both boards' live roles, the overlap, both directions, and
   the people-shaped FAQ. Every figure is computed from the nightly build. */

export function generateStaticParams() {
  return compareSlugs().map((pair) => ({ pair }));
}

const fmtK = (n: number) => `$${Math.round(n / 1000)}k`;

/* Pay verdict for the pair, or null when either side lacks a posted band. */
function payRead(p: ComparePair) {
  const mA = mid(p.bandA), mB = mid(p.bandB);
  if (!mA || !mB) return null;
  const gap = Math.round(Math.abs(mA - mB) / 1000);
  const hi = mA >= mB ? p.a : p.b;
  const lo = hi === p.a ? p.b : p.a;
  return { hi, lo, gap, wash: gap < 5, mA, mB };
}

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const { pair } = await params;
  const p = getPair(pair);
  if (!p) return {};
  const tA = occTitle(p.a), tB = occTitle(p.b);
  const pay = payRead(p);
  const best = Math.max(p.ab?.match ?? 0, p.ba?.match ?? 0);
  const open = jobCount(p.a) + jobCount(p.b);
  // Title carries the question people type; description leads with the answer.
  const title = pay
    ? `${tA} vs ${tB}: pay, skills and which pays more`
    : `${tA} vs ${tB}: skills, overlap and which is easier to move into`;
  const lead = pay
    ? (pay.wash
      ? `Posted pay is close to even: ${fmtBand(p.bandA)} for ${tA.toLowerCase()}s, ${fmtBand(p.bandB)} for ${tB.toLowerCase()}s.`
      : `${occTitle(pay.hi)}s are posted about $${pay.gap}k a year higher (${fmtBand(pay.hi === p.a ? p.bandA : p.bandB)} vs ${fmtBand(pay.hi === p.a ? p.bandB : p.bandA)}).`)
    : `Measured from ${(p.postingsA + p.postingsB).toLocaleString()} live postings.`;
  const unmeasured = !p.ab && !p.ba;
  return {
    title,
    description: `${lead} ${unmeasured ? 'Two jobs people weigh together whose postings share too few skills to score' : `Skill overlap ${best}%, readiness in both directions, the shared skills`}${open > 0 ? `, and ${open.toLocaleString()} open roles` : ''}. Refreshed nightly from live job postings.`,
    alternates: { canonical: `/compare/${pair}` },
  };
}

// The glossary owns skill display names; the compare data carries names, so
// map name -> slug once to link the shared skills that have a page.
let _slugByName: Map<string, string> | null = null;
function skillSlug(name: string): string | null {
  if (!_slugByName) {
    _slugByName = new Map();
    try {
      const g = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/skills-glossary.json'), 'utf8')) as { slug: string; term: string }[];
      for (const e of g) if (e.slug && e.term) _slugByName.set(e.term.toLowerCase(), e.slug);
    } catch { /* no glossary at this build: tags stay plain */ }
  }
  const s = _slugByName.get(name.toLowerCase());
  return s && hasSkillPage(s) ? s : null;
}

function topCompanies(occ: string, k = 3): [string, number][] {
  const m = new Map<string, number>();
  for (const j of getJobs(occ)) m.set(j.company, (m.get(j.company) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, k);
}

function DirBlock({ from, to, d }: { from: string; to: string; d: CompareDir | null }) {
  const tFrom = occTitle(from), tTo = occTitle(to);
  const route = routePair(`${from}-to-${to}`) ? `/routes/${from}-to-${to}` : null;
  if (!d) {
    return (
      <div className="cmp-dir">
        <h3>{tFrom} &rarr; {tTo}</h3>
        <p className="rt-note">Not scored: the two sets of postings share too few skills in this direction for an honest number. <Link className="gl" href={`/?from=${from}`}>Run the instrument</Link> with your own skill set for a personal read.</p>
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
        <p className="rt-note">What {tTo.toLowerCase()} postings ask for that {tFrom.toLowerCase()} profiles usually lack: {d.unique!.slice(0, 4).join(', ')}.</p>
      )}
      <p className="rt-note">
        {route
          ? <Link className="gl" href={route}>The full route: {tFrom.toLowerCase()} to {tTo.toLowerCase()}</Link>
          : <Link className="gl" href={`/?from=${from}`}>Run this direction on the instrument</Link>}
      </p>
    </div>
  );
}

/* One occupation's fact column. Links only where the target page exists. */
function FactCol({ occ, band, postings, dir }: { occ: string; band: [number, number] | null; postings: number; dir: CompareDir | null }) {
  const t = occTitle(occ), tl = t.toLowerCase();
  const open = jobCount(occ);
  const remote = getJobs(occ).filter((j) => j.remote).length;
  const hasGuide = guidedSlugs().includes(occ);
  return (
    <div className="cmp-col">
      <h2>{t}</h2>
      <div className="drow"><span className="k">Posted pay, middle half</span><span className="v">{fmtBand(band) ?? 'under 5 stated'}</span></div>
      <div className="drow"><span className="k">Field</span><span className="v">{occField(occ)}</span></div>
      <div className="drow"><span className="k">Postings read</span><span className="v">{postings.toLocaleString()}</span></div>
      {open > 0 && <div className="drow"><span className="k">Open right now</span><span className="v">{open.toLocaleString()}{remote > 0 ? ` (${remote.toLocaleString()} remote)` : ''}</span></div>}
      {dir?.demand && <div className="drow"><span className="k">Demand</span><span className="v">{dir.demand}</span></div>}
      {dir?.license && <div className="drow"><span className="k">License</span><span className="v">{dir.license.req === 'required' ? 'Required' : 'Some roles'}</span></div>}
      <p className="rt-note cmp-links">
        {open > 0 && <><Link className="gl" href={`/jobs/${occ}`}>{tl} jobs</Link>{' · '}</>}
        {coverableSlugs().includes(occ) && <><Link className="gl" href={`/salary/${occ}`}>{tl} salary</Link>{' · '}</>}
        {hasGuide && <><Link className="gl" href={`/career-guides/${occ}`}>{tl} career guide</Link>{' · '}</>}
        {routeOrigins().includes(occ) && <Link className="gl" href={`/routes/${occ}`}>careers for {tl}s</Link>}
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
  const pay = payRead(p);
  const asym = p.ab && p.ba && Math.abs(p.ab.match - p.ba.match) >= 15
    ? (p.ab.match > p.ba.match ? { from: tA, to: tB, hi: p.ab.match, lo: p.ba.match } : { from: tB, to: tA, hi: p.ba.match, lo: p.ab.match })
    : null;
  const related = relatedPairs(pair);
  const best = Math.max(p.ab?.match ?? 0, p.ba?.match ?? 0);
  const cosA = topCompanies(p.a), cosB = topCompanies(p.b);
  const today = new Date().toISOString().slice(0, 10);

  // The short answer, in words a person would use.
  const shortAnswer = pay
    ? (pay.wash
      ? `On pay, this one is close to even. Postings that state a salary put ${lA}s at ${fmtBand(p.bandA)} and ${lB}s at ${fmtBand(p.bandB)}, so the midpoints sit within $${Math.max(pay.gap, 1)}k of each other. The difference between the two jobs is in the work and the skills, not the paycheck.`
      : `On pay, ${occTitle(pay.hi).toLowerCase()}s come out ahead by about $${pay.gap}k a year at the midpoint of posted bands: ${fmtBand(pay.hi === p.a ? p.bandA : p.bandB)} against ${fmtBand(pay.hi === p.a ? p.bandB : p.bandA)} for ${occTitle(pay.lo).toLowerCase()}s. These are advertised figures from postings that state a salary, not estimates.`)
    : `Not enough postings state a salary on both sides for a fair pay comparison, so this page sticks to what it can measure: the skills each set of postings asks for, and how far a typical profile on one side reaches into the other.`;
  const unmeasured = !p.ab && !p.ba;
  const overlapAnswer = unmeasured
    ? `On skills, the two sets of postings share too few named skills for a readiness score in either direction. That is the finding: these are different jobs that people weigh together, usually for the pay, the hours or the way in, rather than because one leads to the other.`
    : best >= 65
    ? `On skills, they are close to the same job under two titles. Postings ask for largely the same things, and the difference is mostly emphasis.`
    : best >= 40
      ? `On skills, they are related jobs with a real gap between them. There is a shared core, and then each side asks for things the other rarely does.`
      : `On skills, they are mostly different jobs that happen to share a name or a hallway. The overlap is thin, which is often exactly why people search this pair.`;

  const faq: { q: string; text: string; jsx: React.ReactNode }[] = [];
  faq.push({
    q: `Which pays more, ${lA} or ${lB}?`,
    text: shortAnswer,
    jsx: <>{shortAnswer}{coverableSlugs().includes(p.a) && coverableSlugs().includes(p.b) && <>{' '}By seniority and country: <Link className="gl" href={`/salary/${p.a}`}>{lA} salary</Link> and <Link className="gl" href={`/salary/${p.b}`}>{lB} salary</Link>.</>}</>,
  });
  faq.push({
    q: `Are ${lA} and ${lB} the same job?`,
    text: `${overlapAnswer}${shared.length ? ` The skills both sets of postings want most are ${shared.slice(0, 5).join(', ')}.` : ''}`,
    jsx: <>{overlapAnswer}{shared.length ? <> The skills both sets of postings want most are {shared.slice(0, 5).map((s, i) => { const sl = skillSlug(s); return <span key={s}>{i > 0 ? ', ' : ''}{sl ? <Link className="gl" href={`/skills/${sl}`}>{s}</Link> : s}</span>; })}.</> : null}</>,
  });
  if (p.ab) {
    const t = `Yes, and the numbers say how far along you already are: a typical ${lA} profile covers ${p.ab.match}% of what ${lB} postings ask for.${p.ab.license ? ` One thing to settle first: ${p.ab.license.label.toLowerCase()}. Skill overlap does not shorten a credential.` : ''}${p.ab.time ? ` Our estimate for the move is ${p.ab.time}.` : ''}`;
    const route = routePair(`${p.a}-to-${p.b}`) ? `/routes/${p.a}-to-${p.b}` : null;
    faq.push({ q: `Can ${article(lA)} ${lA} become ${article(lB)} ${lB}?`, text: `${t} The route page lists the exact skills that make up the rest.`, jsx: <>{t} {route ? <Link className="gl" href={route}>The route page</Link> : 'The instrument'} lists the exact skills that make up the rest.</> });
  }
  if (p.ba) {
    const t = `Going the other way, a typical ${lB} profile covers ${p.ba.match}% of what ${lA} postings ask for.${p.ba.license ? ` Keep in mind: ${p.ba.license.label.toLowerCase()}.` : ''}${p.ba.time ? ` Our estimate for the move is ${p.ba.time}.` : ''}${asym ? ` The two directions are not symmetric: ${asym.from.toLowerCase()} to ${asym.to.toLowerCase()} is the easier move, ${asym.hi}% against ${asym.lo}%.` : ''}`;
    const route = routePair(`${p.b}-to-${p.a}`) ? `/routes/${p.b}-to-${p.a}` : null;
    faq.push({ q: `Can ${article(lB)} ${lB} become ${article(lA)} ${lA}?`, text: t, jsx: <>{t}{route && <>{' '}<Link className="gl" href={route}>The route page</Link> has the gap itemized.</>}</> });
  }
  if (boardA > 0 || boardB > 0) {
    const t = `Right now our board has ${boardA.toLocaleString()} ${lA} openings and ${boardB.toLocaleString()} ${lB} openings, each linking to the original posting. The board refreshes every night, so the counts move with the market.${cosA.length ? ` Hiring the most ${lA}s at the moment: ${cosA.map(([c, n]) => `${c} (${n})`).join(', ')}.` : ''}${cosB.length ? ` For ${lB}s: ${cosB.map(([c, n]) => `${c} (${n})`).join(', ')}.` : ''}`;
    const coLinks = (list: [string, number][]) => list.map(([c, n], i) => { const s = companySlugFor(c); return <span key={c}>{i > 0 ? ', ' : ''}{s ? <Link className="gl" href={`/companies/${s}`}>{c}</Link> : c} ({n})</span>; });
    faq.push({
      q: `How many ${lA} and ${lB} jobs are open right now?`,
      text: t,
      jsx: <>Right now our board has {boardA > 0 ? <Link className="gl" href={`/jobs/${p.a}`}>{boardA.toLocaleString()} {lA} openings</Link> : `${boardA} ${lA} openings`} and {boardB > 0 ? <Link className="gl" href={`/jobs/${p.b}`}>{boardB.toLocaleString()} {lB} openings</Link> : `${boardB} ${lB} openings`}, each linking to the original posting. The board refreshes every night, so the counts move with the market.{cosA.length ? <> Hiring the most {lA}s at the moment: {coLinks(cosA)}.</> : null}{cosB.length ? <> For {lB}s: {coLinks(cosB)}.</> : null}</>,
    });
  }

  return (
    <PageShell v2 active="compare">
      <div className="rtp">
        <Crumbs trail={[{ label: 'Compare', href: '/compare' }, { label: `${tA} vs ${tB}` }]} />
        <h1 className="rt-h1">{tA} vs {tB}</h1>
        <p className="rt-dek">{pairVerdict(p)} Everything on this page is read from the two occupations&rsquo; own live postings and refreshed every night.</p>

        <section className="rt-sec cmp-short">
          <h2>The short answer</h2>
          {pay && (
            <div className="cg-band cmp-band">
              <div><span className="v">{fmtBand(p.bandA)}</span><span className="k">{tA}</span></div>
              <div className="mid"><span className="v">{pay.wash ? 'even' : `+${fmtK(Math.abs(pay.mA - pay.mB))}`}</span><span className="k">{pay.wash ? 'at the midpoint' : `${occTitle(pay.hi)}, at the midpoint`}</span></div>
              <div><span className="v">{fmtBand(p.bandB)}</span><span className="k">{tB}</span></div>
            </div>
          )}
          <p>{shortAnswer}</p>
          <p>{overlapAnswer} {unmeasured ? 'The boards below show what each one is hiring for right now, and the quick answers cover the rest.' : 'The readiness numbers further down say how far a typical profile on each side already reaches into the other, and which direction is the easier move.'}</p>
        </section>

        <div className="cmp-grid">
          <FactCol occ={p.a} band={p.bandA} postings={p.postingsA} dir={p.ba} />
          <FactCol occ={p.b} band={p.bandB} postings={p.postingsB} dir={p.ab} />
        </div>

        {shared.length > 0 && (
          <section className="rt-sec">
            <h2>The overlap, measured</h2>
            <p className="rt-note">Skills that appear in both occupations&rsquo; posting demand. This is the shared core; everything else on each side is the difference. Each linked skill has its own page with the roles it unlocks.</p>
            <div className="tags">
              {shared.map((s) => { const sl = skillSlug(s); return sl ? <Link key={s} className="tag have tag-go" href={`/skills/${sl}`}>{s}</Link> : <span key={s} className="tag have">{s}</span>; })}
            </div>
          </section>
        )}

        <section className="rt-sec">
          <h2>Switching, both directions</h2>
          {asym && <p className="rt-note"><strong>The direction matters:</strong> {asym.from.toLowerCase()} &rarr; {asym.to.toLowerCase()} reads {asym.hi}% ready, the reverse only {asym.lo}%. Skill overlap is not symmetric.</p>}
          <div className="cmp-grid">
            <DirBlock from={p.a} to={p.b} d={p.ab} />
            <DirBlock from={p.b} to={p.a} d={p.ba} />
          </div>
        </section>

        <JobsList occ={p.a} limit={4} heading={`Open ${lA} roles right now`} note={`The freshest ${lA} openings on the board, from company career pages and remote boards. Apply at the source.`} />
        <JobsList occ={p.b} limit={4} heading={`Open ${lB} roles right now`} note={`The freshest ${lB} openings on the board. Same rules: live, tagged to the occupation, linking to the original posting.`} />

        {(boardA > 0 || boardB > 0) && (
          <section className="rt-cta">
            <div>
              <h2>See the whole board for both</h2>
              <p>{(boardA + boardB).toLocaleString()} live roles across the two, freshest first, with posted pay and remote flags where the posting states them.</p>
            </div>
            <div className="rt-go-row">
              {boardA > 0 && <Link className="rt-go" href={`/jobs/${p.a}`}>{boardA.toLocaleString()} {lA} jobs &rarr;</Link>}
              {boardB > 0 && <Link className={boardA > 0 ? 'rt-go rt-go-alt' : 'rt-go'} href={`/jobs/${p.b}`}>{boardB.toLocaleString()} {lB} jobs &rarr;</Link>}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="rt-sec">
            <h2>Related comparisons</h2>
            <ul className="rt-rel">
              {related.map((q) => (
                <li key={q.slug}><Link href={`/compare/${q.slug}`}>{occTitle(q.a)} vs {occTitle(q.b)}</Link><span className="lbl">{q.ab || q.ba ? `${Math.max(q.ab?.match ?? 0, q.ba?.match ?? 0)}% peak overlap` : 'pay compared'}</span></li>
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
            <details key={f.q} name="pagefaq"><summary>{f.q}</summary><p>{f.jsx}</p></details>
          ))}
        </div>

        <p className="rt-method lbl">
          Method: each occupation&rsquo;s salary band is the posted 25th to 75th percentile from its own corpus, counting only postings that state pay; readiness is coverage of the destination&rsquo;s posting-skill weight; shared skills are read from the overlap waterfall. Pairs sharing too few skills are not scored in that direction. Job lists and counts are the live board. Refreshed with the nightly scrape.
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `${tA} vs ${tB}: pay, skills and which pays more`,
        description: pairVerdict(p),
        datePublished: '2026-07-26',
        dateModified: today,
        author: { '@type': 'Person', name: 'Carlos Alvarez', url: 'https://www.pivothop.com/about' },
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
        mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.text } })),
      }) }} />
    </PageShell>
  );
}
