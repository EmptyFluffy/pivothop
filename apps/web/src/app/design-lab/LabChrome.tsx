import Link from 'next/link';

export function LabBar({ on }: { on: string }) {
  const links = [['/design-lab', 'lab'], ['/design-lab/jobs', 'jobs'], ['/design-lab/home', 'home'], ['/design-lab/route', 'route'], ['/design-lab/components', 'components'], ['/design-lab/tokens', 'tokens'], ['/design-lab/type', 'type']];
  return (
    <div className="labbar"><div className="wrap">
      <span>v2 design lab · not production</span>
      {links.map(([href, k]) => <Link key={k} href={href} className={k === on ? 'on' : ''}>{k}</Link>)}
    </div></div>
  );
}

export function V2Nav({ active }: { active?: string }) {
  return (
    <nav className="vnav"><div className="wrap vnav-in">
      <span className="vmark"><i />PivotHop</span>
      <span className="vnav-links">
        {['Jobs', 'Routes', 'Salaries', 'Research'].map((l) => (
          <a key={l} href="#" className={active === l ? 'on' : 'ul'}>{l}</a>
        ))}
      </span>
      <span className="vnav-right">
        <a href="#" className="ul" style={{ fontSize: 13.5 }}>Sign in</a>
        <button className="btn btn-primary" type="button">Run the instrument</button>
      </span>
    </div></nav>
  );
}

export function RouteMeasure({ from, to, pct }: { from: string; to: string; pct: number }) {
  return (
    <div className="measure">
      <div className="line">
        <span>{from}</span>
        <span className="bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
        <span>{to}</span>
      </div>
      <div className="pct vnum">{pct}% of demanded skills already covered</div>
    </div>
  );
}
