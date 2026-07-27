import fs from 'node:fs';
import path from 'node:path';
import { occTitle } from '../jobs/jobs-data';

/* Career comparison pages ("data analyst vs data scientist") — the programmatic
   class that survived every Google purge because it fronts proprietary numbers
   (docs/24 §7). We hold BOTH sides of every pair: posted salary bands from each
   occupation's own corpus, skill readiness in both directions, the shared-skill
   waterfall, license gates, live board counts. Everything here is read from the
   emitted report/payload files, so pages regenerate with the nightly scrape.

   Pair sources:
   - report/{origin}.json roles  -> rich direction (match, band, time, waterfall)
   - {origin}.json next/direct   -> thin direction (readiness + gap) beyond top-8
   Qualification: mutual pairs (both directions measured, ANY overlap — the
   low-overlap "everyone confuses them" pairs are the best pages), one-way pairs
   at >=45 readiness, plus a small seed list of high-search pairs kept honest by
   requiring at least one measured direction. */

export type CompareDir = {
  match: number;
  salary?: string | null;
  band?: [number, number] | null;
  demand?: string | null;
  remote?: string | null;
  time?: string | null;
  license?: { req: string; label: string } | null;
  shared?: string[];   // destination top skills the origin already covers
  unique?: string[];   // destination top skills the origin lacks
  rich: boolean;       // from a report role (vs a thin kid entry)
};
export type ComparePair = {
  slug: string; a: string; b: string;
  ab: CompareDir | null;  // a -> b
  ba: CompareDir | null;  // b -> a
  bandA: [number, number] | null;
  bandB: [number, number] | null;
  postingsA: number; postingsB: number;
};

// High-search pairs worth a page whenever at least one direction is measured.
/* A comparison page is a SEARCH surface, so a pair must be one a human would
   actually weigh: same field, same industry cluster, or on this curated list.
   Adjacency measurement alone is NOT enough — the matrix knows drone pilots
   share camera skills with photographers, but nobody searches that "vs".
   Cross-field pairs live ONLY here; keys are alphabetically sorted (a|b). */
const SEED_PAIRS = new Set([
  // the classics (title confusion / adjacent rungs)
  'product-manager|project-manager', 'data-analyst|data-scientist',
  'backend-developer|frontend-developer', 'graphic-designer|ux-designer',
  'accountant|financial-analyst', 'accountant|bookkeeper',
  'data-engineer|data-scientist', 'product-designer|ux-designer',
  'architect|interior-designer', 'devops-engineer|software-engineer',
  'copywriter|content-strategist', 'lawyer|paralegal',
  'nurse-practitioner|registered-nurse', 'psychologist|therapist',
  // analyst family & product org
  'business-analyst|data-analyst', 'bi-developer|business-analyst',
  'business-analyst|product-analyst', 'product-analyst|product-manager',
  // quant careers
  'actuary|data-scientist', 'actuary|statistician', 'actuary|economist',
  'economist|market-researcher', 'data-scientist|research-scientist',
  'machine-learning-engineer|research-scientist',
  // tech crossroads
  'sales-engineer|software-engineer', 'developer-advocate|sales-engineer',
  'customer-support-specialist|it-support-specialist',
  'game-designer|game-developer', 'human-factors-engineer|ux-designer',
  // design ↔ engineering, build world
  'industrial-designer|mechanical-engineer', 'construction-manager|project-manager',
  // marketing & content
  'content-strategist|seo-specialist', 'content-strategist|social-media-manager',
  'copywriter|ux-writer',
  // health & care (adjacent rungs people actually weigh)
  'nurse-practitioner|physician-assistant', 'medical-assistant|registered-nurse',
  'occupational-therapist|physical-therapist',
  // ops, trades, law, teaching
  'operations-manager|warehouse-manager', 'supply-chain-analyst|warehouse-manager',
  'compliance-officer|lawyer', 'electrician|plumber', 'instructional-designer|teacher',
  // same-field rescues: real comparisons whose skill overlap sits under the
  // floor — low overlap is often exactly why people search them
  'photographer|video-editor', 'graphic-designer|illustrator', 'graphic-designer|product-designer',
  'brand-designer|graphic-designer', 'creative-director|ux-designer', 'ux-designer|ux-researcher',
  'game-designer|ux-designer', 'hr-manager|recruiter', 'business-analyst|scrum-master',
  'accountant|actuary', 'accountant|financial-controller', 'auditor|compliance-officer',
  'content-strategist|technical-writer', 'industrial-engineer|mechanical-engineer',
  'civil-engineer|mechanical-engineer', 'electrical-engineer|mechanical-engineer',
  'aerospace-engineer|mechanical-engineer', 'aerospace-engineer|electrical-engineer',
  'aerospace-engineer|industrial-engineer', 'robotics-engineer|robotics-technician',
  'automotive-technician|welder', 'electrician|welder',
  'database-administrator|systems-administrator', 'network-engineer|systems-administrator',
  'network-engineer|penetration-tester',
]);

