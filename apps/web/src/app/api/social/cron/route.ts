import { NextRequest, NextResponse } from 'next/server';
import { firstVerifiedCandidate, selectSocialJob } from '../../../../lib/social/select';
import { generateSocialPost, jobUrl } from '../../../../lib/social/copy';
import { insertDraft, publishedOrScheduledToday } from '../../../../lib/social/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const REMOTE_ARCHITECTURE_SCHEDULE = '15 15 * * *';
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

  const configuredPerDay = Number(process.env.SOCIAL_POSTS_PER_DAY || 15);
  const perDay = Number.isFinite(configuredPerDay) && configuredPerDay > 0 ? configuredPerDay : 15;
  const autoApprove = process.env.SOCIAL_AUTO_APPROVE !== 'false';
  const remoteArchitectureSlot =
    req.nextUrl.searchParams.get('focus') === 'remote-architecture' ||
    req.headers.get('x-vercel-cron') === REMOTE_ARCHITECTURE_SCHEDULE;

  const today = await publishedOrScheduledToday('linkedin', 'UTC');
  if (today >= perDay) {
    return NextResponse.json({ ok: true, action: 'skip', reason: `daily cap reached (${today}/${perDay})` });
  }

  let selection = await selectSocialJob('linkedin', remoteArchitectureSlot ? {
    remoteOnly: true,
    occupations: REMOTE_ARCHITECTURE_OCCUPATIONS,
  } : undefined);
  let verified = await firstVerifiedCandidate([selection.pick, ...selection.considered.slice(1)]);
  let live = verified.candidate;
  let checks = verified.checks;
  let pool = selection.pool;
  const usedRemoteArchitectureSlot = remoteArchitectureSlot && Boolean(live);

  /* Preserve the 15-post cadence if the dedicated slot has no eligible,
     source-verified architecture listing. It falls back to the general pool
     instead of repeating a job or publishing an unverified source. */
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
  if (!row) return NextResponse.json({ ok: true, action: 'none', reason: 'insert failed or already queued' });

  console.log(`[social] queued ${row.status}: ${live.title} at ${live.company} (score ${live.score})`);
  return NextResponse.json({
    ok: true, action: autoApprove ? 'queued-scheduled' : 'queued-draft',
    id: row.id, job: `${live.title} at ${live.company}`, score: live.score,
    focus: usedRemoteArchitectureSlot ? 'remote-architecture' : 'general',
    reason: row.selection_reason, source_checks: checks, copy,
  });
}
