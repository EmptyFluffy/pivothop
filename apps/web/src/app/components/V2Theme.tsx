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
  return (
    <button type="button" className="v2-themetoggle" onClick={flip} aria-label={`Switch to ${light ? 'dark' : 'light'} mode`}>
      {light ? 'DARK' : 'LIGHT'}
    </button>
  );
}