/* Same-field pairs the floor lets through but no human would ever weigh —
   field labels are broad, and sharing "Business" or "Healthcare" does not make
   executive assistant vs market researcher a real decision. Curated from the
   full-list audit; a blocked pair stays blocked even if its overlap grows. */
const BLOCK_PAIRS = new Set([
  // Business: office/admin × unrelated commercial roles
  'business-analyst|hr-manager', 'business-analyst|event-planner', 'business-analyst|customer-success-manager',
  'business-analyst|growth-marketer', 'account-executive|customer-support-specialist',
  'account-executive|event-planner', 'account-executive|management-consultant', 'account-executive|real-estate-developer',
  'customer-success-manager|executive-assistant', 'customer-success-manager|hr-manager',
  'customer-success-manager|management-consultant', 'customer-success-manager|real-estate-developer',
  'customer-success-manager|growth-marketer', 'customer-support-specialist|event-planner',
  'customer-support-specialist|hr-manager', 'customer-support-specialist|executive-assistant',
  'customer-support-specialist|sales-representative', 'event-planner|hr-manager',
  'event-planner|sales-representative', 'event-planner|supply-chain-analyst',
  'executive-assistant|hr-manager', 'executive-assistant|management-consultant',
  'executive-assistant|market-researcher', 'executive-assistant|operations-manager',
  'executive-assistant|real-estate-developer', 'executive-assistant|recruiter',
  'executive-assistant|sales-representative', 'executive-assistant|supply-chain-analyst',
  'growth-marketer|management-consultant', 'growth-marketer|operations-manager',
  'growth-marketer|real-estate-developer', 'hr-manager|operations-manager',
  'hr-manager|product-manager', 'hr-manager|project-manager', 'hr-manager|sales-representative',
  'management-consultant|market-researcher', 'market-researcher|real-estate-developer',
  'marketing-manager|project-manager', 'marketing-manager|real-estate-developer',
  'operations-manager|real-estate-developer', 'project-manager|real-estate-developer',
  'real-estate-developer|sales-representative', 'recruiter|social-media-manager',
  'recruiter|supply-chain-analyst',
  // Healthcare: clinical × unrelated-clinical noise
  'dental-hygienist|pharmacist', 'dental-hygienist|physician', 'dental-hygienist|psychologist',
  'dental-hygienist|social-worker', 'dental-hygienist|therapist', 'genetic-counselor|medical-assistant',
  'genetic-counselor|psychologist', 'genetic-counselor|registered-nurse', 'genetic-counselor|social-worker',
  'medical-assistant|psychologist', 'pharmacist|psychologist', 'pharmacist|social-worker',
  'pharmacist|therapist', 'physician|social-worker',
  // Technology: data-annotator vs everything, QA/support/pen-test noise
  'ai-engineer|data-annotator', 'computer-vision-engineer|data-annotator', 'data-annotator|data-architect',
  'data-annotator|data-scientist', 'data-annotator|developer-advocate', 'data-annotator|machine-learning-engineer',
  'data-annotator|mlops-engineer', 'data-annotator|prompt-engineer', 'data-annotator|qa-engineer',
  'data-annotator|security-engineer', 'ai-engineer|mobile-developer', 'ai-engineer|qa-engineer',
  'ai-engineer|database-administrator', 'data-analyst|qa-engineer', 'data-engineer|qa-engineer',
  'data-scientist|database-administrator', 'database-administrator|it-support-specialist',
  'database-administrator|penetration-tester', 'database-administrator|product-analyst',
  'developer-advocate|it-support-specialist', 'developer-advocate|mobile-developer',
  'developer-advocate|penetration-tester', 'devops-engineer|it-support-specialist',
  'devops-engineer|mobile-developer', 'it-support-specialist|penetration-tester',
  'it-support-specialist|qa-engineer', 'machine-learning-engineer|product-analyst',
  'mobile-developer|penetration-tester', 'mobile-developer|qa-engineer',
  'penetration-tester|prompt-engineer', 'product-analyst|qa-engineer', 'prompt-engineer|qa-engineer',
  'prompt-engineer|solutions-architect',
  // Design / misc
  'brand-designer|motion-designer', 'creative-director|game-designer', 'creative-director|interior-designer',
  'creative-director|industrial-designer', 'creative-director|ux-researcher', 'game-designer|illustrator',
  'game-designer|ux-researcher',
]);
const SAME_FIELD_FLOOR = 30; // same-field pairs need this much overlap OR a seed

