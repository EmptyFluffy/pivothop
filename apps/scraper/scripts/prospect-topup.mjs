/* Queue top-up: keeps config/prospect-queue.json from running dry.
 *
 * The prospector (prospect.mjs) drains a hand-built queue. Hand-built queues
 * end: on 2026-08-21 it held 125 untried candidates, ten nights of runway, and
 * discovery would then have stopped silently with the nightly still printing a
 * cheerful "nothing to do". This refills it from OpenStreetMap, which is where
 * boutique practices actually are — 4,866 `office=architect` nodes worldwide
 * carry both a name and a website, against a fleet of 260. The famous firms
 * were already curated by hand; this seam is the long tail, which is the part
 * that posts the small studio jobs.
 *
 * Nothing here admits anything. Every harvested firm is only a CANDIDATE and
 * still has to pass the same docs/33 rules in prospect.mjs (careers link on the
 * firm's own registrable domain, careers-ish landing URL, no auto-admit on a
 * hosted ATS). This script's only job is to hand that gate more work, cheaply,
 * without ever handing it the same firm twice.
 *
 * Regions are drained in a fixed rotation with a tracked cursor, and each run's
 * harvest is INTERLEAVED across the regions it pulled, so the queue never
 * becomes a solid block of one country. Germany alone has 1,090 candidates and
 * would otherwise bury the 679 US ones for a month. The per-occupation country
 * ceiling in build-jobs.py (COUNTRY_SHARE 0.65) protects the board itself; this
 * protects the ORDER OF EFFORT, which that ceiling cannot see.
 *
 *   node apps/scraper/scripts/prospect-topup.mjs              # top up if shallow
 *   node apps/scraper/scripts/prospect-topup.mjs --force      # always harvest
 *   TOPUP_MIN=400 TOPUP_REGIONS=4 node ...prospect-topup.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CONFIG = path.join(ROOT, 'apps/scraper/config');
const QUEUE = path.join(CONFIG, 'prospect-queue.json');
const STATE = path.join(CONFIG, 'prospect-state.json');
const CURSOR = path.join(CONFIG, 'prospect-topup-state.json');
const AUTO = path.join(CONFIG, 'direct-companies-auto.json');
const CURATED = path.join(CONFIG, 'direct-companies.json');

// Keep the queue at least this deep in UNTRIED candidates. At PROSPECT_PER_NIGHT
// this is the runway in nights; below it, we harvest.
const MIN_DEPTH = Number(process.env.TOPUP_MIN || 400);
const REGIONS_PER_RUN = Number(process.env.TOPUP_REGIONS || 3);
const FORCE = process.argv.includes('--force');
const ONLY = (process.argv.find((a) => a.startsWith('--regions=')) || '').slice(10)
  .split(',').map((s) => s.trim()).filter(Boolean);

/* The rotation. English-language markets first because that is where the board's
 * readers are, then the dense European seams. US and DE are split by state and
 * Bundesland: a whole-country Overpass query for either times out on the public
 * instance, and a smaller slice also keeps one run's harvest to a sane size. */
const ROTATION = [
  ['US-NY', 'ISO3166-2'], ['GB-ENG', 'ISO3166-2'], ['US-CA', 'ISO3166-2'],
  ['CA', 'ISO3166-1'],    ['AU', 'ISO3166-1'],     ['US-IL', 'ISO3166-2'],
  ['US-TX', 'ISO3166-2'], ['US-MA', 'ISO3166-2'],  ['US-WA', 'ISO3166-2'],
  ['IE', 'ISO3166-1'],    ['NL', 'ISO3166-1'],     ['US-CO', 'ISO3166-2'],
  ['US-OR', 'ISO3166-2'], ['US-PA', 'ISO3166-2'],  ['US-FL', 'ISO3166-2'],
  ['DK', 'ISO3166-1'],    ['NO', 'ISO3166-1'],     ['SE', 'ISO3166-1'],
  ['BE', 'ISO3166-1'],    ['AT', 'ISO3166-1'],     ['CH', 'ISO3166-1'],
  ['DE-BE', 'ISO3166-2'], ['DE-HH', 'ISO3166-2'],  ['DE-BY', 'ISO3166-2'],
  ['DE-NW', 'ISO3166-2'], ['DE-BW', 'ISO3166-2'],  ['DE-HE', 'ISO3166-2'],
  ['DE-SN', 'ISO3166-2'], ['DE-NI', 'ISO3166-2'],  ['DE-RP', 'ISO3166-2'],
  ['FR-IDF', 'ISO3166-2'],['ES-MD', 'ISO3166-2'],  ['ES-CT', 'ISO3166-2'],
  ['IT-25', 'ISO3166-2'], ['IT-62', 'ISO3166-2'],  ['PT', 'ISO3166-1'],
  ['NZ', 'ISO3166-1'],    ['FI', 'ISO3166-1'],     ['PL', 'ISO3166-1'],
];

