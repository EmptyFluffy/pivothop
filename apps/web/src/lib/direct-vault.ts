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

/** Every direct row of an occupation, decrypted, or null without a key/file. */
export function openShard(occ: string): Record<string, VaultRow> | null {
  if (!/^[a-z0-9-]+$/.test(occ)) return null;
  if (cache.has(occ)) return cache.get(occ) ?? null;
  const key = keyBytes();
  if (!key) return null;
  let rows: Record<string, VaultRow> | null = null;
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), 'private', 'direct', `${occ}.enc`));
    const iv = buf.subarray(0, 12), tag = buf.subarray(12, 28), data = buf.subarray(28);
    const d = createDecipheriv('aes-256-gcm', key, iv);
    d.setAuthTag(tag);
    rows = JSON.parse(Buffer.concat([d.update(data), d.final()]).toString('utf8')) as Record<string, VaultRow>;
  } catch { rows = null; }
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
