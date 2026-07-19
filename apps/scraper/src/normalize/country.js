// Light country inference from freeform location strings. Null when honest doubt remains.

const RULES = [
  ['US', /\b(usa|u\.s\.a?\.?|united states|america)\b/i],
  ['GB', /\b(uk|u\.k\.|united kingdom|england|scotland|wales|london|manchester|birmingham uk)\b/i],
  ['CA', /\b(canada|toronto|vancouver|montreal|ottawa|calgary)\b/i],
  ['AU', /\b(australia|sydney|melbourne|brisbane|perth)\b/i],
  ['NZ', /\b(new zealand|auckland|wellington)\b/i],
  ['DE', /\b(germany|deutschland|berlin|munich|münchen|hamburg|frankfurt)\b/i],
  ['FR', /\b(france|paris|lyon)\b/i],
  ['ES', /\b(spain|españa|madrid|barcelona)\b/i],
  ['PT', /\b(portugal|lisbon|porto)\b/i],
  ['IT', /\b(italy|italia|milan|rome)\b/i],
  ['NL', /\b(netherlands|amsterdam|rotterdam)\b/i],
  ['IE', /\b(ireland|dublin)\b/i],
  ['PL', /\b(poland|warsaw|krakow|kraków|wroclaw)\b/i],
  ['CZ', /\b(czech|prague)\b/i],
  ['AT', /\b(austria|vienna)\b/i],
  ['CH', /\b(switzerland|zurich|zürich|geneva)\b/i],
  ['SE', /\b(sweden|stockholm)\b/i],
  ['NO', /\b(norway|oslo)\b/i],
  ['DK', /\b(denmark|copenhagen)\b/i],
  ['FI', /\b(finland|helsinki)\b/i],
  ['IN', /\b(india|bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai)\b/i],
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
  // Last resort: "City, ST" with a US state abbreviation. Runs after every country/city
  // rule so "Berlin, DE" or "Toronto, ON" never falls through to it incorrectly.
  ['US', /,\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/],
];

export function inferCountry(location) {
  if (!location) return null;
  const s = String(location);
  if (/^(worldwide|global|anywhere|remote)$/i.test(s.trim())) return null;
  for (const [code, re] of RULES) {
    if (re.test(s)) return code;
  }
  return null;
}
