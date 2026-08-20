import Link from 'next/link';
import { originMeta, originRoles, routePair } from './routes-data';

// The instrument as typography. No nodes, no edges, no canvas: every measured
// destination set in the words face, and the measurement IS the type size --
// the closer your skills already sit, the larger the name reads. The number
// itself stays quiet until hover (or keyboard focus), where the name takes the
// value color and its readiness appears beside it. Each name is a real link to
// its route page, so the figure renders server-side with zero client JS; CSS
// carries the interaction.
//
// This replaces the embedded node graph on the ROUTES pages only. The landing
// instrument and its tuned physics are untouched.

const SIZE_MIN = 17;
const SIZE_SPAN = 68;

function sizeFor(match: number): number {
  // A power curve, so the top matches clearly dominate and the tail stays
  // legible: 92% -> ~76px, 60% -> ~46px, 29% -> ~26px.
  return Math.round(SIZE_MIN + Math.pow(Math.max(0, Math.min(100, match)) / 100, 1.7) * SIZE_SPAN);
}

export default function RouteCloud({ origin, focus }: { origin: string; focus?: string }) {
  const om = originMeta(origin);
  const roles = originRoles(origin).filter((r) => r.match != null);
  if (roles.length === 0) return null;
  const top = roles[0]?.match ?? 0;
  return (
    <section className="rtcloud" aria-label={`Measured routes out of ${om.title}, sized by skill readiness`}>
      <div className="rtcloud-head lbl">
        <span>Career graph &middot; {om.title}</span>
        <span>Top match <b>{top}%</b></span>
      </div>
      <div className="rtcloud-cloud">
        {roles.map((r) => {
          const slug = `${origin}-to-${r.id}`;
          const linked = !!routePair(slug);
          const size = sizeFor(r.match ?? 0);
          const style = { fontSize: `clamp(${Math.max(15, Math.round(size * 0.5))}px, ${(size / 15.12).toFixed(2)}vw, ${size}px)` };
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
      <p className="rtcloud-legend lbl">Type size is skill readiness, measured from live postings &middot; hover for the number &middot; open a name for the route</p>
    </section>
  );
}
