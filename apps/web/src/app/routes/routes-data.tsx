import type { ReactNode } from 'react';
import fs from 'node:fs';
import { getSalary, usBand } from '../salary/salary-data';
import path from 'node:path';

/* Preloaded route pages (docs/05): saved states of the instrument, one per
   pivot. Numbers render at build time from the SAME per-origin payload the
   graph loads at runtime (apps/web/public/data/{origin}.json), so the page
   and the instrument can never disagree. Any origin with confident scrape
   data can carry routes — architecture is just the first batch.
   The editorial block is the judgment layer, drafted for Carlos to rewrite
   in his own voice before launch traffic (docs/05, non-negotiable #2).
   Evidence lists are hand-curated FROM the data: we select which extracted
   skills to surface, we never invent one. This module is server-only (fs);
   it is imported exclusively by server components and the sitemap. */

export type RouteRole = {
  id: string; title: string; field: string; match: number; fit?: number;
  salary: string; demand: string; remote: string; time: string;
  have: string[]; learn: string[]; mobility?: number | null; mobility_source?: string | null;
  kind?: string | null; license?: { req: string; label: string } | null;
};
type KidRow = { t: string; m: number; slug?: string; gap?: string[]; after?: number };
type OriginPayload = {
  originLabel: string; originSlug: string; postings: number; field?: string;
  separations?: { transfer: number; exit: number };
  roles: RouteRole[]; next: Record<string, KidRow[]>;
  direct?: KidRow[];
};

type Evidence = { label: string; state: 'have' | 'partial' | 'gap'; note: string };

export type RouteDef = {
  origin: string;               // origin occupation slug (has a public/data file)
  dest: string;                 // destination slug (must exist in that origin's roles)
  editorial: ReactNode;         // Carlos's judgment layer (draft)
  evidence: Evidence[];         // curated from the extracted skills
  faq: { q: string; a: string }[];
  related: string[];            // sibling route slugs
};

const _cache = new Map<string, OriginPayload | null>();
function getOrigin(slug: string): OriginPayload | null {
  if (_cache.has(slug)) return _cache.get(slug)!;
  let data: OriginPayload | null = null;
  try {
    data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', `${slug}.json`), 'utf8'));
  } catch {
    data = null;
  }
  _cache.set(slug, data);
  return data;
}

// Occupation-level facts for the kid fallback (same numbers the emitter uses).
let _occMeta: Record<string, { title?: string; salary?: string; demand?: string; remote?: string; license?: { req: string; label: string; years?: number } | null }> | null = null;
function occMetaOf(slug: string) {
  if (!_occMeta) {
    try { _occMeta = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'occ-meta.json'), 'utf8')).meta ?? {}; }
    catch { _occMeta = {}; }
  }
  return _occMeta![slug];
}
// Mirror of the emitter's timeEstimate — keep the buckets in sync with emit.js.
function timeEstimate(match: number, license?: { req: string; years?: number } | null): string {
  const base = match >= 85 ? '3–8 mo' : match >= 70 ? '6–12 mo' : match >= 60 ? '9–16 mo' : '12–24 mo';
  if (license?.req !== 'required') return base;
  if (license.years) return `${license.years}+ yr incl. license`;
  return `${base} + license`;
}

export function destRole(originSlug: string, destSlug: string): RouteRole | undefined {
  const o = getOrigin(originSlug);
  const ring1 = o?.roles.find((r) => r.id === destSlug);
  if (ring1) return ring1;
  // Fallback: the destination fell out of ring-1 on a re-emit but is still
  // measured as a kid row. Synthesize the display fields from the kid's own
  // numbers plus occupation-level facts, so curated routes (hand editorial)
  // keep rendering honestly instead of 404ing when the top-8 reshuffles.
  const kids = o ? [...Object.values(o.next ?? {}), o.direct ?? []].flat() : [];
  const kid = kids.find((k) => k.slug === destSlug);
  if (!kid || typeof kid.m !== 'number') return undefined;
  // occ-meta covers the profiled set; below that floor, pull the salary band
  // from the salary surface and state the rest honestly.
  const meta = occMetaOf(destSlug);
  let salary = meta?.salary;
  if (!salary) {
    try {
      const sf = getSalary(destSlug);
      const band = sf && usBand(sf);
      if (band) salary = `$${Math.round(band.p25 / 1000)}k–$${Math.round(band.p75 / 1000)}k`;
    } catch { /* no salary surface */ }
  }
  return {
    id: destSlug,
    title: kid.t ?? meta?.title ?? destSlug,
    match: kid.m,
    salary: salary ?? 'n/a',
    demand: meta?.demand ?? 'n/a',
    remote: meta?.remote,
    time: timeEstimate(kid.m, meta?.license),
    license: meta?.license ?? null,
    learn: kid.gap,
  } as RouteRole;
}
export function unlocks(originSlug: string, destSlug: string): { t: string; m: number; after?: number }[] {
  return getOrigin(originSlug)?.next[destSlug] ?? [];
}
export function originMeta(slug: string): { slug: string; title: string; postings: number; field?: string; separations?: { transfer: number; exit: number } } {
  const o = getOrigin(slug);
  return { slug, title: o?.originLabel ?? slug, postings: o?.postings ?? 0, field: o?.field, separations: o?.separations };
}

