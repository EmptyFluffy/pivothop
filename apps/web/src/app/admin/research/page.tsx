import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Admin — competitor research', robots: { index: false, follow: false } };
// Dynamic like every other /admin page. Not for freshness — this is static
// content — but so it is never prerendered into the public static output, and so
// check-links does not crawl it and flag its links to the other (dynamic) admin
// pages as broken. Admin lives behind Basic Auth; it should not exist as a file.
export const dynamic = 'force-dynamic';

/* Competitor teardowns, kept in the admin rather than docs/ because this is
   operating reference the two of us re-read, not doctrine. Every number here is
   either published by the company itself or measured directly from their site on
   the date noted — nothing is estimated. Where something could not be verified it
   says so, because a made-up benchmark is worse than none. */

const HIMALAYAS_TIMELINE = [
  { when: 'Apr 2022', users: '65,210', organic: '36,067', apps: '14,581', rev: '$325.68', note: 'Product Hunt launch (7 Apr): #11, 266 upvotes, 678 users. They called it "underwhelming".' },
  { when: 'May 2022', users: '86,125', organic: '41,158', apps: '16,646', rev: '$3,870', note: 'Hacker News (11 May): 17,000+ visitors in ONE day. PH newsletter feature: 726.' },
];

const SITEMAPS = [
  { name: 'jobs', facets: 'locations · skills-categories · markets', note: '50,000+ URLs in the first shard alone' },
  { name: 'companies', facets: 'locations · markets · salaries · technologies · benefits', note: '56,068 URLs across two shards' },
  { name: 'candidates / talent', facets: 'skills-categories · locations · location-keywords · people-directory', note: 'Candidates are an INDEXED ENTITY, not just a private profile' },
];

const COPY = [
  { rank: 1, what: 'Candidates as a third indexed entity', detail: 'They index candidate profiles by skill, by location, and as a people directory. Every profile is product (employers search it), inventory (a second marketplace side) and a page. We have 351 skills and 180 occupations and index neither as people.', ours: 'A "who can do X" surface built from our measurement, not from self-reported profiles.' },
  { rank: 2, what: 'Facet multiplication, not page multiplication', detail: 'Three entities crossed with five or six facets each. They did not write 56,068 company pages; they wrote one template and multiplied it by attributes they already stored — technologies, benefits, salaries, markets.', ours: 'We multiply occupation × route × salary. We do not yet multiply by company, technology, benefit, or market — and we hold all four in the corpus.' },
  { rank: 3, what: 'Consumer subscription, not employer fees', detail: 'Plus $9/mo and Max $29/mo for AI resume, cover letters, mock interviews, coaching. Employers post FREE. They ran the employer-pays experiment at 100k jobs and moved the money to the candidate side.', ours: 'Directly challenges our stated model. A PivotHop Plus (personal route report, gap tracking, alerts when your reachable set changes) fits our instrument better than it fits a job board, because we have something to compute.' },
  { rank: 4, what: 'Build in public with real numbers', detail: 'Two monthly updates from 2022 are still ranking and still being read in 2026 — that is how this teardown was written. Cheapest durable content there is.', ours: 'Our data-quality war stories (a listing posted into 245 towns; an occupation that was 83% one advert) are better material than most startups have.' },
  { rank: 5, what: 'Hacker News over Product Hunt', detail: '17,000 visitors in a day vs 678 for the actual PH launch. 25x. Their infra survived only because they had hardened it two months earlier.', ours: 'Show HN with the method, not the marketing. Harden first — we are static on a CDN, so this is largely free.' },
  { rank: 6, what: 'A curation rule that is also positioning', detail: '"No third-party recruiters, companies only." A constraint that markets itself.', ours: 'Ours could be: no role we cannot measure a route into.' },
  { rank: 7, what: 'Agent distribution', detail: 'Since Mar 2026 employers can post jobs by talking to Claude Desktop, ChatGPT or Cursor over MCP. Almost nobody has built for this channel yet.', ours: 'An MCP surface over the adjacency data would be genuinely novel — ask an agent "what can an architect become" and get our numbers.' },
];

