import { getJobs, getJobSkills, occTitle, jobCount } from '../../jobs/jobs-data';
import { destRole } from '../../routes/routes-data';
import { LabBar, V2Nav, RouteMeasure, Monogram, SearchUnit, FilterToken, Pill, Pager } from '../system';
import Link from 'next/link';

/* ANCHOR A · the V2 job board, workspace architecture (reference pass):
   full-bleed three-column app frame under the nav, real dividers, table-headed
   results, paginated inspector. All copy is ours; matches are the measured
   destRole values from the Architect exemplar. */

const k = (n: number) => '$' + Math.round(n / 1000) + 'K';
const pay = (a: number | null, b: number | null) =>
  a && b && b > a ? `${k(a)}–${k(b)}` : a || b ? k((a || b)!) : '';
const ago = (p: string) => {
  const d = Math.max(0, Math.floor((Date.now() - Date.parse(p)) / 864e5));
  return d === 0 ? 'today' : `${d}d ago`;
};

export default function LabJobs() {
  const ORIGIN = 'architect';
  const occs = ['interior-designer', 'architectural-drafter', 'bim-manager', 'project-manager'];
  const rows = occs.flatMap((occ) => {
    const role = destRole(ORIGIN, occ);
    return getJobs(occ).slice(0, occ === 'interior-designer' ? 4 : 2).map((j) => ({
      j, occ,
      match: role?.match ?? null,
      gap: (role as { gap?: string[] } | undefined)?.gap?.slice(0, 2) ?? [],
      skills: getJobSkills(occ, j.id).slice(0, 3),
    }));
  });
  const sel = rows.find((r) => r.match && r.skills.length >= 2) ?? rows[0];
  const selIdx = rows.indexOf(sel);
  const selPay = pay(sel.j.smin, sel.j.smax);

  return (
    <>
      <LabBar on="jobs" />
      <V2Nav active="Jobs" />

      <div className="vapp">
        <aside className="vrail" aria-label="Filters">
          <div className="vrail-head"><h4>Filters</h4><a className="ul" href="#">Clear all</a></div>
          <section>
            <h5>Profile</h5>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Matching from<br /><b style={{ color: 'var(--text)' }}>Architect</b></p>
          </section>
          <section>
            <h5>Occupation</h5>
            {occs.map((o) => (
              <div className="opt" key={o}>
                <label><input type="checkbox" defaultChecked readOnly /> {occTitle(o)}</label>
                <span className="vnum">{jobCount(o)}</span>
              </div>
            ))}
          </section>
          <section>
            <h5>Remote</h5>
            {['Remote', 'Hybrid', 'On-site'].map((o) => (
              <div className="opt" key={o}><label><input type="checkbox" readOnly /> {o}</label></div>
            ))}
          </section>
          <section>
            <h5>Freshness</h5>
            {['Last 24h', 'This week', 'This month'].map((o) => (
              <div className="opt" key={o}><label><input type="radio" name="fr" readOnly /> {o}</label></div>
            ))}
          </section>
        </aside>

        <section className="vmain" aria-label="Results">
          <p className="vmeta vnum">{rows.length} roles · sorted by match</p>
          <h1 className="vtitle">The job board, by skill.</h1>
          <SearchUnit primary="Role, company, or skill" secondary="Location" action={<button className="btn btn-ghost" type="button">Filters</button>} />
          <div className="tokens" style={{ marginBottom: 18 }}>
            <FilterToken>Remote only</FilterToken>
            <FilterToken>$50K–$200K</FilterToken>
            <FilterToken>Match &gt;40%</FilterToken>
          </div>
          <div className="vthead">
            <span />
            <span>Role</span>
            <span>Salary</span>
            <span>Posted</span>
            <span />
          </div>
          <div className="vrows vrows2">
            {rows.map(({ j, occ, match, gap, skills }) => (
              <article className={`row${j.id === sel.j.id ? ' vsel' : ''}`} key={j.id}>
                <Monogram name={j.company} />
                <div>
                  <div className="ti"><a className="ul" href="#">{j.title}</a> <span className="at">at {j.company}</span></div>
                  <div className="loc">{j.location || 'Location unlisted'}{j.remote ? ' · Remote' : ''}</div>
                  <div className="skline">
                    {skills.length > 0 && (
                      <span className="vsk">{skills.map((s, i) => <span key={s}>{i > 0 && <i>·</i>}{s.replace(/-/g, ' ')}</span>)}</span>
                    )}
                    {gap.length > 0 && <span className="gapline">Missing · {gap.join(' · ')}</span>}
                  </div>
                </div>
                <div className="pay vnum">{pay(j.smin, j.smax)}</div>
                <div className="age vnum">{ago(j.posted)}</div>
                <div className="applycell"><button className="pillbtn" type="button">Apply</button></div>
              </article>
            ))}
          </div>
          <Pager pages={Math.max(2, Math.ceil(occs.reduce((a, o) => a + jobCount(o), 0) / 60))} current={1} />
        </section>

        <aside className="vinspect" aria-label="Job inspector">
          <div className="vinspect-top">
            <span className="vnum">{selIdx + 1} of {rows.length}</span>
            <span className="pg">
              <button type="button" aria-label="Previous">‹</button>
              <button type="button" aria-label="Next">›</button>
              <button type="button" aria-label="Close">×</button>
            </span>
          </div>
          <div className="vinspect-body">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
              <Monogram name={sel.j.company} size={40} />
              <span style={{ fontSize: 13.5 }}>{sel.j.company}</span>
            </div>
            <h2 style={{ fontSize: 21, letterSpacing: '-.015em', lineHeight: 1.25 }}>{sel.j.title}</h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 4 }}>
              {sel.j.location}{sel.j.remote ? ' · Remote' : ''} · {occTitle(sel.occ)}<br />
              posted {ago(sel.j.posted)}
            </p>
            {selPay && <div className="paysec vnum">{selPay}</div>}
            <p style={{ fontSize: 13.5, color: 'var(--text-2)', marginTop: 14 }}>
              {occTitle(sel.occ)}{' '}opening, indexed from the company&rsquo;s own board. The
              skills below are extracted from the posting text.
            </p>
            <hr />
            <span className="lab">You already have</span>
            <ul className="dotlist">
              {sel.skills.map((s) => <li className="dhave" key={s}><i />{s.replace(/-/g, ' ')}</li>)}
            </ul>
            {sel.gap.length > 0 && (
              <>
                <span className="lab" style={{ display: 'block', marginTop: 16 }}>The gap</span>
                <ul className="dotlist">
                  {sel.gap.map((s) => <li className="dmiss" key={s}><i />{s}</li>)}
                </ul>
              </>
            )}
            <button className="apply" type="button">Apply now →</button>
            <p style={{ marginTop: 14 }}>
              <a className="ul" href="#" style={{ fontSize: 13.5 }}>Tailor resume for this role →</a><br />
              <a className="ul" href="#" style={{ fontSize: 13.5, display: 'inline-block', marginTop: 8 }}>Why this match?</a>
            </p>
            {sel.match && <RouteMeasure from="Architect" to={occTitle(sel.occ)} pct={sel.match} />}
          </div>
        </aside>
      </div>
      <footer className="vfoot2">
        <div className="giant">PivotHop</div>
        <div className="frow">
          <span>Career moves, measured</span>
          <span><a className="ul" href="#">About</a> &nbsp;&nbsp; <a className="ul" href="#">Employers</a> &nbsp;&nbsp; <a className="ul" href="#">Method</a></span>
        </div>
      </footer>
    </>
  );
}
