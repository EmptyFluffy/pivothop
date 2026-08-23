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
    location: c.remote ? location.replace(/^remote(?:,\s*)?/i, '').trim() : location,
  };
}
function placeLine(c: Candidate): string {
  if (c.remote && c.location) return `Remote · ${c.location}`;
  if (c.remote) return 'Remote';
  return c.location || 'On-site';
}

/* Hashtags intentionally use the role title and occupation only. Skills can
   be incidental to a posting and previously produced misleading tags such as
   #AIJobs or #ProductManagementJobs for an SDR role. */
function roleSearchText(c: Candidate): string {
  return `${c.title} ${c.occ}`.replace(/[-_]/g, ' ').toLowerCase();
}
function roleHashtag(c: Candidate): string {
  const text = roleSearchText(c);
  const roles: Array<[RegExp, string]> = [
    [/\bsales development representative\b|\bsdr\b/, '#SDRJobs'],
    [/\baccount executive\b/, '#AccountExecutiveJobs'],
    [/\bcustomer success manager\b/, '#CustomerSuccessJobs'],
    [/\bproduct designer\b/, '#ProductDesignJobs'],
    [/\bux\/?ui\b|\bux designer\b|\buser experience designer\b/, '#UXDesignJobs'],
    [/\bfull\s*stack\b/, '#FullStackJobs'],
    [/\bback\s*end\b/, '#BackendDeveloperJobs'],
    [/\bfront\s*end\b/, '#FrontendDeveloperJobs'],
    [/\bsoftware (?:engineer|developer|engineering)\b/, '#SoftwareEngineerJobs'],
    [/\bdata engineer\b/, '#DataEngineeringJobs'],
    [/\bdata scientist\b/, '#DataScienceJobs'],
    [/\bdata analyst\b/, '#DataAnalystJobs'],
    [/\bproduct manager|product management\b/, '#ProductManagementJobs'],
    [/\bproject manager|project management\b/, '#ProjectManagementJobs'],
    [/\bbusiness development\b/, '#BusinessDevelopmentJobs'],
    [/\bcustomer success\b/, '#CustomerSuccessJobs'],
    [/\baccountant|accounting\b/, '#AccountingJobs'],
    [/\bfinancial analyst\b/, '#FinancialAnalystJobs'],
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
  const text = roleSearchText(c);
  if (/\bsoftware|developer|data|devops|cloud|product manager|cybersecurity|engineer\b/.test(text)) return '#TechJobs';
  if (/\bfinance|financial|accounting|accountant|banking\b/.test(text)) return '#FinanceJobs';
  if (/\bhealthcare|clinical|medical|nurse|nursing\b/.test(text)) return '#HealthcareJobs';
  if (/\bmarketing|growth|content|seo\b/.test(text)) return '#MarketingJobs';
  if (/\bsales|business development|account executive|sdr\b/.test(text)) return '#SalesJobs';
  if (/\bdesigner|design|ux|user experience\b/.test(text)) return '#DesignJobs';
  if (/\barchitect|architecture\b/.test(text)) return '#ArchitectureJobs';
  if (/\bhuman resources|recruiter|talent acquisition\b/.test(text)) return '#HRJobs';
  return null;
}
function specialtyHashtag(c: Candidate): string | null {
  const text = roleSearchText(c);
  if (/\bai\b|\bartificial intelligence\b|\bmachine learning engineer\b|\bgenerative ai\b|\bllm\b/.test(text)) return '#AIJobs';
  if (/\bcybersecurity|information security|application security\b/.test(text)) return '#CybersecurityJobs';
  if (/\bdevops|site reliability|kubernetes|cloud infrastructure\b/.test(text)) return '#DevOpsJobs';
  if (/\bfintech|financial technology\b/.test(text)) return '#FinTechJobs';
  if (/\bsaas\b/.test(text)) return '#SaaSJobs';
  return null;
}
function hashtags(c: Candidate): string {
  const tags: Array<string | null> = [
    '#Hiring',
    c.remote ? '#RemoteJobs' : '#JobOpening',
    c.remote ? '#RemoteWork' : null,
    sectorHashtag(c),
    roleHashtag(c),
    specialtyHashtag(c),
  ];
  return [...new Set(tags.filter((tag): tag is string => Boolean(tag)))].slice(0, 5).join(' ');
}
function skillLines(skills: string[], limit = 4): string[] {
  return skills.slice(0, limit).map((skill) => `✓ ${skillDisplayName(skill)}`);
}
function post(lines: Array<string | null>): string {
  return lines.filter((line): line is string => line !== null).join('\n');
}

const REMOTE_HOOKS = [
  '🚨 REMOTE JOB ALERT',
  '📌 REMOTE JOB ALERT',
  '📣 REMOTE JOB ALERT',
  '🔥 REMOTE JOB ALERT',
  '🔔 REMOTE JOB ALERT',
  '⚡ REMOTE JOB ALERT',
];
const LOCAL_HOOKS = [
  '🚨 JOB ALERT',
  '📌 JOB OPENING',
  '📣 NOW HIRING',
  '🔥 NOW HIRING',
  '🔔 JOB ALERT',
  '⚡ JOB OPENING',
];
const CTAS = [
  'See the role, salary + skill context →',
  'View the full job details →',
  'See if this role fits your next move →',
  'Explore the role on PivotHop →',
  'See the job + career context →',
  'Open the full listing →',
];

function template(c: Candidate, variant: number): string {
  const hook = (c.remote ? REMOTE_HOOKS : LOCAL_HOOKS)[variant % REMOTE_HOOKS.length];
  const skills = skillLines(c.skills);
  return post([
    `${hook}: ${c.title.toUpperCase()}`,
    `🏢 ${c.company}`,
    `📍 ${placeLine(c)}`,
    payLine(c) ? `💰 ${payLine(c)}` : null,
    skills.length ? '' : null,
    skills.length ? 'Key skills:' : null,
    ...skills,
    '',
    CTAS[variant % CTAS.length],
    jobUrl(c.occ, c.id),
  ]);
}

type Tpl = (c: Candidate) => string;
const TEMPLATES: Tpl[] = [
  (c) => template(c, 0),
  (c) => template(c, 1),
  (c) => template(c, 2),
  (c) => template(c, 3),
  (c) => template(c, 4),
  (c) => template(c, 5),
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