type ReportRole = { id: string; match: number; salary?: string; salary_band?: [number, number]; demand?: string; remote?: string; time?: string; license?: { req: string; label: string } | null; waterfall?: { name: string; earned: number }[]; learn?: string[]; have?: string[] };

let _pairs: ComparePair[] | null = null;
let _bySlug: Map<string, ComparePair> | null = null;

function load() {
  if (_pairs) return;
  const dataDir = path.join(process.cwd(), 'public', 'data');
  const dirs = new Map<string, CompareDir>();
  const bandOf = new Map<string, [number, number] | null>();
  const postingsOf = new Map<string, number>();

  // Rich directions + per-occupation facts, from the report files.
  try {
    const repDir = path.join(dataDir, 'report');
    for (const f of fs.readdirSync(repDir)) {
      if (!f.endsWith('.json')) continue;
      let rep; try { rep = JSON.parse(fs.readFileSync(path.join(repDir, f), 'utf8')); } catch { continue; }
      const a = rep.origin?.slug; if (!a) continue;
      bandOf.set(a, rep.origin.salary_band ?? null);
      postingsOf.set(a, rep.origin.postings ?? 0);
      for (const r of (rep.roles ?? []) as ReportRole[]) {
        const wf = r.waterfall ?? [];
        dirs.set(`${a}|${r.id}`, {
          match: r.match,
          salary: r.salary ?? null, band: r.salary_band ?? null,
          demand: r.demand ?? null, remote: r.remote ?? null, time: r.time ?? null,
          license: r.license ?? null,
          shared: wf.filter((s) => s.earned > 0).map((s) => s.name),
          unique: wf.filter((s) => s.earned === 0).map((s) => s.name),
          rich: true,
        });
      }
    }
  } catch { /* build edge */ }

  // Thin directions from second-ring kids, only where no rich one exists.
  for (const a of bandOf.keys()) {
    let payload; try { payload = JSON.parse(fs.readFileSync(path.join(dataDir, `${a}.json`), 'utf8')); } catch { continue; }
    const kids = [...Object.values(payload.next ?? {}), payload.direct ?? []].flat() as { slug: string; m: number; gap?: string[] }[];
    for (const k of kids) {
      if (!k?.slug || dirs.has(`${a}|${k.slug}`)) continue;
      dirs.set(`${a}|${k.slug}`, { match: k.m, unique: k.gap ?? [], rich: false });
    }
  }

  // Assemble pairs on the sorted key; qualify.
  const raw = new Map<string, { ab: CompareDir | null; ba: CompareDir | null }>();
  for (const [k, d] of dirs) {
    const [a, b] = k.split('|');
    if (!bandOf.has(a) || !bandOf.has(b)) continue; // both sides need own-corpus facts
    const key = [a, b].sort().join('|');
    const p = raw.get(key) ?? { ab: null, ba: null };
    if (a < b) p.ab = d; else p.ba = d;
    raw.set(key, p);
  }
  // Field + cluster per occupation, for the kinship test.
  let occKin = new Map<string, { field: string; cluster: string }>();
  try {
    const m = JSON.parse(fs.readFileSync(path.join(dataDir, 'occ-meta.json'), 'utf8')).meta ?? {};
    occKin = new Map(Object.entries(m).map(([s, v]) => [s, { field: (v as { field?: string }).field ?? '', cluster: (v as { cluster?: string }).cluster ?? '' }]));
  } catch { /* no meta -> only seeds qualify */ }

  _pairs = [];
  for (const [key, p] of raw) {
    const mutual = p.ab && p.ba;
    const best = Math.max(p.ab?.match ?? 0, p.ba?.match ?? 0);
    const measured = mutual || best >= 45;
    const [a0, b0] = key.split('|');
    const A = occKin.get(a0), B = occKin.get(b0);
    const kin = !!A && !!B && (A.field === B.field || (!!A.cluster && A.cluster === B.cluster));
    // Same field / same cluster: comparable by nature — qualify on measurement,
    // with an overlap floor (field labels are broad; sub-floor kin pairs are
    // usually coincidences, and the real low-overlap comparisons are seeded).
    // Fully cross-field: only via the curated seed list (still needs data — a
    // seed with no measured direction never reaches this loop). BLOCK_PAIRS
    // wins over everything except an explicit seed.
    const kinOk = measured && kin && best >= SAME_FIELD_FLOOR && !BLOCK_PAIRS.has(key);
    if (!(kinOk || SEED_PAIRS.has(key))) continue;
    const [a, b] = key.split('|');
    _pairs.push({
      slug: `${a}-vs-${b}`, a, b, ab: p.ab, ba: p.ba,
      bandA: bandOf.get(a) ?? null, bandB: bandOf.get(b) ?? null,
      postingsA: postingsOf.get(a) ?? 0, postingsB: postingsOf.get(b) ?? 0,
    });
  }
  _pairs.sort((x, y) => (Math.max(y.ab?.match ?? 0, y.ba?.match ?? 0)) - (Math.max(x.ab?.match ?? 0, x.ba?.match ?? 0)));
  _bySlug = new Map(_pairs.map((p) => [p.slug, p]));
}

