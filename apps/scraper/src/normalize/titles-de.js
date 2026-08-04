import { foldAccents } from './titles-i18n.js';

// Non-English title mapping, phase 2: German.
//
// WHY NOW. Job-Room made German the corpus's second language overnight: 29,930
// of 31,096 Swiss ads carry a German title (2026-08-04), and Adzuna's DE market
// plus Arbeitnow feed more. Before this layer, ~3% of Swiss titles mapped — the
// English-titled minority.
//
// GERMAN IS THE EASY CASE, WITH ONE TWIST. Unlike Romance titles (head-initial,
// needing reorder), German job titles are head-FINAL like English: "Senior
// Software Entwickler" translates word-for-word into English order. The twist is
// the compound: "Softwareentwickler" is one WORD whose head is its last morpheme.
// So the core move is compound splitting — recognise a known head suffix
// (-entwickler, -ingenieur, -leiter...), split it off, translate both halves,
// emit "software developer". The Swiss corpus adds its own noise: gender-
// inclusive endings (/-in, :in, *in, Fachfrau/Fachmann pairs), workload
// percentages (80-100%), and credential tags (EFZ, EBA, HF, NDS, dipl., eidg.).
//
// SAFETY, same contract as the Romance layer: this runs ONLY after English
// matching failed, and only returns a translation when a known German
// occupation word was actually recognised. English titles cannot regress
// through it. Translations target the English matcher's own synonym vocabulary
// ("registered nurse", not "nurse-ish"), so a translated title lands as an
// exact or phrase hit like any English title would.

// Swiss/German noise: credentials, workload, inclusivity markers, articles.
const NOISE_DE = /\b(efz|eba|eidg\.?|dipl\.?|diplomierte?r?|hf|fh|nds|ndk|das|cas|mas|bsc|msc|ba|ma|srk|ag|gmbh|per sofort|ab sofort|nach vereinbarung|gesucht|region|raum|stadt|kanton|und umgebung|m\/w\/d|w\/m\/d|m\/w|d\/f|h\/f|f\/h|\d{1,3}\s?%|\d{2,3}\s?[-–]\s?\d{2,3}\s?%)\b/g;
// leitender Arzt, stellvertretende Leiterin, erfahrene Architektin...
const SENIORITY_DE = /\b(leitende[rs]?|stellvertretende[rs]?|stv\.?|erfahrene[rs]?|senior|junior|chef-?)\b/g;

// Gender-inclusive spellings collapse to the base form BEFORE translation:
// Entwickler/in, Entwickler:in, Entwickler*in, Entwickler(in), Entwicklerin,
// Fachfrau / Fachmann pairs, Pflegefachfrau/-mann.
const GENDER_DE = [
  [/(\w+)\s*[/:*(]\s*-?in(nen)?\)?/g, '$1'],      // entwickler/in, :in, *in, (in)
  [/(\w+)\s*\/\s*-?(\w+)/g, '$1'],                 // fachfrau/fachmann -> fachfrau
  [/\bfachfrau\b|\bfachmann\b|\bfachperson\b/g, 'fachperson'],
];

