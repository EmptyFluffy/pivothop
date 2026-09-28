#!/usr/bin/env node
/* merge-config-lists: publish only what THIS run added to the board configs.
 *
 * The nightly checks out main, then ats-probe / studio-resolve / prospect
 * append boards to config/*-companies.json. Publishing used
 * `git pull --rebase -X theirs`, which resolves every conflict in favour of
 * the bot's copy, i.e. the config as it was at checkout plus the night's hits.
 * On 2026-09-28 that silently reverted a hand-reviewed commit pushed while the
 * run was going: icims 43 -> 16, bamboohr 36 -> 16, pinpoint 14 -> 5,
 * teamtailor 26 -> 7, and brought back boards that commit had denied.
 *
 * Three-way instead: base = the commit the run checked out (HEAD), main =
 * origin/main now, local = the files on disk. Result = main + (local - base),
 * minus anything main's ats-probe DENY list now refuses. Removals on main
 * stay removed; additions on main stay; the run's own additions land on top.
 * Run after `git fetch origin main`, before staging. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(ROOT, '..', '..');
const rel = (f) => path.relative(REPO, f);
const show = (ref, f) => { try { return execFileSync('git', ['-C', REPO, 'show', `${ref}:${rel(f)}`], { encoding: 'utf8', maxBuffer: 1 << 28 }); } catch { return null; } };

const keyOf = (x) => {
  if (typeof x === 'string') return x.toLowerCase();
  for (const k of ['sub', 'board', 'guid', 'tenant', 'slug', 'careers']) if (x?.[k]) return String(x[k]).toLowerCase().replace(/[?#].*$/, '').replace(/\/+$/, '');
  return JSON.stringify(x);
};
const listKey = (d) => Object.keys(d).find((k) => Array.isArray(d[k]));

const probeSrc = show('origin/main', path.join(ROOT, 'scripts', 'ats-probe.mjs')) ?? '';
const denyBlock = probeSrc.split('const DENY = new Set([')[1]?.split(']);')[0] ?? '';
const DENY = new Set([...denyBlock.matchAll(/'([a-z]+):([^']+)'/g)].map((m) => `${m[1]}:${m[2].toLowerCase()}`));
const bare = (ats, k) => (ats === 'icims' ? k.replace(/^(careers|jobs)-/, '') : k);

const files = fs.readdirSync(path.join(ROOT, 'config')).filter((f) => /-companies(-auto)?\.json$/.test(f)).map((f) => path.join(ROOT, 'config', f));
let touched = 0;
for (const f of files) {
  const local = JSON.parse(fs.readFileSync(f, 'utf8'));
  const baseTxt = show('HEAD', f); const mainTxt = show('origin/main', f);
  if (!mainTxt) continue; // new file on this branch only: keep as is
  const base = baseTxt ? JSON.parse(baseTxt) : { [listKey(local)]: [] };
  const main = JSON.parse(mainTxt);
  const k = listKey(main) ?? listKey(local);
  if (!k || !Array.isArray(local[k])) continue;
  const ats = path.basename(f).replace(/-companies(-auto)?\.json$/, '');
  const baseKeys = new Set((base[k] ?? []).map(keyOf));
  const mainKeys = new Set(main[k].map(keyOf));
  const added = local[k].filter((x) => { const q = keyOf(x); return !baseKeys.has(q) && !mainKeys.has(q) && !DENY.has(`${ats}:${bare(ats, q)}`); });
  // DENY wins over any row, main's included: a board denied after the run began
  // (or added by an unreviewed probe) never survives a publish
  const denied = (x) => DENY.has(`${ats}:${bare(ats, keyOf(x))}`);
  const merged = { ...main, [k]: [...main[k], ...added].filter((x) => !denied(x)) };
  const out = JSON.stringify(merged, null, 1) + '\n';
  if (out !== fs.readFileSync(f, 'utf8')) { fs.writeFileSync(f, out); touched++; }
  if (added.length) console.log(`merge-config: ${path.basename(f)} +${added.length} from this run on top of main`);
}
console.log(`merge-config: ${touched} config files rebuilt as main + this run's additions`);
