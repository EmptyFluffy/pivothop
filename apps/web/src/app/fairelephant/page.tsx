import type { Metadata } from 'next';
import './fe.css';
import { FESYMBOLS } from './fesymbols';
import { FEClient } from './FEClient';

export const metadata: Metadata = {
  title: 'FairElephant — Fair pay, computed.',
  description:
    'The remote-compensation instrument. Your salary read through live postings, official wage statistics, and World Bank purchasing power. Transparent method, no sign-up.',
};

export default function FairElephant() {
  return (
    <div className="fe-root">
      <div dangerouslySetInnerHTML={{ __html: FESYMBOLS }} />
      <div className="shell">
        <div className="main">
          <header className="nav">
            <a className="brand" href="/fairelephant"><span className="mark"><svg viewBox="0 0 100 87.8"><use href="#elephant" /></svg></span><span className="wm">FairElephant</span></a>
            <a className="navlink" href="#method">Method</a>
            <a className="navlink" href="/">PivotHop <svg style={{ width: '.72em', height: '.72em', verticalAlign: '-.02em' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg></a>
            <a className="navlink" href="/blog">Blog</a>
            <a className="navlink" href="/about">About</a>
            <a className="cta" href="/employers">For employers</a>
          </header>

          <section className="hero">
            <div className="eyebrow">The compensation instrument</div>
            <h1>Fair pay, <span className="em">computed.</span></h1>
          </section>

          <FEClient />

          <section className="method" id="method">
            <div className="h-cap">Method</div>
            <h2>Open models, one score.</h2>
            <div className="mgrid">
              <div className="mrow"><div className="m-slot"><span className="m-ico"><svg viewBox="0 0 16 16"><path fill="currentColor" d="M8 1h1v1h-1zM7 2h1v1h-1zM9 2h1v1h-1zM6 3h1v1h-1zM10 3h1v1h-1zM5 4h1v1h-1zM7 4h2v1h-2zM11 4h1v1h-1zM4 5h1v1h-1zM7 5h2v1h-2zM12 5h1v1h-1zM3 6h1v1h-1zM13 6h1v1h-1zM2 7h1v1h-1zM14 7h1v1h-1zM3 8h1v1h-1zM13 8h1v1h-1zM4 9h1v1h-1zM12 9h1v1h-1zM5 10h1v1h-1zM11 10h1v1h-1zM6 11h1v1h-1zM10 11h1v1h-1zM7 12h1v1h-1zM9 12h1v1h-1zM8 13h1v1h-1z" /></svg></span><span className="m-ix">A</span></div><h4>Market salary</h4><p>Percentile bands from live postings with stated pay, trimmed and floored at 30 observations per cell.</p></div>
              <div className="mrow"><div className="m-slot"><span className="m-ico"><svg viewBox="0 0 16 16"><path fill="currentColor" d="M7 1h3v1h-3zM6 2h1v1h-1zM10 2h1v1h-1zM6 3h1v1h-1zM10 3h1v1h-1zM6 4h1v1h-1zM10 4h1v1h-1zM7 5h3v1h-3zM5 6h7v1h-7zM8 7h1v1h-1zM8 8h1v1h-1zM2 9h3v1h-3zM8 9h1v1h-1zM12 9h3v1h-3zM3 10h1v1h-1zM8 10h1v1h-1zM13 10h1v1h-1zM3 11h2v1h-2zM8 11h1v1h-1zM12 11h2v1h-2zM5 12h2v1h-2zM8 12h1v1h-1zM10 12h2v1h-2zM7 13h3v1h-3z" /></svg></span><span className="m-ix">B</span></div><h4>Official anchor</h4><p>BLS OEWS wage percentiles by occupation and US state. Posting bands are shrunk toward the anchor by sample size.</p></div>
              <div className="mrow"><div className="m-slot"><span className="m-ico"><svg viewBox="0 0 16 16"><path fill="currentColor" d="M6 2h5v1h-5zM5 3h1v1h-1zM8 3h1v1h-1zM11 3h1v1h-1zM4 4h2v1h-2zM8 4h1v1h-1zM11 4h2v1h-2zM3 5h1v1h-1zM8 5h1v1h-1zM13 5h1v1h-1zM2 6h1v1h-1zM4 6h1v1h-1zM8 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM2 7h1v1h-1zM8 7h1v1h-1zM14 7h1v1h-1zM2 8h13v1h-13zM2 9h1v1h-1zM8 9h1v1h-1zM14 9h1v1h-1zM2 10h1v1h-1zM4 10h1v1h-1zM8 10h1v1h-1zM12 10h1v1h-1zM14 10h1v1h-1zM3 11h1v1h-1zM8 11h1v1h-1zM13 11h1v1h-1zM4 12h2v1h-2zM8 12h1v1h-1zM11 12h2v1h-2zM5 13h1v1h-1zM8 13h1v1h-1zM11 13h1v1h-1zM6 14h5v1h-5z" /></svg></span><span className="m-ix">C</span></div><h4>Purchasing power</h4><p>World Bank ICP price levels convert pay between countries at what money actually buys.</p></div>
              <div className="mrow"><div className="m-slot"><span className="m-ico"><svg viewBox="0 0 16 16"><path fill="currentColor" d="M8 0h1v1h-1zM5 1h1v1h-1zM8 1h1v1h-1zM11 1h1v1h-1zM8 2h1v1h-1zM7 3h1v1h-1zM9 3h1v1h-1zM6 4h1v1h-1zM10 4h1v1h-1zM5 5h1v1h-1zM11 5h1v1h-1zM4 6h1v1h-1zM12 6h1v1h-1zM3 7h1v1h-1zM13 7h1v1h-1zM2 8h11v1h-11zM14 8h1v1h-1zM3 9h1v1h-1zM12 9h1v1h-1zM3 10h1v1h-1zM12 10h1v1h-1zM3 11h1v1h-1zM7 11h3v1h-3zM12 11h1v1h-1zM3 12h1v1h-1zM7 12h3v1h-3zM12 12h1v1h-1zM3 13h1v1h-1zM7 13h3v1h-3zM12 13h1v1h-1zM3 14h10v1h-10z" /></svg></span><span className="m-ix">D</span></div><h4>Remote market rate</h4><p>What comparable fully-remote roles pay, tracked across live postings daily.</p></div>
            </div>
          </section>

          <section className="manif">
            <span className="lbl">Why FairElephant</span>
            <h3>The number is identical. <span className="em">The answer isn&rsquo;t.</span></h3>
            <p>Open models, one transparent score. If an offer can&rsquo;t survive the math, it wasn&rsquo;t fair. No black box. No vibes.</p>
          </section>

          <footer className="foot">
            <div>
              <div className="brand"><span className="mark"><svg viewBox="0 0 100 87.8"><use href="#elephant" /></svg></span><span className="wm">FairElephant</span></div>
              <div className="tg">Fair pay,<br />computed.</div>
              <div className="ppro">A PivotHop product</div>
            </div>
            <div><h5>Product</h5><ul><li><a href="#results">Analyze</a></li><li><a href="#method">Method</a></li><li><a href="/">PivotHop ↗</a></li></ul></div>
            <div><h5>Sources</h5><ul><li><a href="https://www.bls.gov/oes/" rel="noopener">BLS OEWS</a></li><li><a href="https://data.worldbank.org" rel="noopener">World Bank ICP</a></li><li><a href="/about">About the data</a></li></ul></div>
          </footer>
        </div>
      </div>
    </div>
  );
}
