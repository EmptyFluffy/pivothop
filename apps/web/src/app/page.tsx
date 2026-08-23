import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from './components/SiteChrome';
import { jobsIndex, occList, boardStats } from './jobs/jobs-data';
import { allCategories } from './jobs/categories-data';
import { routableSlugs } from './routes/routes-data';

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
  title: 'PivotHop — Career moves, measured.',
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
  const trending = [...cats].sort((a, b) => b.count - a.count).slice(0, 14);

  return (
    <PageShell v2>
      <div className="lp">
        <section className="lp-hero">
          <h1>Career moves, <span className="em">measured.</span></h1>
          <p className="lp-sub">
            PivotHop reads live job postings nightly and turns them into instruments: a job board tagged by
            the skills that reach each role, a map of every adjacent career move, and the fair price of
            remote work. Numbers, not vibes.
          </p>
          <p className="lp-proof lbl">
            {`${total.toLocaleString()} live roles · ${occs} occupations · ${remote.toLocaleString()} fully remote · ${routes.toLocaleString()} measured routes · read nightly`}
          </p>

          {/* the real search: one action from the front door into the board */}
          <form className="lp-search" action="/jobs" method="get" role="search" aria-label="Search the job board">
            <label className="lp-sfield">
              <span className="l">Role, company, or skill</span>
              <input type="text" name="q" placeholder="Architect, Python, Philips…" autoComplete="off" />
            </label>
            <span className="lp-sdiv" aria-hidden="true" />
            <label className="lp-sfield lp-sloc">
              <span className="l">Location</span>
              <input type="text" name="loc" placeholder="Anywhere" autoComplete="off" />
            </label>
            <button className="lp-go" type="submit">
              Search {total.toLocaleString()} roles
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </button>
          </form>

          <nav className="lp-trend" aria-label="Popular searches">
            <span className="lbl">Trending</span>
            {trending.map((c) => (
              <Link key={c.slug} href={`/jobs/${c.slug}`}>{c.title} <span className="lp-n">{c.count.toLocaleString()}</span></Link>
            ))}
            <Link className="lp-all" href="/jobs/browse">All {cats.length.toLocaleString()} searches &rarr;</Link>
          </nav>
        </section>

        {/* the instruments: cards that grow as the toolbox does */}
        <section className="lp-tools" aria-label="The instruments">
          <h2>The instruments.</h2>
          <div className="lp-toolgrid">
            <Link className="lp-tool" href="/instrument">
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
