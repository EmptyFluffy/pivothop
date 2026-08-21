'use server';
import { revalidatePath } from 'next/cache';
import { claim, mark, insertDraft } from '../../../lib/social/store';
import { firstVerifiedCandidate, selectSocialJob, scoreJob } from '../../../lib/social/select';
import { generateSocialPost, jobUrl } from '../../../lib/social/copy';
import { getJobs } from '../../jobs/jobs-data';

/* Queue controls. Behind the same /admin Basic Auth gate as the rest of the
   console; server actions carry the credentials on every POST. */

export async function approvePost(id: number): Promise<{ ok: boolean }> {
  const row = await claim(id, 'draft', { status: 'scheduled' });
  revalidatePath('/admin/social');
  return { ok: !!row };
}

export async function skipPost(id: number): Promise<{ ok: boolean }> {
  const ok = await mark(id, { status: 'skipped' });
  revalidatePath('/admin/social');
  return { ok };
}

/* Deterministic re-roll: same job, next template variant. */
export async function regeneratePost(id: number, occ: string, jobId: string, variant: number): Promise<{ ok: boolean }> {
  const j = getJobs(occ).find((x) => x.id === jobId);
  if (!j) return { ok: false };
  const c = scoreJob(j, null);
  const next = variant + 1;
  const { copy } = generateSocialPost(c, 'linkedin', next);
  const ok = await mark(id, {
    generated_copy: copy,
    job_url: jobUrl(occ, jobId),
    template_variant: next,
  });
  revalidatePath('/admin/social');
  return { ok };
}

/* Manual replacement: run the selector now, require a live original source,
   and send the verified pick straight to the Zapier queue. */
export async function queueReplacement(): Promise<{ ok: boolean; picked?: string }> {
  const { pick, considered } = await selectSocialJob('linkedin');
  const { candidate: live } = await firstVerifiedCandidate([pick, ...considered.slice(1)]);
  if (!live) return { ok: false };
  const { copy, variant } = generateSocialPost(live, 'linkedin');
  const row = await insertDraft({
    platform: 'linkedin',
    job_id: live.id, job_occ: live.occ, job_title: live.title, job_company: live.company,
    job_url: jobUrl(live.occ, live.id),
    generated_copy: copy, template_variant: variant,
    selection_score: live.score,
    selection_reason: [...live.reasons, 'source verified live'].join(' + ') || 'source verified live',
    status: 'scheduled', scheduled_at: new Date().toISOString(),
  });
  revalidatePath('/admin/social');
  return { ok: !!row, picked: row ? `${live.title} at ${live.company}` : undefined };
}
