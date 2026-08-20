import { LabBar } from '../system';

const COLORS: [string, string][] = [
  ['--bg', '#F8F7F3'], ['--surface', '#FFFFFF'], ['--text', '#121212'], ['--text-2', '#686863'],
  ['--border', '#DEDCD5'], ['--border-strong', '#B8B6AF'], ['--accent', '#234BFF'],
  ['--pos', '#3D7A50'], ['--gap', '#C4573A'], ['--amber', '#B07C24'],
];

export default function LabTokens() {
  return (
    <>
      <LabBar on="tokens" />
      <main className="wrap" style={{ padding: '48px 32px 64px' }}>
        <h1 className="big" style={{ fontSize: 34 }}>Tokens.</h1>
        <hr className="sec-rule" />
        <span className="lab">Color</span>
        <div className="sw" style={{ marginTop: 14 }}>
          {COLORS.map(([n, v]) => (
            <div key={n}><i style={{ background: v }} /><span>{n}<br />{v}</span></div>
          ))}
        </div>
        <hr className="sec-rule" />
        <span className="lab">Spacing · 4 8 16 24 32 48 64</span>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginTop: 14 }}>
          {[4, 8, 16, 24, 32, 48, 64].map((s) => (
            <div key={s}><div style={{ width: s, height: s, background: '#234BFF22', border: '1px solid #234BFF55' }} /><span className="vnum" style={{ fontSize: 10.5 }}>{s}</span></div>
          ))}
        </div>
        <hr className="sec-rule" />
        <span className="lab">Radius 3px · Motion 180ms cubic-bezier(.3,.7,.3,1) · Underline 1px, +3px overshoot</span>
        <p style={{ marginTop: 12, fontSize: 14, maxWidth: '56ch', color: 'var(--text-2)' }}>
          One accent, used only where the interaction is brand-meaningful. Semantic
          green/coral/amber appear exclusively on skill overlap, gaps, and cautions.
        </p>
      </main>
    </>
  );
}
