'use server';

import dns from 'node:dns/promises';
import net from 'node:net';

export type ImportedJob = {
  title?: string;
  company?: string;
  logo?: string;
  description?: string;
  region?: string;
  workplace?: 'remote' | 'hybrid' | 'onsite';
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  applyUrl?: string;
  sourceHost?: string;
};

const MAX_HTML = 2_000_000;
const MAX_REDIRECTS = 4;
const BLOCKED_HOSTS = new Set(['localhost', 'metadata.google.internal']);
const UA = 'PivotHop Job Importer/1.0 (+https://www.pivothop.com/employers)';

function isPrivateAddress(address: string): boolean {
  if (address === '::1' || address === '0.0.0.0') return true;
  const lower = address.toLowerCase();
  if (lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80:')) return true;
  const m = address.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const a = +m[1], b = +m[2];
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

async function safeUrl(input: string): Promise<URL> {
  let u: URL;
  try { u = new URL(input.trim()); } catch { throw new Error('Enter a valid public job URL.'); }
  if (u.protocol !== 'https:') throw new Error('Use an https:// job URL.');
  const host = u.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('That URL is not public.');
  if (net.isIP(host) && isPrivateAddress(host)) throw new Error('That URL is not public.');
  try {
    const resolved = await dns.lookup(host, { all: true });
    if (!resolved.length || resolved.some((r) => isPrivateAddress(r.address))) throw new Error('That URL is not public.');
  } catch (err) {
    if (err instanceof Error && err.message === 'That URL is not public.') throw err;
    throw new Error('Could not resolve that job URL.');
  }
  return u;
}

async function fetchPublicPage(start: URL, signal: AbortSignal): Promise<{ res: Response; finalUrl: URL }> {
  let current = start;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const res = await fetch(current, {
      redirect: 'manual',
      cache: 'no-store',
      signal,
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.5' },
    });
    if (![301, 302, 303, 307, 308].includes(res.status)) return { res, finalUrl: current };
    if (i === MAX_REDIRECTS) throw new Error('That job URL redirects too many times.');
    const location = res.headers.get('location');
    if (!location) return { res, finalUrl: current };
    current = await safeUrl(new URL(location, current).toString());
  }
  throw new Error('Could not follow that job URL.');
}

async function limitedText(res: Response): Promise<string> {
  const len = Number(res.headers.get('content-length') || 0);
  if (len > MAX_HTML) throw new Error('That page is too large to import. Paste the job description instead.');
  if (!res.body) return '';
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let out = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_HTML) {
      await reader.cancel();
      throw new Error('That page is too large to import. Paste the job description instead.');
    }
    out += decoder.decode(value, { stream: true });
  }
  return out + decoder.decode();
}

function decode(s: string): string {
  return s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}
const decodeDeep = (s: string) => decode(decode(s));

function text(html: unknown): string {
  if (typeof html !== 'string') return '';
  return decodeDeep(html)
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>|<\/li>|<\/div>|<\/h[1-6]>|<\/section>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function findJobPosting(value: unknown): Record<string, any> | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    for (const v of value) { const hit = findJobPosting(v); if (hit) return hit; }
    return null;
  }
  if (typeof value !== 'object') return null;
  const obj = value as Record<string, any>;
  const type = obj['@type'];
  if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) return obj;
  if (obj['@graph']) return findJobPosting(obj['@graph']);
  for (const v of Object.values(obj)) { const hit = findJobPosting(v); if (hit) return hit; }
  return null;
}

function jsonLdJob(html: string): Record<string, any> | null {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const m of html.matchAll(re)) {
    try {
      const parsed = JSON.parse(decodeDeep(m[1]).trim());
      const hit = findJobPosting(parsed);
      if (hit) return hit;
    } catch { /* malformed JSON-LD: keep looking */ }
  }
  return null;
}

