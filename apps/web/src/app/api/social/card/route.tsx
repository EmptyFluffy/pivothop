import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getJob, getJobSkills, skillDisplayName } from '../../../jobs/jobs-data';

export const dynamic = 'force-dynamic';

const money = (value: number) => '$' + Math.round(value / 1000) + 'k';
function payLabel(min: number | null, max: number | null): string | null {
  if (min && max && max > min) return `${money(min)}–${money(max)}`;
  const value = min || max;
  return value ? money(value) : null;
}

export async function GET(req: NextRequest) {
  const occ = req.nextUrl.searchParams.get('occ') ?? '';
  const id = req.nextUrl.searchParams.get('id') ?? '';
  const job = getJob(occ, id);
  if (!job) return new Response('Job not found', { status: 404 });

  const pay = payLabel(job.smin, job.smax);
  const place = job.remote
    ? (job.location ? `Remote · ${job.location.replace(/^remote(?:,\s*)?/i, '')}` : 'Remote')
    : (job.location || 'On-site');
  const skills = getJobSkills(occ, id).slice(0, 3).map(skillDisplayName);
  const titleSize = job.title.length > 72 ? 42 : job.title.length > 52 ? 48 : 56;
  const icon = new URL('/icon.svg', req.nextUrl.origin).toString();

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#f6f6f2',
        color: '#111111',
        padding: '54px 64px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 68, height: 68, borderRadius: 16, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={icon} alt="" width={54} height={54} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, display: 'flex' }}>PivotHop</div>
        </div>
        <div style={{ display: 'flex', padding: '12px 18px', borderRadius: 999, background: '#002FA6', color: '#ffffff', fontSize: 20, fontWeight: 700, letterSpacing: 1.4 }}>
          JOB OPENING
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 46, maxWidth: 1040 }}>
        <div style={{ display: 'flex', fontSize: titleSize, lineHeight: 1.06, fontWeight: 750, letterSpacing: -1.4 }}>
          {job.title}
        </div>
        <div style={{ display: 'flex', marginTop: 18, color: '#002FA6', fontSize: 34, fontWeight: 650 }}>
          {job.company}
        </div>
        <div style={{ display: 'flex', marginTop: 22, fontSize: 26, color: '#525252' }}>
          {[place, pay].filter(Boolean).join('  ·  ')}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
        {skills.map((skill) => (
          <div key={skill} style={{ display: 'flex', padding: '10px 16px', border: '2px solid #d9d9d2', borderRadius: 999, color: '#343434', fontSize: 18 }}>
            {skill}
          </div>
        ))}
        <div style={{ display: 'flex', marginLeft: 'auto', fontSize: 20, color: '#666666' }}>
          Career moves, measured.
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 627,
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    },
  );
}
