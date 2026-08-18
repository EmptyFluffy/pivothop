// Shared listing-detail data path: the bottom sheet (phones) and the split
// pane (desktop) read the same lazily fetched per-occupation files, so a
// listing opens with zero route transition on both form factors.

import type { Job } from './JobCard';

export type Detail = { s: { h: string | null; t: string }[]; k: string[] };

const detailCache = new Map<string, Record<string, Detail>>();
const boardCache = new Map<string, Job[]>();
let skillNames: Record<string, string> | null = null;

export async function loadSkillNames(): Promise<Record<string, string>> {
  if (skillNames) return skillNames;
  try {
    const r = await fetch('/data/skills-meta.json');
    skillNames = r.ok ? (await r.json()).names ?? {} : {};
  } catch { skillNames = {}; }
  return skillNames ?? {};
}

export async function loadJobUrl(occ: string, id: string): Promise<string | null> {
  try {
    if (!boardCache.has(occ)) {
      const r = await fetch(`/data/jobs/${occ}.json`);
      boardCache.set(occ, r.ok ? await r.json() : []);
    }
    return boardCache.get(occ)?.find((j) => j.id === id)?.url ?? null;
  } catch {
    return null;
  }
}

export async function loadDetail(occ: string, id: string): Promise<Detail | null> {
  try {
    if (!detailCache.has(occ)) {
      const r = await fetch(`/data/jobs-detail/${occ}.json`);
      detailCache.set(occ, r.ok ? await r.json() : {});
    }
    return detailCache.get(occ)?.[id] ?? null;
  } catch {
    return null;
  }
}

/** Warm the detail file for an occupation before it is needed (card hover). */
export function prefetchDetail(occ: string): void {
  void loadDetail(occ, '');
}

/** Source postings arrive with markdown escapes and ASCII dividers; strip the
    noise at render so neither surface shows a backslash-asterisk. */
export function cleanLine(line: string): string | null {
  if (/^[-=_]{4,}$/.test(line.trim())) return null;
  return line.replace(/\\([*#_[\]()~`>])/g, '$1');
}
