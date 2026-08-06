import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../components/SiteChrome';
import GATES from '../../../../../packages/data/taxonomy/license-gates.json';
import TAX from '../../../../../packages/data/taxonomy/occupations.json';
import { jobCount, occTitle } from '../jobs/jobs-data';
import { coverableSlugs } from '../salary/salary-data';

export const metadata: Metadata = {
  title: 'License gates: which careers require a license, in the US and Switzerland',
  description: 'Every licensed profession we track, with the credential it actually takes: issuing body, honest timeline, what is gated (the title, the signature, or the job itself) — for the US and Switzerland. No amount of skill overlap shortens a credential.',
  alternates: { canonical: '/licenses' },
};

type Gate = { id: string; name: string; occupations: string[]; body: { name: string; url: string }; path: string; time: string; note: string; glossary?: string[] };
const OCC_LICENSE: Record<string, { req: string; label: string }> = Object.fromEntries(
  (TAX as { occupations: { slug: string; license?: { req: string; label: string } }[] }).occupations
    .filter((o) => o.license).map((o) => [o.slug, o.license!]),
);
const SALARY = new Set(coverableSlugs());

function GateCard({ g, market }: { g: Gate; market: 'us' | 'ch' }) {
  return (
    <article className="lic-card" id={g.id}>
      <h3>{g.name}</h3>
      <dl className="lic-facts">
        <div><dt>The path</dt><dd>{g.path}</dd></div>
        <div><dt>Honest time</dt><dd>{g.time}</dd></div>
        {g.note && <div><dt>What it means for a pivot</dt><dd>{g.note}</dd></div>}
        <div><dt>Authority</dt><dd><a href={g.body.url} target="_blank" rel="noopener noreferrer">{g.body.name} ↗</a>
          {(g.glossary ?? []).map((id) => <span key={id}> · <a className="gl" href={`/glossary#${id}`}>glossary</a></span>)}
        </dd></div>
      </dl>
      {g.occupations.length > 0 && (
        <ul className="lic-occs">
          {g.occupations.map((slug) => {
            const lic = OCC_LICENSE[slug];
            const n = jobCount(slug);
            return (
              <li key={slug} id={market === 'us' ? `occ-${slug}` : `ch-occ-${slug}`}>
                <span className="lic-occ-head">
                  <b>{occTitle(slug)}</b>
                  {lic && <span className={`lic-req lbl ${lic.req}`}>{lic.req === 'required' ? 'license required' : 'license for some roles'}</span>}
                </span>
                {lic && <span className="lic-occ-label">{lic.label}</span>}
                <span className="lic-occ-links lbl">
                  {n > 0 && <Link href={`/jobs/${slug}`}>{n} open roles</Link>}
                  {SALARY.has(slug) && <Link href={`/salary/${slug}`}>salary</Link>}
                  <Link href={`/routes#${slug}`}>routes</Link>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}

export default function LicensesPage() {
  const us = (GATES as { us: Gate[] }).us;
  const ch = (GATES as { ch: Gate[] }).ch;
  const gatedOccs = Object.keys(OCC_LICENSE).length;
  const faq = [
    { q: 'What is a license gate?', a: 'A legal credential that stands between you and a profession regardless of your skills: a state license, a protected title, or a signature only a license-holder may give. PivotHop flags them on every route because they set the timeline in a way no skill overlap can shorten.' },
    { q: 'Can transferable skills shorten a license?', a: 'No, and any tool that implies otherwise is selling something. Skills shorten the employable gap inside ungated work; the credential clock (degrees, supervised hours, exams) runs at its own speed. What skills can do is point you at the adjacent roles around a gated profession that hire without the credential.' },
    { q: 'How is Switzerland different from the US?', a: 'Switzerland keeps one federal list of regulated professions and runs formal recognition procedures for foreign credentials, which matters in a country where a quarter of the workforce is foreign-born. Some gates are stricter than the US equivalent (independent electrical installation needs a federal permit) and some are looser: in most cantons, architect is not a protected practice at all.' },
  ];
  return (
    <PageShell>
      <div className="rtp">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb"><Link href="/">Instrument</Link><span>/</span><span>License gates</span></nav>
        <h1 className="rt-h1">License gates, stated plainly.</h1>
        <p className="rt-dek">
          {gatedOccs} of the {(TAX as { occupations: unknown[] }).occupations.length} occupations we track carry a legal gate: a license,
          a protected title, or a signature only a credential-holder may give. This page says what each one actually takes:
          the issuing authority, the honest timeline, and what is gated (sometimes it is only the stamp, and the adjacent
          seats hire without it). No amount of skill overlap shortens a credential; the routes on this site are built on
          that rule, and every gated route links back here.
        </p>

        <section className="rt-sec" id="us">
          <h2>United States</h2>
          <p className="rt-note">State-based: the license usually attaches to the state, with interstate compacts (nursing, psychology) easing movement.</p>
          <div className="lic-grid">{us.map((g) => <GateCard key={g.id} g={g} market="us" />)}</div>
        </section>

        <section className="rt-sec" id="ch">
          <h2>Switzerland</h2>
          <p className="rt-note">
            Federal: one official list of <i>reglementierte Berufe</i>, cantonal execution, and formal recognition routes for
            foreign credentials. Postings for these professions on our board come from the federal <a className="gl" href="/glossary#jobroom">Job-Room</a>.
          </p>
          <div className="lic-grid">{ch.map((g) => <GateCard key={g.id} g={g} market="ch" />)}</div>
        </section>

        <div className="post-faq rt-faq">
          <h2>Quick answers</h2>
          {faq.map((f) => (
            <details key={f.q} name="pagefaq"><summary>{f.q}</summary><p>{f.a}</p></details>
          ))}
        </div>

        <div className="post-foot">
          <Link href="/routes" className="lbl">&larr; Every measured route</Link>
          <Link href="/glossary" className="lbl">Glossary &amp; sources &rarr;</Link>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      }) }} />
    </PageShell>
  );
}
