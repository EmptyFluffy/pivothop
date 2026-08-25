import type { Metadata } from 'next';
import Link from 'next/link';
import fs from 'node:fs';
import path from 'node:path';
import { PageShell } from '../components/SiteChrome';
import { EmployerFormV2, type FanIn } from './EmployerFormV2';
import { jobsIndex, occList } from '../jobs/jobs-data';
import { routableSlugs, routePair, destRole, originMeta } from '../routes/routes-data';
import { getSalary, usBand } from '../salary/salary-data';

export const metadata: Metadata = {
  title: 'Post a job for free | PivotHop',
  description:
    'Post a job on PivotHop for free. Import an existing listing from your ATS or create one from scratch, then reach candidates through jobs, salaries, and measured career-adjacency routes.',
  alternates: { canonical: '/employers' },
};

function skillBank(): string[] {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/skills-meta.json'), 'utf8'));
    return Object.values(m.names as Record<string, string>).sort((a, b) => a.localeCompare(b));
  } catch { return []; }
}

export default function Employers() {
  const occs = occList();
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

  const salaryHints: Record<string, { lo: number; hi: number }> = {};
  for (const o of occs) {
    const sal = getSalary(o.slug);
    if (!sal) continue;
    const b = usBand(sal);
    if (b?.p25 && b?.p75) salaryHints[o.slug] = { lo: b.p25, hi: b.p75 };
  }

  return (
    <PageShell v2 active="employers">
      <div className="emp-post">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb"><Link href="/">Instrument</Link><span>/</span><span>Post a job</span></nav>
        <header className="emp-post-head">
          <span className="lbl acc">For employers</span>
          <h1>Post a job.</h1>
          <p>
            Import a role you already published or start from zero. PivotHop connects the listing to the job board,
            salary intelligence, and candidates arriving from adjacent careers whose skill gaps are already measured.
          </p>
        </header>
        <EmployerFormV2 occs={occs} fan={fan} skills={skillBank()} salaryHints={salaryHints} />
      </div>
    </PageShell>
  );
}
