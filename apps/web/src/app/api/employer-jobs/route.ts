import fs from 'node:fs';
import path from 'node:path';
import type { Job } from '../../jobs/JobCard';

export const dynamic = 'force-dynamic';

/* The live layer: approved employer submissions, mapped to the board's Job
   shape. The board fetches this and merges it with the static scraped jobs, so
   an approved post appears instantly.

   Published statuses are 'posted' (a human approved it in /admin — the free
   early-access path) and 'paid' (the Lemon Squeezy webhook, kept for when
   payments return). Anything else — new, reviewing, declined — stays off the
   board, so declining in /admin removes a listing. */
type Row = {
  id: number; tier: string; role: string; company: string; occupation_slug: string | null;
  workplace: string | null; region: string | null; salary_min: number | null; salary_max: number | null;
  benefits: string[] | null; apply_url: string | null; apply_email: string | null;
  paid_at: string | null; created_at: string;
};

/* Benefit terms -> the board's taxonomy indices, read from the same glossary
   the scraped rows are encoded against, so an employer's stated benefits
   become the same filterable pills. The form picks from this exact list. */
let _benIdx: Map<string, number> | null = null;
function benIndex(): Map<string, number> {
  if (_benIdx) return _benIdx;
  _benIdx = new Map();
  try {
    const g = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/benefits-glossary.json'), 'utf8')) as { term: string; i: number }[];
    for (const b of g) if (typeof b.i === 'number') _benIdx.set(b.term.toLowerCase(), b.i);
  } catch { /* no glossary: rows just carry no benefit pills */ }
  return _benIdx;
}

function toJob(r: Row): Job {
  const benefits = r.benefits || [];
  const has = (t: string) => benefits.some((b) => b.toLowerCase() === t);
  const fl: string[] = [];
  // 'Four-day week' is the taxonomy's own term; the older form wrote '4-day
  // week', so both spellings are honoured for rows already in the table.
  if (has('four-day week') || has('4-day week')) fl.push('4d');
  if (has('equity')) fl.push('eq');
  if (has('visa sponsorship')) fl.push('vi');
  const idx = benIndex();
  const b = benefits.map((t) => idx.get(t.toLowerCase())).filter((n): n is number => n != null);
  const remote = r.workplace === 'remote';
  return {
    id: `emp-${r.id}`,
    occ: r.occupation_slug || 'other',
    title: r.role,
    company: r.company,
    location: remote ? (r.region || 'Remote') : (r.region || (r.workplace === 'hybrid' ? 'Hybrid' : '')),
    remote,
    smin: r.salary_min, smax: r.salary_max,
    source: 'employer',
    posted: (r.paid_at || r.created_at || '').slice(0, 10),
    url: r.apply_url || (r.apply_email ? `mailto:${r.apply_email}` : undefined),
    featured: r.tier === 'featured',
    fl: fl.length ? fl : undefined,
    b: b.length ? b : undefined,
  };
}

export async function GET() {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!base || !key) return Response.json([]);
  try {
    const res = await fetch(`${base}/rest/v1/job_submissions?status=in.(posted,paid)&select=id,tier,role,company,occupation_slug,workplace,region,salary_min,salary_max,benefits,apply_url,apply_email,paid_at,created_at&order=created_at.desc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (!res.ok) return Response.json([]);
    return Response.json(((await res.json()) as Row[]).map(toJob));
  } catch {
    return Response.json([]);
  }
}
