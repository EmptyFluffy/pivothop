'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { countryName } from './countries';
import { REGION_META, type RegionKey } from './regions';

/* The filter sheet (docs/26: HiringCafe's one good interaction, on our design
   system). A category rail on the left, options with live counts on the right,
   a search box over the filter names, and one accent button that closes the
   sheet and shows the results. Same paper, veil, blur and in/out animation as
   the search and skill sheets — this is the first surface of the slow
   modernization pass, so the skin must stay the system's.

   Every option is computed from the posting data, never employer-self-tagged:
   provenance groups from `source`, flags from the description text, license
   gates from our own registry. Counts are faceted: each category's options are
   counted with every OTHER filter applied, so a number always answers "what
   would I get if I ticked this now". */

export type Filters = {
  fieldSet: Set<string>;
  region: string;
  ctySet: Set<string>;
  remoteOnly: boolean;
  minPay: number;
  hasSalary: boolean;
  tags: Set<string>;        // s e 4d eq vi
  fresh: '' | 'd' | 'w' | 'm';
  srcSet: Set<string>;      // studio federal ats boards
  lic: '' | 'open' | 'gated';
};

export const SRC_GROUPS: { code: string; label: string; sub: string }[] = [
  { code: 'studio', label: 'Studio careers pages', sub: 'read directly from firm websites; most appear on no other board' },
  { code: 'ats', label: 'Company ATS boards', sub: 'Greenhouse, Lever, Ashby and peers, straight from the employer' },
  { code: 'federal', label: 'Official portals', sub: 'USAJOBS and the Swiss federal Job-Room' },
  { code: 'boards', label: 'Remote job boards', sub: 'Himalayas, Arbeitnow and other re-display partners' },
];
export const srcGroup = (s: string): string =>
  s === 'direct' || s === 'personio' || s === 'workday' ? 'studio'
  : s === 'usajobs' || s === 'jobroom' ? 'federal'
  : ['greenhouse', 'lever', 'ashby', 'workable', 'recruitee', 'smartrecruiters'].includes(s) ? 'ats'
  : 'boards';

const PAY_STOPS = [50, 100, 150, 200] as const;
const FRESH: { code: Filters['fresh']; label: string }[] = [
  { code: 'd', label: 'Last 24 hours' },
  { code: 'w', label: 'This week' },
  { code: 'm', label: 'This month' },
];
const TAG_META: Record<string, string> = { s: 'Senior', e: 'Entry level', '4d': 'Four-day week', eq: 'Equity offered', vi: 'Visa sponsorship' };

type CatKey = 'field' | 'location' | 'seniority' | 'pay' | 'perks' | 'fresh' | 'source' | 'license' | 'sortby';

