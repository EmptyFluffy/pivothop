import Link from 'next/link';

/* The site chrome shared by secondary pages: the landing's exact nav inside the
   landing's exact .shell frame (max-width + side hairlines). One source, so the
   pages can never drift from the instrument again. */

export function SiteNav({ active }: { active?: 'about' | 'employers' }) {
  return (
    <header className="nav">
      <Link href="/" className="brand">
        <span className="mark">
          <svg viewBox="-8 -12 139 124" aria-hidden="true"><g fill="currentColor"><path d="M31.9 0 A25.3 15 0 0 0 82.5 0 Z" /><path fillRule="evenodd" d="M83.3 0 L92 0 C104 0 116 8 121 20 C124 27 123 34 119 38 C112 41 100 40 90 40 L83.3 40 Z M103.3 20 a3.7 3.7 0 1 0 0.01 0 Z" /><path d="M83.1 40 L83.1 76 C91 76 99 82 102 90 C103.5 94 103 98 101.5 99.7 L24 99.7 C23.5 92 25 84 28.6 75 C32 64 40 53 58.9 45 C67 41 73 40 78.6 40 Z" /><circle cx="10" cy="89.5" r="10" /></g></svg>
        </span>
        <span className="wm">PIVOTHOP</span>
      </Link>
      <a className="navlink" href="/fairelephant">FairElephant <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg></a>
      <Link className="navlink" href="/#how">Method</Link>
      <Link className="navlink" href="/blog">Blog</Link>
      <Link className={`navlink${active === 'about' ? ' on' : ''}`} href="/about">About</Link>
      <Link className={`cta${active === 'employers' ? ' on' : ''}`} href="/employers">For employers</Link>
    </header>
  );
}

export function PageShell({ children, active }: { children: React.ReactNode; active?: 'about' | 'employers' }) {
  return (
    <div className="shell">
      <div className="main">
        <SiteNav active={active} />
        {children}
        <footer className="ab-foot">
          <span className="lbl">PivotHop</span>
          <span className="lbl">Real data, real career moves</span>
        </footer>
      </div>
    </div>
  );
}
