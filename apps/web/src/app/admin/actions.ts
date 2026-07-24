'use server';
import { revalidatePath } from 'next/cache';

/* Update a submission's review status. Behind the /admin Basic Auth gate, so
   the POST carries the same credentials. */
export async function updateStatus(id: number, status: string): Promise<{ ok: boolean }> {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!base || !key) return { ok: false };
  const res = await fetch(`${base}/rest/v1/job_submissions?id=eq.${id}`, {
    method: 'PATCH',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ status }),
  });
  if (res.ok) revalidatePath('/admin');
  return { ok: res.ok };
}
