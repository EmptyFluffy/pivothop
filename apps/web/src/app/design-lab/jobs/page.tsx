import { getJobs, getJobSkills, occTitle, jobCount } from '../../jobs/jobs-data';
import { destRole } from '../../routes/routes-data';
import { LabBar, V2Nav, RouteMeasure, Monogram, SearchUnit, FilterToken, Pill } from '../system';

/* ANCHOR A · the V2 job board (brief §5A, §10-§15).
   Server-rendered prototype on real corpus data. The exemplar profile is
   "Architect": match figures are the measured destRole() values into each
   job's occupation, or a dash when no route is measured. Nothing invented. */

const k = (n: number) => '$' + Math.round(n / 1000) + 'K';
const pay = (a: number | null, b: number | null) =>
  a && b && b > a ? `${k(a)}–${k(b)}` : a || b ? k((a || b)!) : '';
const ago = (p: string) => {
  const d = Math.max(0, Math.floor((Date.now() - Date.parse(p)) / 864e5));
  return d === 0 ? 'today' : `${d}d`;
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
  const selPay = pay(sel.j.smin, sel.j.smax);

  return (
    <>
      <LabBar on="jobs" />
      <V2Nav active="Jobs" />
      <main className="wrap">
        <div style={{ padding: '24px 0 0' }}>
          <SearchUnit primary="Role, company, or skill" secondary="Location" action={<button className="btn btn-ghost" type="button">Filters</button>} />
          <div className="tokens">
            <FilterToken>Remote only</FilterToken>
            <FilterToken>$50K–$200K</FilterToken>
            <FilterToken>Match &gt;40%</FilterToken>
          </div>
        </div>

        <div className="board">
          <aside className="side">
            <section>
              <h4>Profile</h4>
              <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Matching from<br /><b style={{ color: 'var(--text)' }}>Architect</b></p>
            </section>
            <section>
              <h4>Occupation</h4>
              {occs.map((o) => (
                <div className="opt" key={o}>
                  <label><input type="checkbox" defaultChecked readOnly /> {occTitle(o)}</label>
                  <span className="vnum">{jobCount(o)}</span>
                </div>
              ))}
            </section>
            <section>
              <h4>Remote</h4>
              {['Remote', 'Hybrid', 'On-site'].map((o) => (
                <div className="opt" key={o}><label><input type="checkbox" readOnly /> {o}</label></div>
              ))}
            </section>
            <section>
              <h4>Freshness</h4>
              {['Last 24h', 'This week', 'This month'].map((o) => (
                <div className="opt" key={o}><label><input type="radio" name="fr" readOnly /> {o}</label></div>
              ))}
            </section>
          </aside>

          <section aria-label="Results">
            <p className="lab" style={{ marginBottom: 10 }}>{rows.length} roles · sorted by match</p>
            <div className="vrows">
              {rows.map(({ j, occ, match, gap, skills }) => (
                <article className={`row${j.id === sel.j.id ? ' vsel' : ''}`} key={j.id}>
                  <Monogram name={j.company} />
                  <div>
                    <div className="co">{j.company}</div>
                    <div className="ti"><a className="ul" href="#">{j.title}</a></div>
                    <div className="loc">{j.location || 'Location unlisted'}{j.remote ? ' · Remote' : ''}</div>
                    {skills.length > 0 && (
                      <div className="vsk">{skills.map((s, i) => <span key={s}>{i > 0 && <i>·</i>}{s.replace(/-/g, ' ')}</span>)}</div>
                    )}
                    {gap.length > 0 && <div className="gapline">Missing · {gap.join(' · ')}</div>}
                  </div>
                  <div className={`match num${(match ?? 0) >= 60 ? ' vhi' : ''}`}>{match ? `${match}%` : '·'}</div>
                  <div className="pay vnum">{pay(j.smin, j.smax)}</div>
                  <div className="age vnum">{ago(j.posted)}</div>
                  <div className="save" aria-label="Save">☆</div>
                </article>
              ))}
            </div>
          </section>

          <aside className="insp" aria-label="Job inspector">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
              <Monogram name={sel.j.company} size={40} />
              <div className="co" style={{ fontSize: 13 }}>{sel.j.company}</div>
            </div>
            <h2>{sel.j.title}</h2>
            <div className="meta">{sel.j.location}{sel.j.remote ? ' · Remote' : ''} · posted {ago(sel.j.posted)} ago</div>
            {selPay && <div className="pay vnum">{selPay}</div>}
            <p className="sum">{occTitle(sel.occ)} opening, indexed from the company&rsquo;s own board. The skills below are extracted from the posting text.</p>
            <div className="sec">
              <span className="lab">You already have</span>
              {sel.skills.map((s) => <Pill kind="have" key={s}>{s.replace(/-/g, ' ')}</Pill>)}
            </div>
            {sel.gap.length > 0 && (
              <div className="sec">
                <span className="lab">The gap</span>
                {sel.gap.map((s) => <Pill kind="miss" key={s}>{s}</Pill>)}
              </div>
            )}
            <div className="vcta">
              <button className="btn btn-primary" type="button">Apply now →</button>
              <a className="ul" href="#" style={{ fontSize: 13.5 }}>Tailor resume for this role →</a>
              <a className="ul" href="#" style={{ fontSize: 13.5 }}>Why this match?</a>
            </div>
            {sel.match && <RouteMeasure from="Architect" to={occTitle(sel.occ)} pct={sel.match} />}
          </aside>
        </div>
      </main>
    </>
  );
}
