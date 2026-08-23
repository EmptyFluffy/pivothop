import { POSTS } from '../../blog/posts';
import { LabBar, V2Nav } from '../system';

/* Article template on a real piece (the career change tax). Takeaways, FAQ
   and sources are the actual registry strings; the body typography spec is
   shown with the real dek and takeaways. */

export default function LabArticle() {
  const p = POSTS.find((x) => x.slug === 'career-change-tax') ?? POSTS[0];
  return (
    <>
      <LabBar on="article" />
      <V2Nav active="Research" />
      <main className="wrap" style={{ maxWidth: 860, padding: '0 32px' }}>
        <article style={{ padding: '46px 0 0' }}>
          <p className="lab" style={{ color: 'var(--value)', marginBottom: 14 }}>{p.pillar} · {p.date} · {p.minutes} min</p>
          <h1 style={{ fontSize: 'clamp(34px,4.4vw,56px)', fontWeight: 650, letterSpacing: '-.03em', lineHeight: 1.02 }}>{p.title}</h1>
          <p style={{ fontSize: 17.5, color: 'var(--text-2)', lineHeight: 1.62, marginTop: 20, maxWidth: '62ch' }}>{p.dek}</p>

          {p.takeaways && (
            <section style={{ margin: '38px 0 0', borderTop: '1px solid var(--border-strong)', paddingTop: 22 }}>
              <p className="lab" style={{ marginBottom: 16 }}>The short version</p>
              {p.takeaways.map((t, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="vnum" style={{ color: 'var(--value)', fontSize: 14 }}>{String(i + 1).padStart(2, '0')}</span>
                  <p style={{ fontSize: 15.5, lineHeight: 1.6, maxWidth: '70ch' }}>{t}</p>
                </div>
              ))}
            </section>
          )}

          <div style={{ margin: '40px 0', padding: '30px 0 30px', borderBottom: '1px solid var(--border-strong)' }}>
            <p style={{ fontSize: 'clamp(22px,2.6vw,30px)', fontWeight: 550, letterSpacing: '-.02em', lineHeight: 1.25, maxWidth: '28ch' }}>
              The median career change is not a pay cut with a dream attached. It is a coin flip with a thumb on the scale.
            </p>
          </div>

          <p style={{ fontSize: 16, lineHeight: 1.7, maxWidth: '66ch', color: 'var(--text-2)' }}>
            Body text runs 16/1.7 on a 66ch measure. Load-bearing numbers carry{' '}
            <b style={{ color: 'var(--text)' }}>the ink</b>, links take the{' '}
            <a className="ul" href="#">tight underline</a>, and the value color appears
            only where a figure earns it, like <span className="vnum" style={{ color: 'var(--value)' }}>52.5%</span>.
          </p>

          {p.faq && (
            <section style={{ marginTop: 44 }}>
              <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-.02em', marginBottom: 6 }}>Before you ask.</h2>
              {p.faq.slice(0, 3).map((f) => (
                <details key={f.q} style={{ borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
                  <summary style={{ fontSize: 16.5, fontWeight: 550, cursor: 'pointer', letterSpacing: '-.01em' }}>{f.q}</summary>
                  <p style={{ fontSize: 14.5, color: 'var(--text-2)', lineHeight: 1.65, marginTop: 10, maxWidth: '68ch' }}>{f.a}</p>
                </details>
              ))}
            </section>
          )}

          <p className="vmeta" style={{ margin: '40px 0 46px' }}>Sources and method · the pivothop pipeline, august 2026 run · ziprecruiter q4 2025 via the hill</p>
        </article>
        <footer className="vfoot2" style={{ margin: '0 -32px' }}>
          <div className="giant">PivotHop</div>
          <div className="frow"><span>Career moves, measured</span><span><a className="ul" href="#">Next piece</a></span></div>
        </footer>
      </main>
    </>
  );
}
