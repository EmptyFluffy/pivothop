import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, DATA_DIR, GENERATED_DIR } from './lib/paths.js';

// Phase-1 verification harness, not the Phase-2 port: injects a generated origin
// file into an untouched copy of the reference implementation so the real data can
// be eyeballed inside the real instrument. The reference file itself is never modified.

const REFERENCE = path.join(REPO_ROOT, 'apps', 'web', 'reference', 'pivothop-swiss.html');

export function preview({ log, origin = 'architect' }) {
  const genFile = path.join(GENERATED_DIR, `${origin}.json`);
  if (!fs.existsSync(genFile)) { log(`preview: no generated file for "${origin}" — run \`emit\` first`); return null; }
  const gen = JSON.parse(fs.readFileSync(genFile, 'utf8'));
  if (gen.insufficient) { log(`preview: "${origin}" is an honest empty state (${gen.origin.postings} postings) — nothing to preview yet`); return null; }

  let html = fs.readFileSync(REFERENCE, 'utf8');

  const roles = gen.roles.map((r) => ({
    id: r.id,
    desc: r.desc || `${r.title}. ${r.provenance.postings} live postings behind this route${r.low_confidence ? ' — low confidence, treat as directional' : ''}.`,
    title: r.title + (r.low_confidence ? ' *' : ''),
    field: r.field || '—',
    match: r.match,
    salary: r.salary ?? '—',
    demand: r.demand,
    remote: r.remote,
    time: r.time,
    have: r.have,
    learn: r.learn,
  }));
  const next = Object.fromEntries(Object.entries(gen.next).map(([k, kids]) => [k, kids.map((x) => ({ t: x.t, m: x.m }))]));

  html = html.replace(/var ROLES=\[[\s\S]*?\];/, `var ROLES=${JSON.stringify(roles)};`);
  html = html.replace(/var NEXT=\{[\s\S]*?\};/, `var NEXT=${JSON.stringify(next)};`);
  html = html.replace(
    /\[\[[^\n]*(\n\s*\.forEach\(function\(x\)\{GEDGES\.push\(\{from:x\[0\],to:x\[1\],w:x\[2\],k:'cross'\}\);\}\);)/,
    `${JSON.stringify(gen.cross)}$1`
  );
  html = html.replace(
    /\[\[[^\n]*(\n\s*\.forEach\(function\(x\)\{GEDGES\.push\(\{from:x\[0\],to:x\[1\],w:x\[2\],k:'bridge'\}\);\}\);)/,
    `${JSON.stringify(gen.bridges)}$1`
  );
  // Preview-copy-only physics guard: the reference clamps node position at the stage
  // bounds but not velocity, which is fine for the demo's strong edge weights — but
  // real data can park nodes on the walls with residual velocity, so nodeEnergy()
  // never drops below the unfold threshold and labels never fade in. Zeroing velocity
  // at the clamp guarantees settling for any dataset. (Candidate upstream fix for the
  // Phase 2 port; the reference file itself stays untouched.)
  html = html.replace(
    'if(n.x<40)n.x=40;else if(n.x>860)n.x=860;\n      if(n.y<36)n.y=36;else if(n.y>604)n.y=604;',
    'if(n.x<40){n.x=40;n.vx=0;}else if(n.x>860){n.x=860;n.vx=0;}\n      if(n.y<36){n.y=36;n.vy=0;}else if(n.y>604){n.y=604;n.vy=0;}'
  );

  // Center wordmark: the origin's name, with the clearance zone scaled to its length.
  html = html.replace(/label:'Architect'/, `label:${JSON.stringify(gen.origin.title)}`);
  html = html.replace(/PILL_W=108/, `PILL_W=${Math.max(70, Math.round(gen.origin.title.length * 11.5))}`);

  const outFile = path.join(DATA_DIR, 'preview', `${origin}.html`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, html);
  log(`preview: ${outFile}`);
  log(`         ${gen.origin.title} — ${gen.origin.postings} postings, ${roles.length} routes. * = low confidence.`);
  return outFile;
}
