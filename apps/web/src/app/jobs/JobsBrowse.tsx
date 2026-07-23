'use client';
import { useEffect, useMemo, useState } from 'react';
import { JobCard, type Job } from './JobCard';

/* The global board: one search over every listing. Industry patterns applied:
   top filter bar (few facets), instant result counts, shareable URL state,
   debounced text search, incremental reveal instead of pagination. */

const PAGE = 60;

export default function JobsBrowse({ fields, titles, search }: {
  fields: Record<string, string>;   // occ slug -> field
  titles: Record<string, string>;   // occ slug -> display title
  search: Record<string, string>;   // occ slug -> expansion text (title + field + taxonomy synonyms)
}) {
  const [all, setAll] = useState<Job[] | null>(null);
  const [q, setQ] = useState('');
  const [needle, setNeedle] = useState('');
  const [field, setField] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [withPay, setWithPay] = useState(false);
  const [sort, setSort] = useState<'new' | 'pay'>('new');
  const [shown, setShown] = useState(PAGE);

  // Load the corpus once, and read any shared filter state from the URL.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setQ(p.get('q') ?? ''); setNeedle((p.get('q') ?? '').toLowerCase());
    setField(p.get('f') ?? '');
    setRemoteOnly(p.get('r') === '1');
    setWithPay(p.get('s') === '1');
    if (p.get('sort') === 'pay') setSort('pay');
    fetch('/data/all-jobs.json').then((r) => r.json()).then(setAll).catch(() => setAll([]));
  }, []);

  // Debounce the text search; keep the URL shareable.
  useEffect(() => {
    const t = setTimeout(() => setNeedle(q.trim().toLowerCase()), 160);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    if (all === null) return;
    const p = new URLSearchParams();
    if (needle) p.set('q', needle);
    if (field) p.set('f', field);
    if (remoteOnly) p.set('r', '1');
    if (withPay) p.set('s', '1');
    if (sort === 'pay') p.set('sort', 'pay');
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
    setShown(PAGE);
  }, [needle, field, remoteOnly, withPay, sort, all]);

  const fieldNames = useMemo(() => [...new Set(Object.values(fields))].sort(), [fields]);

  // Precompute each job's haystack once: its own text plus the occupation's
  // expansion (title, field, taxonomy synonyms). Words kept for prefix matching.
  const hays = useMemo(() => {
    if (!all) return new Map<string, { text: string; words: string[] }>();
    const m = new Map<string, { text: string; words: string[] }>();
    for (const j of all) {
      const text = `${j.title} ${j.company} ${j.location} ${search[j.occ] ?? titles[j.occ] ?? ''}`.toLowerCase();
      m.set(j.id, { text, words: text.split(/[^a-z0-9+#]+/).filter((w) => w.length >= 4) });
    }
    return m;
  }, [all, search, titles]);

  // A token matches on substring, or on a word-prefix in either direction, so
  // "architecture" finds architect, "designer" finds design, and vice versa.
  const tokenHit = (h: { text: string; words: string[] }, tok: string) => {
    if (h.text.includes(tok)) return true;
    if (tok.length < 4) return false;
    return h.words.some((w) => w.startsWith(tok) || tok.startsWith(w));
  };

  const results = useMemo(() => {
    if (!all) return [];
    let r = all;
    if (field) r = r.filter((j) => fields[j.occ] === field);
    if (remoteOnly) r = r.filter((j) => j.remote);
    if (withPay) r = r.filter((j) => j.smin || j.smax);
    if (needle) {
      const toks = needle.split(/\s+/).filter(Boolean);
      r = r.filter((j) => {
        const h = hays.get(j.id);
        return h ? toks.every((t) => tokenHit(h, t)) : false;
      });
    }
    if (sort === 'pay') r = [...r].sort((a, b) => (b.smax ?? b.smin ?? 0) - (a.smax ?? a.smin ?? 0));
    return r;
  }, [all, needle, field, remoteOnly, withPay, sort, fields, hays]);

  return (
    <div className="jb">
      <div className="jb-searchband">
        <svg className="jb-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M16 16l5 5" /></svg>
        <input
          className="jb-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Role, company, place, or skillset"
          aria-label="Search all listings"
          autoComplete="off"
        />
        <span className="lbl jb-count">{all === null ? 'loading' : `${results.length.toLocaleString()} roles`}</span>
      </div>
      <div className="jb-filters">
        <select aria-label="Field" value={field} onChange={(e) => setField(e.target.value)}>
          <option value="">All fields</option>
          {fieldNames.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <button type="button" className={`jb-toggle${remoteOnly ? ' on' : ''}`} aria-pressed={remoteOnly} onClick={() => setRemoteOnly((v) => !v)}>Remote</button>
        <button type="button" className={`jb-toggle${withPay ? ' on' : ''}`} aria-pressed={withPay} onClick={() => setWithPay((v) => !v)}>Salary shown</button>
        <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as 'new' | 'pay')}>
          <option value="new">Newest first</option>
          <option value="pay">Highest pay</option>
        </select>
      </div>

      {all === null ? (
        <p className="rt-note jb-loading">Loading the board&hellip;</p>
      ) : (
        <>
          <ul className="job-list job-list-full">
            {results.slice(0, shown).map((j) => <JobCard key={j.id} j={j} />)}
          </ul>
          {results.length === 0 && <p className="rt-note">Nothing matches. Clear a filter, or search fewer words.</p>}
          {results.length > shown && (
            <button type="button" className="jb-more" onClick={() => setShown((n) => n + PAGE)}>
              Show {Math.min(PAGE, results.length - shown)} more of {(results.length - shown).toLocaleString()}
            </button>
          )}
        </>
      )}
    </div>
  );
}