export default function FilterSheet({ open, onClose, f, set, count, fieldNames, countries, regionsList, resultCount, hideField, sort, onSort }: {
  open: boolean;
  onClose: () => void;
  f: Filters;
  set: (patch: Partial<Filters>) => void;
  /* count(category, probe) -> how many rows if `probe` replaced that category's filter */
  count: (cat: CatKey, probe: Partial<Filters>) => number;
  fieldNames: string[];
  countries: { code: string; n: number }[];
  regionsList: { key: RegionKey; n: number }[];
  resultCount: number;
  hideField?: boolean;
  sort: 'new' | 'pay';
  onSort: (s: 'new' | 'pay') => void;
}) {
  const [cat, setCat] = useState<CatKey>(hideField ? 'location' : 'field');
  const [closing, setClosing] = useState(false);
  const [needle, setNeedle] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const close = () => { setClosing(true); setTimeout(() => { setClosing(false); onClose(); }, 190); };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const activeIn: Record<CatKey, number> = {
    field: f.fieldSet.size,
    location: (f.region ? 1 : 0) + f.ctySet.size + (f.remoteOnly ? 1 : 0),
    seniority: ['s', 'e'].filter((t) => f.tags.has(t)).length,
    pay: (f.minPay ? 1 : 0) + (f.hasSalary ? 1 : 0),
    perks: ['4d', 'eq', 'vi'].filter((t) => f.tags.has(t)).length,
    fresh: f.fresh ? 1 : 0,
    source: f.srcSet.size,
    license: f.lic ? 1 : 0,
    sortby: sort === 'pay' ? 1 : 0,
  };

  const CATS: { key: CatKey; label: string }[] = useMemo(() => [
    ...(hideField ? [] : [{ key: 'field' as CatKey, label: 'Field' }]),
    { key: 'location', label: 'Location' },
    { key: 'seniority', label: 'Seniority' },
    { key: 'pay', label: 'Pay' },
    { key: 'perks', label: 'Perks & eligibility' },
    { key: 'fresh', label: 'Date posted' },
    { key: 'source', label: 'Where we read it' },
    { key: 'license', label: 'License gates' },
    { key: 'sortby', label: 'Sort' },
  ], [hideField]);

  // The filter-name search: jump the rail to the first category whose options
  // match, and highlight matching options in the pane.
  const match = (label: string) => !needle || label.toLowerCase().includes(needle.toLowerCase());
  useEffect(() => {
    if (!needle) return;
    const catOf: [CatKey, string[]][] = [
      ['field', fieldNames],
      ['location', ['remote', ...regionsList.map((r) => REGION_META[r.key].name), ...countries.map((c) => countryName(c.code))]],
      ['seniority', ['senior', 'entry']],
      ['pay', ['salary', ...PAY_STOPS.map((p) => `$${p}k`)]],
      ['perks', Object.values(TAG_META)],
      ['fresh', FRESH.map((x) => x.label)],
      ['source', SRC_GROUPS.map((s) => s.label)],
      ['license', ['license', 'no license required', 'licensed professions']],
      ['sortby', ['sort', 'newest first', 'highest pay']],
    ];
    const hit = catOf.find(([, labels]) => labels.some((l) => l.toLowerCase().includes(needle.toLowerCase())));
    if (hit && hit[0] !== cat && !(hideField && hit[0] === 'field')) setCat(hit[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needle]);

  if (!open && !closing) return null;

  const toggleIn = (key: 'fieldSet' | 'ctySet' | 'srcSet' | 'tags', v: string) => {
    const next = new Set(f[key] as Set<string>);
    if (next.has(v)) next.delete(v); else next.add(v);
    set({ [key]: next } as Partial<Filters>);
  };

  const Opt = ({ on, label, sub, n, onClick }: { on: boolean; label: string; sub?: string; n?: number; onClick: () => void }) => (
    match(label) ? (
      <button type="button" className={`flt-opt${on ? ' on' : ''}`} aria-pressed={on} onClick={onClick}>
        <span className="flt-box" aria-hidden="true">{on && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>}</span>
        <span className="flt-lab">{label}{sub && <span className="flt-sub">{sub}</span>}</span>
        {n !== undefined && <span className="flt-n">{n.toLocaleString()}</span>}
      </button>
    ) : null
  );

  return (
    <div className={`skmodal flt${closing ? ' closing' : ' open'}`} role="dialog" aria-modal="true" aria-label="Job filters">
      <div className="veil" onClick={close} />
      <div className="sksheet flt-sh" ref={panelRef} tabIndex={-1}>
        <div className="flt-head">
          <svg className="flt-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M16 16l5 5" /></svg>
          <input
            type="search"
            value={needle}
            onChange={(e) => setNeedle(e.target.value)}
            placeholder="Search filters"
            aria-label="Search filters"
            autoComplete="off"
          />
          <button className="xclose sk-close" aria-label="Close" onClick={close}>&times;</button>
        </div>
        <div className="flt-body">
          <nav className="flt-rail" aria-label="Filter categories">
            {CATS.map((c) => (
              <button key={c.key} type="button" className={`flt-cat${cat === c.key ? ' on' : ''}`} onClick={() => setCat(c.key)}>
                {c.label}
                {activeIn[c.key] > 0 && <span className="flt-badge">{activeIn[c.key]}</span>}
              </button>
            ))}
          </nav>
          <div className="flt-pane">
            {cat === 'field' && (
              <>
                <p className="flt-note">Fields group our occupations. Tick several to browse across them.</p>
                {fieldNames.map((name) => (
                  <Opt key={name} on={f.fieldSet.has(name)} label={name}
                    n={count('field', { fieldSet: new Set([name]) })}
                    onClick={() => toggleIn('fieldSet', name)} />
                ))}
              </>
            )}
            {cat === 'location' && (
              <>
                <Opt on={f.remoteOnly} label="Remote" sub="marked remote by the employer" n={count('location', { remoteOnly: true, region: '', ctySet: new Set() })} onClick={() => set({ remoteOnly: !f.remoteOnly })} />
                <div className="flt-group">Regions</div>
                {regionsList.map((r) => (
                  <Opt key={r.key} on={f.region === r.key} label={REGION_META[r.key].name.replace(/^the /, '')}
                    n={count('location', { region: r.key, ctySet: new Set(), remoteOnly: f.remoteOnly })}
                    onClick={() => set({ region: f.region === r.key ? '' : r.key, ctySet: new Set() })} />
                ))}
                <div className="flt-group">Countries</div>
                {countries.slice(0, 18).map((c) => (
                  <Opt key={c.code} on={f.ctySet.has(c.code)} label={countryName(c.code)}
                    n={count('location', { ctySet: new Set([c.code]), region: '', remoteOnly: f.remoteOnly })}
                    onClick={() => { toggleIn('ctySet', c.code); if (f.region) set({ region: '' }); }} />
                ))}
              </>
            )}
            {cat === 'seniority' && (
              <>
                <p className="flt-note">Read from the title. Postings that state neither stay visible unless you filter.</p>
                {(['s', 'e'] as const).map((t) => (
                  <Opt key={t} on={f.tags.has(t)} label={TAG_META[t]}
                    n={count('seniority', { tags: new Set<string>([...f.tags].filter((x) => x === '4d' || x === 'eq' || x === 'vi')).add(t) })}
                    onClick={() => toggleIn('tags', t)} />
                ))}
              </>
            )}
            {cat === 'pay' && (
              <>
                <Opt on={f.hasSalary} label="States a salary" sub="the number is in the posting, not 'competitive'"
                  n={count('pay', { hasSalary: true, minPay: f.minPay })}
                  onClick={() => set({ hasSalary: !f.hasSalary })} />
                <div className="flt-group">Minimum</div>
                {PAY_STOPS.map((p) => (
                  <Opt key={p} on={f.minPay === p} label={`$${p}k and up`}
                    n={count('pay', { minPay: p, hasSalary: f.hasSalary })}
                    onClick={() => set({ minPay: f.minPay === p ? 0 : p })} />
                ))}
              </>
            )}
            {cat === 'perks' && (
              <>
                <p className="flt-note">Derived from the posting text, never employer tags. Visa sponsorship only counts when it is offered, not merely mentioned.</p>
                {(['4d', 'eq', 'vi'] as const).map((t) => (
                  <Opt key={t} on={f.tags.has(t)} label={TAG_META[t]}
                    n={count('perks', { tags: new Set<string>([...f.tags].filter((x) => x === 's' || x === 'e')).add(t) })}
                    onClick={() => toggleIn('tags', t)} />
                ))}
              </>
            )}
            {cat === 'fresh' && FRESH.map((x) => (
              <Opt key={x.code} on={f.fresh === x.code} label={x.label}
                n={count('fresh', { fresh: x.code })}
                onClick={() => set({ fresh: f.fresh === x.code ? '' : x.code })} />
            ))}
            {cat === 'source' && (
              <>
                <p className="flt-note">Provenance, out loud. Every listing links back to where the employer posted it.</p>
                {SRC_GROUPS.map((s) => (
                  <Opt key={s.code} on={f.srcSet.has(s.code)} label={s.label} sub={s.sub}
                    n={count('source', { srcSet: new Set([s.code]) })}
                    onClick={() => toggleIn('srcSet', s.code)} />
                ))}
              </>
            )}
            {cat === 'sortby' && (
              <>
                <p className="flt-note">One order at a time. Highest pay puts the postings that state a number first.</p>
                <Opt on={sort === 'new'} label="Newest first" onClick={() => onSort('new')} />
                <Opt on={sort === 'pay'} label="Highest pay" onClick={() => onSort('pay')} />
              </>
            )}
            {cat === 'license' && (
              <>
                <p className="flt-note">From our license registry: professions where a state or federal credential gates the door.</p>
                <Opt on={f.lic === 'open'} label="No license required" n={count('license', { lic: 'open' })} onClick={() => set({ lic: f.lic === 'open' ? '' : 'open' })} />
                <Opt on={f.lic === 'gated'} label="Licensed professions" sub="see the gate on each card" n={count('license', { lic: 'gated' })} onClick={() => set({ lic: f.lic === 'gated' ? '' : 'gated' })} />
              </>
            )}
          </div>
        </div>
        <div className="flt-foot">
          <button type="button" className="flt-clear lbl" onClick={() => set({ fieldSet: new Set(), region: '', ctySet: new Set(), remoteOnly: false, minPay: 0, hasSalary: false, tags: new Set(), fresh: '', srcSet: new Set(), lic: '' })}>
            Clear all
          </button>
          <button type="button" className="flt-show" onClick={close}>
            Show {resultCount.toLocaleString()} roles
          </button>
        </div>
      </div>
    </div>
  );
}
