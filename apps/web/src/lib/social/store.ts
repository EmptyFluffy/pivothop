import 'server-only';
import type { Platform, SocialPostRow } from './types';

/* Supabase over raw REST with the service key, the same pattern as
   admin/data.ts. All writes go through here; nothing else talks to the table. */

function base(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_KEY;
  return url && key ? { url, key } : null;
}
function headers(key: string): Record<string, string> {
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

export async function recentPosts(platform: Platform, limit = 40): Promise<SocialPostRow[]> {
  const b = base();
  if (!b) return [];
  const res = await fetch(
    `${b.url}/rest/v1/social_posts?platform=eq.${platform}&order=created_at.desc&limit=${limit}`,
    { headers: headers(b.key), cache: 'no-store' },
  );
  return res.ok ? ((await res.json()) as SocialPostRow[]) : [];
}

/* Permanent publication-history guard. The database enforces
   unique(platform, job_id), so the selector must know every id ever inserted,
   not only the recent diversity window. Page through PostgREST so this keeps
   working after the table grows beyond Supabase's default row limit. */
export async function usedJobIds(platform: Platform, pageSize = 1000): Promise<Set<string>> {
  const b = base();
  if (!b) return new Set();

  const ids = new Set<string>();
  for (let offset = 0; ; offset += pageSize) {
    const query = new URLSearchParams({
      select: 'job_id',
      platform: `eq.${platform}`,
      order: 'id.asc',
      limit: String(pageSize),
      offset: String(offset),
    });
    const res = await fetch(`${b.url}/rest/v1/social_posts?${query}`, {
      headers: headers(b.key),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn(`[social] failed to load full used-job history (status=${res.status}, offset=${offset})`);
      break;
    }
    const rows = (await res.json()) as Array<{ job_id: string }>;
    for (const row of rows) if (row.job_id) ids.add(row.job_id);
    if (rows.length < pageSize) break;
  }
  return ids;
}

export async function queue(limit = 60): Promise<SocialPostRow[]> {
  const b = base();
  if (!b) return [];
  const res = await fetch(`${b.url}/rest/v1/social_posts?order=created_at.desc&limit=${limit}`, {
    headers: headers(b.key), cache: 'no-store',
  });
  return res.ok ? ((await res.json()) as SocialPostRow[]) : [];
}

export async function findSocialPostByJobId(jobId: string): Promise<Pick<SocialPostRow, 'job_id' | 'job_occ'> | null> {
  const b = base();
  if (!b) return null;
  const query = new URLSearchParams({
    select: 'job_id,job_occ',
    job_id: `eq.${jobId}`,
    order: 'created_at.desc',
    limit: '1',
  });
  const res = await fetch(`${b.url}/rest/v1/social_posts?${query}`, {
    headers: headers(b.key), cache: 'no-store',
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<Pick<SocialPostRow, 'job_id' | 'job_occ'>>;
  return rows[0] ?? null;
}

export async function insertDraft(row: Omit<SocialPostRow, 'id' | 'created_at' | 'updated_at' | 'published_at' | 'external_post_id' | 'attempts' | 'last_error'>): Promise<SocialPostRow | null> {
  const b = base();
  if (!b) return null;
  const res = await fetch(`${b.url}/rest/v1/social_posts`, {
    method: 'POST',
    headers: { ...headers(b.key), Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  if (res.status === 409) return null; // unique(platform, job_id): already selected once, never twice
  if (!res.ok) return null;
  const rows = (await res.json()) as SocialPostRow[];
  return rows[0] ?? null;
}

/* Compare-and-set transition: the row moves from `from` to the patched status
   in ONE conditional UPDATE, so of two racing callers exactly one gets the row
   back. This is the idempotency that makes duplicate publication impossible. */
export async function claim(id: number, from: string, patch: Partial<SocialPostRow>): Promise<SocialPostRow | null> {
  const b = base();
  if (!b) return null;
  const res = await fetch(`${b.url}/rest/v1/social_posts?id=eq.${id}&status=eq.${from}`, {
    method: 'PATCH',
    headers: { ...headers(b.key), Prefer: 'return=representation' },
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as SocialPostRow[];
  return rows[0] ?? null;
}

export async function mark(id: number, patch: Partial<SocialPostRow>): Promise<boolean> {
  const b = base();
  if (!b) return false;
  const res = await fetch(`${b.url}/rest/v1/social_posts?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers(b.key), Prefer: 'return=minimal' },
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
  });
  return res.ok;
}

export async function publishedOrScheduledToday(platform: Platform, tz = 'America/Costa_Rica'): Promise<number> {
  const rows = await recentPosts(platform, 20);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
  return rows.filter((r) =>
    (r.status === 'published' || r.status === 'scheduled') &&
    new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(r.created_at)) === today,
  ).length;
}
