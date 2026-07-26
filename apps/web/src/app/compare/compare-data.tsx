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
const SEED_PAIRS = new Set([
  'product-manager|project-manager', 'data-analyst|data-scientist',
  'backend-developer|frontend-developer', 'graphic-designer|ux-designer',
  'accountant|financial-analyst', 'accountant|bookkeeper',
  'data-engineer|data-scientist', 'product-designer|ux-designer',
  'architect|interior-designer', 'devops-engineer|software-engineer',
  'copywriter|content-strategist', 'lawyer|paralegal',
  'registered-nurse|nurse-practitioner', 'therapist|psychologist',
]);

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
  _pairs = [];
  for (const [key, p] of raw) {
    const mutual = p.ab && p.ba;
    const best = Math.max(p.ab?.match ?? 0, p.ba?.match ?? 0);
    if (!(mutual || best >= 45 || SEED_PAIRS.has(key))) continue;
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
