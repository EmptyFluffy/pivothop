'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/* The Swiss suggestion (docs/32: suggest, never force). Renders only when the
   proxy set the ph-ch cookie — i.e. Vercel geolocated the visitor to
   Switzerland — and the visitor has not dismissed it. Client-side entirely, so
   every prerendered page stays byte-identical for crawlers and non-Swiss
   visitors; there is nothing here for SEO to see. Dismissal is remembered in
   localStorage, not the cookie, so the proxy never needs to re-decide. */
export default function SwissBanner() {
  const [show, setShow] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!document.cookie.split('; ').includes('ph-ch=1')) return;
    if (localStorage.getItem('ph-ch-dismissed')) return;
    setShow(true);
  }, []);
  // On the Swiss board itself the banner would be furniture.
  if (!show || pathname?.startsWith('/jobs/in-switzerland')) return null;
  return (
    <div className="ch-banner" role="region" aria-label="Swiss edition suggestion">
      <span className="ch-flag" aria-hidden="true"><svg viewBox="0 0 32 32" width="14" height="14"><rect width="32" height="32" fill="#d52b1e" /><rect x="13" y="6" width="6" height="20" fill="#fff" /><rect x="6" y="13" width="20" height="6" fill="#fff" /></svg></span>
      <span className="ch-txt">Browsing from Switzerland. Swiss openings are on the board, read nightly from the federal Job-Room.</span>
      <a className="ch-go" href="/jobs/in-switzerland">View jobs in Switzerland</a>
      <button
        className="ch-x"
        aria-label="Dismiss"
        onClick={() => { localStorage.setItem('ph-ch-dismissed', '1'); setShow(false); }}
      >&times;</button>
    </div>
  );
}