export function comparePairs(): ComparePair[] { load(); return _pairs!; }
export function compareSlugs(): string[] { load(); return _pairs!.map((p) => p.slug); }
export function getPair(slug: string): ComparePair | null { load(); return _bySlug!.get(slug) ?? null; }
export function relatedPairs(slug: string, limit = 6): ComparePair[] {
  load();
  const p = _bySlug!.get(slug); if (!p) return [];
  return _pairs!.filter((q) => q.slug !== slug && (q.a === p.a || q.b === p.a || q.a === p.b || q.b === p.b)).slice(0, limit);
}

export const fmtBand = (b: [number, number] | null | undefined) =>
  b ? `$${Math.round(b[0] / 1000)}k–$${Math.round(b[1] / 1000)}k` : null;
export const mid = (b: [number, number] | null | undefined) => (b ? (b[0] + b[1]) / 2 : null);

/** The verdict sentence for the dek — computed, tiered, never hedged. */
export function pairVerdict(p: ComparePair): string {
  const tA = occTitle(p.a), tB = occTitle(p.b);
  const best = Math.max(p.ab?.match ?? 0, p.ba?.match ?? 0);
  const overlap = best >= 65 ? 'largely the same skill set under two titles'
    : best >= 40 ? 'related jobs with a real gap between them'
    : 'mostly different jobs wearing similar names';
  const mA = mid(p.bandA), mB = mid(p.bandB);
  let pay = '';
  if (mA && mB) {
    const hi = mA >= mB ? tA : tB;
    const gap = Math.round(Math.abs(mA - mB) / 1000);
    pay = gap >= 5 ? ` Posted pay favors the ${hi.toLowerCase()} by about $${gap}k at the midpoint.` : ' Posted pay is close to a wash.';
  }
  return `Measured from each occupation's own live postings: ${overlap}.${pay}`;
}