/* office=architect is the seam. The design-adjacent tags come along because the
 * board covers interior-designer and ffe-specialist thinly (docs/33), and those
 * roles are posted by exactly these studios. */
const TAGS = [
  ['office', 'architect'],
  ['office', 'interior_design'],
  ['office', 'graphic_design'],
];

// NOT overpass.osm.ch: that instance holds Switzerland only, so for any other
// region it returns a valid empty result and would "confirm" the region as
// genuinely empty (US-TX read as 0 twice this way before it was dropped).
const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

/* Names that are a trade, not a practice. These would each cost a Playwright
 * render to reject, and OSM's architect tag is loose enough that they are a
 * steady fraction of it ("Apartment Renovation NYC" sat in the Manhattan
 * sample). Conservative on purpose: the prospector is the real gate, so a
 * false veto here costs a studio and a false pass costs seven seconds. */
const NAME_VETO = /\b(renovation|remodel(?:ing|ling)?|contractor|handyman|roofing|plumbing|hvac|realty|real estate|property management|mortgage|insurance|storage|self.?storage|kitchen|bathroom|window|garage|fence|landscap(?:ing) (?:service|maintenance)|lawn|pest|cleaning|moving|surveyor|notar|steuerberat|rechtsanwalt|versicherung|immobilien|makler)\b/i;

/* office=graphic_design in OSM is mostly PRINT SHOPS, not design studios (the
 * first harvest surfaced "One Stop Copy Shop" and "Island Laser Works" under
 * it). And plain builders tagged office=architect post site-manager roles, not
 * studio roles — vetoed unless the name itself also says architect/design
 * studio ("Zohrabians Architects and Builders" stays, "Kenwood Builders"
 * goes). */
const PRINT_VETO = /\b(copy|print(?:ing|s)?|sign(?:s|age)|laser|engraving|embroidery|trophies|trophy|banner|t-?shirts?|vinyl|reprographic)\b/i;
const BUILDER = /\b(builders?|construction|constructors?)\b/i;
const STUDIO_SIGNAL = /\b(architect|architecture|architekt|architectes?|arquitect|design studio|interior)\b/i;

/* Social and directory URLs are not a firm's own domain, and the prospector
 * requires the careers link to live on the registrable domain it started from.
 * Feeding it a Facebook page guarantees a wasted render. */
const URL_VETO = /(facebook|instagram|twitter|x\.com|linkedin|youtube|tiktok|pinterest|behance|houzz|yelp|google\.|goo\.gl|wixsite|weebly|blogspot|wordpress\.com|business\.site|herokuapp|godaddysites|jimdo|squarespace\.com\/|myshopify)/i;

function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}

function regDomain(u) {
  try {
    const h = new URL(u).hostname.replace(/^www\./, '').toLowerCase();
    const parts = h.split('.');
    if (parts.length < 2) return null;
    const twoLevel = /^(co|com|org|net|ac|gov|edu)\.[a-z]{2}$/.test(parts.slice(-2).join('.'));
    return parts.slice(twoLevel ? -3 : -2).join('.');
  } catch { return null; }
}

function normUrl(raw) {
  if (!raw) return null;
  let u = String(raw).trim().split(/[;, ]/)[0];
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) {
    if (/^\/\//.test(u)) u = 'https:' + u;
    else if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(u)) u = 'https://' + u;
    else return null;
  }
  try {
    const p = new URL(u);
    if (!/^https?:$/.test(p.protocol)) return null;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(p.hostname)) return null;
    // The homepage is what prospect.mjs wants; it finds the careers link itself.
    return p.origin;
  } catch { return null; }
}

function cleanName(n) {
  return String(n).replace(/\s+/g, ' ').trim().slice(0, 80);
}

async function overpass(query) {
  let lastErr = 'no attempt';
  for (const url of MIRRORS) {
    try {
      const res = await fetch(url + '?data=' + encodeURIComponent(query), {
        headers: { 'User-Agent': 'PivotHop-prospector/1.0 (studio sourcing; contact via pivothop.com)' },
        signal: AbortSignal.timeout(180000),
      });
      const text = await res.text();
      if (!text.trim().startsWith('{')) { lastErr = `non-json from ${url}`; continue; }
      const els = JSON.parse(text).elements || [];
      // An overloaded mirror answers with valid JSON and an EMPTY element list,
      // which is indistinguishable from a genuinely empty region unless you ask
      // someone else. US-CA came back 0 on the first harvest and 194 on a direct
      // retry; without this, that silently reads as "California has no studios"
      // and the region is not revisited for a full rotation.
      if (els.length) return els;
      lastErr = `empty result from ${url}`;
    } catch (e) { lastErr = `${url}: ${String(e.message).slice(0, 60)}`; }
  }
  // All mirrors agreed it is empty: report empty rather than failing the run.
  if (/^empty result/.test(lastErr)) return [];
  throw new Error(lastErr);
}

