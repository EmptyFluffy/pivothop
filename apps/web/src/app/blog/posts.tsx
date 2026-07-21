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
];
