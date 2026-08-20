import { POSTS } from '../../blog/posts';
import { LabBar, V2Nav } from '../system';
import { ArrowUpRight } from 'lucide-react';

/* Research index (the blog, under the name the user loves). CB editorial
   grammar: one featured lead, then indexed rows, type does the layout. All
   titles, deks and dates are the real registry. */

export default function LabResearch() {
  const [lead, ...rest] = POSTS.slice(0, 9);
  return (
    <>
      <LabBar on="research" />
      <V2Nav active="Research" />
      <main className="wrap" style={{ maxWidth: 1240, padding: '0 32px' }}>
        <section style={{ padding: '44px 0 36px', borderBottom: '1px solid var(--border-strong)' }}>
          <p className="vmeta">{POSTS.length} pieces · every number from the pipeline or a named dataset</p>
          <h1 className="vtitle" style={{ maxWidth: '22ch' }}>Research.</h1>
          <article style={{ maxWidth: 760 }}>
            <p className="lab" style={{ color: 'var(--value)', marginBottom: 10 }}>{lead.pillar} · {lead.date}</p>
            <h2 style={{ fontSize: 'clamp(26px,3vw,38px)', fontWeight: 600, letterSpacing: '-.025em', lineHeight: 1.08 }}>
              <a className="ul" href="#">{lead.title}</a>
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-2)', marginTop: 14, lineHeight: 1.6 }}>{lead.dek}</p>
            <p className="vmeta" style={{ marginTop: 12, marginBottom: 0 }}>{lead.minutes} min read</p>
          </article>
        </section>
        <section>
          {rest.map((p, i) => (
            <article key={p.slug} style={{ display: 'grid', gridTemplateColumns: '56px minmax(0,1fr) 120px 40px', gap: 20, alignItems: 'baseline', padding: '26px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="vnum" style={{ color: 'var(--value)', fontSize: 13 }}>{String(i + 2).padStart(2, '0')}</span>
              <div>
                <h3 style={{ fontSize: 21, fontWeight: 550, letterSpacing: '-.015em', lineHeight: 1.2 }}>
                  <a className="ul" href="#">{p.title}</a>
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 7, maxWidth: '72ch' }}>{p.dek.slice(0, 150)}{p.dek.length > 150 ? '…' : ''}</p>
              </div>
              <span className="vmeta" style={{ margin: 0, textAlign: 'right' }}>{p.date}<br />{p.minutes} min</span>
              <ArrowUpRight size={18} strokeWidth={1.75} style={{ color: 'var(--text-2)' }} />
            </article>
          ))}
        </section>
        <footer className="vfoot2" style={{ margin: '0 -32px' }}>
          <div className="giant">Research</div>
          <div className="frow">
            <span>Run it 10,000 times · what carried over · the shape of work</span>
            <span><a className="ul" href="#">All {POSTS.length} pieces</a></span>
          </div>
        </footer>
      </main>
    </>
  );
}
