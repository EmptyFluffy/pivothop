import { THEME_BOOTSTRAP, V2ThemeToggle } from './V2Theme';
import '../v2-theme.css';
import Link from 'next/link';
import SwissBanner from './SwissBanner';
import SearchOverlay from './SearchOverlay';
import LicenseSheet from './LicenseSheet';
import { MobileNav, NavBurger } from './MobileNav';

/* The site chrome shared by every secondary page: the landing's exact nav and
   footer inside the landing's exact .shell frame. One source, so the pages can
   never drift from the instrument again. */

function RabbitMark() {
  return (
    <span className="mark">
      <svg viewBox="0 0 123.3 100" aria-hidden="true"><g fill="currentColor"><path d="M31.9 0 A25.3 15 0 0 0 82.5 0 Z" /><path fillRule="evenodd" d="M83.3 0 L92 0 C104 0 116 8 121 20 C124 27 123 34 119 38 C112 41 100 40 90 40 L83.3 40 Z M103.3 20 a3.7 3.7 0 1 0 0.01 0 Z" /><path d="M83.1 40 L83.1 76 C91 76 99 82 102 90 C103.5 94 103 98 101.5 99.7 L24 99.7 C23.5 92 25 84 28.6 75 C32 64 40 53 58.9 45 C67 41 73 40 78.6 40 Z" /><circle cx="10" cy="89.5" r="10" /></g></svg>
    </span>
  );
}

const ArrowIco = () => (
  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg>
);

export function SiteNav({ active, v2 }: { active?: 'about' | 'employers' | 'jobs'; v2?: boolean }) {
  return (
    <header className="nav">
      <Link href="/" className="brand">{v2 ? <span className="wm">PivotHop</span> : <><RabbitMark /><span className="wm">PIVOTHOP</span></>}</Link>
      {v2 && (
        <span className="nav-v2r">
          <button className="nav-searchbtn-v2" type="button" data-search aria-label="Search" title="Search (press / or &#8984;K)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M16 16l5 5" /></svg>
            <kbd>&#8984;K</kbd>
          </button>
          <V2ThemeToggle />
          <Link className="nav-run" href="/">Run the instrument</Link>
        </span>
      )}
      {v2 && <span className="nav-tt-m"><V2ThemeToggle /></span>}
      {/* phones: search lives in the bar, not buried in the menu */}
      <button className="nav-searchbtn-m" type="button" data-search aria-label="Search">
        <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></svg>
      </button>
      <NavBurger controls="site-navmenu" />
      <div className="nav-menu" id="site-navmenu">
        {/* Ordered by what a first visit wants, not alphabetically: the product
            surfaces first (the board, then the instrument), then how it works,
            then editorial, then the company. Routes was promoted out of the
            footer — it is the instrument's own page and was the only core
            surface with no way to reach it from the top of the site. */}
        <Link className={`navlink${active === 'jobs' ? ' on' : ''}`} href="/jobs">Jobs</Link>
        <Link className="navlink" href="/routes">Routes</Link>
        <Link className="navlink" href="/#how">Method</Link>
        <Link className="navlink" href="/blog">Blog</Link>
        <Link className={`navlink${active === 'about' ? ' on' : ''}`} href="/about">About</Link>
        <button className="nav-searchbtn" type="button" data-search aria-label="Search" title="Search — press / or ⌘K">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></svg>
          <kbd aria-hidden="true">⌘K</kbd>
        </button>
        <Link className={`cta${active === 'employers' ? ' on' : ''}`} href="/employers">Join the waitlist</Link>
      </div>
    </header>
  );
}

/* The landing's full footer, ported to JSX so every page shares it. */
export function SiteFooter() {
  return (
    <>
      <footer className="foot">
        <div>
          <div className="brand"><RabbitMark /><span className="wm">PIVOTHOP</span></div>
          <div className="tg">Career decisions,<br />{' '}measured.</div>
          <div className="foot-social">
            <a href="https://www.linkedin.com/company/pivothop/" target="_blank" rel="noopener noreferrer" aria-label="PivotHop on LinkedIn"><svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" /></svg></a>
            <a href="https://www.instagram.com/pivothop/" target="_blank" rel="noopener noreferrer" aria-label="PivotHop on Instagram"><svg viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" /></svg></a>
            <a href="https://www.tiktok.com/@pivothop" target="_blank" rel="noopener noreferrer" aria-label="PivotHop on TikTok"><svg viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg></a>
          </div>
        </div>
        <div>
          <h5>Product</h5>
          <ul>
            <li><Link href="/#how">Method</Link></li>
            <li><Link href="/jobs">Job board</Link></li>
            <li><Link href="/jobs/browse">Browse jobs</Link></li>
            <li><Link href="/routes">Career routes</Link></li>
            <li><Link href="/compare">Compare careers</Link></li>
            <li><Link href="/salary">Salaries</Link></li>
            <li><a href="/fairelephant">FairElephant <ArrowIco /></a></li>
          </ul>
        </div>
        <div>
          <h5>Resources</h5>
          <ul>
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/adjacency-index">Adjacency Index</Link></li>
            <li><Link href="/glossary">Glossary &amp; sources</Link></li>
            <li><Link href="/licenses">License gates</Link></li>
            <li><Link href="/#faq">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h5>Company</h5>
          <ul>
            <li><Link href="/about">About us</Link></li>
            <li><Link href="/employers">For employers</Link></li>
            <li><a href="mailto:hello@pivothop.com">Contact</a></li>
          </ul>
        </div>
      </footer>
      <div className="copy"><span>&copy; 2026 PivotHop</span><span>Real data, real career moves</span></div>
    </>
  );
}

export function PageShell({ children, active, wide, v2 }: { children: React.ReactNode; active?: 'about' | 'employers' | 'jobs'; wide?: boolean; v2?: boolean }) {
  /* v2: the redesign theme layer (docs/redesign-v2/05). Adds the namespaced
     wrapper class, the no-flash theme bootstrap, and the mode toggle. The
     stylesheet only acts under .v2t, so non-opted templates are untouched. */
  return (
    <div className={`${wide ? 'shell shell-wide' : 'shell'}${v2 ? ' v2t' : ''}`}>
      {v2 && <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />}
      <div className="main">
        <SwissBanner />
        <SearchOverlay />
        <LicenseSheet />
        <SiteNav active={active} v2={v2} />
        <MobileNav />
        {children}
        <SiteFooter />
      </div>
    </div>
  );
}
