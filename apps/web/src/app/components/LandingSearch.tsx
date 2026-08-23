'use client';
import { useMemo, useRef, useState } from 'react';

/* The landing's search unit with hybrid cells: type freely, or pick from the
   dropdown that opens under each cell (the board's typeahead idiom, in the
   landing's clothes). Plain form semantics survive — no JS still submits
   whatever was typed to /jobs. */

type Role = { t: string; slug: string };

function Cell({ name, label, placeholder, icon, options, wide }: {
  name: string; label: string; placeholder: string; icon: React.ReactNode;
  options: string[]; wide?: boolean;
}) {
  const [v, setV] = useState('');
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(-1);
  const ref = useRef<HTMLInputElement>(null);
  const matches = useMemo(() => {
    const q = v.trim().toLowerCase();
    const hit = q
      ? options.filter((o) => o.toLowerCase().includes(q))
      : options;
    return hit.slice(0, 8);
  }, [v, options]);

  return (
    <label className={`lp-sfield${wide ? '' : ' lp-sloc'}`}>
      {icon}
      <span className="lp-fwrap">
        <span className="l">{label}</span>
        <input
          ref={ref} type="text" name={name} value={v} placeholder={placeholder}
          autoComplete="off" role="combobox" aria-expanded={open && matches.length > 0}
          aria-autocomplete="list"
          onChange={(e) => { setV(e.target.value); setOpen(true); setIdx(-1); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 140)}
          onKeyDown={(e) => {
            if (!open || !matches.length) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => (i + 1) % matches.length); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => (i - 1 + matches.length) % matches.length); }
            else if (e.key === 'Enter' && idx >= 0) { e.preventDefault(); setV(matches[idx]); setOpen(false); setIdx(-1); }
            else if (e.key === 'Escape') { setOpen(false); setIdx(-1); }
          }}
        />
      </span>
      {open && matches.length > 0 && (
        <div className="lp-dd" role="listbox">
          {matches.map((o, i) => (
            <button
              key={o} type="button" role="option" aria-selected={i === idx}
              className={i === idx ? 'on' : ''}
              onMouseDown={(e) => { e.preventDefault(); setV(o); setOpen(false); setIdx(-1); ref.current?.focus(); }}
              onMouseEnter={() => setIdx(i)}
            >{o}</button>
          ))}
        </div>
      )}
    </label>
  );
}

export default function LandingSearch({ total, roles, locations }: {
  total: number; roles: Role[]; locations: string[];
}) {
  return (
    <form className="lp-search" action="/jobs" method="get" role="search" aria-label="Search the job board">
      <Cell
        name="q" label="Role, company, or skill" placeholder="Architect, Python, Philips…" wide
        options={roles.map((r) => r.t)}
        icon={<svg className="lp-fico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M16 16l5 5" /></svg>}
      />
      <span className="lp-sdiv" aria-hidden="true" />
      <Cell
        name="loc" label="Location" placeholder="Anywhere"
        options={locations}
        icon={<svg className="lp-fico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>}
      />
      <button className="lp-go" type="submit">
        Search {total.toLocaleString()} roles
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
      </button>
    </form>
  );
}
