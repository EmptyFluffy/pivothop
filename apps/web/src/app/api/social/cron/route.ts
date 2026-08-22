import { NextRequest, NextResponse } from 'next/server';
import { firstVerifiedCandidate, selectSocialJob } from '../../../../lib/social/select';
import { generateSocialPost, jobUrl } from '../../../../lib/social/copy';
import { insertDraft, publishedOrScheduledToday, recentPosts } from '../../../../lib/social/store';
import { getJob } from '../../../jobs/jobs-data';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const REMOTE_ARCHITECTURE_SCHEDULE = '15 15 * * *';
const REMOTE_ARCHITECTURE_RETRY_SCHEDULES = new Set([
  REMOTE_ARCHITECTURE_SCHEDULE,
  '45 16 * * *',
  '15 18 * * *',
  '45 18 * * *',
  '15 20 * * *',
  '15 22 * * *',
]);
const REMOTE_ARCHITECTURE_OCCUPATIONS = [
  'architect',
  'architectural-drafter',
  'bim-manager',
  'computational-designer',
  'interior-technologist',
  'urban-planner',
  'vdc-manager',
  'mobility-planner',
  'landscape-architect',
  'sustainability-consultant',
  'building-performance-analyst',
  'building-envelope-consultant',
  'visualization-artist',
] as const;

/* The 15x/day selector (vercel.json crons). Publishing is NOT done here: this
   selects one job and enqueues it for Zapier, which consumes /api/social/feed
   and reports back through /api/social/consume. New rows are automatically
   scheduled by default. SOCIAL_AUTO_APPROVE=false is an emergency review-mode
   override; no environment change is required to run automatically. */

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  /* Keep the production cadence aligned with the 15 cron slots. A stale
     SOCIAL_POSTS_PER_DAY value must not silently throttle the queue. */
  const perDay = 15;
  const autoApprove = process.env.SOCIAL_AUTO_APPROVE !== 'false';
  const forceRemoteArchitecture = req.nextUrl.searchParams.get('focus') === 'remote-architecture';
  const cronSchedule = req.headers.get('x-vercel-cron');
  const architectureRetryWindow = cronSchedule ? REMOTE_ARCHITECTURE_RETRY_SCHEDULES.has(cronSchedule) : false;

  const today = await publishedOrScheduledToday('linkedin', 'UTC');
  if (today >= perDay) {
    console.log(`[social] skip: daily cap reached (${today}/${perDay})`);
    return NextResponse.json({ ok: true, action: 'skip', reason: `daily cap reached (${today}/${perDay})` });
  }

  let remoteArchitectureAlreadyQueued = false;
  if (architectureRetryWindow && !forceRemoteArchitecture) {
    const recent = await recentPosts('linkedin', 20);
    const utcDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(new Date());
    remoteArchitectureAlreadyQueued = recent.some((row) => {
      if (row.status !== 'scheduled' && row.status !== 'published') return false;
      const rowDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(new Date(row.created_at));
      if (rowDay !== utcDay || !REMOTE_ARCHITECTURE_OCCUPATIONS.includes(row.job_occ as typeof REMOTE_ARCHITECTURE_OCCUPATIONS[number])) return false;
      return Boolean(getJob(row.job_occ, row.job_id)?.remote);
    });
  }
  const remoteArchitectureSlot = forceRemoteArchitecture || (architectureRetryWindow && !remoteArchitectureAlreadyQueued);

  let selection = await selectSocialJob('linkedin', remoteArchitectureSlot ? {
    remoteOnly: true,
    occupations: REMOTE_ARCHITECTURE_OCCUPATIONS,
  } : undefined);
  let verified = await firstVerifiedCandidate([selection.pick, ...selection.considered.slice(1)]);
  let live = verified.candidate;
  let checks = verified.checks;
  let pool = selection.pool;
  const usedRemoteArchitectureSlot = remoteArchitectureSlot && Boolean(live);

  /* Preserve the 15-post cadence if an architecture attempt has no eligible,
     source-verified listing. It falls back to the general pool for this run;
     later slots retry architecture until one is queued that UTC day. */
  if (!live && remoteArchitectureSlot) {
    const attempted = new Set(checks.map((check) => check.id));
    selection = await selectSocialJob('linkedin');
    const fallbackCandidates = [selection.pick, ...selection.considered.slice(1)]
      .filter((candidate) => candidate && !attempted.has(candidate.id));
    verified = await firstVerifiedCandidate(fallbackCandidates);
    live = verified.candidate;
    checks = [...checks, ...verified.checks];
    pool += selection.pool;
  }

  if (!live) {
    console.warn(`[social] none: no source-verified candidate (focus=${remoteArchitectureSlot ? 'remote-architecture' : 'general'}, pool=${pool}, checks=${JSON.stringify(checks)})`);
    return NextResponse.json({
      ok: true,
      action: 'none',
      reason: 'no source-verified candidate',
      focus: remoteArchitectureSlot ? 'remote-architecture' : 'general',
      pool,
      source_checks: checks,
    });
  }

  const { copy, variant } = generateSocialPost(live, 'linkedin');
  const row = await insertDraft({
    platform: 'linkedin',
    job_id: live.id, job_occ: live.occ, job_title: live.title, job_company: live.company,
    job_url: jobUrl(live.occ, live.id),
    generated_copy: copy, template_variant: variant,
    selection_score: live.score,
    selection_reason: [
      ...live.reasons,
      usedRemoteArchitectureSlot ? 'dedicated remote architecture slot' : null,
      remoteArchitectureSlot && !usedRemoteArchitectureSlot ? 'remote architecture slot fallback' : null,
      'source verified live',
    ].filter(Boolean).join(' + ') || 'source verified live',
    status: autoApprove ? 'scheduled' : 'draft',
    scheduled_at: new Date().toISOString(),
  });
  if (!row) {
    console.warn(`[social] none: insert failed or already queued (job=${live.id}, title=${live.title}, company=${live.company})`);
    return NextResponse.json({ ok: true, action: 'none', reason: 'insert failed or already queued' });
  }

  console.log(`[social] queued ${row.status}: ${live.title} at ${live.company} (score ${live.score})`);
  return NextResponse.json({
    ok: true, action: autoApprove ? 'queued-scheduled' : 'queued-draft',
    id: row.id, job: `${live.title} at ${live.company}`, score: live.score,
    focus: usedRemoteArchitectureSlot ? 'remote-architecture' : 'general',
    reason: row.selection_reason, source_checks: checks, copy,
  });
}
