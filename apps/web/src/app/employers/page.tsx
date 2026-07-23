import type { Metadata } from 'next';
import Link from 'next/link';
import fs from 'node:fs';
import path from 'node:path';
import { PageShell } from '../components/SiteChrome';
import { EmployerForm } from './EmployerForm';

export const metadata: Metadata = {
  title: 'Post a job — PivotHop for employers',
  description:
    'Post a role on the adjacent-talent job board, or claim your listing if it is already there. Roles get matched to the candidates whose skills already cover them. First month of featured placement free while the board fills.',
  alternates: { canonical: '/employers' },
};

function stats() {
  try {
    const p = path.join(process.cwd(), 'public/data/cloud.json');
    const c = JSON.parse(fs.readFileSync(p, 'utf8'));
    return c.stats as { occupations: number; postings: number; connections: number };
  } catch {
    return { occupations: 145, postings: 66403, connections: 2874 };
  }
}
function boardCount() {
  try {
    const idx = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/jobs-index.json'), 'utf8')) as Record<string, number>;
    return Object.values(idx).reduce((a, b) => a + b, 0);
  } catch { return 0; }
}

export default function Employers() {
  const s = stats();
  const live = boardCount();
  return (
    <PageShell active="employers">
      <div className="about-page">
        <main className="ab-main emp-main">
          <div className="lbl acc" style={{ marginBottom: 18 }}>For employers</div>
          <h1 className="ab-h1">Adjacent talent, measured.</h1>

          <p className="emp-lead">
            The best candidate for your role might not hold your role&rsquo;s title today.
            PivotHop measures how far each profession&rsquo;s skills reach into yours, so
            you can hire the motivated eighty percent instead of bidding on the
            exhausted hundred.
          </p>

          <div className="emp-stats">
            <div><b>{live.toLocaleString()}</b><span className="lbl">live roles on the board</span></div>
            <div><b>{s.postings.toLocaleString()}</b><span className="lbl">postings read nightly</span></div>
            <div><b>{s.occupations}</b><span className="lbl">occupations mapped</span></div>
          </div>

          <section className="ab-sec">
            <h2>How the board works</h2>
            <p>
              <b>The board is live and full.</b> <Link className="gl" href="/jobs">{live.toLocaleString()} open roles</Link>,
              each tagged to an occupation in the skill graph. Candidates do not just browse it: the instrument tells them
              which of these roles their current skills already cover, and the route and salary pages surface your opening
              to exactly the people measuring a move toward it.
            </p>
            <p>
              <b>Post a role, or claim one.</b> If your opening is already listed from your careers page, claim it. If not,
              post it with the form below. Either way it stays tagged to the graph, and a featured role is shown first to
              the candidates whose skills clear the bar for it, people who arrive with the gap already itemized.
            </p>
            <p>
              <b>The launch offer: the first month of featured placement is free.</b> No card, no contract. It is temporary,
              while the board fills and the traffic proves itself, and it applies to every employer, not a chosen twenty.
              When featured placement becomes paid, you will know the numbers before you pay them.
            </p>
          </section>

          <section className="ab-sec">
            <h2>Why the market is worth being early to</h2>
            <p>
              For any role you post, there are professions whose day-to-day work
              already covers most of what you need. Those people rarely apply,
              because job boards match on titles and their title is different.
              Nobody is in their inbox. Their salary expectations were not set by
              your competitors. PivotHop&rsquo;s users are the exception: they arrive
              having measured the move, with the skill gap itemized before you ever
              talk to them.
            </p>
          </section>

          <section className="ab-sec">
            <h2>What we will not do</h2>
            <p>
              Your email starts a conversation, not a drip campaign. No newsletter,
              no automated sequences, no reselling your contact to recruiters.
              Submissions are reviewed by hand within two days, and the reply comes
              from a person. That is the whole funnel.
            </p>
          </section>

          <section className="ab-sec ab-contact" id="post">
            <h2>Post a role</h2>
            <EmployerForm />
          </section>
        </main>
      </div>
    </PageShell>
  );
}
