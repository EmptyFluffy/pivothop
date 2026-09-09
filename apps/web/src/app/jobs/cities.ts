import { COUNTRY_NAMES } from './countries';
import { US_STATE_NAMES } from '../salary/salary-data';

/* City normalizer for the city page family (2026-09-09). A posting's location
   is free text ("Zürich, ZH, Switzerland", "Chicago, IL; Pittsburgh, PA",
   "8001 Zürich", "Multiple Locations", "United Kingdom"). This reduces it to a
   canonical city name, or null when the text is not a city: remote words,
   country and state names on their own, "multiple locations". The country
   always comes from the resolved country code, never from the text, so
   "San Jose, CA" and "San José, Costa Rica" stay two cities.

   Measured 2026-09-09 before this file: 939 raw first-tokens with 6+ jobs,
   including "Multiple Locations" (369) and "United Kingdom" (326), which is
   why the reject list exists. Aliases fold the spellings the biggest cities
   arrive in (Zurich/Zürich, NYC/New York, München/Munich). */

const REJECT = /^(remote|hybrid|anywhere|worldwide|global|multiple( locations)?|various( locations)?|flexible|home|home[- ]based|nationwide|nation ?wide|onsite|on-site|emea|apac|latam|europe|north america|south america|asia|africa|usa|u\.s\.a?\.?|us|uk|united states|united kingdom|great britain|england|scotland|wales|deutschland|germany|switzerland|schweiz|suisse|svizzera|costa rica|canada|australia|france|spain|españa|italy|italia|austria|österreich|netherlands|nederland|belgium|ireland|portugal|mexico|méxico|brazil|brasil|argentina|chile|colombia|peru|india|singapore|japan|china|not specified|n\/a|tbd|other|see description)$/i;

// canonical spellings; keys are lower-case, diacritics stripped
const ALIAS: Record<string, string> = {
  'zurich': 'Zürich', 'zuerich': 'Zürich', 'zurigo': 'Zürich',
  'geneva': 'Geneva', 'geneve': 'Geneva', 'genf': 'Geneva', 'ginevra': 'Geneva',
  'bern': 'Bern', 'berne': 'Bern', 'basel': 'Basel', 'bale': 'Basel', 'basilea': 'Basel',
  'lausanne': 'Lausanne', 'luzern': 'Lucerne', 'lucerne': 'Lucerne', 'st gallen': 'St. Gallen', 'st. gallen': 'St. Gallen', 'sankt gallen': 'St. Gallen',
  'munchen': 'Munich', 'munich': 'Munich', 'koln': 'Cologne', 'cologne': 'Cologne', 'frankfurt am main': 'Frankfurt', 'frankfurt': 'Frankfurt',
  'wien': 'Vienna', 'vienna': 'Vienna', 'nurnberg': 'Nuremberg', 'nuremberg': 'Nuremberg',
  'new york city': 'New York', 'nyc': 'New York', 'new york': 'New York', 'manhattan': 'New York', 'brooklyn': 'New York',
  'san francisco': 'San Francisco', 'sf': 'San Francisco', 'washington dc': 'Washington, DC', 'washington d.c.': 'Washington, DC', 'washington': 'Washington, DC', 'district of columbia': 'Washington, DC',
  'los angeles': 'Los Angeles', 'la': 'Los Angeles', 'mountain view': 'Mountain View',
  'san jose': 'San José', 'san josé': 'San José',
  'mexico city': 'Mexico City', 'ciudad de mexico': 'Mexico City', 'cdmx': 'Mexico City',
  'sao paulo': 'São Paulo', 'buenos aires': 'Buenos Aires', 'bogota': 'Bogotá', 'bogota dc': 'Bogotá', 'bogota d.c.': 'Bogotá', 'medellin': 'Medellín', 'lima': 'Lima', 'santiago': 'Santiago',
  'london': 'London', 'greater london': 'London', 'manchester': 'Manchester', 'edinburgh': 'Edinburgh', 'dublin': 'Dublin',
  'paris': 'Paris', 'amsterdam': 'Amsterdam', 'madrid': 'Madrid', 'barcelona': 'Barcelona', 'lisbon': 'Lisbon', 'lisboa': 'Lisbon',
  'toronto': 'Toronto', 'vancouver': 'Vancouver', 'montreal': 'Montréal', 'montréal': 'Montréal',
  'sydney': 'Sydney', 'melbourne': 'Melbourne', 'singapore city': 'Singapore', 'tokyo': 'Tokyo', 'bengaluru': 'Bengaluru', 'bangalore': 'Bengaluru',
};

const fold = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const STATES = new Set(Object.values(US_STATE_NAMES as Record<string, string>).map(fold));
const STATE_CODES = new Set(Object.keys(US_STATE_NAMES).map((k) => k.toLowerCase()));
const COUNTRIES = new Set(Object.values(COUNTRY_NAMES).map(fold));

/** The canonical city a location string names, or null when it names none. */
export function cityOf(location: string | undefined | null): string | null {
  if (!location) return null;
  // walk the segments in order ("Massachusetts - Boston", "Hybrid - San Francisco",
  // "Zürich, ZH, Switzerland", "Chicago, IL; Pittsburgh, PA") and keep the first that
  // is a city; states, countries and remote words are skipped rather than kept.
  const segs = location.replace(/\([^)]*\)/g, ' ').split(/\s*[;|/·•]\s*|\s+-\s+|\s+–\s+|,|\s+and\s+/);
  for (const raw of segs) {
    let seg = raw.replace(/^\s*[A-Z]{0,2}[- ]?\d{4,6}\s+/, '').replace(/\s+d\.?c\.?$/i, '')
      .replace(/\b(area|region|metro|metropolitan area|greater)\b/gi, '').replace(/\s+/g, ' ').trim();
    if (seg.length < 3 || /\d/.test(seg)) continue;
    const f = fold(seg);
    if (REJECT.test(f) || STATES.has(f) || STATE_CODES.has(f) || COUNTRIES.has(f)) continue;
    const alias = ALIAS[f];
    if (alias) return alias;
    // Title Case for the long tail, Unicode-safe: capitalize each token's first letter and
    // lower the rest only when the token arrived shouting ("BOGOTÁ" -> "Bogotá"), so
    // "St. Gallen", "McLean" and "Oberrieden" keep their own capitals.
    seg = seg.split(/(\s+|-)/).map((tok) => {
      if (!tok || /^(\s+|-)$/.test(tok)) return tok;
      const rest = tok.slice(1);
      return tok.charAt(0).toUpperCase() + (tok.length > 3 && tok === tok.toUpperCase() ? rest.toLowerCase() : rest);
    }).join('');
    return seg;
  }
  return null;
}

/** Slug for a city page: NFKD, diacritics stripped, bare. */
export const citySlug = (city: string) => city.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
