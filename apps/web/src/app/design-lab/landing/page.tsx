import type { Metadata } from 'next';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { PageShell } from '../../components/SiteChrome';
import LandingSearch from '../../components/LandingSearch';
import { jobsIndex, occList, boardStats, getJobs } from '../../jobs/jobs-data';
import { allCategories, categoryJobs, getCategory } from '../../jobs/categories-data';
import { salaryLabel, companyInitial, monoTint, type Job } from '../../jobs/JobCard';
import { routableSlugs, originRoles, originMeta } from '../../routes/routes-data';
import s from './page.module.css';

export const metadata: Metadata = {
  title: 'PivotHop · Landing preview',
  robots: { index: false, follow: false },
};

const Arrow = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>;

function JobLogo({ job }: { job: Job }) {
  const [background, color] = monoTint(job.company);
  return <span className={s.logo} aria-hidden="true">{job.logo
    // The board already serves local, cached company assets at their native size.
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={job.logo} alt="" width="36" height="36" loading="lazy" />
    : <i style={{ background, color }}>{companyInitial(job.company)}</i>}</span>;
}

export default function LandingPreview() {
  const idx = jobsIndex();
  const total = Object.values(idx).reduce((sum, n) => sum + n, 0);
  const occupations = occList();
  const { remote } = boardStats();
  const routeSlugs = routableSlugs();
  const cats = allCategories();
  const trending = [...cats].sort((a, b) => b.count - a.count).slice(0, 5);
  const roles = occupations.map(o => ({ t: o.title, slug: o.slug, n: idx[o.slug] ?? 0 }))
    .sort((a, b) => b.n - a.n).map(({ t, slug }) => ({ t, slug }));
  const locations = ['Remote', ...cats.filter(c => c.kind === 'country')
    .sort((a, b) => b.count - a.count).map(c => c.title.replace(/^Jobs in (the )?/, ''))];
  const routeSet = new Set(routeSlugs);
  const examples = originRoles('architect')
    .filter(r => routeSet.has(`architect-to-${r.id}`))
    .sort((a, b) => b.match - a.match).slice(0, 3);
  const origin = originMeta('architect');
  const used = new Set<string>();
  function pick(jobs: Job[]) {
    const selected = [...jobs]
      .sort((a, b) => (b.posted || '').localeCompare(a.posted || ''))
      .sort((a, b) => (Number(!!b.smin || !!b.smax) + Number(!!b.logo)) - (Number(!!a.smin || !!a.smax) + Number(!!a.logo)))
      .filter(j => !used.has(j.id)).slice(0, 4);
    selected.forEach(j => used.add(j.id));
    return selected;
  }
  const bands: { title: string; href: string; count: number; jobs: Job[] }[] = [];
  for (const slug of ['remote', 'technology', 'design', 'with-equity']) {
    const c = getCategory(slug);
    if (c) bands.push({ title: c.title, href: `/jobs/${c.slug}`, count: c.count, jobs: pick(categoryJobs(c)) });
  }
  const ux = getJobs('ux-designer');
  if (ux.length) bands.splice(2, 0, { title: 'UX jobs', href: '/jobs/ux-designer', count: ux.length, jobs: pick(ux) });
  const remoteBand = bands.find(b => b.href === '/jobs/remote');

  return <div className={s.preview}>
    <PageShell v2>
      <main className={s.landing}>
        <section className={s.hero} aria-labelledby="landing-title">
          <div className={s.heroCopy}>
            <p className={s.eyebrow}>Live jobs. Measured possibilities.</p>
            <h1 id="landing-title">Career moves,<br /><span>measured.</span></h1>
            <p className={s.intro}>Find a role. See where your skills transfer.<br className={s.desktopBreak} /> Know what your next move should pay.</p>
            <Link className={s.textLink} href="/routes">Explore career routes <Arrow /></Link>
          </div>
          <aside className={s.routePanel} aria-label="Example career routes from architecture">
            <div className={s.panelTop}><span>One role. More directions.</span><span className={s.smallMono}>01 / {occupations.length}</span></div>
            <div className={s.origin}><span>Starting from</span><strong>{origin.title}</strong></div>
            <div className={s.routesLabel}><span>Adjacent role</span><span>Skill readiness</span></div>
            <div className={s.routeList}>
              {examples.map(r => <Link className={s.route} key={r.id} href={`/routes/architect-to-${r.id}`}>
                <span className={s.routeName}>{r.title}{r.license?.req === 'required' && <small>License required</small>}</span>
                <span className={s.match}>{r.match}<small>%</small></span>
                <span className={s.measure} aria-hidden="true"><i style={{ '--readiness': `${Math.max(0, Math.min(100, r.match))}%` } as CSSProperties} /></span>
              </Link>)}
            </div>
            <p className={s.panelNote}>Example routes from live posting data.<br />Skill readiness measures posted demand covered.</p>
            <Link className={s.panelLink} href="/routes/architect">View the overlap and the gaps <Arrow /></Link>
          </aside>
        </section>

        <section className={s.searchSection} aria-label="Find your next role">
          <LandingSearch total={total} roles={roles} locations={locations} />
          <nav className={s.popular} aria-label="Popular searches">
            <span>Popular</span>
            {trending.map(c => <Link key={c.slug} href={`/jobs/${c.slug}`}>{c.title}</Link>)}
            <Link className={s.browseAll} href="/jobs/browse">Browse all <Arrow /></Link>
          </nav>
        </section>

        <section className={s.stats} aria-label="The job market in numbers">
          <div><strong>{total.toLocaleString('en-US')}</strong><span>Live roles</span></div>
          <div><strong>{remote.toLocaleString('en-US')}</strong><span>Fully remote</span></div>
          <div><strong>{occupations.length}</strong><span>Occupations</span></div>
          <div><strong>{routeSlugs.length}</strong><span>Measured routes</span></div>
          <p>Read nightly.<br />Built on live postings.</p>
        </section>

        {remoteBand && <section className={s.remoteSection} aria-labelledby="remote-heading">
          <div className={s.sectionHead}><div><p className={s.eyebrow}>The job board</p><h2 id="remote-heading">Work beyond your postcode.</h2></div><Link className={s.textLink} href={remoteBand.href}>{remoteBand.count.toLocaleString('en-US')} remote roles <Arrow /></Link></div>
          <div className={s.remoteCards}>
            {remoteBand.jobs.map(j => <Link className={s.jobCard} key={j.id} href={`/jobs/${j.occ}/${j.id}`}>
              <div className={s.cardTop}><JobLogo job={j} /><span>Remote</span></div>
              <span className={s.company}>{j.company}</span>
              <h3>{j.title}</h3>
              <p className={s.location}>{j.location || 'Location not specified'}</p>
              <div className={s.cardBottom}><span>{salaryLabel(j.smin, j.smax) || 'Salary not listed'}</span><Arrow /></div>
            </Link>)}
          </div>
          <p className={s.sectionNote}>Remote roles may have location restrictions. Check each listing before applying.</p>
        </section>}

        <section className={s.toolsSection} aria-labelledby="tools-heading">
          <div className={s.sectionHead}><div><p className={s.eyebrow}>The instruments</p><h2 id="tools-heading">See the move behind the job.</h2></div><p className={s.sectionDescription}>The overlap. The skill gap.<br />The salary on the other side.</p></div>
          <div className={s.tools}>
            <Link className={s.careerTool} href="/instrument">
              <span className={s.toolKicker}>01 / Career instrument</span>
              <h3>Your skills reach<br />further than your title.</h3>
              <p>Map adjacent careers, compare skill readiness, and see what you would need to learn next. {routeSlugs.length} measured routes.</p>
              <span className={s.toolAction}>Map your next move <Arrow /></span>
            </Link>
            <Link className={s.salaryTool} href="/salary/calculator">
              <span className={s.toolKicker}>02 / Remote salary calculator</span>
              <h3>Fair pay,<br />computed.</h3>
              <p>Test an offer against live postings, official wage statistics, and local purchasing power. {occupations.length} occupations. 60+ countries.</p>
              <span className={s.toolAction}>Run the numbers <Arrow /></span>
            </Link>
          </div>
        </section>

        <section className={s.browseSection} aria-labelledby="browse-heading">
          <div className={s.sectionHead}><div><p className={s.eyebrow}>More ways in</p><h2 id="browse-heading">Follow your skills. Or your curiosity.</h2></div><Link className={s.textLink} href="/jobs/browse">All {cats.length.toLocaleString('en-US')} searches <Arrow /></Link></div>
          <div className={s.bands}>
            {bands.filter(b => b !== remoteBand).map(b => <section className={s.band} key={b.href}>
              <div className={s.bandHead}><h3><Link href={b.href}>{b.title}</Link></h3><Link href={b.href}>{b.count.toLocaleString('en-US')} open <Arrow /></Link></div>
              {b.jobs.map(j => <Link className={s.jobRow} href={`/jobs/${j.occ}/${j.id}`} key={j.id}>
                <JobLogo job={j} /><div className={s.rowInfo}><h4>{j.title}</h4><p>{j.company} <span>· {j.location || (j.remote ? 'Remote' : 'Location not listed')}</span></p></div>
                <span className={s.rowPay}>{salaryLabel(j.smin, j.smax) || 'Not listed'}</span>
              </Link>)}
            </section>)}
          </div>
        </section>

        <nav className={s.resources} aria-label="Career resources">
          {[
            { href: '/routes', title: 'Career routes', copy: 'Every measured move between occupations.' },
            { href: '/salary', title: 'Salaries', copy: 'Posted pay, anchored to official statistics.' },
            { href: '/career-guides', title: 'Career guides', copy: 'The work, the pay, and the path to qualify.' },
            { href: '/employers', title: 'For employers', copy: 'Find candidates whose skills reach your role.' },
          ].map(r => <Link key={r.href} href={r.href}><h3>{r.title}<Arrow /></h3><p>{r.copy}</p></Link>)}
        </nav>
      </main>
    </PageShell>
  </div>;
}
