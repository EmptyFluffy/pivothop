import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '../../components/SiteChrome';
import { getSkillPage, skillPageSlugs, hasSkillPage } from '../skills-data';
import { occTitle } from '../../jobs/jobs-data';
import { coverableSlugs } from '../../salary/salary-data';
import { Crumbs } from '../../components/Crumbs';
import { PageHead } from '../../components/PageHead';

/* A skill landing page: the definition, the occupations the skill unlocks
   (with live counts — the adjacency data no other board measures), the skills
   that co-occur with it in real postings, and the filtered board one click
   away. Everything computed; the FAQ answers are the page's own figures. */

export function generateStaticParams() {
  return skillPageSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = getSkillPage(slug);
  if (!s) return {};
  return {
    title: `${s.term} jobs: ${s.reach.toLocaleString()} live roles across ${s.unlocks.length} occupations`,
    description: `${s.def.slice(0, 120)}${s.def.length > 120 ? '…' : ''} The occupations ${s.term} unlocks, with live counts, and the skills that appear beside it in real postings.`,
    alternates: { canonical: `/skills/${slug}` },
  };
}

export default async function SkillPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = getSkillPage(slug);
  if (!s) notFound();

  const faq: { q: string; text: string; jsx: React.ReactNode }[] = [
    {
      q: `What is ${s.term}?`,
      text: `${s.def} On this board it is a ${s.field.toLowerCase()} skill, extracted from posting text by the nightly scrape.`,
      jsx: <>{s.def} On this board it is a {s.field.toLowerCase()} skill, extracted from posting text by the nightly scrape. Every skill, defined: <Link className="gl" href="/glossary">the glossary</Link>.</>,
    },
    {
      q: `How many jobs ask for ${s.term}?`,
      text: `${s.term} unlocks ${s.unlocks.length} occupations on this board, with ${s.reach.toLocaleString()} live roles across them right now. The largest is ${s.unlocks[0].title} (${s.unlocks[0].count.toLocaleString()} open).`,
      jsx: <>{s.term} unlocks {s.unlocks.length} occupations on this board, with {s.reach.toLocaleString()} live roles across them right now. The largest is <Link className="gl" href={`/jobs/${s.unlocks[0].slug}`}>{s.unlocks[0].title}</Link> ({s.unlocks[0].count.toLocaleString()} open).</>,
    },
  ];
  if (s.related.length >= 2) {
    const top = s.related.slice(0, 3);
    faq.push({
      q: `What skills pair with ${s.term}?`,
      text: `Measured over ${s.cooccurPostings.toLocaleString()} postings, the skills most often named beside ${s.term} are ${top.map((r) => `${r.name} (together in ${r.together})`).join(', ')}.`,
      jsx: <>Measured over {s.cooccurPostings.toLocaleString()} postings, the skills most often named beside {s.term} are {top.map((r) => `${r.name} (together in ${r.together})`).join(', ')}.</>,
    });
  }

  return (
    <PageShell v2 active="skills">
      <div className="rtp">
        <Crumbs trail={[{ label: 'Glossary', href: '/glossary' }, { label: s.term }]} />
        <PageHead
          kicker={`${s.field} skill`}
          title={`${s.term} jobs`}
          lede={<>{s.def} Below: the {s.unlocks.length} occupations it unlocks on this board, live counts included,
            and the skills that show up beside it in real postings.</>}
          meta={<>
            <span className="lbl">{s.reach.toLocaleString()}</span> live roles reachable &middot;{' '}
            <Link className="gl" href={`/jobs?sk=${s.slug}`}>see them all on the board</Link>
          </>}
        />

        <section className="rt-sec">
          <h2>What {s.term} unlocks</h2>
          <p className="rt-note">
            Occupations whose postings name this skill, from the adjacency data the instrument runs on.
            Counts are live board inventory, refreshed nightly.
          </p>
          <div className="occ-tblwrap">
            <table className="occ-tbl">
              <thead><tr><th>Occupation</th><th>Live roles</th><th>More</th></tr></thead>
              <tbody>
                {s.unlocks.map((u) => (
                  <tr key={u.slug}>
                    <td><Link className="gl" href={`/jobs/${u.slug}`}>{u.title}</Link></td>
                    <td className="n">{u.count.toLocaleString()}</td>
                    <td>{coverableSlugs().includes(u.slug)
                      ? <Link className="gl" href={`/salary/${u.slug}`}>salary</Link>
                      : <span className="lbl">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {s.related.length >= 2 && (
          <section className="rt-sec">
            <h2>Named beside it</h2>
            <p className="rt-note">
              Co-occurrence measured over {s.cooccurPostings.toLocaleString()} postings: how often each skill
              appears in the same posting as {s.term}.
            </p>
            <ul className="rt-rel">
              {s.related.map((r) => (
                <li key={r.id}>
                  {hasSkillPage(r.id)
                    ? <Link href={`/skills/${r.id}`}>{r.name}</Link>
                    : <Link href={`/glossary#skill-${r.id}`}>{r.name}</Link>}
                  <span className="lbl">together in {r.together}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="post-faq rt-faq">
          <h2>Quick answers</h2>
          {faq.map((f) => (
            <details key={f.q} name="pagefaq"><summary>{f.q}</summary><p>{f.jsx}</p></details>
          ))}
        </div>

        <p className="rt-method lbl">
          Skills are extracted from posting text by the nightly scrape and mapped to occupations through the
          same lexicon the career instrument uses. A skill page exists only while enough live roles are
          reachable through it; counts are inventory, never padding.
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
          { '@type': 'ListItem', position: 2, name: 'Glossary', item: 'https://www.pivothop.com/glossary' },
          { '@type': 'ListItem', position: 3, name: `${s.term} jobs`, item: `https://www.pivothop.com/skills/${s.slug}` },
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
