'use client';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { JobCard, type Job } from './JobCard';
import JobSheet from './JobSheet';
import JobPanel from './JobPanel';
import FilterSheet, { type Filters, type SkillEntry, srcGroup, SRC_GROUPS } from './FilterSheet';
import type { BenefitEntry } from './BenefitStrip';
import { countryName } from './countries';
import { regionOf, REGION_META, type RegionKey } from './regions';

/* The global board: one search over every listing, and one filter sheet
   (FilterSheet.tsx, docs/26) instead of a bar of dropdowns. The bar keeps only
   what is used constantly: search, the Filters button with a live count, and
   sort. Everything the sheet sets shows as removable pills under the band, and
   the whole state stays in the URL, so a filtered board is shareable.

   Scoped mode (an occupation page, e.g. /jobs/architect): the same bar, seeded
   with that occupation's SSR'd listings (so the HTML is crawlable) and the live
   employer layer for that occupation, plus a "Show all jobs" link back here. */

const PAGE = 60;
const TAG_LABEL: Record<string, string> = { s: 'Senior', e: 'Entry', '4d': '4-day week', eq: 'Equity', vi: 'Visa sponsor' };
const FRESH_LABEL: Record<string, string> = { d: 'Last 24h', w: 'This week', m: 'This month' };
const FRESH_MS: Record<string, number> = { d: 864e5, w: 7 * 864e5, m: 30 * 864e5 };

const EMPTY: Filters = {
  fieldSet: new Set(), region: '', ctySet: new Set(), remoteOnly: false,
  minPay: 0, hasSalary: false, tags: new Set(), fresh: '', srcSet: new Set(), lic: '',
  skillSet: new Set(),
};

