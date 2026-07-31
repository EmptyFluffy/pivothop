import fs from 'node:fs';
import path from 'node:path';
import { hasSupabase } from './env.js';

// Read as a BUFFER and decode line by line — never as one string.
//
// V8 caps a single string at 0x1fffffe8 (536,870,888) characters. On 2026-07-31
// postings_raw.ndjson was 535,851,089 bytes: 99.8% of that ceiling, under 1MB of
// headroom, growing ~70MB a night. The cloud runner hit it first —
// "Error: Cannot create a string longer than 0x1fffffe8 characters" — but the
// laptop was one night behind it, and this is the primary publisher's read path
// for the entire accumulated corpus.
//
// Buffers have no such cap (buffer.constants.MAX_LENGTH is gigabytes), so the
// file is read as bytes and each line is decoded individually. Same synchronous
// signature, so no caller changes; the ceiling is simply gone.
function eachLine(buf, fn) {
  let start = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] !== 10) continue;                 // \n
    let end = i;
    if (end > start && buf[end - 1] === 13) end--; // tolerate CRLF
    if (end > start) fn(buf.toString('utf8', start, end));
    start = i + 1;
  }
  if (start < buf.length) fn(buf.toString('utf8', start));
}

export function readNdjson(file) {
  if (!fs.existsSync(file)) return [];
  const rows = [];
  eachLine(fs.readFileSync(file), (l) => rows.push(JSON.parse(l)));
  return rows;
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

// Same ceiling applied on the way out: rows.map().join() built one giant string.
// Written in chunks to the temp file instead, so the atomic rename is preserved
// (a crash mid-write still leaves the previous good corpus intact) without ever
// materialising the whole file as a string.
const WRITE_CHUNK = 8 << 20; // 8MB
export function writeNdjson(file, rows) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  const fd = fs.openSync(tmp, 'w');
  try {
    let chunk = '';
    for (const r of rows) {
      chunk += JSON.stringify(r) + '\n';
      if (chunk.length >= WRITE_CHUNK) { fs.writeSync(fd, chunk); chunk = ''; }
    }
    if (chunk) fs.writeSync(fd, chunk);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmp, file);
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
  eachLine(fs.readFileSync(file), (l) => {
    try { out.push(JSON.parse(l)); } catch { bad++; }
  });
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
