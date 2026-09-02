import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from './components/SiteChrome';
import { jobsIndex, occList, boardStats } from './jobs/jobs-data';
import { allCategories, categoryJobs, getCategory } from './jobs/categories-data';
import { getJobs } from './jobs/jobs-data';
import { salaryLabel, companyInitial, monoTint, type Job } from './jobs/JobCard';
import { routableSlugs } from './routes/routes-data';
import LandingSearch from './components/LandingSearch';

/* The front door (2026-08-22, research-backed): a server-rendered product
   landing, not the instrument. Zero of twelve audited winners lead with a
   novel interaction; the ones with data moats lead with the COUNT. The
   homepage's SEO job is brand + link equity + a short crawl path to the 27k
   programmatic pages — a landing does all three better than a JS graph
   (Mueller: importance decays with click-distance from home). The search box
   is real and posts straight into /jobs (the Wellfound hybrid: demonstrate,
   don't describe). The instrument lives at /instrument now, where it can rank
   for tool queries and meet visitors who arrived wanting it. */

export const metadata: Metadata = {
  title: 'PivotHop: Career moves, measured.',
  description:
    'A career-navigation instrument built on live job postings: a job board tagged by the skills that reach each role, a career-change instrument that maps every adjacent move, and a remote salary calculator. Numbers, not vibes.',
  alternates: { canonical: '/' },
};

