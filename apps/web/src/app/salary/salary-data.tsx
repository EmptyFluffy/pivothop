import fs from 'node:fs';
import path from 'node:path';
import type { ReactNode } from 'react';

/* The salary board (docs/05 doctrine, applied to pay): one data-driven page per
   occupation, built at build time from the SAME per-occupation salary payload
   FairElephant computes nightly (apps/web/public/data/salaries/{slug}.json),
   plus an OEWS annual history for the time-series. Not a doorway farm: real
   bands, a real trend, an editorial judgment layer (drafted for Carlos), and
   cross-links into the routes, the instrument, FairElephant, and the glossary.
   Server-only (fs); imported by server components and the sitemap. */

type Band = { n?: number; p10?: number; p25: number; p50: number; p75: number; p90?: number; emp?: number };
type SalaryFile = {
  slug: string; title: string; soc: string; observations: number; updated: string;
  global: Band;
  by_country: Record<string, { posted?: Band | null; anchor?: Band | null; blended?: Band | null; price_level?: number; states?: Record<string, { blended?: Band }> }>;
  seniority?: Record<string, Band | null>;
  anchor_source?: string;
  unemployment?: { rate: number; label: string };
};
type HistPoint = { year: number; p25: number; p50: number; p75: number };

export type SalaryDef = {
  editorial: ReactNode;
  faq: { q: string; a: string }[];
  routes: string[];   // related route-page slugs
  also: string[];     // related salary slugs
};

const _cache = new Map<string, SalaryFile | null>();
function read<T>(rel: string): T | null {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', rel), 'utf8')); }
  catch { return null; }
}
export function getSalary(slug: string): SalaryFile | null {
  if (!_cache.has(slug)) _cache.set(slug, read<SalaryFile>(`salaries/${slug}.json`));
  return _cache.get(slug)!;
}
export function getHistory(slug: string): HistPoint[] {
  const h = read<{ series: HistPoint[] }>(`salary-history/${slug}.json`);
  return (h?.series || []).slice().sort((a, b) => a.year - b.year);
}

/** US band, preferring blended (posted shrunk toward the OEWS anchor). */
export function usBand(f: SalaryFile): Band | null {
  const us = f.by_country?.US;
  return us?.blended || us?.posted || us?.anchor || null;
}
export function chartData(slug: string, f: SalaryFile) {
  const series = getHistory(slug);
  const b = usBand(f);
  const current = b ? { year: 2026, p25: b.p25, p50: b.p50, p75: b.p75 } : null;
  return { series, current, aiYear: 2022.9 };
}
export const fmt = (v?: number | null) => (v == null ? '—' : '$' + Math.round(v).toLocaleString());
export const fmtk = (v?: number | null) => (v == null ? '—' : '$' + Math.round(v / 1000) + 'k');