// Whole-word translations. Occupation-bearing words (value !== null) set the
// recognition flag; the target strings are the English matcher's own synonyms.
const WORDS = {
  // healthcare
  pflegefachperson: 'registered nurse', pflegefachfrau: 'registered nurse', pflegefachmann: 'registered nurse',
  krankenpfleger: 'registered nurse', krankenschwester: 'registered nurse', pflegedienstleitung: 'registered nurse',
  arzt: 'physician', arztin: 'physician', facharzt: 'physician', facharztin: 'physician',
  oberarzt: 'physician', oberarztin: 'physician', assistenzarzt: 'physician', allgemeinarzt: 'physician',
  apotheker: 'pharmacist', apothekerin: 'pharmacist',
  physiotherapeut: 'physical therapist', physiotherapeutin: 'physical therapist',
  psychologe: 'psychologist', psychologin: 'psychologist',
  ernahrungsberater: 'dietitian',
  // trades
  elektroinstallateur: 'electrician', elektriker: 'electrician', netzelektriker: 'electrician',
  sanitarinstallateur: 'plumber', klempner: 'plumber',
  heizungsinstallateur: 'hvac technician',
  schreiner: 'carpenter', tischler: 'carpenter', zimmermann: 'carpenter', zimmerer: 'carpenter',
  schweisser: 'welder',
  solarmonteur: 'solar installer', solarinstallateur: 'solar installer',
  bauleiter: 'construction manager', baufuhrer: 'construction manager', baupolier: 'construction manager',
  statiker: 'structural engineer',
  bauingenieur: 'civil engineer',
  hochbauzeichner: 'architectural drafter', bauzeichner: 'architectural drafter',
  architekt: 'architect', architektin: 'architect',
  innenarchitekt: 'interior designer',
  landschaftsarchitekt: 'landscape architect',
  vermessungsingenieur: 'surveyor',
  // business & office
  buchhalter: 'accountant', finanzbuchhalter: 'accountant', lohnbuchhalter: 'accountant',
  wirtschaftsprufer: 'auditor',
  rechtsanwalt: 'lawyer', anwalt: 'lawyer', anwaltin: 'lawyer', jurist: 'lawyer', juristin: 'lawyer',
  verkaufer: 'sales representative', verkauferin: 'sales representative',
  aussendienstmitarbeiter: 'sales representative',
  personalberater: 'recruiter', personalvermittler: 'recruiter', rekrutierer: 'recruiter',
  ubersetzer: 'translator', ubersetzerin: 'translator', dolmetscher: 'translator',
  journalist: 'journalist', journalistin: 'journalist',
  grafiker: 'graphic designer', grafikerin: 'graphic designer',
  fotograf: 'photographer', fotografin: 'photographer',
  lehrer: 'teacher', lehrerin: 'teacher', lehrperson: 'teacher',
  professor: 'professor', professorin: 'professor',
  bibliothekar: 'librarian', bibliothekarin: 'librarian',
  sozialarbeiter: 'social worker', sozialpadagoge: 'social worker', sozialpadagogin: 'social worker',
  koch: 'cook', kochin: 'cook',
  polizist: 'police officer', polizistin: 'police officer',
  immobilienmakler: 'real estate agent',
  // tech
  informatiker: 'software developer', programmierer: 'software developer',
  systemadministrator: 'systems administrator',
  netzwerkadministrator: 'network engineer',
  datenbankadministrator: 'database administrator',
  wissenschaftler: 'scientist', forscher: 'research scientist',
  // standalone heads: "Senior Java Entwickler" spells the compound as two words
  entwickler: 'developer', ingenieur: 'engineer', techniker: 'technician',
  konstrukteur: 'design engineer', berater: 'consultant', mechaniker: 'mechanic',
};

// Compound HEAD suffixes: the last morpheme names the occupation class. Longest
// first so "mechatroniker" wins over "techniker" over "iker".
const HEADS = [
  ['mechatroniker', 'technician'],
  ['installateur', 'installer'],
  ['wissenschaftler', 'scientist'],
  ['administrator', 'administrator'],
  ['koordinator', 'coordinator'],
  ['entwickler', 'developer'],
  ['konstrukteur', 'design engineer'],
  ['controller', 'controller'],
  ['buchhalter', 'accountant'],
  ['ingenieur', 'engineer'],
  ['mechaniker', 'mechanic'],
  ['techniker', 'technician'],
  ['spezialist', 'specialist'],
  ['assistent', 'assistant'],
  ['therapeut', 'therapist'],
  ['designer', 'designer'],
  ['berater', 'consultant'],
  ['manager', 'manager'],
  ['analyst', 'analyst'],
  ['planer', 'planner'],
  ['zeichner', 'drafter'],
  ['monteur', 'installer'],
  ['leiter', 'manager'],
  ['lehrer', 'teacher'],
];

