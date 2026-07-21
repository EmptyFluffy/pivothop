#!/usr/bin/env node
import { loadEnv, hasSupabase } from './lib/env.js';
import { upsertNdjson, readNdjson, readNdjsonSafe, readJson, writeJson, supabaseUpsert } from './lib/store.js';
import { RAW_FILE, POSTINGS_FILE, QUALITY_FILE, AGGREGATES_FILE, ADJACENCY_FILE, FX_FILE } from './lib/paths.js';
import { normalize } from './normalize/index.js';
import { aggregate } from './score/aggregate.js';
import { adjacency } from './score/adjacency.js';
import { emit } from './score/emit.js';
import { preview } from './preview.js';
import { fetchOnetRelated } from './taxonomy/onet.js';
import { verify } from './score/verify.js';
import { bridgeSkills } from './analyze/bridge-skills.js';
import { cooccur } from './analyze/cooccur.js';
import { fetchCapabilities } from './taxonomy/onet-capabilities.js';
import { analyzeCapability } from './analyze/capability.js';
import { analyzeFit } from './analyze/fit.js';
import { demandAdjacency } from './analyze/demand-adjacency.js';

loadEnv();
const log = (...a) => console.log(...a);

const SOURCES = ['remotive', 'remoteok', 'greenhouse', 'lever', 'ashby', 'smartrecruiters', 'arbeitnow', 'jobicy', 'adzuna', 'usajobs', 'reed'];

// Fault-isolated ingest: each source runs in its own try/catch so one dead API,
// timeout, or schema change can't sink the run — the failure is logged and the
// remaining sources still contribute. Returns a per-source outcome summary.
async function ingest(which) {
  const names = which && which !== 'all' ? [which] : SOURCES;
  const results = [];
  for (const n of names) {
    if (!SOURCES.includes(n)) { log(`unknown source "${n}" — one of: ${SOURCES.join(', ')}`); process.exit(1); }
    try {
      const mod = await import(`./sources/${n}.js`);
      const rows = await mod.fetchRaw({ log });
      if (!rows.length) { results.push({ source: n, ok: true, added: 0, updated: 0 }); continue; }
      const { added, updated, total } = upsertNdjson(RAW_FILE, rows, (r) => `${r.source} ${r.external_id}`);
      log(`${n}: +${added} new, ${updated} refreshed (raw total ${total})`);
      try {
        const { mirrored } = await supabaseUpsert('postings_raw', rows, 'source,external_id');
        if (mirrored) log(`${n}: mirrored ${mirrored} rows to Supabase`);
      } catch (err) {
        log(`${n}: Supabase mirror failed (local write kept) — ${err.message}`);
      }
      results.push({ source: n, ok: true, added, updated });
    } catch (err) {
      log(`${n}: FAILED — ${err.message} (skipped, other sources unaffected)`);
      results.push({ source: n, ok: false, error: err.message });
    }
  }
  const failed = results.filter((r) => !r.ok);
  const added = results.reduce((s, r) => s + (r.added ?? 0), 0);
  log(`ingest: ${results.length - failed.length}/${results.length} sources ok, +${added} new postings${failed.length ? ` · failed: ${failed.map((f) => f.source).join(', ')}` : ''}`);
  return results;
}

async function fxUpdate() {
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!res.ok) throw new Error(`FX fetch failed: HTTP ${res.status}`);
  const body = await res.json();
  if (body.result !== 'success') throw new Error('FX fetch failed');
  const prev = readJson(FX_FILE);
  writeJson(FX_FILE, { ...prev, asOf: new Date().toISOString().slice(0, 10), source: 'open.er-api.com', rates: { ...prev.rates, ...body.rates } });
  log(`fx: snapshot updated (${Object.keys(body.rates).length} currencies)`);
}

function status() {
  const raw = readNdjsonSafe(RAW_FILE);
  const bySource = {};
  for (const r of raw) bySource[r.source] = (bySource[r.source] ?? 0) + 1;
  log(`raw postings: ${raw.length}`, bySource);
  const q = readJson(QUALITY_FILE);
  if (q) log('last normalize:', q);
  const agg = readJson(AGGREGATES_FILE);
  if (agg) {
    const roles = Object.entries(agg.roles).sort((a, b) => b[1].count - a[1].count);
    log(`aggregates: ${roles.length} occupations. Top 15:`);
    for (const [slug, a] of roles.slice(0, 15)) {
      log(`  ${slug.padEnd(28)} ${String(a.count).padStart(5)} postings · ${String(a.salaried_count).padStart(4)} salaried · remote ${Math.round(a.remote_share * 100)}%`);
    }
  }
  if (readJson(ADJACENCY_FILE)) log('adjacency: computed');
  log(`supabase mirror: ${hasSupabase() ? 'ON' : 'off (local NDJSON only — set SUPABASE_URL + SUPABASE_SERVICE_KEY in .env to enable)'}`);
}

const [cmd, arg] = process.argv.slice(2);
const originFlag = process.argv.find((a) => a.startsWith('--origin='))?.split('=')[1];

switch (cmd) {
  case 'ingest': await ingest(arg); break;
  case 'normalize': await normalize({ log }); break;
  case 'aggregate': await aggregate({ log }); break;
  case 'score': await adjacency({ log }); break;
  case 'emit': await emit({ log, origin: originFlag }); break;
  case 'run':
    await ingest(arg && arg !== 'all' ? arg : 'all');
    await normalize({ log });
    await aggregate({ log });
    await adjacency({ log });
    await emit({ log });
    verify({ log }); // sanity invariants + drift vs the last snapshot, every run
    break;
  case 'verify': verify({ log, snapshot: process.argv.includes('--snapshot') }); break;
  case 'analyze:bridge': bridgeSkills({ log, origin: originFlag ?? arg ?? 'architect' }); break;
  case 'analyze:cooccur': cooccur({ log }); break;
  case 'preview': preview({ log, origin: originFlag ?? arg ?? 'architect' }); break;
  case 'fx:update': await fxUpdate(); break;
  case 'taxonomy:onet': await fetchOnetRelated({ log }); break;
  case 'taxonomy:capabilities': await fetchCapabilities({ log }); break;
  case 'analyze:capability': analyzeCapability({ log, origin: originFlag ?? arg ?? 'architect' }); break;
  case 'analyze:fit': analyzeFit({ log, origin: originFlag ?? arg ?? 'architect' }); break;
  case 'analyze:demand': demandAdjacency({ log }); break;
  case 'status': status(); break;
  default:
    log(`PivotHop scraper — the gate.

Usage: npm run scrape -- <command>

  ingest [source|all]   fetch postings (${SOURCES.join(', ')})
  normalize             postings_raw -> postings (titles, salary USD, skills, country)
  aggregate             per-occupation aggregates
  score                 occupation-to-occupation adjacency (top-12 sparse)
  emit [--origin=slug]  write per-origin ROLES/NEXT files to packages/data/generated/
  run [source]          ingest -> normalize -> aggregate -> score -> emit
  preview [origin]      inject an origin's generated data into the reference graph for eyeballing
  fx:update             refresh the monthly FX snapshot
  verify [--snapshot]   sanity invariants + match-score drift vs the last snapshot
  analyze:bridge [origin] the non-native skills most demanded in an origin's postings
  analyze:cooccur        related skills by co-occurrence (Rhino -> Grasshopper) for typeahead
  status                data-quality counters and per-occupation counts

Local-first: everything persists to apps/scraper/data/ as NDJSON. With SUPABASE_URL +
SUPABASE_SERVICE_KEY in .env, rows also upsert to Supabase (schema in supabase/migrations/).`);
}
