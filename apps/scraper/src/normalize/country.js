// Light country inference from freeform location strings. Null when honest doubt remains.

const RULES = [
  ['US', /\b(usa|u\.s\.a?\.?|united states|america)\b/i],
  // Bare "US" as its own token. CASE-SENSITIVE on purpose: lowercase "us" is an
  // English pronoun ("join us in Berlin") and would hijack half the corpus.
  ['US', /\bUS\b/],
  // Ontario's London before Britain's — the GB rule below owns bare "London".
  ['CA', /\blondon,?\s*(on|ontario)\b/i],
  ['GB', /\b(uk|u\.k\.|united kingdom|england|scotland|wales|london|manchester|birmingham uk)\b/i],
  ['CA', /\b(canada|toronto|vancouver|montr[eé]al|ottawa|calgary|edmonton|winnipeg|mississauga|halifax ns|quebec|qu[eé]bec|brampton|hamilton on|kitchener|waterloo on|victoria bc|burnaby|surrey bc)\b/i],
  ['AU', /\b(australia|sydney|melbourne|brisbane|perth|adelaide|canberra|gold coast|hobart|darwin nt|newcastle nsw|wollongong|geelong)\b/i],
  ['NZ', /\b(new zealand|auckland|wellington)\b/i],
  ['DE', /\b(germany|deutschland|berlin|munich|münchen|hamburg|frankfurt)\b/i],
  ['FR', /\b(france|paris|lyon)\b/i],
  ['ES', /\b(spain|españa|madrid|barcelona)\b/i],
  ['PT', /\b(portugal|lisbon|porto)\b/i],
  ['IT', /\b(italy|italia|milan|rome)\b/i],
  ['NL', /\b(netherlands|nederland|holland|amsterdam|rotterdam|utrecht|eindhoven|den haag|the hague|groningen|tilburg|breda|nijmegen|zaltbommel|noord-brabant|zuid-holland|noord-holland)\b/i],
  ['IE', /\b(ireland|dublin)\b/i],
  ['PL', /\b(poland|warsaw|krakow|kraków|wroclaw)\b/i],
  ['CZ', /\b(czech|prague)\b/i],
  ['AT', /\b(austria|vienna)\b/i],
  ['CH', /\b(switzerland|schweiz|suisse|svizzera|zurich|zürich|geneva|genève|genf|basel|bâle|bern[e]?|lausanne|winterthur|luzern|lucerne|st\.? ?gallen|lugano|zug|aargau|thurgau|vaud|wallis|valais|tessin|ticino|graubünden|fribourg|solothurn|schaffhausen)\b/i],
  ['SE', /\b(sweden|stockholm)\b/i],
  ['NO', /\b(norway|oslo)\b/i],
  ['DK', /\b(denmark|copenhagen)\b/i],
  ['FI', /\b(finland|helsinki)\b/i],
  ['IN', /\b(india|bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai|ahmedabad|gujarat|noida|gurgaon|gurugram|kolkata|jaipur|indore|coimbatore|kochi|chandigarh|ghaziabad)\b/i],
  ['SG', /\b(singapore)\b/i],
  ['JP', /\b(japan|tokyo|osaka)\b/i],
  ['KR', /\b(south korea|seoul)\b/i],
  ['CN', /\b(china|shanghai|beijing|shenzhen)\b/i],
  ['HK', /\b(hong kong)\b/i],
  ['AE', /\b(uae|united arab emirates|dubai|abu dhabi)\b/i],
  ['SA', /\b(saudi arabia|riyadh|jeddah)\b/i],
  ['IL', /\b(israel|tel aviv)\b/i],
  ['BR', /\b(brazil|brasil|são paulo|sao paulo|rio de janeiro)\b/i],
  ['MX', /\b(mexico|méxico|cdmx|mexico city|guadalajara|monterrey)\b/i],
  ['AR', /\b(argentina|buenos aires)\b/i],
  ['CL', /\b(chile|santiago)\b/i],
  ['CO', /\b(colombia|bogot[aá]|medell[ií]n)\b/i],
  ['CR', /\b(costa rica|san jos[eé] cr)\b/i],
  ['ZA', /\b(south africa|cape town|johannesburg)\b/i],
  ['NG', /\b(nigeria|lagos)\b/i],
  ['KE', /\b(kenya|nairobi)\b/i],
  ['EG', /\b(egypt|cairo)\b/i],
  ['TR', /\b(turkey|türkiye|istanbul|ankara)\b/i],
  ['UA', /\b(ukraine|kyiv|kiev)\b/i],
  ['PH', /\b(philippines|manila)\b/i],
  ['ID', /\b(indonesia|jakarta)\b/i],
  ['TH', /\b(thailand|bangkok)\b/i],
  ['VN', /\b(vietnam|ho chi minh|hanoi)\b/i],
  ['MY', /\b(malaysia|kuala lumpur)\b/i],
  ['TW', /\b(taiwan|taipei)\b/i],
  ['PE', /\b(peru|lima)\b/i],
  ['BE', /\b(belgium|brussels|antwerp|ghent)\b/i],
  ['GR', /\b(greece|athens)\b/i],
  ['RO', /\b(romania|bucharest)\b/i],
  ['HU', /\b(hungary|budapest)\b/i],
  ['PK', /\b(pakistan|karachi|lahore|islamabad)\b/i],
  ['LK', /\b(sri lanka|colombo)\b/i],
  ['BD', /\b(bangladesh|dhaka)\b/i],
  ['GH', /\b(ghana|accra)\b/i],
  ['EE', /\b(estonia|tallinn)\b/i],
  ['LT', /\b(lithuania|vilnius)\b/i],
  ['LV', /\b(latvia|riga)\b/i],
  ['RS', /\b(serbia|belgrade)\b/i],
  ['HR', /\b(croatia|zagreb)\b/i],
  ['BG', /\b(bulgaria|sofia)\b/i],
  ['SK', /\b(slovakia|bratislava)\b/i],
  ['SI', /\b(slovenia|ljubljana)\b/i],
  // US metros. Deliberately LATE in the list: every country and city rule above
  // resolves first, so "London, ON" stays CA and "Birmingham UK" stays GB.
  // Omitted on purpose where the name is genuinely split across countries
  // (Manchester, Birmingham, Ontario, Vancouver) — an honest null beats a
  // confident mis-map, the same rule the title matcher runs on.
  ['US', /\b(new york|nyc|manhattan|brooklyn|queens ny|bronx|san francisco|bay area|silicon valley|los angeles|san diego|san jose|sacramento|chicago|boston|cambridge ma|seattle|bellevue wa|austin|dallas|houston|san antonio|denver|boulder|atlanta|miami|orlando|tampa|phoenix|scottsdale|philadelphia|pittsburgh|detroit|minneapolis|st\.? paul|nashville|charlotte|raleigh|durham nc|portland or|salt lake city|las vegas|kansas city|columbus oh|cleveland|cincinnati|indianapolis|milwaukee|st\.? louis|new orleans|baltimore|washington,? d\.?c\.?|arlington va|reston|mclean va)\b/i],
  // Last resort: "City, ST" with a US state abbreviation. Runs after every country/city
  // rule so "Berlin, DE" or "Toronto, ON" never falls through to it incorrectly.
  ['US', /,\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/],
];

