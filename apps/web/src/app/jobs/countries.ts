/* ISO-3166 alpha-2 -> display name for every country the board resolves.
   Client-safe (no fs); used by the country filter and pills. */
export const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', CA: 'Canada', DE: 'Germany', IN: 'India',
  IE: 'Ireland', AU: 'Australia', JP: 'Japan', SG: 'Singapore', ES: 'Spain', MX: 'Mexico',
  BR: 'Brazil', FR: 'France', PL: 'Poland', NL: 'Netherlands', PT: 'Portugal', IT: 'Italy',
  SE: 'Sweden', CH: 'Switzerland', AT: 'Austria', BE: 'Belgium', DK: 'Denmark', NO: 'Norway',
  FI: 'Finland', EE: 'Estonia', LT: 'Lithuania', LV: 'Latvia', CZ: 'Czechia', RO: 'Romania',
  HU: 'Hungary', GR: 'Greece', IL: 'Israel', AE: 'United Arab Emirates', SA: 'Saudi Arabia',
  TR: 'Türkiye', AR: 'Argentina', CO: 'Colombia', CL: 'Chile', PE: 'Peru', PH: 'Philippines',
  ID: 'Indonesia', MY: 'Malaysia', TH: 'Thailand', VN: 'Vietnam', KR: 'South Korea',
  CN: 'China', HK: 'Hong Kong', TW: 'Taiwan', NZ: 'New Zealand', ZA: 'South Africa',
  NG: 'Nigeria', KE: 'Kenya', EG: 'Egypt', UA: 'Ukraine', RS: 'Serbia', HR: 'Croatia',
  BG: 'Bulgaria', SK: 'Slovakia', SI: 'Slovenia', LU: 'Luxembourg', IS: 'Iceland',
  JO: 'Jordan', QA: 'Qatar', CR: 'Costa Rica', UY: 'Uruguay', EC: 'Ecuador',
};
export const countryName = (c: string) => COUNTRY_NAMES[c] ?? c;
