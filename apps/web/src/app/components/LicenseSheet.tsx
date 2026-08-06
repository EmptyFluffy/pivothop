'use client';
import { useCallback, useEffect, useState } from 'react';

/* License summary sheet: clicking a license badge (any element carrying
   data-license="<occ-slug>", route pages and the graph's detail panel) opens
   this in place instead of navigating away. The badge keeps its real
   /licenses#occ-<slug> href, so cmd-click, middle-click and no-JS still reach
   the full page; "All license gates" in the footer goes there deliberately.
   Same skin, veil and in/out animation as the skill and search sheets. */

type Gate = {
  gate: string; market: string; path: string; time: string; note: string;
  body: { name: string; url: string }; anchor: string;
  req?: string; label?: string; title?: string;
  ch?: { gate: string; path: string; time: string; url: string };
};

export default function LicenseSheet() {
  const [data, setData] = useState<Record<string, Gate> | null>(null);
  const [open, setOpen] = useState<{ slug: string; g: Gate } | null>(null);
  const [closing, setClosing] = useState(false);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setOpen(null); setClosing(false); }, 190);
  }, []);

  useEffect(() => {
    let cache = data;
    const onClick = async (ev: MouseEvent) => {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      const t = (ev.target as HTMLElement).closest?.('[data-license]') as HTMLElement | null;
      if (!t) return;
      const slug = t.getAttribute('data-license')!;
      ev.preventDefault();
      if (!cache) {
        try { cache = await fetch('/data/license-sheet.json').then((r) => r.json()); setData(cache); }
        catch { window.location.href = `/licenses#occ-${slug}`; return; }
      }
      const g = cache?.[slug];
      if (!g) { window.location.href = `/licenses#occ-${slug}`; return; }
      setClosing(false); setOpen({ slug, g });
    };
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') close(); };
    // CAPTURE phase: the badge is a Next <Link>, whose own click handler starts
    // client navigation before a bubble-phase listener would run. Capturing
    // first and calling preventDefault makes Link stand down (it respects
    // defaultPrevented), so the sheet opens and the page stays put.
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onClick, true); document.removeEventListener('keydown', onKey); };
  }, [data, close]);

  if (!open) return null;
  const { g } = open;
  return (
    <div className={`skmodal open${closing ? ' closing' : ''}`} role="dialog" aria-modal="true" aria-label={`${g.gate}, license gate`}>
      <div className="veil" onClick={close} />
      <div className="sksheet lic-sh" tabIndex={-1} ref={(el) => el?.focus()}>
        <button className="xclose sk-close" aria-label="Close" onClick={close}>&times;</button>
        <span className="lbl">License gate &middot; {g.market === 'CH' ? 'Switzerland' : 'United States'}</span>
        <div className="lic-sh-head"><h3>{g.gate}</h3></div>
        {g.title && (
          <p className="lic-sh-occ">
            <b>{g.title}</b>
            {g.req && <span className={`lic-req lbl ${g.req}`}>{g.req === 'required' ? 'license required' : 'license for some roles'}</span>}
            {g.label && <><br />{g.label}</>}
          </p>
        )}
        <dl>
          <div><dt>The path</dt><dd>{g.path}</dd></div>
          <div><dt>Honest time</dt><dd>{g.time}</dd></div>
          {g.note && <div><dt>What it means for a pivot</dt><dd>{g.note}</dd></div>}
        </dl>
        {g.ch && (
          <div className="lic-sh-ch">
            <dl>
              <div><dt>In Switzerland</dt><dd>{g.ch.gate}: {g.ch.path} <a href={g.ch.url} target="_blank" rel="noopener noreferrer">authority ↗</a></dd></div>
            </dl>
          </div>
        )}
        <div className="lic-sh-foot">
          <a href={g.body.url} target="_blank" rel="noopener noreferrer" className="lbl">{g.body.name} ↗</a>
          <a href={`/licenses#${g.anchor}`} className="lbl acc">All license gates &rarr;</a>
        </div>
      </div>
    </div>
  );
}
