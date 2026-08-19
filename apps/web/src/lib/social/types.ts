import 'server-only';

export type Platform = 'linkedin';

export type SocialPostRow = {
  id: number;
  platform: Platform;
  job_id: string;
  job_occ: string;
  job_title: string;
  job_company: string;
  job_url: string;
  generated_copy: string;
  template_variant: number;
  selection_score: number;
  selection_reason: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'skipped';
  scheduled_at: string | null;
  published_at: string | null;
  external_post_id: string | null;
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type Candidate = {
  id: string;
  occ: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  smin: number | null;
  smax: number | null;
  posted: string;
  country: string | null;
  score: number;
  reasons: string[];
  skills: string[];
  sectionCount: number;
  adjacency: { originTitle: string; match: number; gap: string[] } | null;
};
