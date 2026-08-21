import 'server-only';
import { skillDisplayName } from '../../app/jobs/jobs-data';
import type { Candidate, Platform } from './types';

/* Deterministic copy generation. Template choice is a hash of the job id, so
   a rerun regenerates the identical post; "regenerate" bumps the variant.
   Every line is derived from stored data: no invented salaries, skills,
   remoteness, overlap, or urgency. */

const SITE = 'https://www.pivothop.com';

export function jobUrl(_occ: string, id: string): string {
  return new URL(`/j/${encodeURIComponent(id)}`, SITE).toString();
}

const k = (n: number) => '$' + Math.round(n / 1000) + 'k';
function payLine(c: Candidate): string | null {
  if (c.smin && c.smax && c.smax > c.smin) return `${k(c.smin)}–${k(c.smax)}`;
  const v = c.smin || c.smax;
  return v ? k(v) : null;
}
function placeLine(c: Candidate): string {
  if (c.remote && c.location) return `Remote · ${c.location}`;
  if (c.remote) return 'Remote';
  return c.location || 'On-site';
}
function hashtags(): string {
  const raw = process.env.SOCIAL_HASHTAGS ?? '#Hiring #Careers';
  const tags = raw.split(/\s+/).filter((t) => t.startsWith('#')).slice(0, 4);
  return tags.join(' ');
}
function displaySkills(skills: string[], limit = 4): string {
  return skills.slice(0, limit).map(skillDisplayName).join(' · ');
}
function naturalList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}
const REASON_LABELS: Record<string, string> = {
  'salary disclosed': 'salary disclosed',
  'pays above the occupation median': 'pay above the occupation median',
  remote: 'remote',
  'first seen this week': 'first seen this week',
  recent: 'recent',
  'strong skill data': 'clear skill data',
  'full posting text': 'the full posting',
  'measured route in': 'a measured career route in',
};
function reasonText(c: Candidate): string | null {
  const reasons = c.reasons.slice(0, 3).map((reason) => REASON_LABELS[reason] ?? reason);
  return reasons.length ? naturalList(reasons) : null;
}
function fact(c: Candidate): string | null {
  if (c.skills.length >= 2) return `Skills in the posting: ${displaySkills(c.skills)}.`;
  if (c.sectionCount >= 2) return 'The full posting is available on the listing.';
  const age = Math.floor((Date.now() - Date.parse(c.posted)) / 864e5);
  if (age <= 2) return 'First seen on the board this week.';
  return null;
}
function post(lines: Array<string | null>): string {
  return lines.filter((line): line is string => line !== null).join('\n');
}

type Tpl = (c: Candidate) => string;
const TEMPLATES: Tpl[] = [
  (c) => post([
    '🔎 Job alert',
    '',
    `${c.title} at ${c.company}`,
    `📍 ${placeLine(c)}`,
    payLine(c) ? `💰 ${payLine(c)}` : null,
    '',
    reasonText(c) ? `This one stood out: ${reasonText(c)}.` : null,
    fact(c),
    '',
    'See the role + salary and skill context →',
    jobUrl(c.occ, c.id),
  ]),
  (c) => post([
    'New on PivotHop',
    '',
    `${c.title} at ${c.company}`,
    [placeLine(c), payLine(c)].filter(Boolean).join(' · '),
    '',
    c.skills.length >= 2 ? `The posting names: ${displaySkills(c.skills)}.` : null,
    reasonText(c) ? `Why it surfaced: ${reasonText(c)}.` : null,
    '',
    'Read the full listing →',
    jobUrl(c.occ, c.id),
  ]),
  (c) => post([
    'Worth a look',
    '',
    `${c.company} · ${c.title}`,
    [payLine(c), placeLine(c)].filter(Boolean).join(' · '),
    '',
    reasonText(c) ? `The signal: ${reasonText(c)}.` : null,
    fact(c),
    '',
    'See the numbers behind the role →',
    jobUrl(c.occ, c.id),
  ]),
  (c) => post([
    '📌 Hiring now',
    '',
    `${c.title} at ${c.company}`,
    `📍 ${placeLine(c)}`,
    payLine(c) ? `Posted pay: ${payLine(c)}` : null,
    '',
    fact(c),
    '',
    'Role, pay and skill context →',
    jobUrl(c.occ, c.id),
  ]),
  (c) => post([
    payLine(c) ? 'A job post with the numbers attached' : 'A job post worth opening',
    '',
    `${c.title} at ${c.company}`,
    `📍 ${placeLine(c)}`,
    payLine(c) ? `💰 Posted range: ${payLine(c)}` : null,
    '',
    reasonText(c) ? `Why it made the cut: ${reasonText(c)}.` : null,
    c.skills.length >= 2 ? `Skills requested: ${displaySkills(c.skills)}.` : null,
    '',
    'Open the listing →',
    jobUrl(c.occ, c.id),
  ]),
  (c) => c.adjacency && c.adjacency.match >= 60 ? post([
    'Career move, measured.',
    '',
    `${c.adjacency.originTitle} → ${c.title}`,
    `${c.adjacency.match}% skill overlap`,
    '',
    `${c.title} at ${c.company}`,
    [placeLine(c), payLine(c)].filter(Boolean).join(' · '),
    c.adjacency.gap.length ? `Main gaps: ${displaySkills(c.adjacency.gap, 3)}.` : null,
    '',
    'See the route into the role →',
    jobUrl(c.occ, c.id),
  ]) : TEMPLATES[0](c),
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
