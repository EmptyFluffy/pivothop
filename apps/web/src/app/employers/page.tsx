import type { Metadata } from 'next';
import Link from 'next/link';
import fs from 'node:fs';
import path from 'node:path';
import { PageShell } from '../components/SiteChrome';
import { EmployerForm, type FanIn } from './EmployerForm';
import { jobsIndex, occList } from '../jobs/jobs-data';
import { routableSlugs, routePair, destRole, originMeta } from '../routes/routes-data';
import { getSalary, usBand } from '../salary/salary-data';

// Two per-post tiers, half off at launch while the board fills. One place to reprice.
const PRICING = {
  std: { name: 'Standard', full: 99, launch: 49 },
  feat: { name: 'Featured', full: 199, launch: 99 },
};

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
  const occs = occList();
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

  // Real typical band per occupation (p25–p75), so the form can offer a
  // one-click salary prefill for the matched role.
  const salaryHints: Record<string, { lo: number; hi: number }> = {};
  for (const o of occs) {
    const sal = getSalary(o.slug);
    if (!sal) continue;
    const b = usBand(sal);
    if (b?.p25 && b?.p75) salaryHints[o.slug] = { lo: b.p25, hi: b.p75 };
  }

  return (
    <PageShell active="employers">
      <div className="emp-post">
        <nav className="rt-crumbs lbl" aria-label="Breadcrumb"><Link href="/">Instrument</Link><span>/</span><span>Post a job</span></nav>
        <header className="emp-post-head">
          <span className="lbl acc">For employers</span>
          <h1>Post a job.</h1>
          <p>
            Every listing is matched to the candidates whose skills already reach it, from adjacent
            professions no title-based board surfaces. Launch pricing is half off while the board fills.
          </p>
        </header>

        <div className="ejf-pricing" aria-label="Pricing">
          <div className="ejf-tier">
            <span className="ejf-tier-name">{PRICING.std.name}</span>
            <span className="ejf-tier-price"><s>${PRICING.std.full}</s>${PRICING.std.launch}</span>
            <span className="ejf-tier-per">per 30-day post &middot; launch rate</span>
            <p className="ejf-tier-desc">Your role, posted and tagged to the skill graph, matched to adjacent candidates, listed 30 days, linking out to apply.</p>
          </div>
          <div className="ejf-tier ejf-tier-feat">
            <span className="ejf-tier-name">{PRICING.feat.name} <span className="ejf-tier-badge">Most pick this</span></span>
            <span className="ejf-tier-price"><s>${PRICING.feat.full}</s>${PRICING.feat.launch}</span>
            <span className="ejf-tier-per">per 30-day post &middot; launch rate</span>
            <p className="ejf-tier-desc">Everything in Standard, shown first: top of the board, the adjacency spotlight on route and salary pages, and priority in matching.</p>
          </div>
        </div>
        <p className="ejf-launch-note">Launch pricing, half off for every employer while the board fills and the traffic proves out. No card is charged until we review and post your role &mdash; you will see the numbers before it moves to full price.</p>

        <EmployerForm occs={occs} fan={fan} skills={skillBank()} salaryHints={salaryHints} pricing={PRICING} />
      </div>
    </PageShell>
  );
}
