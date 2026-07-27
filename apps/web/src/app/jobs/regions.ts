/* Macro-region taxonomy: ISO-3166 alpha-2 -> region key, for the region filter
   and the region SEO pages ("design jobs in Latin America"). Client-safe (no fs).

   Grouping follows the pragmatic job-board convention (the way Himalayas / We
   Work Remotely / RemoteOK cut the world), tuned to how people search, not to
   strict UN M49 — most relevantly, Mexico sits in Latin America, not North
   America, because that is the labor market people mean by "LATAM". Turkey and
   Israel are the usual EMEA edge cases; Turkey -> Europe, Israel -> Middle East,
   per common tech-hiring usage. */

export type RegionKey =
  | 'north-america' | 'latin-america' | 'europe'
  | 'middle-east' | 'africa' | 'asia' | 'oceania';

export const REGION_META: Record<RegionKey, { name: string; slug: string }> = {
  'north-america': { name: 'North America', slug: 'north-america' },
  'latin-america': { name: 'Latin America', slug: 'latin-america' },
  'europe': { name: 'Europe', slug: 'europe' },
  'middle-east': { name: 'the Middle East', slug: 'middle-east' },
  'africa': { name: 'Africa', slug: 'africa' },
  'asia': { name: 'Asia', slug: 'asia' },
  'oceania': { name: 'Oceania', slug: 'oceania' },
};

// Regions that read with a definite article ("jobs in the Middle East").
const ARTICLED = new Set<RegionKey>(['middle-east']);

export const REGION_OF: Record<string, RegionKey> = {
  // North America
  US: 'north-america', CA: 'north-america',
  // Latin America (incl. Mexico, Central America, the Caribbean, South America)
  MX: 'latin-america', BR: 'latin-america', AR: 'latin-america', CO: 'latin-america',
  CL: 'latin-america', PE: 'latin-america', UY: 'latin-america', EC: 'latin-america',
  VE: 'latin-america', BO: 'latin-america', PY: 'latin-america', CR: 'latin-america',
  PA: 'latin-america', GT: 'latin-america', DO: 'latin-america', PR: 'latin-america',
  NI: 'latin-america', HN: 'latin-america', SV: 'latin-america', CU: 'latin-america',
  // Europe
  GB: 'europe', IE: 'europe', DE: 'europe', FR: 'europe', ES: 'europe', IT: 'europe',
  NL: 'europe', PT: 'europe', SE: 'europe', CH: 'europe', AT: 'europe', BE: 'europe',
  DK: 'europe', NO: 'europe', FI: 'europe', EE: 'europe', LT: 'europe', LV: 'europe',
  CZ: 'europe', RO: 'europe', HU: 'europe', GR: 'europe', PL: 'europe', UA: 'europe',
  RS: 'europe', HR: 'europe', BG: 'europe', SK: 'europe', SI: 'europe', LU: 'europe',
  IS: 'europe', MT: 'europe', CY: 'europe', TR: 'europe',
  // Middle East
  AE: 'middle-east', SA: 'middle-east', IL: 'middle-east', JO: 'middle-east',
  QA: 'middle-east', KW: 'middle-east', BH: 'middle-east', OM: 'middle-east',
  // Africa
  ZA: 'africa', NG: 'africa', KE: 'africa', EG: 'africa', GH: 'africa', MA: 'africa', TN: 'africa',
  // Asia
  IN: 'asia', JP: 'asia', SG: 'asia', PH: 'asia', ID: 'asia', MY: 'asia', TH: 'asia',
  VN: 'asia', KR: 'asia', CN: 'asia', HK: 'asia', TW: 'asia', PK: 'asia', BD: 'asia',
  LK: 'asia', NP: 'asia',
  // Oceania
  AU: 'oceania', NZ: 'oceania',
};

export function regionOf(code?: string | null): RegionKey | undefined {
  return code ? REGION_OF[code] : undefined;
}
export function regionName(k: RegionKey): string { return REGION_META[k].name.replace(/^the /, ''); }
/** With the definite article where English wants one: "the Middle East". */
export function regionInName(k: RegionKey): string { return REGION_META[k].name; }
/** Slug used in category paths: "latin-america". */
export function regionSlug(k: RegionKey): string { return REGION_META[k].slug; }
export const ARTICLED_REGIONS = ARTICLED;
