import type { Metadata } from 'next';
import { compareHref } from '../compare/CompareLink';
import Link from 'next/link';
import fs from 'node:fs';
import path from 'node:path';
import { PageShell } from '../components/SiteChrome';
import type { Job } from '../jobs/JobCard';

/* The Adjacency Index — the citable data hub. One page of headline numbers, each
   written as a clean, extractable sentence with its proof page, so an answer
   engine can quote it directly. Board scale is computed live from the corpus at
   build (fresh nightly); the analytical findings are the same figures the blog
   posts publish, dated to the run. Dataset + Article JSON-LD below. */

export const metadata: Metadata = {
  title: 'The Adjacency Index — the state of career mobility, in numbers | PivotHop',
  description:
    'Headline figures from the PivotHop corpus of 100,000+ live job postings: how AI-exposed each field is, how much skill sets overlap between careers, which jobs are most transferable, and the pay behind every route. Computed, dated, and citable — nothing invented.',
  alternates: { canonical: '/adjacency-index' },
};

const DATA_RUN = 'July 2026'; // the corpus run behind the analytical findings

// Analytical findings — the citable core. Same numbers the blog posts publish.
// Each is one quotable sentence + the page that proves it.
type Stat = { big: string; unit: string; sentence: string; href: string; hrefLabel: string };
const SECTIONS: { h: string; stats: Stat[] }[] = [
  {
    h: 'Scale',
    stats: [
      { big: '100,000+', unit: 'live postings', sentence: 'The corpus reads more than 100,000 live job postings and maps them onto 177 standardized occupations, refreshed nightly.', href: '/blog/skills-over-titles', hrefLabel: 'Job titles, deprecated' },
      { big: '42,254', unit: 'unmapped title strings', sentence: 'In a single month, 42,254 distinct job-title strings mapped to no standard occupation at all — titles fragment while the skill demand under them clusters.', href: '/blog/skills-over-titles', hrefLabel: 'the thesis' },
    ],
  },
  {
    h: 'AI exposure',
    stats: [
      { big: '4.9%', unit: 'of postings demand AI skills', sentence: '4.9% of all postings now demand LLM or agent-tooling skills by name, across 43 of 177 occupations — including lawyer, recruiter, and motion designer.', href: '/blog/ai-jobs-three-ledgers', hrefLabel: 'AI and jobs, checked' },
      { big: '100% vs 37%', unit: 'AI-free, hands-on vs tech', sentence: 'Every occupation in Trades, Healthcare, Construction, and Transport shows zero AI-skill demand; in Technology, only 37% do. The hands-on economy is not being rewritten around AI.', href: '/blog/karp-two-safe-workers', hrefLabel: 'the two AI-proof workers' },
    ],
  },
  {
    h: 'Adjacency',
    stats: [
      { big: '55%', unit: 'of career pairs under 20% overlap', sentence: 'Of the 3,521 scored occupation-to-occupation pairs, 55% sit under 20% skill readiness. Skills are specific, not a universal solvent — which is exactly why measuring their reach matters.', href: '/routes', hrefLabel: 'every measured route' },
      { big: '13', unit: 'routes out (widest exits)', sentence: 'The most transferable careers have a data core or a coordination core: sales engineer and operations manager each reach 13 destinations at 45%+ readiness; data scientist reaches 12.', href: '/blog/skills-over-titles', hrefLabel: 'the widest-exit ranking' },
    ],
  },
  {
    h: 'The confused pairs',
    stats: [
      { big: '24%', unit: 'product vs project manager', sentence: 'A typical project manager’s skills cover only 24% of what product-manager postings demand; the reverse shares too few skills to score. Same first word, different jobs.', href: '/compare/product-manager-vs-project-manager', hrefLabel: 'compared' },
      { big: '13% / 12%', unit: 'graphic vs UX designer', sentence: 'Graphic designers and UX designers share 13% and 12% of a skill set in each direction, against posted bands of $42k–$73k versus $74k–$151k — the most expensively confused pair in design.', href: '/compare/graphic-designer-vs-ux-designer', hrefLabel: 'compared' },
      { big: '94% + a license', unit: 'registered nurse to nurse practitioner', sentence: 'A registered nurse reads 94% ready for nurse-practitioner work on skills alone — and no skill overlap shortens the graduate degree and license between the two titles.', href: '/compare/nurse-practitioner-vs-registered-nurse', hrefLabel: 'compared' },
    ],
  },
  {
    h: 'Bridge skills',
    stats: [
      { big: '62 of 177', unit: 'occupations demand data analysis', sentence: 'Data analysis is the market’s reserve currency — in the top-20 posted demand of 62 of 177 occupations. LLM and agent tooling already sits in roughly a third.', href: '/blog/skills-over-titles', hrefLabel: 'the bridge-skill table' },
    ],
  },
];

