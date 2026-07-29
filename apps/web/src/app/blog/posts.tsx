import type { ReactNode } from 'react';
import { CompareLink } from '../compare/CompareLink';

/* The five launch posts. Every number in these comes from the PivotHop pipeline
   (July 2026 run: 66,403 postings, 145 occupations, 2,874 measured connections)
   or a named public dataset. House rules: deadpan, numbers over adjectives,
   no em dashes, nothing a reader cannot check. */

const P = ({ d }: { d: string }) => (
  <svg className="px-ico" viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges">
    <path d={d} fill="currentColor" />
  </svg>
);
export const PillarIcons: Record<string, () => ReactNode> = {
  'Run It 10,000 Times': () => <P d="M2 13h2V7H2v6zm4 0h2V3H6v10zm4 0h2V9h-2v4zm-9 1h14v1H1v-1z" />,
  'What Carried Over': () => <P d="M1 3h5l1 2h8v1H1V3zm0 3h14v7H1V6zm9 1v2H7v1h3v2l3-2.5L10 7z" />,
  'Unbundle the Job': () => <P d="M7 1h2v6h6v2H9v6H7V9H1V7h6V1z" />,
  'Career Half-Life': () => <P d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2v5l4 2-1 1-4-2V3h1z" />,
  'Shape of Work': () => <P d="M2 2h5v5H2V2zm7 0h5v5H9V2zM2 9h5v5H2V9zm7 2h5v3H9v-3z" />,
};

export type Post = {
  slug: string;
  title: string;
  pillar: keyof typeof PillarIcons;
  date: string;
  dek: string;
  minutes: number;
  body: ReactNode;
  faq?: { q: string; a: string }[];
  takeaways?: string[];   // the short version — scannable, each a self-contained quotable fact (LLM extraction + reader)
};

const Sources = ({ children }: { children: ReactNode }) => (
  <div className="post-sources">
    <span className="lbl">Sources and method</span>
    {children}
  </div>
);

/* Editorial furniture (docs/01: flush left, scale over decoration, accent stays
   on the data). Pull = the oversized statement between hairlines. Go = the
   go-deeper row that turns a post into navigation, not a dead end. */
const Pull = ({ children }: { children: ReactNode }) => (
  <div className="post-pull"><p>{children}</p></div>
);
const A45 = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 7h10v10" /><path d="M7 17 17 7" />
  </svg>
);
const Go = ({ links }: { links: { href: string; label: string }[] }) => (
  <div className="post-go">
    <span className="lbl">Go deeper</span>
    {links.map((l) => <a key={l.href} href={l.href}>{l.label}<A45 /></a>)}
  </div>
);

