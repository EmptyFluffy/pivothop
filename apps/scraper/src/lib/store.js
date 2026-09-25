import fs from 'node:fs';
import path from 'node:path';
import { hasSupabase } from './env.js';

// CHUNKED, NOT WHOLE (2026-09-21). readFileSync refuses anything over 2 GiB
// (ERR_FS_FILE_TOO_LARGE), and the CI corpus reached 2,157,614,343 bytes on
// 2026-09-17: four nightlies died in normalize before the gate. The file is now
// read in 64MB slices and lines are decoded as they complete, so file size no
// longer has a ceiling and no whole-file buffer is ever allocated.
const READ_CHUNK = 64 << 20;
export function forEachNdjson(file, fn, { tolerant = false } = {}) {
  if (!fs.existsSync(file)) return { lines: 0, bad: 0 };
  const fd = fs.openSync(file, 'r');
  let carry = Buffer.alloc(0);
  let lines = 0, bad = 0;
  const emit = (line) => {
    if (!line) return;
    lines++;
    try { fn(JSON.parse(line)); }
    catch (e) { if (!tolerant) throw e; bad++; }
  };
  try {
    const chunk = Buffer.allocUnsafe(READ_CHUNK);
    for (;;) {
      const n = fs.readSync(fd, chunk, 0, READ_CHUNK, null);
      if (n === 0) break;
      const buf = carry.length ? Buffer.concat([carry, chunk.subarray(0, n)]) : chunk.subarray(0, n);
      let start = 0;
      for (let i = 0; i < buf.length; i++) {
        if (buf[i] !== 10) continue;
        let end = i;
        if (end > start && buf[end - 1] === 13) end--;
        emit(buf.toString('utf8', start, end));
        start = i + 1;
      }
      carry = Buffer.from(buf.subarray(start)); // copy: chunk is reused next read
    }
    if (carry.length) emit(carry.toString('utf8').replace(/\r$/, ''));
  } finally {
    fs.closeSync(fd);
  }
  return { lines, bad };
}

export function readNdjson(file) {
  const rows = [];
  forEachNdjson(file, (r) => rows.push(r));
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
// STREAMED (2026-09-24). The old version parsed the whole corpus into a Map
// (984k rows, several GB of heap) once per source, twenty times a run; the
// runner has 7 GB and the kernel killed the ingest mid-run with five sources
// in flight and nothing in the log. Now: the incoming rows are indexed by
// key, the existing file streams through once (rows whose key is incoming
// are dropped, the rest copied), then the incoming rows are appended. Memory
// is the incoming batch plus one Set of keys. Same atomic rename as before.
export function upsertNdjson(file, rows, keyFn) {
  const incoming = new Map();
  for (const row of rows) incoming.set(keyFn(row), row); // last write wins within a batch
  const w = openNdjsonWriter(file);
  let kept = 0, updated = 0;
  try {
    if (fs.existsSync(file)) {
      forEachNdjson(file, (r) => {
        if (incoming.has(keyFn(r))) { updated++; return; }
        w.write(r); kept++;
      }, { tolerant: true });
    }
    for (const row of incoming.values()) w.write(row);
    w.commit();
  } catch (err) { w.abandon(); throw err; }
  return { added: incoming.size - updated, updated, total: kept + incoming.size };
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
  const out = [];
  const { bad } = forEachNdjson(file, (r) => out.push(r), { tolerant: true });
  if (bad) console.warn(`readNdjsonSafe: skipped ${bad} unparseable line(s) in ${path.basename(file)}`);
  return out;
}

/* Streaming NDJSON writer with the same atomic rename as writeNdjson: rows are
   appended one at a time, so a filter over a corpus larger than memory can
   rewrite it without materialising the kept set. commit() renames into place;
   abandon() leaves the previous file untouched. */
export function openNdjsonWriter(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  const fd = fs.openSync(tmp, 'w');
  let chunk = '';
  let n = 0;
  return {
    write(row) { chunk += JSON.stringify(row) + '\n'; n++; if (chunk.length >= WRITE_CHUNK) { fs.writeSync(fd, chunk); chunk = ''; } },
    commit() { if (chunk) fs.writeSync(fd, chunk); fs.closeSync(fd); fs.renameSync(tmp, file); return n; },
    abandon() { fs.closeSync(fd); try { fs.unlinkSync(tmp); } catch { /* gone */ } },
  };
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
  // one row per conflict key per request: Postgres refuses a batch that
  // updates the same row twice (21000), and paged boards can repeat a posting
  const cols = onConflict.split(',');
  // Project onto the table's columns (schema 0001): readers carry extra
  // fields (avam_code, company_logo_url, employment_type...) that PostgREST
  // rejects as a whole batch, and an empty string is not a timestamp.
  const KNOWN = {
    postings_raw: ['source', 'external_id', 'title', 'company', 'location', 'remote_flag', 'salary_min', 'salary_max', 'currency', 'salary_period', 'description_text', 'posted_at', 'url'],
    postings: ['source', 'external_id', 'role_id', 'title_raw', 'skills', 'salary_usd_min', 'salary_usd_max', 'salary_confidence', 'remote_flag', 'country', 'posted_at', 'url'],
  }[table];
  const shaped = rows.map((r) => {
    const o = {};
    for (const k of KNOWN ?? Object.keys(r)) if (k in r) o[k] = r[k] === '' ? null : r[k];
    return o;
  });
  const uniq = [...new Map(shaped.map((r) => [cols.map((c) => r[c]).join('|'), r])).values()];
  for (let i = 0; i < uniq.length; i += 500) {
    const batch = uniq.slice(i, i + 500);
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
