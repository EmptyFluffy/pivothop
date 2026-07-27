'use client';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { JobCard, type Job } from './JobCard';
import { countryName } from './countries';
import { regionOf, REGION_META, type RegionKey } from './regions';

/* The global board: one search over every listing. Patterns from the boards
   that work (top filter bar, instant counts, shareable URL state) plus the
   piece the tag boards get wrong: our tags are derived from the posting text,
   never employer-self-reported. Featured rows render between the filters and
   the results, and step aside the moment the user searches or filters.

   Scoped mode (an occupation page, e.g. /jobs/architect): the same bar, seeded
   with that occupation's SSR'd listings (so the HTML is crawlable) and the live
   employer layer for that occupation, plus a "Show all jobs" link back here. */

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

export default function JobsBrowse({ fields, titles, search, featured, initialJobs, scope }: {
  fields: Record<string, string>;   // occ slug -> field
  titles: Record<string, string>;   // occ slug -> display title
  search: Record<string, string>;   // occ slug -> expansion text (title + field + taxonomy synonyms)
  featured?: ReactNode;             // the featured ledger, shown while the board is unfiltered
  initialJobs?: Job[];              // scoped mode: this occupation's listings, rendered server-side
  scope?: { occ?: string; title: string; showAllHref?: string; showAllLabel?: string }; // occupation page (occ set) or category page (occ absent)
}) {
  const [all, setAll] = useState<Job[] | null>(initialJobs ?? null);
  const [q, setQ] = useState('');
  const [needle, setNeedle] = useState('');
  const [field, setField] = useState('');
  const [cty, setCty] = useState('');
  const [region, setRegion] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minPay, setMinPay] = useState(0);
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<'new' | 'pay'>('new');
  const [filtersOpen, setFiltersOpen] = useState(false); // mobile: collapse filters behind a toggle
  const [tagsOpen, setTagsOpen] = useState(false);        // the Tags dropdown (keeps the bar to one line)
  const [shown, setShown] = useState(PAGE);
  const [now] = useState(() => Date.now());
  const tagRef = useRef<HTMLDivElement>(null);

  // Load the corpus once, and read any shared filter state from the URL.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setQ(p.get('q') ?? ''); setNeedle((p.get('q') ?? '').toLowerCase());
    setField(p.get('f') ?? '');
    setCty(p.get('c') ?? '');
    setRegion(p.get('region') ?? '');
    setRemoteOnly(p.get('r') === '1');
    setMinPay(Number(p.get('pay')) || 0);
    setTags(new Set((p.get('t') ?? '').split(',').filter(Boolean)));
    if (p.get('sort') === 'pay') setSort('pay');
    if (scope?.occ) {
      // occupation page: the SSR'd listings are already in state; fold in the
      // live layer of paid employer posts for this occupation, pinned first.
      fetch('/api/employer-jobs').then((r) => r.json()).catch(() => [])
        .then((employer: Job[]) => {
          const mine = (employer || []).filter((j) => j.occ === scope.occ);
          if (mine.length) setAll((prev) => [...mine, ...(prev ?? initialJobs ?? [])]);
        });
    } else if (scope) {
      // category page: the capped SSR sample is the corpus; the full filtered
      // set is one click away on /jobs, so no client fetch here.
    } else {
      // global: static scraped jobs + the live layer of paid employer posts (pinned first)
      Promise.all([
        fetch('/data/all-jobs.json').then((r) => r.json()).catch(() => []),
        fetch('/api/employer-jobs').then((r) => r.json()).catch(() => []),
      ]).then(([scraped, employer]: [Job[], Job[]]) => setAll([...(employer || []), ...(scraped || [])]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close the Tags dropdown on an outside click or Escape.
  useEffect(() => {
    if (!tagsOpen) return;
    const onDoc = (e: MouseEvent) => { if (tagRef.current && !tagRef.current.contains(e.target as Node)) setTagsOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setTagsOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [tagsOpen]);

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
    if (region) p.set('region', region);
    if (remoteOnly) p.set('r', '1');
    if (minPay) p.set('pay', String(minPay));
    if (tags.size) p.set('t', [...tags].join(','));
    if (sort === 'pay') p.set('sort', 'pay');
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
    setShown(PAGE);
  }, [needle, field, cty, region, remoteOnly, minPay, tags, sort, all]);

  const fieldNames = useMemo(() => [...new Set(Object.values(fields))].sort(), [fields]);
  const countries = useMemo(() => {
    if (!all) return [] as { code: string; n: number }[];
    const m = new Map<string, number>();
    for (const j of all) if (j.c) m.set(j.c, (m.get(j.c) ?? 0) + 1);
    return [...m.entries()].map(([code, n]) => ({ code, n })).sort((a, b) => b.n - a.n);
  }, [all]);
  const regionsList = useMemo(() => {
    if (!all) return [] as { key: RegionKey; n: number }[];
    const m = new Map<RegionKey, number>();
    for (const j of all) { const rk = regionOf(j.c); if (rk) m.set(rk, (m.get(rk) ?? 0) + 1); }
    return [...m.entries()].map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n);
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
    if (region) r = r.filter((j) => regionOf(j.c) === region);
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
  }, [all, needle, field, cty, region, remoteOnly, minPay, fields, hays]);

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

  const pristine = !needle && !field && !cty && !region && !remoteOnly && !minPay && tags.size === 0 && sort === 'new';
  const toggleTag = (code: string) => setTags((prev) => {
    const next = new Set(prev);
    if (next.has(code)) next.delete(code); else next.add(code);
    return next;
  });

  const activeCount = (field ? 1 : 0) + (cty ? 1 : 0) + (region ? 1 : 0) + (minPay ? 1 : 0) + (remoteOnly ? 1 : 0) + tags.size + (sort === 'pay' ? 1 : 0);
  return (
    <div className={`jb${filtersOpen ? ' filters-open' : ''}${scope ? ' jb-scoped' : ''}`}>
      <div className="jb-stick">
      <div className="jb-searchband">
        <svg className="jb-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M16 16l5 5" /></svg>
        <input
          className="jb-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={scope ? `Search ${scope.title.toLowerCase()} roles` : 'Role, company, place, or skillset'}
          aria-label={scope ? `Search ${scope.title} listings` : 'Search all listings'}
          autoComplete="off"
        />
        <span className="lbl jb-count">{all === null ? 'loading' : `${results.length.toLocaleString()} roles`}</span>
        {scope && <Link href={scope.showAllHref ?? '/jobs'} className="jb-showall">{scope.showAllLabel ?? 'Show all jobs'}</Link>}
      </div>
      {!pristine && (
        <div className="jb-active" aria-label="Active filters">
          {needle && <button type="button" className="jb-pill" onClick={() => { setQ(''); setNeedle(''); }}>&ldquo;{needle}&rdquo;<span className="jb-x">&times;</span></button>}
          {field && <button type="button" className="jb-pill" onClick={() => setField('')}>{field}<span className="jb-x">&times;</span></button>}
          {region && <button type="button" className="jb-pill" onClick={() => setRegion('')}>{REGION_META[region as RegionKey]?.name.replace(/^the /, '')}<span className="jb-x">&times;</span></button>}
          {cty && <button type="button" className="jb-pill" onClick={() => setCty('')}>{countryName(cty)}<span className="jb-x">&times;</span></button>}
          {minPay > 0 && <button type="button" className="jb-pill" onClick={() => setMinPay(0)}>${minPay}k and up<span className="jb-x">&times;</span></button>}
          {remoteOnly && <button type="button" className="jb-pill" onClick={() => setRemoteOnly(false)}>Remote<span className="jb-x">&times;</span></button>}
          {TAGS.filter((t) => tags.has(t.code)).map((t) => (
            <button key={t.code} type="button" className="jb-pill" onClick={() => toggleTag(t.code)}>{t.label}<span className="jb-x">&times;</span></button>
          ))}
          {sort === 'pay' && <button type="button" className="jb-pill" onClick={() => setSort('new')}>Highest pay<span className="jb-x">&times;</span></button>}
          <button type="button" className="jb-clear lbl" onClick={() => { setQ(''); setNeedle(''); setField(''); setCty(''); setRegion(''); setMinPay(0); setRemoteOnly(false); setTags(new Set()); setSort('new'); }}>Clear all</button>
        </div>
      )}
      <button type="button" className="jb-mtoggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((v) => !v)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 6h18M7 12h10M11 18h2" /></svg>
        <span>Filters &amp; sort{activeCount > 0 ? ` · ${activeCount} on` : ''}</span>
        <span className="jb-mcount">{all === null ? '' : `${results.length.toLocaleString()} roles`}</span>
        <svg className="jb-mchev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <div className="jb-filters">
        {!scope?.occ && (
          <select aria-label="Field" value={field} onChange={(e) => setField(e.target.value)}>
            <option value="">All fields</option>
            {fieldNames.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        )}
        <select aria-label="Region" value={region} onChange={(e) => { const v = e.target.value; setRegion(v); if (v) setCty(''); }}>
          <option value="">All regions</option>
          {regionsList.map((x) => <option key={x.key} value={x.key}>{REGION_META[x.key].name.replace(/^the /, '')} ({x.n})</option>)}
        </select>
        <select aria-label="Country" value={cty} onChange={(e) => { const v = e.target.value; setCty(v); if (v) setRegion(''); }}>
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
        <div className="jb-tagdd" ref={tagRef}>
          <button type="button" className={`jb-toggle jb-tagbtn${tags.size ? ' on' : ''}`} aria-expanded={tagsOpen} aria-haspopup="true" onClick={() => setTagsOpen((v) => !v)}>
            Tags{tags.size > 0 ? ` · ${tags.size}` : ''}
            <svg className="jb-tagchev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          {tagsOpen && (
            <div className="jb-tagmenu" role="group" aria-label="Filter tags">
              {TAGS.map((t) => (
                <button key={t.code} type="button" className={`jb-chip${tags.has(t.code) ? ' on' : ''}`} aria-pressed={tags.has(t.code)} onClick={() => toggleTag(t.code)}>
                  {t.label}{all !== null && <span className="jb-chip-n">{tagCount[t.code]}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
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
