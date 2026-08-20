import { LabBar, RouteMeasure } from '../LabChrome';

export default function LabComponents() {
  return (
    <>
      <LabBar on="components" />
      <main className="wrap" style={{ padding: '48px 32px 64px' }}>
        <h1 className="big" style={{ fontSize: 34 }}>Components.</h1>

        <hr className="sec-rule" /><span className="lab">Buttons</span>
        <p style={{ display: 'flex', gap: 12, marginTop: 14, alignItems: 'center' }}>
          <button className="btn btn-primary" type="button">Apply now →</button>
          <button className="btn btn-ghost" type="button">Filters</button>
          <a className="ul" href="#" style={{ fontSize: 13.5 }}>Tailor resume for this role →</a>
        </p>

        <hr className="sec-rule" /><span className="lab">Filter tokens</span>
        <p className="tokens">
          <button className="tok" type="button">Remote only <b>×</b></button>
          <button className="tok" type="button">$50K–$200K <b>×</b></button>
          <button className="tok" type="button">2–5 years <b>×</b></button>
          <button className="tok" type="button">Match &gt;80% <b>×</b></button>
        </p>

        <hr className="sec-rule" /><span className="lab">Search unit</span>
        <div className="search" style={{ maxWidth: 720, marginTop: 14 }}>
          <span><input placeholder="Role, company, or skill" /></span>
          <span className="div loc-cell"><input placeholder="Location" /></span>
          <span className="div vgo" style={{ padding: 6 }}><button className="btn btn-ghost" type="button">Filters</button></span>
        </div>

        <hr className="sec-rule" /><span className="lab">Job row (rules, not cards)</span>
        <div className="vrows" style={{ maxWidth: 860, marginTop: 14 }}>
          <article className="row vsel">
            <div>
              <div className="co">NORTHLIGHT STUDIO</div>
              <div className="ti"><a className="ul" href="#">Interior Designer, workplace projects</a></div>
              <div className="loc">Zürich · Hybrid</div>
              <div className="vsk">space planning<i>·</i>materials<i>·</i>drawing sets</div>
              <div className="gapline">Missing · FF&amp;E budgeting</div>
            </div>
            <div className="match vnum vhi">64%</div>
            <div className="pay vnum">$55K–89K</div>
            <div className="age vnum">2d</div>
            <div className="save">★</div>
          </article>
        </div>

        <hr className="sec-rule" /><span className="lab">Skill and gap pills</span>
        <p style={{ marginTop: 14 }}>
          <span className="pill vhave" style={{ display: 'inline-block', border: '1px solid #3D7A5040', background: '#3D7A500D', borderRadius: 3, padding: '3px 8px', marginRight: 6, fontSize: 12.5 }}>drawing sets</span>
          <span className="pill miss" style={{ display: 'inline-block', border: '1px solid #C4573A40', background: '#C4573A0D', color: 'var(--gap)', borderRadius: 3, padding: '3px 8px', fontSize: 12.5 }}>FF&amp;E budgeting</span>
        </p>

        <hr className="sec-rule" /><span className="lab">The measure (signature)</span>
        <div style={{ maxWidth: 520 }}><RouteMeasure from="Architect" to="Interior Designer" pct={64} /></div>
      </main>
    </>
  );
}
