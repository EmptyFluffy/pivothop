import type { ReactNode } from 'react';
import { DATA } from '@/lib/data';

/* Preloaded route pages (docs/05): saved states of the instrument, one per
   first-hop destination. Every number renders from the same baked payload the
   graph uses (DATA), so the page and the instrument can never disagree.
   The editorial block is the judgment layer — drafted for Carlos to rewrite
   in his own voice before launch traffic (docs/05, non-negotiable #2).
   Evidence lists are hand-curated FROM the data: we select which extracted
   skills to show, we never invent one. */

export type RouteRole = {
  id: string; title: string; field: string; match: number; fit?: number;
  salary: string; demand: string; remote: string; time: string;
  have: string[]; learn: string[]; mobility?: number | null; mobility_source?: string | null;
  kind?: string | null; license?: { req: string; label: string } | null;
};

type Evidence = { label: string; state: 'have' | 'partial' | 'gap'; note: string };

export type RouteDef = {
  dest: string;                 // destination slug (must exist in DATA.roles)
  editorial: ReactNode;         // Carlos's judgment layer (draft)
  evidence: Evidence[];         // curated from the extracted skills
  faq: { q: string; a: string }[];
  related: string[];            // sibling route slugs
};

export function destRole(slug: string): RouteRole | undefined {
  return (DATA.roles as RouteRole[]).find((r) => r.id === slug);
}
export function unlocks(slug: string): { t: string; m: number; after?: number }[] {
  return ((DATA.next as Record<string, { t: string; m: number; after?: number }[]>)[slug] ?? []);
}
export const ORIGIN = { slug: 'architect', title: 'Architect', postings: DATA.postings as number, separations: (DATA as { separations?: { transfer: number; exit: number } }).separations };

