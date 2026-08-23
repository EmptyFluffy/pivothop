import type { Metadata } from 'next';
import Link from 'next/link';
import fs from 'node:fs';
import path from 'node:path';

export const metadata: Metadata = { title: 'Admin | studio fleet', robots: { index: false, follow: false } };

/* The whole catch, per studio, untrimmed. The public board shows the direct
   listings that survive occupation mapping, floors, and caps; this page shows
   every posting the fleet scraper currently holds, under every studio ever
   admitted — including the studios posting nothing right now. The registry
   only grows: a studio leaves it by manual config edit, never automatically.
   Data: public/data/admin-studios.json, rebuilt by every nightly
   (build-admin-studios.py). */
export const dynamic = 'force-dynamic';

type Job = { title: string; url: string; location: string; smin: number | null; smax: number | null; currency: string | null; posted: string | null };
type Studio = { name: string; careers: string; tier: 'curated' | 'auto'; admitted: string | null; jobs: Job[] };
type Data = { generated: string; studios: Studio[]; totals: { studios: number; curated: number; auto: number; jobs: number; unmatched: number } };

function readData(): Data | null {
  try {
    const p = path.join(process.cwd(), 'public/data/admin-studios.json');
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

const money = (j: Job) =>
  j.smin || j.smax
    ? `${j.currency || ''} ${[j.smin, j.smax].filter(Boolean).map((v) => Math.round(Number(v) / 1000) + 'k').join('–')}`.trim()
    : null;

export default function Studios() {
  const data = readData();
  if (!data) {
    return (
      <div className="adm res">
        <header className="adm-head"><h1>Studio fleet</h1></header>
        <p>No <code>admin-studios.json</code> yet — run <code>python3 apps/scraper/scripts/build-admin-studios.py</code> or wait for tonight&rsquo;s scrape.</p>
      </div>
    );
  }
  const { studios, totals } = data;
  const hiring = studios.filter((s) => s.jobs.length > 0);
  const quiet = studios.filter((s) => s.jobs.length === 0);

  const row = (s: Studio) => (
    <details key={s.name} className="stf-row" open={false}>
      <summary>
        <span className="stf-name">{s.name}</span>
        <span className="lbl">{s.tier}{s.admitted ? ` · ${s.admitted}` : ''}</span>
        <a className="lbl stf-link" href={s.careers} target="_blank" rel="noreferrer">careers ↗</a>
        <span className="stf-count">{s.jobs.length > 0 ? `${s.jobs.length} open` : 'quiet'}</span>
      </summary>
      {s.jobs.length > 0 && (
        <table className="res-table">
          <thead><tr><th>Role</th><th>Location</th><th>Salary</th></tr></thead>
          <tbody>
            {s.jobs.map((j, i) => (
              <tr key={i}>
                <td><a href={j.url} target="_blank" rel="noreferrer">{j.title}</a></td>
                <td>{j.location || '·'}</td>
                <td>{money(j) || '·'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </details>
  );

  return (
    <div className="adm res">
      <header className="adm-head">
        <h1>Studio fleet</h1>
        <span className="lbl">
          {totals.studios} studios ({totals.curated} curated + {totals.auto} auto-admitted) · {totals.jobs} postings
          in corpus · board shows the mapped subset · rebuilt {data.generated}
        </span>
      </header>

      <nav className="otr-nav">
        <Link href="/admin">← Submissions</Link>
        <Link href="/admin/outreach">Outreach</Link>
        <Link href="/admin/research">Research</Link>
        <Link href="/admin/schweiz">Schweiz</Link>
      </nav>

      <section className="res-sec">
        <h2>Hiring now <span className="lbl">{hiring.length} studios · {totals.jobs} roles, every one the scraper holds</span></h2>
        {hiring.map(row)}
      </section>

      <section className="res-sec">
        <h2>Quiet <span className="lbl">{quiet.length} studios with no current postings — still watched nightly, never removed</span></h2>
        {quiet.map(row)}
      </section>
    </div>
  );
}
