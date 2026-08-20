import { getSalary, usBand, fmtk, COUNTRY_NAMES } from '../../salary/salary-data';
import { jobCount } from '../../jobs/jobs-data';
import { LabBar, V2Nav } from '../system';
import { ArrowUpRight } from 'lucide-react';

/* Salary template on the real architect payload: the giant median, the
   percentile rail, country bands from the same file the production page
   reads. Nothing invented. */

export default function LabSalary() {
  const f = getSalary('architect');
  if (!f) return null;
  const us = usBand(f);
  const g = f.global;
  const countries = Object.entries(f.by_country ?? {})
    .map(([cc, v]) => ({ cc, band: v.blended || v.posted || v.anchor }))
    .filter((x) => x.band?.p50);
  return (
    <>
      <LabBar on="salary" />
      <V2Nav active="Salaries" />
      <main className="wrap" style={{ maxWidth: 1240, padding: '0 32px' }}>
        <section style={{ padding: '44px 0 30px' }}>
          <p className="vmeta">{f.observations.toLocaleString()} salary-stated postings · updated {f.updated}</p>
          <h1 className="vtitle" style={{ marginBottom: 6 }}>What an architect earns.</h1>
          <div style={{ display: 'flex', gap: 56, alignItems: 'baseline', flexWrap: 'wrap', marginTop: 24 }}>
            <div>
              <div className="vnum" style={{ fontSize: 'clamp(56px,7vw,92px)', fontWeight: 600, letterSpacing: '-.04em', lineHeight: 1, color: 'var(--value)' }}>
                {fmtk(us?.p50 ?? g.p50)}
              </div>
              <p className="lab" style={{ marginTop: 10 }}>US median, blended with the OEWS anchor</p>
            </div>
            <div style={{ display: 'flex', gap: 34 }}>
              {[['p25', 'p25'], ['p75', 'p75'], ['p90', 'p90']].map(([k, label]) => (
                <div key={k}>
                  <div className="vnum" style={{ fontSize: 26, fontWeight: 600 }}>{fmtk((us ?? g)[k as 'p25'])}</div>
                  <p className="lab" style={{ marginTop: 4 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ borderTop: '1px solid var(--border-strong)', paddingTop: 8 }}>
          <div className="vthead" style={{ gridTemplateColumns: 'minmax(0,1fr) 110px 110px 110px 70px' }}>
            <span>Country</span><span style={{ textAlign: 'right' }}>P25</span><span style={{ textAlign: 'right' }}>P50</span><span style={{ textAlign: 'right' }}>P75</span><span style={{ textAlign: 'right' }}>N</span>
          </div>
          {countries.map(({ cc, band }) => (
            <div key={cc} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 110px 110px 110px 70px', gap: 14, padding: '18px 10px', borderBottom: '1px solid var(--border)', alignItems: 'baseline' }}>
              <span style={{ fontSize: 18, fontWeight: 550, letterSpacing: '-.01em' }}>{COUNTRY_NAMES[cc] ?? cc}</span>
              <span className="vnum" style={{ fontSize: 15, textAlign: 'right' }}>{fmtk(band!.p25)}</span>
              <span className="vnum" style={{ fontSize: 17, fontWeight: 600, color: 'var(--value)', textAlign: 'right' }}>{fmtk(band!.p50)}</span>
              <span className="vnum" style={{ fontSize: 15, textAlign: 'right' }}>{fmtk(band!.p75)}</span>
              <span className="vnum" style={{ fontSize: 12.5, color: 'var(--text-2)', textAlign: 'right' }}>{band!.n ?? '·'}</span>
            </div>
          ))}
        </section>

        <section style={{ display: 'flex', gap: 18, alignItems: 'center', padding: '30px 0 44px', flexWrap: 'wrap' }}>
          <button className="pillbtn" type="button">See the {jobCount('architect')} open architect roles</button>
          <a className="ul" href="#" style={{ fontSize: 14 }}>Routes out of architecture <ArrowUpRight size={14} strokeWidth={2} style={{ verticalAlign: '-2px' }} /></a>
        </section>

        <footer className="vfoot2" style={{ margin: '0 -32px' }}>
          <div className="giant">{fmtk(us?.p50 ?? g.p50)}</div>
          <div className="frow"><span>The US median, from {us?.n ?? g.n} stated salaries</span><span><a className="ul" href="#">Method</a></span></div>
        </footer>
      </main>
    </>
  );
}
