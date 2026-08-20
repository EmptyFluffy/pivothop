import Link from 'next/link';
import { originMeta, originRoles, routePair } from './routes-data';

// The instrument as typography, in the graph's own arrangement. The origin
// sits in the center; every measured destination is placed radially around it,
// higher readiness pulling both CLOSER and LARGER, so the spatial metaphor of
// the node graph survives with no nodes, no edges, no canvas and no ground.
// The percentage stays quiet until hover (or keyboard focus), where the name
// takes the value color and its number surfaces. The left rail lists the same
// routes in the system's rail language. Deterministic layout, server-rendered,
// zero client JS; CSS carries the interaction. The landing instrument and its
// physics are untouched.

const GOLDEN = 137.508;

function sizeFor(match: number): number {
  return Math.round(15 + Math.pow(Math.max(0, Math.min(100, match)) / 100, 1.6) * 42);
}

type Pos = { x: number; y: number };

function layout(matches: number[]): Pos[] {
  // Golden-angle scatter, readiness pulling inward. A deterministic nudge pass
  // pushes any two labels apart that would land on each other, so the field
  // renders identically on every request and never overlaps.
  const placed: Pos[] = [];
  matches.forEach((m, i) => {
    const a = ((-40 + i * GOLDEN) * Math.PI) / 180;
    let R = 16 + (1 - m / 100) * 26;               // % of field; strong = close
    let x = 0, y = 0;
    for (let tries = 0; tries < 40; tries++) {
      x = 50 + Math.cos(a) * R * 1.42;             // wide field: stretch x
      y = 50 + Math.sin(a) * R * 0.95;
      const clash = placed.some((p) => Math.abs(p.y - y) < 11 && Math.abs(p.x - x) < 24)
        || (Math.abs(y - 50) < 9 && Math.abs(x - 50) < 20); // keep off the center
      if (!clash) break;
      R += 3.5;
    }
    placed.push({ x: Math.max(15, Math.min(85, x)), y: Math.max(9, Math.min(91, y)) });
  });
  return placed;
}

export default function RouteCloud({ origin, focus }: { origin: string; focus?: string }) {
  const om = originMeta(origin);
  const roles = originRoles(origin).filter((r) => r.match != null);
  if (roles.length === 0) return null;
  const top = roles[0]?.match ?? 0;
  const pos = layout(roles.map((r) => r.match ?? 0));
  return (
    <section className="rtcloud" aria-label={`Measured routes out of ${om.title}, sized and placed by skill readiness`}>
      <div className="rtcloud-head lbl">
        <span>Career graph &middot; {om.title}</span>
        <span>Top match <b>{top}%</b></span>
      </div>
      <div className="rtcloud-body">
        <aside className="rtcloud-rail" aria-label="The routes, listed">
          <h5>Routes</h5>
          <ul>
            {roles.map((r) => {
              const slug = `${origin}-to-${r.id}`;
              const linked = !!routePair(slug);
              const row = (
                <>
                  <span className="t">{r.title}</span>
                  <span className="m">{r.match}%</span>
                </>
              );
              return (
                <li key={r.id} className={r.id === focus ? 'on' : undefined}>
                  {linked ? <Link href={`/routes/${slug}`}>{row}</Link> : <span className="dead">{row}</span>}
                </li>
              );
            })}
          </ul>
          <p className="rtcloud-hint lbl">Type size and pull toward the center are skill readiness, measured from live postings. Hover a name for the number; open it for the route.</p>
        </aside>
        <div className="rtcloud-field">
          <span className="rtcloud-center" aria-hidden="true">{om.title}</span>
          {roles.map((r, i) => {
            const slug = `${origin}-to-${r.id}`;
            const linked = !!routePair(slug);
            const size = sizeFor(r.match ?? 0);
            const style = {
              '--x': `${pos[i].x}%`,
              '--y': `${pos[i].y}%`,
              fontSize: `clamp(${Math.max(14, Math.round(size * 0.55))}px, ${(size / 15.12).toFixed(2)}vw, ${size}px)`,
            } as React.CSSProperties;
            const inner = (
              <>
                {r.title}
                <span className="pct" aria-hidden="true">{r.match}%</span>
              </>
            );
            return linked ? (
              <Link key={r.id} href={`/routes/${slug}`} className={`rtcloud-t${r.id === focus ? ' on' : ''}`}
                style={style} aria-label={`${om.title} to ${r.title}, ${r.match}% skill readiness`}>
                {inner}
              </Link>
            ) : (
              <span key={r.id} className={`rtcloud-t${r.id === focus ? ' on' : ''}`} style={style} tabIndex={0}
                aria-label={`${r.title}, ${r.match}% skill readiness`}>
                {inner}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
