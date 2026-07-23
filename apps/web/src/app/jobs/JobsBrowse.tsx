'use client';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { JobCard, type Job } from './JobCard';
import { countryName } from './countries';

/* The global board: one search over every listing. Patterns from the boards
   that work (top filter bar, instant counts, shareable URL state) plus the
   piece the tag boards get wrong: our tags are derived from the posting text,
   never employer-self-reported. Featured rows render between the filters and
   the results, and step aside the moment the user searches or filters. */

const PAGE = 60;
const PAY_STOPS = [50, 100, 150, 200] as const;
const TAGS: { code: string; label: string; hit: (j: Job, now: number) => boolean }[] = [
  { code: '4d', label: '4-day week', hit: (j) => !!j.fl?.includes('4d') },
  { code: 'eq', label: 'Equity', hit: (j) => !!j.fl?.includes('eq') },
  { code: 'vi', label: 'Visa sponsor', hit: (j) => !!j.fl?.includes('vi') },
  { code: 's', label: 'Senior', hit: (j) => j.lv === 's' },
  { code: 'e', label: 'Entry', hit: (j) => j.lv === 'e' },
  { code: 'new', label: 'New this week', hit: (j, now) => !!j.posted && now - new Date(j.posted).getTime() < 7 * 864e5 },
];

