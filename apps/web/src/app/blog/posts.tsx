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
        <h3>The biggest premiums, and the catch</h3>
        <p>
          The largest premium in the data is medical assistant to pharmacist, a
          125 percent jump in the midpoint of posted salaries at a 58 percent
          skill match. Second is bookkeeper to financial controller at plus 108
          percent. Third, medical assistant to physical therapist at plus 92.
        </p>
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
          The answer, across 132 occupations with enough postings to trust: data
          analysis and systems monitoring tie at the top, each appearing
          meaningfully in the demand of 40 occupations. Project management
          follows at 33, supply chain and logistics at 30, training and
          facilitation at 28, customer service at 22, process improvement at 21,
          Python at 20, SQL and professional writing at 19 each, presentation at
          18, accounting at 18, prototyping and procurement at 17 each.
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
          AI engineer went from a curiosity title to 943 postings in our corpus
          inside a year, and 670 of them state pay. The blended US median lands
          at about 150,500 dollars. That much everyone suspected. What the
          reach table shows is less expected, and more useful if you are
          standing outside the field wondering about the door.
        </p>
        <h3>The doorway professions, measured</h3>
        <p>
          We compute, for every occupation, how much of an AI engineer's posted
          skill demand it already covers. Machine learning engineer leads at 59
          percent, no surprise. Then comes the surprise: sales engineer at 50,
          ahead of software engineer at 46, data scientist at 45, and solutions
          architect at 45. DevOps at 39, research scientist at 34, product
          manager at 31.
        </p>
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
];