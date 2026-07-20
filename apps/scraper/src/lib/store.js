import fs from 'node:fs';
import path from 'node:path';
import { hasSupabase } from './env.js';

export function readNdjson(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

// Atomic write: serialize to a temp file in the same directory, then rename over the
// target. rename() is atomic on the same filesystem, so a crash mid-write leaves the
// previous good file intact rather than a truncated one. The accumulated corpus is the
// asset — a half-written postings_raw.ndjson would be a genuine data loss.
function atomicWrite(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, contents);
  fs.renameSync(tmp, file);
}

export function writeNdjson(file, rows) {
  atomicWrite(file, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''));
}

/** Merge rows into an NDJSON file by key. Returns {added, updated, total}. */
export function upsertNdjson(file, rows, keyFn) {
  const existing = readNdjson(file);
  const byKey = new Map(existing.map((r) => [keyFn(r), r]));
  let added = 0, updated = 0;
  for (const row of rows) {
    const k = keyFn(row);
    if (byKey.has(k)) updated++; else added++;
    byKey.set(k, row);
  }
  writeNdjson(file, [...byKey.values()]);
  return { added, updated, total: byKey.size };
}

export function writeJson(file, obj) {
  atomicWrite(file, JSON.stringify(obj, null, 2) + '\n');
}

export function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Tolerant NDJSON read: skip any line that fails to parse (e.g. a legacy truncated
// tail from before atomic writes) rather than throwing the whole corpus away.
export function readNdjsonSafe(file) {
  if (!fs.existsSync(file)) return [];
  const out = [];
  let bad = 0;
  for (const l of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!l) continue;
    try { out.push(JSON.parse(l)); } catch { bad++; }
  }
  if (bad) console.warn(`readNdjsonSafe: skipped ${bad} unparseable line(s) in ${path.basename(file)}`);
  return out;
}

/**
 * Optional Supabase mirror via PostgREST upsert (zero dependencies).
 * No-op without SUPABASE_URL + SUPABASE_SERVICE_KEY — the scraper is local-first by design.
 */
export async function supabaseUpsert(table, rows, onConflict) {
  if (!hasSupabase() || !rows.length) return { mirrored: 0 };
  const url = `${process.env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}?on_conflict=${onConflict}`;
  const key = process.env.SUPABASE_SERVICE_KEY;
  let mirrored = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
        prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) throw new Error(`Supabase upsert ${table}: HTTP ${res.status} ${await res.text()}`);
    mirrored += batch.length;
  }
  return { mirrored };
}
