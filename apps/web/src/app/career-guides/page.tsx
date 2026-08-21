import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../components/SiteChrome';
import { careerFacts, guidedSlugs } from './facts';

/* The index. Grouped by field rather than alphabetically, because someone
   arriving from a search for one occupation is usually weighing the ones beside
   it, and ranked inside each field by what the board currently holds. Every row
   carries the two figures that decide whether the guide is worth opening. */

export const metadata: Metadata = {
  title: 'Career guides: what each job pays, asks for, and leads to',
  description:
    'Measured guides to what a job is like day to day, what it pays, how long it takes to qualify, and which occupations already have most of what it asks for. Computed from live postings, updated nightly.',
  alternates: { canonical: '/career-guides' },
};

const fmt = (v: number) => '$' + Math.round(v / 1000) + 'k';

export default function CareerGuidesIndex() {
  const rows = guidedSlugs()
    .map((slug) => careerFacts(slug))
    .filter((f): f is NonNullable<typeof f> => !!f && !!f.guide);

  const byField = new Map<string, typeof rows>();
  for (const r of rows) {
    if (!byField.has(r.field)) byField.set(r.field, []);
    byField.get(r.field)!.push(r);
  }
  const fields = [...byField.entries()]
    .map(([field, list]) => [field, [...list].sort((a, b) => b.liveOpenings - a.liveOpenings)] as const)
    .sort((a, b) => b[1].length - a[1].length);
  const openings = rows.reduce((n, r) => n + r.liveOpenings, 0);

  return (
    <PageShell v2 active="careers">
      <div className="rtp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb">
          <Link href="/">Instrument</Link><span>/</span><span>Career guides</span>
        </nav>
        <h1 className="rt-h1">Career guides.</h1>
        <p className="rt-dek sal-dek">
          What a job is like week to week, what it pays, how long it takes to qualify, and which occupations already
          cover most of what it asks for. Every figure is computed from live postings and moves with the nightly
          scrape. {rows.length === 1 ? 'One guide so far' : `${rows.length} guides`}, over{' '}
          {openings.toLocaleString()} open roles.
        </p>

        {fields.map(([field, list]) => (
          <section key={field} className="rt-sec cgx-sec">
            <h2>{field}</h2>
            <ul className="cgx">
              {list.map((r) => (
                <li key={r.slug}>
                  <Link href={`/career-guides/${r.slug}`}>
                    <span className="t">{r.title}</span>
                    <span className="d">{r.guide!.prose.summary}</span>
                  </Link>
                  <span className="m">{r.salary ? fmt(r.salary.p50) : '·'}</span>
                  <span className="s lbl">{r.liveOpenings.toLocaleString()} open</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="rt-method lbl">
          Guides are written against the same corpus the board reads, then checked by hand. Pay is blended from
          posted salaries and the official <a className="gl" href="/glossary#oews">OEWS</a> anchor. Occupations
          without enough data to say something honestly do not get a guide.
        </p>
      </div>
    </PageShell>
  );
}
