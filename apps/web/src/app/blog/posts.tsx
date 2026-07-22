import type { ReactNode } from 'react';

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
};

const Sources = ({ children }: { children: ReactNode }) => (
  <div className="post-sources">
    <span className="lbl">Sources and method</span>
    {children}
  </div>
);

export const POSTS: Post[] = [
  {
    slug: 'the-adjacency-premium',
    title: 'The adjacency premium: what 148 strong career connections pay',
    pillar: 'Run It 10,000 Times',
    date: 'July 2026',
    dek: 'A third of well-matched career moves lead somewhere that pays more. The biggest raises hide behind licenses. Here is the whole table logic.',
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
          than where they start. That number deserves a moment. The standard story
          about career changes is sacrifice: start over, take the pay cut, earn
          your way back. The postings say that story is true only two times out of
          three. The third time, the adjacent role simply pays better, and the
          main thing between you and it is that nobody told you it was adjacent.
        </p>
        <div className="post-callout"><b>36%</b><span>of the 148 strong career adjacencies we measured point to a destination that posts a <strong>higher</strong> salary midpoint than the origin.</span></div>
        <h3>The biggest premiums, and the catch</h3>
        <p>
          The top of the table, with the licensing reality attached:
        </p>
        <table className="post-table">
          <caption>Largest pay premiums among strong adjacencies · PivotHop, July 2026</caption>
          <thead><tr><th>Move</th><th>Skill match</th><th className="num">Pay delta</th><th>The gate</th></tr></thead>
          <tbody>
            <tr><td>Medical assistant → <strong>Pharmacist</strong></td><td>58%</td><td className="num"><strong>+125%</strong></td><td>Doctorate + state license</td></tr>
            <tr><td>Bookkeeper → <strong>Financial controller</strong></td><td>55%</td><td className="num"><strong>+108%</strong></td><td>CPA for some roles only</td></tr>
            <tr><td>Medical assistant → Physical therapist</td><td>68%</td><td className="num">+92%</td><td>Licensure exam</td></tr>
            <tr><td>Customer support → Flight attendant</td><td>71%</td><td className="num">+69%</td><td>FAA certification</td></tr>
            <tr><td>Architect → <strong>Electrical engineer</strong></td><td>58%</td><td className="num">+67%</td><td>PE for sign-off roles only</td></tr>
          </tbody>
        </table>
        <p>
          Now the catch, and it is the honest heart of this piece: the biggest
          premiums sit behind licenses. Pharmacist requires a doctorate and a
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
        <h3>How to read this if you are considering a move</h3>
        <p>
          Treat a pivot as a bet with three numbers: your skill coverage today,
          the pay delta, and the gate. Our instrument shows the first two on
          every route and flags the third on every licensed profession. A 70
          percent match into a plus 20 percent unlicensed role is often a better
          bet than a 55 percent match into a plus 100 percent licensed one,
          because the second bet includes years and tuition that the salary line
          does not show.
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
          Revit at 11.6 percent, sustainability at 9.2, project management at
          6.6, specification writing at 4.3, construction documentation at 4.0,
          urban design at 3.6, BIM at 3.3, construction administration at 2.8,
          quality control at 2.8, and LEED at 2.7.
        </p>
        <h3>Three things worth noticing</h3>
        <p>
          First, sustainability is the number two skill in architecture hiring.
          Not a specialization, not a nice-to-have: nearly one posting in ten
          names it, ahead of every design tool except Revit. If you are an
          architect who has done real energy modeling or LEED documentation, you
          are holding a skill the market prices higher than most of your software
          list.
        </p>
        <p>
          Second, the management cluster outweighs the drawing cluster. Project
          management, construction administration, and quality control together
          appear more often than Revit does. The profession sells itself to
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
        <h3>What this means if you are leaving, and if you are staying</h3>
        <p>
          If you are considering an exit, inventory yourself against the demand
          list, not the curriculum. The market credits you for the unglamorous
          middle of your week. If you are staying, the same list is a raise
          strategy: sustainability credentials and specification depth are the
          two cheapest ways to move up the demand curve without leaving the
          profession.
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
    dek: 'Half the postings titled architect are not about buildings. Every career site you have used mixes them together. Here is how we split them, and why it matters.',
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
        <h3>How we split the word</h3>
        <p>
          Our pipeline treats the bare word architect as claimable only by an
          exact match. A posting titled just Architect maps to the building
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
          qualified phrases, currently about 600 synonyms, and the matcher takes
          the longest specific phrase before it ever considers a generic word.
        </p>
        <h3>Why you should care even if you are not an architect</h3>
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
          entries, clearly labeled by field, with separate data underneath. The
          building one currently reads 1,090 postings. The pile it was rescued
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
          manager. This is the strongest single thread in the data: project
          management appears in 6.6 percent of architect postings, and the
          management cluster is the biggest overlap in most architect routes.
          The modeler inside you is a BIM manager or architectural drafter,
          the two most Revit-weighted destinations we track. The environmental
          conscience is a sustainability consultant, a route our model scores
          in the nineties for architects who list energy modeling and LEED.
          The specifier, the person who knows what a spec section is for, maps
          toward construction estimating and technical writing. The urbanist
          goes to urban planning, license required in some states. The
          visualizer goes to 3D and rendering work across games, film, and
          product marketing. And the detail conscience, the one who catches
          the flashing problem, is quality control and building surveying in
          waiting.
        </p>
        <h3>Why unbundling beats reinvention</h3>
        <p>
          The standard career-change fantasy is reinvention: become someone new.
          The data suggests something less cinematic and more achievable: pick
          the thread of your current job you like most, find the profession
          that is mostly that thread, and close a much smaller gap than you
          feared. An architect moving to sustainability consulting is not
          starting over. They are dropping six sevenths of the bundle and
          getting paid for the seventh they kept.
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
          graph, 1,112 routes in total, and asked a boring question with
          expensive answers: how many of these destinations can you legally
          just start doing? The result: 64 percent are license-free, 18 percent
          require a license outright, and the rest need one for some roles or
          some states.
        </p>
        <h3>The pattern</h3>
        <p>
          Licensing clusters by field, and it clusters hard. A nurse's entire
          top ring is licensed: nurse practitioner, dietitian, physical
          therapist, pharmacist, therapist. Healthcare does not have adjacent
          careers so much as adjacent credentials. An architect's ring is
          mixed: interior design is open in most states, structural and civil
          engineering need a PE for responsible charge, construction
          management needs nothing but scars. A software engineer's ring is
          almost entirely open, which is one unglamorous reason technology
          careers move faster: the exits have no tollbooths.
        </p>
        <p>
          This changes how you should read a match percentage. Our instrument
          might say you are 63 percent ready for pharmacist, and that number is
          true of your skills. It is silent about the doctorate unless we say
          it out loud, so we do: every licensed destination in the product
          carries a plain label, licensed profession, with the specific gate
          named. A route through a license is not a worse route. It is a
          different loan.
        </p>
        <h3>Half-life arithmetic</h3>
        <p>
          Here is the calculation that matters. Suppose the move you want pays
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
          comfort blanket in a career book. We wanted the measured version, so we
          asked a blunt question of our posting corpus: which skills appear in
          the hiring demand of the most different occupations? Not which skills
          sound portable. Which ones employers in unrelated fields actually put
          in writing.
        </p>
        <p>
          The answer, across 132 occupations with enough postings to trust:
          <strong> data analysis and systems monitoring tie at the top</strong>,
          each appearing meaningfully in the demand of 40 occupations.
        </p>
        <div className="post-bars">
          {[['Data analysis', 40], ['Systems monitoring', 40], ['Project management', 33], ['Supply chain', 30], ['Training & facilitation', 28], ['Customer service', 22], ['Process improvement', 21], ['Python', 20], ['SQL', 19], ['Professional writing', 19]].map(([k, v]) => (
            <div key={String(k)} className="pb-row"><span className="k">{k}</span><span className="t"><span className="f" style={{ width: `${(Number(v) / 40) * 100}%` }}></span></span><span className="v">{v}</span></div>
          ))}
        </div>
        <p>
          Presentation and accounting follow at 18 occupations each, prototyping
          and procurement at 17.
        </p>
        <p>
          And at number fifteen, the newcomer: working with large language
          models, named in the demand of 16 different occupations. Not just AI
          companies. Marketing teams, law firms, logistics operators. A skill
          that did not exist as a hiring term three years ago now travels better
          than most things taught in a four-year degree.
        </p>
        <h3>What the top of the list has in common</h3>
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
        <h3>The practical read</h3>
        <p>
          If you are mid-career and worried your experience is too specific,
          this list is the antidote and the assignment. Go through a normal week
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
        <h3>Where this leaves you</h3>
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
          Career change at 40 gets discussed as a feelings problem. It is mostly
          an arithmetic problem, and the arithmetic is friendlier than the
          internet suggests. Here is the whole calculation, with the numbers we
          can actually measure.
        </p>
        <h3>The time horizon is the variable that matters</h3>
        <p>
          At 40 you have, give or take, 25 working years left. That is more
          career remaining than a 22-year-old has spent in school, total, since
          kindergarten. It is enough runway to amortize almost any retraining.
          A two-year credential that unlocks a 40 percent raise pays for itself
          several times before you are 50. The same move at 58 might never break
          even. Most advice fails by ignoring this variable entirely, in both
          directions: it tells 40-year-olds they are too old and 58-year-olds to
          follow their passion into a five-year licensure path.
        </p>
        <h3>The pay cut is a risk, not a rule</h3>
        <p>
          The standard assumption is that changing fields means starting over on
          salary. We measured it. Across 148 strong adjacencies in our graph,
          moves where your existing skills already cover at least half the
          destination's demands, 36 percent point somewhere that posts a higher
          salary midpoint than where you started. One move in three is a raise,
          not a sacrifice. The trick is that those moves are unevenly
          advertised: nobody recruits you into them, because recruiters search
          titles and your title is wrong.
        </p>
        <h3>The license question, answered with a table</h3>
        <p>
          The biggest raises in our data hide behind licenses, which is exactly
          the wrong shape for a 40-year-old in a hurry. So we cut the table the
          other way and kept only license-free destinations. The best
          well-matched, no-new-degree raises right now: bookkeeper to financial
          controller at plus 111 percent, sales representative to customer
          success manager at plus 68, accountant to financial controller at
          plus 52, architectural drafter to MEP engineering at plus 52,
          architect to electrical engineering at plus 50, customer support to
          executive assistant at plus 47. Some employers will want a
          certification. None requires going back to school.
        </p>
        <h3>What 40 actually changes</h3>
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
        <h3>Where this leaves you</h3>
        <p>
          Run the numbers before the feelings. Your remaining years, the
          measured overlap between your week and the destination's postings,
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
          shift. We wanted the destination data instead of the discourse, so we
          mapped 1,698 live nursing postings against every other profession we
          track. What comes back is coherent, a little sobering, and more
          useful than the listicles.
        </p>
        <h3>The five best exits are all licensed</h3>
        <p>
          By skill overlap, the destinations that best match what nursing
          postings already ask for: nurse practitioner at 77 percent, dietitian
          at 74, physical therapist at 68, therapist or counselor at 67,
          pharmacist at 65. Then social work at 49, licensed only for clinical
          roles.
        </p>
        <p>
          Notice the pattern. Every single top exit runs through a license.
          Healthcare does not really have adjacent careers; it has adjacent
          credentials. The skills transfer beautifully, patient assessment,
          documentation, care coordination, pharmacology basics, and then a
          state board stands at the door of each destination asking for two to
          six more years. This is not a reason to stay put. It is a reason to
          treat a nursing exit as a time-horizon decision, not a skills
          decision. The skills were never the problem.
        </p>
        <h3>The un-glamorous middle path</h3>
        <p>
          Below the licensed tier sits a quieter set of moves the forums rarely
          mention: case management, clinical research coordination, utilization
          review, health education, clinical informatics. Lower ceremony, no
          new license in most states, and they trade on exactly the parts of
          nursing that transfer without a board exam: judgment, documentation
          discipline, and the ability to talk to both patients and physicians
          without losing anything in translation. The pay is usually a lateral
          step from the blended US nursing median of about 96,500 dollars in
          our data, sometimes a small raise with seniority.
        </p>
        <h3>About remote work, honestly</h3>
        <p>
          Remote nursing-adjacent work exists, telehealth triage and remote
          case review appear in our corpus, but it is a thin slice of demand,
          and it is competitive precisely because every tired nurse in the
          country has the same idea at 3 a.m. Treat remote as a bonus feature
          of a destination you would want anyway, not as the destination.
        </p>
        <h3>Where this leaves you</h3>
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
            BLS OEWS anchor). Licensing annotations hand-reviewed. Telehealth
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
          inside a year, and 670 of them state pay. The blended US median lands
          at about <strong>150,500 dollars</strong>. That much everyone suspected. What the
          reach table shows is less expected, and more useful if you are
          standing outside the field wondering about the door.
        </p>
        <h3>The doorway professions, measured</h3>
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
        <h3>What the postings ask for, in order</h3>
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
        <h3>An honest note on the salary number</h3>
        <p>
          Posted AI salaries run hot relative to official statistics; our
          reconciliation layer flags the gap at over 100 percent against the
          government anchor for the occupation family, the widest skew in our
          data. Some of that is real scarcity pricing. Some is asking-price
          inflation and remote-tech posting bias. Our 150,500 figure already
          blends toward the official anchor. Treat glossier numbers you see
          elsewhere accordingly.
        </p>
        <h3>Where this leaves you</h3>
        <p>
          If you are in one of the doorway professions, the gap between you and
          the title is smaller than the mythology says and it is made of
          specific, learnable things: LLM application work, retrieval, and
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
            pay; blended median shrinks posting percentiles toward the BLS
            OEWS anchor for the occupation family (empirical Bayes, K=40).
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
          the numbers. Here is what 1,178 live architect postings and the
          adjacency graph around them actually say, from a team whose founder
          drew construction sets for years before writing a line of this
          pipeline.
        </p>
        <h3>What the market says architecture is</h3>
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
        <h3>The exits, priced</h3>
        <p>
          The measured routes out: interior design at 66 percent skill match,
          electrical engineering at 57, structural at 52, landscape at 51,
          mechanical at 49. Construction management and estimating sit just
          behind, and for architects who can show real energy modeling, our
          personalized model scores sustainability consulting in the
          nineties.
        </p>
        <p>
          Now the pay, which the threads never quantify. The blended US median
          for architects in our data is about 83,700 dollars. Structural
          engineers: about 107,000. That is a 28 percent gap between two
          professions that share half their skill demand and often the same
          hallway. Electrical engineering prices similarly. Part of the gap is
          the PE license and the liability it carries. Part of it is that
          engineering fees never got culturally negotiated down the way design
          fees did. Either way, the gap is real, durable across our runs, and
          it flows toward people willing to carry calculations instead of
          drawings.
        </p>
        <h3>The part the forums get wrong in both directions</h3>
        <p>
          The doom caucus is wrong: 1,178 live postings is not a dying
          profession, and the sustainability wave is creating architect demand
          that did not exist five years ago. The passion caucus is also wrong:
          passion does not close a 28 percent structural pay gap, and telling
          people to ignore it is telling them to donate the difference to
          their employer. The honest frame is neither. Architecture is a
          viable profession with a measurable discount attached, surrounded by
          well-matched exits that mostly price higher. Staying is defensible.
          Leaving is defensible. Staying while believing you have no options
          is the only position the data refuses to support.
        </p>
        <h3>Where this leaves you</h3>
        <p>
          Separate two questions the threads always merge. First: can you
          leave? Measurably yes, in several directions, often at a raise, and
          the gaps are specific skills, not new degrees. Second: should you?
          That depends on which hours of your week you want more of, and no
          scraper reaches that data. What we can do is make the first question
          boring, settled, and numeric, so you can spend your energy on the
          second one, which was always the real question anyway. Type
          architect into the instrument, edit the skills until it looks like
          your actual week, and see your own map. The forum will still be
          there afterward. You will need it less.
        </p>
        <Sources>
          <p>
            PivotHop July 2026 run: 1,178 architect postings; route matches
            are destination-demand coverage over top-20 posting skills;
            salaries are blended US medians (postings shrunk toward BLS OEWS
            anchors; architect n=433 posted observations, structural engineer
            similar). Sustainability route score from the personalized model
            with energy modeling and LEED added. The founder's bias is
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
          outrage cycle on purpose, and rode the anger to a 15 million dollar
          round from Andreessen Horowitz and a valuation around 120 million.
          The founder gave interviews explaining that provocation was the
          strategy. Rage bait as go-to-market, said out loud, with a straight
          face.
        </p>
        <p>
          Then, in March 2026, the same founder posted that the 7 million
          dollars in annual recurring revenue he had told TechCrunch about the
          previous summer was, in his words, blatantly dishonest. A formal
          retraction, on X, of a number that had been load-bearing for the
          whole story. The apology tour then misstated how the original
          interview came about, which TechCrunch also documented. You could
          not write a cleaner parable if you tried.
        </p>
        <h3>The uncomfortable part: it worked</h3>
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
        <h3>The part they leave out of the playbook</h3>
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
        <h3>What this means if you work in tech</h3>
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
        <h3>Where this leaves you</h3>
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
            from the PivotHop posting corpus. No numbers in this piece were
            invented, which we mention because apparently it needs saying.
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
          Our corpus currently holds 337 postings with forward deployed in the
          title. For scale, that is more than four times the number of prompt
          engineer postings, a title that got a thousand thinkpieces. Nobody
          writes thinkpieces about forward-deployed engineers. Companies just
          keep hiring them, which is usually the better signal.
        </p>
        <h3>What the job actually is</h3>
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
        <h3>Who the role fits, measured</h3>
        <p>
          Read a batch of these postings and a profile emerges: writes real
          code, runs real meetings, tolerates ambiguity, can tell a customer
          no without losing the account, can tell the product team the
          customer is right without losing face. In our adjacency graph, the
          professions whose measured skills sit closest to that mix are sales
          engineering and solutions architecture, which is consistent with
          the strangest number in our AI analysis: sales engineers already
          cover 50 percent of AI engineer demand, ahead of software
          engineers. The industry needs translators with commit access, and
          it has needed them for a while.
        </p>
        <h3>The money and the trade</h3>
        <p>
          Salary data rarely breaks out the exact title, but the measured
          neighbors bracket it well: solutions architects at about 146,000
          dollars US blended median in our data, sales engineers around
          140,000, AI engineers about 150,500. The trade is travel, customer
          hours, and the particular exhaustion of being permanently between
          two organizations. The reward, beyond the band: forward-deployed
          work generates the rarest kind of resume line, provable impact at
          named customers, which converts into product, founding, and
          leadership roles unusually well. It is the apprenticeship the AI
          industry accidentally rebuilt.
        </p>
        <h3>Where this leaves you</h3>
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
            toward BLS OEWS anchors). The sales-engineer reach figure is
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
          nursery. Here is the July 2026 census of titles that were not a
          thing in 2023.
        </p>
        <h3>The census</h3>
        <p>
          Forward-deployed engineer: 337 postings, the clear leader, covered
          at length in its own piece. Agentic roles, engineers and product
          people building AI agents: 188 postings and climbing fast, the
          phrase spreading from labs into commerce and operations titles.
          Prompt engineer: 72 postings. Model evaluator: 13. AI red-teamer:
          11. AI safety roles: 11. Responsible AI titles: a handful.
          Growth engineer, the title Cluely-adjacent startups love: 3, which
          suggests the attention economy generates more discourse than
          headcount.
        </p>
        <h3>Which ones consolidate, which ones vanish</h3>
        <p>
          New titles follow one of two paths. Some consolidate into a broader
          role once the skill stops being exotic. Prompt engineering is
          visibly on this path: 72 postings against 943 for AI engineer, and
          in our adjacency graph the two roles overlap so heavily that the
          smaller one reads as a feature of the bigger one. The US median
          gap, about 102,000 dollars for the specialist against 150,500 for
          the generalist, is the market pricing the consolidation in real
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
        <h3>How to read a newborn title</h3>
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
        <h3>Where this leaves you</h3>
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
            medians from our blended engine (BLS OEWS anchored). Counts are
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
        <h3>The receipts, platform by platform</h3>
        <p>
          X made the loudest move: in January 2026 it discarded its legacy
          ranking stack entirely for a Grok-based transformer that reads every
          post and watches every video, making around 5 billion ranking
          decisions daily. The reported weights tell you what the model is
          for. A reply counts roughly 27 times a like. A genuine
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
          half, is now reported near 70 percent. The machine got pickier as
          everyone learned to feed it.
        </p>
        <p>
          And Google, the biggest publisher-facing change of all: AI
          Overviews went from about 6.5 percent of queries in January 2025 to
          roughly 48 percent of searches by early 2026, and somewhere between
          58 and 68 percent of searches now end with no click to any website.
          In the fully conversational AI Mode, the no-click figure reportedly
          reaches 93 percent. Google still reads the web. Increasingly, it
          reads it so you do not have to.
        </p>
        <h3>Why they all converged</h3>
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
        <h3>What it means if you publish anything</h3>
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
        <h3>Where this leaves you</h3>
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
            zero-click ranges from Semrush and independent SEO telemetry,
            2025 to 2026. Figures are the platforms' and analysts' claims,
            dated in text; feeds change faster than citations.
          </p>
        </Sources>
      </>
    ),
  },
  {
    slug: 'seo-died-again',
    title: 'SEO died again in 2026. Here is what the survivors are doing',
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
          SEO has died more times than rock and roll. This particular death,
          though, has numbers attached. AI Overviews, the Gemini-written
          answers at the top of Google, appeared on about 6.5 percent of
          queries in January 2025 and appear on roughly 48 percent of
          searches now. Between 58 and 68 percent of searches end with no
          click to any website. When an AI summary is present, clicks on
          traditional results reportedly drop by nearly half, and in the
          conversational AI Mode, 93 percent of sessions end without a
          click. If your business model was ranking pages and harvesting the
          clicks, that model has been repossessed.
        </p>
        <h3>The part that did not die</h3>
        <p>
          Read the same telemetry from the other side. Brands cited inside AI
          Overviews see around 35 percent higher organic clickthrough than
          uncited brands. The model still needs sources; it just stopped
          needing ten of them per query. Search traffic did not evaporate so
          much as consolidate onto whatever the machine decides is worth
          quoting. Which turns the old discipline inside out: the job is no
          longer to rank among many answers. It is to be the source the one
          answer is built from.
        </p>
        <h3>What the survivors do differently</h3>
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
        <h3>A small disclosure</h3>
        <p>
          We are not neutral observers here. This site publishes career data
          from our own pipeline precisely because original numbers are the
          one asset the new machine reliably rewards, and our posts carry
          direct answers and sources boxes for exactly the reasons described
          above. This piece is, among other things, us showing our homework.
          If the strategy is wrong, you will be able to watch it fail in
          public, which is more than most SEO advice offers.
        </p>
        <h3>Where this leaves you</h3>
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
      { q: 'Is SEO a good career now that AI answers most searches?', a: 'It is a changing one. Demand in our corpus is steady and the discipline is being rewritten toward AI visibility work (getting cited by answer engines), which favors people who can combine content judgment with measurement. The ceiling opens when the role broadens toward strategy or analytics.' },
      { q: 'What does an SEO specialist transition into?', a: 'By measured skill overlap in our graph: marketing manager (32 percent), copywriter (31), content strategist (30), and social media manager (26), with marketing management carrying roughly a 46,000 dollar median premium over the specialist role.' },
    ],
    body: (
      <>
        <p>
          There is a whole profession built on being findable, and right now
          it is having the strangest year of its existence. We track 178 SEO
          specialist postings in our corpus, 120 of them with stated pay.
          The blended US median: about 79,700 dollars. That number, and the
          numbers around it, tell a sharper career story than the discourse
          does.
        </p>
        <h3>Where the role sits in the pay landscape</h3>
        <p>
          Eighty thousand puts the SEO specialist in respectable but
          revealing company. Copywriters in our data sit near 81,700.
          Content strategists near 84,700. Data analysts, whose toolkit
          overlaps more than either side admits, near 97,000. Marketing
          managers, the role SEO specialists most often grow into, near
          125,900. The spread is the career advice: the specialist title
          pays for a craft, and the next 46,000 dollars pays for owning the
          strategy the craft serves. SEO is a fine place to stand and an
          expensive place to stop.
        </p>
        <h3>What the demand data says about the skill</h3>
        <p>
          Beyond the specialist role itself, SEO as a skill appears
          meaningfully in the posting demand of copywriters at 8.2 percent,
          content strategists at 5.5, and marketing managers at 3.2. Read
          that as the market saying SEO is becoming a literacy as much as a
          job: a thing adjacent professionals are expected to hold, the way
          everyone in an office eventually had to hold spreadsheets. For a
          specialist, that is both a threat and an exit ramp. The threat is
          commodification of the basics. The exit ramp is that every one of
          those adjacent roles values your depth, and our graph prices the
          moves: marketing manager at 32 percent measured overlap,
          copywriter at 31, content strategist at 30, social media manager
          at 26.
        </p>
        <h3>The rewrite happening inside the job</h3>
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
        <h3>An honest word on the floor and the ceiling</h3>
        <p>
          The floor: the low end of SEO, the tooling-and-checklists end, is
          exactly the work AI systems are best at absorbing, and postings
          for it will thin. The ceiling: people who can prove they moved
          revenue through search, in whatever form search takes, keep
          commanding marketing-leadership pay. The variable that decides
          which side you land on is measurement. The specialists who thrive
          in our data read like analysts who happen to work on visibility,
          not like content workers who happen to know meta tags.
        </p>
        <h3>Where this leaves you</h3>
        <p>
          If you are considering the field: enter through the new door,
          citations and AI visibility, and build the measurement habit from
          day one; the median is decent, the learning curve is real, and
          the seniority path runs through strategy. If you are already in
          it: your title's basics are becoming everyone's literacy, your
          frontier is brand new, and your best-paying neighbors are one
          measured step away. The profession built on being findable is
          being asked to find itself. On the evidence, it has done harder
          things.
        </p>
        <Sources>
          <p>
            SEO specialist counts, salaries, skill-demand shares, and
            transition overlaps: PivotHop July 2026 run (178 postings, 120
            with stated pay; blended US medians shrink posting percentiles
            toward BLS OEWS anchors; overlaps computed over top-20 posting
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
        <h3>Coincidence, or a legible transfer</h3>
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
          Our data makes the same point less romantically. When we unbundle
          the architect's measured skill set, the threads are spatial
          reasoning, systems coordination, visual communication, and staged
          sequencing, and those threads score high toward design and
          technical-creative fields in our adjacency graph. The capability
          layer, the O*NET abilities architecture shares with creative
          production, is the quiet reason an architecture dropout keeps
          turning up behind famous work: the training transfers even when
          the title does not.
        </p>
        <h3>What the dropouts kept</h3>
        <p>
          Weird Al kept the structural discipline; parody is form-perfect
          reconstruction, a measured survey of an existing building with new
          cladding. Chris Lowe kept the restraint; Pet Shop Boys records are
          famously engineered, minimal, load-calculated pop. Ice Cube has
          credited drafting school with teaching him precision he carried
          into writing, and he studied it as a fallback in case music
          failed, which is the most honest career-risk hedge in this whole
          story. <strong>None of them wasted the training. They relocated
          it.</strong>
        </p>
        <h3>The uncomfortable question for the profession</h3>
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
        <h3>Where this leaves you</h3>
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
        <h3>The carpenter</h3>
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
        <h3>The doctor</h3>
        <p>
          Ken Jeong finished internal medicine training at the University
          of North Carolina and practiced for years, New Orleans, then Los
          Angeles, seeing patients by day and doing stand-up at night. The
          license stayed active long after the comedy started working. The
          pivot completed only when the destination could carry the
          income, not when the frustration peaked.
        </p>
        <div className="post-callout"><b>2</b><span>famous pivots, one structure: <strong>keep the income, test the destination, convert when the evidence arrives.</strong> The boats were never burned. They were rented out.</span></div>
        <h3>Why the parallel pivot is the rational one</h3>
        <p>
          Strip the fame away and the structure is just good decision
          theory. A career change is a bet with an uncertain payoff and a
          long settlement time; our transition estimates run six months to
          two years for well-matched moves. Keeping the day job during
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
        <h3>Where this leaves you</h3>
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
          <caption>Share of postings stating pay, professions with 150+ postings · PivotHop, July 2026</caption>
          <thead><tr><th>Most secretive</th><th className="num">States pay</th><th>Most transparent</th><th className="num">States pay</th></tr></thead>
          <tbody>
            <tr><td>Sales engineer</td><td className="num"><strong>44%</strong></td><td>Police officer</td><td className="num"><strong>98%</strong></td></tr>
            <tr><td>Management consultant</td><td className="num">45%</td><td>Teaching assistant</td><td className="num">96%</td></tr>
            <tr><td>Account executive</td><td className="num">47%</td><td>Medical writer</td><td className="num">95%</td></tr>
            <tr><td>DevOps engineer</td><td className="num">48%</td><td>MEP engineer</td><td className="num">94%</td></tr>
            <tr><td>Sales representative</td><td className="num">50%</td><td>UX researcher</td><td className="num">92%</td></tr>
            <tr><td>Security engineer</td><td className="num">52%</td><td>Therapist / counselor</td><td className="num">90%</td></tr>
          </tbody>
        </table>
        <h3>The pattern is negotiation, not money</h3>
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
        <h3>Even the boards disagree</h3>
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
            <tr><td>Greenhouse (startup ATS)</td><td className="num">55%</td><td className="num">4,921</td></tr>
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
        <h3>What opacity costs the candidate</h3>
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
        <h3>Playing a hidden-number game well</h3>
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
        <h3>Where this leaves you</h3>
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
    title: 'We tried to verify the remote-pay premium and mostly failed. Here is the whole file',
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
        <h3>The break attempt</h3>
        <p>
          The problem hiding in that table is where each column comes from.
          Our remote observations arrive mostly through remote-first boards,
          which skew senior, tech-heavy, and venture-funded. The onsite pool
          arrives mostly through general boards carrying everything from
          federal agencies to regional firms. Comparing the two medians
          measures which kinds of companies use which kinds of boards at
          least as much as it measures a premium for working from home.
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
        <h3>What survives scrutiny</h3>
        <p>
          Three things, more modest than the table. Remote-first employers
          do post high salaries; whatever the cause, those jobs exist and
          are real money. The official anchor gives scale: the US all-worker
          median for software engineering sits near <strong>133,000
          dollars</strong> (BLS OEWS), and remote-board postings cluster
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
        <h3>How to read any remote-pay claim, including this one</h3>
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
        <h3>What a defensible premium would probably look like</h3>
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
        <h3>Where this leaves you</h3>
        <p>
          If you are negotiating a remote offer, use occupation-level
          anchors rather than remote-market headlines: the blended bands on
          our salary pages start from official statistics and declare their
          posting bias. If you are choosing remote work expecting an
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
            Official anchor: BLS OEWS May 2024, SOC 15-1252 family. This
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
        <h3>Why coordination roles dominate</h3>
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
        <div className="post-callout"><b>1</b><span>connection. That is the entire measured adjacency of <strong>photographer</strong> in our graph, the loneliest node we track. Hotel manager also sits at one. Some jobs are rooms with a single door.</span></div>
        <h3>The bridge in action, with real routes</h3>
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
            <tr><td>HVAC technician → Mechanical engineer → Electrical engineer</td><td className="num">19%</td><td className="num">58%</td></tr>
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
        <h3>Using a bridge on purpose</h3>
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
        <h3>Islands, and what they mean</h3>
        <p>
          The opposite of a bridge is an island: an occupation whose skill
          profile connects to almost nothing at measurable strength.
          Photography and hotel management sit there in our current data,
          partly because their real skills, composition, service instincts,
          crisis calm, live below what postings write down. If you hold an
          island job, the graph is not saying you are stuck. It is saying
          your written profile undersells you, and the fix is documenting
          the coordination and client work your title hides before you
          apply outward.
        </p>
        <h3>Where this leaves you</h3>
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
];