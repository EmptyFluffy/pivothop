// The three gates a posting states about who can take the job, formatted once
// for both the listing page (server) and the inspector (client).
//
// Mined by apps/scraper/scripts/requirements.py. Every field is optional and
// nothing is inferred: a posting that says nothing about a degree renders no
// education line, because the alternative is telling a reader a degree is
// required when the employer never said so.

export type Gates = {
  exp?: number;                                              // minimum years asked for
  edu?: { level: string; state: 'required' | 'preferred' | 'waived' };
  lang?: string[];
};

const LEVEL: Record<string, string> = {
  apprenticeship: 'Apprenticeship',
  associate: 'Associate degree',
  bachelor: "Bachelor's degree",
  master: "Master's degree",
  doctorate: 'Doctorate',
  any: 'Degree',
};

export function eduLabel(edu: NonNullable<Gates['edu']>): string {
  const name = LEVEL[edu.level] ?? 'Degree';
  if (edu.state === 'waived') {
    return edu.level === 'any' ? 'No degree required' : `${name} or equivalent`;
  }
  if (edu.state === 'preferred') return `${name} preferred`;
  return name;
}

/** -> [{ key, label, value }] for the gates this posting actually states. */
export function gateRows(g?: Gates | null): { key: string; label: string; value: string }[] {
  if (!g) return [];
  const rows: { key: string; label: string; value: string }[] = [];
  if (g.exp) rows.push({ key: 'exp', label: 'Experience', value: `${g.exp}+ years` });
  if (g.edu) rows.push({ key: 'edu', label: 'Education', value: eduLabel(g.edu) });
  if (g.lang?.length) rows.push({ key: 'lang', label: 'Language', value: g.lang.join(' · ') });
  return rows;
}
