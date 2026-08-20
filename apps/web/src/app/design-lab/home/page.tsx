import { jobsIndex, jobOccupations } from '../../jobs/jobs-data';
import { routableSlugs } from '../../routes/routes-data';
import { POSTS } from '../../blog/posts';
import { LabBar, V2Nav, RouteMeasure } from '../LabChrome';

/* ANCHOR B · the V2 homepage (brief §5B). Real counts, the product thesis,
   and the coexistence pattern: workspace UI above the rule, editorial below
   it, one accent, one signature gesture. */

export default function LabHome() {
  const occs = jobOccupations().length;
  const live = Object.values(jobsIndex()).reduce((a, b) => a + b, 0);
  const routes = routableSlugs().length;
  const posts = POSTS.slice(0, 3);
  return (
    <>
      <LabBar on="home" />
      <V2Nav />
      <main className="wrap">
        <section className="vhero">
          <h1 className="big">A career is not a title. It is a collection of skills.</h1>
          <p className="dek">
            PivotHop reads live postings and measures which occupations your skills already
            reach: the overlap, the gap, the salary on the other side.
          </p>
          <div style={{ maxWidth: 720, marginTop: 32 }}>
            <div className="search">
              <span><input placeholder="Your current role, e.g. Architect" aria-label="Your current role" /></span>
              <span className="div loc-cell"><input placeholder="Where you want to work" /></span>
              <span className="div vgo">
                <button className="btn btn-primary" type="button">Measure</button>
              </span>
            </div>
          </div>
          <div className="vstats vnum">
            <div><div className="vv">{live.toLocaleString()}</div><div className="vk">live openings</div></div>
            <div><div className="vv">{occs}</div><div className="vk">occupations</div></div>
            <div><div className="vv">{routes}</div><div className="vk">measured route pages</div></div>
          </div>
        </section>

        <hr className="sec-rule" />
        <div className="grid3">
          <div>
            <h3><a className="ul" href="#">The board, by skill →</a></h3>
            <p>Every listing tagged with the skills it demands, filtered by what you already hold, linked out to apply at the source.</p>
          </div>
          <div>
            <h3><a className="ul" href="#">Routes, measured →</a></h3>
            <p>The occupations adjacent to yours, with the overlap computed from postings rather than asserted. License gates named honestly.</p>
          </div>
          <div>
            <h3><a className="ul" href="#">Salaries, in context →</a></h3>
            <p>Advertised medians by occupation, country, and seniority, from listings that state a number.</p>
          </div>
        </div>

        <hr className="sec-rule" />
        <section style={{ maxWidth: 560 }}>
          <span className="lab">The measure</span>
          <p style={{ margin: '10px 0 4px', fontSize: 14.5, color: 'var(--text-2)' }}>
            One number under every route on the site:
          </p>
          <RouteMeasure from="Architect" to="Interior Designer" pct={64} />
        </section>

        <hr className="sec-rule" />
        <section>
          <span className="lab">From the research</span>
          <div className="grid3" style={{ marginTop: 16 }}>
            {posts.map((p) => (
              <div key={p.slug}>
                <h3 style={{ fontSize: 14.5 }}><a className="ul" href="#">{p.title}</a></h3>
                <p style={{ fontSize: 12.5 }}>{p.date} · {p.minutes} min</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="vfoot">
          <span>PivotHop · career moves, measured</span>
          <span><a className="ul" href="#">About</a> &nbsp;&nbsp; <a className="ul" href="#">Employers</a> &nbsp;&nbsp; <a className="ul" href="#">Method</a></span>
        </footer>
      </main>
    </>
  );
}