export default function Home() {
  const idx = jobsIndex();
  const total = Object.values(idx).reduce((s, n) => s + n, 0);
  const occs = occList().length;
  const { remote } = boardStats();
  const routes = routableSlugs().length;

  // The trending block: the densest preloaded searches, server-rendered plain
  // links — the crawl path into the programmatic tier (finding 4 of the SEO
  // sweep: ship 10–20 links into pSEO, not just one link to /jobs).
  const cats = allCategories();
  // five pills, titles only — the trending row is an appetizer, not a menu
  const trending = [...cats].sort((a, b) => b.count - a.count).slice(0, 5);
  // dropdown feeds: occupations by live volume; countries from the category tier
  const roles = occList()
    .map((o) => ({ t: o.title, slug: o.slug, n: idx[o.slug] ?? 0 }))
    .sort((a, b) => b.n - a.n)
    .map(({ t, slug }) => ({ t, slug }));
  const locations = ['Remote', ...cats.filter((c) => c.kind === 'country')
    .sort((a, b) => b.count - a.count)
    .map((c) => c.title.replace(/^Jobs in (the )?/, ''))];

  // The Wellfound move, on our data: a few live cards per interesting
  // category (never "senior jobs"). Freshest first, salary-and-logo-carrying
  // rows preferred so the cards look alive; every band links into its page.
  const used = new Set<string>();   // a job appears once on the page, ever
  const pickJobs = (jobs: Job[], n = 4): Job[] => {
    const picked = [...jobs]
      .sort((a, b) => (b.posted || '').localeCompare(a.posted || ''))
      .sort((a, b) => (Number(!!b.smin || !!b.smax) + Number(!!b.logo)) - (Number(!!a.smin || !!a.smax) + Number(!!a.logo)))
      .filter((j) => !used.has(j.id))
      .slice(0, n);
    for (const j of picked) used.add(j.id);
    return picked;
  };
  const bands: { title: string; href: string; count: number; jobs: Job[] }[] = [];
  for (const slug of ['remote', 'technology', 'design', 'with-equity']) {
    const c = getCategory(slug);
    if (c) bands.push({ title: c.title, href: `/jobs/${c.slug}`, count: c.count, jobs: pickJobs(categoryJobs(c)) });
  }
  const ux = getJobs('ux-designer');
  if (ux.length) bands.splice(2, 0, { title: 'UX jobs', href: '/jobs/ux-designer', count: ux.length, jobs: pickJobs(ux) });

  return (
    <PageShell v2>
      <div className="lp">
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <h1>Career moves, <span className="em">measured.</span></h1>
            <p className="lp-sub">
              PivotHop reads live job postings nightly and turns them into instruments: a job board tagged by
              the skills that reach each role, a map of every adjacent career move, and the fair price of
              remote work. Numbers, not vibes.
            </p>
            <p className="lp-proof lbl">
              {`${total.toLocaleString()} live roles · ${occs} occupations · ${remote.toLocaleString()} fully remote · ${routes.toLocaleString()} measured routes · read nightly`}
            </p>
          </div>
          <img className="lp-hero-art" src="/hero-scout.png" alt="" width="987" height="1031" fetchPriority="high" />
        </section>

        {/* the real search, centered: one action from the front door into the board */}
        {/* the real search, centered: hybrid cells (type or pick) */}
        <section className="lp-searchband">
          <LandingSearch total={total} roles={roles} locations={locations} />

          <nav className="lp-trend" aria-label="Popular searches">
            {trending.map((c) => (
              <Link key={c.slug} className="lp-pill" href={`/jobs/${c.slug}`}>{c.title}</Link>
            ))}
            <Link className="lp-all" href="/jobs/browse">All {cats.length.toLocaleString()} searches &rarr;</Link>
          </nav>
        </section>

        {/* live cards per category — the board, tasted */}
        <section className="lp-bands" aria-label="Open roles by category">
          {bands.map((b) => (
            <div key={b.href} className="lp-band">
              <div className="lp-band-head">
                <h2><Link href={b.href}>{b.title}</Link></h2>
                <Link className="lp-band-all lbl" href={b.href}>{b.count.toLocaleString()} open &rarr;</Link>
              </div>
              <div className="lp-cards">
                {b.jobs.map((j) => (
                  <Link key={`${j.occ}-${j.id}`} className="lp-card" href={`/jobs/${j.occ}/${j.id}`}>
                    <span className="lp-card-logo" aria-hidden="true">
                      {j.logo
                        ? <img src={j.logo} alt="" width={34} height={34} loading="lazy" />
                        : (() => { const [bg, fg] = monoTint(j.company); return <i style={{ background: bg, color: fg }}>{companyInitial(j.company)}</i>; })()}
                    </span>
                    <span className="lp-card-t">{j.title}</span>
                    <span className="lp-card-co">{j.company}</span>
                    <span className="lp-card-m lbl">{j.location || (j.remote ? 'Remote' : '')}</span>
                    {salaryLabel(j.smin, j.smax) && <span className="lp-card-pay">{salaryLabel(j.smin, j.smax)}</span>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* the instruments: cards that grow as the toolbox does */}
        <section className="lp-tools" aria-label="The instruments">
          <h2>The instruments.</h2>
          <div className="lp-toolgrid">
            <Link className="lp-tool lp-tool-lead" href="/instrument">
              <span className="lbl">Career instrument</span>
              <h3>Map the careers your skills already reach.</h3>
              <p>Name your role and skills; it returns every adjacent move with the match percentage, the salary band, the skill gap, and the honest odds. {routes.toLocaleString()} routes measured from live postings.</p>
              <span className="lp-tool-go lbl">Run the instrument &rarr;</span>
            </Link>
            <Link className="lp-tool" href="/salary/calculator">
              <span className="lbl">Remote salary calculator</span>
              <h3>Fair pay, computed.</h3>
              <p>What a remote role should pay, read four ways: live postings, official wage statistics, and World Bank purchasing power, across {occs} occupations and 60+ countries. Test an offer, no sign-up.</p>
              <span className="lp-tool-go lbl">Run the numbers &rarr;</span>
            </Link>
          </div>
        </section>

        {/* the ledger row into the rest of the product */}
        <section className="lp-more" aria-label="Everything else">
          <div className="lp-more-col">
            <h4><Link href="/routes">Career routes</Link></h4>
            <p>Every measured route between occupations, as pages you can send to someone.</p>
          </div>
          <div className="lp-more-col">
            <h4><Link href="/salary">Salaries</Link></h4>
            <p>Posted-pay distributions per occupation, anchored to official statistics.</p>
          </div>
          <div className="lp-more-col">
            <h4><Link href="/career-guides">Career guides</Link></h4>
            <p>What each job is like, what it pays, and how long it takes to qualify.</p>
          </div>
          <div className="lp-more-col">
            <h4><Link href="/employers">For employers</Link></h4>
            <p>Post a role and it is matched to the candidates whose skills already reach it.</p>
          </div>
        </section>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'PivotHop',
        url: 'https://www.pivothop.com/',
        description: 'Career moves, measured. A career-navigation instrument built on live job postings.',
      }) }} />
    </PageShell>
  );
}
