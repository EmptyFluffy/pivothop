import fs from 'node:fs';
import path from 'node:path';
import { headers } from 'next/headers';
import { buildReportData } from '../../../lib/roadmap/data.mjs';
import { renderRoadmapHTML } from '../../../lib/roadmap/template.mjs';
import { renderPdf } from '../../../lib/roadmap/render.mjs';
import { SITE_EMAIL } from '../../../lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // PDF render + AI + email; no-op on Hobby (10s cap)

/* The export loop: a route + email in, a six-page PDF in the inbox out.
   Every downstream stage is optional and degrades gracefully, so the endpoint
   is honest at every level of configuration:
     - always: assemble the report data, log the lead to Supabase
     - ANTHROPIC_API_KEY  -> AI-written plan/evidence prose (else templated)
     - render deps + env  -> the actual PDF (else lead captured, not delivered)
     - POSTMARK_* env     -> email the PDF as an attachment
   Returns { ok, captured, delivered } so the client can tell the truth. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readData(rel: string): unknown | null {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', rel), 'utf8')); }
  catch { return null; }
}
const boardJobs = (destId: string): unknown[] => (readData(`jobs/${destId}.json`) as unknown[]) || [];

type Role = { id: string; title: string; match: number; have?: string[]; learn?: string[]; salary?: string; salary_band?: number[]; demand?: string; remote?: string; time?: string; license?: unknown; [k: string]: unknown };
type ReportFile = { origin: { title: string; slug: string; postings: number; salary_band?: number[] }; roles: Role[]; next?: Record<string, Array<{ t: string; m: number; slug: string; gap?: string[] }>> };

// originSlug + destId -> the full payload, from the authoritative report file.
function assemble(originSlug: string, destId: string) {
  const rep = readData(`report/${originSlug}.json`) as ReportFile | null;
  if (!rep) return { error: 'unknown-origin' as const };
  const roles = rep.roles || [];
  let dest: Role | undefined = roles.find((r) => r.id === destId);
  if (!dest) {
    // a bridged second-hop (kid): synthesize from the parent + the kid's gap list
    for (const pid of Object.keys(rep.next || {})) {
      const k = (rep.next![pid] || []).find((x) => x.slug === destId);
      if (k) {
        const parent = roles.find((r) => r.id === pid);
        dest = { id: k.slug, title: k.t, match: k.m, have: parent?.have, learn: k.gap, salary: parent?.salary, salary_band: parent?.salary_band, demand: parent?.demand, remote: parent?.remote, time: parent?.time, license: parent?.license };
        break;
      }
    }
  }
  if (!dest) return { error: 'unknown-route' as const };
  const ranked = [...roles].sort((a, b) => b.match - a.match);
  const rank = ranked.findIndex((r) => r.id === dest!.id) + 1 || null;
  const alternates = ranked.filter((r) => r.id !== dest!.id).slice(0, 3)
    .map((r) => ({ title: r.title, match: r.match, gate: r.license ? 'License · slower' : 'No license' }));
  return { payload: { origin: rep.origin, dest, alternates, rank, routeCount: roles.length } };
}

const SB = () => {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_KEY;
  return base && key ? { base, key, h: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } } : null;
};

async function logLead(row: Record<string, unknown>): Promise<void> {
  const sb = SB();
  if (!sb) return;
  await fetch(`${sb.base}/rest/v1/roadmap_leads`, {
    method: 'POST', headers: { ...sb.h, Prefer: 'return=minimal' }, body: JSON.stringify(row),
  }).catch(() => {});
}

async function emailReport(to: string, d: { dest: { title: string }; origin: { title: string }; meta: { reportId: string } }, pdf: Buffer): Promise<boolean> {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  const from = process.env.POSTMARK_FROM;
  if (!token || !from) return false;
  const route = `${d.origin.title} → ${d.dest.title}`;
  const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;color:#15151a;line-height:1.55;max-width:520px">
    <p style="font-size:17px;font-weight:600;margin:0 0 14px">Your route report is attached.</p>
    <p style="margin:0 0 14px">Six pages on the move from <b>${route}</b>: the 100 points opened up, a 90-day plan sequenced by what each skill is worth, the evidence that reads as proof, the full timeline, and where the pay lands.</p>
    <p style="margin:0 0 14px">The numbers are read from live job postings and re-run free any time at <a href="https://www.pivothop.com" style="color:#002FA6">pivothop.com</a>. No account, nothing else in your inbox.</p>
    <p style="font-size:12px;color:#8a8a93;margin:22px 0 0">PivotHop &middot; career moves, measured &middot; ${d.meta.reportId}</p>
  </div>`;
  const res = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: { 'X-Postmark-Server-Token': token, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      From: from, To: to, ReplyTo: SITE_EMAIL,
      Subject: `Your route report: ${route}`,
      HtmlBody: html, MessageStream: 'outbound',
      Attachments: [{ Name: `PivotHop-${d.origin.title}-to-${d.dest.title}.pdf`.replace(/\s+/g, '-'), Content: pdf.toString('base64'), ContentType: 'application/pdf' }],
    }),
  }).catch(() => null);
  return !!res?.ok;
}

export async function POST(req: Request) {
  let body: { email?: string; notify?: boolean; personalized?: boolean; source?: string; originSlug?: string; destId?: string };
  try { body = await req.json(); } catch { return json({ ok: false, error: 'bad-request' }, 400); }

  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'invalid-email' }, 422);
  if (!body.originSlug || !body.destId) return json({ ok: false, error: 'missing-route' }, 422);

  const asm = assemble(String(body.originSlug), String(body.destId));
  if ('error' in asm) return json({ ok: false, error: asm.error }, 422);

  const destId = String(asm.payload.dest.id);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const d = await buildReportData(asm.payload, { jobs: boardJobs(destId), apiKey, date: new Date() }) as {
    origin: { title: string }; dest: { id: string; title: string; match: number }; meta: { reportId: string }; [k: string]: unknown;
  };

  // render + deliver (both optional; each degrades to the honest state)
  let delivered = false, pdf: Buffer | null = null;
  try {
    const out = await renderPdf(renderRoadmapHTML(d));
    if (out) pdf = Buffer.from(out);
  } catch { pdf = null; }
  if (pdf) delivered = await emailReport(email, d, pdf);

  const ua = (await headers()).get('user-agent')?.slice(0, 300) || null;
  await logLead({
    email, origin_slug: body.originSlug || null, origin_title: d.origin.title,
    dest_slug: destId, dest_title: d.dest.title, match: d.dest.match,
    notify: !!body.notify, personalized: !!body.personalized, ai: !!apiKey,
    delivered, report_id: d.meta.reportId, source: body.source || 'graph-export', user_agent: ua,
  });

  return json({ ok: true, captured: true, delivered });
}

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
}