async function harvest(code, scheme) {
  const sel = TAGS.map(([k, v]) => `nwr["${k}"="${v}"]["name"](area.a);`).join('');
  const q = `[out:json][timeout:170];area["${scheme}"="${code}"]->.a;(${sel});out tags;`;
  const els = await overpass(q);
  const out = [];
  for (const e of els) {
    const t = e.tags || {};
    const name = cleanName(t.name || '');
    const url = normUrl(t.website || t['contact:website'] || t.url);
    if (!name || name.length < 3 || !url) continue;
    if (NAME_VETO.test(name)) continue;
    if (PRINT_VETO.test(name)) continue;
    if (BUILDER.test(name) && !STUDIO_SIGNAL.test(name)) continue;
    if (URL_VETO.test(url)) continue;
    out.push([name, url]);
  }
  return out;
}

// ---- run ----------------------------------------------------------------

const queue = readJson(QUEUE, []);
const tried = readJson(STATE, { tried: {} }).tried || {};
const cursor = readJson(CURSOR, { next: 0, drained: {} });
const fleet = [
  ...(readJson(CURATED, { companies: [] }).companies || []),
  ...(readJson(AUTO, { companies: [] }).companies || []),
];

const untried = queue.filter(([n]) => !tried[n]).length;
if (!FORCE && untried >= MIN_DEPTH) {
  console.log(`topup: queue has ${untried} untried (>= ${MIN_DEPTH}) — nothing to do`);
  process.exit(0);
}

// Every domain and name we already know about, from any of the three files.
const seenDomains = new Set();
const seenNames = new Set();
for (const [n, u] of queue) { seenNames.add(n.toLowerCase()); const d = regDomain(u); if (d) seenDomains.add(d); }
for (const n of Object.keys(tried)) seenNames.add(n.toLowerCase());
for (const c of fleet) { const d = regDomain(c.careers || c.url || ''); if (d) seenDomains.add(d); }

const picked = [];
let idx = cursor.next || 0;
const plan = ONLY.length
  ? ONLY.map((c) => ROTATION.find(([r]) => r === c) || [c, c.includes('-') ? 'ISO3166-2' : 'ISO3166-1'])
  : null;
const runs = plan ? plan.length : Math.min(REGIONS_PER_RUN, ROTATION.length);
for (let n = 0; n < runs; n++) {
  const [code, scheme] = plan ? plan[n] : ROTATION[idx % ROTATION.length];
  if (!plan) idx++;
  try {
    const rows = await harvest(code, scheme);
    const fresh = [];
    for (const [name, url] of rows) {
      const d = regDomain(url);
      if (!d || seenDomains.has(d) || seenNames.has(name.toLowerCase())) continue;
      seenDomains.add(d); seenNames.add(name.toLowerCase());
      fresh.push([name, url]);
    }
    cursor.drained[code] = { date: new Date().toISOString().slice(0, 10), found: rows.length, fresh: fresh.length };
    console.log(`topup: ${code.padEnd(7)} ${String(rows.length).padStart(4)} tagged  ${String(fresh.length).padStart(4)} new`);
    picked.push(fresh);
  } catch (e) {
    console.log(`topup: ${code.padEnd(7)} FAILED  ${String(e.message).slice(0, 70)}`);
    picked.push([]);
  }
}

// Interleave, so one dense region never forms a solid block at the head.
const merged = [];
for (let i = 0; merged.length < picked.reduce((n, p) => n + p.length, 0); i++) {
  for (const p of picked) if (i < p.length) merged.push(p[i]);
}

if (!plan) cursor.next = idx % ROTATION.length;   // a targeted run must not move the rotation
fs.writeFileSync(CURSOR, JSON.stringify(cursor, null, 1) + '\n');

if (!merged.length) {
  console.log('topup: no new candidates this run');
  process.exit(0);
}
fs.writeFileSync(QUEUE, JSON.stringify([...queue, ...merged], null, 1) + '\n');
console.log(`topup: +${merged.length} candidates — queue now ${queue.length + merged.length} (${untried + merged.length} untried)`);
