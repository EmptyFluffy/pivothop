import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { CACHE_DIR } from './paths.js';

const lastHit = new Map(); // host -> timestamp, for polite per-host spacing

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

/**
 * Polite JSON fetch: disk cache (default 20h TTL), per-host rate limit, retry on 429/5xx.
 * Returns parsed JSON, or null on 404. Throws on persistent failure.
 */
export async function fetchJson(url, { headers = {}, ttlMs = 20 * 3600e3, minIntervalMs = 1100, retries = 3 } = {}) {
  const key = crypto.createHash('sha1').update(url).digest('hex');
  const cacheFile = path.join(CACHE_DIR, key + '.json');
  if (fs.existsSync(cacheFile)) {
    const age = Date.now() - fs.statSync(cacheFile).mtimeMs;
    if (age < ttlMs) {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      return cached.notFound ? null : cached.body;
    }
  }

  const host = new URL(url).host;
  const wait = (lastHit.get(host) ?? 0) + minIntervalMs - Date.now();
  if (wait > 0) await sleep(wait);

  for (let attempt = 0; ; attempt++) {
    lastHit.set(host, Date.now());
    let res;
    try {
      res = await fetch(url, { headers: { accept: 'application/json', ...headers } });
    } catch (err) {
      if (attempt >= retries) throw err;
      await sleep(2000 * (attempt + 1));
      continue;
    }
    if (res.status === 404) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(cacheFile, JSON.stringify({ notFound: true }));
      return null;
    }
    if (res.status === 429 || res.status >= 500) {
      if (attempt >= retries) throw new Error(`HTTP ${res.status} for ${url}`);
      const retryAfter = Number(res.headers.get('retry-after')) || 0;
      await sleep(Math.max(retryAfter * 1000, 3000 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const body = await res.json();
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify({ body }));
    return body;
  }
}
