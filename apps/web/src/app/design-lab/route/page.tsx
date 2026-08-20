import fs from 'node:fs';
import path from 'node:path';
import { destRole, originMeta } from '../../routes/routes-data';
import { jobCount, occTitle } from '../../jobs/jobs-data';
import { LabBar, V2Nav, RouteMeasure } from '../system';

function band(slug: string): [number, number] | null {
  try {
    const p = path.join(process.cwd(), '..', '..', 'packages', 'data', 'generated', `${slug}.json`);
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    const b = j?.origin?.salary_band;
    return Array.isArray(b) && b.length === 2 ? [b[0], b[1]] : null;
  } catch { return null; }
}

/* ANCHOR C · transition detail (brief §5C): Architect to Interior Designer.
   Every number on this page is the real measured figure from the generated
   route data; salary bands are the corpus bands both ends. */

const k = (n: number) => '$' + Math.round(n / 1000) + 'K';

export default function LabRoute() {
  const o = 'architect', d = 'interior-designer';
  const role = destRole(o, d);
  const om = originMeta(o), dm = originMeta(d);
  const match = role?.match ?? 0;
  const gap = (role as { gap?: string[] } | undefined)?.gap ?? [];
  const openings = jobCount(d);
  const ob = band(o), db = band(d);
  return (
    <>
      <LabBar on="route" />
      <V2Nav active="Routes" />
      <main className="wrap" style={{ maxWidth: 860 }}>
        <section className="vhero" style={{ paddingBottom: 24 }}>
          <span className="lab">Measured route</span>
          <h1 className="big" style={{ marginTop: 10 }}>{occTitle(o)} → {occTitle(d)}</h1>
          <p className="dek">
            Computed from live postings for both occupations: what carries over,
            what is missing, and what the move pays.
          </p>
          <div style={{ maxWidth: 560 }}><RouteMeasure from={occTitle(o)} to={occTitle(d)} pct={match} /></div>
        </section>

        <div className="grid3" style={{ borderTop: '1px solid var(--border-strong)', paddingTop: 24 }}>
          <div><div className="vstats vnum" style={{ margin: 0 }}><div><div className="vv">{match}%</div><div className="vk">skill overlap, measured</div></div></div></div>
          <div><div className="vstats vnum" style={{ margin: 0 }}><div><div className="vv">{db ? `${k(db[0])}–${k(db[1])}` : '·'}</div><div className="vk">{occTitle(d)} advertised band</div></div></div></div>
          <div><div className="vstats vnum" style={{ margin: 0 }}><div><div className="vv">{openings}</div><div className="vk">live openings today</div></div></div></div>
        </div>

        <hr className="sec-rule" />
        <div className="grid3" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <section>
            <span className="lab" style={{ color: 'var(--pos)' }}>You already have</span>
            <p style={{ marginTop: 10, fontSize: 14 }}>
              The overlap that produces the {match}%: spatial design, drawing sets,
              client presentation, materials, and the software both occupations demand.
            </p>
          </section>
          <section>
            <span className="lab" style={{ color: 'var(--gap)' }}>The gap</span>
            <p style={{ marginTop: 10 }}>
              {gap.length ? gap.map((g) => <span className="pill miss" key={g} style={{ display: 'inline-block', fontSize: 12.5, border: '1px solid #C4573A40', background: '#C4573A0D', color: 'var(--gap)', borderRadius: 3, padding: '3px 8px', margin: '0 6px 6px 0' }}>{g}</span>)
                : <span style={{ fontSize: 14, color: 'var(--text-2)' }}>No named gap skills in this route&rsquo;s data; the residual is depth, not breadth.</span>}
            </p>
          </section>
        </div>

        <hr className="sec-rule" />
        <section style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" type="button">See the {openings} open {occTitle(d).toLowerCase()} roles →</button>
          <a className="ul" href="#" style={{ fontSize: 13.5 }}>Salary detail</a>
          <a className="ul ul-accent" href="#" style={{ fontSize: 13.5 }}>Translate my resume for this route →</a>
        </section>
        <p style={{ marginTop: 24, fontSize: 12.5, color: 'var(--text-2)' }}>
          Origin band {ob ? `${k(ob[0])}–${k(ob[1])}` : 'unavailable'} · {om.postings.toLocaleString()} postings read for {occTitle(o)}.
          The resume action is the future AI entry point (brief §25); it ships later, styled from day one.
        </p>
        <footer className="vfoot"><span>PivotHop</span><span className="lab">anchor C · not production</span></footer>
      </main>
    </>
  );
}
