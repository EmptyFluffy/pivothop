'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* Global search: a command-palette overlay. The mark is the same magnifier
   the board's search unit uses (the rabbit went with the rest of the old
   brand marks).
   Opened from the nav button (any
   element carrying data-search: the landing's vanilla nav and the React nav
   share this via event delegation), the / key, or Cmd/Ctrl-K. The index is a
   compact prebuilt JSON of every searchable surface, fetched lazily on first
   open, so pages carry zero search weight until someone asks. Empty state
   cycles deadpan hints in the house voice. The borrowed idea is the rotating
   placeholder; the register is ours. */

type Entry = { k: string; t: string; s: string; h: string };
const KIND: Record<string, string> = { jobs: 'JOBS', salary: 'SALARY', routes: 'ROUTES', skill: 'SKILL', blog: 'BLOG', page: 'PAGE' };
// The empty state doubles as a menu: every line names something the index
// actually holds, so a first-time visitor learns the site's shape by watching.
// Kept literal on purpose (real queries, not slogans) and rotated slowly enough
// to read. House voice: deadpan, no exclamation points, no em dashes.
const HINTS = [
  'Try "3d modeler salary"',
  'Try "architect" for the building kind, "solutions architect" for the other',
  'Type a skill: "Revit", "Figma", "SQL", "Python"',
  'Try "registered nurse jobs"',
  '"routes out of graphic designer" shows every measured move',
  'Try "product manager vs project manager"',
  'Any job title works: type yours and see what it reaches',
  '"license gates" for what a credential actually takes',
  'Try "motion designer jobs"',
  '"jobs in switzerland" reads the federal Job-Room nightly',
  'Compare two careers: "ux designer vs product designer"',
  'Try "data analyst salary" for the whole distribution',
  '"glossary" defines every term the numbers use',
  'Try "civil engineer" and read the license gate',
  '"adjacency index" is the headline numbers, citable',
  'Try "interior designer jobs"',
  'Skills open doors: search one and see which roles it unlocks',
  'Try "software engineer salary by country"',
]

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
  const [hint, setHint] = useState(() => Math.floor(Math.random() * HINTS.length));
  const [sel, setSel] = useState(0);
  const [recents, setRecents] = useState<Entry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const remember = (e: Entry) => {
    try {
      const cur: Entry[] = JSON.parse(localStorage.getItem('ph-recents') || '[]');
      const next = [e, ...cur.filter((x) => x.h !== e.h)].slice(0, 5);
      localStorage.setItem('ph-recents', JSON.stringify(next));
    } catch { /* private mode */ }
  };

  const closeIt = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setOpen(false); setClosing(false); }, 190);
  }, []);
  const openIt = useCallback(() => {
    setClosing(false); setOpen(true); setQ(''); setSel(0);
    try { setRecents(JSON.parse(localStorage.getItem('ph-recents') || '[]')); } catch { setRecents([]); }
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
    const id = setInterval(() => setHint((h) => (h + 1) % HINTS.length), 4500);
    return () => clearInterval(id);
  }, [open, q]);

  // Grouped, not flat: a palette over content lives on scannability. Sections
  // in kind order, capped, each header carrying the kind's total match count.
  const { results, groups } = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query || !index) return { results: [] as Entry[], groups: [] as { k: string; total: number; items: Entry[] }[] };
    const hits = index
      .map((e) => ({ e, sc: score(query, e) }))
      .filter((x) => x.sc > 0)
      .sort((a, b) => b.sc - a.sc || (KIND_W[b.e.k] ?? 0) - (KIND_W[a.e.k] ?? 0));
    const byKind = new Map<string, { total: number; items: Entry[] }>();
    for (const { e } of hits) {
      if (!byKind.has(e.k)) byKind.set(e.k, { total: 0, items: [] });
      const g = byKind.get(e.k)!;
      g.total += 1;
      if (g.items.length < 4) g.items.push(e);
    }
    const groups = [...byKind.entries()]
      .sort((a, b) => (KIND_W[b[0]] ?? 0) - (KIND_W[a[0]] ?? 0))
      .map(([k, g]) => ({ k, ...g }))
      .slice(0, 4);
    return { results: groups.flatMap((g) => g.items), groups };
  }, [q, index]);

  useEffect(() => { setSel(0); }, [q]);

  if (!open) return null;
  return (
    <div className={`srch${closing ? ' closing' : ''}`} role="dialog" aria-modal="true" aria-label="Search" onMouseDown={(e) => { if (e.target === e.currentTarget) closeIt(); }}>
      <div className="srch-panel">
        <div className="srch-row">
          <span className="srch-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M16 16l5 5" /></svg>
          </span>
          <input
            ref={inputRef} value={q} placeholder="Search…" aria-label="Search the site"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
              if (e.key === 'Enter' && results[sel]) { remember(results[sel]); window.location.href = results[sel].h; }
            }}
          />
          <button className="srch-x" aria-label="Close" onClick={closeIt}>&times;</button>
        </div>
        {q.trim() === '' ? (
          <div className="srch-empty">
            {recents.length > 0 && (
              <div className="srch-recent">
                <span className="srch-gh lbl">Recent</span>
                <ul className="srch-results">
                  {recents.map((r) => (
                    <li key={r.h}>
                      <a href={r.h} onClick={() => remember(r)}>
                        <span className="srch-k lbl">{KIND[r.k] ?? r.k}</span>
                        <span className="srch-t">{r.t}</span>
                        <span className="srch-s lbl">{r.s}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="srch-hint" key={hint}>{HINTS[hint]}</p>
          </div>
        ) : (
          <div className="srch-body">
            {results.length === 0 && <p className="srch-none">No match{index ? ` in ${index.length.toLocaleString()} indexed entries` : ''}. Try a job title, a skill, or a country.</p>}
            {groups.map((g) => (
              <div key={g.k} className="srch-group">
                <span className="srch-gh lbl">{KIND[g.k] ?? g.k} — {g.total.toLocaleString()}</span>
                <ul className="srch-results">
                  {g.items.map((r) => {
                    const i = results.indexOf(r);
                    return (
                      <li key={r.h + r.t}>
                        <a href={r.h} className={i === sel ? 'on' : ''} onMouseEnter={() => setSel(i)} onClick={() => remember(r)}>
                          <span className="srch-t">{r.t}</span>
                          <span className="srch-s lbl">{r.s}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
        <div className="srch-foot lbl"><kbd>&#8629;</kbd> open <kbd>&#8593;&#8595;</kbd> move <kbd>esc</kbd> close</div>
      </div>
    </div>
  );
}