export const ROUTES: Record<string, RouteDef> = {
  'architect-to-interior-designer': {
    dest: 'interior-designer',
    editorial: (
      <>
        <p>
          This is the single most common exit from architecture in the federal
          transition data, and it is not close. It is also the move architects
          underrate most, because it looks like a demotion in scale: rooms
          instead of buildings. What actually changes is the client
          relationship. Interior work bills faster, revises faster, and puts
          you nearer the decisions that get built. The readiness gap is not
          design ability; it is the commercial half of the job. FF&amp;E
          schedules, procurement, vendor relationships, and the discipline of
          space planning to a program are their own trade with their own
          rhythm, and postings ask for them by name. An architect who has run
          construction administration already has the hard part: keeping a
          project honest between drawing and site. Concrete first step: take
          one interiors-heavy project at your current firm, own the FF&amp;E
          package end to end, and put it at the top of the portfolio. That
          single package answers the question every interiors studio will ask.
        </p>
      </>
    ),
    evidence: [
      { label: 'Revit and documentation fluency', state: 'have', note: 'Standard architecture practice covers this' },
      { label: 'Construction administration', state: 'have', note: 'Site experience transfers directly' },
      { label: 'Client presentation', state: 'have', note: 'Typical practice covers this' },
      { label: 'Space planning to a program', state: 'partial', note: 'Some architects do this daily; many delegate it' },
      { label: 'FF&E and procurement', state: 'gap', note: 'The commercial half most architects have not run' },
    ],
    faq: [
      { q: 'Can an architect become an interior designer?', a: 'Yes, and it is the most common destination in observed US transition data for people leaving architecture. Posted-skill readiness for a typical architect is 66 percent in our corpus; the gap concentrates in FF&E, procurement, and space planning rather than design skills.' },
      { q: 'How long does the architect to interior designer transition take?', a: 'Our estimate from the skill gap is 9 to 16 months to full readiness, shorter for architects who already run interiors packages. Many make the move inside a firm that does both.' },
      { q: 'Does interior design pay less than architecture?', a: 'The posted bands overlap: 55,000 to 85,000 dollars in our current corpus for interior designer roles, with demand rated high. Senior and workplace-strategy roles exceed that band.' },
    ],
    related: ['architect-to-industrial-designer', 'architect-to-landscape-architect', 'architect-to-mep-engineer'],
  },

  'architect-to-landscape-architect': {
    dest: 'landscape-architect',
    editorial: (
      <>
        <p>
          On paper this is the gentlest move on the list: same drawing sets,
          same consultants, same municipal reviews, a design language you
          already half speak. The catch is that it is a second licensed
          profession, not a specialization of the first. Most states want the
          LARE exam and its documented experience hours, and reciprocity
          between architecture and landscape licensure is thinner than the
          overlap deserves. That makes this a deliberate, credentialed pivot
          dressed up as a lateral one. The technical gap is real but narrow:
          grading, planting, stormwater, and the zoning rhythms of site work.
          The cultural gap is smaller than in any other route here, and the
          observed corroboration is strong; the two professions have traded
          people for decades. If you are early-career, the efficient path is a
          firm that holds both practices under one roof and will count your
          hours toward the second license while you keep earning under the
          first stamp. Ask that question in the interview, specifically.
        </p>
      </>
    ),
    evidence: [
      { label: 'Urban design and site thinking', state: 'have', note: 'Core architecture training covers this' },
      { label: 'Construction documentation', state: 'have', note: 'Same deliverable culture' },
      { label: 'Sustainability frameworks', state: 'have', note: 'Transfers directly' },
      { label: 'Grading, planting, stormwater', state: 'gap', note: 'The technical core of the destination' },
      { label: 'State landscape licensure (LARE)', state: 'gap', note: 'A second license in most states' },
    ],
    faq: [
      { q: 'Can an architect become a landscape architect?', a: 'Yes, and the professions are strongly related in O*NET curated data, but most US states require a separate landscape-architecture license (typically the LARE exam plus experience hours). Posted-skill readiness for architects is 48 percent in our corpus.' },
      { q: 'Do I need a new license to practice landscape architecture?', a: 'In most states, yes. Architecture licensure rarely reciprocates into landscape licensure; check your state board. Unlicensed roles exist inside multidisciplinary firms under a licensed principal.' },
      { q: 'What does landscape architecture pay?', a: 'Posted bands in our current corpus run 60,000 to 95,000 dollars with high demand. Public-sector and infrastructure work anchors the middle of that band.' },
    ],
    related: ['architect-to-civil-engineer', 'architect-to-interior-designer', 'architect-to-structural-engineer'],
  },

  'architect-to-structural-engineer': {
    dest: 'structural-engineer',
    editorial: (
      <>
        <p>
          Architects and structural engineers already share a table, which is
          exactly why this route is misread. Familiarity with structural
          drawings is not the same as producing the calculations behind them,
          and the readiness number on this page is carried by project skills,
          not analysis. The honest core of the gap is mathematical tooling:
          FEA, ETABS or SAP2000, steel and concrete design to code. That is
          teachable, but it is a degree-shaped amount of teaching in most
          markets, and responsible charge requires the PE, a different exam
          track than the ARE you may already hold. The realistic versions of
          this move are two: the long one through a structural master&rsquo;s
          for people who genuinely want the math, and the short one into
          structures-adjacent roles (facade engineering, building envelope,
          forensic assessment) where an architect&rsquo;s documentation
          fluency is the scarce skill and the analysis burden is shared. Most
          people who think they want this route want the second version.
          Decide which one you are before you spend on coursework.
        </p>
      </>
    ),
    evidence: [
      { label: 'Reading structural drawings', state: 'have', note: 'Coordination experience covers this' },
      { label: 'Revit and documentation', state: 'have', note: 'Same toolchain' },
      { label: 'Spec writing', state: 'have', note: 'Transfers directly' },
      { label: 'Structural analysis and FEA', state: 'gap', note: 'The mathematical core; degree-shaped in most markets' },
      { label: 'PE licensure (SE track where required)', state: 'gap', note: 'Required to sign and seal structural work' },
    ],
    faq: [
      { q: 'Can an architect become a structural engineer?', a: 'It is possible but it is the steepest technical route on this page: posted readiness is 52 percent, carried by project skills rather than analysis. Signing structural work requires PE licensure, and many states expect an accredited engineering degree to sit the exam.' },
      { q: 'Is there a shortcut into structural work without the PE?', a: 'Adjacent seats exist: facade and building-envelope engineering, forensic assessment, and BIM-heavy structural coordination all hire architecture backgrounds and share the analysis burden across a licensed team.' },
      { q: 'What do structural engineers earn?', a: 'Posted bands in our corpus run 60,000 to 115,000 dollars with high demand; observed transitions from architecture exist in federal survey data but at a modest rate.' },
    ],
    related: ['architect-to-civil-engineer', 'architect-to-mep-engineer', 'architect-to-mechanical-engineer'],
  },

  'architect-to-civil-engineer': {
    dest: 'civil-engineer',
    editorial: (
      <>
        <p>
          The pull here is usually stability: civil work is public-money work,
          and the backlog of roads, water, and site packages does not care
          about the private construction cycle that whipsaws architecture.
          The transfer is real at the site scale. An architect who has
          shepherded a project through entitlements already understands half
          the civil reviewer&rsquo;s checklist from the other side of the
          counter. The tooling gap is specific and unglamorous: Civil 3D
          rather than Revit, corridors and grading rather than plans and
          sections, and a reporting culture built around agency submittals.
          As with structures, the PE gates responsible charge, and the exam
          assumes engineering coursework. The pragmatic entry is land
          development: site design teams inside civil firms hire people who
          can coordinate architecture, landscape, and utilities on one
          grading plan, and they will tolerate a Civil 3D learning curve for
          someone who can run a consultant table. Aim there, not at bridges.
        </p>
      </>
    ),
    evidence: [
      { label: 'Entitlements and agency review', state: 'have', note: 'Architecture practice covers this from the applicant side' },
      { label: 'AutoCAD fluency', state: 'have', note: 'Direct transfer' },
      { label: 'Consultant coordination', state: 'have', note: 'The scarce skill on site-design teams' },
      { label: 'Civil 3D, grading, corridors', state: 'gap', note: 'The destination toolchain' },
      { label: 'PE licensure', state: 'gap', note: 'Required for responsible charge' },
    ],
    faq: [
      { q: 'Can an architect move into civil engineering?', a: 'The realistic entry is land development and site design, where posted readiness for architects is 47 percent in our corpus and coordination experience is valued. Responsible charge requires the PE, which assumes engineering coursework in most states.' },
      { q: 'What is the biggest skill gap from architecture to civil?', a: 'Tooling and deliverables: Civil 3D, grading and drainage design, and agency submittal culture. The professional skills, entitlements, coordination, documentation, transfer largely intact.' },
      { q: 'What does civil engineering pay?', a: 'Posted bands in our corpus run 60,000 to 100,000 dollars with high demand, anchored by public-sector and infrastructure spending.' },
    ],
    related: ['architect-to-structural-engineer', 'architect-to-landscape-architect', 'architect-to-mep-engineer'],
  },

  'architect-to-electrical-engineer': {
    dest: 'electrical-engineer',
    editorial: (
      <>
        <p>
          This looks like the least likely row on the page, and the observed
          data agrees: architects rarely become electrical engineers. It
          stays on the graph because the posting-skill overlap is real and
          because the version of this move that works is narrower than the
          job title. Architects who have run MEP coordination know building
          electrical systems as a consumer: loads, panels, lighting design,
          code clearances. The working pivot is into building-systems roles,
          lighting design, low-voltage and controls coordination,
          commissioning, where that consumer knowledge plus documentation
          discipline is the actual job, and where the PE is only required at
          the sign-off seat. The version that does not work without going
          back to school is product and power engineering; PLCs and circuit
          design are a different profession. If lighting is the part of
          buildings you already care about most, this route is quietly one of
          the best-paid design-adjacent seats in the industry. Start by
          taking the lighting package on your next project instead of
          delegating it.
        </p>
      </>
    ),
    evidence: [
      { label: 'MEP coordination experience', state: 'have', note: 'Architecture practice covers the consumer side' },
      { label: 'Code and clearance literacy', state: 'have', note: 'Transfers to building-systems work' },
      { label: 'Documentation and spec writing', state: 'have', note: 'Direct transfer' },
      { label: 'Electrical systems design', state: 'gap', note: 'Loads, panels, one-line diagrams' },
      { label: 'PLC / controls engineering', state: 'gap', note: 'A different profession; not needed for lighting/commissioning seats' },
    ],
    faq: [
      { q: 'Can an architect become an electrical engineer?', a: 'Rarely in the full-title sense, and observed transitions are close to zero. The working version is building-systems roles: lighting design, controls coordination, and commissioning, where posted readiness for architects is 53 percent and the PE is only required at sign-off.' },
      { q: 'Do I need a PE for electrical work?', a: 'For utility and public-facing sign-off, yes. Lighting design, low-voltage, and commissioning roles inside building projects typically do not require it; the license sits with the engineer of record.' },
      { q: 'What does the electrical side pay?', a: 'Posted bands in our corpus run 65,000 to 130,000 dollars, the widest of the engineering routes, with the upper half concentrated in controls and power roles.' },
    ],
    related: ['architect-to-mep-engineer', 'architect-to-mechanical-engineer', 'architect-to-structural-engineer'],
  },

  'architect-to-industrial-designer': {
    dest: 'industrial-designer',
    editorial: (
      <>
        <p>
          The strangest number on this page is the honest one: posted-skill
          readiness of 15 percent, and yet industrial design is one of the
          strongest observed destinations for people leaving architecture in
          the federal survey data. The postings ask for Rhino, prototyping,
          mechanical CAD, KeyShot; architecture postings mention almost none
          of it, so the overlap math collapses. The humans move anyway,
          because the underlying craft, form, materials, tolerances,
          iteration under constraint, is the same discipline at a different
          scale, and studios know it. Two things close the gap faster than
          the number suggests. First, many architects already hold Rhino from
          school even though their job postings never said so; the tool gap
          is smaller than the corpus can see. Second, industrial design hires
          on portfolio, not resume, which means the pivot is buildable
          nights-and-weekends: three finished objects, photographed and
          dimensioned like products, outweigh a decade of building sections.
          If your favorite part of architecture was the detail drawing, this
          is your route. Start with one object you can actually fabricate.
        </p>
      </>
    ),
    evidence: [
      { label: 'Form, materials, iteration', state: 'have', note: 'The shared craft; carried by training, invisible to postings' },
      { label: 'Rendering and presentation', state: 'have', note: 'Direct transfer' },
      { label: 'Rhino', state: 'partial', note: 'Many architects hold it from school; postings cannot see it' },
      { label: 'Prototyping and mechanical CAD', state: 'gap', note: 'The destination toolchain' },
      { label: 'Product portfolio', state: 'gap', note: 'The actual hiring gate; buildable independently' },
    ],
    faq: [
      { q: 'Can an architect become an industrial designer?', a: 'Observed US transition data says yes at a strong rate, despite a posted-skill readiness of only 15 percent. The gap is toolchain and portfolio, not design ability, and industrial design hires primarily on portfolio.' },
      { q: 'Why is the skill match so low if people actually make this move?', a: 'Because postings describe tools, not craft. Industrial design postings ask for prototyping, mechanical CAD, and KeyShot, words architecture postings never contain, while the shared design fundamentals do not appear in either posting set.' },
      { q: 'What do industrial designers earn?', a: 'Posted bands in our corpus run 70,000 to 120,000 dollars with moderate demand. Furniture, consumer products, and design-forward hardware firms anchor the range.' },
    ],
    related: ['architect-to-interior-designer', 'architect-to-mechanical-engineer', 'architect-to-landscape-architect'],
  },

  'architect-to-mechanical-engineer': {
    dest: 'mechanical-engineer',
    editorial: (
      <>
        <p>
          There are two mechanical engineerings, and the route only works
          toward one of them. Product and manufacturing mechanical
          engineering, FEA, mechanism design, GD&amp;T, is a separate
          education; observed transitions from architecture are effectively
          zero and the postings&rsquo; skill lists explain why. Building
          mechanical, though, is the HVAC half of the MEP table you have
          coordinated for years, and it behaves like the electrical route:
          your consumer-side knowledge of systems, clearances, and
          coordination is genuinely scarce on the engineering side of the
          table. The pragmatic versions are energy modeling, commissioning,
          and mechanical BIM coordination, seats where Revit MEP fluency plus
          construction literacy beat a junior engineer&rsquo;s coursework,
          and where the PE lives with the engineer of record. If what you
          want is the word &ldquo;engineer&rdquo; on a product team, plan for
          school. If what you want is buildings from the systems side, you
          can be useful in month one. Be precise about which, because the
          two paths share a job title and nothing else.
        </p>
      </>
    ),
    evidence: [
      { label: 'MEP coordination literacy', state: 'have', note: 'The consumer side of building mechanical' },
      { label: 'Revit and BIM', state: 'have', note: 'Direct transfer to mechanical BIM seats' },
      { label: 'Spec writing and submittals', state: 'have', note: 'Same paper culture' },
      { label: 'Mechanical CAD and FEA', state: 'gap', note: 'Product-side toolchain; degree-shaped' },
      { label: 'Energy modeling tools', state: 'partial', note: 'Some architects hold this from sustainability work' },
    ],
    faq: [
      { q: 'Can an architect become a mechanical engineer?', a: 'Toward building mechanical (HVAC, energy, commissioning), realistically yes: posted readiness is 47 percent and the coordination experience transfers. Toward product mechanical engineering, observed transitions are near zero and the path runs through an engineering degree.' },
      { q: 'What mechanical roles hire architecture backgrounds?', a: 'Energy modeling, commissioning, and mechanical BIM coordination. All three value Revit fluency and construction literacy over early-career analysis depth.' },
      { q: 'What does mechanical engineering pay?', a: 'Posted bands in our corpus run 60,000 to 110,000 dollars with high demand; building-side roles cluster mid-band, product-side roles at the top.' },
    ],
    related: ['architect-to-mep-engineer', 'architect-to-electrical-engineer', 'architect-to-industrial-designer'],
  },

  'architect-to-mep-engineer': {
    dest: 'mep-engineer',
    editorial: (
      <>
        <p>
          This is the shortest walk on the page: same buildings, same Revit
          models, same meetings, one seat over. MEP engineering runs on
          exactly the coordination discipline architecture already drilled
          into you, and the destination&rsquo;s posting language, BIM,
          clash detection, documentation, project management, reads like an
          architect&rsquo;s resume with two words changed. What changes is
          allegiance: you stop defending the design against the systems and
          start making the systems defensible. The technical gap is honest
          but bounded, sizing logic, equipment schedules, code paths for
          each trade, and firms teach it, because MEP has been
          under-staffed for a decade and coordination-literate hires are the
          bottleneck. The PE gates sign-off, not employment. The subtle risk
          is career shape, not entry: MEP coordination can become a
          permanent middle seat if you let it. Go in with the intention to
          own a trade (mechanical or electrical) within two years, not to
          remain the person who runs clash reports between them.
        </p>
      </>
    ),
    evidence: [
      { label: 'Revit MEP and BIM coordination', state: 'have', note: 'The destination toolchain, already yours' },
      { label: 'Clash detection workflow', state: 'have', note: 'Direct transfer' },
      { label: 'Construction documentation', state: 'have', note: 'Same deliverables, other side of the table' },
      { label: 'System sizing and schedules', state: 'gap', note: 'The engineering core; firms teach it' },
      { label: 'PE licensure', state: 'partial', note: 'Gates sign-off, not employment' },
    ],
    faq: [
      { q: 'Can an architect move into MEP engineering?', a: 'It is the closest lateral on our graph: posted readiness is 46 percent with the destination toolchain (Revit, BIM, coordination) already in hand. MEP firms have been talent-constrained for years and hire coordination-literate people from architecture.' },
      { q: 'Do I need a PE to work in MEP?', a: 'Not to be hired. The PE gates responsible charge and sign-off; coordination, modeling, and design-development seats operate under the engineer of record.' },
      { q: 'What does MEP work pay?', a: 'Posted bands in our corpus run 65,000 to 115,000 dollars with moderate demand and unusual stability, since systems work spans new construction and retrofit cycles.' },
    ],
    related: ['architect-to-mechanical-engineer', 'architect-to-electrical-engineer', 'architect-to-interior-designer'],
  },
};

export const ROUTE_SLUGS = Object.keys(ROUTES);
