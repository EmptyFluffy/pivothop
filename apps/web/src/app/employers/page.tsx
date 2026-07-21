import type { Metadata } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { PageShell } from '../components/SiteChrome';
import { EmployerForm } from './EmployerForm';

export const metadata: Metadata = {
  title: 'For employers — PivotHop',
  description:
    'The adjacent-talent job board is being built in the open. Founding employers get hand-matched candidates free during the pilot, founding pricing locked, and their roles seeded on day one.',
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

export default function Employers() {
  const s = stats();
  return (
    <PageShell active="employers">
      <div className="about-page">
        <main className="ab-main emp-main">
          <div className="lbl acc" style={{ marginBottom: 18 }}>For employers</div>
          <h1 className="ab-h1">Adjacent talent, measured.</h1>

          <p className="emp-lead">
            The best candidate for your role might not hold your role's title today.
            PivotHop measures how far each profession's skills reach into yours, so
            you can hire the motivated eighty percent instead of bidding on the
            exhausted hundred.
          </p>

          <div className="emp-stats">
            <div><b>{s.postings.toLocaleString()}</b><span className="lbl">postings read</span></div>
            <div><b>{s.occupations}</b><span className="lbl">occupations mapped</span></div>
            <div><b>{s.connections.toLocaleString()}</b><span className="lbl">measured connections</span></div>
          </div>

          <section className="ab-sec">
            <h2>Where this is honestly at</h2>
            <p>
              There is no job board here yet. The candidate side is live and free,
              and the numbers above grow with every daily run. The board opens when
              enough candidates are exporting route reports toward real roles that
              matches stop being a favor and start being a market. We would rather
              tell you that than collect your job specs into a drawer.
            </p>
            <p>
              What exists today is a waiting list with a shape: twenty founding
              spots, for companies that already believe adjacent hiring works and
              want the first crack at the board that proves it.
            </p>
          </section>

          <section className="ab-sec">
            <h2>What founding employers get</h2>
            <p>
              <b>An adjacency map for one role, now.</b> Join the list and, if you
              want it, name a role. We run it through the model and send back which
              professions clear seventy percent skill coverage toward it, with the
              overlap itemized. Free, no call required, useful even if you never
              hire through us.
            </p>
            <p>
              <b>Hand-matched candidates during the pilot, free.</b> Before the
              board exists as software, it exists as Carlos reading the graph and
              making introductions. Founding employers get those introductions at
              no charge while the pilot runs.
            </p>
            <p>
              <b>Founding pricing, locked.</b> When the board opens, founding
              members keep whatever rate we agree the product was worth during the
              pilot. You help set the price by being there while we discover it.
            </p>
            <p>
              <b>Day-one seeding.</b> The board launches with founding roles
              already posted and matched, not an empty room.
            </p>
          </section>

          <section className="ab-sec">
            <h2>Why the market is worth being early to</h2>
            <p>
              For any role you post, there are professions whose day-to-day work
              already covers most of what you need. Those people rarely apply,
              because job boards match on titles and their title is different.
              Nobody is in their inbox. Their salary expectations were not set by
              your competitors. PivotHop's users are the exception: they arrive
              having measured the move, with the skill gap itemized before you ever
              talk to them.
            </p>
          </section>

          <section className="ab-sec">
            <h2>What we will not do</h2>
            <p>
              Your email starts a conversation, not a drip campaign. No newsletter,
              no automated sequences, no reselling your contact to recruiters. One
              email when the board opens. That is the whole funnel.
            </p>
          </section>

          <section className="ab-sec ab-contact">
            <h2>Claim one of the twenty</h2>
            <EmployerForm />
          </section>
        </main>
      </div>
    </PageShell>
  );
}
