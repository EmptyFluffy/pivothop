/* Second studio sourcing wave: boutique architecture + design firms, worldwide
 * with a deliberate Swiss weight. Probes the seven public ATS APIs we can read
 * (greenhouse, lever, ashby, workable, smartrecruiters, recruitee, personio)
 * and prints one SAMPLE posting per hit — title, location, URL — because the
 * first wave proved slugs collide with namesakes (recruitee:som was a Québec
 * call-center, greenhouse:athletics was the baseball team). Nothing enters a
 * config without that sample being read. */

const CANDIDATES = [
  // ── US boutique architecture ──
  ['KieranTimberlake', ['kierantimberlake'], 'US'],
  ['Steven Holl Architects', ['stevenholl', 'stevenhollarchitects'], 'US'],
  ['Diller Scofidio + Renfro', ['dsrny'], 'US'],
  ['WEISS/MANFREDI', ['weissmanfredi'], 'US'],
  ['Tod Williams Billie Tsien', ['twbta'], 'US'],
  ['Bohlin Cywinski Jackson', ['bcj', 'bohlincywinskijackson'], 'US'],
  ['Lake|Flato', ['lakeflato'], 'US'],
  ['Miller Hull', ['millerhull'], 'US'],
  ['Mithun', ['mithun'], 'US'],
  ['EHDD', ['ehdd'], 'US'],
  ['Brooks + Scarpa', ['brooksscarpa'], 'US'],
  ['Snow Kreilich', ['snowkreilich'], 'US'],
  ['WRNS Studio', ['wrnsstudio', 'wrns'], 'US'],
  ['Aidlin Darling', ['aidlindarling'], 'US'],
  ['Johnston Marklee', ['johnstonmarklee'], 'US'],
  ['Michael Maltzan', ['michaelmaltzan', 'mmaltzan'], 'US'],
  ['wHY Architecture', ['why', 'whyarchitecture'], 'US'],
  ['Gehry Partners', ['gehrypartners', 'foga'], 'US'],
  ['RAMSA', ['ramsa', 'robertamstern'], 'US'],
  ['Deborah Berke Partners', ['deborahberke', 'dbp'], 'US'],
  ['Beyer Blinder Belle', ['beyerblinderbelle', 'bbb'], 'US'],
  ['FXCollaborative', ['fxcollaborative'], 'US'],
  ['COOKFOX', ['cookfox'], 'US'],
  ['Marvel Architects', ['marvel', 'marveldesigns'], 'US'],
  ['WXY Studio', ['wxy', 'wxystudio'], 'US'],
  ['nARCHITECTS', ['narchitects'], 'US'],
  ['Perkins Eastman', ['perkinseastman'], 'US'],
  ['Ballinger', ['ballinger'], 'US'],
  ['Cooper Carry', ['coopercarry'], 'US'],
  ['Duda|Paine', ['dudapaine'], 'US'],
  ['Gould Evans', ['gouldevans'], 'US'],
  ['Behnisch Architekten', ['behnisch'], 'US'],
  ['Leddy Maytum Stacy', ['lmsarch', 'leddymaytum'], 'US'],
  ['Studio Ma', ['studioma'], 'US'],
  ['Ennead Architects', ['ennead', 'enneadarchitects'], 'US'],
  ['Snohetta NY', ['snohetta', 'snohettadesign'], 'US'],
  // ── Swiss architecture & engineering ──
  ['Christ & Gantenbein', ['christgantenbein'], 'CH'],
  ['EM2N', ['em2n'], 'CH'],
  ['Gigon/Guyer', ['gigonguyer', 'gigon-guyer'], 'CH'],
  ['Burckhardt+Partner', ['burckhardtpartner', 'burckhardt'], 'CH'],
  ['Itten+Brechbuehl', ['ittenbrechbuehl', 'ib'], 'CH'],
  ['Nissen Wentzlaff', ['nissenwentzlaff'], 'CH'],
  ['Diener & Diener', ['dienerdiener'], 'CH'],
  ['Boltshauser Architekten', ['boltshauser'], 'CH'],
  ['Miller & Maranta', ['millermaranta'], 'CH'],
  ['Buchner Bruendler', ['buchnerbruendler'], 'CH'],
  ['Bearth & Deplazes', ['bearthdeplazes'], 'CH'],
  ['Caruso St John', ['carusostjohn'], 'CH'],
  ['pool Architekten', ['poolarch', 'pool-architekten'], 'CH'],
  ['Adrian Streich', ['adrianstreich'], 'CH'],
  ['Theo Hotz Partner', ['theohotz'], 'CH'],
  ['Stuecheli Architekten', ['stuecheli'], 'CH'],
  ['Baumschlager Eberle', ['baumschlagereberle', 'be-arch'], 'CH'],
  ['Basler & Hofmann', ['baslerhofmann'], 'CH'],
  ['Emch+Berger', ['emchberger'], 'CH'],
  ['Rapp AG', ['rapp'], 'CH'],
  ['TBF + Partner', ['tbf'], 'CH'],
  ['Graber Pulver', ['graberpulver'], 'CH'],
  ['Enzmann Fischer', ['enzmannfischer'], 'CH'],
  // ── Swiss digital/design studios ──
  ['Hinderling Volkart', ['hinderlingvolkart', 'hv'], 'CH'],
  ['Liip', ['liip'], 'CH'],
  ['Unic', ['unic'], 'CH'],
  ['Ginetta', ['ginetta'], 'CH'],
  ['Dreipol', ['dreipol'], 'CH'],
  ['Feinheit', ['feinheit'], 'CH'],
  ['Superhuit', ['superhuit'], 'CH'],
  ['Enigma', ['enigma'], 'CH'],
  ['Merkle Schweiz', ['merkle', 'namics'], 'CH'],
  // ── European boutique design ──
  ['Studio Dumbar', ['studiodumbar'], 'NL'],
  ['Base Design', ['basedesign'], 'BE'],
  ['North', ['northdesign'], 'GB'],
  ['Made Thought', ['madethought'], 'GB'],
  ['Ragged Edge', ['raggededge'], 'GB'],
  ['DixonBaxi', ['dixonbaxi'], 'GB'],
  ['SomeOne', ['someone', 'someoneinlondon'], 'GB'],
  ['Output', ['output'], 'GB'],
  ['Bond Creative', ['bond', 'bondcreative'], 'FI'],
  ['Kurppa Hosk', ['kurppahosk'], 'SE'],
  ['Hey Studio', ['heystudio'], 'ES'],
  ['Mucho', ['mucho'], 'ES'],
  ['Snask', ['snask'], 'SE'],
  ['Bakken & Baeck', ['bakkenbaeck'], 'NO'],
  ['Design Studio (DS.Emotion?)', ['designstudio', 'wearedesignstudio'], 'GB'],
  ['OMSE', ['omse'], 'GB'],
  ['Otherway', ['otherway'], 'GB'],
  ['Only', ['onlystudio'], 'GB'],
  ['Nomo Studio', ['nomostudio'], 'ES'],
  // ── global boutique architecture ──
  ['Kengo Kuma', ['kengokuma', 'kkaa'], 'JP'],
  ['MAD Architects', ['madarchitects'], 'CN'],
  ['Dorte Mandrup', ['dortemandrup'], 'DK'],
  ['CF Moller', ['cfmoller'], 'DK'],
  ['C.F. Moller', ['cfmollerarchitects'], 'DK'],
  ['White Arkitekter', ['whitearkitekter', 'white'], 'SE'],
  ['Sweco Architects', ['sweco'], 'SE'],
  ['GXN / 3XN', ['gxn'], 'DK'],
  ['Powerhouse Company', ['powerhousecompany'], 'NL'],
  ['MVSA Architects', ['mvsa'], 'NL'],
  ['KCAP', ['kcap'], 'NL'],
  ['Benthem Crouwel', ['benthemcrouwel'], 'NL'],
  ['Barcode Architects', ['barcodearchitects'], 'NL'],
  ['ACME', ['acme'], 'GB'],
  ['Carmody Groarke', ['carmodygroarke'], 'GB'],
  ['dRMM', ['drmm'], 'GB'],
  ['Feilden Fowles', ['feildenfowles'], 'GB'],
  ['Jamie Fobert', ['jamiefobert'], 'GB'],
  ['Stanton Williams', ['stantonwilliams'], 'GB'],
  ['WilkinsonEyre', ['wilkinsoneyre'], 'GB'],
];

