import path from 'node:path';
import { readJson } from '../lib/store.js';
import { TAXONOMY_DIR } from '../lib/paths.js';
import { foldAccents, translateRomance } from './titles-i18n.js';
import { translateGerman } from './titles-de.js';

// Rules-first title canonicalization against the occupation taxonomy.
// Every unmapped title is logged for review — the synonym tables grow from that log.

// NB: "assistant" and "associate" are deliberately NOT stripped — they are load-bearing
// nouns in real occupations (Medical Assistant, Teaching Assistant, Accounts Assistant,
// Research Associate). The phrase matcher still recovers the head noun of "Assistant
// Project Manager" by containment, so keeping them costs nothing and saves whole occupations.
const SENIORITY = /\b(senior|sr\.?|junior|jr\.?|lead|principal|staff|chief|head of|head|intern|entry[- ]?level|mid[- ]?level|graduate|trainee|apprentice|expert|specialist i{1,3}|i{1,3}|iv|v|\d+)\b/g;
// "remote" is a work-arrangement modifier everywhere EXCEPT before "pilot": a
// Remote Pilot is the FAA's term for a drone operator, and stripping the word
// turned "Remote Pilot Operator" into "pilot operator", which then matched the
// airline occupation. A generic noise-word list eating domain vocabulary is the
// trap here; the lookahead is narrow on purpose.
//
// "contract" stays unguarded deliberately. It IS employment type in the common
// case — "Contract Visual Designer" should map to the designer — and the minority
// where it is the subject ("Contract Manager") has no occupation to land on
// anyway, so guarding it would buy unmapped rows rather than correct ones.
const NOISE = /\b(remote(?! pilot)|hybrid|onsite|on-site|contract|contractor|freelance|part[- ]?time|full[- ]?time|temporary|temp|permanent|urgent|immediate|new|now hiring|work from home|wfh|m\/f\/d|f\/m\/d|h\/f)\b/g;

