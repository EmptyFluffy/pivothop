#!/usr/bin/env node
/* ats-probe: find the employer's own hiring system behind an aggregator row.
 *
 * Aggregator URLs (Careerjet, Jooble, Himalayas...) never expose the employer's
 * ATS, so discovery runs company name -> candidate slugs -> the public JSON
 * endpoint of each ATS we already read (Greenhouse, Lever, Ashby,
 * SmartRecruiters, Workable, Recruitee). A hit means the whole board is ours
 * for free from the next nightly: the slug is appended to the matching config
 * list. No model, no rendering: one GET per ATS per slug, cached, polite.
 *
 *   node apps/scraper/scripts/ats-probe.mjs            # top aggregator companies not yet direct
 *   node apps/scraper/scripts/ats-probe.mjs --limit 300 --min 10 --dry
 *   node apps/scraper/scripts/ats-probe.mjs --names "Turner & Townsend,Leidos"
 *
 * Output: probe log per company, then the config files updated (unless --dry)
 * and a summary of boards found and postings they hold. State in
 * data/ats-probe-state.json so a company is not re-probed for 60 days. */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = path.join(ROOT, 'config');
const RAW = path.join(ROOT, 'data', 'postings_raw.ndjson');
const STATE = path.join(ROOT, 'data', 'ats-probe-state.json');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const DRY = args.includes('--dry');
const LIMIT = Number(opt('--limit', 400));
const MIN_ROWS = Number(opt('--min', 5));
const NAMES = opt('--names', null);
// one company per line; names with commas ("KBR, Inc.") cannot go through --names
const NAMES_FILE = opt('--names-file', null);
// companies probed at once; each one is a sequential chain of GETs across the
// ATS list (Workday alone tries 10 clusters), so one at a time is ~1/min
const CONCURRENCY = Number(opt('--concurrency', 6));
// --skip workable,personio / --only workable: split a big run by ATS, e.g.
// everything fast in parallel first, then the rate-limited Workable alone
const SKIP = new Set((opt('--skip', '') || '').split(',').filter(Boolean));
const ONLY = new Set((opt('--only', '') || '').split(',').filter(Boolean));

const AGG = new Set(['careerjet', 'jooble', 'himalayas', 'arbeitnow', 'jobicy', 'remoteok', 'themuse', 'reed', 'adzuna', 'getonbrd']);
const DIRECT = new Set(['greenhouse', 'ashby', 'lever', 'smartrecruiters', 'workday', 'workable', 'recruitee', 'personio', 'bamboohr', 'breezy', 'pinpoint', 'teamtailor', 'ukg', 'paylocity', 'icims', 'direct']);
// staffing platforms and boards that are not employers: a board under their name is not "direct"
const NOT_EMPLOYER = /\b(adecco|manpower|randstad|hays|michael page|robert half|kelly|gpac|yellowshark|ok job|locum|recruit|staffing|personal|jobs?\b|talent|consult|agency|careers?\b|hiring|nhs jobs|indeed|linkedin|jobgether|pavago|mercor|crossover|toptal|turing|deel|remote\.com|outsourc|human capital|associates|employment|technical resources|resourcing|hire hangar|braintrust|nexton|vaco|te emplea|emanate|venn group|goodman masson|oliver james|techbiz|adaptive teams|atomic hr)/i;

// same-named tenants that are NOT the company the aggregator rows belong to
// (verified by hand); the probe never adds these again even when state is lost
const DENY = new Set(['lever:capital', 'workday:jackson', 'workday:acs', 'workday:suffolk', 'workday:mpc', 'workday:bbb', 'lever:genesis', 'greenhouse:universal', 'greenhouse:spire', 'greenhouse:rva', 'ashby:clark', 'ashby:quanta', 'ashby:vinci', 'ashby:rasa', 'ashby:method', 'ashby:lunar', 'workable:htb', 'recruitee:rha', 'personio:asg', 'personio:ksp', 'personio:bbdo', 'smartrecruiters:gong', 'smartrecruiters:pennmedicine', 'greenhouse:bpd', 'greenhouse:css', 'greenhouse:pep', 'greenhouse:ghost', 'greenhouse:porter', 'personio:dpa', 'personio:pec', 'personio:tfs', 'lever:sar', 'workable:vbp', 'ashby:base', 'recruitee:quartz',
  // 2026-09-26 manual pass, each checked against the board's own name, titles and places
  'personio:water', 'personio:brp', 'personio:st-engineering', 'personio:cmc', 'personio:app', 'personio:sgd', 'personio:tcm',
  'greenhouse:solutions', 'greenhouse:lpc', 'greenhouse:find', 'greenhouse:srm', 'greenhouse:tsg', 'greenhouse:ventana', 'greenhouse:verse', 'greenhouse:trillium',
  'workday:wit', 'workday:ptc', 'workday:fca', 'workday:ccc', 'workday:hcsc',
  'ashby:mirage', 'ashby:quantum', 'ashby:linkup', 'ashby:hyde', 'ashby:pearl', 'ashby:tbc',
  'recruitee:tes', 'recruitee:prisma', 'recruitee:trp', 'recruitee:lss',
  'smartrecruiters:freeport-mcmoran', 'smartrecruiters:doit', 'lever:bhhc',
  // same company, but staffing volume that would flood the board: one job repeated per city or per client
  'greenhouse:pulse', 'lever:bluelightconsulting', 'recruitee:agenturfurhaushaltshilfe', 'smartrecruiters:npnow',
  'workable:toloka-annotators', 'workable:zipdev', 'workable:rtg']); // namesakes verified by hand (2026-09-24 manual passes)

