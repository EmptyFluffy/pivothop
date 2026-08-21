import { NextRequest, NextResponse } from 'next/server';
import { selectSocialJob, stillLive } from '../../../../lib/social/select';
import { generateSocialPost, jobUrl } from '../../../../lib/social/copy';
import { insertDraft, publishedOrScheduledToday } from '../../../../lib/social/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/* The 3x/day selector (vercel.json crons). Publishing is NOT done here: this
   selects one job and enqueues it for Zapier, which consumes /api/social/feed
   and reports back through /api/social/consume. New rows are automatically
   scheduled by default. SOCIAL_AUTO_APPROVE=false is an emergency review-mode
   override; no environment change is required to run automatically. */

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const perDay = Number(process.env.SOCIAL_POSTS_PER_DAY || 3);
  const autoApprove = process.env.SOCIAL_AUTO_APPROVE !== 'false';

  const today = await publishedOrScheduledToday('linkedin');
  if (today >= perDay) {
    return NextResponse.json({ ok: true, action: 'skip', reason: `daily cap reached (${today}/${perDay})` });
  }

  const { pick, pool, considered } = await selectSocialJob('linkedin');
  const live = [pick, ...considered.slice(1)].find((c) => c && stillLive(c.occ, c.id)) ?? null;
  if (!live) return NextResponse.json({ ok: true, action: 'none', reason: 'no eligible candidate', pool });

  const { copy, variant } = generateSocialPost(live, 'linkedin');
  const row = await insertDraft({
    platform: 'linkedin',
    job_id: live.id, job_occ: live.occ, job_title: live.title, job_company: live.company,
    job_url: jobUrl(live.occ, live.id),
    generated_copy: copy, template_variant: variant,
    selection_score: live.score, selection_reason: live.reasons.join(' + ') || 'baseline',
    status: autoApprove ? 'scheduled' : 'draft',
    scheduled_at: new Date().toISOString(),
  });
  if (!row) return NextResponse.json({ ok: true, action: 'none', reason: 'insert failed or already queued' });

  console.log(`[social] queued ${row.status}: ${live.title} at ${live.company} (score ${live.score})`);
  return NextResponse.json({
    ok: true, action: autoApprove ? 'queued-scheduled' : 'queued-draft',
    id: row.id, job: `${live.title} at ${live.company}`, score: live.score,
    reason: row.selection_reason, copy,
  });
}
