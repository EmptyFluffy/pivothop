'use server';
import { revalidatePath } from 'next/cache';

/* Upsert one company's outreach state. Behind the /admin Basic Auth gate, so the
   POST carries the same credentials as the page that rendered the control.

   Upsert rather than update: a target has no row until someone touches it, so the
   first action on 1,200 listed companies must create rather than fail. */
export async function setOutreach(
  companyKey: string,
  company: string,
  patch: { status?: string; owner?: string; note?: string; contact_email?: string; contact_name?: string },
): Promise<{ ok: boolean }> {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!base || !key) return { ok: false };
  const body: Record<string, unknown> = {
    company_key: companyKey,
    company,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  // Stamp the moment of contact once, when the status first says so — the operator
  // should not have to type a date, and an overwrite would lose the real one.
  if (patch.status === 'contacted') body.contacted_at = new Date().toISOString();
  const res = await fetch(`${base}/rest/v1/outreach_status?on_conflict=company_key`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(body),
  });
  if (res.ok) revalidatePath('/admin/outreach');
  return { ok: res.ok };
}
