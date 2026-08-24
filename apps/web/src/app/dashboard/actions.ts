'use server';
import { supabaseServer } from '../../lib/supabase-server';
import { STATUS_ORDER, type SavedJob, type SavedStatus } from '../../lib/saved';

/* Saved-jobs server actions. All of them run under the signed-in user's JWT
   through the anon-key client, so the per-user RLS policies in
   0010_accounts.sql are the authorization — no user_id ever comes from the
   client. Every action degrades to a null/ok:false result when Supabase is
   absent or nobody is signed in; the guest localStorage flow carries on. */

type Row = {
  occ: string; job_id: string; snapshot: Record<string, unknown>;
  status: SavedStatus; saved_at: string; applied_at: string | null; notes: string;
};

function toClient(r: Row): SavedJob {
  const s = r.snapshot as Partial<SavedJob>;
  return {
    occ: r.occ, id: r.job_id,
    title: String(s.title ?? ''), company: String(s.company ?? ''),
    location: s.location, remote: s.remote, smin: s.smin, smax: s.smax,
    posted: s.posted, url: s.url, logo: s.logo,
    savedAt: r.saved_at, status: r.status,
    appliedAt: r.applied_at ?? undefined, notes: r.notes || undefined,
  };
}

function toSnapshot(s: SavedJob): Record<string, unknown> {
  const { occ: _o, id: _i, savedAt: _s, status: _st, appliedAt: _a, notes: _n, ...snap } = s;
  return snap;
}

async function userClient() {
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data?.user ? { supabase, user: data.user } : null;
}

/** Who is signed in, if anyone. */
export async function whoAmI(): Promise<{ email: string } | null> {
  const ctx = await userClient();
  return ctx ? { email: ctx.user.email ?? '' } : null;
}

/** Merge the browser's guest list into the account, furthest status winning,
    then return the canonical server list for the client to mirror. */
export async function mergeSaved(local: SavedJob[]): Promise<SavedJob[] | null> {
  const ctx = await userClient();
  if (!ctx) return null;
  const { supabase, user } = ctx;

  const { data: existing } = await supabase.from('saved_jobs')
    .select('occ, job_id, snapshot, status, saved_at, applied_at, notes');
  const byKey = new Map((existing as Row[] | null ?? []).map((r) => [`${r.occ}/${r.job_id}`, r]));

  const rank = (s: SavedStatus) => STATUS_ORDER.indexOf(s);
  for (const s of local.slice(0, 100)) {
    if (!s?.occ || !s?.id) continue;
    const have = byKey.get(`${s.occ}/${s.id}`);
    if (!have) {
      await supabase.from('saved_jobs').insert({
        user_id: user.id, occ: s.occ, job_id: s.id, snapshot: toSnapshot(s),
        status: s.status, saved_at: s.savedAt || new Date().toISOString(),
        applied_at: s.appliedAt ?? null, notes: s.notes ?? '',
      });
    } else if (rank(s.status) > rank(have.status) || (s.notes && !have.notes)) {
      // a stale device must never downgrade an interviewing row back to saved
      await supabase.from('saved_jobs').update({
        status: rank(s.status) > rank(have.status) ? s.status : have.status,
        applied_at: have.applied_at ?? s.appliedAt ?? null,
        notes: have.notes || s.notes || '',
        status_changed_at: new Date().toISOString(),
      }).eq('occ', s.occ).eq('job_id', s.id);
    }
  }

  const { data: after } = await supabase.from('saved_jobs')
    .select('occ, job_id, snapshot, status, saved_at, applied_at, notes')
    .order('saved_at', { ascending: false });
  return (after as Row[] | null ?? []).map(toClient);
}

/** Fire-and-forget from the save button while signed in. */
export async function upsertSave(s: SavedJob): Promise<void> {
  const ctx = await userClient();
  if (!ctx || !s?.occ || !s?.id) return;
  await ctx.supabase.from('saved_jobs').upsert({
    user_id: ctx.user.id, occ: s.occ, job_id: s.id, snapshot: toSnapshot(s),
    status: s.status, saved_at: s.savedAt || new Date().toISOString(),
    applied_at: s.appliedAt ?? null, notes: s.notes ?? '',
  }, { onConflict: 'user_id,occ,job_id' });
}

export async function removeSave(occ: string, id: string): Promise<void> {
  const ctx = await userClient();
  if (!ctx) return;
  await ctx.supabase.from('saved_jobs').delete().eq('occ', occ).eq('job_id', id);
}

export async function updateSave(occ: string, id: string, patch: { status?: SavedStatus; notes?: string }): Promise<void> {
  const ctx = await userClient();
  if (!ctx) return;
  const upd: Record<string, unknown> = {};
  if (patch.status) {
    upd.status = patch.status;
    upd.status_changed_at = new Date().toISOString();
    if (patch.status === 'applied') upd.applied_at = new Date().toISOString();
  }
  if (patch.notes !== undefined) upd.notes = patch.notes;
  if (Object.keys(upd).length === 0) return;
  await ctx.supabase.from('saved_jobs').update(upd).eq('occ', occ).eq('job_id', id);
}
