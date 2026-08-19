import 'server-only';
import type { Candidate, Platform } from './types';

/* Deterministic copy generation. Template choice is a hash of the job id, so
   a rerun regenerates the identical post; "regenerate" bumps the variant.
   Every line is derived from stored data: no invented salaries, skills,
   remoteness, overlap, or urgency. */

const SITE = 'https://www.pivothop.com';

export function jobUrl(occ: string, id: string): string {
  const u = new URL(`${SITE}/jobs/${occ}/${id}`);
  u.searchParams.set('utm_source', 'linkedin');
  u.searchParams.set('utm_medium', 'organic_social');
  u.searchParams.set('utm_campaign', 'daily_jobs');
  u.searchParams.set('utm_content', `${occ}-${id}`);
  return u.toString();
}

const k = (n: number) => '$' + Math.round(n / 1000) + 'k';
function payLine(c: Candidate): string | null {
  if (c.smin && c.smax && c.smax > c.smin) return `${k(c.smin)}-${k(c.smax)}`;
  const v = c.smin || c.smax;
  return v ? k(v) : null;
}
function placeLine(c: Candidate): string {
  if (c.remote && c.location) return `Remote · ${c.location}`;
  if (c.remote) return 'Remote';
  return c.location || 'On-site';
}
function hashtags(): string {
  const raw = process.env.SOCIAL_HASHTAGS ?? '#hiring #careers';
  const tags = raw.split(/\s+/).filter((t) => t.startsWith('#')).slice(0, 4);
  return tags.join(' ');
}
function fact(c: Candidate): string | null {
  if (c.skills.length >= 2) return `Skills in the posting: ${c.skills.slice(0, 4).join(' · ')}.`;
  if (c.sectionCount >= 2) return 'Full posting text on the listing, straight from the source.';
  const age = Math.floor((Date.now() - Date.parse(c.posted)) / 864e5);
  if (age <= 2) return 'First seen on our board this week.';
  return null;
}

type Tpl = (c: Candidate) => string;
const TEMPLATES: Tpl[] = [
  (c) => [
    `${c.company} is hiring a ${c.title}.`,
    '',
    `\u{1F4CD} ${placeLine(c)}`,
    payLine(c) ? `\u{1F4B0} ${payLine(c)}` : null,
    '',
    fact(c),
    '',
    'View the role on PivotHop:',
    jobUrl(c.occ, c.id),
  ].filter((l): l is string => l !== null).join('\n'),
  (c) => [
    'New on PivotHop:',
    '',
    `${c.title} at ${c.company}`,
    [placeLine(c), payLine(c)].filter(Boolean).join(' · '),
    '',
    c.skills.length >= 2 ? `Top skills:\n${c.skills.slice(0, 4).join(' · ')}` : null,
    '',
    jobUrl(c.occ, c.id),
  ].filter((l): l is string => l !== null).join('\n'),
  (c) => [
    'Worth a look:',
    '',
    `${c.company} · ${c.title}`,
    [payLine(c), placeLine(c)].filter(Boolean).join(' · '),
    '',
    c.reasons.length ? `Why it stood out: ${c.reasons.slice(0, 3).join(', ')}.` : null,
    '',
    jobUrl(c.occ, c.id),
  ].filter((l): l is string => l !== null).join('\n'),
  (c) => [
    `${c.title} · ${c.company}`,
    placeLine(c) + (payLine(c) ? ` · ${payLine(c)}` : ''),
    '',
    fact(c),
    '',
    `Listing, salary context and the skills it asks for:`,
    jobUrl(c.occ, c.id),
  ].filter((l): l is string => l !== null).join('\n'),
  (c) => [
    `Hiring now: ${c.title}`,
    '',
    `${c.company} · ${placeLine(c)}`,
    payLine(c) ? `Posted pay: ${payLine(c)}` : null,
    '',
    'Details on PivotHop:',
    jobUrl(c.occ, c.id),
  ].filter((l): l is string => l !== null).join('\n'),
  (c) => c.adjacency && c.adjacency.match >= 60 ? [
    `${c.adjacency.originTitle}s already cover ${c.adjacency.match}% of the skills this role asks for:`,
    '',
    `${c.title} at ${c.company}`,
    [placeLine(c), payLine(c)].filter(Boolean).join(' · '),
    '',
    c.adjacency.gap.length ? `Biggest gaps:\n${c.adjacency.gap.slice(0, 3).join(' · ')}` : null,
    '',
    jobUrl(c.occ, c.id),
  ].filter((l): l is string => l !== null).join('\n')
  : TEMPLATES[0](c),
];

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

export function generateSocialPost(c: Candidate, _platform: Platform, variant = 0): { copy: string; variant: number } {
  const idx = (djb2(c.id) + variant) % TEMPLATES.length;
  const body = TEMPLATES[idx](c);
  const tags = hashtags();
  return { copy: tags ? `${body}\n\n${tags}` : body, variant };
}
