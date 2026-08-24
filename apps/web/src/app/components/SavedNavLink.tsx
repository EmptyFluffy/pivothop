'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { savedCount, onSavedChange } from '../../lib/saved';

/* Nav entry for the saved-jobs dashboard. Count hydrates client-side from the
   guest store (server renders 0-badge = no badge), so prerendered HTML never
   varies per visitor. */

export default function SavedNavLink({ menu }: { menu?: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const sync = () => setN(savedCount());
    sync();
    return onSavedChange(sync);
  }, []);

  if (menu) {
    return <Link className="navlink" href="/dashboard">Saved{n > 0 ? ` · ${n}` : ''}</Link>;
  }
  return (
    <Link className="nav-saved" href="/dashboard" aria-label={`Saved jobs${n ? ` (${n})` : ''}`} title="Saved jobs">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1Z" />
      </svg>
      {n > 0 && <i className="nav-saved-n">{n > 99 ? '99+' : n}</i>}
    </Link>
  );
}
