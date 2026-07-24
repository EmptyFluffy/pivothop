// The glossary + sources register (one page, docs-driven). Every acronym and
// institution the blog and instrument use, defined once, anchored by `id`.
// Blog posts expand each term on first mention and link to `/glossary#<id>`.
// Definitions follow the house voice: deadpan, specific, numbers over
// adjectives, no em dashes. Detailed enough to stand alone as an SEO answer
// to "what is X", short enough to read.

export type GlossaryEntry = {
  id: string;          // anchor slug
  term: string;        // the acronym or short form shown as the heading
  full: string;        // the spelled-out name
  cat: 'term' | 'source';
  def: string;         // the definition (plain text; rendered as a paragraph)
  url?: string;        // external source link (sources only)
};

export const GLOSSARY: GlossaryEntry[] = [
  // ── Terms and acronyms ──
  {
    id: 'jaccard', term: 'Jaccard', full: 'Jaccard index', cat: 'term',
    def: 'A measure of how similar two sets are: the number of items they share divided by the total number of distinct items across both. For two occupations it is the skills they have in common divided by every skill either one demands, so it runs from 0 (no overlap) to 1 (identical). PivotHop ranks career routes first by coverage, the share of the destination’s skills the origin already has, and uses the Jaccard index as the tiebreaker, because it rewards pairs that are close in both directions rather than one role simply being a superset of the other.',
  },
  {
    id: 'soc', term: 'SOC', full: 'Standard Occupational Classification', cat: 'term',
    def: 'The federal coding system that assigns every job in the United States a number, so a “software developer” in one dataset can be matched to a “software developer” in another. The Bureau of Labor Statistics maintains it and revises it every few years, and most US labor data (wages, projections, mobility) is keyed to it. PivotHop uses SOC codes to join live postings to official wage and separation figures.',
  },
  {
    id: 'addie', term: 'ADDIE', full: 'Analysis, Design, Development, Implementation, Evaluation', cat: 'term',
    def: 'The five-stage framework corporate instructional design is built on, and the vocabulary hiring managers screen for when a teacher applies for an instructional-design role. Knowing the word is often the difference between a resume that reads as “teacher” and one that reads as “instructional designer.”',
  },
  {
    id: 'fpa', term: 'FP&A', full: 'Financial Planning and Analysis', cat: 'term',
    def: 'The forward-looking side of corporate finance: building budgets, forecasting revenue, and explaining variances, as opposed to accounting, which records what already happened. FP&A is the usual landing spot for an accountant moving into a financial-analyst role.',
  },
  {
    id: 'etl', term: 'ETL', full: 'Extract, Transform, Load', cat: 'term',
    def: 'The process of pulling data out of source systems, reshaping it, and loading it into a warehouse where analysts can use it. Building and maintaining ETL pipelines is the core of data engineering, and ETL fluency is exactly what a data analyst already holds when they consider that move.',
  },
  {
    id: 'mlops', term: 'MLOps', full: 'Machine Learning Operations', cat: 'term',
    def: 'The engineering discipline of running machine-learning models in production reliably: deploying them, monitoring them, retraining them, and rolling them back when they fail. It is the part of the job that separates a machine-learning engineer, who keeps the model running, from a data scientist, who proves it works.',
  },
  {
    id: 'rag', term: 'RAG', full: 'Retrieval-Augmented Generation', cat: 'term',
    def: 'A technique that lets a large language model answer from a specific set of documents by fetching relevant passages first and feeding them to the model, instead of relying only on what it memorized during training. It has become a standard skill in AI-engineering and machine-learning postings.',
  },
  {
    id: 'llm', term: 'LLM', full: 'Large Language Model', cat: 'term',
    def: 'The class of AI system, GPT and its peers, trained on vast amounts of text to generate and reason over language. “LLM experience” has gone from exotic to expected in AI-adjacent job postings in the space of about two years.',
  },
  {
    id: 'ats', term: 'ATS', full: 'Applicant Tracking System', cat: 'term',
    def: 'The software an employer uses to receive, filter, and rank job applications. Because many systems screen resumes for keywords before a human sees them, the exact vocabulary in a posting, ADDIE, Figma, dbt, often matters more than the underlying skill on the first pass.',
  },
  {
    id: 'ux', term: 'UX', full: 'User Experience design', cat: 'term',
    def: 'The practice of designing how a product feels to use: research, information architecture, interaction, and testing, as distinct from visual or graphic design. UX roles pay well above graphic-design roles and are projected to grow faster, which is why the graphic-designer-to-UX move is one of the most searched career changes.',
  },
  {
    id: 'seo', term: 'SEO', full: 'Search Engine Optimization', cat: 'term',
    def: 'The practice of shaping content and sites so they rank in search results. As answer engines and AI overviews absorb more queries, the discipline is shifting from ranking blue links to being cited inside AI answers, a change sometimes called GEO or AEO.',
  },
  {
    id: 'geo', term: 'GEO / AEO', full: 'Generative / Answer Engine Optimization', cat: 'term',
    def: 'The newer discipline of getting a brand or page cited inside AI-generated answers (ChatGPT, Perplexity, Google’s AI Overviews) rather than ranked as a link. Proprietary, verifiable data is the strongest lever, because it is what AI answers quote.',
  },
  {
    id: 'rto', term: 'RTO', full: 'Return to Office', cat: 'term',
    def: 'The wave of employer mandates, from 2023 onward, requiring workers back on site full or part time after the remote experiment of 2020 to 2022. RTO policy is one of the forces reshaping which occupations post remote roles and which do not.',
  },
  {
    id: 'leed', term: 'LEED', full: 'Leadership in Energy and Environmental Design', cat: 'term',
    def: 'The most widely used green-building certification, run by the US Green Building Council. LEED credentials show up in architecture, engineering, and construction postings as a signal of sustainability fluency.',
  },
  {
    id: 'bim', term: 'BIM', full: 'Building Information Modeling', cat: 'term',
    def: 'The 3D, data-rich modeling method that has replaced 2D drafting across much of architecture and engineering, with Revit the dominant tool. BIM coordination is the shared language that makes the architect-to-MEP-engineer move unusually smooth.',
  },
  {
    id: 'mep', term: 'MEP', full: 'Mechanical, Electrical, and Plumbing engineering', cat: 'term',
    def: 'The building-systems engineering disciplines that sit alongside architecture on every project. Because architects coordinate MEP work for years, MEP engineering is the closest lateral move on our graph for many of them.',
  },
  {
    id: 'fea', term: 'FEA', full: 'Finite Element Analysis', cat: 'term',
    def: 'The numerical method engineers use to simulate how a structure or part behaves under load, by breaking it into a mesh of small elements. FEA fluency is the degree-shaped core of the architect-to-structural-engineer gap: reading structural drawings is not the same as producing the analysis behind them.',
  },
  {
    id: 'gdt', term: 'GD&T', full: 'Geometric Dimensioning and Tolerancing', cat: 'term',
    def: 'The symbolic language that specifies the allowable variation on a manufactured part, standard on product and mechanical drawings. It belongs to product-side mechanical engineering, one reason that half of the field is a separate education from building mechanical.',
  },
  {
    id: 'plc', term: 'PLC', full: 'Programmable Logic Controller', cat: 'term',
    def: 'The ruggedized industrial computer that runs machinery and process automation. PLC and circuit design mark the boundary between the building-electrical work an architect can pivot into and the power-and-product electrical engineering that requires going back to school.',
  },
  {
    id: 'pe-license', term: 'PE', full: 'Professional Engineer license', cat: 'term',
    def: 'The state license that lets an engineer take legal responsibility for work, “sign and seal” drawings, in civil, structural, mechanical, and electrical practice. It gates responsible-charge roles but not every product or coordination seat, a distinction that matters for architects eyeing an engineering pivot.',
  },
  {
    id: 'hvac', term: 'HVAC', full: 'Heating, Ventilation, and Air Conditioning', cat: 'term',
    def: 'The building-comfort systems trade, and by extension the technician occupation that installs and services them. HVAC technician is one of the least-remote occupations we track: hands-on, on-site, and licensed.',
  },
  {
    id: 'ffe', term: 'FF&E', full: 'Furniture, Fixtures, and Equipment', cat: 'term',
    def: 'The specification and procurement of everything that goes into a space but is not structure, from chairs to lighting. FF&E and procurement are the commercial half of interior design that architects most often have not run, and the main gap in the architect-to-interior-designer move.',
  },
  {
    id: 'cfa', term: 'CFA', full: 'Chartered Financial Analyst', cat: 'term',
    def: 'A demanding, multi-exam credential for investment and financial-analysis professionals. It is not required for most corporate financial-analyst roles, but it widens the pay gap over accountants who make the switch.',
  },
  {
    id: 'cpa', term: 'CPA', full: 'Certified Public Accountant', cat: 'term',
    def: 'The license for accountants who sign audits and handle certain public filings. Required for some accounting roles, not for financial analysis, which is part of why the accountant-to-analyst move is common.',
  },
  {
    id: 'finra', term: 'FINRA', full: 'Financial Industry Regulatory Authority', cat: 'term',
    def: 'The self-regulatory body whose licenses (the Series 7 and others) are required to sell securities. FINRA licensing enters the picture only for securities-facing financial-analyst roles, not corporate FP&A.',
  },
  {
    id: 'pmp', term: 'PMP / CAPM', full: 'Project Management Professional / Certified Associate', cat: 'term',
    def: 'The most recognized project-management certifications, run by the Project Management Institute, with CAPM the entry-level version of the PMP. A PMP is the common signal that converts a business analyst’s experience into project-manager offers, and unlike a license it takes months, not years.',
  },
  {
    id: 'msn-dnp', term: 'MSN / DNP', full: 'Master of Science / Doctor of Nursing Practice', cat: 'term',
    def: 'The graduate degrees a registered nurse must earn to become a nurse practitioner. They are the real timeline behind that move, two to four years, which a skill-readiness number alone does not show.',
  },
  {
    id: 'aprn', term: 'APRN', full: 'Advanced Practice Registered Nurse', cat: 'term',
    def: 'The license category covering nurse practitioners and similar advanced roles, requiring a graduate degree and national certification on top of an RN license. It is the legal gate on the registered-nurse-to-nurse-practitioner pivot.',
  },
  {
    id: 'lare', term: 'LARE', full: 'Landscape Architect Registration Examination', cat: 'term',
    def: 'The licensing exam for landscape architects in most US states. Because architecture licensure rarely reciprocates into it, the architect-to-landscape-architect move is a second license, not a specialization.',
  },
  {
    id: 'are-exam', term: 'ARE', full: 'Architect Registration Examination', cat: 'term',
    def: 'The multi-division exam a candidate passes to become a licensed architect in the United States, alongside a professional degree and documented experience hours.',
  },
  {
    id: 'lms', term: 'LMS', full: 'Learning Management System', cat: 'term',
    def: 'The platform (Canvas, Moodle, and corporate equivalents) that hosts and tracks online courses. LMS familiarity is one of the tooling gaps between classroom teaching and corporate instructional design.',
  },
  {
    id: 'psypact', term: 'PSYPACT', full: 'Psychology Interjurisdictional Compact', cat: 'term',
    def: 'An interstate agreement that lets a psychologist practice, including by telehealth, across the 40-plus member jurisdictions on a single authorization. It is the reason psychologists post far more remote roles than other licensed clinicians.',
  },
  {
    id: 'nlc', term: 'NLC', full: 'Nurse Licensure Compact', cat: 'term',
    def: 'The interstate agreement, now covering more than 40 states, that lets a nurse practice across member states on one license. It expands where a nurse can work, but not how remote the work is, because the patient still has to be physically cared for.',
  },
  {
    id: 'ppp', term: 'PPP', full: 'Purchasing Power Parity', cat: 'term',
    def: 'The exchange rate at which a basket of goods costs the same in two countries, as opposed to the market rate. FairElephant uses World Bank price levels derived from PPP to compare pay across countries by what money actually buys.',
  },
  {
    id: 'cc-by', term: 'CC BY', full: 'Creative Commons Attribution license', cat: 'term',
    def: 'The open license that permits reuse, including commercial reuse and redistribution of derived numbers, as long as the source is credited. Several of the datasets behind PivotHop, the CPS mobility network and JobHop among them, are CC BY, which is what makes them legally usable in a product that charges.',
  },
  {
    id: 'sql', term: 'SQL', full: 'Structured Query Language', cat: 'term',
    def: 'The standard language for querying databases, and the load-bearing skill shared by data analysts and data engineers. SQL fluency is why the analyst-to-engineer move starts from a position of strength.',
  },
  {
    id: 'faa', term: 'FAA', full: 'Federal Aviation Administration', cat: 'term',
    def: 'The US aviation regulator whose certifications gate pilot and flight-attendant roles. It appears here in transferable-skills examples, where a licensed destination sets the real timeline.',
  },

  // ── Sources and data ──
  {
    id: 'bls', term: 'BLS', full: 'US Bureau of Labor Statistics', cat: 'source', url: 'https://www.bls.gov',
    def: 'The federal statistical agency behind most of the labor data PivotHop and FairElephant rest on: wage percentiles (OEWS), employment projections and occupational-transfer rates, and the Current Population Survey. BLS material is public domain, which is part of why it anchors so much of the instrument.',
  },
  {
    id: 'oews', term: 'OEWS', full: 'Occupational Employment and Wage Statistics', cat: 'source', url: 'https://www.bls.gov/oes/',
    def: 'The BLS survey that reports wage percentiles, the 10th through the 90th, for every occupation, nationally and by state. FairElephant blends OEWS anchors with live-posting pay so a salary estimate is grounded in official numbers rather than only what employers happen to advertise. Public domain.',
  },
  {
    id: 'cps', term: 'CPS', full: 'Current Population Survey', cat: 'source', url: 'https://www.census.gov/programs-surveys/cps.html',
    def: 'The monthly household survey run by the Census Bureau for BLS, and the basis for the unemployment rate. Because it records each respondent’s occupation over time, researchers have derived occupation-to-occupation mobility from it, and that observed-flow signal is what tells PivotHop where people actually go, not just where skills suggest they could.',
  },
  {
    id: 'sipp', term: 'SIPP', full: 'Survey of Income and Program Participation', cat: 'source', url: 'https://www.census.gov/sipp/',
    def: 'A Census Bureau longitudinal survey that follows the same people over time, capturing job and occupation changes. It is one of the two sources behind the Department of Labor’s public-use transitions file.',
  },
  {
    id: 'dol', term: 'DOL', full: 'US Department of Labor', cat: 'source', url: 'https://www.dol.gov',
    def: 'The cabinet department whose research arm published the Career Trajectories and Occupational Transitions study, a public-use dataset of observed occupation changes that PivotHop ingests as a second US mobility signal.',
  },
  {
    id: 'ctot', term: 'CTOT', full: 'Career Trajectories and Occupational Transitions', cat: 'source', url: 'https://www.dol.gov/agencies/oasp/evaluation/completed-studies',
    def: 'A US Department of Labor public-use dataset of observed occupation-to-occupation moves, drawn from CPS and SIPP records with survey weights. It corroborates where workers actually go, as opposed to where skills suggest they could, and covers mid-level occupations in particular.',
  },
  {
    id: 'onet', term: 'O*NET', full: 'Occupational Information Network', cat: 'source', url: 'https://www.onetonline.org',
    def: 'The free US Department of Labor database describing every occupation’s skills, abilities, work activities, and related occupations. PivotHop uses its “related occupations” as a curated corroboration signal and its ability ratings for capability similarity. Licensed CC BY.',
  },
  {
    id: 'esco', term: 'ESCO', full: 'European Skills, Competences, Qualifications and Occupations', cat: 'source', url: 'https://esco.ec.europa.eu',
    def: 'The European Union’s multilingual occupation-and-skills classification, the rough European counterpart to O*NET and SOC. The JobHop transition dataset is coded to ESCO occupations.',
  },
  {
    id: 'worldbank-icp', term: 'World Bank ICP', full: 'International Comparison Program', cat: 'source', url: 'https://www.worldbank.org/en/programs/icp',
    def: 'The World Bank program that measures price levels across countries, the basis for purchasing-power comparisons. FairElephant uses ICP-derived price levels to convert pay between countries by what it actually buys, not the market exchange rate.',
  },
  {
    id: 'jobhop', term: 'JobHop', full: 'JobHop career-trajectory dataset', cat: 'source', url: 'https://esco.ec.europa.eu/en/about-esco/publications',
    def: 'An open dataset of observed career trajectories built from anonymized resumes collected by VDAB, the Flemish public employment service. Coded to ESCO occupations and licensed CC BY, it gives PivotHop a European observed-mobility signal at finer resolution than the coarser US occupation codes allow.',
  },
  {
    id: 'flexjobs', term: 'FlexJobs', full: 'FlexJobs Remote Work Economy Index', cat: 'source', url: 'https://www.flexjobs.com',
    def: 'A remote-and-flexible job board that publishes an annual index of remote-hiring trends by category. PivotHop cites its year-over-year growth figures for directional claims about which fields are adding remote roles, clearly labeled as the tracker’s numbers, not ours.',
  },
  {
    id: 'roberthalf', term: 'Robert Half', full: 'Robert Half workforce research', cat: 'source', url: 'https://www.roberthalf.com',
    def: 'A staffing and recruiting firm that publishes quarterly workforce and remote-work statistics, used here to calibrate our own remote-posting shares against an outside count.',
  },
  {
    id: 'lightcast', term: 'Lightcast', full: 'Lightcast (Emsi Burning Glass)', cat: 'source', url: 'https://lightcast.io',
    def: 'The labor-market analytics firm formed from the merger of Emsi and Burning Glass. Its occupation and transition data is commercial; PivotHop notes it as the paid frontier it deliberately does not depend on, and as the licensed source underneath some public Department of Labor files.',
  },
  {
    id: 'opportunity-at-work', term: 'Opportunity@Work', full: 'Opportunity@Work (STARs)', cat: 'source', url: 'https://opportunityatwork.org',
    def: 'A nonprofit that studies workers “skilled through alternative routes” rather than degrees, the STARs framework. Cited in our degree-premium analysis for its count of roughly 70 million US workers without a bachelor’s who are nonetheless skilled through experience.',
  },
  {
    id: 'college-board', term: 'College Board', full: 'College Board, Education Pays', cat: 'source', url: 'https://research.collegeboard.org',
    def: 'The nonprofit behind the SAT, which also publishes “Education Pays,” a standard reference on the earnings gap between degree holders and non-graduates. Cited for the annual degree-premium figure.',
  },
  {
    id: 'jll', term: 'JLL', full: 'Jones Lang LaSalle', cat: 'source', url: 'https://www.jll.com',
    def: 'A commercial real-estate firm whose occupancy research tracks return-to-office trends. Cited for the share of large-company employees under office mandates.',
  },
  {
    id: 'ncsbn', term: 'NCSBN', full: 'National Council of State Boards of Nursing', cat: 'source', url: 'https://www.ncsbn.org',
    def: 'The body that administers the Nurse Licensure Compact and nursing exams. Cited for the current count of compact states.',
  },
  {
    id: 'postings', term: 'Adzuna · USAJOBS · Reed', full: 'Live job-posting sources', cat: 'source', url: 'https://developer.adzuna.com',
    def: 'The keyed posting sources PivotHop scrapes under their terms: Adzuna (a global aggregator with salary data), USAJOBS (US federal roles with clean pay bands), and Reed (UK employer-stated pay). Together with several open boards, they supply the live postings behind every match and salary band. No LinkedIn or Indeed, by policy.',
  },
];

export const GLOSSARY_IDS = new Set(GLOSSARY.map((e) => e.id));