export const POSTS: Post[] = [
  {
    slug: 'karp-two-safe-workers',
    title: 'Alex Karp says two workers are AI-proof: the trades and the neurodivergent',
    pillar: 'Shape of Work',
    date: 'July 2026',
    dek: 'Palantir’s CEO says two groups have a future as AI accelerates: people with vocational training, and the neurodivergent. One of those claims we can check against 100,000 job postings, and it holds hard — every hands-on field shows zero demand for AI skills, while technology shows the most. The other is a thesis with a fellowship attached. Both land on the same two things a machine still can’t do.',
    minutes: 9,
    takeaways: [
      "Palantir CEO Alex Karp says two kinds of worker have a future as AI accelerates: those with vocational training, and the neurodivergent.",
      "Every hands-on field in our corpus — Trades, Healthcare, Construction, Transport — shows zero AI-skill demand; in Technology, only 37% do.",
      "The AI data-center build-out is projected to need 300,000+ new electricians this decade — the machine rewriting knowledge work can’t wire its own buildings.",
    ],
    faq: [
      { q: 'What did Alex Karp say about AI-proof jobs?', a: 'On the tech show TBPN (March 2026), Palantir CEO Alex Karp said: "There are basically two ways to know you have a future. One, you have some vocational training, or two, you\'re neurodivergent. And when I say neurodivergent, I mean broadly defined." Karp, who is dyslexic, means people with hands-on trade skills and people who think differently. "Non-linear thinkers" and "ADHD" are how commentators paraphrased the second group; his own word was neurodivergent.' },
      { q: 'Which jobs are safest from AI automation?', a: 'By what postings actually demand: hands-on work. In the PivotHop corpus, every occupation in Trades, Healthcare, Construction, Hospitality, and Transport shows zero demand for AI skills in its top-20 — 100% "AI-free" — while only 37% of Technology occupations are. The safest are the ones that combine manual work with a license: electrician, plumber, HVAC technician, registered nurse, physical therapist, paramedic all pair no AI-skill demand with a required credential — two moats, not one.' },
      { q: 'Are the skilled trades a good career in the AI era?', a: 'The demand data is blunt. The US Bureau of Labor Statistics projects roughly 80,000 new electrician openings a year, and electrician employment is set to grow 9% (about 820,000 to 896,000 by 2034) against 3% for all jobs. The driver is the AI build-out itself: data-center construction, where electrical work is 45–70% of the cost, needs an estimated 300,000+ new electricians this decade. The machine rewriting knowledge work cannot wire its own buildings.' },
      { q: 'Is ADHD or neurodivergence actually an advantage at work?', a: 'The honest answer is "for some things, and it is double-edged." Peer-reviewed work (Wiklund and colleagues, Journal of Business Venturing, 2016–2017) finds ADHD traits — impulsivity, hyperfocus, action-over-planning, risk tolerance — align with entrepreneurship, and adults with ADHD are over-represented in self-employment. That is a real fit for specific roles, not a blanket superpower; ADHD is a recognized disability with real costs. Karp’s claim that the neurodivergent "will disproportionately shape America’s future" is a thesis he is betting on, not an established fact.' },
      { q: 'Why can’t AI do skilled trades?', a: 'The 2013 Frey-Osborne study named three barriers to automation: perception and manipulation (physical dexterity), creativity, and social intelligence. Skilled trades sit on the first — non-routine physical work in unpredictable spaces (Moravec’s paradox: the things easiest for humans are hardest for machines). Notably, Karp’s two groups map onto two of those three barriers: vocational training is the dexterity moat, neurodivergence the creativity one.' },
    ],
    body: (
      <>
        <p>
          On the tech show TBPN this spring, Palantir CEO Alex Karp gave the bluntest piece of career advice a billionaire has offered the AI generation: &ldquo;Everybody&rsquo;s worried about their future, but there are basically two ways to know you have a future. One, you have some vocational training. Or two, you&rsquo;re neurodivergent. And when I say neurodivergent, I mean broadly defined.&rdquo; It went viral as a claim about &ldquo;non-linear thinkers&rdquo; and ADHD, but that is the paraphrase. Karp&rsquo;s own word was <em>neurodivergent</em>, and he was talking partly about himself: he is dyslexic, and in December his company launched a <strong>Neurodivergent Fellowship</strong> paying $110,000 to $200,000, after a clip of him unable to sit still through a New York Times interview went viral.
        </p>
        <p>
          Two groups, then: people who work with their hands, and people who think differently. One of those claims is measurable, so we measured it.
        </p>
        <Go links={[
          { href: '/blog/ai-jobs-three-ledgers', label: 'Altman’s jobs claim, checked' },
          { href: '/blog/skills-over-titles', label: 'The skills-over-titles thesis' },
          { href: '/', label: 'Measure your own reach' },
        ]} />

        <h2>Group one holds: the hands-on fields show zero AI demand</h2>
        <p>
          Our data can&rsquo;t tell you whether a robot will ever swing a hammer. But it can tell you something adjacent and concrete: whether employers are rewriting a job <em>around</em> AI, by whether their postings now ask for AI skills. Across 100,000-plus live postings, we tagged which occupations name LLM or agent tooling in their top-20 skill demand. The split is stark.
        </p>
        <div className="post-callout"><b>100% vs 37%</b><span>Every occupation we track in <strong>Trades, Healthcare, Construction, Hospitality, and Transport</strong> shows zero AI-skill demand. In <strong>Technology</strong>, only 37% are AI-free. The hands-on economy isn&rsquo;t being rewritten around AI; the knowledge economy is.</span></div>
        <table className="post-table">
          <caption>Share of a field&rsquo;s occupations with no AI-skill demand in their top-20 &middot; July 2026</caption>
          <thead><tr><th>Field</th><th>AI-free</th></tr></thead>
          <tbody>
            <tr><td>Trades, Healthcare, Construction, Transport, Engineering, Finance</td><td>100%</td></tr>
            <tr><td>Writing</td><td>86%</td></tr>
            <tr><td>Design</td><td>78%</td></tr>
            <tr><td>Legal</td><td>67%</td></tr>
            <tr><td>Business</td><td>56%</td></tr>
            <tr><td>Technology</td><td>37%</td></tr>
          </tbody>
        </table>
        <p>
          Say the honest limit out loud: &ldquo;no AI-skill demand&rdquo; means employers aren&rsquo;t asking electricians to prompt a model, not that a machine could never rewire a panel. It&rsquo;s a demand-side signal, not a robotics forecast. But it points the same way Karp does, and it stacks with a second moat. The safest occupations we track pair the manual work with a <strong>license</strong>: <a className="gl" href="/jobs/electrician">electrician</a>, <a className="gl" href="/jobs/plumber">plumber</a>, HVAC technician, <a className="gl" href="/jobs/registered-nurse">registered nurse</a>, physical therapist, paramedic: every one shows no AI-skill demand <em>and</em> a required credential. A model can&rsquo;t pass the licensing board, and it can&rsquo;t crawl the crawlspace.
        </p>
        <Pull>A model can’t pass the licensing board, and it can’t crawl the crawlspace.</Pull>

        <h2>The irony the trades are living: AI is causing their shortage</h2>
        <p>
          The 2013 Oxford study by Frey and Osborne, the one that put &ldquo;47% of jobs at risk&rdquo; into the culture, named exactly three things that resist automation: physical dexterity, creativity, and social intelligence. The trades sit squarely on the first: non-routine physical work in cramped, unpredictable spaces, which is <em>Moravec&rsquo;s paradox</em> in a tool belt: the tasks easiest for a human are the hardest to automate.
        </p>
        <p>
          And here is the part that should end the &ldquo;learn to code, not to weld&rdquo; era for good. The US Bureau of Labor Statistics projects roughly <strong>80,000 new electrician openings a year</strong>, with electrician employment growing <strong>9%</strong> against 3% for all jobs. The engine of that demand is the AI build-out itself: data-center construction, where electrical work runs <strong>45 to 70 percent</strong> of the cost, is projected to need <strong>300,000+ new electricians</strong> this decade, and a journeyman license takes three to five years and 8,000 hours to earn, so the shortage can&rsquo;t be closed on demand. Fortune called the wider skilled-trades gap a &ldquo;$1 trillion crisis.&rdquo;
        </p>
        <Pull>The machine rewriting knowledge work can’t wire its own buildings.</Pull>
        <p>
          So the same technology hollowing out the entry rung of white-collar work is, physically, creating a historic shortage of the workers it can&rsquo;t replace. Karp&rsquo;s group one isn&rsquo;t just safe. It&rsquo;s where the money is moving.
        </p>

        <h2>Group two: a thesis, a fellowship, and a caveat</h2>
        <p>
          The second claim is harder, and it deserves more care than the viral version gave it. Karp&rsquo;s wager is that <strong>neurodivergence</strong> &mdash; dyslexia, ADHD, autism, &ldquo;broadly defined&rdquo;, becomes an edge precisely as AI commoditizes the linear, in-distribution thinking it does best. Palantir put money on it: the Neurodivergent Fellowship drew over a thousand applications, and Karp framed it flatly &mdash; &ldquo;the neurally divergent (like myself) will disproportionately shape America&rsquo;s future.&rdquo;
        </p>
        <p>
          There is real research under the mindset half of this, and it is specific, not a superpower story. Johan Wiklund and colleagues, across the <em>Journal of Business Venturing</em> (2016&ndash;2017), find that ADHD traits &mdash; impulsivity, hyperfocus, a bias toward action over planning, tolerance for risk, align unusually well with <strong>entrepreneurship</strong>, and that adults with ADHD are over-represented in self-employment. Which maps onto Frey and Osborne&rsquo;s second moat, creativity: divergent, cross-domain thinking is the thing generative models, trained to complete the most probable next token, are structurally weakest at.
        </p>
        <p>
          The caveat is non-negotiable and the honest brands say it: ADHD is a recognized disability with real daily costs, not a hack. The research shows fit for <em>particular</em> roles (founder, creative, high-stimulation, crisis-response), not blanket immunity to automation. Karp is stating a bet, not a finding. But it&rsquo;s a bet pointed at the same target as the trades: the two human capacities, the hands and the leap, that the current machines don&rsquo;t have.
        </p>
        <Pull>The hands and the leap: the two things the current machines don’t have.</Pull>

        <h2>What to do with two AI-proof groups</h2>
        <p>
          Neither group is a place you simply are or aren&rsquo;t. Vocational training is a route &mdash; often a short, well-paid, license-gated one, that a surprising range of backgrounds can reach, and the instrument on this site measures which trades your current skills already sit closest to. The neurodivergent edge is a working style you can lean into by choosing roles that reward it: founder over functionary, the job with novelty and stakes over the one with a checklist. Both of Karp&rsquo;s answers reduce to the same instruction the rest of our data keeps giving: stop optimizing for the roles a model is quietly learning to do, and move toward the two things it still can&rsquo;t: dexterity and genuine divergence.
        </p>
        <Go links={[
          { href: '/jobs/trades', label: 'The trades board, live' },
          { href: '/', label: 'Which trades your skills reach' },
          { href: '/blog/ai-jobs-three-ledgers', label: 'AI and jobs: the four ledgers' },
          { href: '/jobs/browse', label: 'The board, every cut' },
        ]} />

        <Sources>
          <p>
            Karp&rsquo;s quote: TBPN, via <a className="gl" href="https://x.com/tbpn/status/2032208844622033294">TBPN&rsquo;s own clip</a> and <a className="gl" href="https://fortune.com/2026/03/24/palantir-ceo-alex-karp-two-people-successful-in-ai-era-vocational-skills-neurodivergence-gen-z-career-advice">Fortune</a> (March 24, 2026). The <a className="gl" href="https://x.com/PalantirTech/status/1997720487187636260">Palantir Neurodivergent Fellowship</a> (launched Dec 7, 2025; $110k&ndash;$200k; 1,000+ applications) and Karp&rsquo;s &ldquo;neurally divergent&rdquo; statement from Palantir&rsquo;s own posts. Automation barriers: Frey &amp; Osborne, &ldquo;The Future of Employment&rdquo; (Oxford, 2013) &mdash; perception/manipulation, creativity, social intelligence. Trades demand: US Bureau of Labor Statistics electrician projections; data-center electrical-labor estimates and the &ldquo;$1 trillion&rdquo; framing via Fortune (April 2026). ADHD and entrepreneurship: Wiklund, Patzelt &amp; Dimov, &ldquo;how ADHD can be productively harnessed&rdquo; (J. Business Venturing Insights, 2016) and Wiklund et al., &ldquo;ADHD, impulsivity, and entrepreneurship&rdquo; (J. Business Venturing, 2017); adult ADHD prevalence ~4.4% (NIMH). PivotHop figures &mdash; the share of each field&rsquo;s occupations with no AI-skill demand, and the licensed-trade overlap &mdash; are computed from the July 2026 corpus (method in <a className="gl" href="/blog/skills-over-titles">Job titles, deprecated</a>) and recompute with the nightly scrape. Where Karp states a bet rather than a finding, the text says so.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'claude-chats-google',
    title: 'Claude chats appeared in Google search. Blocking Google is why.',
    pillar: 'Shape of Work',
    date: 'July 2026',
    dek: 'Over the last weekend of July, a site: search surfaced strangers’ shared Claude conversations in Google, resumes and API keys included. It was purged within about 48 hours, and the mechanism is the interesting part: the pages were blocked from crawling, which is precisely why they could be indexed. The fourth AI product this happens to, the career stakes, and how to check yours.',
    minutes: 8,
    takeaways: [
      "Shared Claude conversations surfaced in Google search over the July 25–27, 2026 weekend and were purged within about 48 hours.",
      "The cause is counterintuitive: the pages were blocked from crawling, so Google never saw their noindex and indexed the links anyway.",
      "It is the fourth AI product this has happened to, after Google Bard (2023), ChatGPT, and Grok (2025).",
    ],
    faq: [
      { q: 'Are Claude conversations public?', a: 'Not unless you share them. A Claude chat becomes a public web page only when you press Share, which mints a claude.ai/share link; anyone holding that link can read the snapshot. The July 2026 incident involved those deliberately shared links surfacing in Google results, where strangers could find them without being handed the link. Regular, unshared chats were never involved.' },
      { q: 'How do I check whether my AI chats are in Google?', a: 'Search site:claude.ai/share, site:chatgpt.com/share, or site:grok.com/share together with your name or a distinctive phrase from the conversation, and repeat on Bing and Brave, which cleared more slowly than Google in the Claude case. If a link of yours appears: unshare at the source first, then use Google’s Refresh Outdated Content tool to clear the result.' },
      { q: 'How do I remove a shared Claude or ChatGPT link?', a: 'In Claude: Settings, then Privacy, then Shared chats, then Unshare (or flip the chat’s visibility from Public to Private). In ChatGPT: Settings, then Data Controls, then Shared Links, then delete — note that deleting the chat from your history does not delete the shared copy. Revoking the link kills public access immediately; the search listing takes longer to fall out.' },
      { q: 'Is the Claude indexing issue fixed?', a: 'For Google chat results, effectively yes: listings were purged between Saturday night and Monday, July 25–27, 2026, and the site: query then returned nothing. Three caveats reported at the time: some Artifact pages were still findable on Monday, Bing and Brave lagged Google, and Anthropic had made no public statement, so the exact fix is unconfirmed. The structural quirk that produced the incident — share pages hidden from crawlers, so their noindex is invisible — remained in place.' },
      { q: 'Can a deleted AI chat still be found somewhere?', a: 'Yes. De-indexed is not deleted: after the ChatGPT episode, roughly 110,000 shared conversations remained readable in the Internet Archive, and researchers later counted 143,000 archived chats across Claude, ChatGPT, Grok, and others. Third-party scrapes exist too. Treat a share link as publishing, because that is what it is.' },
    ],
    body: (
      <>
        <p>
          On Saturday, July 25, a Reddit user showed that typing <code>site:claude.ai/share</code> into Google returned strangers&rsquo; shared Claude conversations. By Sunday it was trending on X; by Monday the listings were gone and the query returned nothing. Reporters who clicked through in the meantime found, among the exposed pages: resumes with real names and phone numbers, API keys and login credentials, crypto wallet keys, a lawyer&rsquo;s notes on a potential ethics case, a patient&rsquo;s medical report, and employee performance reviews.
        </p>
        <div className="post-callout"><b>~48 hours</b><span>from the first Reddit post (Saturday 18:11 UTC) to a clean Google result set. Scale was never pinned down: outlets reported &ldquo;hundreds&rdquo; to &ldquo;thousands.&rdquo; Anthropic, as of the Monday, had made no public statement.</span></div>
        <p>
          We run a job site, which means indexing control is not abstract to us; it is a config file we touch every week. So here is the part of this story most coverage got wrong, and the reason it keeps happening to the entire industry.
        </p>
        <Go links={[
          { href: '/blog/ai-jobs-three-ledgers', label: 'Altman&rsquo;s jobs claim, checked' },
          { href: '/blog/why-recruiters-ghost', label: 'Why recruiters ghost' },
          { href: '/', label: 'The instrument (no account, nothing stored)' },
        ]} />

        <h2>The mechanism: blocked from crawling, therefore indexable</h2>
        <p>
          The obvious diagnosis, a missing noindex tag, is wrong, and the truth is stranger. Claude&rsquo;s <code>robots.txt</code> has told crawlers to stay out of <code>/share/</code> since August 2025. That sounds like protection. It is actually the hole: because Google is forbidden from <em>fetching</em> those pages, it can never see the noindex instruction they carry. So when someone posts their share link anywhere public (a forum, a group chat that leaks, a blog), Google indexes the bare URL without ever reading the page. The listings even said &ldquo;No information is available for this page.&rdquo; The chat text was never in Google&rsquo;s index; the link was, and the link was enough, because anyone clicking it got the full conversation.
        </p>
        <Pull>Robots.txt is a do-not-enter sign, not a do-not-mention sign.</Pull>
        <p>
          The correct pattern is the counterintuitive one: <strong>let the crawler in, and let it read &ldquo;do not index me.&rdquo;</strong> ChatGPT&rsquo;s share pages do exactly that: explicitly crawlable, carrying a noindex tag, which is why they stay out of results the boring way. PivotHop&rsquo;s job detail pages use the same pattern for the same reason. It is standard webmaster craft, and in July 2026 one of the most sophisticated AI companies on earth was still learning it in public.
        </p>

        <h2>The fourth time, not the first</h2>
        <p>
          Every major chatbot has now had a version of this incident, and the ledger is worth reading in order. <strong>Google Bard, September 2023</strong>: shared chats indexed; Google&rsquo;s own search liaison conceded &ldquo;we don&rsquo;t intend for these shared chats to be indexed&rdquo; and blocked them within a day. <strong>ChatGPT, July 2025</strong>: a share-dialog checkbox labeled &ldquo;make this chat discoverable&rdquo; put nearly 4,500 conversations into Google before Fast Company noticed; OpenAI&rsquo;s security chief killed the feature within two days, calling it &ldquo;a short-lived experiment,&rdquo; and a researcher later counted roughly <strong>100,000</strong> indexed conversations: NDAs, contract drafts, and a resume-rewrite chat a reporter traced to a real person&rsquo;s LinkedIn. <strong>Grok, August 2025</strong>: over <strong>370,000</strong> conversations indexed by Google&rsquo;s estimate. <strong>Claude</strong> has now had it twice: just under 600 conversations in September 2025 by Google&rsquo;s count, and this weekend&rsquo;s rerun.
        </p>
        <table className="post-table">
          <caption>Share-page indexing posture, checked directly, July 27, 2026</caption>
          <thead><tr><th>Product</th><th>Crawler access</th><th>Page instruction</th><th>Net effect</th></tr></thead>
          <tbody>
            <tr><td>ChatGPT</td><td>Allowed</td><td>noindex</td><td>Correct: Google reads the no</td></tr>
            <tr><td>Gemini</td><td>Allowed</td><td>noindex</td><td>Correct (fixed after Bard, 2023)</td></tr>
            <tr><td>Claude</td><td>Blocked</td><td>noindex, invisible to crawlers</td><td>URL-only indexing stays possible</td></tr>
            <tr><td>Grok</td><td>Allowed</td><td><strong>index, follow</strong></td><td>Shared chats remain indexable today</td></tr>
          </tbody>
        </table>

        <h2>Why this is a careers story</h2>
        <p>
          Look at what actually leaked, across all four platforms: resumes, performance reviews, staff names and emails in work transcripts, NDA texts, LinkedIn drafts. People do their <em>work</em> in these tools, and the numbers say so: Harmonic Security&rsquo;s analysis of 22 million enterprise prompts found sensitive data in roughly one prompt in forty, with employee records among the top categories, and a 2025 National Cybersecurity Alliance survey found <strong>43 percent of workers admit sharing sensitive workplace information with AI tools</strong> without their employer knowing. A job search runs on exactly this material: the resume with your address on it, the negotiation strategy, the honest assessment of why you left. A share link mints a public URL for all of it.
        </p>
        <Pull>A share link is a publish button wearing a different label.</Pull>
        <div className="post-callout"><b>De-indexed &ne; deleted</b><span>After the ChatGPT purge, ~110,000 shared conversations remained readable in the Internet Archive &mdash; which honored no bulk removal request, its director confirmed &mdash; and researchers later counted <strong>143,000</strong> archived chats across Claude, ChatGPT, Grok and others. Third-party scrapes exist besides.</span></div>

        <h2>What to actually do</h2>
        <p>
          Three moves, none dramatic. <strong>Check yourself</strong>: run <code>site:claude.ai/share</code>, <code>site:chatgpt.com/share</code>, and <code>site:grok.com/share</code> with your name or a phrase you remember, on Google and on Bing, which cleared slower. <strong>Revoke at the source</strong>: Claude keeps the list under Settings &rarr; Privacy &rarr; Shared chats; ChatGPT under Settings &rarr; Data Controls &rarr; Shared Links, and deleting a chat from history does not delete its shared copy; then Google&rsquo;s Refresh Outdated Content tool for a listing that lingers. <strong>Change the mental model</strong>: a share link is publishing, so anything you would not put on a public profile &mdash; career material above all &mdash; should not travel through one. The instrument on this site runs without an account and stores nothing, which is not a flex; after a weekend like that one, it is just the obvious design.
        </p>
        <Go links={[
          { href: '/', label: 'Run your numbers, nothing stored' },
          { href: '/blog/skills-over-titles', label: 'The thesis: skills over titles' },
          { href: '/jobs/browse', label: 'The board, every cut' },
        ]} />

        <Sources>
          <p>
            Timeline and leaked-content reporting: 404 Media (Joseph Cox, July 27, 2026), VentureBeat, Futurism, IBTimes UK, Hackread, The Decoder, and the syndicated BeInCrypto report, all July 26&ndash;27, 2026; the originating r/ClaudeAI post is dated July 25, 2026, 18:11 UTC. The robots.txt history (the /share/ block appearing August 1&ndash;2, 2025) is from Wayback Machine snapshots; the four-product posture table reflects direct header checks on live share pages, July 27, 2026. Precedents: Search Engine Land on Bard (Sept 26, 2023); Fast Company (July 30, 2025), TechCrunch, and OpenAI CISO Dane Stuckey&rsquo;s statement (Aug 1, 2025) on ChatGPT; 404 Media&rsquo;s ~100,000-conversation count (Aug 5, 2025); Forbes on Grok&rsquo;s 370,000+ (Aug 20, 2025) and on Claude&rsquo;s ~600 with Anthropic&rsquo;s statement (Sept 8, 2025). Archive figures: Digital Digging / Henk van Ess (Aug 1, 2025), 404 Media (Aug 7, 2025), Obsidian Security&rsquo;s 143k analysis. Behavior data: Harmonic Security&rsquo;s 2025 full-year prompt analysis (22.4M prompts); National Cybersecurity Alliance &ldquo;Oh, Behave!&rdquo; (Sept 30, 2025). Where outlets disagreed (&ldquo;hundreds&rdquo; vs &ldquo;thousands&rdquo; indexed in 2026) or Anthropic stayed silent, the text says so rather than picking a number.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'ai-jobs-three-ledgers',
    title: 'Sam Altman says AI created more jobs than it took. The data, checked.',
    pillar: 'Shape of Work',
    date: 'July 2026',
    dek: 'Sam Altman now says he was wrong about AI eliminating entry-level jobs. His neighbor at Anthropic predicted half of them would go. Anthropic’s own index charts where AI is actually used; payroll studies measure who is actually hurting. We keep a fourth ledger — live posting demand — and it says the reallocation is already visible: 4.9 percent of postings now demand AI-agent skills, across 43 occupations including lawyers and recruiters.',
    minutes: 7,
    takeaways: [
      "Sam Altman posted in July 2026 that he is “pretty sure AI has been net job-creating” — a reversal from his 2025 warnings.",
      "4.9% of all job postings now demand LLM or agent skills, across 43 of 177 occupations including lawyer, recruiter, and motion designer.",
      "Stanford found a 16% relative employment drop for workers aged 22–25 in the most AI-exposed jobs, while Yale finds no economy-wide disruption yet.",
    ],
    faq: [
      { q: 'Did Sam Altman say AI created more jobs than it destroyed?', a: 'Very nearly, and in his own words. On July 11, 2026 he posted on X: "so far at least, i\'m pretty sure AI has been net job-creating. this was not what i expected." Six weeks earlier, at a Commonwealth Bank event in Sydney (May 26, 2026), he said: "I\'m delighted to be wrong about this. I thought there would have been more impact on entry-level white-collar jobs being eliminated by now than has actually happened." Note the hedges doing real work: "so far at least," "pretty sure." He cited no dataset either time.' },
      { q: 'What does the Anthropic Economic Index actually show?', a: 'Where one AI assistant gets used, mapped to occupational tasks. In its first report (February 2025): 37.2 percent of Claude conversations mapped to computer and mathematical work, about 36 percent of jobs showed AI use on at least a quarter of their tasks, only about 4 percent on three-quarters or more, and the split ran 57 percent augmentation to 43 percent automation, with usage peaking in mid-to-high-wage technical work. Later editions report the mix tilting toward automation. It measures usage — which is not the same thing as job loss.' },
      { q: 'Is AI actually taking entry-level jobs?', a: 'The best payroll evidence says: narrowly, yes; economy-wide, not visibly yet. Stanford researchers using ADP payroll data found a 16 percent relative employment decline for workers aged 22–25 in the most AI-exposed occupations, concentrated where AI automates rather than augments — while experienced workers held steady, and Yale’s Budget Lab found no discernible economy-wide disruption in the first three years. Both can be true: a specific rung is burning while the aggregate stays quiet.' },
      { q: 'Which jobs is AI creating right now?', a: 'The ones you can count in postings. The PivotHop corpus currently holds roughly 2,350 live postings across nine AI-native occupations that barely existed three years ago — AI engineer (932), machine learning engineer (741), MLOps engineer (220), computer vision engineer (180), data annotator (134), prompt engineer (75), conversation designer (38), and smaller others. And demand for AI skills has spread far beyond them: 43 of our 177 occupations now carry LLM or agent tooling in their top-20 posted demand, including lawyer, recruiter, corporate trainer, and motion designer.' },
      { q: 'What should a job seeker do with all this?', a: 'Ignore the forecasts and read the demand. AI tooling is already a bridge skill — present in the posted demand of roughly a third of occupations — so learning it raises readiness across whole regions of the market at once. And the AI-era titles are measurably the most open doors: they are young enough to have no credential wall, so they hire on demonstrated skills. The instrument measures your specific overlap for free.' },
    ],
    body: (
      <>
        <p>
          On July 11, 2026, Sam Altman posted eighteen words that would have been unthinkable from him a year earlier: &ldquo;so far at least, i&rsquo;m pretty sure AI has been net job-creating. this was not what i expected.&rdquo; Six weeks before that, at a Commonwealth Bank event in Sydney, he had already said the quiet part: &ldquo;I&rsquo;m delighted to be wrong about this. I thought there would have been more impact on entry-level white-collar jobs being eliminated by now than has actually happened.&rdquo; No dataset attached, either time. The AI-and-jobs argument is mostly people trading forecasts; underneath it sit ledgers, and the ledgers measure different things.
        </p>
        <p>
          The whiplash deserves its timeline. February 2025: Altman writes that AI agents will &ldquo;eventually feel like virtual co-workers.&rdquo; May 2025: Anthropic&rsquo;s Dario Amodei tells Axios that AI could eliminate <strong>half of all entry-level white-collar jobs</strong> and push unemployment to 10&ndash;20 percent within one to five years, telling the industry to stop &ldquo;sugarcoating&rdquo; it. June 2025: asked on Hard Fork whether he agrees with that halving prediction, Altman answers, &ldquo;No, I don&rsquo;t.&rdquo; July 2025, on stage at a Federal Reserve conference: &ldquo;there are cases where entire classes of jobs will go away,&rdquo; immediately followed by &ldquo;there are entirely new classes of jobs that will come&rdquo; &mdash; customer support being the class he called effectively gone. June 2026, on CNBC: &ldquo;The companies that I know that have adopted AI the most are also the ones hiring the most,&rdquo; and blaming AI for layoffs is &ldquo;a convenient way&rdquo; to explain them. Then the July post. Same industry, same data access, forecasts pointing everywhere. So put the forecasts down and read the ledgers.
        </p>
        <Pull>Forecasts are free. Payrolls and postings pay rent.</Pull>
        <Go links={[
          { href: '/blog/skills-over-titles', label: 'The thesis: skills over titles' },
          { href: '/compare', label: 'Careers compared' },
          { href: '/', label: 'Run your own numbers' },
        ]} />

        <h2>Ledger one: where AI is used</h2>
        <p>
          The chart everyone shares is the <strong>Anthropic Economic Index</strong>, which maps Claude conversations onto occupational tasks. Its first report (February 2025) is precise about what it found: <strong>37.2 percent</strong> of usage mapped to computer and mathematical work, with arts and media at 10.3 percent and education at 9.3. About <strong>36 percent of jobs</strong> showed AI use on at least a quarter of their tasks; only about <strong>4 percent</strong> on three-quarters or more. The split ran 57 percent augmentation to 43 percent automation, and usage peaked in mid-to-high-wage technical work while barely touching both extremes of the pay scale. Later editions report the mix tilting toward automation.
        </p>
        <p>
          Read the axis label before drawing conclusions: this is a <strong>usage</strong> ledger, from one assistant&rsquo;s consumer traffic. Heavy usage in software work tells you where adoption is, not whose paycheck stopped. Anthropic says as much in its methodology notes. Usage is the leading indicator everyone quotes as if it were the lagging one.
        </p>

        <h2>Ledger two: who is measurably hurting</h2>
        <div className="post-callout"><b>&minus;16%</b><span>relative employment decline for workers aged 22&ndash;25 in the most AI-exposed occupations, in Stanford&rsquo;s analysis of ADP payroll data &mdash; concentrated where AI automates rather than augments. Experienced workers in the same fields: stable or growing.</span></div>
        <p>
          The displacement ledger is payroll data, and the sharpest entry is the Stanford &ldquo;canaries in the coal mine&rdquo; work on ADP records: the figure was 13 percent in the August 2025 draft and grew to 16 as data extended, with software developers aged 22&ndash;25 down nearly 20 percent from their late-2022 peak. The adjustment shows up as <strong>headcount, not wages</strong>, concentrated where AI automates rather than augments, and it is genuinely contested: Google economists argue the timing tracks interest rates, not AI; the authors published a rebuttal; that argument is what real findings look like. Meanwhile Yale&rsquo;s Budget Lab, looking economy-wide, keeps finding no discernible aggregate disruption (&ldquo;AI is probably not yet the reason for labor-market weakening,&rdquo; May 2026), and of the 1.21 million US job cuts announced in 2025, employers explicitly attributed about <strong>5 percent</strong> to AI (Challenger, Gray &amp; Christmas). Both readings are honest: a specific rung is burning while the aggregate stays quiet. Altman&rsquo;s &ldquo;delighted to be wrong&rdquo; and a 22-year-old&rsquo;s rescinded offer are both in the data.
        </p>

        <h2>Ledger three: what employers are asking for</h2>
        <p>
          This is the ledger we keep. PivotHop reads live job postings nightly and extracts the skills they demand, so the question &ldquo;is AI creating jobs?&rdquo; has a countable answer on the demand side: right now, <strong>4.9 percent of all postings in our corpus demand LLM (large language model) or agent-tooling skills by name</strong>, and those skills sit in the top-20 posted demand of <strong>43 of our 177 occupations</strong>, spanning seven fields. The list is the story: alongside the engineers, it includes <strong>lawyer, recruiter, corporate trainer, sales representative, and motion designer</strong>. The tooling crossed the technical border already; the postings prove it.
        </p>
        <div className="post-callout"><b>~2,350</b><span>live postings in the corpus belong to nine AI-native occupations that barely existed three years ago: <a className="gl" href="/jobs/ai-engineer">AI engineer</a> (932), <a className="gl" href="/jobs/machine-learning-engineer">machine learning engineer</a> (741), MLOps engineer (220), computer vision engineer (180), <a className="gl" href="/jobs/data-annotator">data annotator</a> (134), prompt engineer (75), <a className="gl" href="/jobs/conversation-designer">conversation designer</a> (38), and smaller others.</span></div>
        <p>
          Independent posting data now points the same direction: Indeed&rsquo;s Hiring Lab found the exposure gradient <strong>flipped</strong> between 2025 and 2026: the most AI-exposed occupations went from declining fastest to rebounding fastest, US software postings rose about 15 percent from early 2025 while overall postings fell, and 37 percent of the net new software postings carried AI in the title. Demand is not leaving the exposed occupations; it is being rewritten inside them.
        </p>
        <p>
          Two things about those created jobs are measurable and worth more than the headline fight. First, they are real volume but not yet mass employment: 2,350 postings is a visible new wing of the market, not a replacement for what the canaries lost. Honesty cuts both ways. Second, and better: <strong>the AI-era titles are the most skill-open doors we measure</strong>. Conversation designer and solutions architect are each reachable at 45 percent readiness from 8 different origins, prompt engineer from 6 &mdash; the widest openness scores in the matrix, because titles this young have no guild and no credential wall. The market&rsquo;s newest jobs are also its most meritocratic on skills, for now. That window is the actionable part.
        </p>
        <Pull>Usage is not displacement, and displacement is not demand.</Pull>

        <h2>Reconciling the ledgers</h2>
        <p>
          Hold all three up and the contradiction dissolves. Anthropic&rsquo;s index says adoption is deep in technical work and spreading. Payroll data says the burn is real but narrow: the youngest workers in the most automatable seats. Posting data says demand is reallocating &mdash; toward AI-skilled versions of existing jobs and a small, fast-growing set of new ones. Altman&rsquo;s &ldquo;net job-creating&rdquo; (a claim about the aggregate, so far, with his own hedges attached) and Amodei&rsquo;s warning (a claim about one rung&rsquo;s exposure) are rows in different ledgers, and both rows currently check out. What does not check out is the compressed headline version on either side.
        </p>
        <p>
          For one person deciding what to do on a Tuesday, the ledgers agree on the move: <strong>learn the bridge skill before the argument resolves</strong>. LLM and agent tooling already sits in the posted demand of roughly a third of occupations, which makes it the highest-leverage single investment our data can see, whatever the macro turns out to be. Where your own skills land against all of it is measurable in about a minute, free, on the <a className="gl" href="/">instrument</a>.
        </p>
        <Go links={[
          { href: '/', label: 'Measure your reach' },
          { href: '/jobs/browse', label: 'AI-era boards, every cut' },
          { href: '/blog/karp-two-safe-workers', label: 'The two AI-proof workers, checked' },
          { href: '/blog/claude-chats-google', label: 'Claude chats hit Google: the anatomy' },
        ]} />

        <Sources>
          <p>
            Altman: <a className="gl" href="https://x.com/sama/status/2076036901824532530">X post, July 11, 2026</a> (&ldquo;net job-creating&rdquo;); Commonwealth Bank event, Sydney, May 26, 2026, per <a className="gl" href="https://www.euronews.com/next/2026/05/26/no-ai-jobs-apocalypse-so-far-says-openais-sam-altman">Euronews</a> and <a className="gl" href="https://time.com/article/2026/05/26/sam-altman-ai-job-losses-openAI-/">Time</a>; <a className="gl" href="https://www.cnbc.com/2026/06/01/cnbc-exclusive-transcript-openai-ceo-sam-altman-speaks-with-cnbcs-david-faber-on-power-lunch-today.html">CNBC Power Lunch, June 1, 2026</a>; Hard Fork (June 2025) for the &ldquo;No, I don&rsquo;t&rdquo;; the Federal Reserve capital-framework conference, July 22, 2025 (C-SPAN recording; spoken renderings vary by outlet); &ldquo;virtual co-workers&rdquo; from <a className="gl" href="https://blog.samaltman.com/three-observations">Three Observations</a> (Feb 2025). Amodei: interview with Axios, <a className="gl" href="https://www.axios.com/2025/05/28/ai-jobs-white-collar-unemployment-anthropic">May 28, 2025</a>. Anthropic Economic Index: <a className="gl" href="https://www.anthropic.com/news/the-anthropic-economic-index">February 2025 report</a>; later editions at anthropic.com/economic-index. Stanford: Brynjolfsson, Chandar &amp; Chen, <a className="gl" href="https://digitaleconomy.stanford.edu/publications/canaries-in-the-coal-mine/">Canaries in the Coal Mine</a> (Aug 2025 draft: 13%; Nov 2025 revision: 16%; Feb 2026 rebuttal to the interest-rate critique). Yale Budget Lab: <a className="gl" href="https://budgetlab.yale.edu/research/evaluating-impact-ai-labor-market-current-state-affairs">Oct 2025</a> and the May 2026 update. Challenger, Gray &amp; Christmas <a className="gl" href="https://www.challengergray.com/blog/2025-year-end-challenger-report-highest-q4-layoffs-since-2008-lowest-ytd-hiring-since-2010/">2025 year-end report</a> (1,206,374 cuts; 54,836 AI-attributed). Indeed Hiring Lab: <a className="gl" href="https://www.hiringlab.org/2026/07/08/ai-and-job-postings-from-destruction-to-creation/">From Destruction to Creation?</a> (July 8, 2026). PivotHop figures computed from the July 2026 corpus (method in <a className="gl" href="/blog/skills-over-titles">Job titles, deprecated</a>); they regenerate with the nightly scrape.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'skills-over-titles',
    title: 'Job titles, deprecated: 42,254 title strings now map to no job at all',
    pillar: 'Unbundle the Job',
    date: 'July 2026',
    dek: 'The labor market is quietly switching units, from job titles to skill sets. Our corpus shows the seams: 42,254 title strings that map to nothing, a handful of skills that appear in a third of all occupations, and a measurable split between careers whose skills travel and careers that lock you in. Here is the thesis, with the rankings.',
    minutes: 7,
    takeaways: [
      "In one month, 42,254 distinct job-title strings mapped to no standard occupation, while 100,000+ postings collapsed onto just 177.",
      "55% of the 3,521 scored career pairs share under 20% of a skill set — skills are specific, not a universal solvent.",
      "The most skill-open careers are the AI-era titles; the widest exits are sales engineer and operations manager, each reaching 13 destinations.",
    ],
    faq: [
      { q: 'What is skills-based hiring?', a: 'Hiring that screens for the specific skills a role demands instead of proxy credentials like titles or degrees. In posting text it shows up as skill lists getting longer and more specific while titles fragment: our July 2026 corpus holds 119,356 postings that map cleanly onto 177 occupations, alongside 42,254 distinct title strings that map to nothing at all. Employers increasingly describe the work; the title is decoration.' },
      { q: 'Which careers have the most transferable skills?', a: 'Measured by routes out at 45 percent readiness or better: sales engineer and operations manager (13 routes each), data scientist (12), account executive and business analyst (9 each), psychologist (7), then data analyst and medical assistant (6 each). The pattern: careers built on a data core or on cross-functional coordination travel; careers built on one craft vocabulary or one credential do not.' },
      { q: 'Which jobs are easiest to switch into from another field?', a: 'By count of origins reaching them at 45 percent readiness or better: solutions architect and conversation designer (8 origins each), then database administrator, prompt engineer, executive assistant, and customer success manager (6 each). Notably, the newest AI-era titles are the most open, because they are young enough to have no credential wall. Nurse practitioner also scores 8, but a required license stands between the skills and the job.' },
      { q: 'Are job titles going away?', a: 'No, and this piece does not claim they are. Titles remain the interface: how roles are posted, searched, and paid. What is changing is the unit of value underneath. Postings specify skill bundles, employers state which adjacent backgrounds they welcome, and the same skill set is repriced under different titles. The title is the label; the skill set is the asset.' },
      { q: 'What are bridge skills?', a: 'Skills that appear in the posted demand of many different occupations, so learning one raises your readiness across whole regions of the market at once. In our corpus, data analysis leads (in the top-20 demand of 62 of 177 occupations), followed by supply chain, training, project management, and customer service. The 2026 entrants: LLM and agent tooling already sit in the top-20 demand of roughly a third of occupations.' },
    ],
    body: (
      <>
        <p>
          Every instrument we run rests on one thesis, so it should be stated plainly and then tested against the data: the labor market is switching units. For a century the unit was the title, a guild word that bundled skills, status, and pay into one string. The bundle is coming apart. Postings now describe work as skill lists; employers state outright which adjacent backgrounds they welcome; the same skill set gets repriced under three different names. The title is becoming what the filename is to the file: still useful, no longer the thing itself.
        </p>
        <div className="post-callout"><b>42,254</b><span>distinct job-title strings in this month&rsquo;s corpus map to no occupation at all, while 119,356 postings collapse onto just <strong>177</strong>. Titles fragment; the underlying skill demand clusters.</span></div>
        <p>
          That number is our own pipeline showing the seam. We read 182,773 raw postings in the July run (100,215 after cross-board dedup), and the single hardest engineering problem is not extracting skills, it is surviving the titles: the same job arrives as five spellings, and tens of thousands of title strings are pure invention. The skills underneath, by contrast, cluster hard enough to measure. That asymmetry, chaotic labels over stable skill demand, is the whole case in one dataset.
        </p>
        <Go links={[
          { href: '/blog/what-is-career-adjacency', label: 'The measurement method' },
          { href: '/compare', label: 'Careers compared, both directions' },
          { href: '/', label: 'Run your own skill set' },
        ]} />

        <h2>Skills are specific. That is the discipline.</h2>
        <p>
          The skills-based market is routinely oversold as &ldquo;your skills can take you anywhere.&rdquo; The data says nearly the opposite: across the 3,521 occupation-to-occupation pairs we score, <strong>55 percent sit under 20 percent readiness</strong>, and only 60 pairs anywhere in the matrix reach 60 percent. Skills are not a universal solvent; they are a specific inventory with a specific reach. That specificity is exactly why they carry value, and why measuring the reach beats asserting it.
        </p>
        <Pull>Skills are specific. That is why they are worth money.</Pull>

        <h2>The careers whose skills travel</h2>
        <p>
          Count each occupation&rsquo;s routes out at 45 percent readiness or better and the market sorts itself. The wide-exit careers share a shape: either a <strong>data core</strong> (analysis, SQL, statistics travel almost everywhere) or a <strong>coordination core</strong> (the operations-and-stakeholders bundle that every industry buys).
        </p>
        <table className="post-table">
          <caption>Routes out at &ge;45% readiness &middot; occupations with 100+ postings &middot; July 2026</caption>
          <thead><tr><th>Career</th><th>Routes out</th><th>The portable core</th></tr></thead>
          <tbody>
            <tr><td><a className="gl" href="/routes/sales-engineer">Sales engineer</a></td><td>13</td><td>Technical depth + commercial motion</td></tr>
            <tr><td><a className="gl" href="/routes/operations-manager">Operations manager</a></td><td>13</td><td>Coordination, process, P&amp;L adjacency</td></tr>
            <tr><td><a className="gl" href="/routes/data-scientist">Data scientist</a></td><td>12</td><td>The full data stack</td></tr>
            <tr><td><a className="gl" href="/routes/account-executive">Account executive</a></td><td>9</td><td>Pipeline, negotiation, CRM</td></tr>
            <tr><td><a className="gl" href="/routes/business-analyst">Business analyst</a></td><td>9</td><td>Requirements, analysis, process</td></tr>
            <tr><td><a className="gl" href="/routes/psychologist">Psychologist</a></td><td>7</td><td>Assessment, research, casework</td></tr>
            <tr><td><a className="gl" href="/routes/data-analyst">Data analyst</a></td><td>6</td><td>SQL, visualization, statistics</td></tr>
            <tr><td><a className="gl" href="/routes/medical-assistant">Medical assistant</a></td><td>6</td><td>Clinical floor skills, patient ops</td></tr>
          </tbody>
        </table>
        <p>
          At the other end, a set of large occupations show <strong>zero</strong> routes out at 45 percent in our matrix: copywriter, creative director, social media manager, executive assistant, recruiter, translator, paralegal, UX writer. Two honest readings, and both matter. First, craft careers run on deep, narrow vocabularies the wider market does not post for by name, so their exits really are harder at full readiness. Second, our instrument reads posted skill demand, and postings under-specify craft depth; a copywriter&rsquo;s judgment shows up in postings as a thin skill list. The lock is real, and it is also partly a measurement shadow. We say so rather than pretend the number is complete.
        </p>

        <h2>The careers most open to outsiders</h2>
        <p>
          Reverse the lens and count how many origins reach each destination at 45 percent or better. The most skill-open doors in the market right now, measured: <strong>solutions architect</strong> and <strong>conversation designer</strong> (8 origins each), then <strong>database administrator</strong>, <strong>prompt engineer</strong>, <a className="gl" href="/jobs/executive-assistant">executive assistant</a>, and <a className="gl" href="/jobs/customer-success-manager">customer success manager</a> (6 each). Notice what tops the list: the AI-era titles. They are young enough to have no guild, no credential wall, and no settled pedigree, so they hire on demonstrated skills because there is nothing else to hire on. New titles are the skills-based market in its purest form.
        </p>
        <p>
          Notice also the asymmetry hiding in the two lists: executive assistant and customer success manager are among the easiest doors <strong>in</strong> (6 origins each) and among the hardest doors <strong>out</strong> (zero routes at 45 percent). A career can be skill-friendly to enter and skill-locked to leave. If you are choosing a landing spot for a pivot, that difference is worth more than the title on the door.
        </p>
        <div className="post-callout"><b>8 origins</b><span>can reach <strong>nurse practitioner</strong> at &ge;45% skill readiness &mdash; and every one of them still faces the APRN license. Skills open the door; credentials own the lock. The two axes are not the same, and we display them separately on purpose.</span></div>

        <h2>The passports: skills that cross the most borders</h2>
        <p>
          If the market&rsquo;s unit is the skill, the highest-leverage question becomes: which skills appear in the most occupations&rsquo; demand? From the top-20 posted-demand profiles of all 177 occupations:
        </p>
        <table className="post-table">
          <caption>Occupations (of 177) whose top-20 posted demand includes the skill &middot; July 2026</caption>
          <thead><tr><th>Skill</th><th>Occupations</th></tr></thead>
          <tbody>
            <tr><td>Data analysis</td><td>62</td></tr>
            <tr><td>Supply chain</td><td>47</td></tr>
            <tr><td>Training &amp; facilitation</td><td>46</td></tr>
            <tr><td>Project management</td><td>44</td></tr>
            <tr><td>Customer service</td><td>42</td></tr>
            <tr><td>Lean / Six Sigma</td><td>41</td></tr>
            <tr><td>LangChain / agents</td><td>33</td></tr>
            <tr><td>LLMs / generative AI</td><td>31</td></tr>
            <tr><td>Python</td><td>29</td></tr>
            <tr><td>SQL</td><td>26</td></tr>
          </tbody>
        </table>
        <p>
          Two things stand out. Data analysis is the market&rsquo;s reserve currency, demanded in a third of everything. And the 2026 story is already in the table: <strong>agent and LLM tooling sits in the top-20 demand of roughly a third of occupations</strong>, two years after those phrases barely existed in postings. A bridge skill is leverage precisely because one investment moves your readiness across dozens of destinations at once; the instrument prices that for your specific starting point.
        </p>
        <Pull>The title is the label. The skill set is the asset.</Pull>

        <h2>What to do with the thesis</h2>
        <p>
          Three moves follow from the data, none of them motivational. <strong>Choose destinations by measured overlap, not title glamour</strong>: a 60 percent route you can close in months beats a 15 percent route with a better-sounding name. <strong>Learn bridge skills before niche skills</strong> when you are undecided; data analysis and the LLM toolchain buy readiness across whole regions of the market. And <strong>respect the second axis</strong>: where a license stands, no skill overlap shortens it, which is why every gated route on this site says so in plain text.
        </p>
        <Go links={[
          { href: '/', label: 'Measure your own reach' },
          { href: '/routes', label: 'Every measured route' },
          { href: '/blog/ai-jobs-three-ledgers', label: 'AI and jobs: the three ledgers' },
          { href: '/jobs/browse', label: 'The board, every cut' },
        ]} />

        <Sources>
          <p>
            All figures are computed from the PivotHop July 2026 corpus: 182,773 raw postings, 100,215 after cross-board dedup, mapped onto 177 occupations; 42,254 distinct unmapped title strings from the same run&rsquo;s pipeline counters. Route counts use the full adjacency matrix (3,521 scored directed pairs; pairs sharing too few skills are unscored); &ldquo;routes out/in&rdquo; count pairs at &ge;45% readiness; bridge-skill counts are occupations whose top-20 posted-demand profile (&ge;3 postings and &ge;2% share) includes the skill. Readiness methodology, including its limits, is in <a className="gl" href="/blog/what-is-career-adjacency">What is career adjacency</a>; the craft-vocabulary measurement caveat above is a real limit of posted-demand data and we state it rather than smooth it.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'confused-career-pairs',
    title: 'Product manager vs project manager: 24% the same job. Eight confused pairs, measured.',
    pillar: 'Unbundle the Job',
    date: 'July 2026',
    dek: 'Product manager and project manager share 24 percent of a skill set. Graphic designers and UX designers share 13 percent and a doubled salary band. We measured the eight most-confused title pairs from each occupation’s own live postings: the overlap, the pay gap, and which direction the switch actually runs.',
    minutes: 6,
    takeaways: [
      "A typical project manager’s skills cover only 24% of what product-manager postings demand — and the reverse shares too few skills to score.",
      "Graphic and UX designers share 13% and 12% of a skill set, against posted bands of $42k–$73k versus $74k–$151k.",
      "Product designer to UX reads 91% ready; the reverse only 40% — one title contains the other.",
    ],
    faq: [
      { q: 'Is a product manager the same as a project manager?', a: 'No, and the data is blunt about it: a typical project manager’s skills cover only 24 percent of what product-manager postings demand, and the reverse direction shares too few skills to score at all. The pay reflects it: posted mid-bands run $86k–$170k for product managers against $75k–$130k for project managers. Same first word, different jobs.' },
      { q: 'Is UX design the same as graphic design?', a: 'They are the most expensively confused pair we measure. Graphic-designer skills cover 13 percent of UX-designer posting demand, and the reverse is 12 percent — near-strangers professionally — while the posted bands run $42k–$73k for graphic design against $74k–$151k for UX. The shared core is essentially Figma and motion design; the actual work diverges from there.' },
      { q: 'Can a data analyst become a data scientist?', a: 'This pair runs one way. A data scientist’s skills cover 65 percent of data-analyst demand, but an analyst covers only 31 percent of data-science demand — the gap is machine learning, generative AI, deep learning, and NLP. The shared core (SQL, Python, statistics, visualization) is real, which is why the analyst-to-scientist route is popular; the missing third is why it takes 9–16 months, not a title change.' },
      { q: 'What is the difference between a lawyer and a paralegal?', a: 'A license, mostly — and the market prices it. A lawyer’s skills cover 74 percent of paralegal posting demand, but a paralegal covers only 24 percent of lawyer demand, and the gate between them is a law degree and the bar, not a skill gap. Posted bands: $94k–$189k for lawyers, $40k–$74k for paralegals.' },
      { q: 'How is career overlap measured?', a: 'From live postings. For each occupation we extract the skills its postings demand; the overlap number is the share of one occupation’s posted skill demand that a typical profile from the other already covers. It is directional — A covering B does not mean B covers A — which is exactly what the confused pairs show. Full method on the comparison pages and in the career-adjacency piece.' },
    ],
    body: (
      <>
        <p>
          A job title is a marketing decision, and the market makes the same handful of confusions every day: product and project manager treated as one job, UX hired as if it were graphic design with better tools, data analyst and data scientist used interchangeably in the same paragraph. We measure skill overlap between occupations from live postings, in both directions, so these arguments can end with a number. We ran the eight most-confused pairs. Half of them share a family name and almost nothing else.
        </p>
        <Go links={[
          { href: '/compare', label: 'All 554 comparisons' },
          { href: '/blog/what-is-career-adjacency', label: 'How overlap is measured' },
          { href: '/', label: 'Run your own numbers' },
        ]} />

        <h2>Product manager vs project manager</h2>
        <div className="post-callout"><b>24%</b><span>of what product-manager postings demand, a typical project manager already covers. The reverse direction shares too few skills to score at all.</span></div>
        <p>
          The most-argued pair in tech, settled: mostly different jobs. The project manager&rsquo;s missing quarter is telling: today&rsquo;s product-manager postings ask for prototyping, REST APIs, and generative-AI tooling, none of which appear in project-management demand. The pay agrees: posted mid-bands run <strong>$86k&ndash;$170k</strong> for product against <strong>$75k&ndash;$130k</strong> for project. The <a className="gl" href="/compare/product-manager-vs-project-manager">full comparison</a> has both sides; the boards have <a className="gl" href="/jobs/product-manager">product</a> and <a className="gl" href="/jobs/project-manager">project</a> roles live.
        </p>

        <h2>Graphic designer vs UX designer</h2>
        <div className="post-callout"><b>13% / 12%</b><span>mutual overlap &mdash; near-strangers professionally &mdash; while the posted bands run $42k&ndash;$73k against $74k&ndash;$151k.</span></div>
        <p>
          The most expensive confusion on the list. The shared core is essentially <strong>Figma</strong> and motion design; from there the jobs diverge into branding and production on one side, interaction design, prototyping, and user research on the other. Treating UX as &ldquo;graphic design, newer&rdquo; is how a doubled salary band gets left on the table. <CompareLink slug="graphic-designer-vs-ux-designer">The measured pair</CompareLink> shows the exact gap lists.
        </p>

        <Pull>Half of these pairs share a family name and almost nothing else.</Pull>

        <h2>Data analyst vs data scientist</h2>
        <div className="post-callout"><b>65% &darr; / 31% &uarr;</b><span>a scientist mostly covers an analyst&rsquo;s demand; an analyst covers a third of a scientist&rsquo;s. The ladder runs one way.</span></div>
        <p>
          The closest pair here, and still directional. The shared core is real &mdash; SQL, Python, statistics, visualization, ETL &mdash; which is why this is one of the most-walked routes on the instrument. The missing two-thirds is machine learning, generative AI, deep learning, and NLP, and it prices in: <strong>$56k&ndash;$95k</strong> posted for analysts against <strong>$84k&ndash;$163k</strong> for scientists. Estimated transition, 9&ndash;16 months of deliberate work, not a resume rewrite. <a className="gl" href="/compare/data-analyst-vs-data-scientist">Compare them</a>, or start from the <a className="gl" href="/routes/data-analyst">full data-analyst route map</a>.
        </p>

        <h2>Product designer vs UX designer</h2>
        <div className="post-callout"><b>91% / 40%</b><span>a product designer nearly IS a UX designer; the reverse is a real move.</span></div>
        <p>
          The asymmetry pair. Product-designer skills cover 91 percent of UX posting demand: the transition estimate reads 3&ndash;8 months, effectively a retitle. Going the other way, a UX designer covers 40 percent of product-design demand, and the gap is the breadth: writing, systems, the commercial edges of the role. Two titles, one of which contains the other. <a className="gl" href="/compare/product-designer-vs-ux-designer">The pair, measured</a>.
        </p>

        <h2>Backend vs frontend developer</h2>
        <div className="post-callout"><b>21% / 13%</b><span>&ldquo;full-stack&rdquo; is a hiring word for two jobs that share REST, Java, AWS, CI/CD &mdash; and little else.</span></div>
        <p>
          The shared core is the plumbing every developer touches. The divergence is everything that fills a working week: JavaScript, TypeScript, and the browser on one side; microservices, Python, SQL, and Kubernetes on the other. Posted bands: <strong>$87k&ndash;$146k</strong> backend, <strong>$57k&ndash;$127k</strong> frontend. <a className="gl" href="/compare/backend-developer-vs-frontend-developer">Side by side</a>.
        </p>

        <h2>Registered nurse vs nurse practitioner</h2>
        <div className="post-callout"><b>94% + a license</b><span>an RN&rsquo;s skills nearly cover NP posting demand &mdash; and none of that shortens the graduate degree and state licensure between the titles.</span></div>
        <p>
          The pair that shows why we display credential gates separately from skill readiness. On skills alone an RN reads 94 percent ready for nurse-practitioner work; the honest transition line still says &ldquo;+ license,&rdquo; because an APRN license and the degree behind it stand regardless. The reward for the years: posted NP bands reach <strong>$135k</strong> against an RN&rsquo;s <strong>$59k&ndash;$109k</strong>. <a className="gl" href="/compare/nurse-practitioner-vs-registered-nurse">The comparison</a> carries both gates.
        </p>

        <h2>Lawyer vs paralegal</h2>
        <div className="post-callout"><b>74% / 24%</b><span>a lawyer mostly covers paralegal demand; a paralegal covers a quarter of lawyer demand &mdash; and the bar exam is the wall between the bands.</span></div>
        <p>
          Shared vocabulary (contracts, case management, procurement) and a licensing wall. The posted bands tell the rest: <strong>$94k&ndash;$189k</strong> against <strong>$40k&ndash;$74k</strong>. This is the cleanest example of a pair where the skill number is not the story; the credential is. <a className="gl" href="/compare/lawyer-vs-paralegal">Measured here</a>.
        </p>

        <h2>Architect vs interior designer</h2>
        <div className="post-callout"><b>58% / 58%</b><span>the rare symmetric pair: each covers the same share of the other&rsquo;s demand.</span></div>
        <p>
          The house classic, and the only pair on this list that is genuinely mutual. Shared: Revit, project management, construction documentation, presentation. Each side&rsquo;s gap is the other&rsquo;s trade: space planning, procurement, and <a className="gl" href="/glossary#ffe">FF&amp;E</a> (furniture, fixtures, and equipment) going one way; BIM and building codes coming back, plus the architecture license. <a className="gl" href="/compare/architect-vs-interior-designer">The pair</a>, and the <a className="gl" href="/routes/architect-to-interior-designer">full route with the judgment call</a>.
        </p>

        <Pull>The overlap number is directional. Which way you travel matters.</Pull>

        <p>
          The pattern across all eight: titles cluster into families, and families hide asymmetries. One title contains the other (product designer and UX), one is gated by a credential the other lacks (NP and RN, lawyer and paralegal), or the two simply share a word and a floor plan (product and project). A comparison settles which case you are in, and then the question becomes personal: not whether a typical profile covers the gap, but whether yours does.
        </p>
        <Go links={[
          { href: '/compare', label: 'Browse every comparison' },
          { href: '/blog/skills-over-titles', label: 'The thesis: skills over titles' },
          { href: '/', label: 'Measure your own overlap' },
        ]} />

        <Sources>
          <p>
            All figures are read from the PivotHop posting corpus (July 2026 run; each occupation&rsquo;s own live postings; salary bands are posted 25th&ndash;75th percentiles, stated salaries only). Overlap is directional coverage: the share of one occupation&rsquo;s posted skill demand that a typical profile from the other already covers; pairs sharing too few skills are left unscored rather than guessed. The full method, including the three signals behind readiness, is in <a className="gl" href="/blog/what-is-career-adjacency">What is career adjacency</a>. Every pair here links its live comparison page, which recomputes with the nightly scrape.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'why-recruiters-ghost',
    title: 'Why recruiters ghost you, and why more applications is the wrong answer',
    pillar: 'Run It 10,000 Times',
    date: 'July 2026',
    dek: 'Sixty-one percent of job seekers get ghosted after an interview, and the silence is mostly structural: jobs that were never real, roles filled before you applied, software that rejects you before a person reads a word. Here is why it happens, why sending more applications makes it worse, and the numbers behind each claim.',
    minutes: 10,
    faq: [
      { q: 'Why do recruiters ghost candidates?', a: 'Mostly for structural reasons that have little to do with the individual candidate. The role may be a ghost job that was never meant to be filled; it may have been frozen or filled internally while the listing stayed up; an applicant tracking system may have rejected the application before any person read it; and a recruiter handling hundreds of applicants per opening has neither the time nor any incentive to reply to the ones they pass on. In one Harvard Business School and Accenture study, 88 percent of employers agreed that qualified candidates are screened out by their own automated systems, and in a separate 2024 survey about 40 percent of companies admitted to posting a job they were not trying to fill.' },
      { q: 'What is a ghost job?', a: 'A job posting a company is not actively trying to fill. It may be up to collect resumes for later, to look like the company is growing, to keep a presence on job boards, or because the role was frozen and no one took the listing down. In a 2024 survey, about 40 percent of hiring managers said their company had posted one in the past year, and on one large hiring platform between 18 and 22 percent of postings in a given quarter were classified as ghost jobs. A listing that has been open for months and states no salary is a common tell.' },
      { q: 'Does getting ghosted mean I was rejected?', a: 'Not necessarily, and treating it as a definite rejection is usually a mistake. Silence can mean the role was filled, frozen, or never real; it can mean an automated filter dropped the application before a person saw it; or it can mean a busy recruiter simply never replied. It can also mean your skills were not a close fit for the role, which is the one cause you can act on. What silence almost never is, is a considered verdict on your worth as a professional.' },
      { q: 'How many job applications should I expect to send?', a: 'Fewer than the spray-and-pray advice implies, if you aim them well. The reflex when ghosting piles up is to increase volume, but volume without fit multiplies the silence rather than the offers, and mass applications feed the same overloaded pipelines that produce ghosting in the first place. A smaller number of applications to roles where your existing skills already cover most of what the posting demands will outperform a large number sprayed across roles you do not fit, on both response rate and morale.' },
      { q: 'Should I follow up after being ghosted?', a: 'Once. A single follow-up a week or so after applying or interviewing is reasonable and occasionally works. A second and third rarely change the outcome and mostly cost you energy, because the silence is usually structural rather than personal. After one follow-up, the better use of your time is the next role that fits, not waiting on the one that went quiet.' },
    ],
    body: (
      <>
        <p>
          Sixty-one percent of job seekers have been ghosted after a job interview, and almost one in ten have been ghosted after receiving a written offer. Both figures are from Greenhouse&rsquo;s 2024 State of Job Hunting report, and the first has risen nine points in eight months. You already know the shape of it, because it has happened to you: you send the application, or you sit through four rounds, and then nothing. No rejection, no feedback, no reply to the follow-up. Just silence.
        </p>
        <p>
          The silence reads as a verdict. It is almost never a verdict. Ghosting is a structural feature of how hiring works now, not a message about your worth, and the difference between those two readings is the difference between a bad week and a bad year. This piece is the structure, with a source on every number, and the one change that actually moves your odds. That change is not sending more applications. Sending more applications is the reflex, and it is close to the worst thing you can do.
        </p>
        <div className="post-callout"><b>61%</b><span>of job seekers have been ghosted after an interview, up nine points in eight months. Almost <strong>one in ten</strong> were ghosted after a written offer (Greenhouse, 2024).</span></div>

        <h2>The silence is near-universal</h2>
        <p>
          Start with the scale, because it is the first thing that makes the experience survivable. Being ghosted is not a rare misfortune that finds only weak candidates. It is the median experience of applying for work in 2026, and it is getting more common, not less.
        </p>
        <p>
          The toll is measured too. In a 2024 survey of a thousand US job seekers, 72 percent said the search had harmed their mental health, and 44 percent named being ghosted as one of their worst frustrations. So the silence is not a minor annoyance filed under the cost of doing business. It is the part of the process people single out as most corrosive, which is exactly why it deserves a clear-eyed explanation rather than a motivational one.
        </p>

        <h2>Most of the silence is not about you</h2>
        <p>
          Four mechanisms produce the bulk of it. None is a judgment on the applicant, and three of them are invisible from the outside, which is why the silence feels so personal when it is anything but.
        </p>
        <p>
          <strong>The job may not be real.</strong> In a 2024 survey of hiring managers, 40 percent said their company had posted a job it was not actually trying to fill in the past year, and roughly three in ten had one live at that moment. On one large hiring platform, between 18 and 22 percent of all postings in any given quarter are classed as ghost jobs, and an independent academic analysis of fifteen years of listings put the ceiling near 21 percent. The reasons managers give are less sinister than indifferent: to look like the company is growing, to keep a presence on the job boards, to collect resumes for later. Seventy percent of them called the practice morally acceptable. When you apply into that, there is no one on the other end to answer you, because there was never a role.
        </p>
        <div className="post-callout"><b>40%</b><span>of companies posted a job they were not trying to fill in the past year, and 70 percent of hiring managers called the practice morally acceptable (ResumeBuilder, 2024).</span></div>
        <p>
          <strong>The role was filled or frozen before you.</strong> Requisitions get cancelled, budgets freeze mid-process, an internal candidate wins a race you did not know you had entered. The listing stays up because taking it down is nobody&rsquo;s job. Across the whole US labor market, close to a third of job openings never result in a hire, by one analysis of federal openings-and-hires data. A posting outliving the role it described is not a conspiracy. It is entropy.
        </p>
        <p>
          <strong>A machine rejected you before a person read a word.</strong> Most applications now pass through an <a className="gl" href="/glossary#ats">ATS</a> (applicant tracking system) before any human sees them, and the filter is blunter than its buyers admit. In a joint Harvard Business School and Accenture study, 88 percent of employers agreed that qualified, high-skilled candidates are screened out of hiring by their own automated systems; for middle-skilled roles the figure was 94 percent. The study put 27 million people in the US alone in that gap, capable and filtered. When the software rejects you, there is often no human who ever saw your name, and so no human to send the note you are waiting for.
        </p>
        <p>
          <strong>No one is paid to close the loop.</strong> A recruiter working two hundred applicants against one opening has no time and no incentive to write back to the ones they pass on, and often a legal-caution convention that advises against giving reasons at all. Silence carries no penalty. Your follow-up lands in an inbox that no metric rewards anyone for reading. This is not malice. It is the absence of a reason to reply, which produces the same result as malice and is far more common.
        </p>

        <h2>The part that is about you</h2>
        <p>
          Here is the part the ghosting conversation tends to skip, because it is less comforting than the four mechanisms above. Some of the silence is a signal, and the signal is fit.
        </p>
        <p>
          Most applications go to roles the applicant is not close to. We can put a number on how far apart jobs usually are, because measuring that is the entire point of this instrument: across the routes we score from one occupation to another, 63 percent sit under 20 percent skill readiness. Most pairs of jobs share almost none of the skills their postings actually demand. The full method is in a <a className="gl" href="/blog/what-is-career-adjacency">separate piece on career adjacency</a>, but the headline is that real skill overlap between two fields is rare, and applying as though it were common is how you become the weakest resume in the stack.
        </p>
        <div className="post-callout"><b>63%</b><span>of the career routes we score sit under 20 percent skill readiness. Most pairs of jobs share almost none of the skills their postings demand (PivotHop, July 2026).</span></div>
        <p>
          When you apply into that 63 percent, into roles your skills do not cover, the silence is not a mystery. It is the system working as designed. And this, unlike the ghost jobs and the frozen requisitions and the filtering software, is the one part of the machine you control. Not whether they answer. Which roles you ask.
        </p>

        <h2>Why more applications is the wrong answer</h2>
        <p>
          The reflex, when the silence piles up, is volume. Apply to more. Thirty-eight percent of job seekers are now mass-applying, and the logic is easy to follow: if two hundred applications produced four replies, surely four hundred produce eight. The arithmetic does not hold, for two reasons.
        </p>
        <p>
          The first is that volume without fit multiplies the silence, not the offers. If most of your applications land in the 63 percent where your skills do not reach, doubling their number doubles the ghosting and leaves the offer count near zero, because the constraint was never how many you sent. It was how many you fit.
        </p>
        <p>
          The second is that mass-applying feeds the machine that ghosts you. Every sprayed application is one more resume in a stack of two hundred, one more reason a recruiter cannot write back, one more input training the filter to reject faster. The behavior that feels like fighting the silence is manufacturing it, at scale, for everyone including yourself.
        </p>
        <p>
          The cure for two hundred ghosted applications is not two hundred more. It is twenty applications to roles where your existing skills already clear the bar. Four applications that matter beat four hundred that do not, and the four are the ones that write back.
        </p>

        <h2>How to be ghosted less</h2>
        <p>
          You cannot make an employer close the loop. You can stop volunteering for the silence. Six moves, in rough order of leverage.
        </p>
        <p>
          <strong>Measure fit before you apply.</strong> The highest-leverage change is to apply only where your current skills cover most of what the posting demands. That is what the <a className="gl" href="/">instrument at the top of this site</a> is for: enter your role and it returns the occupations your existing skills already reach, ranked, with the gap and the salary attached. Applying to a role you are 70 percent ready for and applying to one you are 15 percent ready for feel identical when you hit submit. They are not the same bet, and only one of them writes back.
        </p>
        <p>
          <strong>Read the posting for ghost-job tells.</strong> A listing that has been open for months, names no salary, and reads in vague boilerplate is often not a live role. On the <a className="gl" href="/jobs">PivotHop board</a> right now, 15 percent of postings have been open more than sixty days, and half state no salary at all. Those are not automatically ghost jobs, but a posting that has sat open for a quarter and will not tell you what it pays has told you enough. Spend your applications on the ones that are specific, recent, and priced.
        </p>
        <p>
          <strong>Apply to fewer, adjacent roles.</strong> Twenty applications to roles where you are 60 percent ready or better will outperform two hundred sprayed across everything, on response rate and on your own morale both. Adjacent is the operative word: the roles one skill-step from where you are, not the aspirational leap across the 63 percent gap.
        </p>
        <p>
          <strong>Go around the front door.</strong> The public portal and the recruiter are the single most ghost-prone path into a company, because that is where the volume and the filtering software live. A direct message to the hiring manager, a warm introduction from someone inside, an application that arrives with a name attached: all of them skip the part of the pipeline that produces most of the silence.
        </p>
        <p>
          <strong>Follow up once, then let it go.</strong> One follow-up a week after you apply or interview is worth sending. A second and a third are not; they land in the same unread inbox and cost you energy you need elsewhere. After the first, treat the silence as weather. It is not a verdict on you, and waiting on it is time not spent on the next role that fits.
        </p>
        <p>
          <strong>Track it as a portfolio of bets, not a referendum.</strong> Ten applications to well-fit roles is a portfolio, and a portfolio is read in aggregate, not one heartbreak at a time. Expect most to go quiet. Price that in from the start and a ghosted application becomes a closed position, not a personal rejection. Measuring fit first is what makes this framing honest: when the bets are good, you do not need many of them to land.
        </p>

        <p>
          Being ghosted is not evidence that you are unemployable. It is evidence that hiring is a black box with the loop left open on purpose, and that most applications are aimed at roles that were never a fit or never real. You cannot fix the box. You can aim better. Before the next batch, run your current role through the <a className="gl" href="/">instrument</a>, read which occupations your skills already reach, and send your applications there. Four that fit beat four hundred that do not.
        </p>

        <Go links={[
          { href: '/blog/confused-career-pairs', label: 'Eight confused career pairs, measured' },
          { href: '/blog/claude-chats-google', label: 'Your AI chats and Google: check yourself' },
          { href: '/jobs/browse', label: 'The board, every preloaded cut' },
        ]} />
        <Sources>
          <p>
            Ghosting rates and mass-applying share: Greenhouse, 2024 State of Job Hunting (2,500 workers in the US, UK, and Germany), <a className="gl" href="https://www.greenhouse.com/blog/greenhouse-2024-state-of-job-hunting-report">greenhouse.com</a>. Job-search mental-health toll: Resume Genius, 2024 (1,000 US job seekers), reported by Forbes. Ghost jobs: ResumeBuilder.com, May 2024 (1,641 hiring managers); Greenhouse platform data, 2024 (18&ndash;22 percent of postings per quarter); Hunter Ng, &ldquo;Why is it so hard to find a job now? Enter Ghost Jobs,&rdquo; arXiv:2410.21771, 2024 (up to 21 percent). Openings that never hire: MyPerfectResume analysis of <a className="gl" href="/glossary#bls">BLS</a> (Bureau of Labor Statistics) Job Openings and Labor Turnover data, 2025, which is the analyst&rsquo;s reading of the openings-versus-hires gap and not a federal label. Automated screening: Joseph Fuller and Manjari Raman (Harvard Business School) with Accenture, &ldquo;Hidden Workers: Untapped Talent,&rdquo; 2021 (8,000+ workers, 2,250+ executives). Readiness scores are computed from the PivotHop posting corpus; the method is in <a className="gl" href="/blog/what-is-career-adjacency">What is career adjacency</a>. Board figures, the share of postings open more than sixty days and the share stating no salary, are measured from the live <a className="gl" href="/jobs">PivotHop board</a> as of July 2026 and move with the nightly scrape.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'what-is-career-adjacency',
    title: 'What is career adjacency? The full method, the acronyms, and the numbers',
    pillar: 'What Carried Over',
    date: 'July 2026',
    dek: 'Career adjacency is the distance between two occupations measured in shared skills, not job titles. Here is exactly how we compute it from 151,369 live postings, what the three signals are, what every acronym means, and why 63 percent of the routes we score are dead ends.',
    minutes: 12,
    faq: [
      { q: 'What is career adjacency?', a: 'Career adjacency is the measurable distance between two occupations, set by the skills they share rather than the titles they carry. Two jobs are adjacent when the skills one of them demands already cover most of what the other demands. PivotHop computes it as a readiness score, the percentage of a destination role’s most common skills that an origin role already requires, read from live job postings.' },
      { q: 'How is career adjacency measured?', a: 'From live job postings. For every occupation we extract the skills its postings actually demand, then for each origin-to-destination pair we compute coverage: the share of the destination’s top 20 skills the origin already has. That coverage, rounded to a percentage, is the readiness score. Pairs are ranked by coverage and broken by weighted Jaccard overlap, and any pair sharing fewer than three skills is left unscored.' },
      { q: 'What is a good readiness score for a career change?', a: 'In our July 2026 data, most occupation pairs are far apart: 63 percent score under 20 percent readiness. A route above 50 percent is genuinely close, and only 93 of 7,946 measured routes reach 60 percent or higher. Above 60 percent the skill gap is a matter of months, not years, though a license can still stand in the way regardless of the score.' },
      { q: 'Does a high readiness score mean I will get hired?', a: 'No. Readiness measures skill overlap, not eligibility or luck. A licensed destination like nurse practitioner or dental hygienist can score high on skills and still require a credential that takes years, which is why we flag the license separately. Readiness tells you how far the skills are, not whether a gate stands between you and the role.' },
      { q: 'How is this different from O*NET related occupations?', a: 'O*NET (the US Department of Labor’s Occupational Information Network) publishes curated relatedness: expert judgment about which jobs are similar. It misses non-obvious moves, like architect to UX designer, that never show up in a taxonomy but happen constantly in the market. We measure adjacency from live demand and corroborate it with where people actually moved, so the non-obvious routes surface on their own.' },
    ],
    body: (
      <>
        <p>
          Career adjacency is the measurable distance between two occupations, set by the skills they share rather than the titles they carry. Two jobs are adjacent when the skills one of them demands already cover most of what the other demands. It is not a metaphor and it is not a personality quiz. It is a number, it is read from live job postings, and this piece is the whole method: the formula, the three signals behind it, every acronym spelled out, and what the numbers actually say.
        </p>
        <h2>Why titles are the wrong unit</h2>
        <p>
          A job title is a marketing decision. The same work is a &ldquo;product designer&rdquo; at one company and a &ldquo;UX designer&rdquo; at the next, a &ldquo;financial analyst&rdquo; here and a &ldquo;finance business partner&rdquo; there. Titles also hide the opposite case: two roles that sound identical and share almost no daily work. Search by title and you inherit every one of those distortions.
        </p>
        <p>
          Skills do not have that problem. A posting for a role lists what the role requires, and those requirements are comparable across titles, companies, and countries. So we throw the titles away as a matching key and keep them only as labels. Adjacency is computed on the skill vectors underneath.
        </p>
        <div className="post-callout"><b>151,369</b><span>live postings across <strong>180 occupations</strong> in the July 2026 run. Every readiness number below is read from that corpus, not from a survey and not from expert opinion.</span></div>
        <h2>Signal one: skills coverage, the readiness score</h2>
        <p>
          The core number is coverage. For every occupation we take the skills its postings most often demand and keep the top 20. Then, for a given origin and destination, we ask a single question: what share of the destination&rsquo;s top 20 skills does the origin already require? That share, times 100 and rounded, is the readiness score.
        </p>
        <div className="post-callout"><b>match = round(100 &times; coverage)</b><span>coverage is the fraction of the destination&rsquo;s top-20 posting skills the origin already demands. Ranked by coverage, then broken by weighted <a className="gl" href="/glossary#jaccard">Jaccard</a> overlap. Pairs sharing fewer than three skills are left unscored.</span></div>
        <p>
          A worked example. A software engineer moving to backend developer scores <strong>73 percent</strong>: of the fifteen skills that define a backend developer in the postings, a software engineer already brings all fifteen, and the two roles overlap enough that the move is a lateral step, not a leap. The <a className="gl" href="/glossary#jaccard">Jaccard</a> figure, 0.54, is the tiebreaker: shared skills divided by all distinct skills across both roles, so it rewards pairs that are close in both directions, not just one.
        </p>
        <p>
          The three-skill floor matters. Two occupations that share only a word like &ldquo;communication&rdquo; are not adjacent, they are unrelated, and scoring them would manufacture a route that does not exist. Below three shared skills we return nothing rather than a small, false number.
        </p>
        <h2>Signal two: who employers say they welcome</h2>
        <p>
          Coverage is forward-looking demand, but it cannot see intent. So we read the postings a second way, for the sentences where a destination explicitly welcomes an origin background: &ldquo;architecture or industrial-design background a plus,&rdquo; &ldquo;former teachers encouraged to apply.&rdquo; This is employer-attested adjacency, and it catches the non-obvious human moves that a skills model alone would rank too low.
        </p>
        <div className="post-callout"><b>28,553</b><span>postings scanned for a welcomed background; <strong>1,749</strong> of them name an adjacent origin outright. These are the routes employers are telling you they will take, in their own words.</span></div>
        <h2>Signal three: where people actually went</h2>
        <p>
          Demand is what employers want next. It is not the same as what workers actually did. The third signal is observed mobility: real occupation-to-occupation transitions, from government and resume data. We use three sources, chained by strength.
        </p>
        <table className="post-table">
          <caption>The observed-flow layer &middot; all Creative-Commons-licensed, so a product that charges can legally use them</caption>
          <thead><tr><th>Source</th><th>What it is</th><th>Signal</th></tr></thead>
          <tbody>
            <tr><td>US mobility network</td><td>Occupational transitions derived from the <a className="gl" href="/glossary#cps">CPS</a>, 2010&ndash;2017</td><td>Real worker flows</td></tr>
            <tr><td>EU resume trajectories</td><td>JobHop career paths, finer on design and creative roles</td><td>Real worker flows</td></tr>
            <tr><td><a className="gl" href="/glossary#onet">O*NET</a> related occupations</td><td>Curated expert relatedness, US Dept of Labor</td><td>Baseline, last resort</td></tr>
          </tbody>
        </table>
        <p>
          The rule for this layer is fixed: <strong>corroboration, never ranking.</strong> Postings measure where demand is going; flow measures where people already went; when the two disagree, that disagreement is the interesting part, not an error to average away. A route the skills model loves but nobody has ever walked is a different animal from one that is both skill-close and well-trodden, and we keep them distinct.
        </p>
        <h2>The acronyms, spelled out</h2>
        <p>
          The method leans on public datasets, and the field is thick with initials. Here is every one this instrument touches, in plain language.
        </p>
        <table className="post-table">
          <caption>Every acronym in the method</caption>
          <thead><tr><th>Term</th><th>Full name</th><th>What it does here</th></tr></thead>
          <tbody>
            <tr><td><strong><a className="gl" href="/glossary#bls">BLS</a></strong></td><td>US Bureau of Labor Statistics</td><td>Public-domain wage and occupational-transfer figures. Anchors the salary bands and the odds.</td></tr>
            <tr><td><strong><a className="gl" href="/glossary#soc">SOC</a></strong></td><td>Standard Occupational Classification</td><td>The code system that joins a messy job title to official wage and mobility data.</td></tr>
            <tr><td><strong><a className="gl" href="/glossary#onet">O*NET</a></strong></td><td>Occupational Information Network</td><td>The US Labor Department&rsquo;s skills-and-tasks database. The curated baseline we try to beat.</td></tr>
            <tr><td><strong><a className="gl" href="/glossary#esco">ESCO</a></strong></td><td>European Skills, Competences, Qualifications and Occupations</td><td>The EU counterpart to O*NET, for cross-border coverage.</td></tr>
            <tr><td><strong><a className="gl" href="/glossary#cps">CPS</a></strong></td><td>Current Population Survey</td><td>The US household survey behind the observed occupation-to-occupation flow data.</td></tr>
            <tr><td><strong><a className="gl" href="/glossary#jaccard">Jaccard</a></strong></td><td>Jaccard index</td><td>Shared skills divided by all distinct skills across two roles. The tiebreaker after coverage.</td></tr>
            <tr><td><strong>CC BY</strong></td><td>Creative Commons Attribution</td><td>The license that lets a product which charges money legally reuse the mobility datasets.</td></tr>
          </tbody>
        </table>
        <h2>What the numbers say: adjacency is rare</h2>
        <p>
          Run the coverage score across every pair in the taxonomy and the shape is stark. We scored <strong>7,946 origin-to-destination routes</strong> in the July run. Sorted into readiness bands, as a share of all routes:
        </p>
        <div className="post-bars">
          {[['0–20%', 63.2], ['20–40%', 30.5], ['40–60%', 5.1], ['60–80%', 1.1], ['80–100%', 0.1]].map(([k, v]) => (
            <div key={String(k)} className="pb-row"><span className="k">{k}</span><span className="t"><span className="f" style={{ width: `${(Number(v) / 63.2) * 100}%` }}></span></span><span className="v">{v}%</span></div>
          ))}
        </div>
        <p>
          Nearly two-thirds of all occupation pairs score under 20 percent. The vast majority of careers are simply far from each other in skill space, which is the honest and slightly deflating truth the motivational literature skips. Only <strong>93 routes out of 7,946</strong> reach 60 percent readiness or higher. Adjacency is not everywhere. It is a thin, specific set of connections, and the entire point of measuring it is to find the few that are real for you.
        </p>
        <div className="post-pullq">
          The value is not that everything connects to everything. It is that a handful of things connect to what you already do, and until you measure the skills you cannot see which handful.
        </div>
        <h2>The routes that clear the bar</h2>
        <p>
          At the top of the distribution, the strong non-licensed moves, the ones where the skills genuinely carry and no credential stands in the way:
        </p>
        <table className="post-table">
          <caption>High-readiness routes without a licensing gate &middot; PivotHop July 2026 run</caption>
          <thead><tr><th>From</th><th>To</th><th className="num">Readiness</th><th className="num">Shared skills</th></tr></thead>
          <tbody>
            <tr><td>Product designer</td><td>UX designer</td><td className="num"><strong>87%</strong></td><td className="num">16</td></tr>
            <tr><td>Account executive</td><td>Sales representative</td><td className="num">86%</td><td className="num">15</td></tr>
            <tr><td>Accountant</td><td>Financial controller</td><td className="num">80%</td><td className="num">14</td></tr>
            <tr><td>Accountant</td><td>Bookkeeper</td><td className="num">75%</td><td className="num">15</td></tr>
            <tr><td>Software engineer</td><td>Backend developer</td><td className="num">73%</td><td className="num">15</td></tr>
          </tbody>
        </table>
        <h2>The rules that keep the number honest</h2>
        <p>
          A readiness score is easy to fake and easy to misread, so the method is fenced by a few non-negotiable rules.
        </p>
        <p>
          <strong>Skills over titles, always.</strong> The matching key is the skill vector read from postings, never the job title. Titles are labels on the output, nothing more.
        </p>
        <p>
          <strong>Read demand, do not trust self-report.</strong> The skills come from what postings require, not from a candidate&rsquo;s self-assessment or an employer&rsquo;s tag. The documented weakness of tag-based boards is that the tags are wishful; ours are read from the description text.
        </p>
        <p>
          <strong>Readiness is not eligibility.</strong> Coverage measures skills, and skills are not the only barrier. Medical assistant to dental hygienist scores 90 percent on skills and is still gated by a license that takes years. So the license is flagged separately, on its own axis, and never folded into the readiness number. A high score with a legal gate is a real finding, not a mistake, and we show both.
        </p>
        <p>
          <strong>No manufactured adjacency.</strong> The three-shared-skill floor means a pair either clears the bar or returns nothing. We would rather show fewer routes than invent a connection out of one generic overlap.
        </p>
        <p>
          <strong>Corroborate, keep disagreement.</strong> Demand, employer intent, and observed flow are three separate readings. Where they agree, confidence is high. Where they disagree, we surface it rather than blend it into a single reassuring average.
        </p>
        <p>
          <strong>Only licensable data.</strong> Every external dataset in the stack, the <a className="gl" href="/glossary#cps">CPS</a> mobility network and the resume trajectories among them, is public domain or Creative Commons, which is what makes it legal to build a paid product on. Nothing is scraped against its terms.
        </p>
        <h2>What it is for</h2>
        <p>
          Career adjacency is the measurement under a single practical question: given the skills you already have, which roles are actually within reach, and how far. The <a className="gl" href="/">instrument</a> takes an origin occupation, reads your skill vector, and returns the reachable destinations ranked by readiness, each with the salary band, the specific skill gap, and the honest odds attached. A <a className="gl" href="/routes/architect-to-interior-designer">measured route</a> is one row of that answer, opened up. The <a className="gl" href="/glossary">glossary</a> defines every term and links every source.
        </p>
        <p>
          The number is not a promise. It is a map of the skill distance between where you are and where you are thinking of going, built from what the market is actually asking for this week. Start from your skills, read the distance, and the few real routes separate themselves from the many that were never close.
        </p>
        <Go links={[
          { href: '/compare', label: 'Careers compared, both directions' },
          { href: '/blog/confused-career-pairs', label: 'The eight most-confused pairs' },
          { href: '/blog/skills-over-titles', label: 'The thesis: skills over titles' },
        ]} />
        <Sources>
          <p>
            Readiness scores are computed from the PivotHop posting corpus, July 2026 run (151,369 postings across 180 occupations, from company career pages, remote-job boards, and public-sector sources). Coverage is the share of a destination occupation&rsquo;s 20 most frequent posting skills that the origin occupation also demands; pairs are ranked by coverage and broken by weighted Jaccard overlap; pairs sharing fewer than three skills are unscored. Employer attestation is read from posting text (28,553 scanned, 1,749 attesting). Observed mobility is drawn from a <a className="gl" href="/glossary#cps">CPS</a>-derived US occupational-mobility network (2010&ndash;2017), EU resume trajectories, and <a className="gl" href="/glossary#onet">O*NET</a> related occupations, all Creative-Commons-licensed and used for corroboration only. Wage and occupational-transfer figures are <a className="gl" href="/glossary#bls">BLS</a>, public domain. Licensing gates are flagged separately and never folded into readiness.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'visa-sponsorship-counted',
    title: 'Visa sponsorship, counted: a coin flip, and 43 real offers',
    pillar: 'Shape of Work',
    date: 'July 2026',
    dek: 'We added a visa-sponsor filter to the board, then read the postings behind it. Nearly half the listings that mention the phrase were declining sponsorship, not offering it. Here is the honest count of jobs that will actually move you across a border.',
    minutes: 7,
    faq: [
      { q: 'Do most job postings offer visa sponsorship?', a: 'No, and almost none do. In our July 2026 corpus of 151,369 postings, 1,046 mention visa sponsorship at all, which is 0.7 percent. Of the live, re-displayable listings on the board, 43 out of 4,196 genuinely offer it, about one in a hundred.' },
      { q: 'Does "visa sponsorship" in a job posting mean they will sponsor?', a: 'It is close to a coin flip. The same phrase appears in offers ("we are able to offer visa sponsorship") and in refusals ("this role is not eligible for visa sponsorship"). Nearly half of the postings that use the phrase, 48 percent, are declining. The sentence around the words decides it, not the words.' },
      { q: 'Which fields are most likely to sponsor a work visa?', a: 'On our board the genuine offers cluster in science, technology, and business roles. The signal is noisy: 34 of the 43 offers sit in US postings, because American employers are required to state H-1B status, while employers in countries with routine work-permit processes often say nothing at all.' },
      { q: 'Why do US jobs mention visa sponsorship more than others?', a: 'Because US immigration law forces the question into the posting. Employers screen for H-1B eligibility explicitly, so the phrase appears constantly, in both offers and refusals. In many other countries the work-permit process is routine and goes unmentioned, so the absence of the phrase is not a no.' },
    ],
    body: (
      <>
        <p>
          We added a filter to the job board that shows only roles offering visa sponsorship. Then we read the postings behind it, and the filter was a coin flip. Across our corpus of 151,369 postings, 1,046 mention visa sponsorship. <strong>Nearly half of those mentions, 48 percent, are the phrase sitting inside a refusal.</strong>
        </p>
        <p>
          The same two words carry opposite instructions, and a filter that matches the string cannot tell them apart. Search a board for &ldquo;visa sponsorship&rdquo; and about half of what you surface is employers telling you, in writing, that they will not sponsor you.
        </p>
        <h2>Two words, two opposite jobs</h2>
        <p>
          Here is the phrase doing both jobs, verbatim from the corpus. The words are identical. The instruction is reversed.
        </p>
        <table className="post-table">
          <caption>The phrase &ldquo;visa sponsorship&rdquo; in real postings &middot; verbatim, PivotHop corpus, July 2026</caption>
          <thead><tr><th>What the posting says</th><th className="num">Means</th></tr></thead>
          <tbody>
            <tr><td>&ldquo;We are able to offer visa sponsorship for the right candidate.&rdquo;</td><td className="num">Yes</td></tr>
            <tr><td>&ldquo;Visa sponsorship and relocation support provided.&rdquo;</td><td className="num">Yes</td></tr>
            <tr><td>&ldquo;This role is not eligible for visa sponsorship.&rdquo;</td><td className="num">No</td></tr>
            <tr><td>&ldquo;We are unable to offer visa sponsorship for this role.&rdquo;</td><td className="num">No</td></tr>
          </tbody>
        </table>
        <p>
          A filter that reads the phrase as a yes is right about half the time. For most searches that would be mediocre. For this one it is the worst kind of wrong, because the person leaning on it is the person who cannot take the job without sponsorship, and half the time it hands them the exact posting that rules them out.
        </p>
        <h2>The honest count</h2>
        <p>
          So we changed how the flag works. A listing counts as an offer only when the phrase appears with no refusal beside it, before or after: no &ldquo;not eligible,&rdquo; no &ldquo;unable to offer,&rdquo; no &ldquo;is not available.&rdquo; One decline anywhere disqualifies the listing, because we would rather miss a real offer than send someone toward a wall. On that rule, the live board of 4,196 re-displayable listings holds <strong>43 that genuinely offer visa sponsorship</strong>, or 1 percent.
        </p>
        <p>
          43 out of 4,196. About one in a hundred. Sponsorship is not a filter you apply to a job search. It is a property of a small, specific set of employers, and the open board is the wrong place to go looking for it.
        </p>
        <h2>Where the offers actually are</h2>
        <table className="post-table">
          <caption>Live listings that genuinely offer visa sponsorship, by field &middot; PivotHop board, July 2026</caption>
          <thead><tr><th>Field</th><th className="num">Sponsor-offering listings</th></tr></thead>
          <tbody>
            <tr><td><strong>Science</strong></td><td className="num">15</td></tr>
            <tr><td>Technology</td><td className="num">11</td></tr>
            <tr><td>Business</td><td className="num">8</td></tr>
            <tr><td>Legal</td><td className="num">3</td></tr>
            <tr><td>Finance</td><td className="num">2</td></tr>
            <tr><td>Engineering</td><td className="num">2</td></tr>
          </tbody>
        </table>
        <p>
          There is a geography twist the raw count hides. The offers skew hard to the United States: <strong>34 of the 43 sit in US postings</strong>, and not because American employers sponsor more. They are legally required to address it. A US posting names H-1B status to screen applicants; a German or Singaporean posting for the same role often says nothing, because the local work-permit process is routine and unstated. The phrase tracks how loud a country&rsquo;s immigration paperwork is, not how open its employers are. Read the absence of the words as ambiguity, not a no.
        </p>
        <div className="post-pullq">
          Visa sponsorship is not a checkbox on a job board. It is a short list of employers who do it as policy, and the postings that use the phrase are about as likely to be ruling it out as offering it.
        </div>
        <h2>What to do with a border in the way</h2>
        <p>
          If a pivot means a move across one, three habits beat filtering for the word. Target employers, not listings, because the companies that sponsor do it repeatedly and by policy: find the 43 on this board that offer it and start from their names. Read for the refusal, not the phrase, since the disqualifying sentence is the one that matters and it is almost always explicit. And treat a remote role as the other door, because 5 of the sponsor-offering listings are remote, where the visa question can dissolve entirely. The skills that get you the role are the same across a border; the <a className="gl" href="/">instrument</a> measures which roles your skills reach, and the sponsorship question comes after that, not before it. When you are ready, the <a className="gl" href="/jobs">board</a> now filters on the honest version of the flag.
        </p>
        <Sources>
          <p>
            Counts are from the PivotHop posting corpus, July 2026 run (151,369 postings from company career pages, remote-job boards, and public-sector sources). A &ldquo;mention&rdquo; is any posting whose text matches visa sponsorship, sponsoring a work visa, H-1B sponsorship, or &ldquo;sponsorship available.&rdquo; A mention counts as an offer only when no negation (no, not, without, unable, ineligible) sits in the 45 characters before the phrase and no negation opens the words just after it. The rule is deliberately strict: it undercounts genuine offers so that it never points a visa-dependent candidate at a rejection. Field and country are read from the posting&rsquo;s stated location. The board&rsquo;s visa filter now uses this rule.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'fulfilling-careers-who-actually-stays',
    title: 'Do people stay in the most fulfilling careers? The exit rates say it depends',
    pillar: 'Career Half-Life',
    date: 'July 2026',
    dek: 'The satisfaction surveys measure a feeling. We measured whether people actually stay, and the two do not always agree. Some fulfilling jobs keep people for a career; others run on meaning because they cannot run on anything else.',
    minutes: 6,
    body: (
      <>
        <p>
          The lists of most fulfilling careers all agree on the shape. Helping professions score highest on meaning: clergy at 98 percent saying their work makes the world a better place, surgeons at 96, nurses and teachers and social workers close behind, on a PayScale survey of more than two million workers. It is a real finding, and it has one blind spot. Meaning is a feeling reported by the people who are still in the job. It cannot tell you whether that meaning was enough to keep them.
        </p>
        <p>
          We can measure the thing the surveys cannot. The <a className="gl" href="/glossary#bls">BLS</a> (US Bureau of Labor Statistics) publishes, for every occupation, the share of workers who move to a different one each year, the occupational transfer rate. Cross it with the satisfaction lists and the single word &ldquo;fulfilling&rdquo; splits into three very different careers.
        </p>
        <h2>The fulfilling jobs that keep people</h2>
        <p>
          The first group is healthcare, and it is the one the surveys get exactly right. The helping jobs that score highest on meaning also carry among the lowest exit rates we track.
        </p>
        <table className="post-table">
          <caption>Fulfilling careers, and how many leave the occupation each year &middot; occupational transfer rate, BLS Employment Projections 2024&ndash;34</caption>
          <thead><tr><th>Career</th><th className="num">Leave the occupation per year</th></tr></thead>
          <tbody>
            <tr><td><strong>Pharmacist</strong></td><td className="num">1.3%</td></tr>
            <tr><td>Physical therapist</td><td className="num">1.5%</td></tr>
            <tr><td>Registered nurse</td><td className="num">2.1%</td></tr>
            <tr><td>Nurse practitioner</td><td className="num">2.1%</td></tr>
            <tr><td>Psychologist</td><td className="num">2.2%</td></tr>
            <tr><td>Dietitian</td><td className="num">2.8%</td></tr>
            <tr><td>Teacher</td><td className="num">3.3%</td></tr>
            <tr><td>Social worker</td><td className="num">4.5%</td></tr>
            <tr><td><strong>Tutor</strong></td><td className="num">8.1%</td></tr>
          </tbody>
        </table>
        <p>
          A physical therapist has a 1.5 percent chance of leaving the occupation in a given year; a registered nurse, 2.1 percent. These are people who found the work meaningful and stayed in it. When a survey says healthcare is fulfilling, the retention data agrees without an asterisk: the meaning is real, and it is durable.
        </p>
        <h2>The fulfilling jobs people flee</h2>
        <p>
          Then there is teaching, which tells the opposite story with the same word. It scores near the top of every meaning survey and near the bottom of every retention one. In our data a tutor carries an 8.1 percent annual transfer rate, the highest of any fulfilling career, and a classroom teacher 3.3 percent, roughly half again a nurse&rsquo;s. The outside numbers are worse than ours: <strong>16 percent of teachers said they intended to leave in 2025</strong>, and projections put teacher departures near 270,000 a year. Social work sits in the same bracket at 4.5 percent.
        </p>
        <div className="post-callout"><b>8.1%</b><span>of tutors and <strong>3.3%</strong> of teachers switch occupations every year, against <strong>1.5%</strong> of physical therapists. Same &ldquo;fulfilling&rdquo; label, very different staying power.</span></div>
        <p>
          This is the gap the meaning surveys hide. A job can be genuinely fulfilling and still shed people, because meaning is not the only thing a career has to provide. When a role scores high on purpose and high on exit at the same time, the honest reading is not &ldquo;rewarding.&rdquo; It is rewarding enough that people try it, and depleting enough that they leave. Teaching runs on meaning because, for too many, it cannot run on pay or conditions. That combination is a warning label, not a recommendation.
        </p>
        <div className="post-pullq">A job that scores high on meaning and high on exit is not a calling. It is a role asking people to take meaning in place of the things it does not pay.</div>
        <h2>The pay underneath the flight</h2>
        <p>
          Line the exit rates up against pay and the pattern sharpens. The careers people leave fastest are, with two telling exceptions, the ones that ask for the most meaning and return the least money.
        </p>
        <table className="post-table">
          <caption>Exit rate against pay &middot; transfer rate from BLS Employment Projections, median from live US postings &middot; PivotHop, July 2026</caption>
          <thead><tr><th>Career</th><th className="num">Leave per year</th><th className="num">Median pay</th></tr></thead>
          <tbody>
            <tr><td>Chef</td><td className="num">7.8%</td><td className="num">$65,000</td></tr>
            <tr><td><strong>Medical assistant</strong></td><td className="num">7.4%</td><td className="num">$52,000</td></tr>
            <tr><td>Customer support</td><td className="num">7.4%</td><td className="num">$50,000</td></tr>
            <tr><td>Flight attendant</td><td className="num">7.1%</td><td className="num">$62,000</td></tr>
            <tr><td>Account executive</td><td className="num">6.6%</td><td className="num">$116,000</td></tr>
            <tr><td>Registered nurse</td><td className="num">2.1%</td><td className="num">$97,000</td></tr>
            <tr><td>Physical therapist</td><td className="num">1.5%</td><td className="num">$104,000</td></tr>
            <tr><td>Lawyer</td><td className="num">1.4%</td><td className="num">$166,000</td></tr>
            <tr><td><strong>Pharmacist</strong></td><td className="num">1.3%</td><td className="num">$153,000</td></tr>
          </tbody>
        </table>
        <p>
          The high-flight roles at the top sit between 50,000 and 65,000 dollars. The sticky ones at the bottom run from 97,000 past 166,000. Meaning is not handed out by pay, but staying largely is: when a career asks people to accept purpose in place of money, enough of them eventually decline. The sharpest case is the medical assistant, leaving at 7.4 percent a year on 52,000 dollars, many of them climbing the exact healthcare ladder that keeps nurses in place, because the nurse&rsquo;s pay sits on the far side of it.
        </p>
        <p>
          Two exceptions show the limit of the pay story. Pilots and account executives both flee at high rates, 7.2 and 6.6 percent, on six-figure pay. Neither leaves for money. Pilots leave for the schedule and the medical certifications that end careers early; account executives leave for the churn built into a job re-measured every quarter. Pay explains most of the flight. Where it does not, the conditions do, which is only the same lesson from the other side: a number for how people feel is worth less than a number for what they do.
        </p>
        <h2>The trap: staying is not always fulfillment</h2>
        <p>
          One more group complicates the picture. Lawyers leave their occupation at 1.4 percent a year and pharmacists at 1.3, rates that match or beat the happiest healthcare roles. But the cause is different, and the difference matters. When the entry price is a doctorate or a bar exam, people stay partly because leaving forfeits the investment. Retention has two engines: a job people do not want to leave, and a job people cannot afford to. The transfer rate alone cannot tell them apart, which is why a low exit number is a question, not an answer.
        </p>
        <h2>How to read a most-fulfilling list</h2>
        <p>
          Cross the satisfaction survey with the exit rate and three careers fall out of the one label. Fulfilling and sticky, which is most of healthcare: the meaning is real and people stay, so trust it if you can clear the training. Fulfilling but fleeing, which is teaching, tutoring, and social work: the meaning is real and the conditions are not, so go in with the burnout budgeted rather than assumed away. And sticky but not necessarily fulfilling, which is law and pharmacy: durable for reasons closer to sunk cost than to joy. Before you pivot toward a career because a list called it fulfilling, work out which of the three it is, because the list will not. The retention side of that question is the whole subject of our piece on the <a className="gl" href="/blog/careers-people-never-leave">careers people never leave</a>; the <a className="gl" href="/">instrument</a> prices the move itself, and the <a className="gl" href="/salary">salary pages</a> carry the pay each one actually offers.
        </p>
        <Sources>
          <p>
            Retention figures are the BLS Employment Projections 2024&ndash;34 occupational separations, the transfer rate being the share of an occupation&rsquo;s workers who move to a different occupation in a year, across 135 occupations in our data. Meaning and satisfaction figures are from PayScale&rsquo;s survey of over two million workers, US News career rankings, and the 2025 Gallup and RAND State of the American Teacher surveys for the teacher intent-to-leave and burnout numbers. Pay for each career is on its salary page. Run a specific move on the front-page instrument.
          </p>
        </Sources>
      </>
    ),
    faq: [
      { q: 'What are the most fulfilling careers?', a: 'Satisfaction surveys consistently rank helping professions highest: clergy (98 percent say their work makes the world better), healthcare including surgeons, nurses, and physical therapists, plus teaching and social work. But high meaning does not guarantee that people stay.' },
      { q: 'Do people actually stay in fulfilling jobs?', a: 'It depends on the job. Healthcare fulfilling careers have very low exit rates, with physical therapists at 1.5 percent and registered nurses at 2.1 percent leaving the occupation per year, so people stay. Teaching and tutoring score high on meaning but have high exit (teacher 3.3 percent, tutor 8.1 percent), so people leave despite the meaning.' },
      { q: 'Is teaching a good career?', a: 'It is one of the most meaningful and one of the least retained. About 16 percent of teachers intended to leave in 2025, and our data shows a classroom teacher is roughly 50 percent more likely to switch occupations than a nurse. The meaning is real; the pay and conditions are the problem.' },
      { q: 'Why do lawyers and pharmacists rarely leave their jobs?', a: 'Partly the credential. When entry requires a doctorate or a bar exam, leaving forfeits a large investment, so a low exit rate can reflect sunk cost rather than fulfillment. Retention alone does not distinguish a job people love from one they cannot afford to leave.' },
      { q: 'Do the most meaningful jobs pay the least?', a: 'Often, but not always. PayScale, surveying over two million workers, found clergy carry the highest meaning score at 98 percent on some of the lowest pay, around 46,600 dollars, while a few medical roles such as surgeons score high on both. Very few jobs pair high meaning with high pay, and most that do are in medicine.' },
      { q: 'Which fulfilling career has the best mix of meaning, pay, and retention?', a: 'Healthcare, physical therapy in particular: high on every meaning survey, a median near 104,000 dollars, and one of the lowest exit rates we track at 1.5 percent a year. The catch is the doctorate the field now requires, which is the price of that stability.' },
    ],
  },
  {
    slug: 'jobs-disappearing-versus-created',
    title: 'Jobs disappearing versus jobs created: the only number that is actually yours',
    pillar: 'What Carried Over',
    date: 'July 2026',
    dek: 'The AI-jobs debate argues about totals, 92 million gone, 170 million made. That number cannot help you. The one that can is which growing job your skills already reach.',
    minutes: 6,
    body: (
      <>
        <p>
          Every forecast about AI and work reports the same shape of number. The World Economic Forum projects 92 million jobs displaced and 170 million created by 2030, a net gain of 78 million. It is a real figure and it is useless to you, because you do not hold 78 million jobs. You hold one, and the only question that matters at your scale is whether the one you hold is on the shrinking side, and if it is, which growing job your skills already reach.
        </p>
        <p>
          We can answer part of that from our own data, and we have to be honest about the part we cannot. Our corpus is a snapshot of who is being hired now, not a time-lapse of who will be automated later, so it does not see jobs disappearing. For that, the government projections are the source. What our data does see, better than any projection, is the bridge: where one occupation&rsquo;s skills already reach another.
        </p>
        <h2>The created jobs are real, but not the famous one</h2>
        <p>
          Start with what AI made. The new roles are in our corpus now, and they sort into two piles: the builders, well-paid and growing, and the support-and-hype layer, thin and already fading.
        </p>
        <table className="post-table">
          <caption>AI-era occupations in our corpus, by volume and posted median &middot; PivotHop, July 2026</caption>
          <thead><tr><th>Role</th><th className="num">Postings</th><th className="num">Median</th><th>Demand</th></tr></thead>
          <tbody>
            <tr><td><strong>AI engineer</strong></td><td className="num">973</td><td className="num">$100,000</td><td>High</td></tr>
            <tr><td>Machine-learning engineer</td><td className="num">754</td><td className="num">$126,000</td><td>High</td></tr>
            <tr><td>Computer vision engineer</td><td className="num">154</td><td className="num">$149,000</td><td>Moderate</td></tr>
            <tr><td><a className="gl" href="/glossary#mlops">MLOps</a> (machine-learning operations) engineer</td><td className="num">176</td><td className="num">$117,000</td><td>Moderate</td></tr>
            <tr><td>Prompt engineer</td><td className="num">74</td><td className="num">$110,000</td><td>Low</td></tr>
            <tr><td>Data annotator</td><td className="num">61</td><td className="num">$63,000</td><td>Low</td></tr>
          </tbody>
        </table>
        <p>
          The split is the finding. The builders, AI engineer and machine-learning engineer and computer vision engineer, are real software-engineering jobs with an AI specialty, and they pay for it: computer vision clears 149,000 dollars. The bottom two are the ones the headlines named. Prompt engineer and data annotator are both low-demand, and the annotator, the human who labels the data that trains the models, sits at 63,000 dollars, the price the market puts on feeding AI rather than building it.
        </p>
        <div className="post-callout"><b>74</b><span>prompt-engineer postings, already low-demand. The face of the AI-jobs boom is being reabsorbed into AI engineering (<strong>973</strong> postings) before most people finished retraining for it.</span></div>
        <p>
          The lesson in that contrast is worth more than the totals. Prompt engineer was the job every 2023 headline named as the face of AI work. Two years on it is 74 postings in our corpus and fading, its tasks folded back into the broader AI-engineer role that actually grew. The created jobs are real; the ones named first are usually wrong. Betting a pivot on the meme job is how you arrive a year late to a role that no longer exists.
        </p>
        <h2>The disappearing jobs, and the bridge out of them</h2>
        <p>
          For the shrinking side we defer to the <a className="gl" href="/glossary#bls">BLS</a> (US Bureau of Labor Statistics) Employment Projections, which have named the decliners for years: cashiers, data-entry keyers, telemarketers, word processors, the routine roles automation reaches first. Our corpus mostly cannot see them, because the roles it carries are the ones still hiring. But for the occupations everyone calls automation-exposed, our adjacency graph shows something the decline projections never do: where the skills already go.
        </p>
        <table className="post-table">
          <caption>Highest-coverage adjacent move into a high-demand role &middot; PivotHop, July 2026</caption>
          <thead><tr><th>Automation-exposed role</th><th>The nearest durable move</th><th className="num">Coverage</th></tr></thead>
          <tbody>
            <tr><td>Medical assistant</td><td><strong>Nurse practitioner</strong> (high demand)</td><td className="num">76%</td></tr>
            <tr><td>Customer support</td><td><strong>Executive assistant</strong> (high demand)</td><td className="num">65%</td></tr>
            <tr><td>Bookkeeper</td><td>Financial controller (high demand)</td><td className="num">55%</td></tr>
            <tr><td>IT support</td><td>Network engineer (high demand)</td><td className="num">54%</td></tr>
            <tr><td>Market researcher</td><td>Executive assistant (high demand)</td><td className="num">51%</td></tr>
            <tr><td>Graphic designer</td><td>Brand designer (moderate)</td><td className="num">48%</td></tr>
            <tr><td>Recruiter</td><td>HR manager (high demand)</td><td className="num">35%</td></tr>
            <tr><td>Paralegal</td><td>Lawyer (licensed)</td><td className="num">33%</td></tr>
          </tbody>
        </table>
        <p>
          These are not consolation prizes. A medical assistant, in one of the fastest-churning jobs in the country, already covers 76 percent of what a nurse-practitioner posting asks for, the exact ladder that turns an automation-exposed role into one of the stickiest careers there is. An IT-support worker covers 54 percent of a network engineer; a bookkeeper, 55 percent of a financial controller. The move is up and sideways at once, and it is measurable today, before any decline forces it. Notice the shape: the strongest escapes stay inside the same world, healthcare into healthcare, tech support into tech, because that is where the skills already overlap.
        </p>
        <div className="post-pullq">A job disappearing is not the same as your skills expiring. The first is a headline. The second is almost never true.</div>
        <h2>Which skills carry you across</h2>
        <p>
          The bridge is not luck; it is a specific set of skills that appear on both sides of the shrink-to-grow gap. When we counted the skills that show up in the most different occupations, the winners were not any field&rsquo;s headline tools. They were the portable ones: project coordination, data analysis, writing, and the handling of people under pressure, the competencies that travel because no single job owns them. A bookkeeper reaches a financial controller on ledger fluency and process discipline; a customer-support specialist reaches an executive assistant on judgment and scheduling. The skill that automates is the narrow, repeatable one; the skill that carries you is the general one, which is the same reason it was never the thing AI came for first. The full ranking is in our piece on the <a className="gl" href="/blog/most-transferable-skills">most transferable skills of 2026</a>.
        </p>
        <h2>Why the net number is a trap</h2>
        <p>
          The 78-million-net figure hides the only thing an individual needs to know. Net creation can be strongly positive while your specific occupation halves, because the created jobs and the destroyed ones are different jobs, held by different people, often in different places. The macro number reassures the economy and abandons the worker. The micro number, the coverage between where you are and where the hiring is, does the opposite. It ignores the economy and tells you your next move.
        </p>
        <p>
          That is the entire design of the <a className="gl" href="/">instrument</a>: it does not forecast whether AI will take your job, a question no one can answer honestly. It measures which growing jobs your current skills already reach, which our data can answer for any starting point. The <a className="gl" href="/blog/job-titles-born-since-2023">new job titles</a> are one half of the picture and the <a className="gl" href="/blog/the-gravity-wells">gravity wells</a> are the other. Run your own. The net number is not yours. The bridge is.
        </p>
        <Sources>
          <p>
            PivotHop pipeline, July 2026 run: 79,257 mapped postings across 174 occupations. Role counts and posted medians are from the corpus; coverage is the destination&rsquo;s demanded-skill coverage by the origin&rsquo;s profile, over the top 20 skills per occupation. Our data measures current hiring, not future automation, so the decline framing is cited, not ours: the disappearing-occupation list is the BLS Employment Projections, and the 92-million-displaced, 170-million-created figures are the World Economic Forum Future of Jobs. Run your own starting point on the front-page instrument.
          </p>
        </Sources>
      </>
    ),
    faq: [
      { q: 'Which jobs is AI creating?', a: 'In our corpus, AI engineering (973 postings, a median near $100,000) and machine-learning engineering (754 postings, about $126,000) are the substantial ones, both high-demand. The famous prompt engineer is small, 74 postings, and already low-demand, its work absorbed into broader AI roles.' },
      { q: 'Which jobs is AI destroying?', a: 'Our data mostly shows current hiring, not future decline. For the shrinking roles, the BLS Employment Projections name cashiers, data-entry keyers, telemarketers, and similar routine work. The more useful question is where those skills can move next.' },
      { q: 'If my job is being automated, what should I do?', a: 'Find the adjacent role your skills already cover at 40 percent or more and move before the decline forces it. A bookkeeper covers 55 percent of a financial controller; a customer-support specialist covers 65 percent of an executive assistant. The instrument maps yours.' },
      { q: 'Will AI create more jobs than it destroys?', a: 'Forecasters like the World Economic Forum project a net gain, 170 million created against 92 million destroyed by 2030. But the net is close to meaningless at the individual level, because the created and destroyed jobs are different jobs, held by different people, often in different places.' },
      { q: 'What are the highest-paying AI jobs?', a: 'In our corpus, the builders rather than the prompt-writers: computer vision engineer near 149,000 dollars, machine-learning engineer at 126,000, and MLOps engineer at 117,000. The much-hyped prompt engineer sits lower at 110,000 and is already low-demand.' },
      { q: 'How do I know if my job is safe from AI?', a: 'No one can answer that honestly, and our data cannot see future automation. The more useful question is which growing roles your current skills already reach. If your job is exposed, the adjacent higher-demand move is usually within your own field, and the instrument maps it.' },
    ],
  },
  {
    slug: 'the-weird-jobs-priced',
    title: 'The weird jobs, priced: what an ethical hacker, a brewmaster, and a perfusionist actually make',
    pillar: 'Shape of Work',
    date: 'July 2026',
    dek: 'We pointed the scraper at the strange edges of the job market and asked what they pay. The ones it could see price against every intuition. The weirdest ones it could barely see at all.',
    minutes: 6,
    body: (
      <>
        <p>
          We spend most of our time measuring the ordinary middle of the labor market: software engineers, nurses, accountants, the jobs that post by the thousand. This month we pointed the scraper at the strange edges instead, sommeliers and foley artists and people who fly drones for a living, and asked the only question a salary instrument knows how to ask. What does it pay?
        </p>
        <p>
          Two things came back, and both were surprising. The first is how little the weird jobs resemble their reputations once a real number is attached. The second is how many of them a corpus of 79,257 live postings can barely see at all.
        </p>
        <div className="post-callout"><b>3</b><span>sommelier postings in 79,257. Six brewmasters. Fourteen ethical hackers. <strong>Zero</strong> perfusionists. The rarer the job, the blinder the data.</span></div>
        <h2>The ones we could price</h2>
        <p>The visible edge of the weird first, with the count attached so you know how much to trust each line:</p>
        <table className="post-table">
          <caption>Posted medians for offbeat occupations &middot; PivotHop, July 2026. Counts under 30 are thin; read them as signals, not settled figures.</caption>
          <thead><tr><th>Job</th><th className="num">Posted median</th><th className="num">Postings</th><th>The part that surprises</th></tr></thead>
          <tbody>
            <tr><td><strong>Ethical hacker</strong> (penetration tester)</td><td className="num">$182,000</td><td className="num">14</td><td>Paid like a senior engineer to break in on purpose</td></tr>
            <tr><td>Paramedic</td><td className="num">$104,000</td><td className="num">71</td><td>Higher than the reputation, lifted by flight medics</td></tr>
            <tr><td>Data annotator (AI trainer)</td><td className="num">$63,000</td><td className="num">61</td><td>The humans who label what trains the models</td></tr>
            <tr><td>Sommelier</td><td className="num">$68,000</td><td className="num">3</td><td>A real figure from three postings, so read it as a rumor</td></tr>
            <tr><td>Flight attendant</td><td className="num">$60,000</td><td className="num">101</td><td>The one weird job our data sees clearly</td></tr>
            <tr><td>Foley artist (sound designer)</td><td className="num">$52,000</td><td className="num">7</td><td>Makes celery sound like breaking bone</td></tr>
            <tr><td>Medical scribe</td><td className="num">$46,000</td><td className="num">23</td><td>The pre-med grind, priced accordingly</td></tr>
            <tr><td><strong>Brewmaster</strong></td><td className="num">$36,000</td><td className="num">6</td><td>The Friday fantasy, priced like the tasting room</td></tr>
          </tbody>
        </table>
        <p>
          The ethical hacker number is the one that stops you. Breaking into systems, with permission, posts a median near <strong>$182,000</strong> in our data, and the open market runs higher still. The bug-bounty platform HackerOne has paid ethical hackers over $300 million all told; thirty of them have cleared a million dollars each, one has passed four, and the single largest bounty on record was $100,050, paid by a crypto firm for one flaw. The nearest ordinary job to it, security engineer, is a short skills hop away, which is the whole point of the <a className="gl" href="/">instrument</a>.
        </p>
        <p>
          At the other end sits the brewmaster. The job every desk worker fantasizes about on a Friday afternoon posts a median near <strong>$36,000</strong>. Passion is not free. Someone has to charge you for the privilege of loving your work, and when the queue of people who want the job is long, that someone is usually you.
        </p>
        <div className="post-pullq">The ethical hacker out-earns the sommelier, who out-earns the brewer. Reputation is a terrible salary guide.</div>
        <p>
          The middle of the table is where the trivia lives. Flight attendants, the one offbeat job our data prices cleanly at about $60,000, sleep in bunks most passengers never learn about: most Boeing 787s hide a staircase behind a passcode-locked door, leading to a windowless crew-rest cabin above the seats, and the <a className="gl" href="/glossary#faa">FAA</a> (the Federal Aviation Administration) mandates that rest on the longest routes. Foley artists, at $52,000 from seven postings, are the people who make a snapping stalk of celery sound like a breaking spine, two coconut halves sound like a galloping horse, and, in Titanic, frozen lettuce peeled apart sound like a woman&rsquo;s hair. Sommeliers post a tidy $68,000, but only 269 people have ever passed the Master Sommelier exam, fewer than have been to space, so the three postings we found describe the floor of that world and nothing near its ceiling.
        </p>
        <h2>The ones the data cannot see</h2>
        <p>
          The most interesting occupations in this batch produced no salary at all, because they produced almost no postings. A <strong>perfusionist</strong>, the person who runs the heart-lung machine during open-heart surgery and, in the literal job description, delivers the drug that stops your heart so a surgeon can work on it, appears zero times in our corpus. The open market pays them a median around $165,000. It is one of the best-paid jobs almost no job board carries, because only a few thousand exist in the country and hospitals hire them by name, not by advertisement.
        </p>
        <p>
          Wind turbine technician is the opposite kind of invisible. By the <a className="gl" href="/glossary#bls">BLS</a> (US Bureau of Labor Statistics) count it is the single fastest-growing occupation in the United States, projected to grow around fifty percent this decade, and it pays a median of $61,770 with no degree required and top earners past $90,000, for the modest inconvenience of doing the work three hundred feet in the air. It also appears zero times in our corpus, because the boards we read skew toward desks, and this is a job you reach through a trade program, not a careers page.
        </p>
        <div className="post-callout"><b>0</b><span>postings, in 79,257, for a $165,000 perfusionist or the fastest-growing job in America. A posting scrape is a census of the ordinary.</span></div>
        <h2>What the weird edges are telling you</h2>
        <p>
          The pattern under the trivia is the useful part. Job-board data is a map of the salaried, desk-shaped, advertised middle of the economy. It sees flight attendants and paramedics because airlines and hospitals post at scale. It cannot see perfusionists, too rare, or wind techs, hired through trades, and it sees sommeliers and foley artists as a rumor of three or seven postings. If a career you are weighing is barely visible in a corpus this size, that is itself information: the way in is a relationship or a credential, not an application.
        </p>
        <p>
          It also means the pay reputations you carry are mostly wrong. The hacker out-earns the sommelier. The paramedic out-earns the medical scribe by more than double. The dream job pays the least. When you can attach a real number, the number usually argues with the story, which is what the <a className="gl" href="/salary">salary board</a> does for the ordinary jobs at scale. For the weird ones, the lesson is smaller and sharper: distrust the reputation, go find the number, and where the number is invisible, so, usually, is the front door.
        </p>
        <Sources>
          <p>
            PivotHop pipeline, July 2026 run: 79,257 mapped postings across 174 occupations. Posted medians are the raw median of postings with stated pay for each occupation; counts are the mapped postings we found, and any figure under 30 postings is thin by our own confidence floor and shown with its count for that reason. Off-corpus figures, cited because our data could not produce them: perfusionist median from industry salary trackers (ZipRecruiter and peers, roughly $163,000 to $165,000); wind turbine technician median, growth, and outlook from the BLS Occupational Outlook Handbook; ethical-hacker bounty totals from HackerOne; Master Sommelier scarcity from the Court of Master Sommeliers; foley techniques from Mental Floss and Atlas Obscura reporting; flight-attendant crew rest from FAA rest rules and reporting. Run an ordinary job, or a weird one, on the front-page instrument.
          </p>
        </Sources>
      </>
    ),
    faq: [
      { q: 'What is the highest-paid weird job?', a: 'In our posting data, ethical hacking (penetration testing) at a posted median near $182,000, though from only 14 postings. Off our board, perfusionists, who run the heart-lung machine in cardiac surgery, earn around $165,000 and appear in almost no job ads at all.' },
      { q: 'Why do some jobs barely show up in job-posting data?', a: 'Because they are hired through relationships or credentials rather than advertised at scale (a perfusionist), or reached through trade programs rather than careers pages (a wind turbine technician). A job that is nearly invisible in a large posting corpus usually has a non-obvious front door, which is worth knowing before you plan a move toward it.' },
      { q: 'What weird job pays the most for the least schooling?', a: 'Wind turbine technician: a BLS median of $61,770, top earners past $90,000, no degree required, and the fastest projected growth of any US occupation this decade, in exchange for working hundreds of feet in the air.' },
      { q: 'Does a brewmaster really pay that little?', a: 'In our corpus, a posted median near $36,000, from a handful of postings. Craft and passion careers tend to price low because the supply of people who want them is large, so the enjoyment is treated as part of the compensation.' },
    ],
  },
  {
    slug: 'the-broken-bottom-rung',
    title: 'The broken bottom rung: the entry-level job is vanishing, and the way in went sideways',
    pillar: 'Career Half-Life',
    date: 'July 2026',
    dek: 'Entry-level postings are down about a third since 2023, and the word junior has nearly disappeared from our corpus. When the front door closes, the way in is adjacency.',
    minutes: 6,
    body: (
      <>
        <p>
          The bottom rung of the career ladder is being sawn off, and the numbers are not subtle. Entry-level job postings are down about <strong>35 percent since 2023</strong>, and in some technology and data roles closer to 67 percent. Recent graduates are underemployed at roughly <strong>43 percent</strong> as of December 2025, the highest since the pandemic, and their unemployment rate, 5.6 percent, now sits above the national rate of 4.3 percent. The class of 2026 faces projected hiring growth of 1.6 percent, which is not growth once you count the larger graduating class.
        </p>
        <p>
          The usual telling blames one thing, AI, and moves on. The more useful question is what a person does about it, because a ladder that is losing its first rung is not going to grow the rung back. We went looking for the entry rung in our own data to see how thin it has become.
        </p>
        <div className="post-callout"><b>0.13%</b><span>of the seniority-labeled postings in our corpus say <strong>junior</strong>. Of 50,660 postings that carry any rank in the title, 65 use the word. Only two of 154 occupations post enough junior roles to form a band.</span></div>
        <p>
          A caveat we will make before anyone else does: postings undercount entry work, because an entry role often just prints the job title with no rank attached. Our seniority read is the explicit signal, the words junior, senior, and lead, so the true entry share is higher than 0.13 percent. But the direction is unmistakable and it agrees with the national figures. The labeled bottom rung is thin to the point of absence, and the market that used to hire people to learn on the job is hiring people who already learned somewhere else.
        </p>
        <h2>What breaks when the rung breaks</h2>
        <p>
          Entry-level work was never really about the work. It was where a person learned what good looks like: how to notice when something does not add up, how to push back without blowing up the meeting, how to see what their output does three desks downstream. Automate the straightforward tasks that juniors used to cut their teeth on, and you do not just remove a job. You remove the training that turned that job into the next one. That is the part the displacement statistics miss. The <a className="gl" href="/glossary#bls">BLS</a> (US Bureau of Labor Statistics) can count the vanished postings; it cannot count the vanished apprenticeship.
        </p>
        <p>
          This is a Career Half-Life problem, not a young-person problem. A ladder with no first rung does not only trap graduates. It removes the normal way anyone crossed into a new field, which was to enter at the bottom and climb. If the bottom is gone, the only way in is sideways.
        </p>
        <h2>The way in went sideways</h2>
        <p>
          Here is the move the panic articles miss. When you cannot enter a field at the bottom, you enter an adjacent field where your skills already reach, and you pivot on coverage rather than seniority. Our whole instrument measures exactly this: how much of one occupation&rsquo;s demanded skills another occupation&rsquo;s people already hold. Where that coverage is high, the crossing does not need a junior rung, because you are not starting over. You are arriving with most of the job already done.
        </p>
        <table className="post-table">
          <caption>High-coverage crossings that do not require a junior rung &middot; PivotHop, July 2026</caption>
          <thead><tr><th>Side door</th><th className="num">Skill coverage</th><th>What it means</th></tr></thead>
          <tbody>
            <tr><td>Accountant &rarr; <strong>Financial controller</strong></td><td className="num">81%</td><td>Almost the whole skill set already carries</td></tr>
            <tr><td>Accountant &rarr; Bookkeeper</td><td className="num">77%</td><td>An open lane while junior-accountant roles thin out</td></tr>
            <tr><td>Software engineer &rarr; <strong>Backend developer</strong></td><td className="num">63%</td><td>Same tools, a narrower title with its own openings</td></tr>
            <tr><td>Data analyst &rarr; Business-intelligence developer</td><td className="num">51%</td><td>The reporting stack, one seat over</td></tr>
            <tr><td>Data analyst &rarr; Product analyst</td><td className="num">47%</td><td>Analyst skills, pointed at a product team</td></tr>
          </tbody>
        </table>
        <p>
          None of these is a fantasy leap. They are the crossings where our corpus says the skills mostly transfer already, so the move is a matter of naming and evidence, not of starting at the bottom of a ladder that no longer has a bottom. The <a className="gl" href="/routes">route pages</a> lay out the exact gap for the most-searched crossings, and the graph on the <a className="gl" href="/">front page</a> runs it for any starting point you give it.
        </p>
        <div className="post-pullq">The ladder is being replaced by a lattice. Vertical entry is breaking; lateral entry is measurable, and it still works.</div>
        <h2>What to do if the front door is closed</h2>
        <p>
          Stop applying to the vanishing rung. Four hundred applications to entry-level roles that increasingly do not exist is a strategy optimized for the market of 2019. Instead, inventory the fields adjacent to the one you want, the ones where your current skills already cover half or more of what the postings ask, and enter there. Then pivot from inside, where you can see the target job and hold the evidence that you can do it. The BLS and the World Economic Forum agree there will be work: the Forum projects 92 million roles displaced and 170 million created by 2030, a net gain. The catch is that the created jobs will not be entered the old way. They will be entered sideways, on skills, which is the door that is still open.
        </p>
        <Sources>
          <p>
            PivotHop pipeline, July 2026 run: 77,443 live job postings across 153 occupations. Seniority is read from explicit title signals (junior, senior, lead), which undercounts unlabeled entry roles; 65 of 50,660 seniority-tagged postings carry a junior signal, and two of 154 occupations reach a junior band. Skill coverage is the destination&rsquo;s demanded-skill coverage by the origin&rsquo;s profile, top 20 skills per occupation from posting text. External figures: entry-level decline and recent-graduate underemployment and unemployment from 2025 to 2026 reporting (Fast Company, CNBC, Washington Monthly, NACE outcomes); displacement and creation projections from the World Economic Forum Future of Jobs. Run your own starting point on the front-page instrument.
          </p>
        </Sources>
      </>
    ),
    faq: [
      { q: 'Are entry-level jobs really disappearing because of AI?', a: 'Entry-level postings are down roughly 35 percent since 2023, and recent-graduate underemployment reached about 43 percent by late 2025. AI is a major cause, since it automates the routine tasks junior roles were built around, but the effect is broader than any one field. In our own corpus the word junior appears in only 0.13 percent of seniority-labeled postings.' },
      { q: 'If I cannot get an entry-level job, what should I do instead?', a: 'Enter an adjacent field where your existing skills already cover half or more of what the postings ask, then pivot from inside. Lateral, skills-based entry does not depend on the junior rung that is disappearing. The PivotHop instrument measures which adjacent fields your skills already reach.' },
      { q: 'Which fields still hire people without experience?', a: 'Fewer than in 2019, and the labeled junior rung is thin across almost every occupation we track. The more reliable path is coverage: adjacent roles where your skills transfer at 50 percent or more, which the route pages map for the most-searched crossings.' },
      { q: 'Will AI create new jobs to replace the entry-level ones?', a: 'The World Economic Forum projects 170 million new roles against 92 million displaced by 2030, a net gain. But the new jobs are unlikely to be entered the traditional way, at the bottom of a ladder. They will be entered laterally, on transferable skills.' },
    ],
  },
  {
    slug: 'the-gravity-wells',
    title: 'The gravity wells: the careers the most skill sets can reach, and what they share',
    pillar: 'What Carried Over',
    date: 'July 2026',
    dek: 'We counted, for every occupation, how many others can reach it on skills alone. The destinations the most skill sets pull toward are, without exception, high-demand. They are not the best paid.',
    minutes: 6,
    body: (
      <>
        <p>
          Careers have gravity. Some occupations sit at the center of the skill map, reachable from dozens of starting points, and some sit at the edge, reachable from almost none. We measured it directly. For each of the 153 occupations in our July 2026 corpus, we counted how many other occupations cover at least 40 percent of its demanded skills, its in-degree: the number of fields whose people could cross into it without starting over.
        </p>
        <p>
          The fields with the most gravity are not the ones you would guess from a salary table.
        </p>
        <table className="post-table">
          <caption>Highest skill-gravity destinations, by number of fields that can reach them at 40 percent coverage or more &middot; PivotHop, July 2026</caption>
          <thead><tr><th>Destination</th><th className="num">Reachable from</th><th>Demand</th><th className="num">Posted band</th></tr></thead>
          <tbody>
            <tr><td><strong>Construction manager</strong></td><td className="num">12 fields</td><td>High</td><td className="num">$80k&ndash;$120k</td></tr>
            <tr><td>Dietitian</td><td className="num">10 fields</td><td>High</td><td className="num">$55k&ndash;$75k</td></tr>
            <tr><td>Project manager</td><td className="num">9 fields</td><td>High</td><td className="num">$75k&ndash;$130k</td></tr>
            <tr><td>Pharmacist</td><td className="num">8 fields</td><td>High</td><td className="num">$75k&ndash;$160k</td></tr>
            <tr><td>Nurse practitioner</td><td className="num">8 fields</td><td>High</td><td className="num">$40k&ndash;$125k</td></tr>
            <tr><td>Database administrator</td><td className="num">8 fields</td><td>High</td><td className="num">$70k&ndash;$110k</td></tr>
          </tbody>
        </table>
        <p>
          Every one of the top fifteen is rated high demand. Not most of them. All of them. So we split the map in two and compared: the strong absorbers, the eighteen occupations reachable from six or more fields, against the weak ones reachable from two or fewer.
        </p>
        <div className="post-callout"><b>18 of 18</b><span>of the strongest skill-gravity destinations are high-demand, against about half of the weak ones. But the strong absorbers pay <strong>less</strong>, an $89k midpoint against $97k.</span></div>
        <h2>Gravity follows the shortage, not the salary</h2>
        <p>
          This is the finding, and it is worth sitting with. The careers that the most skill sets can reach are the ones the market is short of, not the ones that pay the most. Construction manager, dietitian, project manager, database administrator, nurse practitioner: high demand, widely reachable, and clustered in the middle of the pay range rather than the top. The strong absorbers average an $89,000 posted midpoint and 4 percent fully remote. The hard-to-reach fields average $97,000 and 6 percent remote. Reachability tracks demand, and demand is a measure of what is missing, not of what is prized.
        </p>
        <p>
          The mechanism is not mysterious. A field becomes reachable from many directions when its demanded skills are common ones: project coordination, clinical fundamentals, systems administration, the widely-held competencies. Common skills are common because many people have them, which is exactly why those fields can hire broadly, and also why they do not have to pay a scarcity premium. The best-paid fields are rare-skilled and therefore reachable from almost nowhere. The pay and the accessibility trade off against each other, and the trade is legible in the data.
        </p>
        <div className="post-pullq">The reachable field is the employable field. It is not automatically the raise. Those are two questions, and the postings answer them separately.</div>
        <h2>What this changes about a pivot</h2>
        <p>
          If your aim is to get hired, aim at gravity. The high-in-degree fields are where a broad skill set converts into an offer fastest, because the demand is real and the coverage bar is one many profiles clear. If your aim is to get paid, gravity can mislead you, because the most reachable destinations are mid-band by construction. The two goals are not the same move, and the honest version of career advice keeps them apart.
        </p>
        <p>
          We built the tools to answer them separately. The <a className="gl" href="/">instrument</a> shows which fields your own skills can reach; the <a className="gl" href="/salary">salary pages</a> show what each one actually pays across the distribution; and the earlier piece on <a className="gl" href="/blog/the-adjacency-premium">the adjacency premium</a> covers the third of crossings that do point to a raise. Reachable and better-paid is a shorter list than reachable. Know which one you are optimizing before you retrain.
        </p>
        <Sources>
          <p>
            PivotHop pipeline, July 2026 run: 77,443 live job postings across 153 occupations. Skill gravity, or in-degree, is the number of occupations whose skill profile covers at least 40 percent of a destination&rsquo;s demanded skills, computed over the top 20 skills per occupation from posting text. Demand ratings and posted salary bands from the same corpus, occupations with at least 20 salaried postings. Strong absorbers, in-degree of 6 or more, n=18; weak absorbers, in-degree of 2 or fewer, n=35. Salary midpoints are the middle of each posted band. Run your own field on the front-page instrument.
          </p>
        </Sources>
      </>
    ),
    faq: [
      { q: 'What does it mean for a career to have high skill gravity?', a: 'It means many other occupations can cover most of its required skills, so people can cross into it without starting over. We measure it as in-degree: the number of fields whose skill profile covers at least 40 percent of the destination’s demanded skills. Construction manager, project manager, and nurse practitioner sit near the top.' },
      { q: 'Do the most reachable careers pay the most?', a: 'No, and this is the counterintuitive part. In our corpus the strongest skill-gravity destinations are unanimously high-demand but pay a lower midpoint, about $89,000, than the hard-to-reach fields at about $97,000. Reachability tracks shortage, not salary.' },
      { q: 'Should I pivot toward a high-demand field or a high-paying one?', a: 'Decide which you are optimizing first, because they are usually different moves. High-gravity fields convert a broad skill set into an offer fastest; the biggest raises tend to sit in less-reachable, more-credentialed fields. The instrument and the salary pages answer the two questions separately.' },
      { q: 'Why are common skills tied to lower pay?', a: 'A field is reachable from many directions when its demanded skills are widely held. Widely-held skills do not command a scarcity premium, so those fields hire broadly but pay mid-band. The best-paid fields are rare-skilled, and therefore reachable from almost nowhere.' },
    ],
  },
  {
    slug: 'generalist-vs-specialist-measured',
    title: 'Generalist versus specialist, measured: breadth is a number, and it is handed out unevenly',
    pillar: 'Unbundle the Job',
    date: 'July 2026',
    dek: 'The AI-era advice is to be a generalist, or a specialist, or a hybrid, always without a number. We put one on it. Sixty of 153 occupations cannot reach a single adjacent field on skills; twenty-nine can reach five or more.',
    minutes: 6,
    body: (
      <>
        <p>
          Every few weeks the internet re-litigates whether the future belongs to generalists or specialists, and the argument always ends in the same shrug: be a hybrid, stay adaptable, it depends. It is true and it is useless, because nobody attaches a number to breadth. Breadth is measurable. We measure it on every occupation we track.
        </p>
        <p>
          Here is the measure. For each occupation, count how many other fields its people could cross into at 40 percent skill coverage or better, its out-degree: the number of doors its current skill set already opens. That count is what &ldquo;generalist&rdquo; means once you stop using it as a personality type. It is optionality, and it is not evenly distributed.
        </p>
        <div className="post-callout"><b>60 of 153</b><span>occupations cannot reach a <strong>single</strong> adjacent field at 40 percent skill coverage. Twenty-nine can reach five or more. The median profession reaches exactly one.</span></div>
        <p>
          Read that again, because it is the whole argument. Optionality is bimodal. A large group of professions, 60 of 153, is boxed in at the strict coverage bar we set: their skill bundle does not cover 40 percent of any other single occupation&rsquo;s demands. A smaller group ranges across the map. Most people sit in the middle, one door open. The generalist advantage is real, but it is a minority position, and it is a property of your skills, not your temperament.
        </p>
        <h2>Who is wide, and who is boxed in</h2>
        <table className="post-table">
          <caption>Widest and narrowest skill reach, doors open at 40 percent coverage &middot; PivotHop, July 2026</caption>
          <thead><tr><th>Occupation</th><th className="num">Fields reachable</th><th>Shape</th></tr></thead>
          <tbody>
            <tr><td><strong>Operations manager</strong></td><td className="num">15</td><td>Generalist bundle</td></tr>
            <tr><td><strong>Business analyst</strong></td><td className="num">15</td><td>Generalist bundle</td></tr>
            <tr><td>Sales engineer</td><td className="num">14</td><td>Bridge role, technical plus commercial</td></tr>
            <tr><td>Data scientist</td><td className="num">11</td><td>Portable analytical core</td></tr>
            <tr><td>Software engineer</td><td className="num">9</td><td>Portable technical core</td></tr>
            <tr><td>Copywriter, paralegal, creative director</td><td className="num">0</td><td>Deep, specific, boxed in</td></tr>
          </tbody>
        </table>
        <p>
          The wide occupations share a shape. Operations manager, business analyst, sales engineer, project manager: these are bundles of coordination, analysis, and communication, the skills that recur across the most fields. The narrow ones, copywriter, paralegal, creative director, are deep and specific, and their depth is exactly what does not cover another occupation&rsquo;s demand list. This is the <a className="gl" href="/blog/most-transferable-skills">transferable-skills</a> finding seen from the other direction: the skills that travel are the general ones, so the people who hold more of them travel further.
        </p>
        <div className="post-pullq">Generalist is not a personality. It is a measurable shape of your skill set, and right now it buys optionality that most professions do not have.</div>
        <h2>Why breadth is winning this particular decade</h2>
        <p>
          The reason the generalist question feels urgent now is AI, and here the data and the discourse agree. As automated tools absorb narrow, well-defined execution, the value that stays human is the part that connects things: judgment across domains, the decision about what to build, the translation between a model&rsquo;s output and a business&rsquo;s need. Those are breadth skills by definition. A wide out-degree is not only more exits in a crisis; it is a hedge against your specific deep skill being the next one commoditized.
        </p>
        <p>
          That does not make specialization a mistake. Depth is what lets a person guide the tools rather than compete with them, and the highest pay still concentrates in scarce, deep, often licensed skills, as our piece on <a className="gl" href="/blog/the-adjacency-premium">the adjacency premium</a> showed. The honest synthesis is the one the think-pieces gesture at without evidence: hold a deep core so you are worth hiring, and enough general range that your core is not your only door. The difference is that now you can measure the range instead of guessing at it.
        </p>
        <h2>How to read your own number</h2>
        <p>
          Count your doors before you assume you have options, and before you assume you have none. A specialist reading a zero on the strict bar is not doomed; it means the nearest crossings sit below 40 percent coverage and will take real skill-building, which is worth knowing precisely rather than vaguely. A generalist reading a twelve is not safe; it means the market can route you many places, none of which is guaranteed to pay more, per the gravity finding. The <a className="gl" href="/">instrument</a> on the front page draws your doors from your own skills, and the <a className="gl" href="/routes">route pages</a> price the specific ones. Breadth stops being a debate the moment it becomes a count.
        </p>
        <Sources>
          <p>
            PivotHop pipeline, July 2026 run: 77,443 live job postings across 153 occupations. Breadth, or out-degree, is the number of occupations whose demanded skills the origin&rsquo;s profile covers at 40 percent or more, computed over the top 20 skills per occupation from posting text. Distribution across the 153: 60 occupations reach zero fields at that bar, 27 reach one, 37 reach two to four, 29 reach five or more; median one, mean 2.3. The 40 percent bar is deliberately strict; lower it and every count rises, but the shape, a wide floor of boxed-in fields and a thin ceiling of broad ones, holds. Run your own count on the front-page instrument.
          </p>
        </Sources>
      </>
    ),
    faq: [
      { q: 'Is it better to be a generalist or a specialist in the age of AI?', a: 'The measurable answer is that breadth buys optionality and depth buys pay, and they are not the same asset. In our corpus 60 of 153 occupations cannot reach a single adjacent field at 40 percent skill coverage while 29 reach five or more, so breadth is real but unevenly held. The durable position is a deep core plus enough general range that your core is not your only door.' },
      { q: 'How do you measure whether a job is a generalist or specialist role?', a: 'By out-degree: the number of other occupations whose demanded skills your current skill set already covers at 40 percent or more. Operations manager and business analyst reach 15 fields; copywriter, paralegal, and creative director reach zero at that bar. Breadth is a property of the skill bundle, not the person.' },
      { q: 'Does being a generalist pay more?', a: 'Not by itself. The most reachable, high-optionality fields tend to sit mid-band, while the biggest pay concentrates in scarce, deep, often licensed skills. Breadth is insurance and access; depth is the premium. Optimize for the one you actually need.' },
      { q: 'Why does AI favor generalists?', a: 'AI absorbs narrow, well-defined execution fastest, so the value that stays human is the connecting work: judgment across domains, deciding what to build, translating between tools and needs. Those are breadth skills, which is why a wide skill set is a hedge against any single deep skill being commoditized next.' },
    ],
  },
  {
    slug: 'the-adjacency-premium',
    title: 'The adjacency premium: what 148 strong career connections pay',
    pillar: 'Run It 10,000 Times',
    date: 'July 2026',
    dek: 'A third of well-matched career moves lead somewhere that pays more. The biggest raises hide behind licenses. The whole table logic follows.',
    minutes: 6,
    body: (
      <>
        <p>
          We measured the skill overlap between 145 occupations, using 66,403 live
          job postings. Where one profession's skills cover at least half of what
          another profession's postings ask for, we call that a strong adjacency.
          There are 148 of them with enough salary data to compare pay on both
          ends.
        </p>
        <p>
          Fifty-three of the 148, about 36 percent, point somewhere that pays more
          than where they start. The standard story
          about career changes is sacrifice: start over, take the pay cut, earn
          your way back. The postings say that story is true only two times out of
          three. The third time, the adjacent role simply pays better, and the
          main thing between you and it is that nobody told you it was adjacent.
        </p>
        <div className="post-callout"><b>36%</b><span>of the 148 strong career adjacencies we measured point to a destination that posts a <strong>higher</strong> salary midpoint than the origin.</span></div>
        <h2>The biggest premiums, and the catch</h2>
        <p>
          The top of the table, with the licensing reality attached:
        </p>
        <table className="post-table">
          <caption>Largest pay premiums among strong adjacencies · PivotHop, July 2026</caption>
          <thead><tr><th>Move</th><th>Skill match</th><th className="num">Pay delta</th><th>The gate</th></tr></thead>
          <tbody>
            <tr><td>Medical assistant → <strong>Pharmacist</strong></td><td>58%</td><td className="num"><strong>+125%</strong></td><td>Doctorate + state license</td></tr>
            <tr><td>Bookkeeper → <strong>Financial controller</strong></td><td>55%</td><td className="num"><strong>+108%</strong></td><td><a className="gl" href="/glossary#cpa">CPA</a> (certified public accountant) for some roles only</td></tr>
            <tr><td>Medical assistant → Physical therapist</td><td>68%</td><td className="num">+92%</td><td>Licensure exam</td></tr>
            <tr><td>Customer support → Flight attendant</td><td>71%</td><td className="num">+69%</td><td><a className="gl" href="/glossary#faa">FAA</a> (the Federal Aviation Administration) certification</td></tr>
            <tr><td>Architect → <strong>Electrical engineer</strong></td><td>58%</td><td className="num">+67%</td><td><a className="gl" href="/glossary#pe-license">PE</a> (the professional-engineer license) for sign-off roles only</td></tr>
          </tbody>
        </table>
        <p>
          Now the catch: the biggest premiums sit behind licenses. Pharmacist requires a doctorate and a
          state license. Physical therapist requires a licensure exam. Flight
          attendant, plus 69 percent from customer support, requires FAA
          certification through an airline. The market is not stupid. Where the
          raise is large and the skills mostly carry over, a legal gate is usually
          what keeps the crowd out, and the premium is partly the gate's rent.
        </p>
        <p>
          Strip out the fully licensed destinations and the picture stays
          interesting. Bookkeeper to financial controller, plus 108 percent, needs
          a CPA only for some roles. Architect to electrical engineer, plus 67
          percent at a 58 percent match, needs a PE only for sign-off positions.
          There is real money in adjacency that does not require going back to
          school. It just is not the very top of the table.
        </p>
        <h2>How to read this if you are considering a move</h2>
        <p>
          Treat a pivot as a bet with three numbers: your skill coverage today,
          the pay delta, and the gate. Our instrument shows the first two on
          every route and flags the third on every licensed profession. A 70
          percent match into a plus 20 percent unlicensed role is often a better
          bet than a 55 percent match into a plus 100 percent licensed one,
          because the second bet includes years and tuition that the salary line does not show. The <a className="gl" href="/salary">salary pages</a> carry the full distribution behind each of these figures, and <a className="gl" href="/fairelephant">FairElephant</a> prices a specific offer.
        </p>
        <Sources>
          <p>
            PivotHop pipeline, July 2026 run. Strong adjacency: destination skill
            coverage of at least 50 percent, computed over the top 20 skills per
            occupation from posting text. Salary midpoints from postings with
            stated pay, at least 20 salaried postings per occupation on both ends
            of a pair. Licensing annotations reviewed by hand for 40 occupations.
            Run the numbers for your own job with the instrument on the front
            page.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'what-1090-postings-say-architects-do',
    title: 'What 1,090 job postings say architects actually do',
    pillar: 'What Carried Over',
    date: 'July 2026',
    dek: 'Revit first, sustainability second, and project management ahead of design software most firms would guess. The demand profile of a profession, measured.',
    minutes: 5,
    body: (
      <>
        <p>
          Ask an architect what the job is and you will hear about design. Ask
          1,090 live job postings and you get a different answer. We read every
          architect posting in our corpus and counted which skills employers
          actually name. The top ten, by share of postings that mention them:
          <strong>Revit at 11.6 percent</strong>, <strong>sustainability at 9.2</strong>, project management at 6.6, specification writing at 4.3, construction documentation at 4.0,
          urban design at 3.6, <a className="gl" href="/glossary#bim">BIM</a> (building information modeling) at 3.3, construction administration at 2.8,
          quality control at 2.8, and <a className="gl" href="/glossary#leed">LEED</a> (the green-building certification) at 2.7.
        </p>
        <div className="post-bars">
          {[['Revit', 11.6], ['Sustainability', 9.2], ['Project management', 6.6], ['Spec writing', 4.3], ['Construction docs', 4.0], ['Urban design', 3.6], ['BIM', 3.3], ['Construction admin', 2.8], ['Quality control', 2.8], ['LEED', 2.7]].map(([k, v]) => (
            <div key={String(k)} className="pb-row"><span className="k">{k}</span><span className="t"><span className="f" style={{ width: `${(Number(v) / 11.6) * 100}%` }}></span></span><span className="v">{v}%</span></div>
          ))}
        </div>
        <h2>Three things worth noticing</h2>
        <p>
          First, <strong>sustainability is the number two skill in architecture hiring</strong>.
          Not a specialization, not a nice-to-have: nearly one posting in ten
          names it, ahead of every design tool except Revit. If you are an
          architect who has done real energy modeling or LEED documentation, you
          are holding a skill the market prices higher than most of your software
          list.
        </p>
        <p>
          Second, the management cluster outweighs the drawing cluster. Project management, construction administration, and quality control together <strong>appear more often than Revit does</strong>. The profession sells itself to
          students as a design career. The postings describe a coordination
          career with a design component. This gap between the story and the
          demand is exactly where pivots come from.
        </p>
        <p>
          Third, the skills that travel are not the ones on the diploma. In our
          adjacency model, the architect's strongest routes right now are
          structural engineer, interior designer, and the engineering trio of
          electrical, mechanical, and civil. What carries you across is not
          design theory. It is Revit, specification writing, project management,
          and the habit of coordinating people who disagree, which every one of
          those destinations pays for.
        </p>
        <h2>What this means if you are leaving, and if you are staying</h2>
        <p>
          If you are considering an exit, inventory yourself against the demand
          list, not the curriculum. The market credits you for the unglamorous
          middle of your week. If you are staying, the same list is a raise
          strategy: sustainability credentials and specification depth are the
          two cheapest ways to move up the demand curve without leaving the
          profession.
        </p>
        <h2>Using the list on a resume, this week</h2>
        <p>
          One practical conversion. Take your last three projects and rewrite
          each bullet so it leads with a term from the demand list rather
          than a design term: the LEED documentation you produced, the RFIs
          you closed, the spec sections you owned, the consultant
          coordination you ran. Nothing about the work changes. What changes
          is that a recruiter scanning against these exact words, and
          increasingly a model doing the same, finds you on the first pass.
          The postings have told you the vocabulary. It would be rude not to
          use it.
        </p>
        <Sources>
          <p>
            PivotHop pipeline, July 2026 run: 1,090 postings mapped to the
            architect occupation across thirteen job sources, skill shares
            computed from posting text against a 246-skill dictionary. Routes
            from the adjacency model on the front page. Postings accumulate
            daily, so the decimals move; the ordering has been stable across
            runs.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'one-word-two-professions',
    title: 'One word, two professions: the architect problem in job data',
    pillar: 'Unbundle the Job',
    date: 'July 2026',
    dek: 'Half the postings titled architect are not about buildings. Every career site you have used mixes them together. How we split them, and why it matters.',
    minutes: 5,
    body: (
      <>
        <p>
          Search any major job board for architect and count what comes back:
          solutions architect, cloud architect, data architect, security
          architect, enterprise architect. Somewhere in the pile, a person who
          designs buildings. The software industry borrowed the word decades ago
          and now dominates its search results. For a career data system, this is
          not a naming quirk. It is a contamination problem that silently ruins
          every statistic downstream.
        </p>
        <p>
          If you average the salaries of building architects and cloud
          architects, you get a number that describes nobody. If you compute
          which skills architects need and a third of your sample is AWS
          postings, you will tell a licensed building designer to learn
          Kubernetes. Career sites do this constantly. It is one reason their
          numbers feel plausible and useless at the same time.
        </p>
        <h2>How we split the word</h2>
        <p>
          Our pipeline treats the bare word architect as claimable <strong>only by an exact match</strong>. A posting titled just Architect maps to the building
          profession. Anything in the pattern of something architect, where the
          something is a technology word, routes to the technology occupation or,
          when we cannot tell, gets excluded rather than guessed. Every excluded
          title goes to a review log, and the dictionary grows from that log
          weekly.
        </p>
        <p>
          The same discipline applies across the taxonomy. Designer is claimed
          by six different professions in our data. Engineer by more than ten.
          Analyst is a suffix on half the business world. Each of the 145
          occupations we track carries its own list of exact titles and
          qualified phrases, currently about <strong>600 synonyms</strong>, and the matcher takes
          the longest specific phrase before it ever considers a generic word.
        </p>
        <table className="post-table">
          <caption>Contested words in our taxonomy · July 2026</caption>
          <thead><tr><th>The word</th><th className="num">Professions claiming it</th><th>Example collision</th></tr></thead>
          <tbody>
            <tr><td><strong>Engineer</strong></td><td className="num">10+</td><td>Civil vs software vs sales engineer</td></tr>
            <tr><td><strong>Designer</strong></td><td className="num">6</td><td>Interior vs product vs graphic</td></tr>
            <tr><td>Architect</td><td className="num">5</td><td>Building vs solutions vs data</td></tr>
            <tr><td>Analyst</td><td className="num">5</td><td>Financial vs data vs business</td></tr>
            <tr><td>Manager</td><td className="num">dozens</td><td>Everything, always</td></tr>
          </tbody>
        </table>
        <p>
          The scale of the collision is visible in our own counts: the
          building profession holds <strong>1,178 postings</strong> in the
          corpus while solutions architect alone holds <strong>736</strong>,
          and the tech variants together outnumber the people who design
          buildings. An unsplit average over that pile would miss every
          number that matters by double digits.
        </p>
        <h2>Why you should care even if you are not an architect</h2>
        <p>
          Because whatever your title is, some other profession is probably
          squatting on part of it. Producers exist in film, in music, and in
          software. Consultants exist everywhere and mean nothing. When a career
          tool shows you a salary band or a skill list, the first question worth
          asking is: whose postings are actually in this average? If the tool
          cannot answer, its numbers are weather, not measurement.
        </p>
        <p>
          Ours answers. Type architect into the instrument and you get two
          entries, clearly labeled by field, with separate data underneath. The building one currently reads <strong>1,090 postings</strong>. The pile it was rescued
          from was several times larger.
        </p>
        <Sources>
          <p>
            PivotHop title matcher: exact-only claiming for ambiguous bare
            titles, longest-phrase containment otherwise, about 600 synonyms
            across 145 occupations, unmapped titles logged for weekly review.
            July 2026 corpus: 66,403 mapped postings from roughly 99,000 raw.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'seven-jobs-inside-architect',
    title: 'The seven jobs inside "architect," and where each one goes alone',
    pillar: 'Unbundle the Job',
    date: 'July 2026',
    dek: 'A profession is a bundle of skills that history happened to staple together. Unstaple the architect and seven separate careers fall out.',
    minutes: 6,
    body: (
      <>
        <p>
          The job title architect is a bundle. Inside it, on any given week, one
          person runs a budget meeting, red-lines a drawing set, argues with a
          contractor, models energy loads, writes specifications, renders a
          competition image, and reworks a floor plan. History stapled those
          tasks together. The market, meanwhile, prices each one separately, and
          our adjacency data shows exactly where each goes when it travels alone.
        </p>
        <p>
          The coordinator inside you is a construction manager or project
          manager. This is the strongest single thread in the data: project management appears in <strong>6.6 percent</strong> of architect postings, and the
          management cluster is the biggest overlap in most architect routes.
          The modeler inside you is a <a className="gl" href="/glossary#bim">BIM</a> (building information modeling) manager or architectural drafter,
          the two most Revit-weighted destinations we track. The environmental
          conscience is a sustainability consultant, a route our model scores <strong>in the nineties</strong> for architects who list energy modeling and <a className="gl" href="/glossary#leed">LEED</a> (the green-building certification).
          The specifier, the person who knows what a spec section is for, maps
          toward construction estimating and technical writing. The urbanist
          goes to urban planning, license required in some states. The
          visualizer goes to 3D and rendering work across games, film, and
          product marketing. And the detail conscience, the one who catches
          the flashing problem, is quality control and building surveying in
          waiting.
        </p>
        <table className="post-table">
          <caption>The seven threads and where each travels · PivotHop, July 2026</caption>
          <thead><tr><th>The thread</th><th>Where it goes alone</th><th className="num">Graph score</th></tr></thead>
          <tbody>
            <tr><td>The coordinator</td><td>Construction or project management</td><td className="num">top overlap</td></tr>
            <tr><td>The modeler</td><td>BIM management, drafting</td><td className="num">strong</td></tr>
            <tr><td><strong>The environmentalist</strong></td><td>Sustainability consulting</td><td className="num"><strong>93%</strong>*</td></tr>
            <tr><td>The specifier</td><td>Estimating, technical writing</td><td className="num">37%</td></tr>
            <tr><td>The urbanist</td><td>Urban planning</td><td className="num">licensed, varies</td></tr>
            <tr><td>The visualizer</td><td>3D, rendering, product imagery</td><td className="num">portfolio-led</td></tr>
            <tr><td>The detail conscience</td><td>QC, building surveying</td><td className="num">36%</td></tr>
          </tbody>
        </table>
        <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>
          *Personalized score with energy modeling and LEED added to the
          skill vector; the seed profile alone scores lower.
        </p>
        <h2>Why unbundling beats reinvention</h2>
        <p>
          The standard career-change fantasy is reinvention: become someone new.
          The data suggests something less cinematic and more achievable: pick
          the thread of your current job you like most, find the profession
          that is mostly that thread, and close a much smaller gap than you
          feared. An architect moving to sustainability consulting is not
          starting over. They are dropping <strong>six sevenths of the bundle</strong> and getting paid for the seventh they kept.
        </p>
        <p>
          This is also the honest reading of why pivots fail. People leave
          architecture because of the deadline culture and pick a destination
          that inherits the same thread they hated. Unbundling forces the
          useful question: which part of the week do you actually want more
          of? The instrument can measure which professions want that part too.
          Only you know which part it is.
        </p>
        <Sources>
          <p>
            Skill shares and route scores from the PivotHop July 2026 run,
            architect corpus of 1,090 postings. Sustainability route score
            from the personalized model with energy modeling and LEED added
            to the skill vector. Licensing notes from our hand-reviewed
            annotations, 40 occupations.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'licensed-exits',
    title: 'Licensed exits: 18 percent of good career routes have a legal gate',
    pillar: 'Shape of Work',
    date: 'July 2026',
    dek: 'We annotated licensing for every major destination in the graph. Nearly one strong route in five runs through a license, and the pattern is not what you would guess.',
    minutes: 5,
    body: (
      <>
        <p>
          We looked at the top eight routes out of every occupation in our
          graph, <strong>1,112 routes</strong> in total, and asked a boring question with
          expensive answers: how many of these destinations can you legally
          just start doing? The result: <strong>64 percent are license-free</strong>, <strong>18 percent require a license outright</strong>, and the rest need one for some roles or
          some states.
        </p>
        <h2>The pattern</h2>
        <p>
          Licensing clusters by field, and it clusters hard. A nurse's entire
          top ring is licensed: nurse practitioner, dietitian, physical
          therapist, pharmacist, therapist. Healthcare does not have adjacent
          careers so much as adjacent credentials. An architect's ring is
          mixed: interior design is open in most states, structural and civil
          engineering need a <a className="gl" href="/glossary#pe-license">PE</a> (the professional-engineer license) for responsible charge, construction
          management needs nothing but scars. A software engineer's ring is
          almost entirely open, which is one unglamorous reason technology
          careers move faster: the exits have no tollbooths.
        </p>
        <table className="post-table">
          <caption>Two rings, two licensing worlds · PivotHop, July 2026</caption>
          <thead><tr><th>Registered nurse's top exits</th><th>Gate</th><th>Software engineer's top exits</th><th>Gate</th></tr></thead>
          <tbody>
            <tr><td>Nurse practitioner (77%)</td><td><strong>License</strong></td><td>AI engineer</td><td>none</td></tr>
            <tr><td>Dietitian (74%)</td><td><strong>License</strong></td><td>DevOps engineer</td><td>none</td></tr>
            <tr><td>Physical therapist (68%)</td><td><strong>License</strong></td><td>Data engineer</td><td>none</td></tr>
            <tr><td>Therapist (67%)</td><td><strong>License</strong></td><td>Backend developer</td><td>none</td></tr>
            <tr><td>Pharmacist (65%)</td><td><strong>License</strong></td><td>Security engineer</td><td>none</td></tr>
          </tbody>
        </table>
        <p>
          A caution on geography before anyone books an exam: the licensing
          map is state-shaped. Interior design is title-regulated in some
          states and open in most. Dietitian licensure covers most of the
          country but not all of it. Our annotations describe the common US
          case, and the specific state you live in can move a route from
          gated to open, which is occasionally the cheapest relocation
          argument anyone will ever hand you.
        </p>
        <p>
          This changes how you should read a match percentage. Our instrument
          might say you are <strong>63 percent ready</strong> for pharmacist, and that number is
          true of your skills. It is silent about the doctorate unless we say
          it out loud, so we do: every licensed destination in the product
          carries a plain label, licensed profession, with the specific gate
          named. A route through a license is not worse, just financed differently: you repay it in years instead of applications.
        </p>
        <h2>Half-life arithmetic</h2>
        <p>
          The calculation that matters is a short one. Suppose the move you want pays
          40 percent more but needs a two-year credential. If you are ten
          years from the end of your working life, the raise pays for the
          gate several times over. If you are three years out, it may never
          break even. Licenses convert career changes from a skills question
          into a time-horizon question, which is why the same route can be
          right at 35 and wrong at 58. Any tool that shows you the salary
          without the gate is doing arithmetic with half the numbers.
        </p>
        <Sources>
          <p>
            PivotHop July 2026 run. Route set: top 8 destinations per
            occupation across 139 origins, 1,112 routes. Licensing annotations
            hand-reviewed for 40 occupations covering required, partial, and
            open cases; US-centric, verified against state board summaries.
            The percentages will drift as the graph grows. The pattern has
            not.
          </p>
        </Sources>
      </>
    ),
  },

  {
    slug: 'most-transferable-skills',
    title: 'The 15 most transferable skills of 2026, measured across 132 professions',
    pillar: 'What Carried Over',
    date: 'July 2026',
    dek: 'We counted which skills appear in the hiring demand of the most occupations. Data analysis and monitoring tie at the top, and generative AI just cracked the list.',
    minutes: 7,
    faq: [
      { q: 'What is the most transferable skill in 2026?', a: 'By our measurement, data analysis and systems monitoring tie at the top: each appears meaningfully in the hiring demand of 40 of the 132 occupations we track, ahead of project management at 33.' },
      { q: 'Is AI a transferable skill now?', a: 'Yes, and recently. Working with large language models appears in the demand profile of 16 different occupations in our July 2026 corpus, from marketing to law to engineering. A year ago it was confined to a handful of research roles.' },
      { q: 'How do I identify my own transferable skills?', a: 'List what you do in a normal week, not what your degree says. Then check which other professions ask for those exact activities in their postings. Our free instrument does that lookup against live postings for 148 occupations.' },
    ],
    body: (
      <>
        <p>
          The phrase transferable skills usually arrives without evidence, a
          comfort blanket in a career book. We wanted the counted version, so we asked a blunt question of our posting corpus: which skills appear in
          the hiring demand of the most different occupations? Not which skills
          sound portable. Which ones employers in unrelated fields actually put
          in writing.
        </p>
        <p>
          The answer, across <strong>132 occupations</strong> with enough postings to trust:
          <strong> data analysis and systems monitoring tie at the top</strong>,
          each appearing meaningfully in the demand of <strong>40 occupations</strong>.
        </p>
        <div className="post-bars">
          {[['Data analysis', 40], ['Systems monitoring', 40], ['Project management', 33], ['Supply chain', 30], ['Training & facilitation', 28], ['Customer service', 22], ['Process improvement', 21], ['Python', 20], ['<a className="gl" href="/glossary#sql">SQL</a> (the standard database query language)', 19], ['Professional writing', 19]].map(([k, v]) => (
            <div key={String(k)} className="pb-row"><span className="k">{k}</span><span className="t"><span className="f" style={{ width: `${(Number(v) / 40) * 100}%` }}></span></span><span className="v">{v}</span></div>
          ))}
        </div>
        <p>
          Presentation and accounting follow at 18 occupations each, prototyping
          and procurement at 17.
        </p>
        <p>
          And at number fifteen, the newcomer: working with large language
          models, named in the demand of <strong>16 different occupations</strong>. Not just AI
          companies. Marketing teams, law firms, logistics operators. A skill
          that did not exist as a hiring term three years ago now travels better
          than most things taught in a four-year degree.
        </p>
        <h2>What the top of the list has in common</h2>
        <p>
          Look at the winners again. Almost none of them are tools. Data
          analysis is a habit of asking what the numbers say before deciding.
          Project management is the craft of getting a group to a date. Training
          is explaining things so they stick. The market pays for these
          everywhere because every organization above a certain size has the
          same three problems: information, coordination, and people who need to
          learn things.
        </p>
        <p>
          The tools on the list, Python and SQL, are the exception that proves
          it. They travel because they are the grammar of the data habit, not
          because anyone loves the syntax. Nobody ever kept a job by knowing
          semicolons.
        </p>
        <h2>The practical read</h2>
        <p>
          If you are mid-career and worried your experience is too specific,
          this list is both the antidote and the assignment. Go through a normal week
          and write down every hour that was actually data analysis, project
          coordination, training, or writing, whatever your title called it.
          That inventory is your passport. Job titles do not transfer. Weeks do.
        </p>
        <p>
          Then, if you want the empirical version of the exercise, type your job
          into the instrument on our front page and edit the skill list until it
          matches your real week. The graph recomputes around you. The
          destinations that light up are the ones already paying for the hours
          you have been giving away under a different name.
        </p>
        <h2>Where this leaves you</h2>
        <p>
          Transferable skills are real, but they are not the vague virtues on a
          resume template. They are specific, countable, and unevenly
          distributed across your week. The market has already voted on which
          ones travel. The list above is the ballot, counted. The only part it
          cannot do is tell you which of those hours you would happily do more
          of. That part stays yours.
        </p>
        <Sources>
          <p>
            PivotHop pipeline, July 2026 run: 74,470 mapped postings across
            thirteen sources, 246-skill dictionary, occupations with at least 50
            postings (132 qualified). A skill counts toward an occupation when
            it appears in at least 3 percent of that occupation's postings.
            Rankings are stable across the last four weekly runs; exact counts
            drift as postings accumulate.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'career-change-at-40',
    title: 'Changing careers at 40: the arithmetic nobody puts in the pep talk',
    pillar: 'Run It 10,000 Times',
    date: 'July 2026',
    dek: 'At 40 you have roughly 25 working years left, which changes which moves pay off. The math on licenses, pay cuts, and the license-free raises most people never hear about.',
    minutes: 7,
    faq: [
      { q: 'Is 40 too old to change careers?', a: 'No, and the arithmetic is on your side: at 40 you typically have 25 or more working years left, which is enough time for even a two-year retraining to pay back many times over. The moves that stop making sense at 40 are a much smaller set than the pep talks or the doom threads suggest.' },
      { q: 'Will I have to take a pay cut if I change careers at 40?', a: 'Not necessarily. In our measurement of 148 strong career adjacencies, 36 percent point to a destination with a higher posted salary midpoint than the origin. The cut is a risk, not a rule.' },
      { q: 'What careers can I switch into without going back to school?', a: 'In our data the largest license-free raises for well-matched movers include bookkeeper to financial controller (+111 percent), sales representative to customer success manager (+68), and accountant to financial controller (+52). None requires a new degree, though some employers prefer certifications.' },
    ],
    body: (
      <>
        <p>
          Career change at 40 gets discussed as a feelings problem. It is mostly an arithmetic problem, and the arithmetic is friendlier than the forums suggest. The whole calculation fits in four short sections, with numbers attached.
        </p>
        <h2>The time horizon is the variable that matters</h2>
        <p>
          At 40 you have, give or take, <strong>25 working years left</strong>. That is more
          career remaining than a 22-year-old has spent in school, total, since
          kindergarten. It is enough runway to amortize almost any retraining.
          A two-year credential that unlocks a 40 percent raise pays for itself
          several times before you are 50. The same move at 58 might never break
          even. Most advice fails by ignoring this variable entirely, in both
          directions: it tells 40-year-olds they are too old and 58-year-olds to
          follow their passion into a five-year licensure path.
        </p>
        <h2>The pay cut is a risk, not a rule</h2>
        <p>
          The standard assumption is that changing fields means starting over on
          salary. We measured it. Across <strong>148 strong adjacencies</strong> in our graph,
          moves where your current skills already cover at least half of what the destination asks for, <strong>36 percent point somewhere that posts a higher salary midpoint</strong> than where you started. <strong>One move in three is a raise</strong>, not a sacrifice. The trick is that those moves are unevenly
          advertised: nobody recruits you into them, because recruiters search
          titles and your title is wrong.
        </p>
        <h2>The license question, answered with a table</h2>
        <p>
          The biggest raises in our data hide behind licenses, which is exactly
          the wrong shape for a 40-year-old in a hurry. So we cut the table the
          other way and kept only license-free destinations. The best
          well-matched, no-new-degree raises right now: bookkeeper to financial controller at <strong>plus 111 percent</strong>, sales representative to customer
          success manager at plus 68, accountant to financial controller at
          plus 52, architectural drafter to <a className="gl" href="/glossary#mep">MEP</a> (mechanical, electrical, and plumbing engineering) engineering at plus 52,
          architect to electrical engineering at plus 50, customer support to
          executive assistant at plus 47. Some employers will want a
          certification. None requires going back to school.
        </p>
        <h2>What 40 actually changes</h2>
        <p>
          Two things, honestly. First, you have less patience for prestige
          ladders, which is an advantage: the moves above are unglamorous and
          underpriced precisely because 25-year-olds ignore them. Second, your
          transferable inventory is larger than you think and larger than
          yours was at 30. Twenty years of work builds exactly the skills that
          our cross-occupation demand data ranks highest: coordination,
          analysis, training, writing. The things juniors are worst at are the
          things you have been doing on autopilot for a decade.
        </p>
        <h2>Where this leaves you</h2>
        <p>
          Run the numbers before the feelings. Your remaining years, the overlap between your week and the destination's postings,
          the pay delta, and the gate. If the move clears that arithmetic, the
          age question answers itself. If it does not clear the arithmetic, no
          amount of motivation fixes it, and knowing that early is a gift. The
          instrument on our front page runs the overlap and flags the gates.
          The calendar math you can do on a napkin.
        </p>
        <Sources>
          <p>
            Adjacency and premium figures from the PivotHop July 2026 run
            (74,470 mapped postings; strong adjacency means at least 50 percent
            skill coverage; salary midpoints require at least 20 salaried
            postings on both ends). Licensing annotations hand-reviewed for 40
            occupations, US-centric. Working-years arithmetic assumes retirement
            between 65 and 67; adjust for your country and plans.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'jobs-for-nurses-leaving-the-bedside',
    title: 'Where nurses actually go when they leave the bedside',
    pillar: 'Career Half-Life',
    date: 'July 2026',
    dek: 'We mapped 1,698 nursing postings against every other profession. The five best-matched exits are all licensed, which tells you something true about healthcare careers.',
    minutes: 6,
    faq: [
      { q: 'What jobs can a nurse transition to?', a: 'By measured skill overlap, the best-matched destinations from registered nursing are nurse practitioner (77 percent), dietitian (74), physical therapist (68), therapist or counselor (67), and pharmacist (65). Every one requires its own license; social work (49 percent) requires one only for clinical roles.' },
      { q: 'Can nurses work remotely?', a: 'Some do: telehealth triage, case management, utilization review, and clinical informatics postings appear in our corpus, but they are a small minority of nursing-adjacent demand. Most well-matched nursing exits remain in-person work.' },
      { q: 'Do nurses take a pay cut when they leave?', a: 'Depends entirely on the exit. The blended market median for US registered nurses in our data is about 96,500 dollars, which is higher than several common exits and lower than the licensed clinical destinations like nurse practitioner or pharmacist.' },
    ],
    body: (
      <>
        <p>
          Nursing produces more exit talk than almost any profession, for
          reasons that need no explanation to anyone who has worked a floor
          shift. We wanted destination data instead of discourse, so we mapped <strong>1,698 live nursing postings</strong> against every other profession we track. What comes back is coherent, a little sobering, and more
          useful than the listicles.
        </p>
        <h2>The five best exits are all licensed</h2>
        <p>
          By skill overlap, the destinations that best match what nursing
          postings already ask for: <strong>nurse practitioner at 77 percent</strong>, dietitian at 74, physical therapist at 68, therapist or counselor at 67,
          pharmacist at 65. Then social work at 49, licensed only for clinical
          roles.
        </p>
        <p>
          <strong>Every single top exit runs through a license.</strong>
          Healthcare does not really have adjacent careers; it has adjacent
          credentials. The skills transfer beautifully, patient assessment,
          documentation, care coordination, pharmacology basics, and then a
          state board stands at the door of each destination asking for two to
          six more years. None of that argues for staying put. It argues for treating a nursing exit as a time-horizon decision rather than a skills decision. The skills were never the problem.
        </p>
        <h2>The un-glamorous middle path</h2>
        <p>
          Below the licensed tier sits a quieter set of moves the forums rarely
          mention: case management, clinical research coordination, utilization
          review, health education, clinical informatics. Lower ceremony, no
          new license in most states, and they trade on exactly the parts of
          nursing that transfer without a board exam: judgment, documentation
          discipline, and the ability to talk to both patients and physicians
          without losing anything in translation. The pay is usually a lateral
          step from the blended US nursing median of about <strong>96,500 dollars</strong> in our data, sometimes a small raise with seniority.
        </p>
        <h2>About remote work, honestly</h2>
        <p>
          Remote nursing-adjacent work exists, telehealth triage and remote
          case review appear in our corpus, but it is a thin slice of demand,
          and it is competitive precisely because every tired nurse in the
          country has the same idea at 3 a.m. Treat remote as a bonus feature
          of a destination you would want anyway, not as the destination.
        </p>
        <h2>Where this leaves you</h2>
        <p>
          If you are a nurse running the exit math, the data says three things.
          Your skills are not the obstacle; they cover two thirds of several
          other professions already. The licensed exits are real but they are
          loans, repaid in years, so run them against your horizon. And the
          middle path out of the bedside, into coordination and informatics,
          is shorter than the discourse admits and does not require explaining
          a gap to anyone. The one thing the data cannot measure is what the
          floor is costing you. Weigh that part heavier than any table.
        </p>
        <Sources>
          <p>
            PivotHop July 2026 run: 1,698 postings mapped to registered
            nursing; overlap computed over each destination's top-20 posting
            skills; salary is the blended US median (postings shrunk toward the
            <a className="gl" href="/glossary#bls">BLS</a> <a className="gl" href="/glossary#oews">OEWS</a> (the Bureau of Labor Statistics wage survey) anchor). Licensing annotations hand-reviewed. Telehealth
            demand read from remote-flagged postings in nursing-adjacent
            occupations.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'how-to-become-an-ai-engineer',
    title: 'How people actually become AI engineers, according to 670 salary postings',
    pillar: 'Shape of Work',
    date: 'July 2026',
    dek: 'The blended US median is about 150,000 dollars, the doorway professions are wider than the degree myth suggests, and one of the best on-ramps is a sales job.',
    minutes: 7,
    faq: [
      { q: 'How much do AI engineers make in 2026?', a: 'In our data the blended US median for AI engineers is about 150,500 dollars, computed from 670 salary observations shrunk toward the official BLS anchor for the occupation family. Posted asking salaries run higher than official statistics, which is documented posting-market skew.' },
      { q: 'Can I become an AI engineer without a computer science degree?', a: 'The postings suggest yes: demand centers on demonstrable skills (Python, LLM application work, retrieval systems, evaluation) rather than credentials, and the best-matched origin professions include sales engineering at 50 percent overlap, where no CS degree is typical.' },
      { q: 'Which jobs are closest to AI engineering?', a: 'By measured skill overlap: machine learning engineer (59 percent), sales engineer (50), software engineer (46), data scientist (45), and solutions architect (45). From the other direction, AI engineering itself opens toward prompt engineering and research science.' },
    ],
    body: (
      <>
        <p>
          AI engineer went from a curiosity title to <strong>943 postings</strong> in our corpus
          inside a year, and <strong>670</strong> of them state pay. The blended US median lands
          at about <strong>150,500 dollars</strong>. That much everyone suspected. What the
          reach table shows is less expected, and more useful if you are
          standing outside the field wondering about the door.
        </p>
        <h2>The doorway professions, counted</h2>
        <p>
          We compute, for every occupation, how much of an AI engineer's posted
          skill demand it already covers. Machine learning engineer leads, no
          surprise. Then comes the surprise in row two:
        </p>
        <table className="post-table">
          <caption>Skill coverage toward AI engineer, by origin profession · PivotHop, July 2026</caption>
          <thead><tr><th>Coming from</th><th className="num">Coverage</th></tr></thead>
          <tbody>
            <tr><td>Machine learning engineer</td><td className="num">59%</td></tr>
            <tr><td><strong>Sales engineer</strong></td><td className="num"><strong>50%</strong></td></tr>
            <tr><td>Software engineer</td><td className="num">46%</td></tr>
            <tr><td>Data scientist</td><td className="num">45%</td></tr>
            <tr><td>Solutions architect</td><td className="num">45%</td></tr>
            <tr><td>DevOps engineer</td><td className="num">39%</td></tr>
            <tr><td>Research scientist</td><td className="num">34%</td></tr>
            <tr><td>Product manager</td><td className="num">31%</td></tr>
          </tbody>
        </table>
        <p>
          A sales job, half way to the hottest engineering title of the decade.
          It stops being strange when you read what AI engineer postings
          actually ask for. Yes, Python and model APIs. But also: explaining
          model behavior to non-technical stakeholders, scoping what a system
          should do, building demos, evaluating output quality against fuzzy
          requirements. That is half a sales engineer's week. The industry
          quietly needs people who can make AI systems legible to buyers and
          bosses, and it needs them as much as it needs another fine-tuning
          script.
        </p>
        <h2>What the postings ask for, in order</h2>
        <p>
          Across the AI engineer corpus, the recurring demands are working with
          large language models and their APIs, Python, retrieval systems and
          vector search, deployment and monitoring, evaluation methodology, and
          the connective skills: writing, stakeholder communication, and
          product sense. Degrees appear in postings less often than the folk
          wisdom claims. Portfolios of working systems appear constantly, in
          the requirements, in the nice-to-haves, in the interview
          descriptions.
        </p>
        <h2>An honest note on the salary number</h2>
        <p>
          Posted AI salaries run hot relative to official statistics; our
          reconciliation layer flags the gap at over 100 percent against the
          government anchor for the occupation family, the widest skew in our
          data. Some of that is real scarcity pricing. Some is asking-price
          inflation and remote-tech posting bias. Our 150,500 figure already
          blends toward the official anchor. Treat glossier numbers you see
          elsewhere accordingly.
        </p>
        <h2>Where this leaves you</h2>
        <p>
          If you are in one of the doorway professions, the gap between you and
          the title is smaller than the mythology says and it is made of
          specific, learnable things: <a className="gl" href="/glossary#llm">LLM</a> (large language model) application work, retrieval, and
          evaluation, stacked on skills you already use. Build two working
          systems you can show, learn to talk about their failure modes
          honestly, and you look like the postings. If you are not in a doorway
          profession yet, the table above is a map of intermediate steps.
          Nobody needs to start over. That is the whole point of measuring
          adjacency instead of guessing at it.
        </p>
        <Sources>
          <p>
            PivotHop July 2026 run: 943 AI engineer postings, 670 with stated
            pay; blended median shrinks posting percentiles toward the <a className="gl" href="/glossary#bls">Bureau of Labor Statistics</a> (BLS)
            <a className="gl" href="/glossary#oews">Occupational Employment and Wage Statistics survey</a> (OEWS) anchor for the occupation family (empirical Bayes, K=40).
            Reach percentages are destination-demand coverage over top-20
            posting skills. Reconciliation deviations published in our salary
            method notes.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'should-i-leave-architecture',
    title: 'Should you leave architecture? Read the numbers before the forum threads',
    pillar: 'Career Half-Life',
    date: 'July 2026',
    dek: 'The exits from architecture are real, measured, and mostly pay more. What 1,178 postings say about the profession, and the one question the data cannot answer for you.',
    minutes: 8,
    faq: [
      { q: 'What can architects do besides architecture?', a: 'By measured skill overlap in July 2026: interior design (66 percent match), electrical engineering (57), structural engineering (52), landscape architecture (51), and mechanical engineering (49), with construction management, estimating, and BIM management close behind. Sustainability consulting scores in the nineties for architects with energy-modeling experience.' },
      { q: 'Do architects get paid more if they leave?', a: 'Often, yes. The blended US median for architects in our data is about 83,700 dollars; structural engineers post about 107,000, a 28 percent difference, and several other engineering destinations price similarly. The gap is partly a licensing and liability story, not just a skills story.' },
      { q: 'Is architecture a dying profession?', a: 'No. Our corpus holds 1,178 live architect postings and demand for sustainability skills inside the profession is rising fast. What the data does show is a pay gap against adjacent engineering fields and a demand profile weighted toward coordination over design, which is why exits are common around mid-career.' },
    ],
    body: (
      <>
        <p>
          Every architect knows the thread. Someone three years out of school
          asks whether to leave, forty replies say the profession is doomed,
          twelve say follow your passion, and nobody posts a number. We built
          the numbers. What follows is what 1,178 live architect postings and the
          adjacency graph around them actually say, from a team whose founder
          drew construction sets for years before writing a line of this
          pipeline.
        </p>
        <h2>What the market says architecture is</h2>
        <p>
          The demand profile first, because it explains the itch. The top
          skills employers name when hiring architects: Revit, sustainability,
          project management, specification writing, construction
          documentation. The coordination cluster outweighs the design
          cluster. School sells a design career; the postings describe a
          coordination career with design attached. If your dissatisfaction
          is that the job is not what the studio promised, the data agrees
          with you. That is not burnout. That is accurate perception.
        </p>
        <h2>The exits, priced</h2>
        <p>
          The routes out, scored: <strong>interior design at 66 percent</strong> skill match, electrical engineering at 57, structural at 52, landscape at 51,
          mechanical at 49. Construction management and estimating sit just
          behind, and for architects who can show real energy modeling, our
          personalized model scores sustainability consulting in the
          nineties.
        </p>
        <p>
          Now the pay, which the threads never quantify. The blended US median for architects in our data is about <strong>83,700 dollars</strong>. Structural engineers: about <strong>107,000</strong>. That is a <strong>28 percent gap</strong> between two
          professions that share half their skill demand and often the same
          hallway. Electrical engineering prices similarly. Part of the gap is
          the <a className="gl" href="/glossary#pe-license">PE</a> (the professional-engineer license) license and the liability it carries. Part of it is that
          engineering fees never got culturally negotiated down the way design
          fees did. Either way, the gap is real, durable across our runs, and
          it flows toward people willing to carry calculations instead of
          drawings.
        </p>
        <h2>The part the forums get wrong in both directions</h2>
        <p>
          The doom caucus is wrong: 1,178 live postings is not a dying
          profession, and the sustainability wave is creating architect demand
          that did not exist five years ago. The passion caucus is also wrong:
          passion does not close a 28 percent structural pay gap, and telling
          people to ignore it is telling them to donate the difference to
          their employer. The honest frame is neither. Architecture is a viable profession with a visible discount attached, surrounded by
          well-matched exits that mostly price higher. Staying is defensible, and so is leaving. The one position the data refuses to support is staying while believing you have no options.
        </p>
        <h2>Where this leaves you</h2>
        <p>
          Separate two questions the threads always merge. First: can you leave? On the numbers, yes, in several directions, often at a raise, and
          the gaps are specific skills, not new degrees. Second: should you?
          That depends on which hours of your week you want more of, and no
          scraper reaches that data. What we can do is make the first question settled and numeric, so you can spend your energy on the
          second one, which was always the real question anyway. Type
          architect into the instrument, edit the skills until it looks like
          your actual week, and see your own map. The forum will still be
          there afterward. You will need it less.
        </p>
        <Sources>
          <p>
            PivotHop July 2026 run: 1,178 architect postings; route matches
            are destination-demand coverage over top-20 posting skills;
            salaries are blended US medians (postings shrunk toward <a className="gl" href="/glossary#bls">BLS</a> <a className="gl" href="/glossary#oews">OEWS</a> (the Bureau of Labor Statistics wage survey)
            anchors; architect n=433 posted observations, structural engineer
            similar). Sustainability route score from the personalized model
            with energy modeling and <a className="gl" href="/glossary#leed">LEED</a> (the green-building certification) added. The founder's bias is
            disclosed and the method is public on the About page.
          </p>
        </Sources>
      </>
    ),
  },

  {
    slug: 'cluely-and-the-attention-economy',
    title: 'Cluely, rage bait, and what the attention economy pays for',
    pillar: 'Shape of Work',
    date: 'July 2026',
    dek: 'A startup built on the slogan cheat on everything raised millions, hit a 120 million dollar valuation, and then admitted its headline revenue was invented. There is a career lesson in here, and it is not the one the founders think.',
    minutes: 7,
    body: (
      <>
        <p>
          If you missed the saga: Cluely launched in 2025 as an invisible AI
          assistant with the slogan cheat on everything, engineered its own
          outrage cycle on purpose, and rode the anger to a <strong>15 million dollar round</strong> from Andreessen Horowitz and a valuation around <strong>120 million</strong>.
          The founder gave interviews explaining that provocation was the
          strategy. Rage bait as go-to-market, said out loud, with a straight
          face.
        </p>
        <p>
          Then, in March 2026, the same founder posted that the <strong>7 million dollars in annual recurring revenue</strong> he had told TechCrunch about the previous summer was, in his words, blatantly dishonest. A formal
          retraction, on X, of a number that had been load-bearing for the
          whole story. The apology tour then misstated how the original
          interview came about, which TechCrunch also documented. You could
          not write a cleaner parable if you tried.
        </p>
        <h2>The uncomfortable part: it worked</h2>
        <p>
          The honest analysis has to start here. The attention strategy did
          exactly what it was designed to do. It converted outrage into
          awareness, awareness into a term sheet, and a term sheet into a
          company that employs real people at real salaries. Anyone who tells
          you attention engineering is not a skill has not watched a nobody
          become a household name in tech on a marketing budget of zero. In
          the careers we track, the growth and marketing roles increasingly
          ask for exactly this: the ability to manufacture a moment. It pays.
        </p>
        <h2>The part they leave out of the playbook</h2>
        <p>
          Attention is a loan, and the collateral is credibility. The revenue
          confession is what a margin call looks like. Once your numbers have
          been publicly wrong on purpose, every future number you publish
          costs more to believe, and companies run on believed numbers:
          revenue for investors, salaries for candidates, benchmarks for
          customers. The rage-bait playbook has a chapter missing, and it is
          the one where the loan comes due at the exact moment you need to be
          taken literally.
        </p>
        <h2>What this means if you work in tech</h2>
        <p>
          Two practical readings. If you are considering joining a
          high-attention startup, do the diligence the founders are daring
          you to skip: ask for the number behind the number, and notice
          whether the company's public claims have survived contact with a
          journalist. A company that lies about revenue at seed will
          negotiate your equity refresh with the same instrument.
        </p>
        <p>
          And if you are building a career in growth or marketing, learn the
          skill without inheriting the ideology. The measurable version of
          attention work, the campaigns with numbers you can defend in a
          hiring interview two jobs later, compounds. The stunt version has
          the same half-life as the outrage it borrowed. Recruiters remember
          both kinds. So do juries, occasionally.
        </p>
        <h2>Where this leaves you</h2>
        <p>
          We run a product whose entire bet is the opposite of Cluely's: that
          numbers people can check beat stories people want to believe,
          eventually, and that eventually is shorter than it looks. The
          March confession did not surprise anyone who holds that bet. The
          market for attention is real and it pays fast. The market for
          being believed pays slower and much longer. Pick your market
          knowingly. That is the whole lesson, and nobody has to cheat on
          anything to learn it.
        </p>
        <Sources>
          <p>
            Cluely funding, valuation, slogan, and strategy: TechCrunch
            reporting, June and July 2025. The revenue retraction and its
            aftermath: TechCrunch, March 5, 2026, and the founder's own
            public statements. Our characterization of growth-role demand is
            from the PivotHop posting corpus. No numbers in this piece were invented.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'forward-deployed-engineer',
    title: 'The forward-deployed engineer: the job title quietly eating AI hiring',
    pillar: 'Unbundle the Job',
    date: 'July 2026',
    dek: 'There are 337 forward-deployed engineer postings in our corpus right now, more than four times the count for prompt engineers. What the role is, who it fits, and why the AI labs invented a field job.',
    minutes: 7,
    faq: [
      { q: 'What is a forward-deployed engineer?', a: 'An engineer who works inside customer organizations to make a complex product actually function there: integration, configuration, last-mile problem solving, and translating between the customer and the product team. The title comes from Palantir and has been adopted across AI companies as models turned out to need heavy on-site adaptation.' },
      { q: 'How much do forward-deployed engineers make?', a: 'Postings rarely separate the title in salary data, but the adjacent measured bands in our corpus put comparable roles between roughly 140,000 and 150,000 dollars US median: solutions architects at about 146,000 and sales engineers at about 140,000, with AI engineers at about 150,500.' },
      { q: 'What background do you need for forward-deployed roles?', a: 'The measured profile is hybrid: real coding ability plus customer-facing composure. In our adjacency data the professions closest to this mix are sales engineering, solutions architecture, and consulting backgrounds with technical depth. A pure research profile is usually a worse fit than a builder who can run a meeting.' },
    ],
    body: (
      <>
        <p>
          Our corpus currently holds <strong>337 postings</strong> with forward deployed in the title. For scale, that is more than four times the number of prompt
          engineer postings, a title that got a thousand thinkpieces. Nobody
          writes thinkpieces about forward-deployed engineers. Companies just
          keep hiring them, which is usually the better signal.
        </p>
        <h2>What the job actually is</h2>
        <p>
          The title is Palantir lineage: engineers embedded with the customer,
          in their systems and their meetings, making an ambitious product
          work in a specific messy reality. The AI industry adopted it for a
          simple reason. Models demo beautifully and deploy painfully. Between
          a foundation model and a working system inside an insurer or a
          hospital chain sits a canyon of integration, evaluation, data
          plumbing, and organizational translation. Someone has to live in
          that canyon. The labs named the someone.
        </p>
        <h2>Who the role fits, according to the postings</h2>
        <p>
          Read a batch of these postings and a profile emerges: writes real
          code, runs real meetings, tolerates ambiguity, can tell a customer
          no without losing the account, can tell the product team the
          customer is right without losing face. In our adjacency graph, the professions whose skills sit closest to that mix are sales
          engineering and solutions architecture, which lines up with the strangest number in our AI analysis: sales engineers already cover <strong>50 percent of AI engineer demand</strong>, ahead of software
          engineers. The industry needs translators with commit access, and
          it has needed them for a while.
        </p>
        <h2>The money and the trade</h2>
        <p>
          Salary data rarely breaks out the exact title, but the neighboring roles bracket it well: solutions architects at about <strong>146,000 dollars</strong> US blended median in our data, sales engineers around 140,000, AI engineers about <strong>150,500</strong>. The trade is travel, customer
          hours, and the particular exhaustion of being permanently between
          two organizations. The reward, beyond the band: forward-deployed
          work generates the rarest kind of resume line, provable impact at
          named customers, which converts into product, founding, and
          leadership roles unusually well. It is the apprenticeship the AI
          industry accidentally rebuilt.
        </p>
        <h2>Where this leaves you</h2>
        <p>
          If you are technical but energized by people, or customer-facing
          but underestimated technically, this title is the market catching
          up to your shape. It does not require a research pedigree. It
          requires the hybrid week most job titles force you to hide. The
          337 postings are the market saying the hybrid is the job now. Say
          yes while the title still sounds niche; the good arbitrage never
          lasts.
        </p>
        <Sources>
          <p>
            Title counts from the PivotHop raw corpus, July 2026 (99,000
            postings across thirteen sources; regex on titles). Salary bands
            are blended US medians from our salary engine (postings shrunk
            toward <a className="gl" href="/glossary#bls">BLS</a> <a className="gl" href="/glossary#oews">OEWS</a> (the Bureau of Labor Statistics wage survey) anchors). The sales-engineer reach figure is
            destination-demand coverage from the adjacency model.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'job-titles-born-since-2023',
    title: 'Nine job titles that did not exist in 2023, counted in the wild',
    pillar: 'Shape of Work',
    date: 'July 2026',
    dek: 'We watch new titles being born in the posting stream. Forward-deployed engineers, agentic everything, model evaluators, red-teamers: the census of the AI labor market\u2019s nursery.',
    minutes: 6,
    faq: [
      { q: 'What new jobs has AI created?', a: 'In our July 2026 corpus the measurable new titles are forward-deployed engineer (337 postings), agentic roles (188), prompt engineer (72), model evaluator (13), AI red-teamer (11), and AI safety roles (11), alongside established-but-transformed titles like AI engineer at 943 postings.' },
      { q: 'Is prompt engineering still a career in 2026?', a: 'It is consolidating rather than growing: 72 raw postings in our corpus against 943 for AI engineer, and our adjacency data shows prompt engineering skills folding into the broader AI engineer role, which posts a US median about 48,000 dollars higher.' },
    ],
    body: (
      <>
        <p>
          Job titles are born in postings before they exist anywhere else.
          Before the bootcamps, before the LinkedIn headlines, someone in a
          hiring committee has to type a phrase into a job board for the
          first time. Because we read the boards daily, we get to watch the
          nursery. The July 2026 census of titles that were not a thing in 2023, then.
        </p>
        <h2>The census</h2>
        <p>
          <strong>Forward-deployed engineer: 337 postings</strong>, the clear leader, covered
          at length in its own piece. Agentic roles, engineers and product people building AI agents: <strong>188 postings</strong> and climbing fast, the
          phrase spreading from labs into commerce and operations titles.
          Prompt engineer: 72 postings. Model evaluator: 13. AI red-teamer:
          11. AI safety roles: 11. Responsible AI titles: a handful.
          Growth engineer, the title Cluely-adjacent startups love: 3, which
          suggests the attention economy generates more discourse than
          headcount.
        </p>
        <h2>Which ones consolidate, which ones vanish</h2>
        <p>
          New titles follow one of two paths. Some consolidate into a broader
          role once the skill stops being exotic. Prompt engineering is
          visibly on this path: <strong>72 postings against 943</strong> for AI engineer, and
          in our adjacency graph the two roles overlap so heavily that the
          smaller one reads as a feature of the bigger one. The US median
          gap, about <strong>102,000 dollars for the specialist against 150,500 for the generalist</strong>, is the market pricing the consolidation in real
          time. Learn the skill, skip the title.
        </p>
        <p>
          Others stay narrow because they answer to regulation or risk
          rather than fashion. Red-teaming and model evaluation are small
          but stubborn: 24 postings between them, mostly at companies with
          compliance exposure, and they behave in the data like early
          security engineering did, a niche that becomes an institution
          because someone has to sign the audit. If you want a small pond
          with a moat, that corner is worth a look before the certification
          industry finds it.
        </p>
        <h2>How to read a newborn title</h2>
        <p>
          Three questions separate a career from a costume. Does the title
          describe work someone was already doing under an older name, or
          genuinely new work? Does demand come from many industries or one
          hype cluster? And does the pay carry a premium over the nearest
          established role, or a discount? Forward-deployed engineering
          passes all three. Prompt engineering passes none of them anymore.
          The agentic cluster passes the first two and is still arguing with
          the third. Check again next quarter; the nursery updates daily.
        </p>
        <h2>Where this leaves you</h2>
        <p>
          Chasing new titles is a bad strategy, and ignoring them is a
          slightly worse one. The winning move is to watch which newborn
          titles describe your existing week better than your current title
          does, then apply while the applicant pool is still confused. That
          window is the entire value of reading the nursery. It closes the
          day the bootcamps open.
        </p>
        <Sources>
          <p>
            Title counts: regex over titles in the PivotHop raw corpus, July
            2026, roughly 99,000 postings across thirteen sources. Salary
            medians from our blended engine (<a className="gl" href="/glossary#bls">BLS</a> <a className="gl" href="/glossary#oews">OEWS</a> (the Bureau of Labor Statistics wage survey) anchored). Counts are
            floors, not totals: our sources undersample some markets, and a
            title can exist in the wild before it reaches a board we read.
          </p>
        </Sources>
      </>
    ),
  },

  {
    slug: 'every-feed-is-the-same-machine',
    title: 'Google, TikTok, Instagram, X: four algorithms became the same machine',
    pillar: 'Shape of Work',
    date: 'July 2026',
    dek: 'In eighteen months, every major feed rebuilt itself around one architecture: a model that reads your content and predicts who will finish it. What converged, why it converged, and what it means for anyone who publishes anything.',
    minutes: 9,
    faq: [
      { q: 'How did the X algorithm change in 2026?', a: 'In January 2026 X replaced its legacy recommendation system with a Grok-based transformer model that reads posts and videos directly. Reported engagement weights are steep: a reply counts roughly 27 times a like, and a sustained conversation roughly 150 times, across about 5 billion ranking decisions a day.' },
      { q: 'What happened to the TikTok algorithm after the US deal?', a: 'After the January 2026 joint venture led by Oracle, Silver Lake, and MGX, the US recommendation system is being retrained on American user data as a separate fork, with reports through mid-2026. The ranking logic itself still centers on completion and depth signals like shares and saves, with the viral completion bar reported around 70 percent.' },
      { q: 'What do all the 2026 feed algorithms have in common?', a: 'Three things: they rank by predicted attention depth (watch time, completion, replies, sends) rather than declared relationships; they read the content itself with large models instead of relying on metadata and links; and they distribute by interest, which makes follower counts and backlink counts weaker currencies than they have ever been.' },
    ],
    body: (
      <>
        <p>
          For twenty years the big distribution systems were different
          machines. Google ranked pages by links. Twitter showed you who you
          followed, newest first. Instagram was a photo feed of your friends.
          TikTok was the weird one, guessing what strangers might watch.
          Then, in about eighteen months, all four quietly rebuilt themselves
          into the same machine, and almost nobody said it out loud.
        </p>
        <p>
          The machine works like this. Take everything that could be shown.
          Have a model read it, the actual content, not the metadata. Predict,
          per person, the probability that this specific human will give it
          deep attention: finish the video, reply to the post, send it to a
          friend, not click away from the answer. Rank by that prediction.
          Repeat billions of times a day.
        </p>
        <h2>The receipts, platform by platform</h2>
        <p>
          X made the loudest move: in January 2026 it discarded its legacy
          ranking stack entirely for a Grok-based transformer that reads every
          post and watches every video, making around <strong>5 billion ranking decisions daily</strong>. The reported weights tell you what the model is
          for. A reply counts roughly <strong>27 times a like</strong>. A genuine
          back-and-forth conversation, roughly 150 times. Likes, the currency
          of the 2010s, are now the copper coin. Even the Following feed is
          algorithmically re-sorted, which is a quiet way of saying the
          follow relationship no longer decides much.
        </p>
        <p>
          Instagram said it with a metric. Adam Mosseri spent 2025 telling
          creators that watch time ranks Reels and that sends per reach, the
          share of viewers who DM your content to someone, is weighted three
          to five times a like. Then the app consolidated everything into one
          number: views. Not followers. Views. When a platform renames its
          primary metric, it is telling you what its model optimizes.
        </p>
        <p>
          TikTok, which invented the machine, spent the period proving how
          valuable it is: the January 2026 US joint venture led by Oracle,
          Silver Lake, and MGX exists substantially because the algorithm
          could not simply be handed over, so it is being retrained on
          American data as a separate fork. Meanwhile the bar rose. The
          completion rate that used to trigger wide distribution, around
          half, is now reported near <strong>70 percent</strong>. The machine got pickier as
          everyone learned to feed it.
        </p>
        <p>
          And Google, the biggest publisher-facing change of all: AI
          Overviews went from about 6.5 percent of queries in January 2025 to
          roughly <strong>48 percent of searches</strong> by early 2026, and somewhere between
          <strong>58 and 68 percent of searches</strong> now end with no click to any website.
          In the fully conversational AI Mode, the no-click figure reportedly
          reaches 93 percent. Google still reads the web. Increasingly, it
          reads it so you do not have to.
        </p>
        <h2>Why they all converged</h2>
        <p>
          Not conspiracy. Economics plus capability. Every one of these
          companies sells attention to advertisers, so every one of them is
          paid in retention, and retention is best predicted by deep
          engagement signals, not declared relationships. That pressure
          always existed. What changed is capability: models got good enough
          to read the content itself, cheaply, at feed scale. Once you can
          score a video by watching it, links and follows and keywords are
          just noisy proxies you no longer need. Each platform reached the
          same conclusion because each was solving the same equation with the
          same new tool.
        </p>
        <h2>What it means if you publish anything</h2>
        <p>
          First, audiences are rented by the piece now. A follower count is a
          mailing list the platform charges you to use; every post starts
          nearly from zero and earns distribution on its own predicted depth.
          Second, the openings are everything: the three-second rule on
          video, the first sentence of an answer, because the model samples
          before it commits. Third, depth beats breadth everywhere at once:
          one piece that 70 percent of viewers finish outranks five pieces
          they skim, on every platform, simultaneously, because it is the
          same machine. And fourth, for the written web specifically: being
          the source a model cites has replaced being the link a person
          clicks, which favors pages with verifiable, unusual substance over
          pages with volume.
        </p>
        <h2>Where this leaves you</h2>
        <p>
          The convergence is bad news for tactics and good news for material.
          Every trick tuned to one platform's quirks depreciates, because
          the quirks are being replaced by models that read like careful
          humans. What survives is what would survive a careful human:
          things worth finishing, worth replying to, worth sending to a
          friend, worth citing. The four machines disagree about formats and
          durations. About substance, for the first time, they all agree.
        </p>
        <Sources>
          <p>
            X: Grok-based rebuild and engagement weights as reported by
            platform analyses of the 2026 ranking system. Instagram: Adam
            Mosseri's public statements on watch time, sends per reach, and
            the views metric, 2025. TikTok: joint-venture reporting (Oracle,
            Silver Lake, MGX, January 2026) and creator-analytics data on
            completion thresholds. Google: AI Overview trigger rates and
            zero-click ranges from Semrush and independent <a className="gl" href="/glossary#seo">SEO</a> (search engine optimization) telemetry,
            2025 to 2026. Figures are the platforms' and analysts' claims,
            dated in text; feeds change faster than citations.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'seo-died-again',
    title: 'SEO died again in 2026. What the survivors are doing differently',
    pillar: 'Run It 10,000 Times',
    date: 'July 2026',
    dek: 'Half of Google searches now show an AI answer and most end without a click. The discipline is not dead, but it has been reorganized around one question: what makes a machine cite you?',
    minutes: 8,
    faq: [
      { q: 'Is SEO dead in 2026?', a: 'The clicks-from-rankings version is shrinking fast: AI Overviews appear on roughly 48 percent of searches and 58 to 68 percent of searches end without a click. The visibility discipline is alive and arguably harder: brands cited inside AI answers see materially higher clickthrough than uncited ones, so the work moved from ranking pages to becoming a citable source.' },
      { q: 'What still works in SEO now?', a: 'The consistent survivors: unique verifiable data no one else publishes, clear extractable answers under descriptive headers, real author expertise with visible sourcing, structured data, and distribution channels that do not depend on Google at all. Volume tactics and generic listicles are the main casualties.' },
      { q: 'Should I still start a blog in 2026?', a: 'Yes, with adjusted expectations: publish for citation and direct audience rather than click harvesting. A small library of genuinely original material now outperforms a large library of adequate material, because models select sources the way editors do.' },
    ],
    body: (
      <>
        <p>
          <a className="gl" href="/glossary#seo">SEO</a> (search engine optimization) has died more times than rock and roll. This particular death,
          though, has numbers attached. AI Overviews, the Gemini-written
          answers at the top of Google, appeared on about 6.5 percent of
          queries in January 2025 and appear on roughly <strong>48 percent of searches</strong> now. Between <strong>58 and 68 percent</strong> of searches end with no click to any website. When an AI summary is present, clicks on
          traditional results reportedly drop by nearly half, and in the
          conversational AI Mode, <strong>93 percent</strong> of sessions end without a click. If your business model was ranking pages and harvesting the
          clicks, that model has been repossessed.
        </p>
        <h2>The part that did not die</h2>
        <p>
          Read the same telemetry from the other side. Brands cited inside AI Overviews see around <strong>35 percent higher organic clickthrough</strong> than uncited brands. The model still needs sources; it just stopped
          needing ten of them per query. Search traffic did not evaporate so
          much as consolidate onto whatever the machine decides is worth
          quoting. Which turns the old discipline inside out: the job is no
          longer to rank among many answers. It is to be the source the one
          answer is built from.
        </p>
        <h2>What the survivors do differently</h2>
        <p>
          Watching what still earns visibility in 2026, four patterns repeat.
          The survivors publish numbers nobody else has: original datasets,
          measurements, counts, the kind of sentence a model cannot generate
          without citing someone. They write extractable answers, one or two
          direct sentences under a header that says what question is being
          answered, because that is the shape the machine lifts. They put a
          named human with checkable credentials behind the words, since the
          ranking systems now weight provenance the way editors always did.
          And they stopped treating Google as the only road: newsletters,
          communities, and the other feeds now carry the discovery weight
          that ten blue links used to.
        </p>
        <p>
          The casualties are just as consistent. Programmatic pages that
          rephrase common knowledge. Listicles assembled from other
          listicles. Word-count inflation, which models see straight
          through. The entire genre of content written to occupy a keyword
          rather than to say something. None of that earns a citation,
          because none of it is a source.
        </p>
        <h2>A small disclosure</h2>
        <p>
          We are not neutral observers here. This site publishes career data
          from our own pipeline precisely because original numbers are the
          one asset the new machine reliably rewards, and our posts carry
          direct answers and sources boxes for exactly the reasons described
          above. This piece is, among other things, us showing our homework.
          If the strategy is wrong, you will be able to watch it fail in
          public, which is more than most SEO advice offers.
        </p>
        <h2>Where this leaves you</h2>
        <p>
          Stop asking how to rank and start asking a colder question: if a
          careful machine read everything on this topic, would it have any
          reason to quote you? If the answer is no, no tactic will save the
          page, and the honest move is to go get something worth quoting: a
          measurement, an experiment, an experience, a dataset. If the
          answer is yes, most of the remaining work is making the quotable
          part easy to find and easy to lift. The discipline used to reward
          people who understood the index. It now rewards people who have
          something to say. As deaths go, SEO could have done worse.
        </p>
        <Sources>
          <p>
            AI Overview trigger rates, zero-click ranges, CTR effects, and
            citation lift: Semrush and independent SEO telemetry as reported
            2025 to 2026 (figures vary by study; ranges given). The
            disclosure section describes this site's own approach; judge the
            advice against our visibility accordingly.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'seo-specialist-career-priced',
    title: 'SEO specialist as a career, priced at the exact moment the job is being rewritten',
    pillar: 'What Carried Over',
    date: 'July 2026',
    dek: 'The US median for SEO specialists in our data is about 80,000 dollars, the skill appears in four professions\u2019 demand, and the role is mid-mutation into AI visibility work. A career analysis with the numbers attached.',
    minutes: 7,
    faq: [
      { q: 'How much do SEO specialists make in 2026?', a: 'In our data, the blended US median for SEO specialists is about 79,700 dollars, from 120 salary observations across 178 postings. For context, content strategists sit near 84,700, data analysts near 97,000, and marketing managers near 125,900 in the same corpus.' },
      { q: 'Is SEO a good career now that AI answers most searches?', a: 'It is a changing one. Demand in our corpus is steady and the discipline is being rewritten toward AI visibility work (getting cited by answer engines), which favors people who can combine content judgment with numbers. The ceiling opens when the role broadens toward strategy or analytics.' },
      { q: 'What does an SEO specialist transition into?', a: 'By skill overlap in our graph: marketing manager (32 percent), copywriter (31), content strategist (30), and social media manager (26), with marketing management carrying roughly a 46,000 dollar median premium over the specialist role.' },
    ],
    body: (
      <>
        <p>
          There is a whole profession built on being findable, and right now
          it is having the strangest year of its existence. We track <strong>178 <a className="gl" href="/glossary#seo">SEO</a> (search engine optimization) specialist postings</strong> in our corpus, 120 of them with stated pay.
          The blended US median: about <strong>79,700 dollars</strong>. That number, and the
          numbers around it, tell a sharper career story than the discourse
          does.
        </p>
        <h2>Where the role sits in the pay landscape</h2>
        <p>
          Eighty thousand puts the SEO specialist in respectable but
          revealing company. Copywriters in our data sit near 81,700.
          Content strategists near 84,700. Data analysts, whose toolkit
          overlaps more than either side admits, near 97,000. Marketing managers, the role SEO specialists most often grow into, near <strong>125,900</strong>. The spread is the career advice: the specialist title
          pays for a craft, and the next 46,000 dollars pays for owning the
          strategy the craft serves. SEO is a fine place to stand and an
          expensive place to stop.
        </p>
        <h2>What the demand data says about the skill</h2>
        <p>
          Beyond the specialist role itself, SEO as a skill appears
          meaningfully in the posting demand of copywriters at <strong>8.2 percent</strong>, content strategists at 5.5, and marketing managers at 3.2. Read
          that as the market saying SEO is becoming a literacy as much as a
          job: a thing adjacent professionals are expected to hold, the way
          everyone in an office eventually had to hold spreadsheets. For a
          specialist, that is both a threat and an exit ramp. The threat is
          commodification of the basics. The exit ramp is that every one of
          those adjacent roles values your depth, and our graph prices the moves: marketing manager at 32 percent overlap,
          copywriter at 31, content strategist at 30, social media manager
          at 26.
        </p>
        <h2>The rewrite happening inside the job</h2>
        <p>
          Meanwhile the work itself is mutating. With AI answers on roughly
          half of Google results and most searches ending clickless, the
          center of the discipline is sliding from rankings to citations:
          structured answers, original data, entity work, provenance,
          visibility inside ChatGPT and Perplexity as much as inside the ten
          blue links. The postings have started to say it out loud, asking
          for generative engine optimization and AI search alongside the
          classic keyword work. For anyone entering now, this is the actual
          opportunity: the veterans optimized indexes for twenty years, but
          nobody has twenty years of experience getting cited by a language
          model. On the new subskill, everyone started in 2024.
        </p>
        <h2>An honest word on the floor and the ceiling</h2>
        <p>
          The floor: the low end of SEO, the tooling-and-checklists end, is
          exactly the work AI systems are best at absorbing, and postings
          for it will thin. The ceiling: people who can prove they moved
          revenue through search, in whatever form search takes, keep
          commanding marketing-leadership pay. The variable that decides which side you land on is whether you can prove impact with numbers. The specialists who do well in our data read like analysts who happen to work on visibility,
          not like content workers who happen to know meta tags.
        </p>
        <h2>Where this leaves you</h2>
        <p>
          If you are considering the field: enter through the new door,
          citations and AI visibility, and build the measurement habit from
          day one; the median is decent, the learning curve is real, and
          the seniority path runs through strategy. If you are already in
          it: your title's basics are becoming everyone's literacy, your
          frontier is brand new, and your best-paying neighbors are one documented step away. The profession built on being findable is
          being asked to find itself. On the evidence, it has done harder
          things.
        </p>
        <Sources>
          <p>
            SEO specialist counts, salaries, skill-demand shares, and
            transition overlaps: PivotHop July 2026 run (178 postings, 120
            with stated pay; blended US medians shrink posting percentiles
            toward <a className="gl" href="/glossary#bls">BLS</a> <a className="gl" href="/glossary#oews">OEWS</a> (the Bureau of Labor Statistics wage survey) anchors; overlaps computed over top-20 posting
            skills). Search-landscape figures: Semrush and independent
            telemetry as reported 2025 to 2026, detailed in our companion
            piece on the 2026 search reset.
          </p>
        </Sources>
      </>
    ),
  },

  {
    slug: 'pink-floyd-were-architecture-students',
    title: 'Pink Floyd were architecture students, and it shows',
    pillar: 'What Carried Over',
    date: 'July 2026',
    dek: 'Three of the four founders met in architecture school. So did the quiet half of the Pet Shop Boys. Weird Al holds the degree. Ice Cube holds the drafting certificate. A field guide to the most famous pivot in music, with the skills that actually carried.',
    minutes: 8,
    faq: [
      { q: 'Which Pink Floyd members studied architecture?', a: 'Roger Waters, Nick Mason, and Richard Wright met as architecture students at the Regent Street Polytechnic in London (now the University of Westminster) between 1962 and 1965, where the band that became Pink Floyd first formed and rehearsed.' },
      { q: 'Which famous musicians have architecture degrees?', a: 'Weird Al Yankovic graduated from Cal Poly with an architecture degree. Chris Lowe of the Pet Shop Boys studied architecture at Liverpool University and worked toward qualification before choosing music. Ice Cube earned an architectural drafting certificate from the Phoenix Institute of Technology.' },
      { q: 'Do architecture skills transfer to creative careers?', a: 'Measurably, yes. In our adjacency data, the architect skill set overlaps strongly with design and technical-creative fields, and the underlying capabilities (spatial reasoning, systems thinking, staged sequencing of experience) are exactly what large-scale music production and stage design run on.' },
    ],
    body: (
      <>
        <p>
          In 1962, three students at London's Regent Street Polytechnic were
          supposed to be learning to design buildings. Roger Waters, Nick
          Mason, and Richard Wright met in the architecture program, formed a
          band, and used the school as a rehearsal space. The building got a
          plaque. The profession got a lesson it still has not fully read.
        </p>
        <p>
          Because Pink Floyd is not an isolated case. It is the loudest entry
          in a pattern.
        </p>
        <table className="post-table">
          <caption>The architecture-to-music roster · verified public accounts</caption>
          <thead><tr><th>Person</th><th>Studied</th><th>Became</th></tr></thead>
          <tbody>
            <tr><td><strong>Waters, Mason, Wright</strong></td><td>Architecture, Regent Street Polytechnic, 1962 to 1965</td><td>Pink Floyd</td></tr>
            <tr><td><strong>Weird Al Yankovic</strong></td><td>Architecture degree, Cal Poly</td><td>The most successful parody musician alive</td></tr>
            <tr><td><strong>Chris Lowe</strong></td><td>Architecture, Liverpool University</td><td>Pet Shop Boys</td></tr>
            <tr><td><strong>Ice Cube</strong></td><td>Architectural drafting certificate, Phoenix Institute of Technology</td><td>N.W.A, then Hollywood</td></tr>
          </tbody>
        </table>
        <h2>Coincidence, or a legible transfer</h2>
        <p>
          The lazy reading is that art schools of every kind leak musicians.
          True, but architecture school leaks a particular kind. Listen to
          what the Floyd actually built: album-length structures with
          load-bearing sequences, concerts staged as inhabitable
          environments, a literal wall constructed and demolished as
          performance. Nick Mason has spoken about the band thinking in
          terms of design, and the band's live shows were engineering
          projects with rigging plans. The education did not vanish. It
          changed medium.
        </p>
        <div className="post-pullq">
          Architecture school teaches you to hold a large structure in your
          head, sequence someone's experience through it, and ship it with a
          team under a deadline. So does an album.
        </div>
        <p>
          Our data makes the same point less romantically. When we unbundle what architect postings actually ask for, the threads are spatial
          reasoning, systems coordination, visual communication, and staged
          sequencing, and those threads score high toward design and
          technical-creative fields in our adjacency graph. The capability
          layer, the <a className="gl" href="/glossary#onet">Occupational Information Network</a> (O*NET) abilities architecture shares with creative
          production, is the quiet reason an architecture dropout keeps
          turning up behind famous work: the training transfers even when
          the title does not.
        </p>
        <h2>What the dropouts kept</h2>
        <p>
          Weird Al kept the structural discipline; parody is form-perfect reconstruction, a survey of an existing building redrawn with new cladding. Chris Lowe kept the restraint; Pet Shop Boys records are
          famously engineered, minimal, load-calculated pop. Ice Cube has
          credited drafting school with teaching him precision he carried
          into writing, and he studied it as a fallback in case music
          failed, which is the most honest career-risk hedge in this whole
          story. <strong>None of them wasted the training. They relocated
          it.</strong>
        </p>
        <h2>The uncomfortable question for the profession</h2>
        <p>
          Why does architecture, specifically, produce so many spectacular
          leavers? Our demand data offers a hypothesis: the profession
          recruits people with the full creative-systems package, then pays
          them below the adjacent engineering fields and gives the youngest
          ones the least creative work. The most portable skill bundle in
          the building industry, priced at a discount, held by people
          trained to notice structural problems. Some of them notice the
          one they are standing in.
        </p>
        <h2>Where this leaves you</h2>
        <p>
          You are probably not going to found Pink Floyd. The transferable
          lesson is smaller and more useful: the skills a demanding
          education installs are rarely specific to the industry that
          installed them, and the market for them is wider than the title
          on the diploma. The famous cases prove the ceiling. The adjacency
          data proves the floor. If architecture school can produce The
          Dark Side of the Moon, your training can probably survive a
          change of medium too. Type your job into the instrument and see
          which mediums are already asking for it.
        </p>
        <Sources>
          <p>
            Regent Street Polytechnic history: University of Westminster and
            the 2016 Pink Floyd plaque unveiling. Yankovic: Cal Poly
            architecture degree, widely documented. Lowe: Liverpool
            University architecture studies. Ice Cube: Phoenix Institute of
            Technology drafting certificate, his own interviews. Adjacency
            and capability claims: PivotHop July 2026 run and O*NET-derived
            capability vectors. No apocryphal quotes were used, which for
            this genre is apparently a differentiator.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'the-day-job-years',
    title: 'The day-job years: Harrison Ford, Ken Jeong, and the pivot that keeps the paycheck',
    pillar: 'Run It 10,000 Times',
    date: 'July 2026',
    dek: 'Ford built cabinets for eight years while turning down bad roles. Jeong saw patients by day and did stand-up at night. The famous version of the strategy our data says is the rational one: pivot in parallel, not in freefall.',
    minutes: 7,
    faq: [
      { q: 'What did Harrison Ford do before acting?', a: 'He worked as a professional carpenter in Los Angeles for roughly eight years, taking acting roles selectively when they beat what he had been offered before. The carpentry paid the bills that made the selectivity possible.' },
      { q: 'Was Ken Jeong really a doctor?', a: 'Yes. He trained in internal medicine at the University of North Carolina School of Medicine and practiced for years in New Orleans and Los Angeles while performing comedy at night, only leaving medicine when the acting career was established.' },
      { q: 'Is it better to quit before changing careers?', a: 'The evidence favors overlap when you can get it: parallel pivots keep income while the new field is tested, and the famous cases (Ford, Jeong) plus the arithmetic of transition months both point the same way. Quit-first makes sense mainly when the current job prevents any parallel work.' },
    ],
    body: (
      <>
        <p>
          The mythology of the career leap loves the burned boat. The
          documented reality of two very famous pivots looks different: it
          looks like a day job, kept deliberately, for years.
        </p>
        <h2>The carpenter</h2>
        <p>
          By 1970 Harrison Ford was a full-time professional carpenter in
          Los Angeles. Not as a cover story: cabinets, studios, doorways,
          paying clients, roughly <strong>eight years of it</strong>, during
          which he did only a handful of films. He has been direct about the
          mechanism: the trade income meant he could refuse acting work
          that was worse than what he had already done. The carpentry was
          not the obstacle to the acting career. It was the negotiating
          position.
        </p>
        <h2>The doctor</h2>
        <p>
          Ken Jeong finished internal medicine training at the University
          of North Carolina and practiced for years, New Orleans, then Los
          Angeles, seeing patients by day and doing stand-up at night. <strong>The license stayed active</strong> long after the comedy started working. The
          pivot completed only when the destination could carry the
          income, not when the frustration peaked.
        </p>
        <div className="post-callout"><b>2</b><span>famous pivots, one structure: <strong>keep the income, test the destination, convert when the evidence arrives.</strong> The boats were never burned. They were rented out.</span></div>
        <h2>Why the parallel pivot is the rational one</h2>
        <p>
          Strip the fame away and the structure is just good decision
          theory. A career change is a bet with an uncertain payoff and a
          long settlement time; our transition estimates run <strong>six months to two years</strong> for well-matched moves. Keeping the day job during
          that window does three measurable things. It removes desperation
          from the acceptance decision, which is how Ford could wait for
          roles that beat his last one. It finances the skill gap, the
          courses and portfolio pieces our waterfalls itemize, out of
          cash flow instead of savings. And it keeps the option of not
          switching, which matters because some tested destinations
          honestly fail the test, and finding that out while employed is
          a bargain.
        </p>
        <p>
          The cost is real and worth stating: parallel pivots run on
          evenings and weekends, for a long time, and they are slower than
          the burned-boat version when the burned boat works. The famous
          survivors of quit-first are famous partly because survivorship
          is the whole selection. The day-job cohort has less dramatic
          stories and, we suspect, a far better median outcome. Medians do
          not give interviews.
        </p>
        <h2>Where this leaves you</h2>
        <p>
          If your pivot can be run in parallel, run it in parallel: the
          data on transition time, the arithmetic of skill-gap financing,
          and the two most beloved day-job stories in Hollywood all point
          the same direction. Use the instrument to size the gap, use the
          paycheck to fund it, and hold the standard Ford held: the next
          move has to beat the last one, or you keep the saw. This site
          is built on evenings and weekends around a full-time design
          job, so the advice is at least eaten where it is cooked.
        </p>
        <Sources>
          <p>
            Ford: contemporaneous accounts and his own interviews on the
            carpentry years, circa 1970 to 1977. Jeong: NPR interviews and
            his documented medical training and practice. Transition-time
            estimates and skill-gap waterfalls: PivotHop July 2026 run.
            Survivorship caveat applied throughout, including to the
            examples themselves.
          </p>
        </Sources>
      </>
    ),
  },

  {
    slug: 'salary-secrecy-ranking',
    title: 'The salary secrecy ranking: which professions will not tell you what they pay',
    pillar: 'Shape of Work',
    date: 'July 2026',
    dek: 'Sales engineering postings state pay 44 percent of the time. Police postings, 98. We ranked 60 professions by how often they publish a number, and the pattern says more about power than about money.',
    minutes: 7,
    faq: [
      { q: 'What percentage of job postings include salary?', a: 'In our July 2026 corpus of 74,470 postings, 70 percent state pay in some form. The range across professions is wide, from 44 percent in sales engineering to 98 percent in police work.' },
      { q: 'Why do so many job postings hide the salary?', a: 'The strongest pattern in our data is that opacity tracks negotiation culture. Fields where individual deal-making is part of the job, sales and consulting above all, publish pay least. Fields with unions, civil service scales, or licensure publish it most.' },
      { q: 'Which jobs are most transparent about pay?', a: 'Police officer postings state pay 98 percent of the time in our corpus, followed by teaching assistants at 96, medical writers at 95, MEP engineers at 94, and UX researchers at 92.' },
    ],
    body: (
      <>
        <p>
          <strong>Seventy percent</strong> of the 74,470 postings in our corpus state a salary.
          The other thirty percent are not distributed randomly, and the shape
          of who hides pay turned out to be the most interesting ranking we
          have produced this year.
        </p>
        <div className="post-callout"><b>44% vs 98%</b><span>share of postings that state pay: <strong>sales engineering</strong> at the secretive end, <strong>police work</strong> at the transparent end. Same economy, same month.</span></div>
        <table className="post-table">
          <caption>Most secretive professions, 150+ postings each · PivotHop, July 2026</caption>
          <thead><tr><th>Profession</th><th className="num">States pay</th></tr></thead>
          <tbody>
            <tr><td>Sales engineer</td><td className="num"><strong>44%</strong></td></tr>
            <tr><td>Management consultant</td><td className="num">45%</td></tr>
            <tr><td>Account executive</td><td className="num">47%</td></tr>
            <tr><td>DevOps engineer</td><td className="num">48%</td></tr>
            <tr><td>Sales representative</td><td className="num">50%</td></tr>
            <tr><td>Security engineer</td><td className="num">52%</td></tr>
          </tbody>
        </table>
        <table className="post-table">
          <caption>Most transparent professions, same corpus</caption>
          <thead><tr><th>Profession</th><th className="num">States pay</th></tr></thead>
          <tbody>
            <tr><td>Police officer</td><td className="num"><strong>98%</strong></td></tr>
            <tr><td>Teaching assistant</td><td className="num">96%</td></tr>
            <tr><td>Medical writer</td><td className="num">95%</td></tr>
            <tr><td><a className="gl" href="/glossary#mep">MEP</a> (mechanical, electrical, and plumbing engineering) engineer</td><td className="num">94%</td></tr>
            <tr><td><a className="gl" href="/glossary#ux">UX</a> (user-experience design) researcher</td><td className="num">92%</td></tr>
            <tr><td>Therapist / counselor</td><td className="num">90%</td></tr>
          </tbody>
        </table>
        <h2>The pattern is negotiation, not money</h2>
        <p>
          A first guess would be that high salaries hide and low salaries
          show. The table does not support it. Security engineers earn well
          and hide pay; medical writers earn well and publish it. What the
          secretive column shares is something else. In every one of those
          fields, negotiating is part of the work itself. Sales roles
          negotiate for a living. Consultants price engagements. The
          employers hiring them treat the salary conversation as the first
          test of the skill they are buying.
        </p>
        <p>
          The transparent column mirrors it. Civil service scales, union
          agreements, licensure bands, grant-funded positions: places where
          pay is set by a schedule rather than a conversation. A police
          department cannot improvise your number, so it prints it.
        </p>
        <h2>Even the boards disagree</h2>
        <p>
          Profession is not the only axis. The infrastructure itself has a
          transparency gradient, and it is steep. Across our thirteen
          sources, federal postings on USAJOBS state pay <strong>100
          percent</strong> of the time, because the law requires it. The UK
          board Reed runs at <strong>83 percent</strong>. General
          aggregators sit near <strong>71 percent</strong>. Then come the
          applicant-tracking systems the startup world runs on: Greenhouse
          at <strong>55 percent</strong>, Ashby at <strong>50</strong>, and
          Lever at <strong>7 percent</strong>.
        </p>
        <table className="post-table">
          <caption>Share of postings stating pay, by source · PivotHop, July 2026</caption>
          <thead><tr><th>Source</th><th className="num">States pay</th><th className="num">Postings</th></tr></thead>
          <tbody>
            <tr><td>USAJOBS (US federal)</td><td className="num"><strong>100%</strong></td><td className="num">3,238</td></tr>
            <tr><td>Reed (UK)</td><td className="num">83%</td><td className="num">6,054</td></tr>
            <tr><td>Adzuna (general)</td><td className="num">71%</td><td className="num">56,732</td></tr>
            <tr><td>Greenhouse (startup <a className="gl" href="/glossary#ats">ATS</a> (applicant tracking system))</td><td className="num">55%</td><td className="num">4,921</td></tr>
            <tr><td>Ashby (startup ATS)</td><td className="num">50%</td><td className="num">1,258</td></tr>
            <tr><td>Lever (startup ATS)</td><td className="num"><strong>7%</strong></td><td className="num">1,025</td></tr>
          </tbody>
        </table>
        <p>
          Seven percent. The companies most likely to describe themselves as
          transparent, mission-driven, and disruptive publish salary at
          one-fourteenth the rate of the federal government. Some of this is
          the ATS defaults, since Lever's posting templates never pushed a
          salary field the way compliance-driven boards do. Most of it is
          choice. A venture-backed startup pricing equity-heavy offers wants
          maximum room to vary the package per candidate, and an empty
          salary line is how that room is kept.
        </p>
        <h2>What opacity costs the candidate</h2>
        <p>
          A posting without a number moves the first offer to the end of the
          process, after you have spent interview hours and started wanting
          the job. Research on anchoring says whoever names the first figure
          shapes the range, and a company that has seen ten thousand offers
          knows the market better than someone who changes jobs every three
          years. Opacity is not an oversight. It is a position.
        </p>
        <p>
          Transparency laws in Colorado, California, New York, and Washington
          have pushed the published share up in those states, which our
          corpus reflects unevenly across sources. The professional pattern
          survives the legal one, though. Even where the law requires a
          band, sales postings publish wider bands than nursing postings do.
        </p>
        <h2>Playing a hidden-number game well</h2>
        <p>
          Since a third of postings will stay blank whatever the laws do,
          the workable response is preparation rather than complaint. Three
          habits cover most of it. Look the band up before the first
          conversation, from blended sources rather than a single
          self-reported site, so the recruiter's screening question meets a
          researched range instead of a guess. Ask for the range early and
          in writing, because in the transparency-law states the company
          must produce one, and everywhere else the speed and width of the
          answer is itself information. And treat a refusal to give any
          number after a full interview loop as data about how the company
          negotiates everything else, since with you they were still on
          best behavior.
        </p>
        <h2>Where this leaves you</h2>
        <p>
          If you work in a secretive field, assume the missing number is a
          strategy and prepare accordingly. Look up the band before the
          first call. Our salary pages carry blended figures for 152
          occupations, built from the postings that do state pay plus
          official statistics, precisely so that a blank posting does not
          leave you blank too. And if you are choosing between fields, the
          transparency column is worth a glance for its own sake. It tells
          you in advance how much of your career will be spent haggling.
        </p>
        <Sources>
          <p>
            PivotHop corpus, July 2026: 74,470 mapped postings, thirteen
            sources; occupations shown have at least 150 postings. Stating
            pay means any salary figure or range in the structured posting
            data. Source mix affects levels (boards differ in salary-field
            requirements), which is why we rank professions against each
            other within the same corpus rather than quoting absolute rates
            as universal truths.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'remote-premium-illusion',
    title: 'We tried to verify the remote-pay premium and mostly failed. The whole file, published',
    pillar: 'Run It 10,000 Times',
    date: 'July 2026',
    dek: 'Our own data says remote software jobs post 87 percent more than onsite ones. We no longer believe that number as stated, and the reasons apply to every remote-salary statistic you have ever read.',
    minutes: 8,
    faq: [
      { q: 'Do remote jobs really pay more?', a: 'Remote postings in mixed corpora show large apparent premiums (61 to 119 percent across ten occupations in ours), but most of the gap comes from composition: remote-first boards list senior tech-heavy roles while general boards list everything. The clean within-source comparison our data would need is not currently possible, so the true premium is smaller than headline numbers and partly unknown.' },
      { q: 'Why are remote salary statistics unreliable?', a: 'Because remote and onsite postings usually come from different kinds of sources with different seniority, industry, and company profiles. Comparing their medians measures who posts where, not what remote work itself pays. Any remote-pay claim that does not address this composition problem should be discounted.' },
      { q: 'What is a realistic remote pay expectation?', a: 'Anchor on the occupation first: official medians (BLS OEWS) plus posted bands for your field, then treat remote as a modifier that mostly widens the candidate pool rather than a guaranteed raise. For US software engineering, the official all-worker median is about 133,000 dollars while remote-board postings cluster far above it, and the truth for a given person sits between those poles.' },
    ],
    body: (
      <>
        <p>
          Ten occupations in our data have enough salary observations on both
          sides to compare remote postings against onsite ones. Every single
          premium came out large. Security engineering, plus 119 percent.
          Product management, plus 99. Software engineering, plus 87 on a
          sample of 409 remote against 1,877 onsite. Numbers like that would
          make a lovely headline, and we drafted one.
        </p>
        <p>Then we tried to break it, because that is the house rule.</p>
        <table className="post-table">
          <caption>Apparent remote premium, posted medians · PivotHop, July 2026</caption>
          <thead><tr><th>Occupation</th><th className="num">Remote n</th><th className="num">Onsite n</th><th className="num">Apparent premium</th></tr></thead>
          <tbody>
            <tr><td>Security engineer</td><td className="num">42</td><td className="num">372</td><td className="num">+119%</td></tr>
            <tr><td>Product manager</td><td className="num">102</td><td className="num">873</td><td className="num">+99%</td></tr>
            <tr><td>Account executive</td><td className="num">165</td><td className="num">659</td><td className="num">+94%</td></tr>
            <tr><td>Software engineer</td><td className="num">409</td><td className="num">1,877</td><td className="num"><strong>+87%</strong></td></tr>
            <tr><td>Marketing manager</td><td className="num">43</td><td className="num">884</td><td className="num">+93%</td></tr>
            <tr><td>Management consultant</td><td className="num">42</td><td className="num">742</td><td className="num">+81%</td></tr>
            <tr><td>Product designer</td><td className="num">32</td><td className="num">413</td><td className="num">+77%</td></tr>
            <tr><td>Project manager</td><td className="num">72</td><td className="num">1,326</td><td className="num">+74%</td></tr>
            <tr><td>Machine learning engineer</td><td className="num">51</td><td className="num">525</td><td className="num">+72%</td></tr>
            <tr><td>Data scientist</td><td className="num">55</td><td className="num">491</td><td className="num">+61%</td></tr>
          </tbody>
        </table>
        <h2>The break attempt</h2>
        <p>
          The problem hiding in that table is where each column comes from.
          Our remote observations arrive mostly through remote-first boards,
          which skew senior, tech-heavy, and venture-funded. The onsite pool
          arrives mostly through general boards carrying everything from
          federal agencies to regional firms. Comparing the two medians mostly tells you which kinds of companies use which kinds of boards, and only secondly what working from home pays.
        </p>
        <p>
          The clean test would compare remote and onsite postings inside one
          source, same board, same employer mix. We ran it. It cannot be
          done with our current data: the general boards barely flag remote
          at all. Adzuna gave us <strong>11 remote software postings against
          1,095 onsite</strong>, and single digits for every other
          occupation we tried. A comparison that thin proves nothing in
          either direction, so we are publishing the failure instead of the
          headline.
        </p>
        <h2>What survives scrutiny</h2>
        <p>
          Three things, more modest than the table. Remote-first employers
          do post high salaries; whatever the cause, those jobs exist and
          are real money. The official anchor gives scale: the US all-worker
          median for software engineering sits near <strong>133,000
          dollars</strong> (<a className="gl" href="/glossary#bls">BLS</a> <a className="gl" href="/glossary#oews">OEWS</a> (the Bureau of Labor Statistics wage survey)), and remote-board postings cluster
          well above it, so the population posting remotely is simply not
          the median population. And the direction of the bias is knowable
          even where its size is not, which means any remote-pay figure you
          read, including ours, is an upper bound until someone shows you a
          same-source comparison.
        </p>
        <div className="post-pullq">
          The premium is real for some people and an artifact for the
          average person, and most published statistics cannot tell you
          which one you are.
        </div>
        <h2>How to read any remote-pay claim, including this one</h2>
        <p>
          The composition trap has a three-question test, and it works on
          every remote-salary article ever published. First, are the remote
          and onsite numbers drawn from the <strong>same source</strong>, or
          from a remote board compared against the general market? If the
          article does not say, assume the worst, because same-source data
          is rare and authors who have it brag about it. Second, is
          seniority controlled in any way, even crudely, since remote-first
          hiring skews senior and a seniority gap masquerades perfectly as
          a location premium. Third, are the <strong>sample sizes
          published</strong> next to the percentages? Our own table above
          includes an n of 42 producing a 119 percent headline, which is
          exactly the kind of number that evaporates when the sample
          doubles.
        </p>
        <p>
          Run those three questions against the remote-pay statistics you
          have seen this year and most will fail all three. Ours fails the
          first two and passes the third, which is why this piece exists.
        </p>
        <h2>What a defensible premium would probably look like</h2>
        <p>
          Bounded speculation, labeled as such: studies with employer-level
          controls in adjacent literatures, and the few same-company
          disclosures that exist, tend to land location-flexible pay
          differences in the range of <strong>0 to 20 percent</strong>, not
          60 to 120. Remote work reprices geography and widens the buyer
          pool, and both effects are real, but nothing in labor economics
          suggests the same worker doing the same job doubles in value by
          leaving the building. When our within-source test becomes
          possible, that is the range we expect it to confirm, and we will
          publish whatever it says either way.
        </p>
        <h2>Where this leaves you</h2>
        <p>
          If you are negotiating a remote offer, use occupation-level
          anchors rather than remote-market headlines: the blended bands on <a className="gl" href="/salary">our salary pages</a> start from official statistics and declare their posting bias, and <a className="gl" href="/fairelephant">FairElephant</a> will weigh a specific number against your location and remote rates. If you are choosing remote work expecting an
          automatic 87 percent raise, expect instead a wider set of
          employers competing for you, which is worth plenty and is not the
          same thing. We will rerun the within-source test as general
          boards improve their remote flags, and this page will change when
          the evidence does.
        </p>
        <Sources>
          <p>
            Apparent premiums: posted salary medians, remote-flagged versus
            not, minimum 30 observations per side, PivotHop July 2026 run.
            Within-source test: Adzuna-only split, reported counts above.
            Official anchor: BLS OEWS May 2024, <a className="gl" href="/glossary#soc">Standard Occupational Classification</a> (SOC) 15-1252 family. This
            piece supersedes any earlier internal use of the raw premium
            figures.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'stepping-stone-jobs',
    title: 'Stepping-stone jobs: the careers that unlock other careers',
    pillar: 'Unbundle the Job',
    date: 'July 2026',
    dek: 'Some jobs are destinations. Others are doors. We counted which occupations most often serve as the bridge that makes a second move possible, and construction management wins by a distance.',
    minutes: 7,
    faq: [
      { q: 'What is a stepping-stone job?', a: 'A role whose skill profile meaningfully raises your readiness for a third occupation you could not reach well directly. In our graph, a destination counts as a bridge when routing through it lifts measured skill coverage toward the next role by a real margin.' },
      { q: 'Which jobs open the most career doors?', a: 'By bridge frequency in our July 2026 graph: construction manager appears as the enabling middle step in 79 routes, project manager in 50, mechanical engineer in 40, compliance officer and maintenance technician in 38 each.' },
      { q: 'Are stepping-stone jobs worth taking?', a: 'When two offers are close, the one with higher bridge frequency buys more future options. The trade is real: bridge roles are usually coordination-heavy and less specialized, which is exactly why their skills transfer onward.' },
    ],
    body: (
      <>
        <p>
          Career advice treats every job as a destination. The graph
          disagrees. When we compute two-hop routes between occupations,
          certain roles keep appearing <strong>in the middle</strong>, not because people
          want them forever but because holding one raises your reach
          toward places you could not go directly. We started calling them
          bridge roles, counted them, and the census surprised us.
        </p>
        <table className="post-table">
          <caption>Occupations most often serving as the bridge in two-hop routes · PivotHop, July 2026</caption>
          <thead><tr><th>Bridge role</th><th className="num">Routes it enables</th></tr></thead>
          <tbody>
            <tr><td><strong>Construction manager</strong></td><td className="num"><strong>79</strong></td></tr>
            <tr><td>Project manager</td><td className="num">50</td></tr>
            <tr><td>Mechanical engineer</td><td className="num">40</td></tr>
            <tr><td>Compliance officer</td><td className="num">38</td></tr>
            <tr><td>Maintenance technician</td><td className="num">38</td></tr>
            <tr><td>Industrial engineer</td><td className="num">35</td></tr>
            <tr><td>Chemical engineer</td><td className="num">34</td></tr>
            <tr><td>Dietitian</td><td className="num">33</td></tr>
          </tbody>
        </table>
        <h2>Why coordination roles dominate</h2>
        <p>
          Construction management enabling 79 onward routes was not the
          result we expected, and then it was obvious. The job is a
          crossroads by construction, so to speak: budgets, contracts,
          scheduling, safety, engineering coordination, client management.
          Each of those threads is the entry fee to a different next field.
          Project management, its office-park cousin, does the same work
          for the white-collar half of the graph.
        </p>
        <p>
          The engineering entries earn their place differently. A
          mechanical or chemical engineering role adds hard technical
          credit that stacks with whatever you brought, so it converts
          arts-adjacent and operations profiles into candidates for
          technical fields that would not have interviewed them before.
          Dietitian, the odd one out, bridges healthcare profiles toward
          counseling, education, and food-industry roles, a small hub in a
          heavily licensed region of the graph where any transferable node
          matters.
        </p>
        <div className="post-callout"><b>1</b><span>connection. That is the entire adjacency footprint of <strong>photographer</strong> in our graph, the loneliest node we track. Hotel manager also sits at one. Some jobs are rooms with a single door.</span></div>
        <h2>The bridge in action, with real routes</h2>
        <p>
          Abstract counts undersell what a bridge actually does, so here
          are four routes from the graph with the readiness arithmetic
          attached. In each case, the direct jump scores poorly and the
          bridge roughly triples it.
        </p>
        <table className="post-table">
          <caption>Two-hop routes and their readiness lift · PivotHop, July 2026</caption>
          <thead><tr><th>Route</th><th className="num">Direct</th><th className="num">Via the bridge</th></tr></thead>
          <tbody>
            <tr><td>Plumber → Construction manager → <strong>Estimator</strong></td><td className="num">18%</td><td className="num"><strong>66%</strong></td></tr>
            <tr><td>IT support → Construction manager → Estimator</td><td className="num">27%</td><td className="num">66%</td></tr>
            <tr><td>Librarian → Project manager → <strong>Facilities manager</strong></td><td className="num">18%</td><td className="num">62%</td></tr>
            <tr><td><a className="gl" href="/glossary#hvac">HVAC</a> (heating, ventilation, and air conditioning) technician → Mechanical engineer → Electrical engineer</td><td className="num">19%</td><td className="num">58%</td></tr>
          </tbody>
        </table>
        <p>
          A librarian is 18 percent of a facilities manager on paper.
          A librarian who has run projects is 62 percent of one, and the
          missing piece was never the books, it was the budget authority
          and vendor wrangling that a project role documents. The bridge
          does not teach you a secret. It converts work you could already
          do into work you can prove.
        </p>
        <h2>Using a bridge on purpose</h2>
        <p>
          The deliberate version of this pattern takes about 18 months and
          three decisions. Pick the destination first, because a bridge
          chosen without one is just a detour with better branding. Then
          pick the bridge from the middle column of your own two-hop map,
          favoring roles that raise the specific skills the destination's
          postings name. Then, and this is the part people skip, write the
          destination's vocabulary into everything you produce during the
          bridge year: the budget you ran, the contractors you managed,
          the compliance signoffs you owned. The bridge only pays out if
          the next application can see it.
        </p>
        <h2>Islands, and what they mean</h2>
        <p>
          The opposite of a bridge is an island: an occupation whose skill profile connects to almost nothing above our scoring floor.
          Photography and hotel management sit there in our current data,
          partly because their real skills, composition, service instincts,
          crisis calm, live below what postings write down. If you hold an
          island job, the graph is not saying you are stuck. It is saying
          your written profile undersells you, and the fix is documenting
          the coordination and client work your title hides before you
          apply outward.
        </p>
        <h2>Where this leaves you</h2>
        <p>
          Use bridge frequency as a tiebreaker. When two offers pay
          similarly, the one that appears more often as other people's
          middle step buys you a wider future, and that is worth something
          even if you never spend it. A year of construction or project
          management is rarely anyone's dream. As an option on eight other
          careers, it prices rather well.
        </p>
        <Sources>
          <p>
            Bridge counts: number of two-hop routes across all origins in
            which each occupation appears as the enabling middle step
            (readiness gain of at least 5 points over the direct route),
            PivotHop July 2026 run, 132 origins with routes. Island
            examples: occupations with a single edge at match 20 or above
            among those with 150-plus postings. Try your own two-hop map
            with the instrument on the front page; double-click any node to
            travel.
          </p>
        </Sources>
      </>
    ),
  },

  {
    slug: 'four-day-week-counted',
    title: 'The four-day week, counted: 102 postings out of 110,681',
    pillar: 'Shape of Work',
    date: 'July 2026',
    dek: 'Everyone talks about the four-day week. We searched our entire posting corpus for employers actually offering one, found 0.09 percent, and discovered the offers cluster in trades, not tech.',
    minutes: 8,
    faq: [
      { q: 'How common is the four-day work week in job postings?', a: 'Rare. In our July 2026 corpus of 110,681 postings, 102 mention any four-day or compressed arrangement, which is 0.09 percent. Trials and headlines run far ahead of what employers put in writing.' },
      { q: 'What are the different four-day week formats?', a: 'Four main species: the 100-80-100 model (full pay, 32-ish hours, output maintained), the compressed 4x10 (same 40 hours in four days), the 9-day fortnight (alternating five and four day weeks), and plain reduced-hours arrangements. They differ enormously in what an hour of your time earns.' },
      { q: 'Which industries actually offer four-day weeks?', a: 'In our posting data the offers cluster in construction, trades, and engineering: civil engineers, electricians, welders, and financial analysts top the list. UK employers dominate, mostly through the 9-day fortnight. Tech postings barely register.' },
    ],
    body: (
      <>
        <p>
          The four-day week has trials, books, a global nonprofit, and a
          permanent slot in the discourse. We wanted the version that shows
          up in writing, so we searched all 110,681 postings in our corpus
          for any mention of a four-day, compressed, or reduced week. The
          count came back at <strong>102 postings, or 0.09 percent</strong>.
        </p>
        <p>
          One in eleven hundred. Whatever the four-day week is right now, it
          is not yet a thing employers commit to in the job ad.
        </p>
        <h2>The four species, because they are not one thing</h2>
        <table className="post-table">
          <caption>Four-day formats and what an hour earns · definitions per UK pilot and scheduling literature</caption>
          <thead><tr><th>Format</th><th>Hours</th><th>Pay</th><th>Your hourly rate</th></tr></thead>
          <tbody>
            <tr><td><strong>100-80-100</strong></td><td>~32 in 4 days</td><td>Full</td><td><strong>Rises ~25%</strong></td></tr>
            <tr><td>Compressed 4x10</td><td>40 in 4 days</td><td>Full</td><td>Unchanged, days longer</td></tr>
            <tr><td>9-day fortnight</td><td>~72 in 9 days</td><td>Full</td><td>Rises ~11%</td></tr>
            <tr><td>Reduced hours</td><td>32 or 36</td><td>Often prorated</td><td>Check the letter</td></tr>
          </tbody>
        </table>
        <p>
          The distinction matters more than the branding. The celebrated UK
          pilot ran on 100-80-100: <strong>61 companies</strong>, full pay
          for 80 percent of the hours, and afterward 56 kept going, with
          sick days down 65 percent and revenue roughly flat. A compressed
          4x10 gives you the same Friday but none of the raise; it moves
          ten hours, it does not remove them. Two offers can both say
          four-day week and differ by a quarter of your effective wage.
        </p>
        <h2>Who actually offers it, in writing</h2>
        <p>
          Now our 102. By format: 57 say four-day week without specifying,
          <strong> 38 offer a 9-day fortnight</strong>, four name reduced
          hours, three name 4x10. And the occupations at the top of the
          list are not the ones the discourse predicts: civil engineers and
          electricians lead with six postings each, then financial
          analysts, welders, chefs, and compliance officers. Architects and
          architectural technologists appear too. Software roles barely
          register.
        </p>
        <div className="post-pullq">
          In the postings, the four-day week is a recruiting lever for
          trades and engineering firms competing for scarce hands, not a
          tech perk. The revolution is wearing a hi-vis vest.
        </div>
        <p>
          The fortnight number explains part of it. The 9-day fortnight is
          an established UK arrangement, common in engineering and public
          sector work, and our UK sources carry it into the corpus. It is
          the four-day week's older, quieter cousin: alternating five and
          four day weeks, every other Friday off, no manifesto attached.
          Firms that already run it just say so in the ad, which is exactly
          why it outnumbers the headline model in real postings.
        </p>
        <h2>Reading an offer without getting fooled</h2>
        <p>
          Three questions sort any four-day claim in under a minute. Are
          the hours reduced or rearranged, since 32 at full pay is a raise
          and 4x10 is a schedule. Is it in the contract or in the culture
          deck, because a trial can end and a term cannot. And does it
          survive seniority, as some firms quietly restore the fifth day
          above a certain level. The Tokyo government, which moved its
          workforce to a four-day option in April 2025, put it in policy.
          A startup putting it in a careers-page banner has made a softer
          promise.
        </p>
        <h2>Where this leaves you</h2>
        <p>
          If a four-day week matters to you, the data suggests looking in
          unexpected places: UK engineering and construction firms are
          writing it into ads while famous tech names are marching the
          other direction entirely. And when you find one, do the hourly
          math before celebrating. The difference between the species is
          the difference between a 25 percent raise and a longer Tuesday.
        </p>
        <Sources>
          <p>
            Corpus count: regex over description text of 110,681 raw
            postings, PivotHop July 2026 (patterns: four-day week, 4x10,
            32/36-hour week, 9-day fortnight, 100-80-100). Counts are
            floors; ads can omit benefits. UK pilot figures: 4 Day Week
            Global and Autonomy Institute reporting, 2023, with follow-up
            trials through 2025. Tokyo: Tokyo Metropolitan Government
            announcements, effective April 2025. Formats and hourly math:
            our own arithmetic on stated terms.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'the-giants-disagree',
    title: 'The giants disagree about where you should sit',
    pillar: 'Shape of Work',
    date: 'July 2026',
    dek: 'Amazon, JPMorgan, and half the Fortune 100 now demand five days in the office. Tokyo pays its workers to come in four. The corporate world is running two opposite experiments at once, and job seekers are the control group.',
    minutes: 8,
    faq: [
      { q: 'Which companies require five days in office in 2026?', a: 'The full-time five-day list includes Amazon (since January 2025), JPMorgan Chase, AT&T, Goldman Sachs, Dell, Fidelity, and the US federal workforce, among others. Per JLL, 54 percent of Fortune 100 employees were under five-day mandates by mid-2025, up from 11 percent a year earlier.' },
      { q: 'Are any big employers moving the other way?', a: 'Yes. The Tokyo Metropolitan Government introduced a four-day option for its employees in April 2025, the UK Employment Rights Act 2025 phases in flexible working as a default expectation, and follow-up four-day trials keep converting participants to permanent adopters.' },
      { q: 'Does remote or hybrid work still exist at scale?', a: 'Broadly yes: surveys through 2026 put about two-thirds of companies at some hybrid arrangement and roughly 6 percent fully remote. The mandates are concentrated at famous, large employers, which makes them louder than their share of the labor market.' },
    ],
    body: (
      <>
        <p>
          Two announcements, eighteen months apart, describe the whole
          situation. In January 2025 Amazon ordered about <strong>350,000 corporate employees</strong> back five days a week. In April 2025 the Tokyo
          Metropolitan Government, one of the largest employers in Japan,
          gave its workers a four-day option to fight burnout and a
          collapsing birth rate. The biggest names in world employment are
          running opposite experiments on the same species.
        </p>
        <h2>The mandate camp</h2>
        <p>
          The five-day list reads like a stock index: Amazon, JPMorgan
          Chase, AT&T, Goldman Sachs, Dell, Fidelity, plus the US federal
          workforce. The velocity is the striking part. Per <a className="gl" href="/glossary#jll">JLL</a> (Jones Lang LaSalle)'s office
          market data, <strong>54 percent of Fortune 100 employees</strong>
          were under full five-day requirements by mid-2025, against
          <strong> 11 percent a year earlier</strong>. Whatever executives
          say about collaboration, a five-fold jump in one year is not a considered pedagogical conclusion. It is a coordinated retreat to
          a default that leadership never stopped preferring, timed for a
          labor market where employers hold the cards.
        </p>
        <h2>The flexibility camp</h2>
        <p>
          The other experiment is quieter and more institutional. Tokyo
          put its four-day option into government policy. The UK's
          Employment Rights Act 2025 begins phasing in flexible working
          as a default employees can request from day one. The four-day
          trial pipeline keeps converting: the follow-up UK cohort chose
          to continue at rates that embarrass most workplace initiatives.
          And beneath the headlines, roughly <strong>two-thirds of
          companies</strong> still run some hybrid arrangement, with about
          6 percent fully remote. The mandates are concentrated among
          famous employers, which makes them louder than their actual
          share of hiring.
        </p>
        <table className="post-table">
          <caption>The two experiments, side by side · July 2026</caption>
          <thead><tr><th></th><th>Mandate camp</th><th>Flexibility camp</th></tr></thead>
          <tbody>
            <tr><td>Flagships</td><td>Amazon, JPMorgan, Goldman, AT&T</td><td>Tokyo Metro Gov, UK law, trial cohorts</td></tr>
            <tr><td>Instrument</td><td>Attendance policy</td><td>Statute and contract terms</td></tr>
            <tr><td>Stated reason</td><td>Collaboration, culture</td><td>Retention, health, demographics</td></tr>
            <tr><td>Share of market</td><td>Loud minority</td><td>Quiet majority (hybrid ~67%)</td></tr>
          </tbody>
        </table>
        <h2>What it does to the job landscape</h2>
        <p>
          For candidates, the divergence converts location policy into a
          compensation term, whether anyone prices it or not. A five-day
          mandate is a pay cut measured in commuting hours; a contractual four-day term is a raise counted the same way. Our own data
          says the market has not caught up to pricing either: postings
          rarely state arrangements plainly, remote-pay statistics are
          composition-riddled, and only 0.09 percent of ads commit to a
          four-day term in writing. The gap between policy noise and
          posting language is where negotiation currently lives.
        </p>
        <p>
          There is also a sorting effect that will take years to show up
          in data. Mandates at famous firms push flexibility-minded
          seniors toward the quiet majority of hybrid employers, who get
          to hire above their weight class without raising a salary. If
          that sounds like an arbitrage, it is, and mid-sized firms are
          the ones collecting it.
        </p>
        <h2>Where this leaves you</h2>
        <p>
          Treat workplace policy as a term sheet item, not a vibe. Ask
          where the arrangement is written down, what happened to it
          during the last leadership change, and whether it survives
          promotion. The giants have made their preferences legible from
          both directions this year. The useful move is noticing that
          most of the market never joined either camp, and that the
          quiet middle is currently the best place to be a candidate
          with leverage.
        </p>
        <Sources>
          <p>
            Mandate list and Fortune 100 shares: JLL Q2 2025 office
            market data and <a className="gl" href="/glossary#rto">RTO</a> (return-to-office) trackers, as reported through mid-2026.
            Amazon policy: company announcement, effective January 2025.
            Tokyo: Metropolitan Government policy, April 2025. UK:
            Employment Rights Act 2025, staged provisions. Hybrid and
            remote shares: workplace surveys 2025-2026, approximate.
            Posting-language figures: PivotHop corpus, July 2026.
          </p>
        </Sources>
      </>
    ),
  },

  {
    slug: 'degree-premium-trick-question',
    title: 'Who earns more, people with degrees or without? The trick question inside the obvious answer',
    pillar: 'Run It 10,000 Times',
    date: 'July 2026',
    dek: 'Degree holders out-earn non-graduates by about 60 percent on average, and the average hides two twists: postings that welcome non-graduates now pay more than ones demanding degrees, and a self-taught developer out-earns a veterinarian holding a doctorate.',
    minutes: 9,
    faq: [
      { q: 'How much more do college graduates earn than non-graduates?', a: 'Substantially: BLS data for early 2026 puts median weekly earnings at 1,763 dollars for bachelor\u2019s holders against 977 for high school graduates, roughly a 60 to 80 percent premium depending on the cut. College Board reporting puts the annual gap around 31,200 dollars for full-time workers.' },
      { q: 'Are companies really dropping degree requirements?', a: 'In announcements, yes; in hires, barely. The Harvard Business School and Burning Glass Institute study found fewer than 1 in 700 hires were actually affected by dropped degree requirements, and about 45 percent of companies that announced changes altered nothing in practice.' },
      { q: 'Can a self-taught programmer earn more than degreed professionals?', a: 'By official medians, yes, comfortably. BLS OEWS puts software developers at 133,080 dollars, above veterinarians at 125,510 (a doctorate plus a license), architects at 96,690 (a five-year degree plus licensure), clinical psychologists at 95,830, and librarians at 64,320 despite the required master\u2019s. Field choice moves pay more than credential level does.' },
      { q: 'Do job postings without degree requirements pay less?', a: 'In our corpus, the opposite. Postings that explicitly say no degree required or equivalent experience accepted carry a posted median of about 140,000 dollars, against 105,000 for postings that explicitly demand a degree, because openness language became standard in high-paying tech ads while explicit demands survive in lower-paying traditional sectors.' },
    ],
    body: (
      <>
        <p>
          The obvious answer first, because it is true. People with degrees
          earn more. <a className="gl" href="/glossary#bls">Bureau of Labor Statistics</a> (BLS) puts median weekly earnings for bachelor's holders
          at <strong>1,763 dollars against 977</strong> for high school
          graduates in early 2026, a gap that has held around 60 percent
          for decades. <a className="gl" href="/glossary#opportunity-at-work">Opportunity@Work</a> counts <strong>70 million American
          workers</strong> skilled through alternative routes, half the
          workforce, and finds their wage gap against degree holders has
          doubled over 30 years. By one of their estimates it takes a
          worker without the paper more than three decades to reach what a
          graduate earns on day one.
        </p>
        <p>
          So the ranking is settled. What is not settled, and what our own
          data complicates in a useful way, is the mechanism.
        </p>
        <h2>What 51,696 salaried postings say about degree language</h2>
        <p>
          We classified every salaried posting in our corpus by its degree
          language. Postings that explicitly require a degree: 126, or
          around 0.2 percent. Postings that explicitly welcome candidates
          without one, the no-degree-required and equivalent-experience
          phrasings: 665. Everything else, <strong>98 percent of the
          corpus, says nothing either way</strong>.
        </p>
        <div className="post-callout"><b>$140k vs $105k</b><span>posted medians: postings that <strong>explicitly welcome non-graduates</strong> against postings that explicitly demand a degree. The openness premium is not a typo.</span></div>
        <p>
          Those two numbers invert the expected story. The ads that demand paper pay less than the ads that
          waive it. The resolution of the paradox is who writes each
          sentence. Or equivalent experience is boilerplate in
          high-paying technology postings, a signal of modernity as much
          as a policy. Degree required survives in older-fashioned,
          lower-paying corners of the market. The language stopped
          tracking the actual gate years ago.
        </p>
        <h2>Where the gate actually lives now</h2>
        <p>
          If 98 percent of ads are silent and the explicit language is
          decorative, the degree filter has to live somewhere else, and
          the research says it lives in the resume screen. The Harvard
          Business School and <a className="gl" href="/glossary#lightcast">Burning Glass</a> Institute study of
          skills-based hiring found that among companies that removed
          degree requirements from postings, <strong>fewer than 1 in 700
          hires</strong> actually changed as a result. About 45 percent
          of announcing companies changed nothing in practice. A titled
          minority, 37 percent, genuinely increased non-degree hiring by
          around 20 percent, and 18 percent tried it and slid back.
        </p>
        <p>
          Governments have moved harder than companies. More than half of
          US states now encourage skills-based hiring for public jobs,
          Maryland's early move covered half its state positions and
          lifted hires 41 percent in a year, and federal standards for
          technology roles dropped degree requirements in April 2026. The
          public sector, which our secrecy ranking showed publishes pay
          most honestly, is also the sector dismantling the paper gate
          fastest. The pattern is consistent: rules-bound employers
          change when the rule changes. Discretionary employers announce.
        </p>
        <h2>When the field beats the diploma</h2>
        <p>
          The 60 percent premium is an average across everyone, and averages
          are where the interesting cases go to hide. Hold the source
          constant, official BLS medians, same year, and rank a few
          professions against the schooling they demand:
        </p>
        <table className="post-table">
          <caption>Official US medians vs required credentials · BLS <a className="gl" href="/glossary#oews">Occupational Employment and Wage Statistics survey</a> (OEWS), May 2024</caption>
          <thead><tr><th>Profession</th><th>Paper the law or market demands</th><th className="num">Median</th></tr></thead>
          <tbody>
            <tr><td><strong>Software developer</strong></td><td>None mandated, degree optional</td><td className="num"><strong>$133,080</strong></td></tr>
            <tr><td>Veterinarian</td><td>Doctorate + state license</td><td className="num">$125,510</td></tr>
            <tr><td>Systems administrator</td><td>Certifications, degree optional</td><td className="num">$96,800</td></tr>
            <tr><td>Architect</td><td>5-year degree + licensure + internship years</td><td className="num">$96,690</td></tr>
            <tr><td>Clinical psychologist</td><td>Doctorate + license</td><td className="num">$95,830</td></tr>
            <tr><td>Dietitian</td><td>Degree + license in most states</td><td className="num">$73,850</td></tr>
            <tr><td>Librarian</td><td><strong>Master's degree</strong></td><td className="num">$64,320</td></tr>
            <tr><td>Teacher (median)</td><td>Degree + certification</td><td className="num">$62,340</td></tr>
          </tbody>
        </table>
        <p>
          The person who learned to code from free videos and ships working
          software sits at the top of that table. The veterinarian below
          them spent the better part of a decade in school and passed a
          licensing board. The architect and the systems administrator earn
          within 110 dollars a year of each other, one after a five-year
          degree and an internship ladder, the other after certifications
          you can finish in months. And the librarian's required master's
          buys a median under half the developer's.
        </p>
        <p>
          None of this says degrees are worthless, and within a single
          field the credential usually still pays. What it says is that
          <strong> field choice moves earnings far more than credential
          level does</strong>, and the fields where paper is optional
          happen to include the best-paid large occupation in the country.
          The degree premium is real. It is also, for a person choosing a
          path rather than averaging a population, frequently the wrong
          number to stare at.
        </p>
        <h2>The other title premium</h2>
        <p>
          One more wrinkle from our own graph. The title that reliably
          pays is not academic but legal: the biggest pay premiums in our
          adjacency data sit behind licenses, pharmacist at plus 125
          percent from medical assistant, controller-class finance roles,
          engineering sign-off work. A license is a title the market
          cannot quietly ignore at the resume screen, because practicing
          without it is illegal rather than merely unconventional. Paper
          you can enforce beats paper you can imply.
        </p>
        <h2>Where this leaves you</h2>
        <p>
          For the 70 million without the degree: the ad text is no longer
          the obstacle and never tells you the truth anyway. Target the
          employers with verified behavior change, public-sector openings
          where the rule itself moved, and licensed routes where the gate
          is at least explicit and passable. Bring evidence a screen
          cannot skim past, which is what portfolios, certifications, and
          a documented skills inventory are for. For degree holders: the
          premium is real, front-loaded, and quietly shrinking at the
          margins where enforcement went silent. Either way, the paper
          question is decided later and more arbitrarily than the
          discourse admits, by a person or a model reading a resume in
          six seconds. Write for that reader.
        </p>
        <Sources>
          <p>
            Earnings gaps: BLS usual weekly earnings, Q1 2026; College
            Board Education Pays 2026. STARs figures: Opportunity@Work.
            Skills-based hiring behavior: Harvard Business School and
            Burning Glass Institute, 2024. State and federal changes:
            NGA reporting, Maryland state data, OPM April 2026 standards.
            Posting-language classification: PivotHop corpus, July 2026,
            51,696 salaried postings, regex on requirement phrasing;
            counts are floors and the silent share is the finding.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'where-people-actually-go',
    title: 'Where people actually go: what happened when we added real career-change data to the graph',
    pillar: 'Run It 10,000 Times',
    date: 'July 2026',
    dek: 'Skill overlap says an architect resembles a structural engineer. Federal survey data says architects become interior designers and industrial designers. We wired three observed-transition datasets into the instrument, and the map moved.',
    minutes: 9,
    faq: [
      { q: 'What is the difference between skill similarity and observed mobility?', a: 'Similarity models score how alike two jobs look on paper, from shared skills or tasks. Observed mobility counts people who actually moved, from surveys that record occupation last year and occupation now. The two disagree often, and the disagreements are the interesting part.' },
      { q: 'Where does real occupation-to-occupation transition data come from?', a: 'Mostly federal surveys. We use a CPS-derived mobility network built by Oxford researchers (2010–2017, 464 occupations, CC BY 4.0), a Department of Labor public-use file of 43,350 weighted CPS and SIPP person transitions, and for European resolution the JobHop resume dataset from Flanders. All three are licensed for reuse with attribution.' },
      { q: 'Why do people rarely make moves that look easy on paper?', a: 'Licensing, mostly. Of the twelve strongest cases in our data where skills say yes and people say no, eleven point at a licensed destination. A medical assistant matches 76 percent of a nurse practitioner’s posted skills, and almost nobody makes that jump directly, because the gate is a graduate degree and a license, not a skill gap.' },
      { q: 'Does PivotHop rank career moves by skill match or by real transitions?', a: 'Both, separately and visibly. Skill readiness stays the number on every node. Ranking blends readiness (0.55), shared abilities (0.2), and observed mobility (0.25), and the panel decomposes the three signals so you can see exactly why a route surfaced.' },
    ],
    body: (
      <>
        <p>
          PivotHop’s graph has always been built from live postings: it reads what
          employers ask for and scores how much of a destination role you
          already cover. That number is useful and it has a blind spot you
          could drive a truck through. It knows what the market wants. It
          does not know what people do.
        </p>
        <p>
          This month we wired in the missing half: three datasets of{' '}
          <strong>observed career transitions</strong>, actual humans counted
          moving from one occupation to another. An Oxford-built mobility
          network derived from the Current Population Survey
          (<strong>2010–2017, 464 occupations</strong>, published <a className="gl" href="/glossary#cc-by">CC BY</a> (an open license permitting commercial reuse) 4.0),
          a Department of Labor public-use file of{' '}
          <strong>43,350 survey-weighted person transitions</strong> from <a className="gl" href="/glossary#cps">Current Population Survey</a> (CPS)
          and <a className="gl" href="/glossary#sipp">Survey of Income and Program Participation</a> (SIPP), and, for finer European resolution, 355,315 anonymized
          career trajectories from the <a className="gl" href="/glossary#jobhop">JobHop</a> resume dataset. Career-tech is
          full of similarity models dressed up as mobility data. These three
          are the real thing: someone was an electrician in one interview
          and something else in the next.
        </p>
        <h2>Skills say no. People go anyway.</h2>
        <p>
          Across the 888 routes on our graph that now carry an observed
          signal, <strong>224</strong> are moves the skill math would have
          waved off, under 35 percent posted-skill overlap, that rank at or
          near the top of where people from that origin actually land.
        </p>
        <table className="post-table">
          <caption>Moves people make that skill overlap underrates · PivotHop + CPS/SIPP-derived flows, July 2026</caption>
          <thead><tr><th>Move</th><th className="num">Skill match</th><th className="num">Observed flow</th></tr></thead>
          <tbody>
            <tr><td>Electrician → <strong>Construction manager</strong></td><td className="num">13%</td><td className="num"><strong>100</strong></td></tr>
            <tr><td>Paralegal → <strong>Executive assistant</strong></td><td className="num">14%</td><td className="num"><strong>100</strong></td></tr>
            <tr><td>Marketing manager → <a className="gl" href="/glossary#seo">SEO</a> (search engine optimization) specialist</td><td className="num">14%</td><td className="num">100</td></tr>
            <tr><td>Real estate agent → Real estate developer</td><td className="num">13%</td><td className="num">100</td></tr>
            <tr><td>Architect → <strong>Industrial designer</strong></td><td className="num">15%</td><td className="num"><strong>100</strong></td></tr>
            <tr><td>Motion designer → Game designer</td><td className="num">12%</td><td className="num">100</td></tr>
            <tr><td>Medical assistant → Registered nurse</td><td className="num">34%</td><td className="num">100</td></tr>
          </tbody>
        </table>
        <p>
          The flow score is origin-relative: 100 means this is the single
          most common destination we can resolve for people leaving that
          occupation, not that everyone goes there. Read the electrician row
          as: of the places departing electricians turn up, construction
          manager leads. The posting-skill overlap between the two jobs is
          13 percent, because postings for construction managers ask for
          scheduling, budgeting, and stakeholder wrangling, none of which an
          electrician’s posting mentions. The market learns those on the
          job. The similarity model can’t see it. The survey can.
        </p>
        <div className="post-pullq">
          A skill profile describes what a job asks for on day one. A flow
          count describes what careers survive contact with.
        </div>
        <h2>Skills say yes. People stay home.</h2>
        <p>
          The reverse list is shorter and sharper: routes with 55 percent
          overlap or better where the observed flow is close to zero.
          Sixteen pairs qualify. Eleven of the twelve strongest point at a
          destination that requires a license.
        </p>
        <table className="post-table">
          <caption>High-overlap moves people rarely make · same sources</caption>
          <thead><tr><th>Move</th><th className="num">Skill match</th><th className="num">Observed flow</th><th>The wall</th></tr></thead>
          <tbody>
            <tr><td>Medical assistant → <strong>Nurse practitioner</strong></td><td className="num"><strong>76%</strong></td><td className="num"><strong>1</strong></td><td>Master’s + RN license</td></tr>
            <tr><td>Therapist → Physical therapist</td><td className="num">67%</td><td className="num">2</td><td>Doctorate + licensure</td></tr>
            <tr><td>Social worker → Dietitian</td><td className="num">68%</td><td className="num">1</td><td>Registration exam</td></tr>
            <tr><td>Psychologist → Nurse practitioner</td><td className="num">62%</td><td className="num">2</td><td>Different license entirely</td></tr>
            <tr><td>Nurse practitioner → Physical therapist</td><td className="num">63%</td><td className="num">0</td><td>Doctorate + licensure</td></tr>
          </tbody>
        </table>
        <div className="post-callout"><b>11 of 12</b><span>of the strongest “skills say yes, people say no” routes end at a <strong>licensed</strong> occupation. The wall the skill math cannot see is almost always a credential.</span></div>
        <p>
          This is worth sitting with if you are healthcare-adjacent. The
          skills genuinely transfer; the surveys show the moves genuinely
          not happening. Between those two facts sits two to six years of
          school and an exam. Career advice that only reads skill overlap
          will keep recommending these routes. The data on actual behavior
          prices them properly.
        </p>
        <h2>Why three sources, not one</h2>
        <p>
          Each dataset fails somewhere specific, which is the reason we run
          them together. The census occupation codes behind the Oxford
          network throw every designer, interior, graphic, industrial,
          <a className="gl" href="/glossary#ux">UX</a> (user-experience design), into one bucket, so “architects become designers” is as
          precise as that source can get. The European resume data is coded
          at <a className="gl" href="/glossary#esco">European occupation classification</a> (ESCO) leaf level, roughly 3,000 occupations, which separates a
          product designer from a signage designer, but it describes the
          Belgian labor market, so we display it as its own labeled signal
          and never blend it into US magnitudes. The <a className="gl" href="/glossary#dol">Department of Labor</a> (DOL) file is
          <a className="gl" href="/glossary#soc">Standard Occupational Classification</a> (SOC)-coded and fresher (roughly 2020) but covers only mid-level
          origin occupations. Where a pair falls into one source’s blind
          spot, the chain falls through to the next, and when none can
          resolve it, the route says so instead of inventing a number.
        </p>
        <p>
          One caveat to carry into every table above: a flow of 100 is
          relative to the origin, and popular destinations are popular for
          everyone. Project manager and business analyst absorb leavers
          from half the economy, which says less about your specific
          adjacency than interior design’s pull on architects does. The
          curated relatedness prior we still keep as a fallback is damped
          for exactly this, and the flow scores inherit the same
          skepticism in ranking.
        </p>
        <h2>What changed on the instrument</h2>
        <p>
          Ranking on the graph now blends three signals, each shown
          separately in the route panel: skill readiness (weight 0.55, still
          the number printed on every node), shared work abilities from
          <a className="gl" href="/glossary#onet">Occupational Information Network</a> (O*NET) (0.2), and observed mobility (0.25). For an architect, that
          pulled industrial designer onto the first ring at an unglamorous
          15 percent readiness, with the panel stating why: people who
          leave architecture demonstrably go there. Structural engineer
          stays high too, but for the opposite reason, high overlap, modest
          flow. The two kinds of adjacency finally read differently.
        </p>
        <p>
          One production note. The Department of Labor file arrived the hard
          way: the agency’s public-use listing for the study was removed
          from its site sometime between late 2022 and January 2026, and
          both dol.gov and bls.gov now refuse automated clients outright. We
          recovered the files byte-for-byte from Internet Archive snapshots
          and verified them against the study documentation. Public data has
          a shelf life. Mirror what you rely on.
        </p>
        <h2>Where this leaves you</h2>
        <p>
          When you evaluate a move, ask two questions instead of one. What
          share of the destination’s asks do I already cover, and do people
          from my occupation actually arrive there? High overlap with no
          flow usually means a licensing gate; budget years, not months.
          Strong flow with low overlap means the market routinely retrains
          people like you on the job, and the gap is more affordable than it
          looks. The instrument now shows both numbers on every route, with
          the source named. Run your own origin and read the disagreements
          first.
        </p>
        <Sources>
          <p>
            Observed flows: del Rio-Chanona, Mealy et al., CPS-derived
            occupational mobility network, 2010–2017, 464 occupations,
            Zenodo, CC BY 4.0. US DOL OASP, Career Trajectories and
            Occupational Transitions CPS/SIPP public-use dataset, December
            2021, 43,350 weighted person transitions, recovered via Internet
            Archive. JobHop v2 (VDAB / Ghent University), 355,315 resume
            trajectories, ESCO-coded, CC BY 4.0. Skill matches: PivotHop
            corpus, 77,443 mapped postings across 153 occupations, July
            2026. Flow scores are origin-normalized; pairs sharing a census
            occupation bucket are reported as unresolved rather than
            invented. Full source catalog and licensing notes in our public
            data documentation.
          </p>
        </Sources>
      </>
    ),
  },

  {
    slug: 'careers-people-never-leave',
    title: 'The careers people never leave, and the ones they flee',
    pillar: 'Career Half-Life',
    date: 'July 2026',
    dek: 'Federal projections put a number on how often workers in each occupation move to a different one in an average year. Pharmacists: 1.3 percent. Tutors: 8.1. The spread is not random, and it is mostly not about loving your job.',
    minutes: 8,
    faq: [
      { q: 'How many people change careers each year?', a: 'BLS Employment Projections (2024–34) put the annual occupational transfer rate at 5.9 percent of workers, with another 4.7 percent leaving the labor force. Roughly one worker in seventeen moves to a different occupation in an average year.' },
      { q: 'Which careers have the lowest turnover to other occupations?', a: 'Expensively licensed ones. Pharmacists (1.3 percent a year), lawyers (1.4), and physical therapists (1.5) top the stickiness list in our tracked set, all doctorate-or-equivalent gated and all with six-figure or near six-figure medians.' },
      { q: 'Do licensed workers change careers less often?', a: 'Only when the license was expensive. Across our tracked occupations, licensed and unlicensed workers transfer at nearly identical average rates (4.2 versus 4.4 percent a year). A chef’s certificate does not hold anyone; a pharmacy doctorate does.' },
      { q: 'How often do architects leave architecture?', a: 'About 3.3 percent move to a different occupation in an average year, with another 2.5 percent leaving the labor force, per BLS 2024–34 projections. That is notably below the 5.9 percent all-occupation transfer rate.' },
    ],
    body: (
      <>
        <p>
          In an average year, <strong>5.9 percent</strong> of American
          workers move to a different occupation, and another{' '}
          <strong>4.7 percent</strong> leave the labor force. That is the
          all-occupation baseline from the <a className="gl" href="/glossary#bls">Bureau of Labor Statistics</a> (BLS) 2024–34 Employment
          Projections, the same dataset agencies use to forecast openings.
          One worker in seventeen changes what they do. The interesting part
          is how unevenly that churn is distributed.
        </p>
        <p>
          We joined the per-occupation rates to the 153 occupations our
          instrument tracks. The spread runs from pharmacists at 1.3 percent
          a year to tutors at 8.1. Same economy, six-fold difference in the
          odds that a given colleague is gone next year.
        </p>
        <h2>The stickiest careers in our set</h2>
        <table className="post-table">
          <caption>Lowest annual occupational-transfer rates · BLS EP 2024–34 × PivotHop corpus medians, July 2026</caption>
          <thead><tr><th>Occupation</th><th className="num">Transfer /yr</th><th className="num">Exit /yr</th><th className="num">Posted median</th></tr></thead>
          <tbody>
            <tr><td><strong>Pharmacist</strong></td><td className="num"><strong>1.3%</strong></td><td className="num">2.4%</td><td className="num">$99,140</td></tr>
            <tr><td><strong>Lawyer</strong></td><td className="num"><strong>1.4%</strong></td><td className="num">1.8%</td><td className="num">$137,576</td></tr>
            <tr><td>Physical therapist</td><td className="num">1.5%</td><td className="num">2.1%</td><td className="num">$99,607</td></tr>
            <tr><td>Nurse practitioner</td><td className="num">2.1%</td><td className="num">2.2%</td><td className="num">$86,521</td></tr>
            <tr><td>Registered nurse</td><td className="num">2.1%</td><td className="num">2.8%</td><td className="num">$73,616</td></tr>
            <tr><td>Psychologist</td><td className="num">2.2%</td><td className="num">2.7%</td><td className="num">$119,728</td></tr>
            <tr><td>Actuary</td><td className="num">2.6%</td><td className="num">1.8%</td><td className="num">$122,291</td></tr>
          </tbody>
        </table>
        <p>
          Every one of those is licensed, and not casually licensed:
          doctorates, bar exams, actuarial exam sequences that take most of
          a decade. Then look three rows further down our ranking and the
          story complicates. Software engineers transfer at{' '}
          <strong>3.2 percent</strong> a year, stickier than registered
          nurses, with no license at all. Whatever is holding people, it is
          not only the credential.
        </p>
        <h2>The revolving doors</h2>
        <table className="post-table">
          <caption>Highest annual occupational-transfer rates · same sources</caption>
          <thead><tr><th>Occupation</th><th className="num">Transfer /yr</th><th className="num">Exit /yr</th></tr></thead>
          <tbody>
            <tr><td><strong>Tutor</strong></td><td className="num"><strong>8.1%</strong></td><td className="num"><strong>9.0%</strong></td></tr>
            <tr><td>Chef</td><td className="num">7.8%</td><td className="num">3.4%</td></tr>
            <tr><td>Customer support specialist</td><td className="num">7.4%</td><td className="num">5.6%</td></tr>
            <tr><td><strong>Medical assistant</strong></td><td className="num"><strong>7.4%</strong></td><td className="num">4.5%</td></tr>
            <tr><td>Pilot</td><td className="num">7.2%</td><td className="num">3.8%</td></tr>
            <tr><td>Paralegal</td><td className="num">7.2%</td><td className="num">3.2%</td></tr>
            <tr><td>Flight attendant</td><td className="num">7.1%</td><td className="num">6.4%</td></tr>
          </tbody>
        </table>
        <p>
          Tutors turn over almost completely: 8.1 percent transfer out and
          another 9 percent exit the labor force every year, which is what
          you would expect from a role that is often a between-things job
          rather than a destination. Chefs and medical assistants churn
          despite holding certificates. The pilot figure looks strange
          until you notice the BLS category mixes commercial pilots
          (crop dusting, charters, instruction) with the airline majors;
          the instability lives at the commercial end.
        </p>
        <h2>Two different ways to leave</h2>
        <p>
          The table separates transfers (moved to a different occupation)
          from exits (left the labor force), and the two tell different
          stories about the same job. Tutors post the highest exit rate in
          our set, 9 percent a year, because tutoring is frequently a
          role people pass through on the way to school, parenting, or
          retirement. Flight attendants exit at 6.4 percent, nearly as
          high, an occupation people age out of or step away from rather
          than convert into something adjacent. Chefs are the reverse
          case: only 3.4 percent exit, but 7.8 percent transfer, meaning
          chefs who leave kitchens overwhelmingly keep working, just not
          as chefs. High exit reads as attrition from work itself; high
          transfer reads as skills going somewhere else. If you are
          planning a pivot, the second population is your competition and
          your proof of feasibility at once.
        </p>
        <p>
          Separations are also where job openings actually come from. The
          same BLS table projects <strong>18.9 million</strong> openings a
          year across the economy, and the overwhelming majority are
          replacement needs, someone transferred or exited, rather than
          newly created positions. Every churny occupation on the second
          table is, from the other side of the desk, an occupation that is
          constantly hiring.
        </p>
        <div className="post-callout"><b>r = −0.44</b><span>the correlation between an occupation’s posted median salary and its annual transfer rate across 123 occupations. Higher pay, fewer departures, with licensing doing less work than the paycheck.</span></div>
        <p>
          Because here is the twist worth keeping: licensing by itself
          barely matters. Licensed occupations in our set average 4.2
          percent annual transfer; unlicensed, 4.4. What separates the
          sticky from the churny is what the position cost to reach and
          what it pays to stay. A pharmacy doctorate is a moat. A food
          handler’s certificate is a formality. Both are licenses.
        </p>
        <p>
          Medical assistant is the list’s most instructive entry, because
          its exits are not random. The observed-flow data shows departing
          medical assistants overwhelmingly become registered nurses, the
          ladder working as designed. What they almost never do is jump
          straight to nurse practitioner, despite a 76 percent skill match.
          One rung at a time, license by license. We wrote up that
          full pattern in “Where people actually go.”
        </p>
        <h2>Where this leaves you</h2>
        <p>
          Your occupation’s transfer rate is your base odds, the prior
          before anything about you. An architect’s 3.3 percent means
          leaving is unusual, which cuts both ways: fewer competitors on
          the way out, and less well-worn paths (the strongest observed one
          leads to interior design). A paralegal’s 7.2 percent means the
          door is already revolving, and the question is not whether people
          leave but where they land best. The instrument now carries the
          rate for every origin we track. Check your base rate before you decide you are stuck, because in several of these occupations, statistically, nobody is. Each occupation’s full pay distribution, and the trend behind it, now lives on its <a className="gl" href="/salary">salary page</a>.
        </p>
        <Sources>
          <p>
            Transfer and exit rates: BLS Employment Projections, Table 1.10,
            2024–34 vintage, annual averages, 832 detailed occupations,
            public domain, joined to 147 of our 153 tracked occupations by
            <a className="gl" href="/glossary#soc">Standard Occupational Classification</a> (SOC) code. Posted medians: PivotHop corpus, 77,443 mapped
            postings, July 2026, cells floored at 100 postings. The
            salary-transfer correlation is Pearson’s r over the 123
            occupations clearing that floor. Observed destination flows:
            see the source box in “Where people actually go.”
          </p>
        </Sources>
      </>
    ),
  },

  {
    slug: 'remote-friendly-careers-ranked',
    title: 'Remote-friendly careers, ranked from 77,443 live postings (and the license that keeps you in the office)',
    pillar: 'Shape of Work',
    date: 'July 2026',
    dek: 'Fully-remote share by occupation, from our own corpus: sales engineers at 29.7 percent, registered nurses at 0.3. The strongest predictor is not the industry. It is whether your job requires a state-issued license, and whether that license has learned to cross state lines.',
    minutes: 9,
    faq: [
      { q: 'Which careers have the most remote jobs in 2026?', a: 'In our 77,443-posting corpus: sales engineer (29.7 percent of postings fully remote), motion designer (25.0), customer support specialist (22.7), management consultant (20.4), QA engineer (19.7), and account executive (19.6). Software engineer sits at 15.6 percent on the largest sample we track.' },
      { q: 'Why do licensed professions have so few remote jobs?', a: 'A license binds you to the issuing state, so an employer hiring remote inherits a fifty-jurisdiction compliance problem. Licensed occupations in our corpus run 1.5 percent fully remote against 5.5 percent for unlicensed ones, a 3.7× gap.' },
      { q: 'What are licensure compacts and do they enable remote work?', a: 'Interstate agreements that let one state’s license authorize practice in the others. PSYPACT covers psychologists in 42 jurisdictions as of June 2026, and the Nurse Licensure Compact covers 41 states. They unlock remote work only where the work itself is deliverable through a screen: psychologists reach 5.7 percent remote in our corpus while bedside nursing stays at 0.3.' },
      { q: 'Which fields are becoming more remote-friendly?', a: 'Tracking by FlexJobs found legal, insurance, social media, and account management roles each grew fully-remote postings 30 percent or more during 2025. In our own corpus the legal profession’s words-only end already shows it: lawyers post 8.6 percent remote while the paralegals supporting them post 1 percent.' },
    ],
    body: (
      <>
        <p>
          Across the 77,443 postings PivotHop’s scrapers currently hold,{' '}
          <strong>5.3 percent</strong> are explicitly fully remote. That
          headline number is almost useless, because the distribution
          underneath it is savage: the most remote-friendly occupation we
          track posts remote jobs at roughly <strong>300 times</strong> the
          rate of the least. External counts bracket ours, for calibration:
          <a className="gl" href="/glossary#roberthalf">Robert Half</a>’s Q1 2026 read puts 4 percent of new postings fully
          remote (19 percent hybrid), while boards that lean professional
          report closer to 12.
        </p>
        <h2>The ranking</h2>
        <table className="post-table">
          <caption>Share of postings fully remote, by occupation · PivotHop corpus, July 2026, occupations with 100+ postings</caption>
          <thead><tr><th>Occupation</th><th className="num">Remote share</th><th className="num">Postings</th></tr></thead>
          <tbody>
            <tr><td><strong>Sales engineer</strong></td><td className="num"><strong>29.7%</strong></td><td className="num">387</td></tr>
            <tr><td><strong>Motion designer</strong></td><td className="num"><strong>25.0%</strong></td><td className="num">216</td></tr>
            <tr><td>Customer support specialist</td><td className="num">22.7%</td><td className="num">704</td></tr>
            <tr><td>Management consultant</td><td className="num">20.4%</td><td className="num">1,818</td></tr>
            <tr><td>QA engineer</td><td className="num">19.7%</td><td className="num">780</td></tr>
            <tr><td>Account executive</td><td className="num">19.6%</td><td className="num">1,764</td></tr>
            <tr><td>Software engineer</td><td className="num">15.6%</td><td className="num">4,041</td></tr>
            <tr><td>Translator</td><td className="num">14.1%</td><td className="num">213</td></tr>
            <tr><td><a className="gl" href="/glossary#seo">SEO</a> (search engine optimization) specialist</td><td className="num">13.9%</td><td className="num">180</td></tr>
            <tr><td>Medical writer</td><td className="num">12.2%</td><td className="num">238</td></tr>
            <tr><td>Recruiter</td><td className="num">9.4%</td><td className="num">520</td></tr>
            <tr><td>Lawyer</td><td className="num">8.6%</td><td className="num">408</td></tr>
          </tbody>
        </table>
        <p>
          Two surprises before the pattern. First, the most remote job in
          the corpus is a sales job. Sales engineering is technical
          credibility delivered over video calls, and employers apparently
          concluded the territory model beat the office years ago. Second,
          the design profession split down the middle: motion designers post
          25 percent remote while <a className="gl" href="/glossary#ux">UX</a> (user-experience design) designers post 1.5 and graphic
          designers 1.8. Motion work ships as files. Product design work,
          post-RTO, apparently ships as meetings.
        </p>
        <h2>The license is the dividing line</h2>
        <p>
          Sort the whole corpus by one bit, does the occupation require a
          state license, and the remote market splits open.
        </p>
        <div className="post-callout"><b>1.5% vs 5.5%</b><span>average fully-remote share for <strong>licensed</strong> occupations against unlicensed ones in our corpus. The credential that certifies you also pins you to a map.</span></div>
        <p>
          The mechanism is boring and absolute: a license is issued by a
          state, valid in that state. An employer hiring a remote dietitian
          or teacher inherits a compliance matrix across every state its
          people might sit in, so it writes “on-site” instead. The floor
          of our ranking is wall-to-wall licensed and physical: <a className="gl" href="/glossary#hvac">HVAC</a> (heating, ventilation, and air conditioning)
          technicians (435 postings, zero remote), landscape architects
          (359, zero), teaching assistants, clinical research coordinators,
          flight attendants, school administrators. All at exactly 0.0
          percent.
        </p>
        <p>
          The exceptions prove the rule with unusual precision, because the
          exceptions are legislation. Psychology built itself an interstate
          compact, <a className="gl" href="/glossary#psypact">PSYPACT</a> (the interstate psychology practice compact), now spanning <strong>42 jurisdictions</strong>{' '}
          as of June 2026 (Montana joined in October 2025). One
          authorization, forty-plus states of legal telepractice. In our
          corpus psychologists post <strong>5.7 percent</strong> remote,
          the highest of any licensed clinical occupation we track, nearly
          four times the licensed average. Nursing has an equally mature
          compact, 41 states, and registered nurses still post{' '}
          <strong>0.3 percent</strong> remote, because a compact can move
          the license across a state line but not the patient’s body.
          Lawyers, whose product is entirely words, post 8.6 percent even
          though bar admission never joined a compact at all.
        </p>
        <div className="post-pullq">
          A compact unlocks remote work exactly where the work was already
          made of words. It does nothing for hands.
        </div>
        <p>
          Which yields a two-question test for any licensed career: can the
          work pass through a screen, and has the license learned to cross
          state lines? Yes and yes, remote follows (psychology). Yes and
          no, remote arrives anyway, slower (law). No and yes, the compact
          helps travel staffing, not remote (nursing). No and no, see you
          at the office (HVAC, forever).
        </p>
        <h2>What a zero is worth</h2>
        <p>
          A note on the floor of the ranking, because zero is a stronger
          claim than a small number. HVAC technician’s 0.0 percent is
          computed over 435 live postings; landscape architect’s over 359.
          At those sample sizes a true 3 percent remote market would
          almost certainly have shown at least one listing. It did not.
          These are not thin cells rounding down; they are categories
          where the remote job you are hoping for does not currently
          exist on the boards we track.
        </p>
        <p>
          Architecture, our launch vertical, sits barely above that floor
          at <strong>1.6 percent</strong> of 1,290 postings. The reasons
          are structural twice over: the work is anchored to sites and
          consultants, and the stamp is anchored to a state board, with
          reciprocity that never matured into a live compact the way
          psychology’s did. The architects in our data who wanted remote
          did not find remote architecture. They found the adjacent rooms,
          and the two most remote-friendly of those, technical writing
          and design-flavored consulting, appear in the top third of the
          ranking above.
        </p>
        <h2>Moving toward remote, and away</h2>
        <p>
          Our corpus is a snapshot, so for direction we lean on dated
          external tracking. <a className="gl" href="/glossary#flexjobs">FlexJobs</a>’ year-over-year index found legal,
          insurance, social media, and account management postings each
          grew their fully-remote counts <strong>30 percent or more
          during 2025</strong>, with engineering, administrative, and sales
          categories nearly doubling. The unlicensed service layer around
          licensed professions is where the growth concentrates: medical
          writers (12.2 percent remote in our corpus) ride healthcare’s
          remote wave without touching a patient, and remote paralegal
          roles are growing from a low base while lawyers above them
          already work from home. Meanwhile the <a className="gl" href="/glossary#rto">RTO</a> (return-to-office) mandates we counted in
          “The giants disagree” keep pulling the big-company end of
          product and design work back on-site, which is likely part of why
          UX sits at 1.5 percent while freelance-shaped creative work sits
          at 25.
        </p>
        <h2>Where this leaves you</h2>
        <p>
          If remote is the constraint you are optimizing, read your options
          in this order. Unlicensed, words-based, deliverable-shaped work
          clears every gate: sales engineering, motion design, technical
          and medical writing, SEO, translation, consulting. If you hold a
          clinical license, check whether your profession’s compact exists
          and whether your work can cross a screen; psychology is the
          template, and the therapist route to it is one of the
          best-trodden paths in our transition data. And if your work is
          hands-on and licensed, the remote share is not low, it is zero
          across thousands of postings, and the honest move is a pivot into
          the words-shaped role adjacent to your field rather than a hunt
          for a unicorn listing. The instrument prices those routes; run
          your origin and filter for what actually ships remote.
        </p>
        <Sources>
          <p>
            Remote shares: PivotHop corpus, 77,443 mapped postings across
            153 occupations, July 2026; fully-remote means the posting
            carries an explicit remote flag; occupation cells floored at
            100 postings (128 qualify); licensed/unlicensed means from our
            taxonomy’s license layer (40 licensed occupations). External
            calibration and trend: Robert Half remote-work statistics, Q1
            2026; FlexJobs Remote Work Economy Index, 2025 growth by
            category. Compacts: psypact.gov (42 jurisdictions, June 2026);
            <a className="gl" href="/glossary#ncsbn">NCSBN</a> Nurse Licensure Compact (41 states, 2026, Pennsylvania
            July 2025, Connecticut October 2025). Directional claims about
            2025 growth are the trackers’ counts, not ours.
          </p>
        </Sources>
      </>
    ),
  },
];