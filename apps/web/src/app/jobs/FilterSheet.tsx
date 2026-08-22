'use client';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { countryName } from './countries';
import { SkillMarkSvg } from './SkillMark';
import { BenefitMarkSvg, type BenefitEntry } from './BenefitStrip';
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

export type SkillEntry = {
  slug: string; term: string; field: string; def: string;
  unlocks: { slug: string; title: string; count: number }[];
};

export type Filters = {
  fieldSet: Set<string>;
  skillSet: Set<string>;
  region: string;
  ctySet: Set<string>;
  remoteOnly: boolean;
  minPay: number;
  hasSalary: boolean;
  tags: Set<string>;        // s e 4d eq vi
  fresh: '' | 'd' | 'w' | 'm';
  srcSet: Set<string>;      // studio federal ats boards
  lic: '' | 'open' | 'gated';
  benSet: Set<number>;      // benefit taxonomy indices; a role must STATE every ticked one
  xp: '' | 'none' | 'le2' | 'y35' | 'ge6';   // years-of-experience band, mined from the text
  edu: '' | 'nodeg' | 'waived';              // education gate, mined; 'waived' is the strong signal
  langNot: Set<string>;     // language codes the posting must NOT demand (de fr en...)
  exQ: Set<string>;         // exclude: title keywords
  exCo: Set<string>;        // exclude: companies, lowercased
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

function ExcludeInput({ placeholder, onAdd }: { placeholder: string; onAdd: (v: string) => void }) {
  const [v, setV] = useState('');
  return (
    <div className="flt-panesearch">
      <input value={v} placeholder={placeholder} aria-label={placeholder} autoComplete="off"
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && v.trim()) { onAdd(v.trim()); setV(''); } }} />
    </div>
  );
}

type CatKey = 'skills' | 'field' | 'location' | 'seniority' | 'pay' | 'benefits' | 'require' | 'perks' | 'fresh' | 'source' | 'exclude' | 'license' | 'sortby';