function boardScale(): { listings: number; companies: number; countries: number; asOf: string } {
  try {
    const jobs = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'all-jobs.json'), 'utf8')) as Job[];
    return {
      listings: jobs.length,
      companies: new Set(jobs.map((j) => j.company)).size,
      countries: new Set(jobs.map((j) => j.c).filter(Boolean)).size,
      asOf: jobs.reduce((s, j) => ((j.posted || '') > s ? j.posted : s), ''),
    };
  } catch { return { listings: 0, companies: 0, countries: 0, asOf: '' }; }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function longDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${parseInt(m[3], 10)} ${MONTHS[+m[2] - 1]} ${m[1]}` : iso;
}

export default function AdjacencyIndex() {
  const s = boardScale();
  const asOf = s.asOf ? longDate(s.asOf) : DATA_RUN;

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: 'The PivotHop Adjacency Index',
      description: 'Headline measures of career mobility computed from 100,000+ live job postings: AI-skill exposure by field, occupation-to-occupation skill-readiness, transferability, posted salary bands, and licensing gates. Refreshed nightly.',
      url: 'https://www.pivothop.com/adjacency-index',
      creator: { '@type': 'Organization', name: 'PivotHop', url: 'https://www.pivothop.com' },
      isAccessibleForFree: true,
      temporalCoverage: '2026',
      dateModified: s.asOf || undefined,
      variableMeasured: ['skill readiness between occupations', 'AI-skill demand share', 'posted salary band', 'occupation transferability', 'licensing gate'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'The Adjacency Index: the state of career mobility, in numbers',
      datePublished: '2026-07-27',
      dateModified: s.asOf || '2026-07-27',
      author: { '@type': 'Organization', name: 'PivotHop', url: 'https://www.pivothop.com' },
      publisher: { '@type': 'Organization', name: 'PivotHop', logo: { '@type': 'ImageObject', url: 'https://www.pivothop.com/icon.svg' } },
      about: 'career mobility, skills-based hiring, AI and jobs, occupational adjacency',
    },
  ];

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="axi">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb"><Link href="/">Instrument</Link><span>/</span><span>Adjacency Index</span></nav>
        <header className="axi-head">
          <span className="lbl acc">The Adjacency Index</span>
          <h1 className="rt-h1">The job market, in numbers.</h1>
          <p className="rt-dek">
            {`Every figure below is computed from the PivotHop corpus — ${s.listings.toLocaleString()} live listings from ${s.companies.toLocaleString()} companies across ${s.countries} countries, mapped onto standardized occupations and refreshed nightly. Data as of ${asOf}. Nothing here is invented; each number links to the page that proves it.`}
          </p>
        </header>

        {SECTIONS.map((sec) => (
          <section key={sec.h} className="axi-sec">
            <h2 className="axi-h2">{sec.h}</h2>
            <div className="axi-grid">
              {sec.stats.map((st) => (
                <div key={st.big + st.unit} className="axi-stat">
                  <div className="axi-big">{st.big}</div>
                  <div className="axi-unit lbl">{st.unit}</div>
                  <p className="axi-sentence">{st.sentence}</p>
                  {/* Compare hrefs go through the guard: those pages are
                      generated only while the pair still qualifies. */}
                  <Link className="gl axi-src" href={st.href.startsWith('/compare/') ? compareHref(st.href.slice('/compare/'.length)) : st.href}>{st.hrefLabel} &rarr;</Link>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="axi-sec axi-method">
          <h2 className="axi-h2">Method, in one paragraph</h2>
          <p>
            Skill readiness is the share of a destination occupation’s posted skill demand that a typical origin profile already covers, measured directionally from live postings; pairs sharing fewer than three skills are left unscored rather than guessed. Salary bands are posted 25th–75th percentiles, stated salaries only. A required license is shown as a gate and floors the transition estimate — a 90% skill overlap does not shorten a three-year degree. The full method is in <Link className="gl" href="/blog/what-is-career-adjacency">What is career adjacency</Link>, and every number recomputes with the nightly scrape.
          </p>
          <p className="lbl axi-cite">
            Cite as: PivotHop Adjacency Index, {asOf} (pivothop.com/adjacency-index).
          </p>
        </section>

        <section className="axi-sec">
          <h2 className="axi-h2">Go deeper</h2>
          <div className="axi-links">
            <Link className="gl" href="/routes">Every measured career route &rarr;</Link>
            <Link className="gl" href="/compare">Careers compared, both directions &rarr;</Link>
            <Link className="gl" href="/salary">Posted pay by occupation and country &rarr;</Link>
            <Link className="gl" href="/blog">The findings, written up &rarr;</Link>
            <Link className="gl" href="/">Run your own numbers &rarr;</Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
