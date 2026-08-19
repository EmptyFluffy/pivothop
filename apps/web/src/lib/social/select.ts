import 'server-only';
import { getJobs, getJobSkills, getJobSections, jobOccupations, occTitle } from '../../app/jobs/jobs-data';
import { routableSlugs, routePair, destRole } from '../../app/routes/routes-data';
import type { Candidate, Platform } from './types';
import { recentPosts } from './store';

/* Deterministic selection. No model calls, no randomness: the same corpus and
   the same ledger always pick the same job, so a rerun after a crash cannot
   wander. Every scoring signal is data the site already shows. */

const GENERIC_TITLES = /^(senior |junior |lead )?(software engineer|developer|engineer|manager|analyst|consultant|assistant|specialist)$/i;

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

export async function selectSocialJob(platform: Platform): Promise<{ pick: Candidate | null; pool: number; considered: Candidate[] }> {
  const dedupDays = Number(process.env.SOCIAL_DEDUP_DAYS || 45);
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
      /* Eligibility. The board only carries live listings (nightly retirement,
         first-seen ledger), so presence here IS the live check; everything
         below narrows to postable. */
      if (j.source === 'employer') continue; // employer posts link out; no internal page to send people to
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

/* Final pre-publish liveness check: the job must still exist on the board the
   CURRENT deployment carries. If it retired between selection and publish, the
   caller skips it and selects again. */
export function stillLive(occ: string, id: string): boolean {
  return getJobs(occ).some((j) => j.id === id);
}
