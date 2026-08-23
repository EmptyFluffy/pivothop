import fs from 'node:fs';
import path from 'node:path';
import type { BenefitEntry } from './BenefitStrip';

// Server-side lookup into the same benefits-glossary.json the glossary renders,
// written by build-jobs from the lexicon plus this run's corpus counts. A job
// page ships only the entries its own pills need, and there is one source of
// truth for every definition.
let cache: Record<string, BenefitEntry> | null = null;

function load(): Record<string, BenefitEntry> {
  if (cache) return cache;
  try {
    const raw = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'benefits-glossary.json'), 'utf8')
    ) as BenefitEntry[];
    cache = Object.fromEntries(raw.map((e) => [e.slug, e]));
  } catch {
    cache = {};
  }
  return cache;
}

/** Glossary entries for the given benefit ids, skipping unknown ids. Ordered by
    how commonly the board states them, so the pane's first three are the ones a
    reader is most likely to be weighing. */
export function benefitEntries(ids: string[]): BenefitEntry[] {
  const byId = load();
  return ids
    .map((id) => byId[id])
    .filter(Boolean)
    .sort((a, b) => (b.n ?? 0) - (a.n ?? 0));
}

/** The whole benefit bank, for the glossary. */
export function allBenefits(): BenefitEntry[] {
  return Object.values(load());
}
