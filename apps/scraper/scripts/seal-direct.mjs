#!/usr/bin/env node
/* seal-direct: encrypt the private side of the direct-jobs lock.
 *
 * build-jobs.py (DIRECT_REDACT=1) writes apps/web/private-src/direct/<occ>.json
 * (git-ignored) with the real company, logo, apply URL and posting text of
 * every direct row. This turns each into apps/web/private/direct/<occ>.enc
 * (committed: the repo is public, the ciphertext is not readable without the
 * key) as AES-256-GCM, 12-byte iv | 16-byte tag | ciphertext. DIRECT_KEY is
 * 32 bytes hex, held in the Actions secret and the Vercel env, nowhere else.
 * Stale .enc files whose occupation is gone are removed. */
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes, createCipheriv } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'web');
const SRC = path.join(ROOT, 'private-src', 'direct');
const OUT = path.join(ROOT, 'private', 'direct');
const key = process.env.DIRECT_KEY || '';
if (!/^[0-9a-f]{64}$/i.test(key)) {
  console.error('seal-direct: DIRECT_KEY missing or not 32 bytes hex; nothing sealed');
  process.exit(2);
}
const K = Buffer.from(key, 'hex');
fs.mkdirSync(OUT, { recursive: true });
const files = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter((f) => f.endsWith('.json')) : [];
const keep = new Set();
let rows = 0;
for (const f of files) {
  const plain = fs.readFileSync(path.join(SRC, f));
  rows += Object.keys(JSON.parse(plain.toString('utf8'))).length;
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', K, iv);
  const ct = Buffer.concat([c.update(plain), c.final()]);
  const name = f.replace(/\.json$/, '.enc');
  fs.writeFileSync(path.join(OUT, name), Buffer.concat([iv, c.getAuthTag(), ct]));
  keep.add(name);
}
let removed = 0;
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.enc') && !keep.has(f)) { fs.unlinkSync(path.join(OUT, f)); removed++; }
console.log(`seal-direct: ${files.length} occupations, ${rows} direct rows sealed; ${removed} stale files removed`);
