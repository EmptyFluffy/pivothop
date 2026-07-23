import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../components/SiteChrome';
import { GLOSSARY } from './glossary-data';

export const metadata: Metadata = {
  title: 'Glossary and sources: the career-data terms, defined — PivotHop',
  description: 'Plain-language definitions of every acronym and dataset behind PivotHop, from SOC codes and OEWS wage data to ADDIE, FP&A, MLOps, and the CPS mobility network. What each term means and where the numbers come from.',
  alternates: { canonical: '/glossary' },
};

const byTerm = (a: { term: string }, b: { term: string }) => a.term.toLowerCase().replace(/[^a-z]/g, '').localeCompare(b.term.toLowerCase().replace(/[^a-z]/g, ''));
const TERMS = GLOSSARY.filter((e) => e.cat === 'term').sort(byTerm);
const SOURCES = GLOSSARY.filter((e) => e.cat === 'source').sort(byTerm);

export default function GlossaryPage() {
  return (
    <PageShell>
      <div className="gloss">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb"><Link href="/">Instrument</Link><span>/</span><span>Glossary</span></nav>
        <h1 className="gloss-h1">Glossary &amp; sources</h1>
        <p className="gloss-dek">
          Every acronym, credential, and dataset the writing and the instrument lean on, defined once and in plain language.
          We assume you know your own field, not ours. The terms are first; the datasets behind the numbers are below them,
          each with what it is and where it comes from.
        </p>

        <section className="gloss-sec" id="terms" aria-label="Terms and acronyms">
          <h2 className="gloss-cat"><span className="lbl">Part one</span>Terms &amp; acronyms</h2>
          <dl className="gloss-list">
            {TERMS.map((e) => (
              <div className="gloss-item" id={e.id} key={e.id}>
                <dt><span className="gt">{e.term}</span><span className="gf">{e.full}</span></dt>
                <dd>{e.def}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="gloss-sec" id="sources" aria-label="Sources and data">
          <h2 className="gloss-cat"><span className="lbl">Part two</span>Sources &amp; data</h2>
          <p className="gloss-note">The datasets under the numbers. Every figure on PivotHop and FairElephant traces to one of these, and every one is either public domain or openly licensed for reuse.</p>
          <dl className="gloss-list">
            {SOURCES.map((e) => (
              <div className="gloss-item" id={e.id} key={e.id}>
                <dt><span className="gt">{e.term}</span><span className="gf">{e.full}</span></dt>
                <dd>
                  {e.def}
                  {e.url && <> <a className="gloss-src" href={e.url} target="_blank" rel="noopener noreferrer">Visit source &rarr;</a></>}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="post-foot gloss-foot">
          <Link href="/blog" className="lbl">&larr; The blog</Link>
          <Link href="/" className="lbl acc">Run your own numbers &rarr;</Link>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'DefinedTermSet',
        name: 'PivotHop Glossary and Sources',
        description: 'Definitions of the career-data terms, acronyms, and datasets used by PivotHop.',
        url: 'https://www.pivothop.com/glossary',
        hasDefinedTerm: GLOSSARY.map((e) => ({
          '@type': 'DefinedTerm',
          '@id': `https://www.pivothop.com/glossary#${e.id}`,
          name: `${e.term} (${e.full})`,
          description: e.def,
        })),
      }) }} />
    </PageShell>
  );
}
