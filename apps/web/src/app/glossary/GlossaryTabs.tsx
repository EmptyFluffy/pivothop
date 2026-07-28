'use client';

// Tab shell for the glossary's three registers. All panels stay in the DOM
// (SEO and JSON-LD are unaffected); only visibility toggles. Deep links keep
// working: #skill-* and #skill-letter-* open the skills tab, a source id opens
// sources, anything else lands on terms, then the anchor is scrolled to once
// its panel is visible (scroll-margin-top handles the sticky offset).

import { useEffect, useState, type ReactNode } from 'react';

type Tab = { key: string; label: string; count: number; panel: ReactNode };

export default function GlossaryTabs({ tabs, sourceIds }: { tabs: Tab[]; sourceIds: string[] }) {
  const [active, setActive] = useState(0);
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    const fromHash = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      if (!h) return;
      if (h === 'skills' || h.startsWith('skill-')) setActive(2);
      else if (h === 'sources' || sourceIds.includes(h)) setActive(1);
      else setActive(0);
      if (h !== 'terms' && h !== 'sources' && h !== 'skills') setTarget(h);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll after the owning panel is visible, never before. Instant, not
  // smooth: the skill bank is tens of thousands of pixels tall and the html
  // scroll-behavior:smooth animation lands on stale coordinates.
  useEffect(() => {
    if (!target) return;
    document.getElementById(target)?.scrollIntoView({ behavior: 'instant', block: 'start' });
    setTarget(null);
  }, [active, target]);

  const onKeys = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (active + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
    setActive(next);
    document.getElementById(`gtab-${tabs[next].key}`)?.focus();
  };

  return (
    <div>
      <div className="gloss-tabbar" role="tablist" aria-label="Glossary sections" onKeyDown={onKeys}>
        {tabs.map((t, i) => (
          <button
            key={t.key} id={`gtab-${t.key}`} role="tab"
            aria-selected={i === active} aria-controls={`gpanel-${t.key}`}
            tabIndex={i === active ? 0 : -1}
            className={i === active ? 'gloss-tab on' : 'gloss-tab'}
            onClick={() => setActive(i)}
          >
            {t.label}<span className="gtab-n">{t.count}</span>
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div key={t.key} id={`gpanel-${t.key}`} role="tabpanel" aria-labelledby={`gtab-${t.key}`} hidden={i !== active}>
          {t.panel}
        </div>
      ))}
    </div>
  );
}