const UA = 'PivotHopScraper/0.1 (career adjacency; contact: hello@pivothop.com)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function j(url) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' }, signal: AbortSignal.timeout(9000) });
    if (!r.ok) return null;
    const ct = r.headers.get('content-type') || '';
    return ct.includes('json') ? await r.json() : await r.text();
  } catch { return null; }
}

const PROBES = {
  greenhouse: async (s) => {
    const b = await j(`https://boards-api.greenhouse.io/v1/boards/${s}/jobs`);
    const jb = b?.jobs?.[0];
    return b?.jobs?.length ? { n: b.jobs.length, sample: `${jb.title} @ ${jb.location?.name} | ${jb.absolute_url}` } : null;
  },
  lever: async (s) => {
    const b = await j(`https://api.lever.co/v0/postings/${s}?mode=json`);
    return Array.isArray(b) && b.length ? { n: b.length, sample: `${b[0].text} @ ${b[0].categories?.location} | ${b[0].hostedUrl}` } : null;
  },
  ashby: async (s) => {
    const b = await j(`https://api.ashbyhq.com/posting-api/job-board/${s}`);
    const jb = b?.jobs?.[0];
    return b?.jobs?.length ? { n: b.jobs.length, sample: `${jb.title} @ ${jb.location} | ${jb.jobUrl}` } : null;
  },
  workable: async (s) => {
    const b = await j(`https://apply.workable.com/api/v1/widget/accounts/${s}`);
    const jb = b?.jobs?.[0];
    return b?.jobs?.length ? { n: b.total ?? b.jobs.length, sample: `${jb.title} @ ${jb.city || jb.country} | ${jb.url}` } : null;
  },
  smartrecruiters: async (s) => {
    const b = await j(`https://api.smartrecruiters.com/v1/companies/${s}/postings`);
    const jb = b?.content?.[0];
    return b?.totalFound ? { n: b.totalFound, sample: `${jb.name} @ ${jb.location?.city} | company=${jb.company?.name}` } : null;
  },
  recruitee: async (s) => {
    const b = await j(`https://${s}.recruitee.com/api/offers/`);
    const jb = b?.offers?.[0];
    return b?.offers?.length ? { n: b.offers.length, sample: `${jb.title} @ ${jb.location} | company=${jb.company_name} | ${jb.careers_url}` } : null;
  },
  personio: async (s) => {
    const xml = await j(`https://${s}.jobs.personio.com/xml`);
    if (typeof xml !== 'string' || !xml.includes('<position>')) return null;
    const n = (xml.match(/<position>/g) || []).length;
    const name = (xml.match(/<name>([\s\S]*?)<\/name>/) || [])[1] || '';
    const office = (xml.match(/<office>([\s\S]*?)<\/office>/) || [])[1] || '';
    const sub = (xml.match(/<subcompany>([\s\S]*?)<\/subcompany>/) || [])[1] || '';
    return n ? { n, sample: `${name.trim()} @ ${office.trim()} | subcompany=${sub.trim()} | https://${s}.jobs.personio.com` } : null;
  },
};

const hits = [];
for (const [studio, slugs, market] of CANDIDATES) {
  let found = null;
  for (const slug of slugs) {
    for (const [ats, probe] of Object.entries(PROBES)) {
      const r = await probe(slug);
      await sleep(110);
      if (r) { found = { studio, market, ats, slug, ...r }; break; }
    }
    if (found) break;
  }
  if (found) { hits.push(found); console.error(`HIT  ${studio} [${found.market}] ${found.ats}:${found.slug} x${found.n}\n     ${found.sample.slice(0, 130)}`); }
  else console.error(`miss ${studio}`);
}
console.log(JSON.stringify(hits, null, 1));
