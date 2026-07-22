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
              <div className="mrow"><div className="m-slot"><span className="m-ico"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M18 5h2v2h-2zM4 3h14v2H4zM2 5h2v14H2zm2 14h16v2H4zm12-4h6v2h-6zm0-4h6v2h-6zm-2 0h2v6h-2z" /></svg></span></div><h4>Market salary</h4><p>Percentile bands from live postings with stated pay, trimmed and floored at 30 observations per cell.</p></div>
              <div className="mrow"><div className="m-slot"><span className="m-ico"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 2h14v2H5zm0 18h14v2H5zM3 4h2v16H3zm16 0h2v16h-2zM7 6h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zm-8 4h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zm-8 4h2v2H7zm4 0h2v2h-2zm-1 4h4v2h-4zm5-4h2v2h-2z" /></svg></span></div><h4>Official anchor</h4><p>BLS OEWS wage percentiles by occupation and US state. Posting bands are shrunk toward the anchor by sample size.</p></div>
              <div className="mrow"><div className="m-slot"><span className="m-ico"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 2h12v2H6zm0 18h12v2H6zM4 4h2v2H4zm5 0h2v2H9zm0 14h2v2H9zm4 0h2v2h-2zM7 6h2v12H7zm8 0h2v12h-2zm-2-2h2v2h-2zm7 0h-2v2h2zM2 6h2v12H2zm20 0h-2v12h2zM4 18h2v2H4zm16 0h-2v2h2z" /></svg></span></div><h4>Purchasing power</h4><p>World Bank ICP price levels convert pay between countries at what money actually buys.</p></div>
              <div className="mrow"><div className="m-slot"><span className="m-ico"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 20h16v2H4zm16-10h2v10h-2zM2 10h2v10H2zm2-2h2v2H4zm2-2h2v2H6zm2-2h2v2H8zm2-2h4v2h-4zm4 2h2v2h-2zm2 2h2v2h-2zm2 2h2v2h-2zM8 14h2v6H8zm2-2h4v2h-4zm4 2h2v6h-2z" /></svg></span></div><h4>Remote market rate</h4><p>What comparable fully-remote roles pay, tracked across live postings daily.</p></div>
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
