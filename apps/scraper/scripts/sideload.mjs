import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { upsertNdjson, readNdjsonSafe } from '../src/lib/store.js';
import { RAW_FILE } from '../src/lib/paths.js';

// Sideload: tracked NDJSON snapshots -> the corpus. Careerjet's affiliate API
// is IP-allow-listed, and GitHub runners rotate IPs, so that source can only
// run from the founder's declared machine. The laptop runs
//   npm run scrape -- ingest careerjet && node apps/scraper/scripts/sideload.mjs --export
// which snapshots the careerjet rows into sideload/careerjet.ndjson
// (tracked, committed, pushed). The nightly calls this script with no flag
// before normalize, absorbing every sideload file into its own corpus by the
// same (source, external_id) upsert the live sources use. Rows age out of the
// board naturally through the freshness caps when the laptop stops refreshing.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'sideload');   // tracked (data/ is gitignored)

const args = process.argv.slice(2);
if (args.includes('--export')) {
  const src = args[args.indexOf('--export') + 1] || 'careerjet';
  const rows = readNdjsonSafe(RAW_FILE).filter((r) => r.source === src);
  if (!rows.length) { console.log(`sideload: no ${src} rows in the local corpus — run the ingest first`); process.exit(1); }
  fs.mkdirSync(DIR, { recursive: true });
  const out = path.join(DIR, `${src}.ndjson`);
  fs.writeFileSync(out, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  console.log(`sideload: exported ${rows.length} ${src} rows -> ${path.relative(ROOT, out)} (commit + push to feed the nightly)`);
} else {
  if (!fs.existsSync(DIR)) { console.log('sideload: nothing to absorb'); process.exit(0); }
  let n = 0;
  for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.ndjson'))) {
    const rows = readNdjsonSafe(path.join(DIR, f));
    const { added, updated } = upsertNdjson(RAW_FILE, rows, (r) => `${r.source} ${r.external_id}`);
    console.log(`sideload: ${f} -> ${added} added, ${updated} updated`);
    n += rows.length;
  }
  if (!n) console.log('sideload: nothing to absorb');
}