export const SALARY: Record<string, SalaryDef> = {
  'ux-designer': {
    editorial: (
      <>
        <p>
          UX design pay is unusually wide, and the width is the whole story.
          The 25th-to-75th-percentile band on live US postings runs from about
          95,000 to 191,000 dollars, a spread of nearly 100,000, because the
          title covers everyone from a junior wireframer to a staff designer
          who owns a product surface. The median, near 127,000 on postings and
          98,000 in the official OEWS wage survey, sits well above graphic
          design, which is exactly why the graphic-to-UX move is one of the
          most searched career changes on the internet. The gap between the
          two figures, posted and official, is itself informative: job ads
          skew toward senior, well-funded roles, so the posted median flatters
          the typical seat. Read the band, not the headline. Where you land in
          it depends less on the word “UX” than on whether you can show
          research and outcomes, not just screens.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do UX designers make?', a: 'In live US postings the median is about 127,000 dollars, with a typical range of roughly 95,000 to 191,000. The official BLS OEWS median for the occupation is 98,090, lower because job ads skew toward senior roles.' },
      { q: 'Do UX designers make more than graphic designers?', a: 'Substantially. UX medians run tens of thousands above graphic design, and the field is projected to grow faster, which is why the graphic-to-UX pivot is common.' },
      { q: 'What is the highest UX designer salary?', a: 'The 90th percentile on postings reaches into the low 270,000s in the US, concentrated in staff and principal roles at large tech employers.' },
    ],
    routes: ['graphic-designer-to-ux-designer'],
    also: ['product-manager', 'software-engineer', 'data-scientist'],
  },
  'software-engineer': {
    editorial: (
      <>
        <p>
          Software engineering is the highest-paid large occupation on the
          board, and the numbers are not close. Live US postings put the median
          near 181,000 dollars, with the middle half between roughly 151,000
          and 215,000, and the official OEWS median at 133,080 across a
          1.6-million-person occupation. The gap between posted and official is
          the widest here of any role we track, because the postings we read
          lean toward funded, senior, remote-friendly employers while OEWS
          counts every developer in the country, including the ones far from
          the coasts. Both numbers are true; they answer different questions.
          If you want to know what the market is advertising right now, read
          the posted band. If you want to know what the median developer
          actually earns, read the OEWS line. The trend over the last decade,
          shown above, is the more interesting story: steadily up, with the
          post-2022 AI wave bending demand toward a narrower, better-paid tier.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do software engineers make?', a: 'The live-posting US median is about 181,000 dollars, with a typical range of 151,000 to 215,000. The official BLS OEWS median is 133,080 across the full occupation, which includes many non-coastal and non-tech-sector roles.' },
      { q: 'Why is the software engineer salary so high?', a: 'Demand has outpaced supply for a decade, and the postings that advertise pay skew toward well-funded employers. The AI wave since 2022 has concentrated hiring in a higher-paid tier.' },
      { q: 'Do software engineers earn more than data scientists?', a: 'On our data, slightly: the software-engineering posted median edges above data science, though the two bands overlap heavily and senior data-science and ML roles close the gap.' },
    ],
    routes: ['software-engineer-to-solutions-architect'],
    also: ['data-scientist', 'ux-designer', 'product-manager'],
  },
  'data-scientist': {
    editorial: (
      <>
        <p>
          Data science pay clusters more tightly than most technical roles,
          which tells you the market has settled on what the job is. The middle
          half of US postings runs from about 127,000 to 175,000 dollars, with
          a median near 147,000 and an official OEWS median of 112,590. That is
          a narrow band by tech standards, and the narrowness is a sign of
          maturity: the wild premiums of the mid-2010s have compressed as the
          supply of trained data scientists caught up. What is moving now is
          the boundary with machine-learning engineering. The AI wave has
          pulled the top of the band upward for people who can put models into
          production, not just prototype them, which is the exact skill that
          separates the two occupations and the reason the data-scientist-to-ML
          -engineer move is worth pricing. If your pay has plateaued in the
          middle of this band, that boundary is usually where the next raise
          lives.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do data scientists make?', a: 'The live-posting US median is about 147,000 dollars, with a typical range of 127,000 to 175,000. The official BLS OEWS median is 112,590.' },
      { q: 'Is data science still a high-paying career in 2026?', a: 'Yes, though the band has compressed as supply caught up. The upside now concentrates in machine-learning and production skills rather than analysis alone.' },
      { q: 'Do data scientists or ML engineers earn more?', a: 'They overlap, with ML engineering edging higher at the top for production and LLM-serving skills. See the data-scientist-to-ML-engineer route for the gap.' },
    ],
    routes: ['data-scientist-to-machine-learning-engineer', 'data-analyst-to-data-engineer'],
    also: ['software-engineer', 'ux-designer', 'product-manager'],
  },
  'product-manager': {
    editorial: (
      <>
        <p>
          Product management is where several well-paid careers converge, and
          the pay reflects the seniority the role usually demands. The middle
          half of US postings runs from about 117,000 to 199,000 dollars, a
          wide band because “product manager” covers an associate PM at a small
          firm and a group PM running a business line. The posted median near
          157,000 sits below the official OEWS figure of 161,030, an unusual
          inversion driven by OEWS classifying many senior operations and
          product roles into the same high-paid category. The reason this page
          gets searched by people who are not product managers yet is that the
          role is reachable from marketing, engineering, and business analysis,
          and the pay is a step up from all three. What it asks in return is
          the one thing money cannot shortcut: the judgment to say no to good
          ideas, on the record, with a reason.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do product managers make?', a: 'The live-posting US median is about 157,000 dollars, with a typical range of 117,000 to 199,000. The official BLS OEWS median for the category is 161,030.' },
      { q: 'Can you become a product manager from marketing?', a: 'It is a common move; marketers arrive with customer empathy and experimentation and close a technical-fluency gap. See the marketing-manager-to-product-manager route.' },
      { q: 'Do product managers make more than engineers?', a: 'At the senior end they are comparable; PM pay scales with the scope of the product owned rather than with coding depth.' },
    ],
    routes: ['marketing-manager-to-product-manager', 'business-analyst-to-project-manager'],
    also: ['software-engineer', 'ux-designer', 'data-scientist'],
  },
  'registered-nurse': {
    editorial: (
      <>
        <p>
          Nursing pay is the most geography-dependent number on the board, and
          any single figure hides that. The US posted median sits near 97,000
          dollars with an official OEWS median of 93,600, but the band from
          about 61,000 to 115,000 is driven less by seniority than by state:
          a California hospital and a rural clinic pay the same title very
          differently, and travel contracts distort the top. What the flat
          median does not show is the ladder. The single most common move for
          nurses who want a raise is to nurse practitioner, which lifts pay
          meaningfully but gates it behind a graduate degree and a license, a
          two-to-four-year credential rather than a skill gap. Nursing is also
          the clearest case of pay that a remote arrangement cannot unlock:
          the work is physical, so the compact that lets a nurse cross state
          lines moves the license, not the commute.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do registered nurses make?', a: 'The live-posting US median is about 97,000 dollars, with the official BLS OEWS median at 93,600. The range from roughly 61,000 to 115,000 is driven mostly by state and by travel contracts rather than seniority.' },
      { q: 'How can a nurse increase their salary?', a: 'The most common move is to nurse practitioner, which raises pay but requires a graduate degree and an APRN license. See the registered-nurse-to-nurse-practitioner route.' },
      { q: 'Are there remote registered nurse jobs?', a: 'Very few: under 1 percent of postings. The work is hands-on, so licensure compacts expand where a nurse can work but not whether the job is remote.' },
    ],
    routes: ['registered-nurse-to-nurse-practitioner'],
    also: ['accountant', 'product-manager'],
  },
  'accountant': {
    editorial: (
      <>
        <p>
          Accounting pay is steady, which is both its appeal and its ceiling.
          The middle of US postings sits in a tight band from about 70,000 to
          91,000 dollars, with a posted median near 72,000 and an official
          OEWS median of 81,680 across a 1.4-million-person occupation. That
          tightness is the point: accounting is a stable, licensed-adjacent
          profession where pay rises predictably rather than explosively. The
          people searching this page are often asking a second question behind
          the first, which is how to break out of the band, and the data has a
          clear answer. The move into financial analysis, forecasting and
          strategy rather than recording and compliance, lifts the ceiling by
          roughly a fifth at entry and more with a CFA. Accounting is the floor
          you can always stand on; financial analysis is the door out of the
          band, and it opens with the skills an accountant already holds.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do accountants make?', a: 'The live-posting US median is about 72,000 dollars, with the official BLS OEWS median at 81,680. The typical range is a tight 70,000 to 91,000.' },
      { q: 'How can an accountant earn more?', a: 'The common move is into financial analysis, which lifts pay by roughly 20 percent at entry and more with a CFA. See the accountant-to-financial-analyst route.' },
      { q: 'Do accountants or financial analysts make more?', a: 'Financial analysts, modestly at entry and more with credentials, because the role is forward-looking and strategic rather than compliance-focused.' },
    ],
    routes: ['accountant-to-financial-analyst'],
    also: ['product-manager', 'registered-nurse'],
  },
};

export const SALARY_SLUGS = Object.keys(SALARY);