function cleanSegment(t) {
  // Fold accents BEFORE the character filter. The filter maps every non-ASCII
  // byte to a space, so "médico" used to become "m dico" and "Ingénieur Système"
  // three fragments — and the accented and unaccented spellings of one word could
  // never match each other, though the corpus carries both.
  t = foldAccents(t).replace(NOISE, ' ').replace(SENIORITY, ' ');
  t = t.replace(/[^a-z0-9&/+.# ]/g, ' ').replace(/\s+/g, ' ').trim();
  return t;
}

export function cleanTitle(raw) {
  let t = String(raw).toLowerCase();
  t = t.replace(/\(.*?\)/g, ' ');            // parentheticals
  t = t.split(/ [-–—|@] | at |, /)[0];       // location/company tails
  return cleanSegment(t);
}

// All dash/comma/slash segments, cleaned individually. Corporate titles often lead
// with the practice or program name ("AI and Data - Data Architect", "Specialist,
// Global Exhibits Advisor", "Graphic Designer/Illustrator") — when the head segment
// maps to nothing, the tail segments usually carry the real occupation.
function titleSegments(raw) {
  const t = String(raw).toLowerCase().replace(/\(.*?\)/g, ' ');
  return t.split(/ [-–—|@] | at |, |\//).map(cleanSegment).filter(Boolean);
}

let matcher = null;

function buildMatcher() {
  const { occupations } = readJson(path.join(TAXONOMY_DIR, 'occupations.json'));
  const exact = new Map();       // cleaned synonym -> slug
  const phrases = [];            // [{phrase, slug}] for containment, longest first
  for (const occ of occupations) {
    // exactOnly synonyms map only on an exact title match, never by containment.
    // For heavily-suffixed role words like "architect" (AI Architect, SOC Architect,
    // Enablement Architect…) containment would be a magnet that pollutes the vertical;
    // exact-only means bare "Architect" maps here and every "X Architect" must earn a
    // specific phrase or fall through to unmapped.
    // Synonyms pass through the same character cleaning as titles — otherwise a
    // hyphenated synonym ("front-end engineer") is a dead key that no cleaned
    // title (hyphens stripped) can ever reach.
    const normSyn = (s) => foldAccents(s.toLowerCase()).replace(/[^a-z0-9&/+.# ]/g, ' ').replace(/\s+/g, ' ').trim();
    const exactOnly = new Set((occ.exactOnly ?? []).map(normSyn));
    for (const syn of [occ.title.toLowerCase(), ...occ.synonyms, ...(occ.exactOnly ?? [])]) {
      const c = normSyn(syn);
      if (!exact.has(c)) exact.set(c, occ.slug);
      if (!exactOnly.has(c)) phrases.push({ phrase: c, slug: occ.slug });
    }
  }
  phrases.sort((a, b) => b.phrase.length - a.phrase.length);
  return { exact, phrases, occupations };
}

export function getTaxonomy() {
  if (!matcher) matcher = buildMatcher();
  return matcher;
}

// Tier-noun tails. English job titles are head-final: the last noun IS the job.
// "Physician Assistant" is an assistant, "Pharmacy Technician" is a technician —
// neither is the professional whose name they contain. A containment match that
// does not cover a tail from this set is a cross-tier trap and is rejected
// (prefix ranks like "Assistant General Counsel" are unaffected — their tail is
// the profession). Exact synonym matches bypass the guard by construction.
const TIER_TAIL = new Set([
  'assistant', 'aide', 'technician', 'tech', 'orderly', 'liaison', 'recruiter',
  'scheduler', 'biller', 'coder', 'clerk', 'receptionist', 'secretary',
  'transporter', 'courier',
]);

// French/German "Chef" is a boss, not a cook — the first cross-language false
// friend the Swiss corpus surfaced (2026-08-03: 86 Job-Room rows on `chef`, and
// "Chef de projet" is a project manager, "Chef d'équipe" a team lead, "Chef de
// rang" a waiter rank). Refused: chef/cheffe + de/du/d' + anything non-culinary
// (cuisine and partie stay, they ARE cook titles), "chef comptable"/"chef
// monteur" (French head-X without de), and the German inclusive "Chef/-in".
// English culinary titles ("Sous Chef", "Executive Chef", bare "Chef") are
// untouched: none of them puts a complement after the word. Same call as Night
// Auditor — an honest miss beats a confident mis-map; these become correct
// again when the multilingual miner maps them to what they actually are.
const CHEF_LEAD = new RegExp([
  String.raw`\bchef(?:[/\s]?fes?)?s?\s+(?:ou\s+chef(?:[/\s]?fes?)?s?\s+)?d(?:[eu])?\b(?!\s+(?:cuisine|partie)\b)`,
  String.raw`\bchef(?:[/\s]?fes?)?s?\s+(?:comptable|monteur)\b`,
  String.raw`\bstv\.?\s*chef\b`,
  String.raw`\bchef\s*/\s*-?\s*in\b`,
].join('|'));

function matchOne(m, cleaned) {
  if (!cleaned) return null;
  if (CHEF_LEAD.test(cleaned)) return null;
  const hitExact = m.exact.get(cleaned);
  if (hitExact) return { slug: hitExact, method: 'exact' };
  // containment on word boundaries — longest synonym wins
  const padded = ` ${cleaned} `;
  const tail = cleaned.slice(cleaned.lastIndexOf(' ') + 1);
  const guarded = TIER_TAIL.has(tail);
  for (const { phrase, slug } of m.phrases) {
    if (phrase.length < 4) continue;
    const at = padded.indexOf(` ${phrase} `);
    if (at === -1) continue;
    if (guarded && !` ${phrase} `.includes(` ${tail} `)) continue; // head-noun guard
    // Next-token guard: "Physician Assistant Primary Care" — the tier noun sits
    // right after the matched phrase, not at the end. Same trap, same rejection.
    const next = padded.slice(at + phrase.length + 2).trim().split(/[^a-z0-9+#]+/)[0] || '';
    if (TIER_TAIL.has(next) && !` ${phrase} `.includes(` ${next} `)) continue;
    return { slug, method: 'phrase' };
  }
  return null;
}

// Titles that contain a real synonym but denote an occupation we do not carry.
// Containment would land them on the wrong vertical, so they are refused outright
// and stay unmapped — the same call as "Técnico Mecánico": an honest miss beats a
// confident mis-map.
//
// A "Night Auditor" is a hotel front-desk role that reconciles the day's folios.
// It was 120 of 1,295 `auditor` postings (9.3%), dragging guest relations, front
// office and hotel operations into the financial auditor's skill profile — and
// from there into its adjacency. There is no front-desk occupation to move it to,
// so it maps to nothing until there is.
// Unanchored so "Hotel Night Auditor" and "Front Desk Night Auditor" are caught
// too; the leading \b keeps "Overnight Auditor" out of it.
//
// "Remote Pilot Operator" is FAA terminology too — they fly simulated aircraft so
// trainee controllers have traffic to work, at facilities the postings name by
// identifier (CLT, ZME, D01, S46). Not a drone pilot and not an airline pilot; it
// was landing on `pilot` before the "remote pilot" fix below and on `drone-pilot`
// after, so it needs refusing rather than rerouting.
const NEVER = /\bnight audit(or|ing|s)?\b|\bremote pilot operator\b/;

// Software-architect disambiguation. The building `architect` synonym is
// exactOnly, which blocks CONTAINMENT — but segmentation plus seniority
// stripping still reduced "Principal Architect - Solutions" and "Lead
// Architect" to the bare word, an EXACT hit on the building profession
// (caught on the live board 2026-08-05: data/solutions architects filed under
// buildings). Industry convention is the rule: unqualified "Architect" is the
// building profession; software architects always carry a qualifier. When a
// tech qualifier is present, the building slug is refused and the title
// reroutes to the occupation it names — or an honest null.
const TECH_ARCH = /(data|solutions?|cloud|enterprise|software|platform|security|integration|infrastructure|network|application|api|devops|iot|blockchain|java|aws|azure|gcp|salesforce|sap|erp|crm|technical|ml|ai)[\s-]+architect|architecte?s?\s*[-\u2013\u2014:/]\s*(data|solutions?|cloud|software)|\b(founding|data|software|cloud|devops|backend|frontend|full[ -]?stack|machine learning) engineer\b/i;

/** @returns {{slug:string, method:string}|null} */
export function mapTitle(rawTitle) {
  const m = getTaxonomy();
  const primary = cleanTitle(rawTitle);
  if (NEVER.test(primary)) return null;
  const techArch = TECH_ARCH.test(String(rawTitle));
  const guard = (hit) => (hit && hit.slug === 'architect' && techArch ? null : hit);
  // Whole-title check: segmentation splits "Chef/fe de projet" at the slash and
  // hands matchOne a bare "chef" segment, so the guard must also see the intact
  // title before any segment can match.
  if (CHEF_LEAD.test(primary)) return null;
  const first = guard(matchOne(m, primary));
  if (first) return first;
  // Head segment mapped to nothing — try the remaining segments before giving up.
  for (const seg of titleSegments(rawTitle)) {
    if (seg === primary) continue;
    const hit = guard(matchOne(m, seg));
    if (hit) return { slug: hit.slug, method: 'segment' };
  }
  // Last tier: the title may not be English. translateRomance returns null unless
  // it recognised an actual Spanish/Portuguese occupation head, so this can only
  // fire on titles the English tiers had already given up on — English mapping
  // cannot regress through it. See titles-i18n.js.
  const en = translateRomance(rawTitle);
  if (en) {
    const hit = matchOne(m, cleanTitle(en)) ?? matchOne(m, cleanSegment(en));
    if (hit) return { slug: hit.slug, method: 'i18n' };
  }
  // German, same contract: fires only when a German occupation word was
  // recognised, so English titles cannot regress through it. See titles-de.js.
  const de = translateGerman(rawTitle);
  if (de) {
    const hit = guard(matchOne(m, cleanTitle(de)) ?? matchOne(m, cleanSegment(de)));
    if (hit) return { slug: hit.slug, method: 'de' };
  }
  // The guard refused the building slug; give the title its REAL occupation
  // when the qualifier names one, else an honest miss.
  if (techArch && /architect/i.test(String(rawTitle))) {
    if (/data[\s-]+architect/i.test(String(rawTitle))) return { slug: 'data-architect', method: 'disambig' };
    // any other tech qualifier (java, aws, sap, security...) is the solutions
    // family by industry convention
    return { slug: 'solutions-architect', method: 'disambig' };
  }
  return null;
}
