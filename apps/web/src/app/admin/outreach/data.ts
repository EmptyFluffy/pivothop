import 'server-only';
import targets from '../../../../../../packages/data/outreach/targets.json';
import curated from '../../../../../../packages/data/outreach/curated.json';

/* Outreach target list + its campaign state.
 *
 * The ranking is a build artefact (build-outreach-targets.py, recomputed from the
 * corpus); the state is a database row. They are joined here on company_key so a
 * re-rank never loses history and history never pins a stale ranking.
 *
 * targets.json is imported rather than fetched: it lives OUTSIDE apps/web/public,
 * because a scored list of who we are about to pitch is not something to serve to
 * the world. The import bundles it server-side, and no client component receives
 * it whole. */

export type Target = {
  key: string;
  company: string;
  /** Dominant industry among the company's adjacent openings (taxonomy `field`). */
  field: string;
  /** Corpus footprint, not headcount: major = 100+ open roles here (long shot),
   *  mid = 20–99, small = <20. The filter exists because a giant's inbox is
   *  unreachable and the operator should be able to hide them. */
  scale: 'small' | 'mid' | 'major';
  score: number;
  why: { reach: number; volume: number; age: number };
  open_roles: number;
  adjacent_roles: number;
  days_open: number;
  pitch: {
    role: string; role_slug: string; from: string; from_slug: string;
    readiness: number; pool: number;
    /** 'pivot' crosses industry clusters — the pitch worth sending. 'lateral' stays
     *  inside one, which usually means the adjacency is obvious to the employer. */
    kind: 'pivot' | 'lateral';
    /** How many of THIS role the company has open — what makes the pitch their problem. */
    openings: number;
  };
  top_occupations: { slug: string; title: string; n: number }[];
  countries: string[];
  mail_ok: boolean;
  /** false = no country on any posting. Allowed, but the operator should look. */
  country_known: boolean;
  /** Staffing/RPO firm: resells the same candidates we'd introduce. Flagged, not dropped. */
  staffing: boolean;
  sources: string[];
  domain_candidates: string[];
};

export type Status = {
  company_key: string;
  status: string;
  owner: string | null;
  contact_email: string | null;
  contact_name: string | null;
  note: string | null;
  contacted_at: string | null;
};

export type Row = Target & { state: Status | null };

/** Hand-curated non-employer targets (phases 2-3): launch boards, press desks,
 *  career-education orgs for backlinks. Source: packages/data/outreach/curated.json.
 *  Status lives in the SAME outreach_status table under key "cur:<slug>". */
export type CuratedTarget = {
  slug: string;
  category: 'launch' | 'press' | 'backlink';
  name: string;
  url: string;
  why: string;
  pitch: string;
};
export type CuratedRow = CuratedTarget & { state: Status | null };

export const meta = {
  generated: (targets as { generated: string }).generated,
  scored: (targets as { scored: number }).scored,
  emitted: (targets as { emitted: number }).emitted,
  blocked: (targets as { blocked_by_consent: number }).blocked_by_consent,
  minReadiness: (targets as { min_readiness: number }).min_readiness,
};

export async function readOutreach(): Promise<{ rows: Row[]; curated: CuratedRow[]; error: string | null }> {
  const list = (targets as { targets: Target[] }).targets ?? [];
  const cur = (curated as { targets: CuratedTarget[] }).targets ?? [];
  const bare = { rows: list.map((t) => ({ ...t, state: null })), curated: cur.map((c) => ({ ...c, state: null })) };
  const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_KEY;
  // The lists are useful before the table exists — they are build artefacts, not
  // queries. Missing credentials degrade to a read-only console, not an error page.
  if (!base || !key) return { ...bare, error: 'not-configured' };
  try {
    const res = await fetch(`${base}/rest/v1/outreach_status?select=*`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (!res.ok) return { ...bare, error: `db-${res.status}` };
    const states = (await res.json()) as Status[];
    const byKey = new Map(states.map((s) => [s.company_key, s]));
    return {
      rows: list.map((t) => ({ ...t, state: byKey.get(t.key) ?? null })),
      curated: cur.map((c) => ({ ...c, state: byKey.get(`cur:${c.slug}`) ?? null })),
      error: null,
    };
  } catch {
    return { ...bare, error: 'network' };
  }
}
