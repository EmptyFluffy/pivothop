'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* Global search: a command-palette overlay opened from the nav button (any
   element carrying data-search — the landing's vanilla nav and the React nav
   share this via event delegation), the / key, or Cmd/Ctrl-K. The index is a
   compact prebuilt JSON of every searchable surface, fetched lazily on first
   open, so pages carry zero search weight until someone asks. Empty state
   cycles deadpan hints in the house voice — the borrowed idea is the rotating
   placeholder; the register is ours. */

type Entry = { k: string; t: string; s: string; h: string };
const KIND: Record<string, string> = { jobs: 'JOBS', salary: 'SALARY', routes: 'ROUTES', skill: 'SKILL', blog: 'BLOG', page: 'PAGE' };
const HINTS = [
  'Try "architect". Everyone does.',
  'Type the job you have. It knows the ones you can reach.',
  'Salaries, routes, jobs, skills. One box.',
  '"Registered nurse" — Switzerland would like a word.',
  '"Revit" is a skill. Skills open doors here.',
  'Looking for a way out? Type the way in.',
  'The graph has opinions. Ask it.',
];

function score(q: string, e: Entry): number {
  const t = e.t.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 60;
  const wb = t.split(/[^a-z0-9]+/).some((w) => w.startsWith(q));
  if (wb) return 40;
  if (t.includes(q)) return 20;
  return 0;
}
const KIND_W: Record<string, number> = { jobs: 6, salary: 5, routes: 4, page: 3, blog: 2, skill: 1 };

export default function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [q, setQ] = useState('');
  const [index, setIndex] = useState<Entry[] | null>(null);
  const [hint, setHint] = useState(0);
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const closeIt = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setOpen(false); setClosing(false); }, 190);
  }, []);
  const openIt = useCallback(() => {
    setClosing(false); setOpen(true); setQ(''); setSel(0);
    if (!index) fetch('/data/search-index.json').then((r) => r.json()).then(setIndex).catch(() => setIndex([]));
  }, [index]);

  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      const t = (ev.target as HTMLElement).closest?.('[data-search]');
      if (t) { ev.preventDefault(); openIt(); }
    };
    const onKey = (ev: KeyboardEvent) => {
      const typing = /input|textarea|select/i.test((ev.target as HTMLElement).tagName || '');
      if ((ev.key === '/' && !typing) || ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k')) { ev.preventDefault(); openIt(); }
      if (ev.key === 'Escape') closeIt();
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); };
  }, [openIt, closeIt]);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30); }, [open]);
  useEffect(() => {
    if (!open || q) return;
    const id = setInterval(() => setHint((h) => (h + 1) % HINTS.length), 2600);
    return () => clearInterval(id);
  }, [open, q]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query || !index) return [];
    return index
      .map((e) => ({ e, sc: score(query, e) }))
      .filter((x) => x.sc > 0)
      .sort((a, b) => b.sc - a.sc || (KIND_W[b.e.k] ?? 0) - (KIND_W[a.e.k] ?? 0))
      .slice(0, 8)
      .map((x) => x.e);
  }, [q, index]);

  useEffect(() => { setSel(0); }, [q]);

  if (!open) return null;
  return (
    <div className={`srch${closing ? ' closing' : ''}`} role="dialog" aria-modal="true" aria-label="Search" onMouseDown={(e) => { if (e.target === e.currentTarget) closeIt(); }}>
      <div className="srch-panel">
        <div className="srch-row">
          <span className="srch-mark" aria-hidden="true">
            <svg viewBox="0 0 123.3 100" width="26" height="21"><g fill="currentColor"><path d="M31.9 0 A25.3 15 0 0 0 82.5 0 Z" /><path fillRule="evenodd" d="M83.3 0 L92 0 C104 0 116 8 121 20 C124 27 123 34 119 38 C112 41 100 40 90 40 L83.3 40 Z M103.3 20 a3.7 3.7 0 1 0 0.01 0 Z" /><path d="M83.1 40 L83.1 76 C91 76 99 82 102 90 C103.5 94 103 98 101.5 99.7 L24 99.7 C23.5 92 25 84 28.6 75 C32 64 40 53 58.9 45 C67 41 73 40 78.6 40 Z" /><circle cx="10" cy="89.5" r="10" /></g></svg>
          </span>
          <input
            ref={inputRef} value={q} placeholder="Search…" aria-label="Search the site"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
              if (e.key === 'Enter' && results[sel]) window.location.href = results[sel].h;
            }}
          />
          <button className="srch-x" aria-label="Close" onClick={closeIt}>&times;</button>
        </div>
        {q.trim() === '' ? (
          <div className="srch-empty">
            <p className="srch-hint" key={hint}>{HINTS[hint]}</p>
            <p className="srch-esc lbl">Tap outside or press <kbd>Esc</kbd> to close</p>
          </div>
        ) : (
          <ul className="srch-results">
            {results.length === 0 && <li className="srch-none">Nothing by that name. The corpus is honest about its gaps.</li>}
            {results.map((r, i) => (
              <li key={r.h + r.t}>
                <a href={r.h} className={i === sel ? 'on' : ''} onMouseEnter={() => setSel(i)}>
                  <span className="srch-k lbl">{KIND[r.k] ?? r.k}</span>
                  <span className="srch-t">{r.t}</span>
                  <span className="srch-s lbl">{r.s}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
