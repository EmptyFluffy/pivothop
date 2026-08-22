import { NextRequest, NextResponse } from 'next/server';
import { recentPosts, mark } from '../../../../lib/social/store';
import { checkOriginalJob, stillLive } from '../../../../lib/social/select';
import { getJob } from '../../../jobs/jobs-data';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/* One-time authenticated publication test requested for 1:00 p.m. Costa Rica
   on 2026-08-22. It becomes inert after ten minutes and can queue at most one
   row because every later poll sees the row created during this window. */
const ONE_PM_TEST_START = Date.parse('2026-08-22T19:00:00Z');
const ONE_PM_TEST_END = Date.parse('2026-08-22T19:20:00Z');

/* The Zapier-facing queue. Returns approved (`scheduled`) items as a JSON
   array, newest first, each with a stable unique `id` · Zapier's polling
   trigger deduplicates on that key, so an item fires exactly one Zap run even
   though the feed keeps returning it until consumed. Board retirement and a
   definite source-page expiry both remove an item before the publisher sees it.

   Auth: SOCIAL_FEED_TOKEN as ?token= (Zapier-friendly) or a Bearer header.
   Provider-agnostic on purpose: replacing Zapier with LinkedIn's direct API
   later means pointing a different consumer at this same queue. */

function authorized(req: NextRequest): boolean {
  const t = process.env.SOCIAL_FEED_TOKEN;
  if (!t) return false;
  return req.nextUrl.searchParams.get('token') === t || req.headers.get('authorization') === `Bearer ${t}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let rows = await recentPosts('linkedin', 30);
  const now = Date.now();
  const testAlreadyQueued = rows.some((row) =>
    (row.status === 'scheduled' || row.status === 'published') &&
    Date.parse(row.created_at) >= ONE_PM_TEST_START,
  );
  if (now >= ONE_PM_TEST_START && now < ONE_PM_TEST_END && !testAlreadyQueued) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const cronUrl = new URL('/api/social/cron', req.nextUrl.origin);
      const cronResponse = await fetch(cronUrl, {
        headers: { Authorization: `Bearer ${cronSecret}` },
        cache: 'no-store',
      });
      const outcome = await cronResponse.text();
      console.log(`[social] 1pm test trigger: status=${cronResponse.status} outcome=${outcome.slice(0, 1000)}`);
      rows = await recentPosts('linkedin', 30);
    } else {
      console.warn('[social] 1pm test trigger skipped: CRON_SECRET is missing');
    }
  }
  const items = [];
  for (const r of rows) {
    if (r.status !== 'scheduled') continue;
    if (!stillLive(r.job_occ, r.job_id)) {
      await mark(r.id, { status: 'skipped', last_error: 'expired before publication: missing from board' });
      continue;
    }

    const source = await checkOriginalJob(r.job_occ, r.job_id);
    if (source.state === 'expired') {
      await mark(r.id, { status: 'skipped', last_error: `expired before publication: ${source.reason}` });
      continue;
    }
    /* New rows were source-verified by the cron. If the second check is
       transiently blocked, preserve that recent verification. Old unverified
       rows are held back rather than guessed live. */
    const sourceWasAccepted = r.selection_reason.includes('source verified live') ||
      r.selection_reason.includes('source unverified fallback');
    if (source.state === 'unverified' && !sourceWasAccepted) {
      await mark(r.id, { status: 'skipped', last_error: `source unverified before publication: ${source.reason}` });
      continue;
    }

    const job = getJob(r.job_occ, r.job_id);
    const pay = job?.smin && job?.smax
      ? `${Math.round(job.smin / 1000)}k–${Math.round(job.smax / 1000)}k`
      : job?.smin || job?.smax
        ? `${Math.round((job.smin || job.smax)! / 1000)}k`
        : null;
    const place = job?.remote ? 'Remote' : job?.location || null;
    const previewDescription = [
      place,
      pay,
      'Salary, skills and measured career routes on PivotHop.',
    ].filter(Boolean).join(' · ');
    const cardUrl = new URL('/api/social/card', req.nextUrl.origin);
    cardUrl.searchParams.set('occ', r.job_occ);
    cardUrl.searchParams.set('id', r.job_id);
    const cardCopy = r.generated_copy
      .split('\n')
      .filter((line) => line.trim() !== r.job_url)
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');

    items.push({
      id: `ph-li-${r.id}`,                    // unique publication id; Zapier dedup key
      publication_id: `ph-li-${r.id}`,
      job_id: r.job_id,
      job_title: r.job_title,
      company: r.job_company,
      location: null as string | null,        // location and salary live inside the copy; kept for mapping
      salary: null as string | null,
      generated_post_copy: r.generated_copy,
      card_post_copy: cardCopy,
      job_url: r.job_url,
      media_url: r.job_url,
      image_type: 'preview_thumbnail',
      image: cardUrl.toString(),
      preview_image_url: cardUrl.toString(),
      preview_title: `${r.job_title} at ${r.job_company} | PivotHop`,
      preview_description: previewDescription,
      social_score: r.selection_score,
      selection_reason: r.selection_reason,
      scheduled_at: r.scheduled_at,
    });
  }
  return NextResponse.json(items);
}
