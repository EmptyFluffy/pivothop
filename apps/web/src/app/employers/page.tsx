import type { Metadata } from 'next';
import Link from 'next/link';
import fs from 'node:fs';
import path from 'node:path';
import { PageShell } from '../components/SiteChrome';
import { EmployerForm, type FanIn } from './EmployerForm';
import { jobsIndex, occList } from '../jobs/jobs-data';
import { routableSlugs, routePair, destRole, originMeta } from '../routes/routes-data';

export const metadata: Metadata = {
  title: 'Post a job — PivotHop',
  description:
    'Post a role on the adjacent-talent job board. Every listing is matched to the candidates whose skills already reach it, from adjacent professions. First month of featured placement free while the board fills.',
  alternates: { canonical: '/employers' },
};

function skillBank(): string[] {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/skills-meta.json'), 'utf8'));
    return Object.values(m.names as Record<string, string>).sort((a, b) => a.localeCompare(b));
  } catch { return []; }
}

export default function Employers() {
  // Adjacency fan-in per occupation: how many measured routes lead into it, and
  // from where — the "who will see this role" panel's data.
  const fan: Record<string, FanIn> = {};
  const idx = jobsIndex();
  for (const slug of routableSlugs()) {
    const p = routePair(slug);
    if (!p) continue;
    const r = destRole(p.origin, p.dest);
    if (!r) continue;
    const e = (fan[p.dest] ??= { n: 0, top: [], live: idx[p.dest] ?? 0 });
    e.n += 1;
    e.top.push({ t: originMeta(p.origin).title, m: r.match });
  }
  for (const k of Object.keys(fan)) fan[k].top = fan[k].top.sort((a, b) => b.m - a.m).slice(0, 3);

  return (
    <PageShell active="employers">
      <div className="emp-post">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb"><Link href="/">Instrument</Link><span>/</span><span>Post a job</span></nav>
        <header className="emp-post-head">
          <span className="lbl acc">For employers</span>
          <h1>Post a job.</h1>
          <p>
            Every listing is matched to the candidates whose skills already reach it, from adjacent
            professions no title-based board surfaces. The first month of featured placement is free.
          </p>
        </header>
        <EmployerForm occs={occList()} fan={fan} skills={skillBank()} />
      </div>
    </PageShell>
  );
}
