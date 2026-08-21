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
function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').trim();
}
function normalizeCandidate(c: Candidate): Candidate {
  const location = cleanText(c.location);
  return {
    ...c,
    title: cleanText(c.title),
    company: cleanText(c.company),
    location: c.remote ? location.replace(/^remote(?:,\\s*)?/i, '').trim() : location,
  };
}
function placeLine(c: Candidate): string {
  if (c.remote && c.location) return `Remote · ${c.location}`;
  if (c.remote) return 'Remote';
  return c.location || 'On-site';
}
function searchText(c: Candidate): string {
  return `${c.title} ${c.occ} ${c.skills.join(' ')}`.replace(/[-_]/g, ' ').toLowerCase();
}
function roleHashtag(c: Candidate): string {
  const text = searchText(c);
  const roles: Array<[RegExp, string]> = [
    [/\bfull\s*stack\b/, '#FullStackJobs'],
    [/\bback\s*end\b/, '#BackendDeveloperJobs'],
    [/\bfront\s*end\b/, '#FrontendDeveloperJobs'],
    [/\bsoftware (?:engineer|developer|engineering)\b/, '#SoftwareEngineerJobs'],
    [/\bdata scientist\b/, '#DataScienceJobs'],
    [/\bdata analyst\b/, '#DataAnalystJobs'],
    [/\bproduct manager|product management\b/, '#ProductManagementJobs'],
    [/\bproject manager|project management\b/, '#ProjectManagementJobs'],
    [/\bbusiness development\b/, '#BusinessDevelopmentJobs'],
    [/\bcustomer success\b/, '#CustomerSuccessJobs'],
    [/\baccountant|accounting\b/, '#AccountingJobs'],
    [/\bfinancial analyst\b/, '#FinancialAnalystJobs'],
    [/\bux|user experience\b/, '#UXDesignJobs'],
    [/\barchitect|architecture\b/, '#ArchitectureJobs'],
    [/\brecruiter|talent acquisition|human resources\b/, '#HRJobs'],
    [/\bcybersecurity|information security\b/, '#CybersecurityJobs'],
    [/\bmarketing\b/, '#MarketingJobs'],
    [/\bsales\b/, '#SalesJobs'],
    [/\boperations\b/, '#OperationsJobs'],
    [/\bconsultant|consulting\b/, '#ConsultingJobs'],
    [/\blegal|counsel|attorney\b/, '#LegalJobs'],
    [/\bnurse|nursing\b/, '#NursingJobs'],
    [/\bengineer|engineering\b/, '#EngineeringJobs'],
    [/\bdesigner|design\b/, '#DesignJobs'],
  ];
  const match = roles.find(([pattern]) => pattern.test(text));
  if (match) return match[1];

  const fallback = c.occ
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join('');
  return fallback && fallback.length <= 24 ? `#${fallback}Jobs` : '#JobOpening';
}
function sectorHashtag(c: Candidate): string | null {
  const text = searchText(c);
  if (/\bsoftware|developer|data|devops|cloud|product manager|cybersecurity\b/.test(text)) return '#TechJobs';
  if (/\bfinance|financial|accounting|accountant|banking\b/.test(text)) return '#FinanceJobs';
  if (/\bhealthcare|clinical|medical|nurse|nursing\b/.test(text)) return '#HealthcareJobs';
  if (/\bmarketing|growth|content|seo\b/.test(text)) return '#MarketingJobs';
  if (/\bsales|business development|account executive\b/.test(text)) return '#SalesJobs';
  if (/\bdesigner|design|ux|user experience\b/.test(text)) return '#DesignJobs';
  if (/\barchitect|architecture\b/.test(text)) return '#ArchitectureJobs';
  if (/\bhuman resources|recruiter|talent acquisition\b/.test(text)) return '#HRJobs';
  return null;
}
function specialtyHashtag(c: Candidate): string | null {
  const text = searchText(c);
  if (/\bcodex|artificial intelligence|machine learning|generative ai|large language model|llm\b/.test(text)) return '#AIJobs';
  if (/\bcybersecurity|information security|application security\b/.test(text)) return '#CybersecurityJobs';
  if (/\bdevops|site reliability|kubernetes|cloud infrastructure\b/.test(text)) return '#DevOpsJobs';
  if (/\bfintech|financial technology\b/.test(text)) return '#FinTechJobs';
  if (/\bsaas\b/.test(text)) return '#SaaSJobs';
  return null;
}
function hashtags(c: Candidate): string {
  const tags: Array<string | null> = [
    '#Hiring',
    c.remote ? '#RemoteJobs' : null,
    sectorHashtag(c),
    roleHashtag(c),
    specialtyHashtag(c),
  ];
  return [...new Set(tags.filter((tag): tag is string => Boolean(tag)))].slice(0, 5).join(' ');
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
    `🚨 Job alert: ${c.title}`,
    `🏢 ${c.company}`,
    `📍 ${placeLine(c)}`,
    payLine(c) ? `💰 ${payLine(c)}` : null,
    '',
    reasonText(c) ? `Why it stood out: ${reasonText(c)}.` : null,
    fact(c),
    '',
    'See the role + salary and skill context →',
    jobUrl(c.occ, c.id),
  ]),
  (c) => post([
    `💼 New job opening at ${c.company}`,
    '',
    c.title,
    `📍 ${placeLine(c)}`,
    payLine(c) ? `💰 ${payLine(c)}` : null,
    '',
    c.skills.length >= 2 ? `Skills named in the posting: ${displaySkills(c.skills)}.` : null,
    reasonText(c) ? `Why it surfaced: ${reasonText(c)}.` : null,
    '',
    'Read the full listing →',
    jobUrl(c.occ, c.id),
  ]),
  (c) => post([
    `🔎 Now hiring: ${c.title}`,
    `🏢 ${c.company}`,
    `📍 ${placeLine(c)}`,
    payLine(c) ? `💰 ${payLine(c)}` : null,
    '',
    reasonText(c) ? `The signal: ${reasonText(c)}.` : null,
    fact(c),
    '',
    'See the numbers behind the role →',
    jobUrl(c.occ, c.id),
  ]),
  (c) => post([
    c.remote ? '📌 Remote job alert' : '📌 Job opening',
    '',
    `${c.title} at ${c.company}`,
    `📍 ${placeLine(c)}`,
    payLine(c) ? `💰 Posted pay: ${payLine(c)}` : null,
    '',
    fact(c),
    '',
    'Role, pay and skill context →',
    jobUrl(c.occ, c.id),
  ]),
  (c) => post([
    payLine(c) ? `💰 Job opening with salary disclosed` : `💼 Job opportunity`,
    '',
    `${c.title} at ${c.company}`,
    `📍 ${placeLine(c)}`,
    payLine(c) ? `Posted range: ${payLine(c)}` : null,
    '',
    reasonText(c) ? `Why it made the cut: ${reasonText(c)}.` : null,
    c.skills.length >= 2 ? `Skills requested: ${displaySkills(c.skills)}.` : null,
    '',
    'Open the listing →',
    jobUrl(c.occ, c.id),
  ]),
  (c) => c.adjacency && c.adjacency.match >= 60 ? post([
    `🚨 Job alert: ${c.title}`,
    `🏢 ${c.company}`,
    `📍 ${placeLine(c)}`,
    payLine(c) ? `💰 ${payLine(c)}` : null,
    '',
    `🔀 Possible pivot: ${c.adjacency.originTitle} → ${c.title}`,
    `${c.adjacency.match}% skill overlap`,
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
  const normalized = normalizeCandidate(c);
  const idx = (djb2(normalized.id) + variant) % TEMPLATES.length;
  const body = TEMPLATES[idx](normalized);
  const tags = hashtags(normalized);
  return { copy: tags ? `${body}\n\n${tags}` : body, variant };
}