export const ROUTES: Record<string, RouteDef> = {
  'architect-to-interior-designer': {
    origin: 'architect',
    dest: 'interior-designer',
    editorial: (
      <>
        <p>This is the single most common exit from architecture in the federal transition data, and it is not close. It is also the move architects underrate most, because it looks like a demotion in scale: rooms instead of buildings.</p>
        <p>What actually changes is the client relationship. Interior work bills faster, revises faster, and puts you nearer the decisions that get built. The readiness gap is not design ability; it is the commercial half of the job. <a className="gl" href="/glossary#ffe">FF&amp;E</a> (furniture, fixtures, and equipment) schedules, procurement, vendor relationships, and the discipline of space planning to a program are their own trade with their own rhythm, and postings ask for them by name.</p>
        <p>An architect who has run construction administration already has the hard part: keeping a project honest between drawing and site. <strong>Concrete first step:</strong> take one interiors-heavy project at your current firm, own the FF&amp;E package end to end, and put it at the top of the portfolio. That single package answers the question every interiors studio will ask.</p>
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
    origin: 'architect',
    dest: 'landscape-architect',
    editorial: (
      <>
        <p>On paper this is the gentlest move on the list: same drawing sets, same consultants, same municipal reviews, a design language you already half speak. The catch is that it is a second licensed profession, not a specialization of the first. Most states want the <a className="gl" href="/glossary#lare">LARE</a> (the Landscape Architect Registration Examination) and its documented experience hours, and reciprocity between architecture and landscape licensure is thinner than the overlap deserves. That makes this a deliberate, credentialed pivot dressed up as a lateral one.</p>
        <p>The technical gap is real but narrow: grading, planting, stormwater, and the zoning rhythms of site work. The cultural gap is smaller than in any other route here, and the observed corroboration is strong; the two professions have traded people for decades.</p>
        <p>If you are early-career, the efficient path is a firm that holds both practices under one roof and will count your hours toward the second license while you keep earning under the first stamp. Ask that question in the interview, specifically.</p>
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
    origin: 'architect',
    dest: 'structural-engineer',
    editorial: (
      <>
        <p>Architects and <strong>structural engineers</strong> already share a table, which is exactly why this route is misread. Familiarity with structural drawings is not the same as producing the calculations behind them, and the readiness number on this page is carried by project skills, not analysis.</p>
        <p>The honest core of the gap is mathematical tooling: <a className="gl" href="/glossary#fea">FEA</a> (finite element analysis), ETABS or SAP2000, steel and concrete design to code. That is teachable, but it is a degree-shaped amount of teaching in most markets, and responsible charge requires the <a className="gl" href="/glossary#pe-license">PE</a> (the professional-engineer license), a different exam track than the <a className="gl" href="/glossary#are-exam">ARE</a> (the Architect Registration Examination) you may already hold.</p>
        <p>The realistic versions of this move are two: the long one through a structural master&rsquo;s for people who genuinely want the math, and the short one into structures-adjacent roles (facade engineering, building envelope, forensic assessment) where an architect&rsquo;s documentation fluency is the scarce skill and the analysis burden is shared. Most people who think they want this route want the second version. Decide which one you are before you spend on coursework.</p>
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
    origin: 'architect',
    dest: 'civil-engineer',
    editorial: (
      <>
        <p>The pull here is usually stability: civil work is public-money work, and the backlog of roads, water, and site packages does not care about the private construction cycle that whipsaws architecture.</p>
        <p>The transfer is real at the site scale. An architect who has shepherded a project through entitlements already understands half the civil reviewer&rsquo;s checklist from the other side of the counter. The tooling gap is specific and unglamorous: Civil 3D rather than Revit, corridors and grading rather than plans and sections, and a reporting culture built around agency submittals. As with structures, the <a className="gl" href="/glossary#pe-license">PE</a> (the professional-engineer license) gates responsible charge, and the exam assumes engineering coursework.</p>
        <p>The pragmatic entry is <strong>land development</strong>: site design teams inside civil firms hire people who can coordinate architecture, landscape, and utilities on one grading plan, and they will tolerate a Civil 3D learning curve for someone who can run a consultant table. Aim there, not at bridges.</p>
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
    origin: 'architect',
    dest: 'electrical-engineer',
    editorial: (
      <>
        <p>This looks like the least likely row on the page, and the observed data agrees: architects rarely become <strong>electrical engineers</strong>. It stays on the graph because the posting-skill overlap is real and because the version of this move that works is narrower than the job title.</p>
        <p>Architects who have run <a className="gl" href="/glossary#mep">MEP</a> (mechanical, electrical, and plumbing) coordination know building electrical systems as a consumer: loads, panels, lighting design, code clearances. The working pivot is into building-systems roles, lighting design, low-voltage and controls coordination, commissioning, where that consumer knowledge plus documentation discipline is the actual job, and where the <a className="gl" href="/glossary#pe-license">PE</a> (the professional-engineer license) is only required at the sign-off seat.</p>
        <p>The version that does not work without going back to school is product and power engineering; <a className="gl" href="/glossary#plc">PLCs</a> (programmable logic controllers) and circuit design are a different profession. If lighting is the part of buildings you already care about most, this route is quietly one of the best-paid design-adjacent seats in the industry. Start by taking the lighting package on your next project instead of delegating it.</p>
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
    origin: 'architect',
    dest: 'industrial-designer',
    editorial: (
      <>
        <p>The strangest number on this page is the honest one: posted-skill readiness of 15 percent, and yet <strong>industrial design</strong> is one of the strongest observed destinations for people leaving architecture in the federal survey data. The postings ask for Rhino, prototyping, mechanical CAD, KeyShot; architecture postings mention almost none of it, so the overlap math collapses. The humans move anyway, because the underlying craft, form, materials, tolerances, iteration under constraint, is the same discipline at a different scale, and studios know it.</p>
        <p>Two things close the gap faster than the number suggests. First, many architects already hold Rhino from school even though their job postings never said so; the tool gap is smaller than the corpus can see. Second, industrial design hires on portfolio, not resume, which means the pivot is buildable nights-and-weekends: three finished objects, photographed and dimensioned like products, outweigh a decade of building sections.</p>
        <p>If your favorite part of architecture was the detail drawing, this is your route. Start with one object you can actually fabricate.</p>
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
    origin: 'architect',
    dest: 'mechanical-engineer',
    editorial: (
      <>
        <p>There are two mechanical engineerings, and the route only works toward one of them. Product and manufacturing mechanical engineering, <a className="gl" href="/glossary#fea">FEA</a> (finite element analysis), mechanism design, <a className="gl" href="/glossary#gdt">GD&amp;T</a> (geometric dimensioning and tolerancing), is a separate education; observed transitions from architecture are effectively zero and the postings&rsquo; skill lists explain why.</p>
        <p><strong>Building mechanical</strong>, though, is the <a className="gl" href="/glossary#hvac">HVAC</a> (heating, ventilation, and air conditioning) half of the <a className="gl" href="/glossary#mep">MEP</a> (mechanical, electrical, and plumbing) table you have coordinated for years, and it behaves like the electrical route: your consumer-side knowledge of systems, clearances, and coordination is genuinely scarce on the engineering side of the table. The pragmatic versions are energy modeling, commissioning, and mechanical <a className="gl" href="/glossary#bim">BIM</a> (building information modeling) coordination, seats where Revit MEP fluency plus construction literacy beat a junior engineer&rsquo;s coursework, and where the <a className="gl" href="/glossary#pe-license">PE</a> (the professional-engineer license) lives with the engineer of record.</p>
        <p>If what you want is the word &ldquo;engineer&rdquo; on a product team, plan for school. If what you want is buildings from the systems side, you can be useful in month one. Be precise about which, because the two paths share a job title and nothing else.</p>
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
    origin: 'architect',
    dest: 'mep-engineer',
    editorial: (
      <>
        <p>This is the shortest walk on the page: same buildings, same Revit models, same meetings, one seat over. <a className="gl" href="/glossary#mep">MEP</a> (mechanical, electrical, and plumbing) engineering runs on exactly the coordination discipline architecture already drilled into you, and the destination&rsquo;s posting language, <a className="gl" href="/glossary#bim">BIM</a> (building information modeling), clash detection, documentation, project management, reads like an architect&rsquo;s resume with two words changed. What changes is <strong>allegiance</strong>: you stop defending the design against the systems and start making the systems defensible.</p>
        <p>The technical gap is honest but bounded, sizing logic, equipment schedules, code paths for each trade, and firms teach it, because MEP has been under-staffed for a decade and coordination-literate hires are the bottleneck. The <a className="gl" href="/glossary#pe-license">PE</a> (the professional-engineer license) gates sign-off, not employment.</p>
        <p>The subtle risk is career shape, not entry: MEP coordination can become a permanent middle seat if you let it. Go in with the intention to own a trade (mechanical or electrical) within two years, not to remain the person who runs clash reports between them.</p>
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
  'graphic-designer-to-ux-designer': {
    origin: 'graphic-designer',
    dest: 'ux-designer',
    editorial: (
      <>
        <p>The readiness number on this page is the most misleading number in the set, and worth explaining before you believe it. <a className="gl" href="/glossary#ux">UX</a> (user-experience design) postings ask for a stack of words, user research, interaction design, design systems, that graphic-design postings simply do not print, so the overlap math reads low. But look at what the corpus already credits graphic designers with: Figma, prototyping, wireframing, accessibility. The tools are mostly shared. What is not shared is a way of working. Graphic design defends a final artifact; UX defends a decision, and has to show the research and the failed variants that led there.</p>
        <p>The gap most graphic designers underestimate is not skill, it is <strong>evidence</strong>: a portfolio of beautiful screens reads as graphic design no matter how it is labeled. The move is won or lost on one case study that shows a problem, the research, three rejected directions, and a measured outcome.</p>
        <p>The pay makes the work worth it, UX medians run tens of thousands above graphic design, and <a className="gl" href="/glossary#bls">BLS</a> (the US Bureau of Labor Statistics) projects the two fields moving in opposite directions. <strong>Concrete first step:</strong> take one project you already shipped and rewrite it as a process story, not a gallery.</p>
      </>
    ),
    evidence: [
      { label: 'Figma and prototyping', state: 'have', note: 'The corpus already credits graphic designers with these' },
      { label: 'Wireframing', state: 'have', note: 'Transfers directly' },
      { label: 'Visual and accessibility fundamentals', state: 'have', note: 'Often stronger than junior UX hires' },
      { label: 'User research and testing', state: 'gap', note: 'The half UX hires on; rarely in graphic practice' },
      { label: 'Design systems and interaction patterns', state: 'partial', note: 'Some digital designers have this; many do not' },
    ],
    faq: [
      { q: 'Can a graphic designer become a UX designer?', a: 'It is one of the most common creative pivots, and the tools overlap more than the posted-skill match suggests. The posted-skill readiness reads low because UX postings demand research and systems vocabulary that graphic-design postings omit, not because the work is unrelated. The real gap is user research and process evidence.' },
      { q: 'Does UX design pay more than graphic design?', a: 'Substantially. UX roles in our current corpus post a 70,000 to 150,000 dollar band against far lower graphic-design medians, and BLS projects web and digital interface design growing while graphic design is roughly flat.' },
      { q: 'What is the biggest obstacle switching from graphic to UX design?', a: 'The portfolio, not the software. A book of polished visuals reads as graphic design; UX hiring wants to see a problem, the research, discarded directions, and an outcome. One genuine case study outweighs ten finished comps.' },
      { q: 'How long does the graphic designer to UX transition take?', a: 'Our skill-gap estimate is 12 to 24 months to full readiness, shorter for designers already working in digital product who hold Figma and prototyping day to day.' },
    ],
    related: ['architect-to-industrial-designer', 'architect-to-interior-designer', 'marketing-manager-to-product-manager'],
  },

  'teacher-to-instructional-designer': {
    origin: 'teacher',
    dest: 'instructional-designer',
    editorial: (
      <>
        <p>This is the exit teachers search for most, and the readiness number badly undersells it, because a classroom teacher already does the core of the job under a different name. Curriculum development, facilitation, assessment design, differentiating for an audience that is not following: that is <strong>instructional design</strong> with children in the room.</p>
        <p>What the corpus cannot see is that the skill is there; what it correctly sees is that the tooling and the vocabulary are not. Instructional design runs on authoring software (Storyline, Captivate, Rise), an <a className="gl" href="/glossary#lms">LMS</a> (learning management system), and a shared language of <a className="gl" href="/glossary#addie">ADDIE</a> (analysis, design, development, implementation, evaluation), learning objectives, and stakeholder sign-off that corporate hiring managers screen for by keyword. The other quiet advantage is on this page: 11 percent of instructional-design postings in our corpus are fully remote, unusually high, against a classroom that is remote essentially never.</p>
        <p>The move is real but it is not free, you are trading a credential you already hold for a portfolio you do not yet have. <strong>Concrete first step:</strong> rebuild one unit you have taught a hundred times as a self-paced e-learning module in a free trial of an authoring tool, and let that be the whole interview.</p>
      </>
    ),
    evidence: [
      { label: 'Curriculum and lesson design', state: 'have', note: 'The core of instructional design, under another name' },
      { label: 'Facilitation and training', state: 'have', note: 'Transfers directly to corporate learning' },
      { label: 'Assessment design', state: 'have', note: 'Learning-objective thinking is already yours' },
      { label: 'Authoring tools (Storyline, Captivate, Rise)', state: 'gap', note: 'The keyword screen most teachers fail first' },
      { label: 'LMS and corporate ADDIE vocabulary', state: 'gap', note: 'Same craft, different dialect' },
    ],
    faq: [
      { q: 'Can a teacher become an instructional designer?', a: 'It is the most-searched exit from teaching and a well-worn one. The pedagogical skill transfers almost entirely; our corpus reads only 12 percent posted-skill readiness because instructional-design postings screen for authoring tools and corporate learning vocabulary that classroom postings never mention.' },
      { q: 'Do instructional designers earn more than teachers?', a: 'Usually. Instructional-design roles in our corpus post a 55,000 to 105,000 dollar band; entry-level corporate roles commonly start above the national teacher average and rise past six figures with experience.' },
      { q: 'Is instructional design a remote job?', a: 'More often than most fields: 11 percent of the instructional-design postings in our corpus are fully remote, against near-zero for classroom teaching. It is one of the few adjacent moves that also buys location flexibility.' },
      { q: 'What do teachers need to learn to become instructional designers?', a: 'Not the pedagogy, which they have. The gaps are e-learning authoring tools (Articulate Storyline, Adobe Captivate, Rise), LMS familiarity, and the ADDIE framework vocabulary that corporate hiring screens for. One self-built e-learning sample usually clears all three.' },
    ],
    related: ['business-analyst-to-project-manager', 'marketing-manager-to-product-manager', 'graphic-designer-to-ux-designer'],
  },

  'registered-nurse-to-nurse-practitioner': {
    origin: 'registered-nurse',
    dest: 'nurse-practitioner',
    editorial: (
      <>
        <p>This is the highest-readiness route we publish, 78 percent, and the observed data agrees emphatically: it is the single most common destination for registered nurses who move, and the flow score pins at 100. Everything about the clinical skill transfers, because it is the same profession one credential up.</p>
        <p>So read the readiness number carefully, because it measures skills, not <strong>the wall</strong>. The wall is a graduate degree, an <a className="gl" href="/glossary#msn-dnp">MSN</a> (a Master of Science in Nursing) or increasingly a DNP (Doctor of Nursing Practice), plus a national certification and a state <a className="gl" href="/glossary#aprn">APRN</a> (advanced practice registered nurse) license, and that is typically two to four years of school layered on top of the bedside job, not the six-to-twelve-month skill-closing estimate this page shows. Those two numbers answer different questions. The skills say you are ready; the credential says you are not yet allowed. That is not a discouragement, it is the whole planning problem: this is a school decision and a specialty decision more than a skills decision.</p>
        <p>The nurses who navigate it well pick the population focus, family, acute care, psychiatric, before they enroll, because switching tracks mid-program is expensive. <strong>Concrete first step:</strong> shadow a nurse practitioner in the specialty you think you want for a week before you apply anywhere.</p>
      </>
    ),
    evidence: [
      { label: 'Direct patient care', state: 'have', note: 'The same clinical foundation, one level up' },
      { label: 'Clinical assessment skills', state: 'have', note: 'Transfers directly into advanced practice' },
      { label: 'Health education and counseling', state: 'have', note: 'Core to both roles' },
      { label: 'Graduate degree (MSN or DNP)', state: 'gap', note: 'The real timeline: 2 to 4 years, not months' },
      { label: 'APRN license and national certification', state: 'gap', note: 'The legal gate advanced practice requires' },
    ],
    faq: [
      { q: 'Can a registered nurse become a nurse practitioner?', a: 'It is the most common move nurses make, with a posted-skill readiness of 78 percent, the highest route we publish, and an observed-flow score of 100. The clinical skills transfer almost entirely; the barrier is credential, not competence.' },
      { q: 'How long does it take to go from RN to nurse practitioner?', a: 'Plan for two to four years, not the six-to-twelve-month skill-readiness estimate on this page. Those numbers measure different things: skills are close, but an MSN or DNP plus national certification and an APRN license is a multi-year credential added on top.' },
      { q: 'Do nurse practitioners earn more than registered nurses?', a: 'Meaningfully. NP roles in our corpus post a wide band topping out around 125,000 dollars, above the registered-nurse median, and the gap widens in high-demand specialties and underserved regions.' },
      { q: 'What should a nurse decide before applying to NP school?', a: 'The population focus. Family, acute care, psychiatric-mental-health, and neonatal are separate certification tracks, and switching mid-program is costly. Shadowing an NP in your target specialty before enrolling is the cheapest de-risking available.' },
    ],
    related: ['accountant-to-financial-analyst', 'paralegal-to-lawyer', 'teacher-to-instructional-designer'],
  },

  'accountant-to-financial-analyst': {
    origin: 'accountant',
    dest: 'financial-analyst',
    editorial: (
      <>
        <p>Accountants and <strong>financial analysts</strong> share a spreadsheet and disagree about which direction time runs. Accounting is the record of what happened, closed, reconciled, compliant. Analysis is the argument about what happens next, forecasts, variance, the model behind a budget request.</p>
        <p>The readiness number reflects that the raw financial fluency transfers, forecasting, modeling, and budgeting are already in the accountant&rsquo;s HAVE list, while the forward-looking framing and the presentation layer are not. The real gap is rarely technical. It is that analysts have to sell a conclusion to people who will not read the workbook, so data visualization and the one-slide narrative matter more than another reconciliation ever did.</p>
        <p>For securities-facing roles a <a className="gl" href="/glossary#finra">FINRA</a> (the Financial Industry Regulatory Authority) license enters the picture, and the <a className="gl" href="/glossary#cfa">CFA</a> (the Chartered Financial Analyst credential) is common though not required for corporate <a className="gl" href="/glossary#fpa">FP&amp;A</a> (financial planning and analysis), which is the usual landing spot. The pay premium is real but modest at the entry, around a fifth more per external benchmarks, and widens with the CFA. <strong>Concrete first step:</strong> take last quarter&rsquo;s actuals from your own employer, build a variance-and-forecast model on top, and turn it into a single slide a non-finance manager would act on.</p>
      </>
    ),
    evidence: [
      { label: 'Financial modeling', state: 'have', note: 'Already in the accountant skill set' },
      { label: 'Forecasting and budgeting', state: 'have', note: 'Transfers directly to FP&A' },
      { label: 'Financial-statement fluency', state: 'have', note: 'A genuine edge over non-accounting analysts' },
      { label: 'Data visualization and narrative', state: 'gap', note: 'Analysts sell conclusions, not workbooks' },
      { label: 'CFA or FINRA (role-dependent)', state: 'partial', note: 'Common for CFA, required only for securities roles' },
    ],
    faq: [
      { q: 'Is it hard to switch from accountant to financial analyst?', a: 'It is one of the more natural finance pivots: posted-skill readiness is 43 percent and the core financial fluency, modeling, forecasting, and budgeting, transfers directly. The adjustment is mindset, from recording the past to forecasting the future, plus a stronger presentation layer.' },
      { q: 'Do financial analysts make more than accountants?', a: 'Modestly at entry and more with credentials. External benchmarks put financial-analyst medians roughly 20 percent above accountants; our corpus shows overlapping bands with the analyst side rising faster into FP&A and corporate strategy.' },
      { q: 'Do I need a CFA to become a financial analyst?', a: 'Not for most corporate FP&A roles, which is the common landing spot for accountants. The CFA helps and widens the pay gap; FINRA licensing is required only for securities-facing positions.' },
      { q: 'What is the key difference between accounting and financial analysis?', a: 'Direction. Accounting reports what already happened and ensures compliance; analysis forecasts what should happen next and argues for decisions. The same numbers, used to look forward instead of back.' },
    ],
    related: ['business-analyst-to-project-manager', 'data-analyst-to-data-engineer', 'marketing-manager-to-product-manager'],
  },

  'software-engineer-to-solutions-architect': {
    origin: 'software-engineer',
    dest: 'solutions-architect',
    editorial: (
      <>
        <p>This is the cleanest senior move a software engineer can make on our graph, and the observed data confirms engineers actually walk it. The cloud fluency is already there, AWS, Azure, Python sit in the HAVE list, so the role is less a retraining than a change in altitude. A software engineer is measured by the code they ship; a <strong>solutions architect</strong> is measured by the systems they let other people ship, and by whether the business bought the design. That shift is where the real work is.</p>
        <p>The gap is not technical depth, engineers usually have too much of it, it is breadth and translation: sketching a system across services you will never personally write, sizing tradeoffs for a budget conversation, and explaining the whole thing to a room that cannot read a stack trace. Pre-sales and stakeholder framing feel foreign to a lot of strong engineers, and they are exactly the differentiator.</p>
        <p>The pay band, 95,000 to 160,000 in our corpus, reflects the seniority. <strong>Concrete first step:</strong> volunteer to own the design document for the next cross-team system, then present it to the least technical stakeholder you can find and rewrite whatever they did not follow.</p>
      </>
    ),
    evidence: [
      { label: 'Cloud platforms (AWS, Azure)', state: 'have', note: 'Already in the engineer skill set' },
      { label: 'System implementation depth', state: 'have', note: 'Usually more than the role needs' },
      { label: 'Programming fluency', state: 'have', note: 'Transfers as credibility with build teams' },
      { label: 'Multi-system breadth and tradeoff sizing', state: 'partial', note: 'The altitude change most engineers must practice' },
      { label: 'Stakeholder translation and pre-sales', state: 'gap', note: 'The differentiator strong engineers most often lack' },
    ],
    faq: [
      { q: 'How do you go from software engineer to solutions architect?', a: 'It is a natural senior step: posted-skill readiness is 60 percent and the cloud and implementation skills transfer directly. The move is mostly about breadth and communication, designing across systems you will not build and selling that design to non-engineers.' },
      { q: 'What is the difference between a software engineer and a solutions architect?', a: 'An engineer is measured by the code they ship; an architect by the systems they enable others to ship and by whether the business accepted the design. Depth versus breadth, and building versus translating.' },
      { q: 'Does solutions architecture pay more than software engineering?', a: 'Generally yes at the senior level. Solutions-architect roles in our corpus post a 95,000 to 160,000 dollar band, reflecting the seniority and the stakeholder-facing scope.' },
      { q: 'What skill do engineers most need to become architects?', a: 'Translation. Sizing tradeoffs for a budget conversation and explaining a system to non-technical stakeholders is the differentiator; raw technical depth is usually already present in surplus.' },
    ],
    related: ['data-scientist-to-machine-learning-engineer', 'data-analyst-to-data-engineer', 'business-analyst-to-project-manager'],
  },

  'data-scientist-to-machine-learning-engineer': {
    origin: 'data-scientist',
    dest: 'machine-learning-engineer',
    editorial: (
      <>
        <p>These two roles are close enough, with matching readiness and observed-flow scores, that companies routinely blur them, which is exactly why the distinction is worth naming before you pivot. A data scientist proves a model works. A <strong>machine-learning engineer</strong> makes it run at three in the morning without waking anyone.</p>
        <p>The modeling half transfers wholesale, machine learning, deep learning, <a className="gl" href="/glossary#llm">LLMs</a> (large language models), and Python are all in the HAVE list, so nobody doubts you understand the model. What the corpus flags as missing is the production stack: <a className="gl" href="/glossary#mlops">MLOps</a> (machine-learning operations), serving, monitoring, the discipline of turning a notebook into a service with tests and rollback. That is real software engineering, and it is the part a lot of data scientists have avoided precisely because it is not modeling.</p>
        <p>The LLM wave has widened the seat, <a className="gl" href="/glossary#rag">RAG</a> (retrieval-augmented generation), vector search, and fine-tuning now sit inside the job, and demand is concentrated there. The pay band tops out around 165,000 in our corpus, slightly above the pure data-science band, and the gap is the engineering. <strong>Concrete first step:</strong> take one model you have already trained and stand it up as a monitored endpoint with a test suite, then treat everything that broke as your syllabus.</p>
      </>
    ),
    evidence: [
      { label: 'Machine learning and deep learning', state: 'have', note: 'The modeling half transfers wholesale' },
      { label: 'LLMs and generative AI', state: 'have', note: 'Already central to both roles' },
      { label: 'Python', state: 'have', note: 'Shared foundation' },
      { label: 'MLOps and model serving', state: 'gap', note: 'The production engineering data science often skips' },
      { label: 'Monitoring, testing, deployment', state: 'gap', note: 'Turning a notebook into a reliable service' },
    ],
    faq: [
      { q: 'What is the difference between a data scientist and a machine learning engineer?', a: 'A data scientist proves a model works; a machine-learning engineer makes it run reliably in production. The modeling overlap is heavy in our corpus, but the engineer owns serving, monitoring, and deployment.' },
      { q: 'Can a data scientist become a machine learning engineer?', a: 'Commonly, and the observed transition data supports it. The modeling skills transfer directly; the work is closing the production-engineering gap, MLOps, testing, and deployment, which is real software engineering rather than more modeling.' },
      { q: 'Does an ML engineer earn more than a data scientist?', a: 'Slightly, on our numbers: ML-engineer roles post up to about 165,000 dollars, a touch above the data-science band, with the premium concentrated in production and LLM-serving skills.' },
      { q: 'What should a data scientist learn to become an ML engineer?', a: 'The production stack: MLOps tooling, model serving, monitoring, and the testing and rollback discipline of shipping software. Standing up one trained model as a monitored endpoint surfaces the whole syllabus.' },
    ],
    related: ['data-analyst-to-data-engineer', 'software-engineer-to-solutions-architect', 'marketing-manager-to-product-manager'],
  },

  'marketing-manager-to-product-manager': {
    origin: 'marketing-manager',
    dest: 'product-manager',
    editorial: (
      <>
        <p>The readiness number here hides one of the most reliable pivots in tech, and the observed-flow score of 41 is the tell: marketers become <strong>product managers</strong> constantly, whatever the skill math says. The reason the match reads low is that product-manager postings are written in an engineering-adjacent dialect, APIs, agile, observability, that marketing postings do not use, even though a good marketing manager already runs experiments, reads funnels, and owns a number. A/B testing and data analysis are in the HAVE list for a reason.</p>
        <p>What a marketer genuinely lacks is technical fluency with the build side: enough understanding of how the thing is made to write a spec engineers respect and to say no to scope with a real reason. Product management is customer empathy plus prioritization plus technical credibility, and marketers arrive with the first two and have to earn the third.</p>
        <p>The pay ceiling is high, up to 175,000 in our corpus, and remote availability is unusually good at 15 percent. <strong>Concrete first step:</strong> attach yourself to one feature end to end, write its spec, sit in the standups, and ship it, so your resume has a product shipped rather than a campaign run.</p>
      </>
    ),
    evidence: [
      { label: 'A/B testing and experimentation', state: 'have', note: 'Already core to marketing management' },
      { label: 'Data analysis and funnels', state: 'have', note: 'Transfers directly to product metrics' },
      { label: 'Customer empathy and positioning', state: 'have', note: 'The half product hiring values most from marketers' },
      { label: 'Technical fluency (APIs, the build side)', state: 'gap', note: 'Enough to write a spec engineers respect' },
      { label: 'Agile and roadmap ownership', state: 'partial', note: 'Some marketers run this; many have not owned delivery' },
    ],
    faq: [
      { q: 'Can a marketing manager become a product manager?', a: 'It is a well-worn pivot, and the observed transition data backs it despite a modest 19 percent posted-skill match. Marketers arrive with customer empathy, experimentation, and metrics; the gap is technical fluency and roadmap ownership, not instinct.' },
      { q: 'Why is the skill match low if marketers become PMs so often?', a: 'Because product-manager postings use an engineering-adjacent vocabulary, APIs, agile, observability, that marketing postings omit. The underlying work, running experiments and owning a number, overlaps far more than the keywords suggest.' },
      { q: 'Does product management pay more than marketing management?', a: 'It can, at the top: product-manager roles in our corpus reach 175,000 dollars, and 15 percent are fully remote, both toward the higher end of what marketing management posts.' },
      { q: 'What does a marketer need to learn to become a PM?', a: 'Enough technical fluency to write a spec engineers respect and to justify saying no to scope, plus formal roadmap and delivery ownership. Shipping one feature end to end with an engineering team is the fastest proof.' },
    ],
    related: ['business-analyst-to-project-manager', 'graphic-designer-to-ux-designer', 'data-analyst-to-data-engineer'],
  },

  'paralegal-to-lawyer': {
    origin: 'paralegal',
    dest: 'lawyer',
    editorial: (
      <>
        <p>This is the search everyone types and the move almost nobody makes directly, and the honest version of this page has to say why. The readiness number looks encouraging, and the substantive knowledge is genuinely there, paralegals live in contracts, compliance, and negotiation, but readiness measures skills and the barrier here is a credential that skills cannot shortcut. Becoming a lawyer means law school and bar admission, three years and an exam, and no amount of paralegal experience reduces the legal requirement by a day.</p>
        <p>Paralegals also have the clearest possible view of what the job actually is, which is why many who consider it choose one of the adjacent seats instead: compliance officer, contract manager, and legal operations all reward the exact knowledge a paralegal already holds and none of them require the bar. So the real decision is <strong>binary</strong>, and worth being honest with yourself about. If you want to practice law, the paralegal years are excellent preparation and zero shortcut, budget the JD (the three-year law degree). If you want the pay and the seniority without the courtroom, the compliance route is adjacent, uncredentialed, and faster.</p>
        <p><strong>Concrete first step:</strong> sit in on the work of both a junior associate and a compliance officer before you spend a dollar on the LSAT (the law-school admission test).</p>
      </>
    ),
    evidence: [
      { label: 'Contract and compliance knowledge', state: 'have', note: 'Genuine substantive legal grounding' },
      { label: 'Negotiation and documentation', state: 'have', note: 'Transfers to practice and to legal ops' },
      { label: 'Case and matter management', state: 'have', note: 'A real edge entering law school or compliance' },
      { label: 'Juris Doctor (law degree)', state: 'gap', note: 'Three years; no paralegal shortcut exists' },
      { label: 'Bar admission', state: 'gap', note: 'The legal gate to practice, jurisdiction by jurisdiction' },
    ],
    faq: [
      { q: 'Can a paralegal become a lawyer?', a: 'Yes, but only through the same door as anyone else: law school and bar admission. Paralegal experience is strong preparation and legally shortens nothing. The readiness number reflects real substantive knowledge, but the barrier is a credential, not a skill gap.' },
      { q: 'Is it worth going from paralegal to lawyer?', a: 'It depends on whether you want to practice. If yes, the paralegal background is excellent preparation for a JD. If you mainly want higher pay and seniority, adjacent roles, compliance officer, contract manager, legal operations, reward the same knowledge without the bar.' },
      { q: 'What can a paralegal do without going to law school?', a: 'Move sideways into compliance, contract management, or legal operations. All three value a paralegal&rsquo;s substantive knowledge, pay above many paralegal roles, and require no bar admission.' },
      { q: 'How long does it take to become a lawyer from paralegal?', a: 'The credential path is the binding constraint: roughly three years of law school plus bar preparation and admission. The skill-readiness estimate on this page does not include that, because skills are not what the gate measures.' },
    ],
    related: ['registered-nurse-to-nurse-practitioner', 'accountant-to-financial-analyst', 'teacher-to-instructional-designer'],
  },

  'data-analyst-to-data-engineer': {
    origin: 'data-analyst',
    dest: 'data-engineer',
    editorial: (
      <>
        <p>Of every route in this batch, this one has the strongest human signal: an observed-flow score of 100, meaning <strong>data engineer</strong> is the single most common place data analysts actually go. The readiness number understates a move the market clearly rewards. Analysts already hold the load-bearing skills, <a className="gl" href="/glossary#sql">SQL</a> (Structured Query Language), Python, and <a className="gl" href="/glossary#etl">ETL</a> (extract, transform, load) are all in the HAVE list, so the pivot is less a new profession than a change in what you are responsible for.</p>
        <p>An analyst queries the data and answers the question. An engineer builds and owns the pipes that deliver the data reliably, on schedule, at scale, so that a hundred analysts can answer their questions without noticing the plumbing. The gap is orchestration and infrastructure: dbt, Airflow, warehouse modeling, and the on-call mindset that comes with owning a pipeline other people depend on. That last part is the real adjustment, analysts ship insights, engineers ship systems that must not break.</p>
        <p>The pay rewards it, 75,000 to 130,000 in our corpus, above the typical analyst band. <strong>Concrete first step:</strong> take one report you currently refresh by hand and rebuild it as an automated pipeline with dbt and a scheduler, then keep it running for a month and fix whatever fails.</p>
      </>
    ),
    evidence: [
      { label: 'SQL and Python', state: 'have', note: 'The load-bearing data-engineering skills' },
      { label: 'ETL fundamentals', state: 'have', note: 'Already in the analyst skill set' },
      { label: 'Data modeling instincts', state: 'partial', note: 'Analysts have query modeling; warehouse modeling is deeper' },
      { label: 'Orchestration (dbt, Airflow)', state: 'gap', note: 'Automating and scheduling the pipeline' },
      { label: 'Pipeline ownership and reliability', state: 'gap', note: 'Shipping systems that must not break, not just insights' },
    ],
    faq: [
      { q: 'Is data engineer a natural next step for a data analyst?', a: 'It is the most common one on our data: the observed-flow score is 100, the highest destination for analysts who move. SQL, Python, and ETL transfer directly; the readiness reads 42 percent only because orchestration and infrastructure skills are new.' },
      { q: 'What is the difference between a data analyst and a data engineer?', a: 'An analyst queries data to answer questions; an engineer builds and owns the pipelines that deliver data reliably at scale. Insights versus infrastructure, and reports versus systems that must not break.' },
      { q: 'Does data engineering pay more than data analysis?', a: 'Typically yes. Data-engineer roles in our corpus post a 75,000 to 130,000 dollar band, above the usual analyst range, reflecting the on-call ownership and infrastructure scope.' },
      { q: 'What should a data analyst learn to become a data engineer?', a: 'Pipeline orchestration and warehouse modeling: dbt, Airflow, and the reliability mindset of owning data other teams depend on. Converting one manual report into a scheduled, automated pipeline is the standard first project.' },
    ],
    related: ['data-scientist-to-machine-learning-engineer', 'software-engineer-to-solutions-architect', 'accountant-to-financial-analyst'],
  },

  'business-analyst-to-project-manager': {
    origin: 'business-analyst',
    dest: 'project-manager',
    editorial: (
      <>
        <p>At 66 percent readiness this is one of the smoother transitions we track, and it is smooth for a specific reason: business analysts already sit in the meetings project managers run. Requirements, stakeholder wrangling, and data analysis are shared ground, and project management already appears in the analyst&rsquo;s own skill list. The distinction is one of <strong>ownership</strong>. A business analyst defines what should be built and why; a project manager owns getting it delivered, on a schedule, within a budget, past the risks. That sounds like a small step and is actually the whole job, because delivery accountability changes how you spend every hour.</p>
        <p>The gaps the corpus flags are the formal apparatus of that accountability: risk management, schedule and budget ownership, and the stakeholder management that is less about gathering requirements and more about holding people to commitments. A <a className="gl" href="/glossary#pmp">PMP</a> (the Project Management Professional certification) or entry-level CAPM is the common signal here, and unlike the licensed routes on this site it is measured in months, not years.</p>
        <p><strong>Concrete first step:</strong> on your current project, volunteer to own the schedule and the risk log yourself rather than feeding them to the PM, and run them for one full delivery cycle.</p>
      </>
    ),
    evidence: [
      { label: 'Requirements and stakeholder analysis', state: 'have', note: 'Shared ground with project management' },
      { label: 'Project-management exposure', state: 'have', note: 'Already in the analyst skill set' },
      { label: 'Data analysis and reporting', state: 'have', note: 'Transfers to status and delivery metrics' },
      { label: 'Risk, schedule, and budget ownership', state: 'gap', note: 'The delivery accountability that defines the role' },
      { label: 'PMP or CAPM certification', state: 'partial', note: 'The common signal; months, not years' },
    ],
    faq: [
      { q: 'Can a business analyst become a project manager?', a: 'It is one of the smoother pivots we track, at 66 percent posted-skill readiness. Analysts already share requirements, stakeholder, and analysis work with PMs; the move is about taking on delivery ownership, schedule, budget, and risk.' },
      { q: 'What is the difference between a business analyst and a project manager?', a: 'A business analyst defines what to build and why; a project manager owns delivering it on time and on budget. The step is from specifying work to being accountable for its completion.' },
      { q: 'Do I need a PMP to move from BA to project manager?', a: 'Not strictly, but a PMP or the entry-level CAPM is the common signal and helps convert BA experience into PM offers. Unlike licensed pivots, it is a matter of months, not years.' },
      { q: 'Does project management pay more than business analysis?', a: 'Comparably, with PM rising faster into program and delivery leadership. Our corpus shows overlapping bands around 75,000 to 130,000 dollars, with project management scaling higher as scope grows.' },
    ],
    related: ['marketing-manager-to-product-manager', 'accountant-to-financial-analyst', 'software-engineer-to-solutions-architect'],
  },

};

export const ROUTE_SLUGS = Object.keys(ROUTES);

/* Auto-coverage: any origin with confident data carries routes to its strongest
   adjacencies, so the surface spans every field, not just architecture. Curated
   routes above keep their hand editorial; generated ones draft a read from the
   numbers (match, the carried and missing skills, salary, demand, time, observed
   flow), an evidence checklist selected from the extracted skills, and a
   data-driven FAQ. Gated by a match and posting floor so nothing thin ships. */
const MATCH_FLOOR = 45, ORIGIN_POST_FLOOR = 60, DEST_CAP = 2;
const NON_OCC = new Set(['occ-meta', 'origins', 'skill-profiles', 'skills-meta', 'skill-cooccur', 'cloud', 'price-levels', 'data']);
let _routable: Map<string, { origin: string; dest: string }> | null = null;
function loadRoutable(): Map<string, { origin: string; dest: string }> {
  if (_routable) return _routable;
  _routable = new Map();
  // Curated routes qualify only while the data can still render them: the dest
  // must sit in the origin's ring-1 roles OR its kid rows (destRole's fallback).
  // The emitter reshuffles ring-1 as the corpus moves — a curated slug whose
  // measured direction vanished entirely must drop out here, or the sitemap and
  // salary pages keep pointing at a notFound() (the graphic-designer→ux 404).
  for (const s of ROUTE_SLUGS) {
    if (destRole(ROUTES[s].origin, ROUTES[s].dest)) _routable.set(s, { origin: ROUTES[s].origin, dest: ROUTES[s].dest });
  }
  try {
    const dir = path.join(process.cwd(), 'public', 'data');
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.json')) continue;
      const slug = file.replace(/\.json$/, '');
      if (NON_OCC.has(slug) || slug === 'architect') continue;
      const o = getOrigin(slug);
      if (!o || !Array.isArray(o.roles) || (o.postings ?? 0) < ORIGIN_POST_FLOOR) continue;
      for (const r of o.roles.filter((x) => (x.match ?? 0) >= MATCH_FLOOR).slice(0, DEST_CAP)) {
        const rslug = `${slug}-to-${r.id}`;
        if (!_routable.has(rslug)) _routable.set(rslug, { origin: slug, dest: r.id });
      }
    }
  } catch { /* build edge */ }
  return _routable;
}
export function routableSlugs(): string[] { return [...loadRoutable().keys()]; }
export function routePair(slug: string): { origin: string; dest: string } | null { return loadRoutable().get(slug) ?? null; }

/** Origins that earn a per-origin page ("Alternative careers for architects"):
    enough measured roles in the payload to be a real ranked list. Route PAGES
    are capped at the best two per origin (DEST_CAP); the origin page lists the
    full measured set and links the ones that have pages. */
export function routeOrigins(): string[] {
  const out: string[] = [];
  try {
    const dir = path.join(process.cwd(), 'public', 'data');
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.json')) continue;
      const slug = file.replace(/\.json$/, '');
      if (NON_OCC.has(slug)) continue;
      const o = getOrigin(slug);
      if (!o || !Array.isArray(o.roles) || o.roles.length < 5 || (o.postings ?? 0) < ORIGIN_POST_FLOOR) continue;
      out.push(slug);
    }
  } catch { /* build edge */ }
  return out.sort();
}
/** Does this occupation have a per-origin page to link at? Callers on other
    surfaces (job detail, salary, route pairs) use this to add the contextual
    "alternative careers" link only where the target actually exists — the
    origin set is threshold-gated, so linking blind would mint 404s. Memoised:
    routeOrigins() walks the data dir, and this is called on 4,000+ pages. */
let _originSet: Set<string> | null = null;
export function hasOriginPage(slug: string): boolean {
  if (!_originSet) _originSet = new Set(routeOrigins());
  return _originSet.has(slug);
}

/** Every measured role out of one origin, readiness-ranked (the full list, not just the ones with route pages). */
export function originRoles(origin: string): RouteRole[] {
  return [...(getOrigin(origin)?.roles ?? [])].sort((a, b) => (b.match ?? 0) - (a.match ?? 0));
}

let _fieldCache: Record<string, { field?: string }> | null = null;
export function occField(slug: string): string {
  if (!_fieldCache) { try { _fieldCache = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'occ-meta.json'), 'utf8')).meta; } catch { _fieldCache = {}; } }
  return _fieldCache![slug]?.field ?? 'Other';
}

function genRouteDef(origin: string, dest: string): RouteDef | null {
  const r = destRole(origin, dest); if (!r) return null;
  const om = originMeta(origin);
  const o = om.title.toLowerCase(), dl = r.title.toLowerCase();
  const observed = r.mobility != null && (r.mobility_source ?? '').startsWith('observed');
  const have = (r.have || []).slice(0, 4), learn = (r.learn || []).slice(0, 4);
  const shape = r.match >= 60 ? 'a genuinely close move' : r.match >= 40 ? 'a real move with a real gap' : 'a stretch the shared skills still make legible';
  const artO = /^[aeiou]/i.test(o) ? 'an' : 'a', ArtO = /^[aeiou]/i.test(o) ? 'An' : 'A';
  const artD = /^[aeiou]/i.test(dl) ? 'an' : 'a';
  const editorial = (
    <>
      <p>{`${ArtO} ${o} reaches ${dl} at ${r.match} percent skill readiness, measured from ${om.postings.toLocaleString()} live ${o} postings against what ${dl} postings ask for. At that number it is ${shape}.`}{observed ? ' Observed US worker transitions corroborate that people actually make it.' : ''}</p>
      {have.length ? <p>{`What carries over: ${have.join(', ')}.`}{learn.length ? ` The gap is the rest of the destination demand, chiefly ${learn.join(', ')}, the skills a typical ${o} profile does not yet show.` : ''}</p> : null}
      <p>{`${r.license ? r.license.label + '. ' : ''}Posted pay for ${dl} runs ${r.salary}, demand is rated ${r.demand.toLowerCase()}, and the estimated time to close the gap is ${r.time}. This read is drafted from the numbers; the graph above is the full skill map behind them.`}</p>
    </>
  );
  const evidence: Evidence[] = [
    ...have.map((s) => ({ label: s, state: 'have' as const, note: `In the typical ${o} profile` })),
    ...learn.slice(0, 3).map((s) => ({ label: s, state: 'gap' as const, note: `Asked for by ${dl} postings, not yet shown` })),
  ];
  const faq = [
    { q: `Can ${artO} ${o} become ${artD} ${dl}?`, a: `Posted-skill readiness is ${r.match} percent in our corpus${observed ? ', and observed US transition data shows people making the move' : ''}. The skills that carry are ${have.slice(0, 3).join(', ') || 'the shared fundamentals'}; the gap is ${learn.slice(0, 3).join(', ') || 'narrow'}.${r.license ? ` Note the credential gate: ${r.license.label.toLowerCase()}.` : ''}` },
    ...(r.license ? [{ q: `Do I need a license or degree to become ${artD} ${dl}?`, a: `${r.license.req === 'required' ? 'Yes.' : 'For some roles.'} ${r.license.label}. Skill overlap does not shorten a credential: however high the readiness number reads, the gate stands on its own, which is why the transition estimate for this route is ${r.time}.` }] : []),
    { q: `What skills does ${artO} ${o} need to become ${artD} ${dl}?`, a: `${learn.length ? `The measured gap, read from live ${dl} postings, is ${learn.join(', ')}. ` : ''}${have.length ? `Already covered by a typical ${o} profile: ${have.join(', ')}.` : ''} The graph on this page shows the full overlap, skill by skill.` },
    { q: `How long does the ${o} to ${dl} move take?`, a: `Our estimate from the skill gap is ${r.time}, shorter for anyone who already holds part of the destination skill set.` },
    { q: `What does ${artD} ${dl} earn?`, a: `Posted pay is ${r.salary}, with demand rated ${r.demand.toLowerCase()}. The salary page for ${dl} carries the full distribution.` },
  ];
  const related = [...loadRoutable().keys()].filter((s) => s.startsWith(`${origin}-to-`) && s !== `${origin}-to-${dest}`).slice(0, 3);
  return { origin, dest, editorial, evidence, faq, related };
}

/** Curated def if we have one, else a generated one from the adjacency data, else null. */
export function getRouteDef(slug: string): RouteDef | null {
  if (ROUTES[slug]) return ROUTES[slug];
  const rt = loadRoutable().get(slug);
  return rt ? genRouteDef(rt.origin, rt.dest) : null;
}
