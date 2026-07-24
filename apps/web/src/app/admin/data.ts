import 'server-only';

export type Submission = {
  id: number;
  tier: string;
  role: string;
  occupation_slug: string | null;
  employment_type: string | null;
  workplace: string | null;
  region: string | null;
  salary_min: number | null;
  salary_max: number | null;
  about: string | null;
  responsibilities: string | null;
  qualifications: string | null;
  skills: string[] | null;
  benefits: string[] | null;
  company: string;
  logo_url: string | null;
  contact_email: string;
  contact_name: string | null;
  apply_url: string | null;
  apply_email: string | null;
  status: string;
  created_at: string;
};

export async function readSubmissions(): Promise<{ rows: Submission[]; error: string | null }> {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!base || !key) return { rows: [], error: 'not-configured' };
  try {
    const res = await fetch(`${base}/rest/v1/job_submissions?select=*&order=created_at.desc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (!res.ok) return { rows: [], error: `db-${res.status}` };
    return { rows: (await res.json()) as Submission[], error: null };
  } catch {
    return { rows: [], error: 'network' };
  }
}
