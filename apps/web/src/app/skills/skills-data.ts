import fs from 'node:fs';
import path from 'node:path';

/* The skill-pages family (/skills/<slug>), plan family 4, first tranche
   2026-09-01. A skill page is honest exactly the way the board's skill filter
   is honest: a skill maps to the occupations it unlocks (the adjacency data),
   and the live inventory is the jobs on those boards — never a keyword match
   over titles.

   TRANCHE GATE. 360 skills qualify by data; shipping all of them at once onto
   an indexing queue that already holds ~2,400 uncrawled pages would just
   lengthen the queue (GSC cut, 2026-09-01). REACH_FLOOR=800 admits ~182 pages
   now; lower it toward the category THRESHOLD as GSC shows the tranche
   indexing. */

const REACH_FLOOR = 800;

export type SkillUnlock = { slug: string; title: string; count: number };
export type SkillEntry = {
  slug: string; term: string; field: string; def: string; unlocks: SkillUnlock[];
};
export type RelatedSkill = { id: string; name: string; together: number; confidence: number; lift: number };

function read<T>(rel: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', rel), 'utf8')) as T;
  } catch { return null; }
}

let _glossary: SkillEntry[] | null = null;
function glossary(): SkillEntry[] {
  if (!_glossary) {
    _glossary = (read<SkillEntry[]>('skills-glossary.json') ?? [])
      .filter((e) => e.slug && e.term && Array.isArray(e.unlocks));
  }
  return _glossary;
}

let _cooccur: { postings: number; skills: Record<string, RelatedSkill[]> } | null = null;
function cooccur() {
  if (!_cooccur) {
    const raw = read<{ postings?: number; skills?: Record<string, RelatedSkill[]> }>('skill-cooccur.json');
    _cooccur = { postings: raw?.postings ?? 0, skills: raw?.skills ?? {} };
  }
  return _cooccur;
}

/** Live roles reachable through the skill: the sum over its unlocked
    occupations' board counts. One figure, same source as the boards. */
export function skillReach(e: SkillEntry): number {
  return e.unlocks.reduce((s, u) => s + (u.count || 0), 0);
}

let _slugs: Set<string> | null = null;
export function skillPageSlugs(): string[] {
  return glossary().filter((e) => skillReach(e) >= REACH_FLOOR).map((e) => e.slug);
}
export function hasSkillPage(slug: string): boolean {
  if (!_slugs) _slugs = new Set(skillPageSlugs());
  return _slugs.has(slug);
}

export type SkillPage = SkillEntry & {
  reach: number;
  related: RelatedSkill[];
  cooccurPostings: number;
};

export function getSkillPage(slug: string): SkillPage | null {
  const e = glossary().find((x) => x.slug === slug);
  if (!e || skillReach(e) < REACH_FLOOR) return null;
  return {
    ...e,
    unlocks: [...e.unlocks].sort((a, b) => b.count - a.count),
    reach: skillReach(e),
    related: (cooccur().skills[slug] ?? []).slice(0, 6),
    cooccurPostings: cooccur().postings,
  };
}