const UA = 'Mozilla/5.0 (compatible; PivotHopScraper/0.1; contact: hello@pivothop.com)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Workable rate-limits by IP: one request every WORKABLE_GAP_MS across the
// whole run, however many companies are in flight (2026-09-26: 1,160 of 1,283
// companies came back 429 even one at a time without a gap)
const WORKABLE_GAP_MS = Number(process.env.WORKABLE_GAP_MS || 1500);
let workableNext = Promise.resolve();
const workableTurn = () => { const turn = workableNext; workableNext = turn.then(() => sleep(WORKABLE_GAP_MS)); return turn; };
async function getJson(url) {
  // 429 is "slow down", not "no board": with companies probed in parallel,
  // Workable answers 429 often, and a null there was recorded as a miss that
  // kept the company out of the probe for 60 days
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
      if (res.status === 429) { await sleep(1500 * attempt + Math.random() * 1000); continue; } // still 429 after 4 tries: undefined, "not checked"
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') || '';
      if (!/json/.test(ct)) return null;
      return await res.json();
    } catch { return null; }
  }
  return undefined;
}

/* Each ATS: how to test a slug and how many postings the board holds. */
const ATS = {
  greenhouse: { file: 'greenhouse-companies.json', key: 'boards',
    probe: async (s) => { const b = await getJson(`https://boards-api.greenhouse.io/v1/boards/${s}/jobs`); return b?.jobs ? b.jobs.length : null; } },
  lever: { file: 'lever-companies.json', key: 'companies',
    probe: async (s) => { const b = await getJson(`https://api.lever.co/v0/postings/${s}?mode=json`); return Array.isArray(b) ? b.length : null; } },
  ashby: { file: 'ashby-companies.json', key: 'companies',
    probe: async (s) => { const b = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${s}`); return b?.jobs ? b.jobs.length : null; } },
  smartrecruiters: { file: 'smartrecruiters-companies.json', key: 'companies',
    probe: async (s) => { const b = await getJson(`https://api.smartrecruiters.com/v1/companies/${s}/postings?limit=1`); return typeof b?.totalFound === 'number' ? b.totalFound : null; } },
  workable: { file: 'workable-companies.json', key: 'companies',
    probe: async (s) => { await workableTurn(); const b = await getJson(`https://apply.workable.com/api/v1/widget/accounts/${s}`); return b === undefined ? undefined : b?.jobs ? b.jobs.length : null; } },
  recruitee: { file: 'recruitee-companies.json', key: 'companies',
    probe: async (s) => { const b = await getJson(`https://${s}.recruitee.com/api/offers/`); return b?.offers ? b.offers.length : null; } },
  // Workday (2026-09-23): where hospitals, retailers, airlines and builders
  // hire. A tenant has three unknowns (tenant, wdN cluster, site); the careers
  // root redirects to /<locale>/<site>, which gives the site, and the CXS jobs
  // endpoint gives the count. Config rows are objects, not slugs.
  workday: { file: 'workday-companies.json', key: 'tenants', object: true,
    probe: async (s) => {
      // The careers root answers 406 to everything; a site path answers 404 on
      // a real tenant and 500 on a missing one, which is the tenant test. The
      // site name is then guessed from the usual shapes and confirmed by the
      // CXS count call (the same JSON the reader uses).
      const T = s.charAt(0).toUpperCase() + s.slice(1);
      const sites = ['External', 'Careers', 'careers', 'Career', 'Jobs', 'jobs', 'External_Careers', 'ExternalCareers', 'External_Career_Site',
        `${T}Careers`, `${s}careers`, `${T}_Careers`, `${T}_External`, `${s}jobs`, `${T}Jobs`, T, s, `${T}_External_Career_Site`, `${T}_Careers_Site`, 'careers-home', 'Search', 'en-US'];
      const H = { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36' };
      const CLUSTERS = ['wd1', 'wd3', 'wd5', 'wd12', 'wd101', 'wd103', 'wd104', 'wd108', 'wd501', 'wd503'];
      const lives = async (wd) => { try { const t = await fetch(`https://${s}.${wd}.myworkdayjobs.com/ph-probe`, { headers: { ...H, accept: 'text/html' }, signal: AbortSignal.timeout(10000) }); return t.status === 404; } catch { return false; } }; // 500 = no such tenant on this cluster
      let home = null;
      for (let b = 0; b < CLUSTERS.length && !home; b += 5) {
        const batch = CLUSTERS.slice(b, b + 5);
        const ok = await Promise.all(batch.map(lives));
        home = batch.find((_, i) => ok[i]) ?? null;
      }
      for (const wd of home ? [home] : []) {
        for (const site of sites) {
          try {
            const r = await fetch(`https://${s}.${wd}.myworkdayjobs.com/wday/cxs/${s}/${site}/jobs`, { method: 'POST', headers: { ...H, 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ limit: 1, offset: 0, searchText: '' }), signal: AbortSignal.timeout(12000) });
            if (!r.ok) continue;
            const j = await r.json();
            if (typeof j?.total === 'number') return { jobs: j.total, entry: { tenant: s, wd, site } };
          } catch { /* next */ }
        }
        return null; // tenant exists here but no guessed site answered
      }
      return null;
    } },
  // Personio (European mid-market): one keyless XML feed per tenant.
  personio: { file: 'personio-companies.json', key: 'tenants', object: true,
    probe: async (s) => {
      try {
        const r = await fetch(`https://${s}.jobs.personio.com/xml`, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(12000) });
        if (!r.ok) return null;
        const x = await r.text();
        if (!/<workzag-jobs|<position>/.test(x)) return null;
        return { jobs: (x.match(/<position>/g) ?? []).length, entry: { tenant: s } };
      } catch { return null; }
    } },
};

/* Candidate slugs from a company name: "Turner & Townsend" -> turnertownsend,
   turner-townsend, turnerandtownsend; "CI&T" -> ciandt, cit. Suffixes dropped. */
function slugsFor(name) {
  let n = name.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
  n = n.replace(/\b(inc|llc|ltd|gmbh|ag|sa|plc|corp|corporation|co|company|group|holdings|limited|se|nv|bv|srl|s\.a\.|s\.r\.l\.)\b\.?/g, ' ');
  n = n.replace(/\(.*?\)/g, ' ').replace(/[.,'’"]/g, '').trim();
  const raw = n.split(/[\s/]+/).filter(Boolean);
  const words = raw.filter((w) => w !== '&' && w !== 'and'); // "turner & townsend" -> turner townsend
  const out = new Set();
  // The bare first word is tried only for one-word names: "Air Liquide" ->
  // greenhouse:air and "Atlas Copco" -> ashby:atlas were someone else's boards
  // (pass 2, 2026-09-22: 40 of 166 hits came from that fallback, most wrong).
  // Generic tail words drop for a second candidate: "HCA Healthcare" -> hca,
  // "Mayo Clinic" -> mayo, "Marriott International" -> marriott. Health systems
  // and hotel chains name their tenants that way. The 5-posting floor and a
  // hand review of manual-list hits guard the namesake risk.
  const GENERIC = /^(health|healthcare|clinic|hospital|medical|medicine|system|systems|foods|stores|hotels|resorts|airlines|air|lines|construction|international|worldwide|global|industries|technologies|entertainment|network|networks|partners|services|brands|companies|enterprises|corporation|usa|us|uk)$/;
  const core = words.filter((w) => !GENERIC.test(w));
  const acronym = words.length >= 3 ? words.map((w) => w[0]).join('') : '';
  for (const v of [words.join(''), words.join('-'), words.join('and'), ...(words.length === 1 ? [words[0]] : []), ...(core.length && core.length < words.length ? [core.join(''), core.join('-')] : []), acronym]) {
    const s = (v || '').replace(/[^a-z0-9-]/g, '');
    if (s.length >= 3) out.add(s);
  }
  return [...out];
}

function readList(ats) {
  const f = path.join(CONFIG, ATS[ats].file);
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  return { f, d, list: d[ATS[ats].key] ?? [] };
}
// the slug a config row answers to: a string, or the tenant of an object row
const slugOf = (x) => (typeof x === 'string' ? x : x?.tenant ?? x?.slug ?? '').toLowerCase();

/* Aggregator companies not yet direct, most rows first. Streamed: the corpus
 * passed Node's 512 MB string ceiling on the runner (2026-09-26 nightly died on
 * readFileSync with "Cannot create a string longer than 0x1fffffe8"). */
async function candidates() {
  const agg = new Map(); const direct = new Set();
  const rl = readline.createInterface({ input: fs.createReadStream(RAW, 'utf8'), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    const co = (r.company || '').trim(); if (!co) continue;
    if (DIRECT.has(r.source)) direct.add(co.toLowerCase());
    else if (AGG.has(r.source)) agg.set(co, (agg.get(co) ?? 0) + 1);
  }
  return [...agg.entries()].filter(([co, n]) => n >= MIN_ROWS && !direct.has(co.toLowerCase()) && !NOT_EMPLOYER.test(co))
    .sort((a, b) => b[1] - a[1]).map(([co, n]) => ({ co, n }));
}

const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {};
const fresh = (co) => state[co] && Date.now() - Date.parse(state[co].at) < 60 * 864e5;
const known = {}; for (const a of Object.keys(ATS)) known[a] = new Set(readList(a).list.map(slugOf));

const todo = NAMES_FILE ? fs.readFileSync(NAMES_FILE, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean).map((co) => ({ co, n: 0 }))
  : NAMES ? NAMES.split(',').map((s) => ({ co: s.trim(), n: 0 })) : (await candidates()).filter((c) => !fresh(c.co)).slice(0, LIMIT);
console.log(`ats-probe: ${todo.length} companies to probe (min ${MIN_ROWS} aggregator rows, limit ${LIMIT}${DRY ? ', dry run' : ''})`);

const found = [];
async function probeOne({ co, n }) {
  const slugs = slugsFor(co);
  let hit = null; let throttled = false;
  for (const s of slugs) {
    const order = Object.entries(ATS).filter(([ats]) => !DENY.has(`${ats}:${s}`) && !SKIP.has(ats) && (!ONLY.size || ONLY.has(ats)));
    const listed = order.find(([ats]) => known[ats].has(s));
    if (listed) { hit = { ats: listed[0], slug: s, jobs: -1, already: true }; break; }
    // every ATS answers on its own host, so one slug is tested against all of
    // them at once; the first hit in list order wins, as it did sequentially
    const got = await Promise.all(order.map(([, def]) => def.probe(s).catch(() => null)));
    if (got.some((g) => g === undefined)) throttled = true;
    for (let i = 0; i < order.length && !hit; i++) {
      const g = got[i];
      const jobs = typeof g === 'number' ? g : g?.jobs ?? null;
      // under 5 postings a same-named tenant is usually someone else's test board
      if (jobs !== null && jobs >= 5) hit = { ats: order[i][0], slug: s, jobs, entry: typeof g === 'object' ? g.entry : null };
    }
    if (hit) break;
    await sleep(120);
  }
  // a partial run (--skip/--only) or a throttled answer is not a verdict on
  // the company: only record a miss when every ATS was actually asked
  if (hit || (!throttled && !SKIP.size && !ONLY.size)) state[co] = { at: new Date().toISOString(), hit: hit ? `${hit.ats}:${hit.slug}` : null };
  if (!hit && throttled) console.log(`  ? ${co} (${n}) throttled, not recorded`);
  if (hit) {
    found.push({ co, n, ...hit });
    console.log(`  ✓ ${co} (${n} aggregator rows) -> ${hit.ats}:${hit.slug}${hit.already ? ' (already listed)' : ` ${hit.jobs} postings`}`);
  } else {
    console.log(`  · ${co} (${n}) no public ATS under ${slugs.slice(0, 3).join(', ')}`);
  }
}
let next = 0;
await Promise.all(Array.from({ length: Math.max(1, CONCURRENCY) }, async () => { while (next < todo.length) await probeOne(todo[next++]); }));

if (!DRY) {
  fs.writeFileSync(STATE, JSON.stringify(state, null, 0) + '\n');
  const byAts = {};
  for (const h of found) { if (!h.already) (byAts[h.ats] ??= []).push(h); }
  for (const [ats, hits] of Object.entries(byAts)) {
    const { f, d, list } = readList(ats);
    const have = new Set(list.map(slugOf));
    // two aggregator names can land on one board (2brains, 2Brains): add it once
    const add = hits.filter((h) => !have.has(h.slug) && have.add(h.slug)).map((h) => (ATS[ats].object ? { ...h.entry, company: h.co } : h.slug));
    d[ATS[ats].key] = [...list, ...add];
    fs.writeFileSync(f, JSON.stringify(d, null, 1) + '\n'); // the lists' own indent
    console.log(`config: ${ATS[ats].file} +${add.length}`);
  }
}
const newHits = found.filter((h) => !h.already);
console.log(`\nats-probe: ${newHits.length} new boards, ${newHits.reduce((s, h) => s + h.jobs, 0)} postings behind them; ${found.filter((h) => h.already).length} already listed; ${todo.length - found.length} without a public ATS`);