const BOARDS = [
  {
    name: 'Welcome to the Jungle (formerly Otta)',
    url: 'https://www.welcometothejungle.com',
    what: 'Otta merged into WTTJ. Positioned as matching over volume — "less like a job board, more like Netflix for companies". Recommends roles from skills, preferences and career goals instead of a search box.',
    take: 'The strongest argument that curation beats inventory. Their bet is the same as ours: people do not want 10,000 results, they want the right twelve. Difference: their matching is preference-declared, ours is skill-measured.',
  },
  {
    name: 'Jobright',
    url: 'https://jobright.ai',
    what: 'AI ranks jobs against your profile and shows a FIT SCORE before you apply. Explicitly markets "matches your actual skills, not just your title". Also auto-rewrites the resume per job description for ATS.',
    take: 'Read this one carefully — it is the closest thing to our thesis being productised by a funded team. "Skills not titles, with a score" is no longer a unique idea. Our defensible ground is not the concept but the MEASUREMENT: routes computed from 236k live postings, licence gates that refuse to promise a months-scale move into a gated profession, and honest time. Their score is a black box; ours has a waterfall you can audit.',
  },
  {
    name: 'Simplify',
    url: 'https://simplify.jobs',
    what: 'Autofill + application tracking across other boards. You still find the jobs; it removes the typing.',
    take: 'A reminder that a big slice of the value is pure friction removal, not intelligence. Our application tracker equivalent would be saved routes plus what changed since you last looked.',
  },
  {
    name: 'Remote Rocketship',
    url: 'https://www.remoterocketship.com',
    what: 'Remote-only board, solo-operator scale, heavy programmatic SEO across role x location.',
    take: 'The closest peer to our actual size and staffing. Worth periodically checking what a one-person board can sustain.',
  },
  {
    name: 'HiringCafe',
    url: 'https://hiring.cafe',
    what: 'Already torn down in docs/26. Aggregates company-direct postings; the pleasure is in the filtering and the honesty about provenance.',
    take: 'Five items from that read are still in the optimisation queue — provenance on cards, readiness as a filter, triage-able cards, saved search, group by company.',
  },
];

