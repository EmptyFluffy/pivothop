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

// Full names for the by-country and by-state sections — spelled out reads
// better and helps SEO ("data scientist salary United Kingdom" etc.).
export const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', CA: 'Canada', IE: 'Ireland', AU: 'Australia',
  DE: 'Germany', FR: 'France', NL: 'Netherlands', ES: 'Spain', IN: 'India', SG: 'Singapore',
  NZ: 'New Zealand', CH: 'Switzerland', SE: 'Sweden', BR: 'Brazil', MX: 'Mexico',
};
export const US_STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
  CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts',
  MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
  NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', PR: 'Puerto Rico',
};

export const SALARY: Record<string, SalaryDef> = {
  'ux-designer': {
    editorial: (
      <>
        <p>
          <a className="gl" href="/glossary#ux">UX</a> design pay is unusually wide, and the width is the whole story.
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
          roughly a fifth at entry and more with a <a className="gl" href="/glossary#cfa">CFA</a> (the Chartered Financial Analyst credential). Accounting is the floor
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
  'project-manager': {
    editorial: (
      <>
        <p>
          Project management pays broadly because the title is broad: the same
          two words cover a coordinator chasing a checklist and a program lead
          owning a business line. The middle half of US postings runs from
          about 88,000 to 144,000 dollars, with a blended median near 115,000
          and an official OEWS median of 100,750 across a million-person
          occupation. What the pay reflects is ubiquity, not a hot market:
          every industry needs delivery, so the demand is deep and steady
          rather than spiking, which is why the trend since 2021 is a modest
          7 percent while newer tech roles ran double that. The lever that
          actually moves a project manager’s number is scope, not certification,
          though a <a className="gl" href="/glossary#pmp">PMP</a> (the Project Management Professional certification) is the signal that unlocks the interview. If your pay has
          stalled, the question is whether you are managing tasks or owning
          outcomes; the band above pays for the second.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do project managers make?', a: 'The live-posting US median is about 115,000 dollars, with a typical range of 88,000 to 144,000. The official BLS OEWS median for project management specialists is 100,750, across a roughly one-million-person occupation.' },
      { q: 'Does a PMP increase project manager salary?', a: 'It helps mainly by getting you interviews and into higher-scope roles; pay scales with the size of what you own more than with the certificate itself.' },
      { q: 'Why has project manager pay grown slowly?', a: 'Demand is deep and steady rather than spiking, so pay rose about 7 percent since 2021, well below the newer tech roles that doubled that.' },
    ],
    routes: ['business-analyst-to-project-manager'],
    also: ['product-manager', 'marketing-manager', 'financial-analyst'],
  },

  'financial-analyst': {
    editorial: (
      <>
        <p>
          Financial analysis is the rare role where the official number sits
          above the advertised one. Live US postings put the median near
          82,000 dollars, but the OEWS median is 101,350, because job ads skew
          toward entry-level <a className="gl" href="/glossary#fpa">FP&amp;A</a> (financial planning and analysis) seats while OEWS counts the senior and
          buy-side analysts who rarely advertise. Read the OEWS line as the
          career, the posted band as the door. The stability is the real
          story: unemployment for financial and investment analysts is 1.7
          percent, among the lowest of any desk job we track, because every
          company needs someone to forecast and defend the budget. The ceiling
          opens with the <a className="gl" href="/glossary#cfa">CFA</a> (the Chartered Financial Analyst credential), which separates corporate analysts from the
          investment side where compensation stops being a salary and starts
          being a bonus. For an accountant weighing the move, this is the door
          out of the tight accounting band, and it opens with skills you
          already hold.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do financial analysts make?', a: 'The official BLS OEWS median is 101,350 dollars, above the live-posting median of about 82,000 because job ads skew toward entry-level roles. The posted middle half runs 75,000 to 107,000.' },
      { q: 'Do financial analysts have job security?', a: 'Unusually good: unemployment for financial and investment analysts is 1.7 percent, among the lowest of the desk jobs we track.' },
      { q: 'Is the CFA worth it for a financial analyst?', a: 'It is the credential that separates corporate FP&A from the higher-paid investment side, where compensation shifts from salary toward bonus. Not required for most corporate roles.' },
    ],
    routes: ['accountant-to-financial-analyst'],
    also: ['accountant', 'data-analyst', 'project-manager'],
  },

  'data-analyst': {
    editorial: (
      <>
        <p>
          Data analyst is the most searched entry point into data work, and
          the numbers carry a warning under the appeal. The blended US median
          is about 97,000 dollars with an OEWS median of 112,590, a healthy
          band, but unemployment for the category runs 4.9 percent, high for a
          role sold as future-proof. The reason is supply: bootcamps and
          degrees have poured entrants into the analyst tier faster than
          openings, so the entry market is crowded even as senior demand holds.
          The pay and the security both improve one rung up, where analysts who
          learn the engineering and modeling stack become data engineers or
          scientists and leave the crowd behind. If you are early in this
          field, treat the analyst title as a launch pad, not a destination;
          the <a className="gl" href="/glossary#sql">SQL</a> (Structured Query Language) and Python you already use are the down payment on the move.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do data analysts make?', a: 'The blended US median is about 97,000 dollars, with the official BLS OEWS median at 112,590 and a typical posted range of 77,000 to 123,000.' },
      { q: 'Is data analyst a good career in 2026?', a: 'The pay is solid, but the entry market is crowded: unemployment for the category is 4.9 percent. The security improves a rung up, at data engineer or data scientist.' },
      { q: 'What is the next step up from data analyst?', a: 'Data engineer or data scientist. Both pay more and have lower unemployment, and both build on the SQL and Python analysts already use.' },
    ],
    routes: ['data-analyst-to-data-engineer'],
    also: ['data-scientist', 'data-engineer', 'financial-analyst'],
  },

  'marketing-manager': {
    editorial: (
      <>
        <p>
          Marketing manager pay splits wide because the official category and
          the working reality diverge. OEWS reports a median of 161,030
          dollars, well above the live-posting median near 126,000, because the
          government bucket concentrates senior brand and demand-generation
          leaders while the ads we read include the mid-level managers running
          a channel. The middle half of postings, 94,000 to 161,000, is the
          honest working range. The role has held up through the automation of
          the tactical layer: as tools absorbed the campaign mechanics, the pay
          moved toward the strategic and analytical end, which is why the trend
          since 2019 is a healthy 18 percent. The best-paid move from here is
          lateral into product, where a marketer’s customer instinct and
          experiment discipline convert into a higher band. If your work is
          still tactical, the raise lives in owning the number, not the
          calendar.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do marketing managers make?', a: 'The official BLS OEWS median is 161,030 dollars, which skews senior; the live-posting median is about 126,000, with a working range of 94,000 to 161,000.' },
      { q: 'Can a marketing manager become a product manager?', a: 'It is a well-worn move: customer instinct and experiment discipline transfer, and product roles pay toward the higher end. See the marketing-manager-to-product-manager route.' },
      { q: 'Is marketing management a good-paying career?', a: 'Yes, and rising: pay grew about 18 percent since 2019 as the value shifted from tactical execution to strategy and analytics.' },
    ],
    routes: ['marketing-manager-to-product-manager'],
    also: ['product-manager', 'project-manager', 'graphic-designer'],
  },

  'graphic-designer': {
    editorial: (
      <>
        <p>
          Graphic design is the floor of the design pay ladder, and knowing
          that is the most useful thing this page can tell you. The blended US
          median is about 67,000 dollars with an OEWS median of 61,300, and
          unemployment runs 4.8 percent, a reflection of a crowded field where
          supply outpaces the openings. Pay did rise 18 percent since 2019, but
          from a low base, and the ceiling is real. The reason graphic-to-<a className="gl" href="/glossary#ux">UX</a> (user-experience design) is
          one of the most searched career changes on the internet is visible in
          the numbers: UX designers earn tens of thousands more for adjacent
          work, and the tools overlap far more than the pay does. If you are a
          strong graphic designer feeling the ceiling, the move is not to grind
          for a raise inside the band but to reframe your craft as product
          work, where the same eye is worth more. The gap is research and
          process evidence, not talent.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do graphic designers make?', a: 'The blended US median is about 67,000 dollars, with the official BLS OEWS median at 61,300 and a typical range of 48,000 to 89,000.' },
      { q: 'Is graphic design a good-paying career?', a: 'It is the lower end of design pay, with a real ceiling and 4.8 percent unemployment. The common way up is a pivot to UX design, which pays tens of thousands more.' },
      { q: 'Should a graphic designer switch to UX design?', a: 'For pay, often yes: UX medians run well above graphic design for adjacent work, and the tools overlap. The gap is user research and process evidence. See the graphic-designer-to-UX route.' },
    ],
    routes: ['graphic-designer-to-ux-designer'],
    also: ['ux-designer', 'marketing-manager', 'architect'],
  },

  'lawyer': {
    editorial: (
      <>
        <p>
          Lawyer pay tops this board and its unemployment sits at the bottom:
          a blended median near 166,000 dollars, an OEWS median of 151,160, and
          an unemployment rate of 0.8 percent, the lowest of any occupation we
          track. That combination is the credential moat in one line, the bar
          exam converting into scarcity and scarcity into pay and security. But
          the median hides the most bimodal distribution in professional work.
          Large-firm associates start above 200,000 while public-interest and
          small-practice lawyers earn a fraction of it, and the average sits in
          a valley few people actually occupy. So read the band, not the
          midpoint, and know which end you are aiming at before you count the
          three years of school and the exam. For a paralegal weighing the
          jump, the knowledge transfers and the credential does not shorten by
          a day; that is the whole calculation.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do lawyers make?', a: 'The blended US median is about 166,000 dollars, with the official BLS OEWS median at 151,160. The distribution is highly bimodal, from 130,000 at the 25th percentile to over 216,000 at the 75th.' },
      { q: 'What is the unemployment rate for lawyers?', a: '0.8 percent, the lowest of any occupation we track. Bar admission creates scarcity, and scarcity creates both pay and security.' },
      { q: 'Can a paralegal become a lawyer?', a: 'Only through law school and bar admission; the substantive knowledge transfers but the credential is not shortened by paralegal experience. See the paralegal-to-lawyer route.' },
    ],
    routes: ['paralegal-to-lawyer'],
    also: ['financial-analyst', 'accountant', 'project-manager'],
  },

  'nurse-practitioner': {
    editorial: (
      <>
        <p>
          Nurse practitioner is the top of the nursing ladder, and the official
          number tells the story the postings blur. OEWS puts the median at
          129,210 dollars; the live-posting figure is noisier because part-time
          and per-diem NP ads drag the low end down, so read the OEWS line as
          the real career pay. Unemployment is 1.2 percent, the same near-zero
          as bedside nursing, because the demand for advanced practice is
          structural and growing as primary care shortages widen. The lift over
          a registered nurse is large, roughly 35,000 dollars at the median,
          which is exactly why it is the single most common move nurses make.
          The catch is the credential: a graduate degree and an <a className="gl" href="/glossary#aprn">APRN</a> (advanced practice registered nurse) license,
          two to four years, not a skill gap. The pay is real and so is the
          school; plan the second before you count the first.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do nurse practitioners make?', a: 'The official BLS OEWS median is 129,210 dollars, roughly 35,000 above a registered nurse. Live postings read lower because part-time and per-diem ads drag the range down.' },
      { q: 'Is nurse practitioner a stable career?', a: 'Very: unemployment is 1.2 percent, and demand is growing structurally as primary-care shortages widen.' },
      { q: 'How does a registered nurse become a nurse practitioner?', a: 'Through a graduate degree (MSN or DNP), national certification, and an APRN license, typically two to four years. The pay lift is large. See the registered-nurse-to-nurse-practitioner route.' },
    ],
    routes: ['registered-nurse-to-nurse-practitioner'],
    also: ['registered-nurse', 'teacher', 'financial-analyst'],
  },

  'mechanical-engineer': {
    editorial: (
      <>
        <p>
          Mechanical engineering is the steady middle of the engineering pay
          band and one of its most secure corners. The blended US median is
          about 112,000 dollars with an OEWS median of 102,320, and
          unemployment runs 1.3 percent, low even by engineering standards,
          because the discipline underpins manufacturing, energy, aerospace,
          and building systems all at once. Pay rose 16 percent since 2019, a
          real gain driven less by any single boom than by the breadth of
          industries that need the skill. The spread inside the band is mostly
          about sector and sign-off: product and manufacturing roles cluster in
          the middle, while the <a className="gl" href="/glossary#pe-license">PE</a> license and senior responsible-charge seats
          pull the top. If your pay has flattened, the two levers are the
          license, which gates the higher-responsibility roles, and the
          industry, which moves the baseline more than the title does.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do mechanical engineers make?', a: 'The blended US median is about 112,000 dollars, with the official BLS OEWS median at 102,320 and a typical range of 92,000 to 135,000.' },
      { q: 'Is mechanical engineering a secure career?', a: 'Yes: unemployment is 1.3 percent, low even for engineering, because the skill underpins manufacturing, energy, aerospace, and building systems.' },
      { q: 'What raises a mechanical engineer’s salary?', a: 'The PE license, which gates higher-responsibility roles, and the industry: aerospace and energy pay above the baseline more than a title change does.' },
    ],
    routes: ['architect-to-mechanical-engineer'],
    also: ['civil-engineer', 'architect', 'electrician'],
  },

  'civil-engineer': {
    editorial: (
      <>
        <p>
          Civil engineering trades the highest ceilings for the steadiest
          ground. The blended US median is about 93,000 dollars with an OEWS
          median of 99,590, and unemployment sits at 1.5 percent, because civil
          work is public-money work: the backlog of roads, water, and site
          infrastructure does not follow the private construction cycle that
          whipsaws other building careers. Pay rose 14 percent since 2019,
          supported by sustained infrastructure spending. The number that moves
          a civil engineer’s pay is the <a className="gl" href="/glossary#pe-license">PE</a> license, which is not optional for
          responsible charge, the point at which an engineer can sign and seal
          work and take on the roles that pay the top of the band. For anyone
          weighing engineering disciplines for stability, civil is the answer:
          less upside than software or petroleum, far less volatility, and a
          demand floor set by the fact that the country’s infrastructure keeps
          aging whether the economy grows or not.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do civil engineers make?', a: 'The blended US median is about 93,000 dollars, with the official BLS OEWS median at 99,590 and a typical range of 76,000 to 116,000.' },
      { q: 'Is civil engineering a stable job?', a: 'One of the steadiest: unemployment is 1.5 percent, because civil work is public-money infrastructure that does not follow the private construction cycle.' },
      { q: 'Do civil engineers need a PE license?', a: 'For responsible charge, yes. The PE license gates the ability to sign and seal work and the senior roles that pay the top of the band.' },
    ],
    routes: ['architect-to-civil-engineer'],
    also: ['mechanical-engineer', 'architect', 'project-manager'],
  },

  'teacher': {
    editorial: (
      <>
        <p>
          Teacher pay is the clearest case on the board of a job that is secure
          and stuck. The blended US median is about 64,000 dollars with an OEWS
          median of 62,340, and unemployment is a low 2.2 percent, so the jobs
          are there. What is not there is growth: pay rose 4 percent since 2019,
          the slowest of any occupation we track, and well behind inflation
          over the same stretch. That gap between steady employment and
          stagnant pay is why teachers search for exits in the numbers you can
          measure. The most common one, instructional design, pays a starting
          band above the teacher median and rises past six figures, using the
          curriculum and facilitation skills a teacher already has. The exit is
          not a rejection of the work; it is a response to a pay curve that
          flattened while the cost of living did not. If you are weighing it,
          the skills transfer; the tooling and vocabulary are the gap.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do teachers make?', a: 'The blended US median is about 64,000 dollars, with the official BLS OEWS median for elementary and middle-school teachers at 62,340. The range is a tight 57,000 to 76,000.' },
      { q: 'Why is teacher pay so low?', a: 'It is not only low but stagnant: teacher pay rose about 4 percent since 2019, the slowest on our board and behind inflation, even though unemployment is a secure 2.2 percent.' },
      { q: 'What can teachers do for higher pay?', a: 'The most common move is instructional design, which starts above the teacher median and rises past six figures on the same curriculum and facilitation skills. See the teacher-to-instructional-designer route.' },
    ],
    routes: ['teacher-to-instructional-designer'],
    also: ['ux-designer', 'project-manager', 'accountant'],
  },

  'electrician': {
    editorial: (
      <>
        <p>
          Electrician pay is the strongest argument on this board against the
          assumption that a degree is the only road to a middle-class wage. The
          blended US median is about 69,000 dollars with an OEWS median of
          62,350, unemployment runs 3.0 percent, and none of it required a
          four-year degree or its debt. The path is an apprenticeship that pays
          while you learn, followed by a state license, and the top of the band
          pushes past 90,000 for master electricians and those who run their
          own work. Pay rose 11 percent since 2019, tracking the construction
          and electrification demand that is not going remote and not being
          automated. The honest comparison is not electrician versus office
          job; it is a debt-free trade with a licensed floor against a degree
          that costs four years and often lands in a similar band. For the
          right person, the trade wins on the math.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do electricians make?', a: 'The blended US median is about 69,000 dollars, with the official BLS OEWS median at 62,350. Master electricians and those who run their own work push past 90,000.' },
      { q: 'Is being an electrician worth it without a degree?', a: 'On the math, often yes: the path is a paid apprenticeship and a state license, no four-year degree or debt, landing in a band similar to many office jobs.' },
      { q: 'Is electrician a secure job?', a: 'Reasonably: unemployment is 3.0 percent, and the work is hands-on construction and electrification demand that is neither going remote nor being automated.' },
    ],
    routes: [],
    also: ['mechanical-engineer', 'civil-engineer', 'architect'],
  },

  'architect': {
    editorial: (
      <>
        <p>
          Architecture is the profession this instrument was built around, and
          its pay is the reason. The blended US median is about 86,000 dollars
          with an OEWS median of 96,690, modest for a career that demands a
          five-year degree, a multi-year internship, and a licensing exam. Call
          it the prestige tax: the work is admired and the credential is steep,
          and the pay does not match either. Unemployment is low at 2.2 percent
          and the trend since 2019 is a healthy 20 percent, so the field is
          stable and improving, but the ceiling stays lower than the training
          implies. That gap is the whole thesis behind PivotHop. An architect’s
          skills, spatial reasoning, project coordination, visualization, and
          the discipline of shipping a complex thing with a team, transfer to
          adjacent fields that pay more, from interior design to industrial
          design to product and <a className="gl" href="/glossary#ux">UX</a> (user-experience design). The routes below price each of those moves
          from an architect’s actual skill profile.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do architects make?', a: 'The official BLS OEWS median is 96,690 dollars, with a blended posted median near 86,000, modest for a career requiring a five-year degree and licensure. The typical range is 75,000 to 107,000.' },
      { q: 'Why do architects earn less than expected?', a: 'The credential is steep, a five-year degree plus internship and exams, but pay has not kept pace, a gap sometimes called the prestige tax. Unemployment is a stable 2.2 percent.' },
      { q: 'What careers pay more than architecture for the same skills?', a: 'Several adjacent fields, from interior and industrial design to product and UX, reward an architect’s spatial reasoning and coordination at a higher band. The routes below measure each move.' },
    ],
    routes: ['architect-to-interior-designer', 'architect-to-industrial-designer', 'architect-to-mep-engineer'],
    also: ['civil-engineer', 'mechanical-engineer', 'ux-designer'],
  },

  'data-engineer': {
    editorial: (
      <>
        <p>
          Data engineering carries the premium for owning the pipes rather than
          querying them. The blended US median is about 126,000 dollars, well
          above the data-analyst band, with an OEWS median of 135,980 under the
          database-administrators-and-architects category. Unemployment is a
          moderate 2.4 percent, lower than the crowded analyst tier, because the
          skill set is scarcer: building and running reliable pipelines at scale
          is closer to software engineering than to analysis. Pay rose 10
          percent since 2021 as every company that hired analysts discovered it
          also needed the infrastructure to feed them. For a data analyst, this
          is the most common and best-paid step up, and it starts from a
          position of strength, because the <a className="gl" href="/glossary#sql">SQL</a> (Structured Query Language) and Python are already in hand.
          What separates the bands is orchestration and the on-call ownership of
          data other teams depend on, which is exactly the gap worth closing.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do data engineers make?', a: 'The blended US median is about 126,000 dollars, above the data-analyst band, with the official BLS OEWS median at 135,980. The typical range is 113,000 to 152,000.' },
      { q: 'Do data engineers make more than data analysts?', a: 'Yes, meaningfully, and with lower unemployment (2.4 percent versus 4.9), because building and running pipelines at scale is a scarcer, engineering-grade skill.' },
      { q: 'How do you become a data engineer from a data analyst?', a: 'Close the orchestration and infrastructure gap (dbt, Airflow, warehouse modeling) on top of the SQL and Python you already use. See the data-analyst-to-data-engineer route.' },
    ],
    routes: ['data-analyst-to-data-engineer'],
    also: ['data-analyst', 'data-scientist', 'software-engineer'],
  },

  'machine-learning-engineer': {
    editorial: (
      <>
        <p>
          Machine-learning engineering is where the AI wave shows up in a
          paycheck. The blended US median is about 127,000 dollars, with a top
          of band stretching past 183,000 for people who can put models into
          production, and the trend since 2021 is 23 percent, among the fastest
          on the board. The role sits on the same SOC code as several design
          jobs in the official data, so the OEWS anchor understates it; read the
          posted band as the truer signal here. Unemployment is 3.3 percent,
          in line with software broadly. What commands the premium is the half
          of the job that is not modeling: deployment, monitoring, retraining,
          the reliability engineering that keeps a model useful after the demo.
          For a data scientist, that production gap is the boundary where the
          next raise lives, and it is real software engineering rather than more
          modeling.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do machine learning engineers make?', a: 'The blended US median is about 127,000 dollars, with the top of band past 183,000 for production and LLM-serving skills. Pay grew 23 percent since 2021.' },
      { q: 'Do ML engineers make more than data scientists?', a: 'At the top of band, yes: the premium is for production skills (deployment, monitoring, retraining) rather than modeling alone. See the data-scientist-to-ML-engineer route.' },
      { q: 'Is machine learning engineering a growing field?', a: 'Among the fastest-growing on our board: a 23 percent pay rise since 2021, driven by demand for people who can ship models, not just prototype them.' },
    ],
    routes: ['data-scientist-to-machine-learning-engineer'],
    also: ['data-scientist', 'software-engineer', 'data-engineer'],
  },

  'solutions-architect': {
    editorial: (
      <>
        <p>
          Solutions architect is the senior ceiling of the software track that
          you reach without leaving engineering for management. The blended US
          median is about 146,000 dollars, the highest of the tech roles on
          this board, with a middle half from 118,000 to 178,000 and a trend of
          23 percent since 2019. The OEWS anchor of 108,970 sits well below the
          posted band because the official category is broad and the advertised
          roles skew senior and well-funded. Unemployment is 3.3 percent, in
          line with software. What the pay buys is breadth plus translation:
          designing systems across services one person will never build, and
          selling that design to a room that cannot read a stack trace. For a
          software engineer, it is the cleanest senior move on our graph,
          because the cloud fluency is already there; the gap is stakeholder
          communication, which is exactly what strong engineers most often
          lack.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do solutions architects make?', a: 'The blended US median is about 146,000 dollars, the highest of the tech roles on our board, with a typical range of 118,000 to 178,000.' },
      { q: 'Is solutions architect a good career move from software engineering?', a: 'It is the cleanest senior step: cloud and implementation skills transfer directly, and the gap is stakeholder communication. See the software-engineer-to-solutions-architect route.' },
      { q: 'Why is the solutions architect salary above the OEWS figure?', a: 'The official OEWS category is broad and the advertised roles skew senior and well-funded, so the posted band runs above the 108,970 anchor.' },
    ],
    routes: ['software-engineer-to-solutions-architect'],
    also: ['software-engineer', 'data-engineer', 'data-scientist'],
  },

  'physician': {
    editorial: (
      <>
        <p>
          Physicians sit at the top of our salary board, a blended US median near 185,000 dollars, and the figure still
          understates the ceiling, because the specialties that pay most, surgery and anesthesiology and cardiology, post
          least. The floor is set by primary care and by the training pipeline: a physician clears roughly a decade of
          school and residency before the first attending paycheck, and carries the debt to match. Read the median as a
          mid-career number, not a starting one. The pay is real and durable, bought with the longest runway of any career
          we track.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do physicians make?', a: 'The blended US median is about 185,000 dollars, with the typical middle running from roughly 124,000 to 294,000. Surgical and procedural specialties run well above that; primary care sits below.' },
      { q: 'Why is the physician salary range so wide?', a: 'Because the title spans primary care to neurosurgery. Specialty, not seniority, drives most of the spread, and the highest-paid specialties advertise the least.' },
      { q: 'Is becoming a doctor worth it financially?', a: 'The pay is high and stable, but it arrives after about a decade of training and heavy debt. The lifetime math favors it; the early-career math does not.' },
    ],
    routes: [],
    also: ['nurse-practitioner', 'registered-nurse', 'pharmacist'],
  },

  'pharmacist': {
    editorial: (
      <>
        <p>
          Pharmacist pay is high and unusually flat: a blended US median near 153,000 dollars in a tight band, because the
          doctorate and license set a firm floor and the retail-versus-hospital split sets a modest ceiling. It is one of
          the best-paid careers that does not require a residency. But the market has tightened as chains consolidate and
          automation absorbs dispensing, so the growth is in clinical, hospital, and specialty roles now, not behind the
          counter. If you are weighing the doctorate, weigh the softening demand alongside the salary.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do pharmacists make?', a: 'The blended US median is about 153,000 dollars, a high floor set by the doctorate and license, with a relatively narrow range.' },
      { q: 'Is pharmacy still a good career?', a: 'The pay holds, but retail demand has softened with consolidation and automation. The growth is in clinical, hospital, and specialty roles.' },
      { q: 'Do pharmacists earn more than nurses?', a: 'At the median, usually yes, though nurse practitioners close the gap and physicians clear it.' },
    ],
    routes: [],
    also: ['physician', 'registered-nurse', 'nurse-practitioner'],
  },

  'physical-therapist': {
    editorial: (
      <>
        <p>
          Physical therapy pays a blended US median near 104,000 dollars, and the number comes with a warning the salary
          line does not show: the field now requires a doctorate, and the debt-to-income ratio is among the worst in
          healthcare. The work is durable, hands-on, and nearly automation-proof, which is the real case for it. But the pay
          has been roughly flat for a decade while the required schooling climbed. Read this as a vocation with a
          comfortable ceiling, not a wealth path.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do physical therapists make?', a: 'The blended US median is about 104,000 dollars, in a fairly tight range that has been close to flat over the past decade.' },
      { q: 'Is a physical therapy doctorate worth it?', a: 'The job is stable and rewarding, but the required doctorate carries debt that the flat salary services slowly. Run the numbers before enrolling.' },
      { q: 'Is physical therapy safe from AI?', a: 'Among the safest careers we track: it is hands-on, judgment-heavy, and physically present, which automation does not replace.' },
    ],
    routes: [],
    also: ['registered-nurse', 'nurse-practitioner', 'physician'],
  },

  'social-worker': {
    editorial: (
      <>
        <p>
          Social work is the clearest case on the board of a career priced below its social value. A blended US median near
          101,000 dollars looks healthy until you see it is carried by clinical and management roles; front-line case work
          sits well under it, often below a teacher&rsquo;s pay for a heavier caseload. The credential ladder is real: a
          master&rsquo;s degree and clinical licensure lift the number materially, so the honest advice is to treat the
          license as the pay lever it is. Demand is high and stable. The compensation is a policy choice, not a market
          failure.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do social workers make?', a: 'The blended US median is about 101,000 dollars, but that is lifted by clinical and supervisory roles; front-line case work pays well below it.' },
      { q: 'How can a social worker earn more?', a: 'The master of social work and clinical licensure are the main levers, moving pay from case work into clinical and management bands.' },
      { q: 'Is social work in demand?', a: 'Yes, high and stable demand, though the pay lags the need across most of the field.' },
    ],
    routes: [],
    also: ['teacher', 'registered-nurse', 'nurse-practitioner'],
  },

  'management-consultant': {
    editorial: (
      <>
        <p>
          Management consulting posts a blended US median near 101,000 dollars, which sounds modest until you realize it is
          dragged down by the enormous analyst base beneath the &ldquo;up or out&rdquo; pyramid. The spread is the story: a
          first-year analyst and a partner both wear the title, and the partner earns several times the median. It is the
          widest-reaching career on our board, measured in five markets, because the firms hire globally on the same
          profile. Read the median as the entry, not the destination, and note that the exits, into strategy, operations,
          and product, are often where the real money is.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do management consultants make?', a: 'The blended US median is about 101,000 dollars, but the range is enormous: analysts start below it and partners earn multiples of it.' },
      { q: 'Why is the consulting salary range so wide?', a: 'The up-or-out pyramid means one title spans a first-year analyst to a partner. Level, not the median, tells you the pay.' },
      { q: 'Is consulting worth it for the money?', a: 'The salary is good and the exit options are better. Many consultants earn most over their careers after they leave, in strategy and operations roles.' },
    ],
    routes: [],
    also: ['business-analyst', 'project-manager', 'financial-analyst'],
  },

  'business-analyst': {
    editorial: (
      <>
        <p>
          Business analyst pay, a blended US median near 108,000 dollars, sits at a useful crossroads: the seat where
          analytical skill meets delivery, feeding several higher-paid roles. The title is broad, from reporting-heavy work
          near the floor to product- and strategy-facing roles well above, so the median hides a real spread by industry.
          The most valuable thing about the seat is not its pay but its optionality: it is one skills-hop from project
          manager, product manager, and data analyst, each of which our routes price. Treat it as a hub, not a destination.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do business analysts make?', a: 'The blended US median is about 108,000 dollars, with a wide spread by industry and by how technical the role is.' },
      { q: 'What can a business analyst move into?', a: 'Project manager, product manager, and data roles are the common next steps, each a short skills-hop. The route pages price them.' },
      { q: 'Is business analyst a good career?', a: 'Yes, largely for its optionality: it sits one move from several better-paid roles.' },
    ],
    routes: ['business-analyst-to-project-manager'],
    also: ['project-manager', 'data-analyst', 'management-consultant'],
  },

  'hr-manager': {
    editorial: (
      <>
        <p>
          Human-resources management posts a blended US median near 105,000 dollars, a number that has quietly climbed as
          the function moved from administration to strategy. The spread tracks scope: a generalist running policy sits near
          the floor, while heads of talent and total-rewards leaders at scaled companies clear it comfortably. The role is
          less automatable than its reputation, because the hard part is judgment about people under conflicting incentives,
          not the paperwork that software now handles. The pay lever is specialization, into compensation, talent, or
          organizational design, not tenure.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do HR managers make?', a: 'The blended US median is about 105,000 dollars, rising with scope from generalist to head-of-function roles.' },
      { q: 'How does an HR manager earn more?', a: 'By specializing, into compensation, talent acquisition, or organizational design, rather than staying a generalist.' },
      { q: 'Is HR a safe career from automation?', a: 'The administrative half is automating; the judgment half, handling people under conflicting incentives, is not.' },
    ],
    routes: [],
    also: ['management-consultant', 'business-analyst', 'project-manager'],
  },

  'product-designer': {
    editorial: (
      <>
        <p>
          Product designer posts a blended US median near 126,000 dollars, well above the graphic- and UX-designer bands,
          because the title now means someone who owns a product surface end to end, from research to shipped interface,
          rather than someone who makes screens pretty. The premium is for the ownership, and it is real: the gap to graphic
          design runs to tens of thousands of dollars for work that shares most of its tools. If you are a designer weighing
          the move, the pay is the argument, and the route from graphic and UX design is a matter of evidence, not new
          software.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do product designers make?', a: 'The blended US median is about 126,000 dollars, above UX and graphic design, reflecting end-to-end product ownership.' },
      { q: 'What is the difference between a product designer and a UX designer?', a: 'Increasingly little in title, but product designers are expected to own outcomes and metrics, not only interfaces, and the pay reflects it.' },
      { q: 'How do you become a product designer?', a: 'Usually from UX or graphic design, on evidence of shipped, owned work rather than a new toolset.' },
    ],
    routes: ['graphic-designer-to-ux-designer'],
    also: ['ux-designer', 'graphic-designer', 'software-engineer'],
  },

  'security-engineer': {
    editorial: (
      <>
        <p>
          Security engineering posts a blended US median near 145,000 dollars, among the highest of the engineering tracks,
          and the premium is a scarcity story: the supply of people who can both build and break is thin, and the cost of
          getting it wrong is unbounded. The band widens fast toward offensive and cloud-security roles, where the
          ethical-hacking market pushes pay past the median. The seat is a short hop from software and DevOps engineering for
          anyone who has run production systems, and the demand is structural rather than cyclical. Security is where
          &ldquo;senior engineer plus a specialty&rdquo; pays the most reliably.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do security engineers make?', a: 'The blended US median is about 145,000 dollars, among the top engineering tracks, rising toward offensive and cloud-security specialties.' },
      { q: 'Why do security engineers earn so much?', a: 'Scarcity: few people can both build and break systems, and the downside of failure is unbounded, so the market pays up.' },
      { q: 'How do you become a security engineer?', a: 'Commonly from software or DevOps engineering, adding a security specialty on top of production experience.' },
    ],
    routes: ['software-engineer-to-solutions-architect'],
    also: ['software-engineer', 'devops-engineer', 'solutions-architect'],
  },

  'backend-developer': {
    editorial: (
      <>
        <p>
          Backend developer posts a blended US median near 132,000 dollars, a touch above the general software-engineer
          band, because the title concentrates the higher-paid, systems-heavy end of the work: databases, services, scale,
          the parts that do not show on a screen. The spread tracks the stack and the scale, from small-company generalists
          near the floor to distributed-systems specialists well above. It is the most portable seat in software, one hop
          from data engineering, DevOps, and solutions architecture, and the demand has held even as front-end hiring
          softened. Depth in one backend domain is the pay lever.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do backend developers make?', a: 'The blended US median is about 132,000 dollars, slightly above general software engineering, reflecting the systems-heavy end of the work.' },
      { q: 'Do backend developers earn more than frontend developers?', a: 'Usually a modest premium, because backend work skews toward scale and systems, which pay more.' },
      { q: 'What can a backend developer move into?', a: 'Data engineering, DevOps, and solutions architecture are the common, well-paid next steps.' },
    ],
    routes: ['software-engineer-to-solutions-architect'],
    also: ['software-engineer', 'data-engineer', 'solutions-architect'],
  },

  'devops-engineer': {
    editorial: (
      <>
        <p>
          DevOps and platform engineering posts a blended US median near 134,000 dollars, and the pay reflects a role on the
          critical path: the person who owns deployment, reliability, and the infrastructure a hundred other engineers
          depend on. The premium is for the pager as much as the skill, because owning production means owning the failure
          at three in the morning. The band runs high toward site-reliability and cloud-platform specialties. It is a
          natural step up from software engineering or systems administration, and the demand is durable, because every
          company that ships software needs someone to keep it shipped.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do DevOps engineers make?', a: 'The blended US median is about 134,000 dollars, rising toward site-reliability and cloud-platform roles.' },
      { q: 'Why do DevOps engineers earn a premium?', a: 'They own production reliability and the infrastructure many other engineers depend on, including the on-call failures.' },
      { q: 'How do you become a DevOps engineer?', a: 'Commonly from software engineering or systems administration, adding infrastructure and reliability ownership.' },
    ],
    routes: ['software-engineer-to-solutions-architect'],
    also: ['software-engineer', 'backend-developer', 'solutions-architect'],
  },

  'qa-engineer': {
    editorial: (
      <>
        <p>
          Quality-assurance engineering posts a blended US median near 111,000 dollars, and the number is quietly rising as
          the role shifts from manual testing to automation and tooling. That shift is also the risk: the manual-testing
          floor is exactly what automated tooling and AI absorb first, while the automation-engineering ceiling holds and
          climbs. The spread between the two is wide and widening. If you are in quality assurance, the pay advice and the
          job-security advice are the same one: move from running tests to writing the systems that run them.
        </p>
      </>
    ),
    faq: [
      { q: 'How much do QA engineers make?', a: 'The blended US median is about 111,000 dollars, with a wide gap between manual testing at the floor and automation engineering above.' },
      { q: 'Is QA a dying field?', a: 'Manual testing is shrinking under automation and AI; automation and quality-engineering roles are growing and pay more.' },
      { q: 'How does a QA engineer earn more?', a: 'By moving from manual testing into test automation and tooling, which is also the more secure side of the role.' },
    ],
    routes: [],
    also: ['software-engineer', 'backend-developer', 'data-engineer'],
  },

};

export const SALARY_SLUGS = Object.keys(SALARY);

/* Auto-coverage: every occupation with solid data gets a page. The curated
   entries above carry a hand-written editorial; the rest get a summary
   generated from their own numbers (a real, occupation-specific read, drafted
   for a later hand pass), plus a data-driven FAQ and adjacency-derived related
   links. Gated by a data floor so nothing thin ships. */
const OBS_FLOOR = 50;
export function isCoverable(f: SalaryFile | null): f is SalaryFile {
  return !!f && (usBand(f)?.p50 ?? 0) > 0 && (f.observations ?? 0) >= OBS_FLOOR;
}
let _cover: string[] | null = null;
const _coverSet = new Set<string>();
function loadCover() {
  if (_cover) return;
  _cover = [];
  try {
    const dir = path.join(process.cwd(), 'public', 'data', 'salaries');
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.json')) continue;
      const slug = file.replace(/\.json$/, '');
      if (isCoverable(getSalary(slug))) { _cover.push(slug); _coverSet.add(slug); }
    }
    _cover.sort();
  } catch { /* no dir at build edge */ }
}
export function coverableSlugs(): string[] { loadCover(); return _cover!; }
export function coverable(slug: string): boolean { loadCover(); return _coverSet.has(slug); }

let _metaCache: Record<string, { field?: string; demand?: string; remote?: string }> | null = null;
function getMeta(occ: string) {
  if (!_metaCache) _metaCache = read<{ meta: typeof _metaCache }>('occ-meta.json')?.meta ?? {};
  return _metaCache![occ] ?? null;
}
function topAdjacent(occ: string): { title: string; match: number } | null {
  const o = read<{ roles?: { id: string; title: string; match: number }[] }>(`${occ}.json`);
  const r = o?.roles?.[0];
  return r ? { title: r.title, match: r.match } : null;
}
const dollars = (v?: number | null) => (v == null ? '—' : Math.round(v).toLocaleString() + ' dollars');

function defaultDef(occ: string, f: SalaryFile): SalaryDef {
  const b = usBand(f);
  const anchor = f.by_country?.US?.anchor;
  const meta = getMeta(occ);
  const hist = getHistory(occ);
  const trend = hist.length >= 2 ? Math.round(((hist[hist.length - 1].p50 - hist[0].p50) / hist[0].p50) * 100) : null;
  const adj = topAdjacent(occ);
  const t = f.title.toLowerCase();
  const art = /^[aeiou]/i.test(t) ? 'an' : 'a';
  const Art = art === 'an' ? 'An' : 'A';
  const sen = f.seniority || {};
  const lo = sen.entry?.p50 ?? sen.mid?.p50 ?? null;
  const hi = sen.lead?.p50 ?? sen.senior?.p50 ?? null;
  const overUnder = anchor?.p50 != null && b?.p50 != null
    ? anchor.p50 > b.p50
      ? `The official OEWS median is higher, ${dollars(anchor.p50)}, because job ads skew toward the roles that pay below the occupation-wide average. `
      : `The official OEWS median is ${dollars(anchor.p50)}, under the posted figure, because the advertised roles skew senior or well-funded. `
    : '';
  const editorial = (
    <>
      <p>
        {`${Art} ${t} earns a blended US median near ${dollars(b?.p50)}, with the typical middle running from ${dollars(b?.p25)} to ${dollars(b?.p75)}. `}
        {overUnder}
        {trend != null ? `The official trend has moved ${trend >= 0 ? 'up' : 'down'} about ${Math.abs(trend)} percent since ${hist[0].year}. ` : ''}
        {lo != null && hi != null && hi > lo ? `By seniority, posted pay runs from roughly ${dollars(lo)} to ${dollars(hi)}. ` : ''}
        {meta?.demand ? `Demand is rated ${meta.demand.toLowerCase()}${meta.remote ? `, and ${meta.remote} of postings are fully remote` : ''}. ` : ''}
        {adj ? `The nearest adjacent move on our skill graph is ${adj.title.toLowerCase()}, at ${adj.match} percent coverage; the instrument maps the rest.` : ''}
      </p>
    </>
  );
  const faq = [
    { q: `How much does ${art} ${t} make?`, a: `The blended US median is about ${dollars(b?.p50)}, with a typical range from ${dollars(b?.p25)} to ${dollars(b?.p75)}${anchor?.p50 != null ? `, against an official OEWS median of ${dollars(anchor.p50)}` : ''}.` },
    meta?.demand ? { q: `Is ${t} a good career in 2026?`, a: `Demand for the role is rated ${meta.demand.toLowerCase()} in our July 2026 corpus${meta.remote ? `, with ${meta.remote} of postings fully remote` : ''}. The pay is shown above by seniority and by country.` } : null,
    adj ? { q: `What can ${art} ${t} move into?`, a: `The nearest adjacent role on our skill graph is ${adj.title.toLowerCase()}, at ${adj.match} percent skill coverage. Run the instrument for the full set of reachable moves.` } : null,
  ].filter((x): x is { q: string; a: string } => x != null);
  const o = read<{ roles?: { id: string }[] }>(`${occ}.json`);
  const also = (o?.roles || []).map((r) => r.id).filter((s) => s !== occ && coverable(s)).slice(0, 3);
  return { editorial, faq, routes: [], also };
}

/** Curated def if we have one, else a generated one, else null (below the floor). */
export function getSalaryDef(occ: string): SalaryDef | null {
  if (SALARY[occ]) return SALARY[occ];
  const f = getSalary(occ);
  return isCoverable(f) ? defaultDef(occ, f) : null;
}
