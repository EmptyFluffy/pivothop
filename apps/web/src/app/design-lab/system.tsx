import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

/* V2 primitives (docs/redesign-v2/04-design-system.md). Extraction rule per
   the brief: a component exists here only when at least two surfaces use it.
   Single-use structures stay inline in their page. */

export function LabBar({ on }: { on: string }) {
  const links = [['/design-lab', 'lab'], ['/design-lab/jobs', 'jobs'], ['/design-lab/home', 'home'], ['/design-lab/route', 'route'], ['/design-lab/components', 'components'], ['/design-lab/tokens', 'tokens'], ['/design-lab/type', 'type']];
  return (
    <div className="labbar"><div className="wrap">
      <span>v2 design lab · not production</span>
      {links.map(([href, k]) => <Link key={k} href={href} className={k === on ? 'on' : ''}>{k}</Link>)}
      <ThemeToggle />
    </div></div>
  );
}

export function V2Nav({ active }: { active?: string }) {
  return (
    <nav className="vnav">
      <div className="vnav-top">
        <span className="vwordmark">PivotHop</span>
        <span className="vnav-right">
          <a href="#" className="ul" style={{ fontSize: 14 }}>Sign in</a>
          <NavSearch />
          <button className="btn btn-primary" type="button">Run the instrument</button>
          <button className="vburger" type="button" aria-label="Menu"><i /><i /><i /></button>
        </span>
      </div>
      <div className="vnav-tabs">
        {['Jobs', 'Routes', 'Salaries', 'Research'].map((l) => (
          <a key={l} href="#" className={active === l ? 'von' : ''}>{l}</a>
        ))}
      </div>
    </nav>
  );
}

const TINTS: [string, string][] = [
  ['#F3E3C8', '#7A5A18'], ['#DDE8D9', '#3D6247'], ['#E5DFF2', '#54467E'],
  ['#F4DBD2', '#8A4A32'], ['#DCE7EE', '#3A5A70'], ['#EFE1E4', '#7C4653'],
];
export function Monogram({ name, size = 34 }: { name: string; size?: number }) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const [bg, fg] = TINTS[h % TINTS.length];
  const initial = name.match(/[A-Za-z0-9]/)?.[0]?.toUpperCase() ?? '·';
  return <span className="mono-tile" style={{ background: bg, color: fg, width: size, height: size }} aria-hidden="true">{initial}</span>;
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


export function SearchUnit({ primary, secondary, action }: { primary: string; secondary?: string; action: React.ReactNode }) {
  return (
    <div className="search">
      <span><input placeholder={primary} aria-label={primary} /></span>
      {secondary && <span className="div loc-cell"><input placeholder={secondary} aria-label={secondary} /></span>}
      <span className="div vgo">{action}</span>
    </div>
  );
}

export function FilterToken({ children }: { children: React.ReactNode }) {
  return <button className="tok" type="button">{children} <b>×</b></button>;
}

export function Pill({ kind, children }: { kind: 'have' | 'miss'; children: React.ReactNode }) {
  return <span className={`pill ${kind === 'have' ? 'vhave' : 'miss'}`}>{children}</span>;
}

export function Stat({ v, k }: { v: React.ReactNode; k: string }) {
  return <div><div className="vv vnum">{v}</div><div className="vk">{k}</div></div>;
}


export function Pager({ pages, current = 1 }: { pages: number; current?: number }) {
  const seq: (number | '…')[] = pages > 4 ? [1, 2, 3, '…', pages] : Array.from({ length: pages }, (_, i) => i + 1);
  return (
    <nav className="vpager" aria-label="Pages">
      {seq.map((n, i) => n === '…'
        ? <a key={`d${i}`} className="dots" href="#" aria-hidden="true">…</a>
        : <a key={n} href="#" className={n === current ? 'cur' : ''} aria-current={n === current ? 'page' : undefined}>{n}</a>)}
      <a className="fwd" href="#" aria-label="Next page">→</a>
    </nav>
  );
}

export function NavSearch() {
  return (
    <span className="vnav-search" role="button" tabIndex={0} aria-label="Search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5 21 21" /></svg>
      <kbd>⌘K</kbd>
    </span>
  );
}
