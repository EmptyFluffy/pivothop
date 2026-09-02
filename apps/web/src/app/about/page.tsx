import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../components/SiteChrome';
import { SITE_EMAIL } from '../../lib/site';
import { Crumbs } from '../components/Crumbs';

export const metadata: Metadata = {
  title: 'About | PivotHop',
  description:
    'PivotHop is a measuring instrument for career moves. It reads live job postings and shows which roles your skills already reach, with the salary, the gap, and the odds attached. Built by a working architect who made the pivot himself.',
  alternates: { canonical: '/about' },
};

/* Stroked section marks in the v2 icon language (lucide geometry, 1.75
   stroke, currentColor). One per section, quiet. */
const L = ({ children }: { children: React.ReactNode }) => (
  <svg className="lu-ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const IconFolder = () => (
  <L><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" /><path d="m14.5 12.5 2-2" /><path d="m11.5 9.5 2-2" /><path d="m8.5 6.5 2-2" /><path d="m17.5 15.5 2-2" /></L>
);
const IconCompass = () => (
  <L><circle cx="12" cy="12" r="10" /><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z" /></L>
);
const IconFloppy = () => (
  <L><rect width="8" height="8" x="3" y="3" rx="2" /><path d="M7 11v4a2 2 0 0 0 2 2h4" /><rect width="8" height="8" x="13" y="13" rx="2" /></L>
);
const IconPerson = () => (
  <L><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></L>
);
const IconTrash = () => (
  <L><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></L>
);
const IconMail = () => (
  <L><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></L>
);

export default function About() {
  return (
    <PageShell v2 active="about">
    <div className="about-page">
      <main className="ab-main">
        <Crumbs trail={[{ label: 'About' }]} />
        <h1 className="ab-h1">A measuring instrument for career moves.</h1>

        <section className="ab-sec">
          <h2><IconFolder /> What this is</h2>
          <p>
            PivotHop reads live job postings, tens of thousands of them, and works out
            which roles your existing skills already reach. Type your job, and it draws
            the map: each route with a match percentage, the salary band, the exact
            skills you are missing, and how often people actually make that move. Edit
            your skills and the whole map recomputes around you.
          </p>
          <p>
            Every number on the site traces back to a posting someone published or a
            public dataset you can check. When there is not enough data to say something
            honestly, the tool says so and shows nothing. That rule costs us some
            impressive-looking screens. We keep it anyway.
          </p>
        </section>

        <section className="ab-sec">
          <h2><IconCompass /> Why it exists</h2>
          <p>
            Career changes run on folklore. A friend who made the jump, a thread that
            says design people can do product, a coach with a framework. Almost none of
            it comes with numbers, and the advice industry likes it that way, because
            vibes renew monthly and numbers can be checked.
          </p>
          <p>
            Meanwhile the actual evidence sits in plain sight. Job postings state what
            each role wants. Labor surveys record where people really go when they
            leave a profession. Nobody had wired those two things together into an
            instrument a normal person could use in a minute. That seemed worth fixing.
          </p>
          <p>
            The goal is narrow on purpose: show the routes your skills can reach, tell
            the truth about the gap, and let you decide. No pep talks. No course
            funnels. If a pivot is a bad idea, the graph should be the first to say so.
          </p>
        </section>

        <section className="ab-sec">
          <h2><IconFloppy /> How it works, briefly</h2>
          <p>
            A scraper collects postings daily from job boards and public APIs. A
            dictionary of 246 skills reads each posting. An adjacency model scores
            every pair of occupations three ways: skill overlap from the postings,
            shared underlying abilities from the O*NET database, and observed moves
            from US and EU labor data. The graph you see is those scores, drawn. The
            full method lives on the <Link href="/#how">landing page</Link>, and the
            numbers update with every run.
          </p>
        </section>

        <section className="ab-sec">
          <h2><IconPerson /> The person behind it</h2>
          <p>
            Carlos is an architect. He has spent well over a decade on luxury
            hospitality projects with international offices, the kind of work where a
            building takes years and every drawing gets checked three times. Somewhere
            between the competition boards and the construction sets, the scripts he
            wrote to generate drawings became more interesting than the drawings.
          </p>
          <p>
            PivotHop started as the tool he needed during that shift and could not
            find. Architecture is the first vertical because it is the profession he
            can verify from the inside, not because the instrument stops there. He
            runs the project solo, evenings and weekends, around a full-time design
            job. He also plays bass in a shoegaze band, which has nothing to do with
            career data and that is the point.
          </p>
        </section>

        <section className="ab-sec">
          <h2><IconTrash /> What this is not</h2>
          <p>
            No bootcamp affiliate links. No sponsored course recommendations. No
            investors waiting on growth. No AI-written blog spam. This is a small
            business run by one person with a day job, which keeps the incentives
            clean: the only thing PivotHop sells is honest matching, to you for free
            and eventually to employers who want candidates from adjacent fields.
          </p>
        </section>

        <section className="ab-sec ab-contact">
          <h2><IconMail /> Contact</h2>
          <p>
            Write to <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>.
            If you are thinking about a pivot and want a human opinion next to the
            numbers, say so in the subject line. Carlos reads these himself and
            replies when he can, usually within a few days.
          </p>
        </section>
      </main>


      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            mainEntity: {
              '@type': 'Person',
              '@id': 'https://www.pivothop.com/about#person',
              name: 'Carlos Alvarez',
              jobTitle: 'Architect and founder',
              description: 'Architect who made the career pivot himself and built PivotHop to measure the moves — the working expertise behind the instrument and its writing.',
              url: 'https://www.pivothop.com/about',
              worksFor: { '@type': 'Organization', name: 'PivotHop', url: 'https://www.pivothop.com' },
              knowsAbout: ['career mobility', 'skills-based hiring', 'labor-market data', 'architecture', 'occupational adjacency'],
              /* sameAs: add Carlos's LinkedIn / X once provided — the entity link
                 that connects the author across the web for knowledge graphs. */
            },
          }),
        }}
      />
    </div>
    </PageShell>
  );
}
