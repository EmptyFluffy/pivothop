import type { Metadata } from 'next';
import Link from 'next/link';
import fs from 'node:fs';
import path from 'node:path';
import { PageShell } from '../components/SiteChrome';
import { Crumbs } from '../components/Crumbs';
import { PageHead } from '../components/PageHead';
import { DIRECT_SOURCES, type Job } from '../jobs/JobCard';
import { occTitle } from '../jobs/jobs-data';
import { countryName } from '../jobs/countries';

/* /direct (2026-09-11): what the lock on direct postings is, in plain words,
   with the live numbers behind it. This page is the landing for every
   "Unlock" button on the board. Accounts and plans are the next phase
   (docs/34); until they ship the page says so rather than pretending. */

export const metadata: Metadata = {
  title: 'Direct jobs: roles read from company sites, not job boards',
  description: 'Thousands of live roles PivotHop reads straight from employers’ own careers pages and hiring systems. Title, location and pay are open; the company and the apply link open with a plan.',
  alternates: { canonical: '/direct' },
};

function directStats() {
  let jobs: Job[] = [];
  try { jobs = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'all-jobs.json'), 'utf8')) as Job[]; } catch { /* build edge */ }
  const direct = jobs.filter((j) => DIRECT_SOURCES.has(j.source));
  const top = (key: (j: Job) => string | undefined, k: number) => {
    const m = new Map<string, number>();
    for (const j of direct) { const v = key(j); if (v) m.set(v, (m.get(v) ?? 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, k);
  };
  const week = direct.filter((j) => Date.now() - Date.parse(`${(j.posted || '').slice(0, 10)}T12:00:00Z`) <= 7 * 864e5).length;
  return {
    total: jobs.length, direct: direct.length, week,
    companies: new Set(direct.map((j) => j.company)).size,
    remote: direct.filter((j) => j.remote).length,
    paid: direct.filter((j) => j.smin || j.smax).length,
    occs: top((j) => j.occ, 8),
    countries: top((j) => j.c, 6),
  };
}

export default function DirectPage() {
  const s = directStats();
  const faq = [
    { q: 'What makes a posting "direct"?', a: 'We read it from the employer itself: its own careers page, or the hiring system the page hands you to (Greenhouse, Ashby, Lever, Workday and the like). Nothing on this list came through a job-board feed. That is the whole point: these are the roles that sit on company sites and often never make it to the big boards.' },
    { q: 'Why is the company hidden?', a: `Because that is the part we do the work for. Reading ${s.companies.toLocaleString()} employer sites every night costs money and care, and the company name plus the apply link is what a subscriber pays for. The title, location and posted pay stay open on every card so you can see exactly what is behind the lock before you decide.` },
    { q: 'Is everything on PivotHop locked now?', a: `No. ${(s.total - s.direct).toLocaleString()} of the ${s.total.toLocaleString()} live roles on the board come from public feeds and stay fully open, apply link included. Only the ${s.direct.toLocaleString()} direct postings are locked, and only their company and link.` },
    { q: 'When can I sign up?', a: 'Accounts with Google sign-in and a monthly plan are the next thing we ship. Until then the lock is on, the counts are real, and every card tells you what is inside. If you want to be told the day it opens, write to hello@pivothop.com with the subject "direct".' },
  ];
  return (
    <PageShell v2>
      <div className="rtp">
        <Crumbs trail={[{ label: 'Direct jobs' }]} />
        <PageHead
          kicker="Direct from employers"
          title="Roles read from company sites, not job boards"
          lede={`${s.direct.toLocaleString()} live roles that PivotHop reads straight from ${s.companies.toLocaleString()} employers’ own careers pages and hiring systems, ${s.week.toLocaleString()} of them added in the last seven days. Every card shows the title, the location and the posted pay. The company and the apply link open with a plan.`}
          meta={<><span className="lbl">{s.direct.toLocaleString()}</span> direct roles &middot; <span className="lbl">{s.companies.toLocaleString()}</span> employers &middot; <span className="lbl">{s.remote.toLocaleString()}</span> fully remote &middot; <span className="lbl">{s.paid.toLocaleString()}</span> state pay &middot; refreshed nightly</>}
        />

        <section className="rt-sec">
          <h2>How it works</h2>
          <p>Every night we open the careers pages of the employers we follow and read what is posted there, the same way you would, then check each posting against the board and keep only what is new or changed. Where a page hands us to a hiring system, we read the system. Nothing is written by a model: the title, the location and the pay are the employer&rsquo;s own words, and the description on each posting is the text of the page.</p>
          <p>The rest of the board, the roles that come from public feeds, stays exactly as it was: open, with the apply link on every card. The lock is only on what we go and find ourselves.</p>
        </section>

        <section className="rt-sec occ-facts">
          <h2>What is behind the lock right now</h2>
          <div className="occ-skills">
            <h3>By role</h3>
            <ul>
              {s.occs.map(([o, n]) => <li key={o}><Link className="gl" href={`/jobs/${o}`}>{occTitle(o)}</Link><span className="n">{n}</span></li>)}
            </ul>
          </div>
          <div className="occ-skills">
            <h3>By country</h3>
            <ul>
              {s.countries.map(([c, n]) => <li key={c}><span>{countryName(c)}</span><span className="n">{n}</span></li>)}
            </ul>
          </div>
          <p className="rt-note occ-tbl-note">Counts are the live board on the date of the nightly build. The role links open the full board for that occupation, direct and public postings together.</p>
        </section>

        <section className="rt-cta">
          <div>
            <h2>Plans open soon</h2>
            <p>Google sign-in and a monthly plan are the next thing we ship. Until then, everything you see here is real, and the lock is honest about what it holds.</p>
          </div>
          <Link className="rt-go" href="/jobs">Browse the board &rarr;</Link>
        </section>

        <div className="post-faq rt-faq">
          <h2>Quick answers</h2>
          {faq.map((f) => (
            <details key={f.q} name="pagefaq"><summary>{f.q}</summary><p>{f.a}</p></details>
          ))}
        </div>

        <p className="rt-method lbl">
          Direct postings are read from employer sites and hiring systems that allow it (robots.txt respected), refreshed nightly, and link out to apply at the original posting once unlocked. PivotHop does not host applications and is not affiliated with the employers listed.
        </p>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      }) }} />
    </PageShell>
  );
}
