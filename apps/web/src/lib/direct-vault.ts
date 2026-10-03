import fs from 'node:fs';
import path from 'node:path';
import { createDecipheriv, createHmac, timingSafeEqual } from 'node:crypto';

/* The vault behind direct (employer-site) postings. The repo is public, so
   the real company, logo, apply URL and full posting text of every direct row
   never appear in a public file: build-jobs writes them to private-src/ (git-
   ignored), seal-direct.mjs encrypts one file per occupation with DIRECT_KEY
   (AES-256-GCM, iv|tag|ciphertext) into private/direct/<occ>.enc, and only two
   readers hold the key: /api/direct at request time (behind a session or a
   share token) and companies-data at build time (to attribute a direct row to
   its employer for the company page's counts and pay, never its title). No
   key, no data: every reader returns null and the site stays redacted. */

export type VaultRow = {
  company: string;
  logo?: string;
  url: string;
  sections?: { h: string | null; t: string }[];
};

const cache = new Map<string, Record<string, VaultRow> | null>();

function keyBytes(): Buffer | null {
  const k = process.env.DIRECT_KEY || '';
  return /^[0-9a-f]{64}$/i.test(k) ? Buffer.from(k, 'hex') : null;
}

export function vaultReady(): boolean { return keyBytes() !== null; }

// The site's own origin: at runtime the sealed shards are read from its CDN.
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://www.pivothop.com');

function decrypt(buf: Buffer, key: Buffer): Record<string, VaultRow> {
  const iv = buf.subarray(0, 12), tag = buf.subarray(12, 28), data = buf.subarray(28);
  const d = createDecipheriv('aes-256-gcm', key, iv);
  d.setAuthTag(tag);
  return JSON.parse(Buffer.concat([d.update(data), d.final()]).toString('utf8')) as Record<string, VaultRow>;
}

/** One shard from disk, decrypted and not cached: the build's pass over every
    shard (companies-data). null without a key or a file. */
export function readShard(occ: string): Record<string, VaultRow> | null {
  if (!/^[a-z0-9-]+$/.test(occ)) return null;
  const key = keyBytes();
  if (!key) return null;
  try { return decrypt(fs.readFileSync(path.join(process.cwd(), 'private', 'direct', `${occ}.enc`)), key); }
  catch { return null; }
}

/** Every direct row of an occupation, decrypted, or null without a key/shard.
    Disk first (dev, build); in a deployed function the vault is NOT bundled
    (2026-10-03: at ~370MB it pushed /api/direct past Vercel's 250MB function
    limit onto the large-functions beta, and two deploys in a row died in
    "Deploying outputs" with an internal error), so the shard comes from the
    sealed copy the prebuild publishes at /data/vault/<occ>.enc. That copy is
    ciphertext already public in the git repo; the key never leaves the env. */
export async function openShard(occ: string): Promise<Record<string, VaultRow> | null> {
  if (!/^[a-z0-9-]+$/.test(occ)) return null;
  if (cache.has(occ)) return cache.get(occ) ?? null;
  const key = keyBytes();
  if (!key) return null;
  let rows = readShard(occ);
  if (!rows) {
    try {
      const res = await fetch(`${SITE_ORIGIN}/data/vault/${occ}.enc`, { cache: 'no-store' });
      if (res.ok) rows = decrypt(Buffer.from(await res.arrayBuffer()), key);
    } catch { rows = null; }
  }
  if (!rows) return null;   // a miss is not cached: a fetch that failed once is tried again
  if (cache.size > 48) cache.delete(cache.keys().next().value as string);
  cache.set(occ, rows);
  return rows;
}

/* Share tokens: a link we post ourselves (LinkedIn, an email) may open ONE
   posting without an account. HMAC of the (occ, id) pair under the same key;
   the token is worthless for any other posting. */
export function shareToken(occ: string, id: string): string | null {
  const k = process.env.DIRECT_KEY;
  if (!k) return null;
  return createHmac('sha256', k).update(`${occ}/${id}`).digest('hex').slice(0, 20);
}
export function verifyShareToken(occ: string, id: string, token: string): boolean {
  const want = shareToken(occ, id);
  if (!want || token.length !== want.length) return false;
  return timingSafeEqual(Buffer.from(want), Buffer.from(token));
}