export default function FilterSheet({ open, onClose, f, set, count, fieldNames, countries, regionsList, resultCount, hideField, sort, onSort, skills, benefits, culprit, hiddenByExclusion }: {
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
  skills: SkillEntry[];
  benefits: BenefitEntry[];
  culprit: string | null;              // at zero results: which single filter to loosen, and what it returns
  hiddenByExclusion: number;           // rows the exclude facet is currently hiding
}) {
  const [cat, setCat] = useState<CatKey>('skills');
  const [skillQ, setSkillQ] = useState('');
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
    skills: f.skillSet.size,
    field: f.fieldSet.size,
    location: (f.region ? 1 : 0) + f.ctySet.size + (f.remoteOnly ? 1 : 0),
    seniority: ['s', 'e'].filter((t) => f.tags.has(t)).length,
    pay: (f.minPay ? 1 : 0) + (f.hasSalary ? 1 : 0),
    perks: ['4d', 'eq', 'vi'].filter((t) => f.tags.has(t)).length,
    fresh: f.fresh ? 1 : 0,
    source: f.srcSet.size,
    license: f.lic ? 1 : 0,
    sortby: sort === 'pay' ? 1 : 0,
    benefits: f.benSet.size,
    require: (f.xp ? 1 : 0) + (f.edu ? 1 : 0) + f.langNot.size,
    exclude: f.exQ.size + f.exCo.size,
  };

  const CATS: { key: CatKey; label: string }[] = useMemo(() => [
    { key: 'skills', label: 'Your skills' },
    ...(hideField ? [] : [{ key: 'field' as CatKey, label: 'Field' }]),
    { key: 'location', label: 'Location' },
    { key: 'seniority', label: 'Seniority' },
    { key: 'pay', label: 'Pay' },
    { key: 'benefits', label: 'Benefits' },
    { key: 'require', label: 'Requirements' },
    { key: 'perks', label: 'Perks & eligibility' },
    { key: 'fresh', label: 'Date posted' },
    { key: 'source', label: 'Where we read it' },
    { key: 'exclude', label: 'Exclude' },
    { key: 'license', label: 'License gates' },
    { key: 'sortby', label: 'Sort' },
  ], [hideField]);

  // The filter-name search: jump the rail to the first category whose options
  // match, and highlight matching options in the pane.
  const match = (label: string) => !needle || label.toLowerCase().includes(needle.toLowerCase());
  useEffect(() => {
    if (!needle) return;
    const catOf: [CatKey, string[]][] = [
      ['skills', skills.map((x) => x.term)],
      ['field', fieldNames],
      ['location', ['remote', ...regionsList.map((r) => REGION_META[r.key].name), ...countries.map((c) => countryName(c.code))]],
      ['seniority', ['senior', 'entry']],
      ['pay', ['salary', ...PAY_STOPS.map((p) => `$${p}k`)]],
      ['perks', Object.values(TAG_META)],
      ['fresh', FRESH.map((x) => x.label)],
      ['source', SRC_GROUPS.map((s) => s.label)],
      ['benefits', benefits.map((b) => b.term)],
      ['require', ['experience', 'years', 'degree', 'education', 'language', 'german', 'french']],
      ['exclude', ['exclude', 'hide', 'block']],
      ['license', ['license', 'no license required', 'licensed professions']],
      ['sortby', ['sort', 'newest first', 'highest pay']],
    ];
    const hit = catOf.find(([, labels]) => labels.some((l) => l.toLowerCase().includes(needle.toLowerCase())));
    if (hit && hit[0] !== cat && !(hideField && hit[0] === 'field')) setCat(hit[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needle]);

  const skillRows = useMemo(() => {
    const sel = skills.filter((x) => f.skillSet.has(x.slug));
    const ql = skillQ.trim().toLowerCase();
    let rest = skills.filter((x) => !f.skillSet.has(x.slug));
    if (ql) rest = rest.filter((x) => x.term.toLowerCase().includes(ql) || x.field.toLowerCase().includes(ql));
    else rest = [...rest].sort((a, b) => b.unlocks.reduce((s2, u) => s2 + u.count, 0) - a.unlocks.reduce((s2, u) => s2 + u.count, 0));
    return { sel, rest: rest.slice(0, 40), hidden: Math.max(0, rest.length - 40) };
  }, [skills, f.skillSet, skillQ]);

  if (!open && !closing) return null;

  const toggleIn = (key: 'fieldSet' | 'ctySet' | 'srcSet' | 'tags' | 'skillSet', v: string) => {
    const next = new Set(f[key] as Set<string>);
    if (next.has(v)) next.delete(v); else next.add(v);
    set({ [key]: next } as Partial<Filters>);
  };

  const Opt = ({ on, label, sub, n, mark, onClick }: { on: boolean; label: string; sub?: string; n?: number; mark?: ReactNode; onClick: () => void }) => (
    match(label) ? (
      <button type="button" className={`flt-opt${on ? ' on' : ''}`} aria-pressed={on} onClick={onClick}>
        <span className="flt-box" aria-hidden="true" />
        {mark && <span className="flt-mark">{mark}</span>}
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
            {cat === 'skills' && (
              <>
                <p className="flt-note">The premise of the board: pick skills you already have, and it keeps the roles those skills reach. Any selected skill counts.</p>
                <div className="flt-panesearch">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M16 16l5 5" /></svg>
                  <input
                    type="search"
                    value={skillQ}
                    onChange={(e) => setSkillQ(e.target.value)}
                    placeholder={`Search ${skills.length} skills`}
                    aria-label="Search skills"
                    autoComplete="off"
                  />
                </div>
                {skillRows.sel.map((sk) => (
                  <button key={sk.slug} type="button" className="flt-opt on" aria-pressed="true" onClick={() => toggleIn('skillSet', sk.slug)}>
                    <span className="flt-box" aria-hidden="true" />
                    <span className="flt-mark"><SkillMarkSvg id={sk.slug} /></span>
                    <span className="flt-lab">{sk.term}<span className="flt-sub">{sk.unlocks.slice(0, 3).map((u) => u.title).join(' · ')}{sk.unlocks.length > 3 ? ` · +${sk.unlocks.length - 3}` : ''}</span></span>
                    <span className="flt-n">{count('skills', { skillSet: new Set([sk.slug]) }).toLocaleString()}</span>
                  </button>
                ))}
                {skillRows.sel.length > 0 && <div className="flt-group">{skillQ ? 'Matches' : 'Popular'}</div>}
                {skillRows.rest.map((sk) => (
                  <button key={sk.slug} type="button" className="flt-opt" aria-pressed="false" onClick={() => toggleIn('skillSet', sk.slug)}>
                    <span className="flt-box" aria-hidden="true" />
                    <span className="flt-mark"><SkillMarkSvg id={sk.slug} /></span>
                    <span className="flt-lab">{sk.term}<span className="flt-sub">{sk.unlocks.slice(0, 3).map((u) => u.title).join(' · ')}{sk.unlocks.length > 3 ? ` · +${sk.unlocks.length - 3}` : ''}</span></span>
                    <span className="flt-n">{count('skills', { skillSet: new Set([...f.skillSet, sk.slug]) }).toLocaleString()}</span>
                  </button>
                ))}
                {skillRows.hidden > 0 && <p className="flt-note">{skillRows.hidden} more &mdash; keep typing to narrow.</p>}
              </>
            )}
            {cat === 'field' && (
              <>
                <p className="flt-note">Fields group our occupations. Tick several to browse across them.</p>
                {fieldNames.map((name) => (
                  <Opt key={name} on={f.fieldSet.has(name)} label={name}
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
            {cat === 'benefits' && (
              <>
                <p className="flt-note">Mined nightly from the posting text, never employer tags. A count is postings that STATE the benefit; absence of the tag is not absence of the benefit. Roles must state every benefit you tick.</p>
                {(['Money', 'Time', 'Flexibility', 'Health', 'Family', 'Growth', 'Workplace'] as const).map((catName) => {
                  const group = benefits.filter((b) => b.cat === catName && b.i !== undefined && (b.n ?? 0) > 0);
                  if (!group.length) return null;
                  return (
                    <div key={catName}>
                      <div className="flt-group">{catName}</div>
                      {group.map((b) => (
                        <Opt key={b.slug} on={f.benSet.has(b.i!)} label={b.term}
                          mark={<BenefitMarkSvg glyph={b.glyph} />}
                          n={count('benefits', { benSet: new Set([...f.benSet, b.i!]) })}
                          onClick={() => { const next = new Set(f.benSet); if (next.has(b.i!)) next.delete(b.i!); else next.add(b.i!); set({ benSet: next }); }} />
                      ))}
                    </div>
                  );
                })}
              </>
            )}
            {cat === 'require' && (
              <>
                <p className="flt-note">Read from the posting text, not the employer&rsquo;s seniority tag. A posting that states nothing stays visible unless you filter it out.</p>
                <div className="flt-group">Years of experience asked</div>
                {([['none', 'No figure stated', 'the text names no years requirement'], ['le2', 'Asks 2 years or less', ''], ['y35', 'Asks 3–5 years', ''], ['ge6', 'Asks 6 or more', '']] as const).map(([code, label, sub]) => (
                  <Opt key={code} on={f.xp === code} label={label} sub={sub || undefined}
                    n={count('require', { xp: code, edu: f.edu, langNot: f.langNot })}
                    onClick={() => set({ xp: f.xp === code ? '' : code })} />
                ))}
                <div className="flt-group">Education</div>
                <Opt on={f.edu === 'nodeg'} label="No degree demanded" sub="nothing in the text requires a bachelor's or higher"
                  n={count('require', { edu: 'nodeg', xp: f.xp, langNot: f.langNot })}
                  onClick={() => set({ edu: f.edu === 'nodeg' ? '' : 'nodeg' })} />
                <Opt on={f.edu === 'waived'} label="Degree explicitly waived" sub={'the posting says so: "or equivalent experience"'}
                  n={count('require', { edu: 'waived', xp: f.xp, langNot: f.langNot })}
                  onClick={() => set({ edu: f.edu === 'waived' ? '' : 'waived' })} />
                <div className="flt-group">Languages</div>
                {([['de', 'German not demanded'], ['fr', 'French not demanded'], ['en', 'English not demanded']] as const).map(([code, label]) => (
                  <Opt key={code} on={f.langNot.has(code)} label={label}
                    n={count('require', { langNot: new Set([...f.langNot, code]), xp: f.xp, edu: f.edu })}
                    onClick={() => { const next = new Set(f.langNot); if (next.has(code)) next.delete(code); else next.add(code); set({ langNot: next }); }} />
                ))}
              </>
            )}
            {cat === 'exclude' && (
              <>
                <p className="flt-note">The filter every other board is missing: say no. Hidden roles are counted, never silently dropped{hiddenByExclusion > 0 ? ` — ${hiddenByExclusion.toLocaleString()} hidden right now` : ''}.</p>
                <div className="flt-group">Titles containing</div>
                <ExcludeInput placeholder={'Type a word and press Enter — "senior", "principal"…'}
                  onAdd={(v) => { const next = new Set(f.exQ); next.add(v.toLowerCase()); set({ exQ: next }); }} />
                <div className="flt-chips">
                  {[...f.exQ].map((k) => (
                    <button key={k} type="button" className="flt-chip" onClick={() => { const next = new Set(f.exQ); next.delete(k); set({ exQ: next }); }}>
                      {k}<span aria-hidden="true">&times;</span>
                    </button>
                  ))}
                </div>
                <div className="flt-group">Companies</div>
                <ExcludeInput placeholder="Type a company name and press Enter"
                  onAdd={(v) => { const next = new Set(f.exCo); next.add(v.toLowerCase()); set({ exCo: next }); }} />
                <div className="flt-chips">
                  {[...f.exCo].map((k) => (
                    <button key={k} type="button" className="flt-chip" onClick={() => { const next = new Set(f.exCo); next.delete(k); set({ exCo: next }); }}>
                      {k}<span aria-hidden="true">&times;</span>
                    </button>
                  ))}
                </div>
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
          <button type="button" className="flt-clear lbl" onClick={() => set({ fieldSet: new Set(), region: '', ctySet: new Set(), remoteOnly: false, minPay: 0, hasSalary: false, tags: new Set(), fresh: '', srcSet: new Set(), lic: '', skillSet: new Set(), benSet: new Set(), xp: '', edu: '', langNot: new Set(), exQ: new Set(), exCo: new Set() })}>
            Clear all
          </button>
          {resultCount === 0 && culprit && <span className="flt-culprit">{culprit}</span>}
          <button type="button" className={`flt-show${resultCount === 0 ? ' none' : ''}`} onClick={close} disabled={resultCount === 0}>
            Show {resultCount.toLocaleString()} roles
          </button>
        </div>
      </div>
    </div>
  );
}
