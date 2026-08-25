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
const BLOCKED_HOSTS = new Set(['localhost', 'metadata.google.internal']);

function isPrivateAddress(address: string): boolean {
  if (address === '::1' || address === '0.0.0.0') return true;
  if (address.startsWith('fc') || address.startsWith('fd') || address.startsWith('fe80:')) return true;
  const m = address.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const a = +m[1], b = +m[2];
  return a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
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
    if (resolved.some((r) => isPrivateAddress(r.address))) throw new Error('That URL is not public.');
  } catch (err) {
    if (err instanceof Error && err.message === 'That URL is not public.') throw err;
    throw new Error('Could not resolve that job URL.');
  }
  return u;
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

function text(html: unknown): string {
  if (typeof html !== 'string') return '';
  return decode(html)
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>|<\/li>|<\/div>|<\/h[1-6]>/gi, '\n')
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
      const parsed = JSON.parse(decode(m[1]).trim());
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
  return decode(a?.[1] || b?.[1] || '').trim();
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

function salary(j: Record<string, any>): { min?: number; max?: number; currency?: string } {
  const b = j.baseSalary;
  if (!b) return {};
  const val = b.value ?? b;
  let min = Number(val.minValue ?? val.value ?? NaN);
  let max = Number(val.maxValue ?? val.value ?? NaN);
  const unit = String(val.unitText || b.unitText || 'YEAR').toUpperCase();
  const factor = unit.includes('HOUR') ? 2080 : unit.includes('DAY') ? 260 : unit.includes('WEEK') ? 52 : unit.includes('MONTH') ? 12 : 1;
  if (Number.isFinite(min)) min *= factor;
  if (Number.isFinite(max)) max *= factor;
  return {
    min: Number.isFinite(min) && min > 0 ? Math.round(min) : undefined,
    max: Number.isFinite(max) && max > 0 ? Math.round(max) : undefined,
    currency: b.currency || j.salaryCurrency || undefined,
  };
}

export async function importJobFromUrl(input: string): Promise<{ job?: ImportedJob; error?: string }> {
  try {
    const u = await safeUrl(input);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(u, {
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'User-Agent': 'PivotHop Job Importer/1.0 (+https://www.pivothop.com/employers)',
        Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.5',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return { error: `The job page returned ${res.status}. You can paste the description instead.` };
    const len = Number(res.headers.get('content-length') || 0);
    if (len > MAX_HTML) return { error: 'That page is too large to import. Paste the job description instead.' };
    const html = (await res.text()).slice(0, MAX_HTML);
    const j = jsonLdJob(html);
    const finalUrl = res.url || u.toString();
    const host = new URL(finalUrl).hostname.replace(/^www\./, '');

    if (!j) {
      const fallbackTitle = meta(html, 'og:title') || meta(html, 'twitter:title');
      const fallbackDesc = meta(html, 'og:description') || meta(html, 'description');
      if (!fallbackTitle && !fallbackDesc) return { error: 'I could not read structured job details from that page. Paste the description instead.' };
      return { job: { title: fallbackTitle, description: fallbackDesc, applyUrl: finalUrl, sourceHost: host } };
    }

    const sal = salary(j);
    const remote = String(j.jobLocationType || '').toUpperCase().includes('TELECOMMUTE');
    const region = remote ? (applicantLocations(j.applicantLocationRequirements) || 'Worldwide') : locationName(j.jobLocation);
    const company = typeof j.hiringOrganization === 'string' ? j.hiringOrganization : j.hiringOrganization?.name;
    const logo = typeof j.hiringOrganization?.logo === 'string' ? j.hiringOrganization.logo : j.hiringOrganization?.logo?.url;
    const desc = text(j.description || j.responsibilities || '');

    return {
      job: {
        title: text(j.title || j.name || ''),
        company: text(company || ''),
        logo,
        description: desc,
        region,
        workplace: remote ? 'remote' : undefined,
        employmentType: employmentType(j.employmentType),
        salaryMin: sal.min,
        salaryMax: sal.max,
        salaryCurrency: sal.currency,
        applyUrl: finalUrl,
        sourceHost: host,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not import that job URL.';
    return { error: msg.includes('abort') ? 'The job page took too long to respond. Paste the description instead.' : msg };
  }
}
