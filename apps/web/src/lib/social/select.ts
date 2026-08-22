import 'server-only';
import { getJobs, getJobSkills, getJobSections, jobOccupations, occTitle } from '../../app/jobs/jobs-data';
import { routableSlugs, routePair, destRole } from '../../app/routes/routes-data';
import type { Candidate, Platform } from './types';
import { recentPosts } from './store';

/* Deterministic selection. No model calls, no randomness: the same corpus and
   the same ledger always pick the same job, so a rerun after a crash cannot
   wander. Every scoring signal is data the site already shows. */

const GENERIC_TITLES = /^(senior |junior |lead )?(software engineer|developer|engineer|manager|analyst|consultant|assistant|specialist)$/i;

export type SocialJobFilter = {
  remoteOnly?: boolean;
  occupations?: readonly string[];
};

function mid(smin: number | null, smax: number | null): number | null {
  const v = [smin, smax].filter((x): x is number => !!x);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function daysAgo(posted: string): number {
  const t = Date.parse(`${posted.slice(0, 10)}T12:00:00Z`);
  return Number.isFinite(t) ? Math.max(0, Math.floor((Date.now() - t) / 864e5)) : 999;
}

/* Strongest measured way IN to this occupation, the same numbers the listing
   page prints. Nothing here is invented: no route, no adjacency line. */
function bestWayIn(occ: string): Candidate['adjacency'] {
  let best: Candidate['adjacency'] = null;
  for (const s of routableSlugs()) {
    const p = routePair(s);
    if (!p || p.dest !== occ) continue;
    const r = destRole(p.origin, p.dest);
    if (!r || typeof r.match !== 'number') continue;
    if (!best || r.match > best.match) {
      best = { originTitle: occTitle(p.origin), match: r.match, gap: (r as { gap?: string[] }).gap ?? [] };
    }
  }
  return best;
}

export function scoreJob(j: {
  id: string; occ: string; title: string; company: string; location: string;
  remote: boolean; smin: number | null; smax: number | null; posted: string; c?: string;
}, occMedian: number | null): Candidate {
  const reasons: string[] = [];
  let score = 0;
  const m = mid(j.smin, j.smax);
  if (m) { score += 2; reasons.push('salary disclosed'); }
  if (m && occMedian && m >= 1.2 * occMedian) { score += 1.5; reasons.push('pays above the occupation median'); }
  if (j.remote) { score += 1.5; reasons.push('remote'); }
  const age = daysAgo(j.posted);
  if (age <= 2) { score += 2; reasons.push('first seen this week'); }
  else if (age <= 7) { score += 1; reasons.push('recent'); }
  else if (age > 30) { score -= 2; }
  const skills = getJobSkills(j.occ, j.id);
  if (skills.length >= 3) { score += 1; reasons.push('strong skill data'); }
  const sections = getJobSections(j.occ, j.id);
  if (sections.length >= 2) { score += 1; reasons.push('full posting text'); }
  else if (sections.length === 0) { score -= 1; }
  if (j.location && j.location.length > 2) { score += 0.5; }
  else if (!j.remote) { score -= 0.5; }
  const adjacency = bestWayIn(j.occ);
  if (adjacency && adjacency.match >= 60) { score += 1; reasons.push('measured route in'); }
  if (GENERIC_TITLES.test(j.title.trim())) { score -= 1; }
  if (j.title.length < 8 || j.title.length > 90) { score -= 1; }
  const MAX = 10.5;
  return {
    id: j.id, occ: j.occ, title: j.title, company: j.company, location: j.location,
    remote: j.remote, smin: j.smin, smax: j.smax, posted: j.posted, country: j.c ?? null,
    score: Math.round(Math.max(0, (score / MAX) * 100)),
    reasons, skills: skills.slice(0, 6), sectionCount: sections.length, adjacency,
  };
}

export async function selectSocialJob(platform: Platform, filter?: SocialJobFilter): Promise<{ pick: Candidate | null; pool: number; considered: Candidate[] }> {
  const dedupDays = Number(process.env.SOCIAL_DEDUP_DAYS || 45);
  const allowedOccupations = filter?.occupations ? new Set(filter.occupations) : null;
  const recent = await recentPosts(platform, 40);
  const cutoff = Date.now() - dedupDays * 864e5;
  const postedIds = new Set(recent.filter((r) => Date.parse(r.created_at) > cutoff || r.status === 'published').map((r) => r.job_id));
  const postedPairs = new Set(recent.map((r) => `${r.job_company}::${r.job_title}`.toLowerCase()));
  const lastRows = recent.filter((r) => r.status !== 'skipped' && r.status !== 'failed');
  const lastCompanies = new Set(lastRows.slice(0, 5).map((r) => r.job_company.toLowerCase()));
  const lastOccs = new Set(lastRows.slice(0, 3).map((r) => r.job_occ));
  const lastOcc = lastRows[0]?.job_occ ?? null;

  const candidates: Candidate[] = [];
  for (const occ of jobOccupations()) {
    const jobs = getJobs(occ);
    if (!jobs.length) continue;
    const mids = jobs.map((j) => mid(j.smin, j.smax)).filter((x): x is number => !!x).sort((a, b) => a - b);
    const occMedian = mids.length >= 8 ? mids[Math.floor(mids.length / 2)] : null;
    for (const j of jobs) {
      /* Board presence is the first liveness gate. A source-URL verification
         runs on the shortlisted candidates immediately before queueing. */
      if (j.source === 'employer') continue; // employer posts link out; no internal page to send people to
      if (filter?.remoteOnly && !j.remote) continue;
      if (allowedOccupations && !allowedOccupations.has(j.occ)) continue;
      if (!j.title?.trim() || !j.company?.trim() || j.company === 'Name') continue;
      if (daysAgo(j.posted) > 60) continue;
      if (postedIds.has(j.id)) continue;
      if (postedPairs.has(`${j.company}::${j.title}`.toLowerCase())) continue;
      /* Diversity: hard constraints against the recent ledger. */
      if (lastCompanies.has(j.company.toLowerCase())) continue;
      if (lastOccs.has(j.occ)) continue;
      const c = scoreJob(j, occMedian);
      if (lastOcc && c.occ === lastOcc) c.score -= 10;
      candidates.push(c);
    }
  }
  candidates.sort((a, b) => b.score - a.score || a.posted.localeCompare(b.posted) || a.id.localeCompare(b.id));
  return { pick: candidates[0] ?? null, pool: candidates.length, considered: candidates.slice(0, 12) };
}

/* The job must still exist on the board carried by the current deployment. */
export function stillLive(occ: string, id: string): boolean {
  return getJobs(occ).some((j) => j.id === id);
}

export type SourceCheck = {
  state: 'live' | 'expired' | 'unverified';
  reason: string;
  status: number | null;
};

const EXPIRED_SOURCE_PATTERNS: RegExp[] = [
  /\bthis (?:job|position|vacancy|posting) is no longer available\b/i,
  /\bthis (?:job|position|vacancy|posting) has (?:expired|been filled|been closed)\b/i,
  /\b(?:job|position|vacancy|posting) (?:is|has) (?:expired|closed)\b/i,
  /\bno longer accepting applications\b/i,
  /\bapplications? (?:are|is) (?:now )?closed\b/i,
  /\bthe (?:job|position) you (?:are|were|'re) looking for (?:is no longer available|has been filled)\b/i,
  /\b(?:job|position|vacancy) not found\b/i,
];

async function responsePrefix(res: Response, limit = 256_000): Promise<string> {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  try {
    while (text.length < limit) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return text.slice(0, limit);
}

/* Confirm the original application URL immediately before queueing. A definite
   404/410 or an explicit expiry message blocks publication. Network failures,
   bot blocks, and rate limits are reported as unverified so the selector can
   try the next candidate instead of guessing. */
export async function checkOriginalJob(occ: string, id: string): Promise<SourceCheck> {
  const job = getJobs(occ).find((j) => j.id === id);
  if (!job) return { state: 'expired', reason: 'missing from current board', status: null };
  if (!job.url) return { state: 'unverified', reason: 'missing original URL', status: null };

  try {
    const res = await fetch(job.url, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
      headers: {
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.7',
        'Accept-Language': 'en-US,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; PivotHopJobVerifier/1.0; +https://www.pivothop.com)',
      },
    });

    if (res.status === 404 || res.status === 410) {
      return { state: 'expired', reason: `source returned ${res.status}`, status: res.status };
    }
    if (!res.ok) {
      return { state: 'unverified', reason: `source returned ${res.status}`, status: res.status };
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (contentType && !contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return { state: 'live', reason: `source returned ${res.status}`, status: res.status };
    }

    const raw = await responsePrefix(res);
    const visible = raw
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ');

    const expiredPattern = EXPIRED_SOURCE_PATTERNS.find((pattern) => pattern.test(visible));
    if (expiredPattern) {
      return { state: 'expired', reason: 'source page reports the job closed', status: res.status };
    }
    return { state: 'live', reason: `source verified ${res.status}`, status: res.status };
  } catch (error) {
    const reason = error instanceof Error && error.name === 'TimeoutError'
      ? 'source verification timed out'
      : 'source verification failed';
    return { state: 'unverified', reason, status: null };
  }
}

export async function firstVerifiedCandidate(
  candidates: Array<Candidate | null>,
  maxChecks = 10,
): Promise<{ candidate: Candidate | null; checks: Array<{ id: string; state: SourceCheck['state']; reason: string }> }> {
  const checks: Array<{ id: string; state: SourceCheck['state']; reason: string }> = [];
  let unverifiedFallback: Candidate | null = null;
  let attempted = 0;
  for (const candidate of candidates) {
    if (!candidate || !stillLive(candidate.occ, candidate.id)) continue;
    if (attempted >= maxChecks) break;
    attempted += 1;
    const check = await checkOriginalJob(candidate.occ, candidate.id);
    checks.push({ id: candidate.id, state: check.state, reason: check.reason });
    if (check.state === 'live') return { candidate, checks };
    if (check.state === 'unverified' && !unverifiedFallback) unverifiedFallback = candidate;
  }
  /* A bot block or timeout is not evidence that the vacancy expired. After
     checking the shortlist, preserve cadence with the best candidate still
     present in PivotHop; explicit 404/410/closed results never reach here. */
  return { candidate: unverifiedFallback, checks };
}
