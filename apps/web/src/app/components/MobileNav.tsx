'use client';
import { useEffect } from 'react';
import { wireMobileNav } from '@/lib/mobilenav';

/* Mounts the burger-toggle behavior for a server-rendered nav. Renders nothing;
   the burger button + .nav-menu live in the nav markup. */
export function MobileNav() {
  useEffect(() => { wireMobileNav(); }, []);
  return null;
}

/* The burger button, shared by the React navs. Two icons; CSS swaps them on
   .nav.open. */
export function NavBurger({ controls }: { controls: string }) {
  return (
    <button className="nav-burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls={controls}>
      <svg className="i-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></svg>
      <svg className="i-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12" /><path d="M18 6l-12 12" /></svg>
    </button>
  );
}
