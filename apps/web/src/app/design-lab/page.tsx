import Link from 'next/link';
import { LabBar } from './system';

export default function LabIndex() {
  const items = [
    ['jobs', 'Anchor A · Job board', 'Search unit, filter rail, rows not cards, inspector, the underline system, the measure.'],
    ['home', 'Anchor B · Homepage', 'Voice, hero, primary action, how product UI and editorial coexist.'],
    ['route', 'Anchor C · Transition detail', 'Architect to Interior Designer with the real measured numbers.'],
    ['components', 'Components', 'Every primitive in one place.'],
    ['tokens', 'Tokens', 'Color, spacing, radii, motion.'],
    ['type', 'Type', 'The hierarchy specimens.'],
  ];
  return (
    <>
      <LabBar on="lab" />
      <main className="wrap" style={{ padding: '48px 32px 64px' }}>
        <h1 className="big">V2 design lab.</h1>
        <p className="dek">Three anchor pages first (brief §5). Real data, no production templates touched. Approve the anchors before any system extraction or migration.</p>
        <hr className="sec-rule" />
        <div className="grid3">
          {items.map(([slug, t, d]) => (
            <div key={slug}>
              <h3><Link className="ul" href={`/design-lab/${slug}`}>{t}</Link></h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