function meta(html: string, key: string): string {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const a = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${esc}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i'));
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${esc}["'][^>]*>`, 'i'));
  return decodeDeep(a?.[1] || b?.[1] || '').trim();
}

function locationName(v: any): string {
  if (!v) return '';
  if (Array.isArray(v)) return v.map(locationName).filter(Boolean).join(', ');
  if (typeof v === 'string') return v;
  const a = v.address || v;
  return [a.addressLocality, a.addressRegion, a.addressCountry?.name || a.addressCountry].filter(Boolean).join(', ');
}

function applicantLocations(v: any): string {
  if (!v) return '';
  const rows = Array.isArray(v) ? v : [v];
  return rows.map((x) => x?.name || x?.addressCountry?.name || x?.addressCountry || x?.address?.addressCountry).filter(Boolean).join(', ');
}

function employmentType(v: any): string | undefined {
  const raw = (Array.isArray(v) ? v[0] : v || '').toString().toUpperCase();
  if (raw.includes('FULL')) return 'Full-time';
  if (raw.includes('PART')) return 'Part-time';
  if (raw.includes('CONTRACT') || raw.includes('TEMP')) return 'Contract';
  if (raw.includes('INTERN')) return 'Internship';
  return undefined;
}

function annualFactor(unit: unknown): number {
  const raw = String(unit || 'YEAR').toUpperCase();
  if (raw.includes('HOUR')) return 2080;
  if (raw.includes('DAY')) return 260;
  if (raw.includes('WEEK')) return 52;
  if (raw.includes('MONTH')) return 12;
  return 1;
}

function salary(j: Record<string, any>): { min?: number; max?: number; currency?: string } {
  const b = j.baseSalary;
  if (!b) return {};
  const val = b.value ?? b;
  let min = Number(val.minValue ?? val.value ?? NaN);
  let max = Number(val.maxValue ?? val.value ?? NaN);
  const factor = annualFactor(val.unitText || b.unitText);
  if (Number.isFinite(min)) min *= factor;
  if (Number.isFinite(max)) max *= factor;
  return {
    min: Number.isFinite(min) && min > 0 ? Math.round(min) : undefined,
    max: Number.isFinite(max) && max > 0 ? Math.round(max) : undefined,
    currency: b.currency || j.salaryCurrency || undefined,
  };
}

function inferWorkplace(location = '', body = ''): ImportedJob['workplace'] | undefined {
  const hay = `${location} ${body.slice(0, 500)}`.toLowerCase();
  if (/\bremote\b|work from home|distributed/.test(hay)) return 'remote';
  if (/\bhybrid\b/.test(hay)) return 'hybrid';
  return undefined;
}

async function importGreenhouse(u: URL, signal: AbortSignal): Promise<ImportedJob | null> {
  if (!/(^|\.)greenhouse\.io$/i.test(u.hostname)) return null;
  const m = u.pathname.match(/^\/([^/]+)\/jobs\/(\d+)/i);
  if (!m) return null;
  const board = encodeURIComponent(m[1]);
  const id = encodeURIComponent(m[2]);
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs/${id}`, {
    cache: 'no-store', signal, headers: { 'User-Agent': UA, Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const j = await res.json() as Record<string, any>;
  const desc = text(j.content || '');
  const region = text(j.location?.name || '');
  return {
    title: text(j.title || ''),
    company: text(j.company_name || ''),
    description: desc,
    region,
    workplace: inferWorkplace(region, desc),
    applyUrl: j.absolute_url || u.toString(),
    sourceHost: 'greenhouse.io',
  };
}

async function importLever(u: URL, signal: AbortSignal): Promise<ImportedJob | null> {
  const eu = u.hostname.toLowerCase() === 'jobs.eu.lever.co';
  if (!eu && u.hostname.toLowerCase() !== 'jobs.lever.co') return null;
  const m = u.pathname.match(/^\/([^/]+)\/([0-9a-f-]{20,})/i);
  if (!m) return null;
  const site = encodeURIComponent(m[1]);
  const id = encodeURIComponent(m[2]);
  const apiHost = eu ? 'api.eu.lever.co' : 'api.lever.co';
  const res = await fetch(`https://${apiHost}/v0/postings/${site}/${id}`, {
    cache: 'no-store', signal, headers: { 'User-Agent': UA, Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const j = await res.json() as Record<string, any>;
  const desc = text([j.descriptionPlain || j.description || '', ...(j.lists || []).map((x: any) => `${x.text || ''}\n${text(x.content || '')}`), j.additionalPlain || j.additional || ''].filter(Boolean).join('\n\n'));
  const region = text(j.categories?.location || '');
  const sr = j.salaryRange || j.compensation || null;
  const factor = annualFactor(sr?.interval || sr?.unit || 'YEAR');
  const min = Number(sr?.min ?? sr?.minValue ?? NaN);
  const max = Number(sr?.max ?? sr?.maxValue ?? NaN);
  const workplaceRaw = String(j.workplaceType || '').toLowerCase();
  const workplace: ImportedJob['workplace'] | undefined = workplaceRaw.includes('remote') ? 'remote' : workplaceRaw.includes('hybrid') ? 'hybrid' : inferWorkplace(region, desc);
  return {
    title: text(j.text || j.title || ''),
    description: desc,
    region,
    workplace,
    employmentType: employmentType(j.categories?.commitment),
    salaryMin: Number.isFinite(min) && min > 0 ? Math.round(min * factor) : undefined,
    salaryMax: Number.isFinite(max) && max > 0 ? Math.round(max * factor) : undefined,
    salaryCurrency: sr?.currency || undefined,
    applyUrl: j.applyUrl || j.hostedUrl || u.toString(),
    sourceHost: eu ? 'jobs.eu.lever.co' : 'jobs.lever.co',
  };
}

async function importAshby(u: URL, signal: AbortSignal): Promise<ImportedJob | null> {
  if (u.hostname.toLowerCase() !== 'jobs.ashbyhq.com') return null;
  const parts = u.pathname.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  const board = encodeURIComponent(parts[0]);
  const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${board}?includeCompensation=true`, {
    cache: 'no-store', signal, headers: { 'User-Agent': UA, Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const data = await res.json() as { jobs?: Record<string, any>[] };
  const target = u.pathname.replace(/\/$/, '').toLowerCase();
  const j = (data.jobs || []).find((row) => {
    try { return new URL(row.jobUrl).pathname.replace(/\/$/, '').toLowerCase() === target; } catch { return false; }
  });
  if (!j) return null;
  const desc = text(j.descriptionPlain || j.descriptionHtml || '');
  const salaryComponent = (j.compensation?.summaryComponents || []).find((x: any) => String(x.compensationType).toLowerCase() === 'salary');
  const factor = annualFactor(salaryComponent?.interval || 'YEAR');
  const min = Number(salaryComponent?.minValue ?? NaN);
  const max = Number(salaryComponent?.maxValue ?? NaN);
  const workplaceRaw = String(j.workplaceType || '').toLowerCase();
  const workplace: ImportedJob['workplace'] | undefined = j.isRemote || workplaceRaw === 'remote' ? 'remote' : workplaceRaw === 'hybrid' ? 'hybrid' : workplaceRaw === 'onsite' ? 'onsite' : undefined;
  return {
    title: text(j.title || ''),
    description: desc,
    region: text(j.location || ''),
    workplace,
    employmentType: employmentType(j.employmentType),
    salaryMin: Number.isFinite(min) && min > 0 ? Math.round(min * factor) : undefined,
    salaryMax: Number.isFinite(max) && max > 0 ? Math.round(max * factor) : undefined,
    salaryCurrency: salaryComponent?.currencyCode || undefined,
    applyUrl: j.applyUrl || j.jobUrl || u.toString(),
    sourceHost: 'jobs.ashbyhq.com',
  };
}

function fromJsonLd(j: Record<string, any>, finalUrl: string): ImportedJob {
  const sal = salary(j);
  const remote = String(j.jobLocationType || '').toUpperCase().includes('TELECOMMUTE');
  const region = remote ? (applicantLocations(j.applicantLocationRequirements) || 'Worldwide') : locationName(j.jobLocation);
  const company = typeof j.hiringOrganization === 'string' ? j.hiringOrganization : j.hiringOrganization?.name;
  const logo = typeof j.hiringOrganization?.logo === 'string' ? j.hiringOrganization.logo : j.hiringOrganization?.logo?.url;
  const desc = text(j.description || j.responsibilities || '');
  return {
    title: text(j.title || j.name || ''),
    company: text(company || ''),
    logo,
    description: desc,
    region,
    workplace: remote ? 'remote' : inferWorkplace(region, desc),
    employmentType: employmentType(j.employmentType),
    salaryMin: sal.min,
    salaryMax: sal.max,
    salaryCurrency: sal.currency,
    applyUrl: finalUrl,
    sourceHost: new URL(finalUrl).hostname.replace(/^www\./, ''),
  };
}

export async function importJobFromUrl(input: string): Promise<{ job?: ImportedJob; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const u = await safeUrl(input);

    // Prefer official/public ATS feeds where the URL gives us a stable posting id.
    // They are faster and more reliable than scraping rendered career pages.
    const native = await importGreenhouse(u, controller.signal)
      || await importLever(u, controller.signal)
      || await importAshby(u, controller.signal);
    if (native) return { job: native };

    // Universal fallback: follow only re-validated public redirects, then read
    // Schema.org JobPosting JSON-LD. Most modern ATS/careers pages expose it for Google Jobs.
    const { res, finalUrl } = await fetchPublicPage(u, controller.signal);
    if (!res.ok) return { error: `The job page returned ${res.status}. You can paste the description instead.` };
    const html = await limitedText(res);
    const j = jsonLdJob(html);
    if (j) return { job: fromJsonLd(j, finalUrl.toString()) };

    const fallbackTitle = meta(html, 'og:title') || meta(html, 'twitter:title');
    const fallbackDesc = meta(html, 'og:description') || meta(html, 'description');
    if (!fallbackTitle && !fallbackDesc) return { error: 'I could not read structured job details from that page. Paste the description instead.' };
    return { job: { title: fallbackTitle, description: fallbackDesc, applyUrl: finalUrl.toString(), sourceHost: finalUrl.hostname.replace(/^www\./, '') } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not import that job URL.';
    return { error: /abort|aborted/i.test(msg) ? 'The job page took too long to respond. Paste the description instead.' : msg };
  } finally {
    clearTimeout(timer);
  }
}
