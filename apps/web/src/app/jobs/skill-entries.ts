import fs from 'node:fs';
import path from 'node:path';
import type { SkillEntry } from './SkillStrip';
import { hasSkillPage } from '../skills/skills-data';

// Server-side lookup into the same skills-glossary.json the glossary renders,
// so a job page ships only the entries its own chips need. One source of truth
// for definitions, and no client fetch on the detail page.
let cache: Record<string, SkillEntry> | null = null;

function load(): Record<string, SkillEntry> {
  if (cache) return cache;
  try {
    const raw = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'skills-glossary.json'), 'utf8')
    ) as SkillEntry[];
    cache = Object.fromEntries(raw.map((e) => [e.slug, e]));
  } catch {
    cache = {};
  }
  return cache;
}

/** Glossary entries for the given skill ids, in order, skipping unknown ids. */
export function skillEntries(ids: string[]): SkillEntry[] {
  const byId = load();
  // 2026-09-09: entries know whether the skill has its own page, so the chip can
  // link to /skills/<slug> (the indexed surface) instead of a glossary anchor.
  return ids.map((id) => byId[id]).filter(Boolean).map((e) => ({ ...e, page: hasSkillPage(e.slug) }));
}
