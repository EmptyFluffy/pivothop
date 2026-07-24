import type { Job } from '../../jobs/JobCard';

export const dynamic = 'force-dynamic';

/* The live layer: paid employer submissions, mapped to the board's Job shape.
   The board fetches this and merges it with the static scraped jobs, so a paid
   post appears instantly. Only status='paid' rows are returned, so declining a
   post in /admin removes it from the board. */
type Row = {
  id: number; tier: string; role: string; company: string; occupation_slug: string | null;
  workplace: string | null; region: string | null; salary_min: number | null; salary_max: number | null;
  benefits: string[] | null; apply_url: string | null; apply_email: string | null;
  paid_at: string | null; created_at: string;
};

function toJob(r: Row): Job {
  const benefits = r.benefits || [];
  const fl: string[] = [];
  if (benefits.includes('4-day week')) fl.push('4d');
  if (benefits.includes('Equity')) fl.push('eq');
  if (benefits.includes('Visa sponsorship')) fl.push('vi');
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
  };
}

export async function GET() {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!base || !key) return Response.json([]);
  try {
    const res = await fetch(`${base}/rest/v1/job_submissions?status=eq.paid&select=id,tier,role,company,occupation_slug,workplace,region,salary_min,salary_max,benefits,apply_url,apply_email,paid_at,created_at&order=paid_at.desc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (!res.ok) return Response.json([]);
    return Response.json(((await res.json()) as Row[]).map(toJob));
  } catch {
    return Response.json([]);
  }
}