/* Source-level ground truth, consulted ONLY when the location string yields
 * nothing. Measured 2026-08-05: 66,613 rows (45% of the corpus) had no country,
 * hiding ~15,000 US postings from every country-filtered surface. Two causes,
 * both structural rather than textual:
 *   - USAJOBS is the US federal jobs service. Every posting is US by
 *     definition, but rows like "Multiple Locations" resolve to nothing.
 *   - Adzuna queries one national market per request and encodes it in the
 *     external_id ("us:12345"), so the market is already banked in every row
 *     ever scraped — this recovers them without a re-scrape.
 * Location inference still runs FIRST: an Adzuna GB row located in Dublin is
 * honestly IE, and the source default must not overrule the specific fact. */
const ADZUNA_MARKET = /^([a-z]{2}):/;
export function sourceCountry(row) {
  if (!row) return null;
  if (row.source === 'usajobs') return 'US';
  if (row.source === 'jobroom') return 'CH';   // SECO's federal portal
  if (row.source === 'adzuna') {
    const m = ADZUNA_MARKET.exec(String(row.external_id ?? ''));
    return m ? m[1].toUpperCase() : null;
  }
  return null;
}

export function inferCountry(location) {
  if (!location) return null;
  const s = String(location);
  if (/^(worldwide|global|anywhere|remote)$/i.test(s.trim())) return null;
  for (const [code, re] of RULES) {
    if (re.test(s)) return code;
  }
  return null;
}
