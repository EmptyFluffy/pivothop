import { LabBar } from '../system';

export default function LabType() {
  return (
    <>
      <LabBar on="type" />
      <main className="wrap" style={{ padding: '48px 32px 64px', maxWidth: 900 }}>
        <span className="lab">Inter (UI) · JetBrains Mono (data only)</span>
        <h1 className="big" style={{ marginTop: 18 }}>Hero: strong sans, large but not theatrical.</h1>
        <hr className="sec-rule" />
        <h2 style={{ fontSize: 24, letterSpacing: '-.02em' }}>Page title, 24</h2>
        <p style={{ fontSize: 15.5, fontWeight: 600, marginTop: 16 }}>Job title, 15.5 semibold</p>
        <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>COMPANY · small and quiet</p>
        <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 4 }}>Metadata · location · posted date</p>
        <p className="vnum" style={{ fontSize: 15, marginTop: 16 }}>Data: 82% · $120K–160K · 2d · 156</p>
        <p className="lab" style={{ marginTop: 16 }}>Label · mono · sparing, never everywhere</p>
        <hr className="sec-rule" />
        <p style={{ maxWidth: '56ch', fontSize: 15 }}>
          Body text stays Inter at 15/1.55. The mono face appears only where content is
          actually data, so the tabular numerals keep every column on the board aligned.
          Interactive text takes the <a className="ul" href="#">V2 underline</a> on hover,
          and the accent version is reserved for <a className="ul ul-accent" href="#">brand-meaningful actions</a>.
        </p>
      </main>
    </>
  );
}