export default function Research() {
  return (
    <div className="adm res">
      <header className="adm-head">
        <h1>Competitor research</h1>
        <span className="lbl">measured 2026-07-30 · numbers are published or measured, never estimated</span>
      </header>

      <nav className="otr-nav">
        <Link href="/admin">← Submissions</Link>
        <Link href="/admin/outreach">Outreach →</Link>
      </nav>

      {/* ── Himalayas ─────────────────────────────────────────────── */}
      <section className="res-sec">
        <h2>Himalayas <span className="lbl">himalayas.app · one of our own scraper sources</span></h2>

        <p className="res-lede">
          Three Australians — Abi Tyas Tunggal, Jack Walsh, Jordan Hughes — started it in <b>2020</b> during the
          pandemic remote-work surge, and only incorporated in <b>2022</b>. Roughly two years as a passion project
          before it was a company. Today: 100,000+ jobs, 25,000+ company profiles, 200,000+ candidate profiles.
        </p>

        <div className="res-callout">
          <span className="lbl">The finding that reframes launch strategy</span>
          <p>
            They launched on Product Hunt in April 2022 — about two years after starting. That month they
            <b> already had 65,210 monthly visitors, 55% of them organic</b>. The launch added 678 users to a machine
            SEO had already built. <b>The launch was not the growth engine.</b> It was a small event on top of one.
          </p>
        </div>

        <h3>What they published, month by month</h3>
        <table className="res-table">
          <thead><tr><th>Month</th><th>Visitors</th><th>Organic</th><th>Applications</th><th>Revenue</th></tr></thead>
          <tbody>
            {HIMALAYAS_TIMELINE.map((r) => (
              <tr key={r.when}>
                <td>{r.when}</td><td>{r.users}</td><td>{r.organic}</td><td>{r.apps}</td><td><b>{r.rev}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="res-notes">
          {HIMALAYAS_TIMELINE.map((r) => <li key={r.when}><span className="lbl">{r.when}</span>{r.note}</li>)}
        </ul>
        <p className="res-warn">
          <b>Two years in, three founders, 65,000 monthly visitors — and $325 a month.</b> May&rsquo;s jump to $3,870
          came with their own caveat: &ldquo;most of that growth was driven by one-off events rather than repeatable
          processes.&rdquo; They stopped publishing monthly updates after May 2022, which is itself a data point
          about how hard sustained transparency is.
        </p>

        <h3>The monetisation flip</h3>
        <div className="res-two">
          <div>
            <span className="lbl">Employers — almost all free</span>
            <ul>
              <li>30-day job posts — <b>free</b></li>
              <li>Company profile — <b>free</b></li>
              <li>Search 200,000+ candidates — <b>free</b></li>
              <li>Message candidates — <b>free</b></li>
              <li>Pinned post — <b>$299</b>, the only paid item</li>
            </ul>
          </div>
          <div>
            <span className="lbl">Job seekers — where the money is</span>
            <ul>
              <li><b>Plus $9/mo</b> — AI resume builder, cover letters, mock interviews, career coach, headshots, daily alerts</li>
              <li><b>Max $29/mo</b> — 500 headshots, 4h voice interview practice</li>
            </ul>
          </div>
        </div>
        <p className="res-warn">
          Our stated model is the opposite: employers pay to post and match. Himalayas reached 100k jobs and 250k
          candidates and concluded employer-pays was not the business. Their buyer differs from ours — we sell a
          measured finding, not a listing — but this is a six-year experiment at scale and deserves a deliberate
          answer rather than a default.
        </p>

        <h3>The SEO architecture — the most copyable thing here</h3>
        <p className="res-lede">
          Their <code>robots.txt</code> exposes <b>16 sitemaps</b>. Read together they are the whole strategy:
          three entities, each multiplied by five or six facets they already stored.
        </p>
        <table className="res-table">
          <thead><tr><th>Entity</th><th>Facets crossed</th><th>Scale</th></tr></thead>
          <tbody>
            {SITEMAPS.map((s) => (
              <tr key={s.name}><td><b>{s.name}</b></td><td>{s.facets}</td><td>{s.note}</td></tr>
            ))}
          </tbody>
        </table>
        <ul className="res-notes">
          <li><span className="lbl">Stack</span>They run <b>Rails</b>, not Next. Sprockets asset fingerprints in the HTML. Same lesson as the designboom read — the stack is never the moat.</li>
          <li><span className="lbl">Crawl</span><code>Disallow: /apply</code> — the funnel is blocked, everything else is open.</li>
          <li><span className="lbl">URLs</span><code>/companies/&lt;co&gt;/jobs/&lt;job&gt;</code> nests jobs under the company, so a job page inherits company authority. <code>/talent/&lt;skill&gt;</code> and <code>/talent/countries/&lt;country&gt;/&lt;skill&gt;</code> are the candidate surface. <code>/@handle</code> for people.</li>
        </ul>
      </section>

      {/* ── What to copy ──────────────────────────────────────────── */}
      <section className="res-sec">
        <h2>What to copy <span className="lbl">ranked by what it would actually buy us</span></h2>
        <ol className="res-copy">
          {COPY.map((c) => (
            <li key={c.rank}>
              <h3>{c.what}</h3>
              <p>{c.detail}</p>
              <p className="res-ours"><span className="lbl">For us</span>{c.ours}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Unverified ────────────────────────────────────────────── */}
      <section className="res-sec">
        <h2>What could not be verified</h2>
        <ul className="res-notes">
          <li><span className="lbl">Profitability</span>No public data. No revenue figures after May 2022, no statement of when or whether they reached profitable, no acquisition found. <b>Do not benchmark a timeline against a number nobody published.</b></li>
          <li><span className="lbl">The 2020–2022 gap</span>Verified: founded 2020, PH launch April 2022, 65k monthly visitors by then. Not verified: whether they posted to other directories in between. Treat &ldquo;two years with no launch&rdquo; as approximately, not exactly, true.</li>
        </ul>
      </section>

      {/* ── Other boards ──────────────────────────────────────────── */}
      <section className="res-sec">
        <h2>Other boards worth watching</h2>
        <div className="res-boards">
          {BOARDS.map((b) => (
            <article key={b.name}>
              <h3><a href={b.url} target="_blank" rel="noopener noreferrer">{b.name}</a></h3>
              <p>{b.what}</p>
              <p className="res-ours"><span className="lbl">Read</span>{b.take}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