export default function JobsBrowse({ fields, titles, search, featured }: {
  fields: Record<string, string>;   // occ slug -> field
  titles: Record<string, string>;   // occ slug -> display title
  search: Record<string, string>;   // occ slug -> expansion text (title + field + taxonomy synonyms)
  featured?: ReactNode;             // the featured ledger, shown while the board is unfiltered
}) {
  const [all, setAll] = useState<Job[] | null>(null);
  const [q, setQ] = useState('');
  const [needle, setNeedle] = useState('');
  const [field, setField] = useState('');
  const [cty, setCty] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minPay, setMinPay] = useState(0);
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<'new' | 'pay'>('new');
  const [shown, setShown] = useState(PAGE);
  const [now] = useState(() => Date.now());

  // Load the corpus once, and read any shared filter state from the URL.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setQ(p.get('q') ?? ''); setNeedle((p.get('q') ?? '').toLowerCase());
    setField(p.get('f') ?? '');
    setCty(p.get('c') ?? '');
    setRemoteOnly(p.get('r') === '1');
    setMinPay(Number(p.get('pay')) || 0);
    setTags(new Set((p.get('t') ?? '').split(',').filter(Boolean)));
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
    if (cty) p.set('c', cty);
    if (remoteOnly) p.set('r', '1');
    if (minPay) p.set('pay', String(minPay));
    if (tags.size) p.set('t', [...tags].join(','));
    if (sort === 'pay') p.set('sort', 'pay');
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
    setShown(PAGE);
  }, [needle, field, cty, remoteOnly, minPay, tags, sort, all]);

  const fieldNames = useMemo(() => [...new Set(Object.values(fields))].sort(), [fields]);
  const countries = useMemo(() => {
    if (!all) return [] as { code: string; n: number }[];
    const m = new Map<string, number>();
    for (const j of all) if (j.c) m.set(j.c, (m.get(j.c) ?? 0) + 1);
    return [...m.entries()].map(([code, n]) => ({ code, n })).sort((a, b) => b.n - a.n);
  }, [all]);

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

  // Everything except the tag filters, so each chip can show a live count.
  const preTag = useMemo(() => {
    if (!all) return [];
    let r = all;
    if (field) r = r.filter((j) => fields[j.occ] === field);
    if (cty) r = r.filter((j) => j.c === cty);
    if (remoteOnly) r = r.filter((j) => j.remote);
    if (minPay) r = r.filter((j) => (j.smax ?? j.smin ?? 0) >= minPay * 1000);
    if (needle) {
      const toks = needle.split(/\s+/).filter(Boolean);
      r = r.filter((j) => {
        const h = hays.get(j.id);
        return h ? toks.every((t) => tokenHit(h, t)) : false;
      });
    }
    return r;
  }, [all, needle, field, cty, remoteOnly, minPay, fields, hays]);

  const tagCount = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of TAGS) m[t.code] = preTag.reduce((s, j) => s + (t.hit(j, now) ? 1 : 0), 0);
    return m;
  }, [preTag, now]);

  const results = useMemo(() => {
    let r = preTag;
    for (const t of TAGS) if (tags.has(t.code)) r = r.filter((j) => t.hit(j, now));
    if (sort === 'pay') r = [...r].sort((a, b) => (b.smax ?? b.smin ?? 0) - (a.smax ?? a.smin ?? 0));
    return r;
  }, [preTag, tags, sort, now]);

  const pristine = !needle && !field && !cty && !remoteOnly && !minPay && tags.size === 0 && sort === 'new';
  const toggleTag = (code: string) => setTags((prev) => {
    const next = new Set(prev);
    if (next.has(code)) next.delete(code); else next.add(code);
    return next;
  });

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
      {pristine ? (
        <div className="jb-try lbl" aria-label="Example searches">
          <span>Try</span>
          {['AI engineer', 'Registered nurse', 'Product design', 'Remote data'].map((ex) => (
            <button key={ex} type="button" onClick={() => { setQ(ex); setNeedle(ex.toLowerCase()); }}>{ex}</button>
          ))}
        </div>
      ) : (
        <div className="jb-active" aria-label="Active filters">
          {needle && <button type="button" className="jb-pill" onClick={() => { setQ(''); setNeedle(''); }}>&ldquo;{needle}&rdquo;<span className="jb-x">&times;</span></button>}
          {field && <button type="button" className="jb-pill" onClick={() => setField('')}>{field}<span className="jb-x">&times;</span></button>}
          {cty && <button type="button" className="jb-pill" onClick={() => setCty('')}>{countryName(cty)}<span className="jb-x">&times;</span></button>}
          {minPay > 0 && <button type="button" className="jb-pill" onClick={() => setMinPay(0)}>${minPay}k and up<span className="jb-x">&times;</span></button>}
          {remoteOnly && <button type="button" className="jb-pill" onClick={() => setRemoteOnly(false)}>Remote<span className="jb-x">&times;</span></button>}
          {TAGS.filter((t) => tags.has(t.code)).map((t) => (
            <button key={t.code} type="button" className="jb-pill" onClick={() => toggleTag(t.code)}>{t.label}<span className="jb-x">&times;</span></button>
          ))}
          {sort === 'pay' && <button type="button" className="jb-pill" onClick={() => setSort('new')}>Highest pay<span className="jb-x">&times;</span></button>}
          <button type="button" className="jb-clear lbl" onClick={() => { setQ(''); setNeedle(''); setField(''); setCty(''); setMinPay(0); setRemoteOnly(false); setTags(new Set()); setSort('new'); }}>Clear all</button>
        </div>
      )}
      <div className="jb-filters">
        <select aria-label="Field" value={field} onChange={(e) => setField(e.target.value)}>
          <option value="">All fields</option>
          {fieldNames.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select aria-label="Country" value={cty} onChange={(e) => setCty(e.target.value)}>
          <option value="">All countries</option>
          {countries.map((x) => <option key={x.code} value={x.code}>{countryName(x.code)} ({x.n})</option>)}
        </select>
        <select aria-label="Minimum salary" value={minPay} onChange={(e) => setMinPay(Number(e.target.value))}>
          <option value={0}>Any pay</option>
          {PAY_STOPS.map((p) => <option key={p} value={p}>${p}k and up</option>)}
        </select>
        <button type="button" className={`jb-toggle${remoteOnly ? ' on' : ''}`} aria-pressed={remoteOnly} onClick={() => setRemoteOnly((v) => !v)}>Remote</button>
        <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as 'new' | 'pay')}>
          <option value="new">Newest first</option>
          <option value="pay">Highest pay</option>
        </select>
        <span className="jb-chips" role="group" aria-label="Filter tags">
          {TAGS.map((t) => (
            <button key={t.code} type="button" className={`jb-chip${tags.has(t.code) ? ' on' : ''}`} aria-pressed={tags.has(t.code)} onClick={() => toggleTag(t.code)}>
              {t.label}{all !== null && <span className="jb-chip-n">{tagCount[t.code]}</span>}
            </button>
          ))}
        </span>
      </div>

      {pristine && featured}

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