// Compound PREFIX (modifier) translations. Unknown prefixes pass through
// verbatim — "Java" in "Javaentwickler" needs no translation.
const PREFIX = {
  software: 'software', web: 'web', informatik: 'it', system: 'system', daten: 'data',
  datenbank: 'database', netzwerk: 'network', sicherheit: 'security', anwendung: 'application',
  elektro: 'electrical', elektronik: 'electronics', bau: 'construction', hochbau: 'construction',
  tiefbau: 'civil', architektur: 'architectural', maschinen: 'mechanical', maschine: 'mechanical',
  wirtschaft: 'business', finanz: 'finance', personal: 'hr', vertrieb: 'sales', verkauf: 'sales',
  einkauf: 'procurement', marketing: 'marketing', produkt: 'product', projekt: 'project',
  kunden: 'customer', qualitat: 'quality', betrieb: 'operations', umwelt: 'environmental',
  energie: 'energy', chemie: 'chemical', medizin: 'medical', pflege: 'nursing',
  sozial: 'social', immobilien: 'real estate', versicherung: 'insurance', steuer: 'tax',
  recht: 'legal', automobil: 'automotive', fahrzeug: 'automotive', gebaude: 'building',
  landschaft: 'landscape', ernahrung: 'nutrition', labor: 'lab', logistik: 'logistics',
  maschinenbau: 'mechanical', elektrotechnik: 'electrical', bauwesen: 'construction',
  verfahren: 'process', wirtschaftsinformatik: 'business it', gesundheit: 'health',
};

// Modifier words translated in place WITHOUT counting as occupation recognition
// ("finanzen" alone is not a job; "Leiter Finanzen" becomes one via the reorder).
const MODIFIERS = {
  finanzen: 'finance', finanz: 'finance', technische: 'technical', technischer: 'technical',
  klinische: 'clinical', digitale: 'digital', gesundheit: 'health', verkauf: 'sales',
  einkauf: 'procurement', kommunikation: 'communications', entwicklung: 'development',
};

/** @returns {string|null} English title, or null when no German occupation word was recognised. */
export function translateGerman(rawTitle) {
  let t = foldAccents(String(rawTitle).toLowerCase()).replace(/ß/g, 'ss');
  for (const [re, rep] of GENDER_DE) t = t.replace(re, rep);
  t = t.replace(/\(.*?\)/g, ' ')
    .replace(NOISE_DE, ' ')
    .replace(SENIORITY_DE, ' ')
    .replace(/[^a-z0-9+#\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t) return null;

  let recognised = false;
  const out = [];
  for (const word of t.split(' ')) {
    if (WORDS[word] !== undefined) { out.push(WORDS[word]); recognised = true; continue; }
    let split = null;
    for (const [head, en] of HEADS) {
      if (word.endsWith(head) && word.length >= head.length + 3) {
        const raw = word.slice(0, -head.length).replace(/s$/, ''); // Fugen-s: sicherheits-, betriebs-
        const known = PREFIX[raw];
        split = `${known ?? raw} ${en}`;
        // Recognition requires a KNOWN prefix. An unknown one emits the split
        // for readability but does not fire the layer: "Polymechaniker" became
        // "poly mechanic" and the bare word "mechanic" is a containment magnet
        // that dragged precision machinists onto automotive-technician
        // (caught in the 2026-08-04 false-positive audit). Honest miss instead.
        if (known) recognised = true;
        break;
      }
    }
    if (split) { out.push(split); continue; }
    out.push(MODIFIERS[word] ?? word);
  }

  let en = out.join(' ');
  // German head-initial patterns that DO need reorder: "Leiter Finanzen" is a
  // finance manager, "Fachperson Betreuung" a care specialist. A successful
  // reorder IS occupation recognition — the pattern itself names the job class.
  // Reorder recognition has the same bar: the remainder must be a word this
  // layer itself translated ("Leiter Finanzen" -> "finance manager"), because
  // "<untranslated> manager" is another magnet ("Leiter Lüftung" was landing on
  // project-manager through the bare word "manager").
  const KNOWN_EN = new Set([...Object.values(MODIFIERS), ...Object.values(PREFIX)]);
  const m2 = en.match(/^(?:leiter|leitung) (.+)$/) || en.match(/^fachperson (.+)$/);
  if (m2 && m2[1].split(' ').every((w) => KNOWN_EN.has(w))) {
    en = en.startsWith('fachperson') ? `${m2[1]} specialist` : `${m2[1]} manager`;
    recognised = true;
  }
  if (!recognised) return null;
  return en;
}
