import type { Metadata } from 'next';
import Link from 'next/link';
import fs from 'node:fs';
import path from 'node:path';
import { PageShell } from '../components/SiteChrome';
import { GLOSSARY } from './glossary-data';
import GlossaryTabs from './GlossaryTabs';
import { SkillMarkSvg } from '../jobs/SkillMark';

export const metadata: Metadata = {
  title: 'Glossary and sources: career-data terms and skills, defined',
  description: 'Plain-language definitions of every acronym, dataset, and skill behind PivotHop, from SOC codes and OEWS wage data to Python, Revit, and FP&A — each skill linked to the open roles it unlocks.',
  alternates: { canonical: '/glossary' },
};

type SkillEntry = { slug: string; term: string; field: string; def: string; unlocks: { slug: string; title: string; count: number }[] };
function readSkills(): SkillEntry[] {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'skills-glossary.json'), 'utf8')); }
  catch { return []; }
}

const byTerm = (a: { term: string }, b: { term: string }) => a.term.toLowerCase().replace(/[^a-z]/g, '').localeCompare(b.term.toLowerCase().replace(/[^a-z]/g, ''));
const TERMS = GLOSSARY.filter((e) => e.cat === 'term').sort(byTerm);
const SOURCES = GLOSSARY.filter((e) => e.cat === 'source').sort(byTerm);
const SKILLS = readSkills(); // already sorted by term in the generator
const firstLetter = (t: string) => { const c = t.replace(/[^a-zA-Z0-9]/g, '')[0] || '#'; return /[0-9]/.test(c) ? '#' : c.toUpperCase(); };
const LETTERS = [...new Set(SKILLS.map((s) => firstLetter(s.term)))].sort();

export default function GlossaryPage() {
  return (
    <PageShell>
      <div className="gloss">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb"><Link href="/">Instrument</Link><span>/</span><span>Glossary</span></nav>
        <h1 className="gloss-h1">Glossary &amp; sources</h1>
        <p className="gloss-dek">
          Every acronym, credential, dataset, and skill the writing and the instrument lean on, defined once and in plain language.
          We assume you know your own field, not ours. Three registers: the terms, the datasets behind the numbers, and the skill
          bank &mdash; every skill linked to the open roles it unlocks.
        </p>

        <GlossaryTabs
          sourceIds={SOURCES.map((e) => e.id)}
          tabs={[
            {
              key: 'terms', label: 'Terms & acronyms', count: TERMS.length,
              panel: (
                <section className="gloss-sec" id="terms" aria-label="Terms and acronyms">
                  <dl className="gloss-list">
                    {TERMS.map((e) => (
                      <div className="gloss-item" id={e.id} key={e.id}>
                        <dt><span className="gt">{e.term}</span><span className="gf">{e.full}</span></dt>
                        <dd>{e.def}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ),
            },
            {
              key: 'sources', label: 'Sources & data', count: SOURCES.length,
              panel: (
                <section className="gloss-sec" id="sources" aria-label="Sources and data">
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
              ),
            },
            {
              key: 'skills', label: 'The skill bank', count: SKILLS.length,
              panel: (
                <section className="gloss-sec" id="skills" aria-label="The skill bank">
                  <p className="gloss-note">Every skill the instrument reads from live postings, with the occupations that weight it most heavily. Each links to the roles it unlocks that have openings on the board right now. This is what a skill chip on the graph points to.</p>
                  <div className="gloss-az" aria-label="Jump to letter">
                    {LETTERS.map((l) => <a key={l} href={`#skill-letter-${l}`}>{l}</a>)}
                  </div>
                  <dl className="gloss-list">
                    {LETTERS.map((letter) => (
                      <div key={letter} className="gloss-letter-group">
                        <h3 className="gloss-letter" id={`skill-letter-${letter}`}>{letter}</h3>
                        {SKILLS.filter((s) => firstLetter(s.term) === letter).map((s) => (
                          <div className="gloss-item gloss-skill" id={`skill-${s.slug}`} key={s.slug}>
                            <dt><span className="gt"><SkillMarkSvg id={s.slug} className="gt-mark" />{s.term}</span>{s.field && <span className="gf">{s.field}</span>}</dt>
                            <dd>
                              {s.def}
                              {s.unlocks.length > 0 && (
                                <div className="gloss-unlocks">
                                  <span className="lbl">Open roles it unlocks</span>
                                  <span className="gu-list">
                                    {s.unlocks.map((u) => (
                                      <Link key={u.slug} href={`/jobs/${u.slug}`} className="gu-link">{u.title}<span className="gu-n">{u.count}</span></Link>
                                    ))}
                                  </span>
                                </div>
                              )}
                            </dd>
                          </div>
                        ))}
                      </div>
                    ))}
                  </dl>
                </section>
              ),
            },
          ]}
        />

        <div className="post-foot gloss-foot">
          <Link href="/blog" className="lbl">&larr; The blog</Link>
          <Link href="/" className="lbl acc">Run your own numbers &rarr;</Link>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'DefinedTermSet',
        name: 'PivotHop Glossary, Sources, and Skill Bank',
        description: 'Definitions of the career-data terms, datasets, and skills used by PivotHop, with the roles each skill unlocks.',
        url: 'https://www.pivothop.com/glossary',
        hasDefinedTerm: [
          ...GLOSSARY.map((e) => ({
            '@type': 'DefinedTerm',
            '@id': `https://www.pivothop.com/glossary#${e.id}`,
            name: e.full ? `${e.term} (${e.full})` : e.term,
            description: e.def,
          })),
          ...SKILLS.map((s) => ({
            '@type': 'DefinedTerm',
            '@id': `https://www.pivothop.com/glossary#skill-${s.slug}`,
            name: s.term,
            description: s.def,
            inDefinedTermSet: 'https://www.pivothop.com/glossary#skills',
          })),
        ],
      }) }} />
    </PageShell>
  );
}
