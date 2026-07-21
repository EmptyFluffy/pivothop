import type { Metadata } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { PageShell } from '../components/SiteChrome';
import { EmployerForm } from './EmployerForm';

export const metadata: Metadata = {
  title: 'For employers — PivotHop',
  description:
    'Hire from adjacent professions with the numbers attached. PivotHop measures how far a candidate\'s current skills reach into your role, then hand-matches the ones already moving. Concierge and free while the board is in pilot.',
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
            PivotHop reads live postings and measures how far each profession's skills
            reach into yours, so you can hire the motivated eighty percent instead of
            bidding on the exhausted hundred.
          </p>

          <div className="emp-stats">
            <div><b>{s.postings.toLocaleString()}</b><span className="lbl">postings read</span></div>
            <div><b>{s.occupations}</b><span className="lbl">occupations mapped</span></div>
            <div><b>{s.connections.toLocaleString()}</b><span className="lbl">measured connections</span></div>
          </div>

          <section className="ab-sec">
            <h2>The market nobody else is recruiting</h2>
            <p>
              For any role you post, there are professions whose day-to-day work
              already covers most of what you need. A structural engineer covers most
              of a facade consultant's job. A nurse covers most of a clinical
              coordinator's. These people rarely apply, because job boards match on
              titles and their title is different. Nobody is in their inbox. Their
              salary expectations were not set by your competitors.
            </p>
            <p>
              PivotHop's users are the exception: they came here because they are
              actively measuring a move, and the instrument told them exactly which
              skills they are missing before they ever talk to you. When one of them
              reaches your role, the gap analysis comes with them.
            </p>
          </section>

          <section className="ab-sec">
            <h2>How it works right now</h2>
            <p>
              Concierge, honestly. Tell us the role. Carlos runs it through the
              adjacency model, checks which professions clear seventy percent skill
              coverage, and personally reviews the people already pointing that way.
              You get two or three candidates and a short note on why each one maps,
              usually within three business days. If the model says your role has no
              good adjacent routes, he tells you that instead.
            </p>
            <p>
              This will eventually be a paid board where you flag roles as open to
              adjacent candidates. It is free while we build it by hand, because the
              first employers teach us what the board needs to be. No charge, no
              contract, no obligation past the first conversation.
            </p>
          </section>

          <section className="ab-sec">
            <h2>What we will not do</h2>
            <p>
              Your email starts a conversation, not a drip campaign. No newsletter,
              no automated sequences, no reselling your contact to recruiters. Every
              message you get from PivotHop is written by a person, for you, about
              your role.
            </p>
          </section>

          <section className="ab-sec ab-contact">
            <h2>Tell us about the role</h2>
            <EmployerForm />
            <p className="emp-promise">
              Carlos personally reviews every request. If PivotHop can help, he
              replies within three business days with candidates who fit and a short
              call to discuss. If it is not a fit, he says so. Either way, you hear
              back.
            </p>
          </section>
        </main>
      </div>
    </PageShell>
  );
}
