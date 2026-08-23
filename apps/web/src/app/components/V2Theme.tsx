'use client';
import { useEffect, useState } from 'react';

/* The sitewide theme contract (docs/redesign-v2/05): initial theme follows
   prefers-color-scheme; an explicit choice persists in localStorage and wins.
   The inline bootstrap below runs before the page paints, so neither mode
   ever flashes. The class lives on <html> so every .v2t surface reads it. */

export const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem('ph-theme');var l=t?t==='light':matchMedia('(prefers-color-scheme: light)').matches;if(l)document.documentElement.classList.add('vlight');}catch(e){}})();`;

export function V2ThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => { setLight(document.documentElement.classList.contains('vlight')); }, []);
  const flip = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle('vlight', next);
    try { localStorage.setItem('ph-theme', next ? 'light' : 'dark'); } catch { /* private mode */ }
  };
  /* Icon only; CSS picks the glyph from html.vlight so the pre-hydration
     paint is already correct (the React state exists for the aria label). */
  return (
    <button type="button" className="v2-themetoggle" onClick={flip} aria-label={`Switch to ${light ? 'dark' : 'light'} mode`}>
      <svg className="tt-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
      <svg className="tt-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
    </button>
  );
}
