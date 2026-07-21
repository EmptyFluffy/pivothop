// Sub-country region extraction from posting location strings. US states are the
// deep case (OEWS anchors are state-level); CA/AU/GB get their first divisions.
// Returns a region code or null — never guesses.

const US_STATES = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS',
  missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK',
  oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI',
  wyoming: 'WY', 'district of columbia': 'DC', 'washington dc': 'DC', 'washington, d.c.': 'DC',
};
const US_ABBREV = new Set(Object.values(US_STATES));
const CA_PROV = { ontario: 'ON', quebec: 'QC', québec: 'QC', 'british columbia': 'BC', alberta: 'AB', manitoba: 'MB', saskatchewan: 'SK', 'nova scotia': 'NS', 'new brunswick': 'NB', 'newfoundland and labrador': 'NL', 'prince edward island': 'PE' };
const AU_STATES = { 'new south wales': 'NSW', victoria: 'VIC', queensland: 'QLD', 'western australia': 'WA', 'south australia': 'SA', tasmania: 'TAS', 'australian capital territory': 'ACT', 'northern territory': 'NT' };
const GB_NATIONS = { england: 'ENG', scotland: 'SCT', wales: 'WLS', 'northern ireland': 'NIR', london: 'ENG', manchester: 'ENG', birmingham: 'ENG', edinburgh: 'SCT', glasgow: 'SCT', cardiff: 'WLS', belfast: 'NIR' };

export function extractRegion(location, country) {
  if (!location) return null;
  const loc = String(location).toLowerCase();
  if (country === 'US') {
    for (const [name, code] of Object.entries(US_STATES)) {
      if (loc.includes(name)) return code;
    }
    // 2-letter tokens: ", CA" / "Austin, TX" — word-bounded, uppercase in the raw
    const m = String(location).match(/(?:,|\b)\s*([A-Z]{2})(?:\s*,\s*(?:US|USA|United States))?\s*$/);
    if (m && US_ABBREV.has(m[1])) return m[1];
    const m2 = String(location).match(/,\s*([A-Z]{2})\b/);
    if (m2 && US_ABBREV.has(m2[1])) return m2[1];
    return null;
  }
  const table = country === 'CA' ? CA_PROV : country === 'AU' ? AU_STATES : country === 'GB' ? GB_NATIONS : null;
  if (!table) return null;
  for (const [name, code] of Object.entries(table)) {
    if (loc.includes(name)) return code;
  }
  return null;
}

// Seniority read from the RAW title, before the cleaner strips it.
export function extractSeniority(rawTitle) {
  const t = String(rawTitle || '').toLowerCase();
  if (/\b(intern|internship|trainee|apprentice)\b/.test(t)) return 'entry';
  if (/\b(junior|jr\.?|entry[- ]?level|graduate)\b/.test(t)) return 'junior';
  if (/\b(principal|staff|head of|director|vp|vice president|chief)\b/.test(t)) return 'lead';
  if (/\b(lead)\b/.test(t)) return 'lead';
  if (/\b(senior|sr\.?)\b/.test(t)) return 'senior';
  return 'mid';
}