export default function JobsBrowse({ fields, titles, search, featured, initialJobs, scope, v2, hero }: {
  fields: Record<string, string>;   // occ slug -> field
  titles: Record<string, string>;   // occ slug -> display title
  search: Record<string, string>;   // occ slug -> expansion text (title + field + taxonomy synonyms)
  featured?: ReactNode;             // the featured ledger, shown while the board is unfiltered
  initialJobs?: Job[];              // scoped mode: this occupation's listings, rendered server-side
  scope?: { occ?: string; title: string; showAllHref?: string; showAllLabel?: string };
  v2?: boolean;                     // full workspace layout (rail + lab chrome); /jobs only for now
  hero?: ReactNode;                 // meta line + H1, rendered inside the center column
}) {
  const [all, setAll] = useState<Job[] | null>(initialJobs ?? null);
  const [q, setQ] = useState('');
  const [needle, setNeedle] = useState('');
  const [f, setF] = useState<Filters>(EMPTY);
  const [sort, setSort] = useState<'new' | 'pay'>('new');
  const [locQ, setLocQ] = useState('');       // the search unit's Location cell
  const [sheetOpen, setSheetOpen] = useState(false);
  const [licensed, setLicensed] = useState<Set<string> | null>(null); // occ slugs with a license gate
  const [skills, setSkills] = useState<SkillEntry[] | null>(null);     // the glossary: skill -> occupations it unlocks
  const [benefits, setBenefits] = useState<BenefitEntry[] | null>(null); // the benefit bank, for the pane's pills
  const [shown, setShown] = useState(PAGE);
  const [page, setPage] = useState(1);          // v2: windowed pages behind the circle pager
  const [now] = useState(() => Date.now());
  const [sheetJob, setSheetJob] = useState<Job | null>(null);
  const [panelJob, setPanelJob] = useState<Job | null>(null);
  const allRef = useRef<Job[] | null>(null);
  allRef.current = all;

  const set = (patch: Partial<Filters>) => setF((prev) => ({ ...prev, ...patch }));
  // Visitor country, from the proxy's ph-cc cookie. Read client-side only, so
  // the prerendered HTML stays byte-identical for crawlers (docs/32).
  const [geoCC, setGeoCC] = useState('');
  // ---------- search typeahead (the landing instrument's pattern, docs/26) ----------
  // Suggest occupations (with their live count on this board) and skills (which
  // plug into the existing skillSet filter). Free-text search stays the default:
  // suggestions are an offer, Enter without a highlight searches the words typed.
  const [taOpen, setTaOpen] = useState(false);
  const [taIdx, setTaIdx] = useState(-1);
  const occCounts = useMemo(() => {
    const m = new Map<string, number>();
    if (all) for (const j of all) m.set(j.occ, (m.get(j.occ) ?? 0) + 1);
    return m;
  }, [all]);
  const taItems = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [] as { kind: 'occ' | 'skill'; slug: string; label: string; via?: string }[];
    const wordStart = (text: string, needle: string) => text.split(/[\s/&,-]+/).some((w) => w.startsWith(needle));
    // occupations: rank title word-starts first, then synonym hits from the
    // expansion text; same ladder as the landing typeahead
    const occs = Object.entries(titles)
      .filter(([slug]) => slug !== scope?.occ)
      .map(([slug, title]) => {
        const t = title.toLowerCase();
        let rank: number | null = null; let via: string | undefined;
        if (t.startsWith(query)) rank = 0;
        else if (wordStart(t, query)) rank = 1;
        else {
          const syn = (search[slug] ?? '').toLowerCase();
          const hit = syn.replace(t, '').split(/[\s/&,-]+/).find((w) => w.length > 2 && w.startsWith(query));
          if (hit) { rank = 2; via = hit; }        // show WHY it matched, or it reads as a bug
          else if (t.includes(query)) rank = 3;
        }
        if (rank == null) return null;
        const n = occCounts.get(slug) ?? 0;
        if (!n) return null;                       // never suggest an empty board
        return { slug, title, rank, n, via };
      })
      .filter((x): x is NonNullable<typeof x> => !!x)
      .sort((a, b) => a.rank - b.rank || b.n - a.n)
      .slice(0, 5)
      .map((x) => ({ kind: 'occ' as const, slug: x.slug, label: x.title, via: x.via }));
    // skills: word-start on the term; picking one applies the existing filter
    const sk = (skills ?? [])
      .filter((e) => !f.skillSet.has(e.slug) && (e.term.toLowerCase().startsWith(query) || wordStart(e.term.toLowerCase(), query)))
      .sort((a, b) => (b.unlocks?.length ?? 0) - (a.unlocks?.length ?? 0))
      .slice(0, 3)
      .map((e) => ({ kind: 'skill' as const, slug: e.slug, label: e.term, via: undefined as string | undefined }));
    return [...occs, ...sk];
  }, [q, titles, search, occCounts, skills, f.skillSet, scope]);
  const pickTa = (item: { kind: 'occ' | 'skill'; slug: string; label: string }) => {
    setTaOpen(false); setTaIdx(-1);
    if (item.kind === 'occ') { setQ(item.label); setNeedle(item.label); return; }
    setQ(''); setNeedle('');
    set({ skillSet: new Set([...f.skillSet, item.slug]) });
  };
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const m = document.cookie.match(/(?:^|; )ph-cc=([A-Z]{2})/);
    if (m && !localStorage.getItem('ph-cc-dismissed')) setGeoCC(m[1]);
  }, []);

  // Load the corpus once, and read any shared filter state from the URL.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setQ(p.get('q') ?? ''); setNeedle((p.get('q') ?? '').toLowerCase());
    const t = new Set((p.get('t') ?? '').split(',').filter(Boolean));
    // legacy: the old 'new this week' lived in t; it is a freshness setting now
    const fresh = (p.get('fresh') ?? (t.has('new') ? 'w' : '')) as Filters['fresh'];
    t.delete('new');
    setF({
      fieldSet: new Set((p.get('f') ?? '').split(',').filter(Boolean)),
      region: p.get('region') ?? '',
      ctySet: new Set((p.get('c') ?? '').split(',').filter(Boolean)),
      remoteOnly: p.get('r') === '1',
      minPay: Number(p.get('pay')) || 0,
      hasSalary: p.get('sal') === '1',
      tags: t,
      fresh: ['d', 'w', 'm'].includes(fresh) ? fresh : '',
      srcSet: new Set((p.get('src') ?? '').split(',').filter(Boolean)),
      lic: p.get('lic') === 'open' || p.get('lic') === 'gated' ? (p.get('lic') as 'open' | 'gated') : '',
      skillSet: new Set((p.get('sk') ?? '').split(',').filter(Boolean)),
    });
    if (p.get('sort') === 'pay') setSort('pay');
    // the license registry is small and powers the license filter
    fetch('/data/license-sheet.json').then((r) => r.json())
      .then((d: Record<string, unknown>) => setLicensed(new Set(Object.keys(d))))
      .catch(() => setLicensed(new Set()));
    // the skill lexicon drifts nightly; always read it, never hardcode its size
    fetch('/data/skills-glossary.json').then((r) => r.json())
      .then((d: SkillEntry[]) => setSkills(d))
      .catch(() => setSkills([]));
    fetch('/data/benefits-glossary.json').then((r) => r.json())
      .then((d: BenefitEntry[]) => setBenefits(d))
      .catch(() => setBenefits([]));
    if (scope?.occ) {
      fetch('/api/employer-jobs').then((r) => r.json()).catch(() => [])
        .then((employer: Job[]) => {
          const mine = (employer || []).filter((j) => j.occ === scope.occ);
          if (mine.length) setAll((prev) => [...mine, ...(prev ?? initialJobs ?? [])]);
        });
    } else if (scope) {
      // category page: the capped SSR sample is the corpus
    } else {
      Promise.all([
        fetch('/data/all-jobs.json').then((r) => r.json()).catch(() => []),
        fetch('/api/employer-jobs').then((r) => r.json()).catch(() => []),
      ]).then(([scraped, employer]: [Job[], Job[]]) => setAll([...(employer || []), ...(scraped || [])]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intercept a card click and open the listing in place: the bottom sheet on
  // phones, the split pane on desktop. Either way the listing URL is pushed so
  // the address bar, Back, refresh and sharing all behave as if it were a page.
  // While the pane is open, a second pick replaces the entry instead of
  // pushing, so Back always returns to the board in one step.
  useEffect(() => {
    const isPhone = () => window.matchMedia('(max-width: 760px)').matches;
    const openJob = (j: Job, href: string) => {
      if (isPhone()) { history.pushState({ jobSheet: true }, '', href); setSheetJob(j); return; }
      if (history.state?.jobSheet) history.replaceState({ jobSheet: true }, '', href);
      else history.pushState({ jobSheet: true }, '', href);
      setPanelJob(j);
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement)?.closest?.('a.job-card, a.feat-row') as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute('href') || '';
      const m = /^\/jobs\/([a-z0-9-]+)\/([a-z0-9]+)$/.exec(href);
      if (!m) return;
      e.preventDefault();
      e.stopPropagation();
      const inState = (allRef.current ?? []).find((j) => j.occ === m[1] && j.id === m[2]);
      if (inState) { openJob(inState, href); return; }
      void (async () => {
        try {
          const r = await fetch('/data/featured-jobs.json');
          const feat: Job[] = r.ok ? await r.json() : [];
          const hit = feat.find((j) => j.occ === m[1] && j.id === m[2]);
          if (hit) { openJob(hit, href); return; }
        } catch { /* fall through */ }
        window.location.href = href;
      })();
    };
    const onPop = () => { setSheetJob(null); setPanelJob(null); };
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPop);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPop);
    };
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
    if (f.fieldSet.size) p.set('f', [...f.fieldSet].join(','));
    if (f.ctySet.size) p.set('c', [...f.ctySet].join(','));
    if (f.region) p.set('region', f.region);
    if (f.remoteOnly) p.set('r', '1');
    if (f.minPay) p.set('pay', String(f.minPay));
    if (f.hasSalary) p.set('sal', '1');
    if (f.tags.size) p.set('t', [...f.tags].join(','));
    if (f.fresh) p.set('fresh', f.fresh);
    if (f.srcSet.size) p.set('src', [...f.srcSet].join(','));
    if (f.lic) p.set('lic', f.lic);
    if (f.skillSet.size) p.set('sk', [...f.skillSet].join(','));
    if (sort === 'pay') p.set('sort', 'pay');
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
    setShown(PAGE);
    setPage(1);
  }, [needle, locQ, f, sort, all]);

  const fieldNames = useMemo(() => [...new Set(Object.values(fields))].sort(), [fields]);
  const skillOccs = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const sk of skills ?? []) m.set(sk.slug, new Set(sk.unlocks.map((u) => u.slug)));
    return m;
  }, [skills]);
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

  // Precompute each job's haystack once.
  const hays = useMemo(() => {
    if (!all) return new Map<string, { text: string; words: string[] }>();
    const m = new Map<string, { text: string; words: string[] }>();
    for (const j of all) {
      const text = `${j.title} ${j.company} ${j.location} ${search[j.occ] ?? titles[j.occ] ?? ''}`.toLowerCase();
      m.set(j.id, { text, words: text.split(/[^a-z0-9+#]+/).filter((w) => w.length >= 4) });
    }
    return m;
  }, [all, search, titles]);

  const tokenHit = (h: { text: string; words: string[] }, tok: string) => {
    if (h.text.includes(tok)) return true;
    if (tok.length < 4) return false;
    return h.words.some((w) => w.startsWith(tok) || tok.startsWith(w));
  };

  // One filter pass used for results AND for the sheet's faceted counts.
  // `omit` drops one category so its own options can be counted honestly.
  const applyFilters = useMemo(() => {
    return (spec: Filters, omit?: string) => {
      if (!all) return [] as Job[];
      let r = all;
      if (needle) {
        const toks = needle.split(/\s+/).filter(Boolean);
        r = r.filter((j) => {
          const h = hays.get(j.id);
          return h ? toks.every((t) => tokenHit(h, t)) : false;
        });
      }
      const locNeedle = locQ.trim().toLowerCase();
      if (locNeedle.length >= 2) {
        r = r.filter((j) => (j.location || '').toLowerCase().includes(locNeedle)
          || (j.c ? countryName(j.c).toLowerCase().includes(locNeedle) : false));
      }
      if (omit !== 'field' && spec.fieldSet.size) r = r.filter((j) => spec.fieldSet.has(fields[j.occ]));
      if (omit !== 'location') {
        if (spec.region) r = r.filter((j) => regionOf(j.c) === spec.region);
        if (spec.ctySet.size) r = r.filter((j) => !!j.c && spec.ctySet.has(j.c));
        if (spec.remoteOnly) r = r.filter((j) => j.remote);
      }
      if (omit !== 'pay') {
        if (spec.minPay) r = r.filter((j) => (j.smax ?? j.smin ?? 0) >= spec.minPay * 1000);
        if (spec.hasSalary) r = r.filter((j) => !!(j.smin || j.smax));
      }
      if (omit !== 'seniority' && omit !== 'perks' && spec.tags.size) {
        for (const t of spec.tags) {
          if (t === 's' || t === 'e') r = r.filter((j) => j.lv === t);
          else r = r.filter((j) => !!j.fl?.includes(t));
        }
      }
      if ((omit === 'seniority' || omit === 'perks') && spec.tags.size) {
        // keep the OTHER tag family's filters while counting this one's options
        const keep = omit === 'seniority' ? ['4d', 'eq', 'vi'] : ['s', 'e'];
        for (const t of spec.tags) {
          if (!keep.includes(t)) continue;
          if (t === 's' || t === 'e') r = r.filter((j) => j.lv === t);
          else r = r.filter((j) => !!j.fl?.includes(t));
        }
      }
      if (omit !== 'fresh' && spec.fresh) r = r.filter((j) => !!j.posted && now - new Date(j.posted).getTime() < FRESH_MS[spec.fresh]);
      if (omit !== 'source' && spec.srcSet.size) r = r.filter((j) => spec.srcSet.has(srcGroup(j.source)));
      if (omit !== 'license' && spec.lic && licensed) {
        r = spec.lic === 'gated' ? r.filter((j) => licensed.has(j.occ)) : r.filter((j) => !licensed.has(j.occ));
      }
      if (omit !== 'skills' && spec.skillSet.size && skillOccs.size) {
        const reach = new Set<string>();
        for (const sk of spec.skillSet) for (const occ of skillOccs.get(sk) ?? []) reach.add(occ);
        r = r.filter((j) => reach.has(j.occ));
      }
      return r;
    };
  }, [all, needle, locQ, hays, fields, now, licensed, skillOccs]);

  const results = useMemo(() => {
    let r = applyFilters(f);
    if (sort === 'pay') r = [...r].sort((a, b) => (b.smax ?? b.smin ?? 0) - (a.smax ?? a.smin ?? 0));
    return r;
  }, [applyFilters, f, sort]);

  // Faceted count for the sheet: the category's own filter is stripped, the
  // probe stands in for the option being counted, every other filter applies.
  const count = useMemo(() => {
    return (cat: string, probe: Partial<Filters>) => applyFilters({ ...strip(f, cat), ...probe }).length;
    function strip(base: Filters, cat: string): Filters {
      // strip the category's own filter, the probe re-adds its single option
      const c: Filters = { ...base, fieldSet: new Set(base.fieldSet), ctySet: new Set(base.ctySet), tags: new Set(base.tags), srcSet: new Set(base.srcSet), skillSet: new Set(base.skillSet) };
      if (cat === 'field') c.fieldSet = new Set();
      if (cat === 'location') { c.region = ''; c.ctySet = new Set(); c.remoteOnly = false; }
      if (cat === 'pay') { c.minPay = 0; c.hasSalary = false; }
      if (cat === 'seniority') c.tags = new Set([...c.tags].filter((t) => t !== 's' && t !== 'e'));
      if (cat === 'perks') c.tags = new Set([...c.tags].filter((t) => t === 's' || t === 'e'));
      if (cat === 'fresh') c.fresh = '';
      if (cat === 'source') c.srcSet = new Set();
      if (cat === 'license') c.lic = '';
      if (cat === 'skills') c.skillSet = new Set();
      return c;
    }
  }, [applyFilters, f]);

  // Rail facet counts: every filter except field applied, then counted by field.
  const fieldCounts = useMemo(() => {
    const base = applyFilters(f, 'field');
    const m = new Map<string, number>();
    for (const j of base) { const fl = fields[j.occ]; if (fl) m.set(fl, (m.get(fl) ?? 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [applyFilters, f, fields]);

  const pristine = !needle && !locQ.trim() && !f.fieldSet.size && !f.ctySet.size && !f.region && !f.remoteOnly && !f.minPay && !f.hasSalary && !f.tags.size && !f.fresh && !f.srcSet.size && !f.lic && !f.skillSet.size && sort === 'new';
  const activeCount = f.fieldSet.size + f.ctySet.size + (f.region ? 1 : 0) + (f.minPay ? 1 : 0) + (f.hasSalary ? 1 : 0) + (f.remoteOnly ? 1 : 0) + f.tags.size + (f.fresh ? 1 : 0) + f.srcSet.size + (f.lic ? 1 : 0) + f.skillSet.size;
  const closeSheet = () => { if (history.state?.jobSheet) history.back(); else setSheetJob(null); };
  const closePanel = () => { if (history.state?.jobSheet) history.back(); else setPanelJob(null); };
  // Pager for the v2 inspector: position within the filtered results, and a
  // stepper that swaps the pane while keeping the URL contract (replace, so
  // Back still returns to the board in one step).
  // v2 pagination: a window of PAGE rows behind the lab's circle pager.
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE));
  const curPage = Math.min(page, pageCount);
  const goPage = (n: number) => {
    const to = Math.min(Math.max(1, n), pageCount);
    setPage(to);
    requestAnimationFrame(() => {
      const el = document.querySelector('.jb-thead') ?? document.querySelector('.job-list-full');
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - 120;
      if (Math.abs(window.scrollY - y) > 2) window.scrollTo({ top: Math.max(0, y) });
    });
  };
  const panelIdx = panelJob ? results.findIndex((x) => x.id === panelJob.id && x.occ === panelJob.occ) : -1;
  const stepPanel = (d: number) => {
    if (panelIdx < 0) return;
    const nx = results[panelIdx + d];
    if (!nx) return;
    const href = `/jobs/${nx.occ}/${nx.id}`;
    if (history.state?.jobSheet) history.replaceState({ jobSheet: true }, '', href);
    else history.pushState({ jobSheet: true }, '', href);
    setPanelJob(nx);
  };
  const dropFrom = (key: 'fieldSet' | 'ctySet' | 'tags' | 'srcSet', v: string) => {
    const next = new Set(f[key]);
    next.delete(v);
    set({ [key]: next } as Partial<Filters>);
  };

  return (
    <div className={`jb${scope ? ' jb-scoped' : ''}`}>
      <div className={v2 ? 'jb-work' : undefined}>
      {v2 && (() => {
        const sec = (i: number) => String(fieldCounts.length > 1 ? i : i - 1).padStart(2, '0');
        return (
        <aside className="jb-rail" aria-label="Filters">
          <div className="jb-rail-head"><h4>Filters</h4>
            <button type="button" className="jb-rail-clear" onClick={() => { setQ(''); setNeedle(''); setLocQ(''); setF(EMPTY); setSort('new'); }}>Clear all</button>
          </div>
          {fieldCounts.length > 1 && (
          <section>
            <h5><i>01</i>Field</h5>
            {fieldCounts.map(([fl, n]) => (
              <div className="jb-opt" key={fl}>
                <label>
                  <input type="checkbox" checked={f.fieldSet.has(fl)} onChange={() => {
                    const next = new Set(f.fieldSet);
                    if (next.has(fl)) next.delete(fl); else next.add(fl);
                    set({ fieldSet: next });
                  }} /> {fl}
                </label>
                <span className="jb-opt-n">{n.toLocaleString()}</span>
              </div>
            ))}
          </section>
          )}
          <section>
            <h5><i>{sec(2)}</i>Workplace</h5>
            <div className="jb-opt"><label><input type="checkbox" checked={f.remoteOnly} onChange={() => set({ remoteOnly: !f.remoteOnly })} /> Remote only</label></div>
          </section>
          <section>
            <h5><i>{sec(3)}</i>Pay</h5>
            <div className="jb-opt"><label><input type="checkbox" checked={f.hasSalary} onChange={() => set({ hasSalary: !f.hasSalary })} /> States a salary</label></div>
          </section>
          <section>
            <h5><i>{sec(4)}</i>Freshness</h5>
            {([['', 'Any time'], ['d', 'Last 24h'], ['w', 'This week'], ['m', 'This month']] as const).map(([k, label]) => (
              <div className="jb-opt" key={k || 'any'}>
                <label><input type="radio" name="jb-fresh" checked={f.fresh === k} onChange={() => set({ fresh: k })} /> {label}</label>
              </div>
            ))}
          </section>
          <button type="button" className="jb-rail-all" onClick={() => setSheetOpen(true)}>
            All filters{activeCount > 0 ? ` · ${activeCount}` : ''}
          </button>
          <div className="jb-rail-close">
            <div className="jb-rail-big">{all === null ? '·' : results.length.toLocaleString()}</div>
            <div className="jb-rail-lab">roles in this view</div>
          </div>
        </aside>
        );
      })()}
      <div className={v2 ? 'jb-centercol' : undefined}>
      {v2 && hero}

      <div className="jb-stick">
      <div className="jb-searchband">
        <svg className="jb-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M16 16l5 5" /></svg>
        <input
          className="jb-search"
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setTaOpen(true); setTaIdx(-1); }}
          onFocus={() => setTaOpen(true)}
          onBlur={() => setTimeout(() => setTaOpen(false), 140)}
          onKeyDown={(e) => {
            if (!taOpen || !taItems.length) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); setTaIdx((i) => (i + 1) % taItems.length); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setTaIdx((i) => (i - 1 + taItems.length) % taItems.length); }
            else if (e.key === 'Enter' && taIdx >= 0) { e.preventDefault(); pickTa(taItems[taIdx]); }
            else if (e.key === 'Escape') { setTaOpen(false); setTaIdx(-1); }
          }}
          placeholder={scope ? `Search ${scope.title.toLowerCase()} roles` : 'Role, company, place, or skillset'}
          aria-label={scope ? `Search ${scope.title} listings` : 'Search all listings'}
          aria-expanded={taOpen && taItems.length > 0}
          aria-autocomplete="list"
          role="combobox"
          autoComplete="off"
        />
        {taOpen && taItems.length > 0 && (
          <div className="jb-ta" role="listbox" aria-label="Search suggestions">
            {taItems.map((it, i) => (
              <button
                key={`${it.kind}:${it.slug}`}
                type="button"
                role="option"
                aria-selected={i === taIdx}
                className={`jb-ta-item${i === taIdx ? ' hi' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); pickTa(it); }}
                onMouseEnter={() => setTaIdx(i)}
              >
                <span className="jb-ta-label">
                  {it.via && <span className="jb-ta-via lbl">{it.via} &rarr; </span>}
                  {(() => {
                    const query = q.trim().toLowerCase();
                    const text = it.kind === 'skill' ? `+ ${it.label}` : it.label;
                    const at = text.toLowerCase().indexOf(query);
                    if (at < 0 || !query) return text;
                    return (<>
                      {text.slice(0, at)}
                      <span className="jb-ta-m">{text.slice(at, at + query.length)}</span>
                      {text.slice(at + query.length)}
                    </>);
                  })()}
                </span>
                {it.kind === 'skill' && <span className="jb-ta-sub lbl">skill</span>}
              </button>
            ))}
          </div>
        )}
        {v2 && (
          <input
            className="jb-locin"
            type="search"
            value={locQ}
            onChange={(e) => setLocQ(e.target.value)}
            placeholder="Location"
            aria-label="Filter by location"
            autoComplete="off"
          />
        )}
        <button type="button" className={`jb-fltbtn${activeCount ? ' on' : ''}`} onClick={() => setSheetOpen(true)}>
          {v2
            ? <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" /></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 6h18M7 12h10M11 18h2" /></svg>}
          Filters{activeCount > 0 && <span className="jb-fltn">{activeCount}</span>}
        </button>
        {scope && <Link href={scope.showAllHref ?? '/jobs'} className="jb-showall">{scope.showAllLabel ?? 'Show all jobs'}</Link>}
      </div>
      {geoCC && !f.ctySet.size && !f.region && (() => {
        const mine = countries.find((c) => c.code === geoCC);
        if (!mine || mine.n < 3 || mine.n === (all?.length ?? 0)) return null;
        return (
          /* Supply skews to wherever the sources are richest, which is rarely
             where the reader is standing. Offer their country; never apply it. */
          <div className="jb-active jb-geo-row">
            <button type="button" className="jb-pill jb-pill-geo" onClick={() => set({ ctySet: new Set([geoCC]) })}>
              Show {mine.n.toLocaleString()} in {countryName(geoCC)}
            </button>
            <button
              type="button"
              className="jb-geo-x"
              aria-label="Dismiss country suggestion"
              onClick={() => { localStorage.setItem('ph-cc-dismissed', '1'); setGeoCC(''); }}
            >&times;</button>
          </div>
        );
      })()}
      {!pristine && (
        <div className="jb-active" aria-label="Active filters">
          {needle && <button type="button" className="jb-pill" onClick={() => { setQ(''); setNeedle(''); }}>&ldquo;{needle}&rdquo;<span className="jb-x">&times;</span></button>}

          {f.skillSet.size > 0 && (
            /* one pill for the whole skill selection: the list can be long, and
               the sheet is where individual skills are managed */
            <button type="button" className="jb-pill jb-pill-skills" onClick={() => setSheetOpen(true)}>
              Skills &middot; {f.skillSet.size}<span className="jb-x" onClick={(e) => { e.stopPropagation(); set({ skillSet: new Set() }); }}>&times;</span>
            </button>
          )}
          {[...f.fieldSet].map((x) => <button key={x} type="button" className="jb-pill" onClick={() => dropFrom('fieldSet', x)}>{x}<span className="jb-x">&times;</span></button>)}
          {f.region && <button type="button" className="jb-pill" onClick={() => set({ region: '' })}>{REGION_META[f.region as RegionKey]?.name.replace(/^the /, '')}<span className="jb-x">&times;</span></button>}
          {[...f.ctySet].map((x) => <button key={x} type="button" className="jb-pill" onClick={() => dropFrom('ctySet', x)}>{countryName(x)}<span className="jb-x">&times;</span></button>)}
          {f.minPay > 0 && <button type="button" className="jb-pill" onClick={() => set({ minPay: 0 })}>${f.minPay}k and up<span className="jb-x">&times;</span></button>}
          {f.hasSalary && <button type="button" className="jb-pill" onClick={() => set({ hasSalary: false })}>States a salary<span className="jb-x">&times;</span></button>}
          {f.remoteOnly && <button type="button" className="jb-pill" onClick={() => set({ remoteOnly: false })}>Remote<span className="jb-x">&times;</span></button>}
          {[...f.tags].map((t) => <button key={t} type="button" className="jb-pill" onClick={() => dropFrom('tags', t)}>{TAG_LABEL[t] ?? t}<span className="jb-x">&times;</span></button>)}
          {f.fresh && <button type="button" className="jb-pill" onClick={() => set({ fresh: '' })}>{FRESH_LABEL[f.fresh]}<span className="jb-x">&times;</span></button>}
          {[...f.srcSet].map((s) => <button key={s} type="button" className="jb-pill" onClick={() => dropFrom('srcSet', s)}>{SRC_GROUPS.find((g) => g.code === s)?.label ?? s}<span className="jb-x">&times;</span></button>)}
          {f.lic && <button type="button" className="jb-pill" onClick={() => set({ lic: '' })}>{f.lic === 'gated' ? 'Licensed professions' : 'No license required'}<span className="jb-x">&times;</span></button>}
          {sort === 'pay' && <button type="button" className="jb-pill" onClick={() => setSort('new')}>Highest pay<span className="jb-x">&times;</span></button>}
          <button type="button" className="jb-clear lbl" onClick={() => { setQ(''); setNeedle(''); setLocQ(''); setF(EMPTY); setSort('new'); }}>Clear all</button>
        </div>
      )}
      </div>


      {pristine && !panelJob && featured}

      {all === null ? (
        <p className="rt-note jb-loading">Loading the board&hellip;</p>
      ) : (
        <>
          <div className={panelJob ? 'jb-splitwrap' : undefined}>
            <div className="jb-listcol">
              {pristine && panelJob ? featured : null}
              {v2 && (
                <div className="jb-thead" aria-hidden="true"><span /><span>Role</span><span>Salary</span><span>Posted</span><span /></div>
              )}
              <ul className="job-list job-list-full">
                {(v2 ? results.slice((curPage - 1) * PAGE, curPage * PAGE) : results.slice(0, shown)).map((j) => <JobCard key={j.id} j={j} selected={panelJob?.id === j.id} v2={v2} />)}
              </ul>
              {results.length === 0 && <p className="rt-note">Nothing matches. Clear a filter, or search fewer words.</p>}
              {v2 ? (pageCount > 1 && (() => {
                const seq: (number | 0)[] = pageCount <= 5
                  ? Array.from({ length: pageCount }, (_, i) => i + 1)
                  : curPage <= 3
                    ? [1, 2, 3, 0, pageCount]
                    : curPage >= pageCount - 2
                      ? [1, 0, pageCount - 2, pageCount - 1, pageCount]
                      : [1, 0, curPage, 0, pageCount];
                return (
                  <nav className="jb-pager" aria-label="Pages">
                    {seq.map((n, i) => n === 0
                      ? <span key={`d${i}`} className="jb-pg dots" aria-hidden="true">&hellip;</span>
                      : (
                        <button key={n} type="button" className={`jb-pg${n === curPage ? ' cur' : ''}`}
                          aria-current={n === curPage ? 'page' : undefined} onClick={() => goPage(n)}>{n}</button>
                      ))}
                    <button type="button" className="jb-pg fwd" aria-label="Next page" disabled={curPage >= pageCount} onClick={() => goPage(curPage + 1)}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                    </button>
                  </nav>
                );
              })()) : (results.length > shown && (
                <button type="button" className="jb-more" onClick={() => setShown((n) => n + PAGE)}>
                  Show {Math.min(PAGE, results.length - shown)} more &middot; {shown.toLocaleString()} of {results.length.toLocaleString()}
                </button>
              ))}
            </div>
            {panelJob && <JobPanel job={panelJob} onClose={closePanel} glossary={skills} benefitBank={benefits} v2={v2} occName={titles[panelJob.occ]} pos={panelIdx >= 0 ? { i: panelIdx, n: results.length } : null} onStep={stepPanel} />}
          </div>
        </>
      )}
      </div>
      </div>

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        f={f}
        set={set}
        count={(cat, probe) => count(cat, probe)}
        fieldNames={fieldNames}
        countries={countries}
        regionsList={regionsList}
        resultCount={results.length}
        hideField={!!scope?.occ}
        sort={sort}
        onSort={setSort}
        skills={skills ?? []}
      />
      <JobSheet job={sheetJob} onClose={closeSheet} glossary={skills} />
    </div>
  );
}
