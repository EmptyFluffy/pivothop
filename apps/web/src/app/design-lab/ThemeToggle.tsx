'use client';
import { useEffect, useState } from 'react';

/* Lab-only theme switch: toggles .vlight on the .v2 root and remembers it.
   Dark is the default (the approved direction); light is the measured
   white-world alternate. */
export function ThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('v2-theme') === 'light';
    setLight(saved);
    document.querySelector('.v2')?.classList.toggle('vlight', saved);
  }, []);
  const flip = () => {
    const next = !light;
    setLight(next);
    localStorage.setItem('v2-theme', next ? 'light' : 'dark');
    document.querySelector('.v2')?.classList.toggle('vlight', next);
  };
  return (
    <button onClick={flip} type="button"
      style={{ background: 'none', border: '1px solid #444', borderRadius: 999, color: 'inherit', font: 'inherit', fontSize: 10.5, letterSpacing: '.1em', padding: '3px 12px', cursor: 'pointer', marginLeft: 'auto' }}>
      {light ? 'DARK' : 'LIGHT'}
    </button>
  );
}
