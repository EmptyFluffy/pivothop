'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';

/* A search bar over an .rt-index list, shared by the salary and route indexes.
   Rows are built server-side (so every link is in the SSR HTML for crawlers)
   and filtered client-side as you type. Optionally grouped into .rt-cluster
   sections. The bar sticks below the nav while the list scrolls. */

export type IxRow = { slug: string; href: string; t: string; m: string; s: string; hay: string; group?: string };
export type IxGroup = { key: string; label: string; unit: string };

export function IndexSearch({ rows, groups, placeholder, unit }: {
  rows: IxRow[];
  groups?: IxGroup[];
  placeholder: string;
  unit: string;
}) {
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const filtered = useMemo(
    () => (needle ? rows.filter((r) => r.hay.includes(needle)) : rows),
    [rows, needle],
  );

  const renderList = (rs: IxRow[]) => (
    <ul className="rt-index">
      {rs.map((r) => (
        <li key={r.slug}>
          <Link href={r.href}>
            <span className="t">{r.t}</span>
            <span className="m">{r.m}</span>
            <span className="s lbl">{r.s}</span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <div className="ix-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M16 16l5 5" /></svg>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label={placeholder} autoComplete="off" />
        <span className="ix-count lbl">{filtered.length.toLocaleString()} {unit}</span>
      </div>
      {groups
        ? groups.map((g) => {
            const rs = filtered.filter((r) => r.group === g.key);
            if (!rs.length) return null;
            return (
              <section key={g.key} className="rt-cluster">
                <h2 className="rt-cluster-h">{g.label} <span className="lbl">{rs.length} {g.unit}</span></h2>
                {renderList(rs)}
              </section>
            );
          })
        : renderList(filtered)}
      {filtered.length === 0 && <p className="rt-note ix-empty">Nothing matches &ldquo;{q.trim()}&rdquo;. Try fewer letters.</p>}
    </>
  );
}
