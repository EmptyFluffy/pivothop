'use client';
import { useEffect, useState } from 'react';
import posthog from 'posthog-js';
import type { Job } from './JobCard';
import { isSaved, toggleSave, onSavedChange, readSaved } from '../../lib/saved';
import { supabaseBrowser } from '../../lib/supabase-browser';
import { upsertSave, removeSave } from '../dashboard/actions';

/* The save toggle. Bookmark glyph, never a heart (hearts read as social
   likes; every major board converged on bookmark + Save/Saved). Guest-first:
   the toggle writes localStorage and works with no account — signing in
   later merges the list. Renders unsaved on the server and corrects after
   mount, so prerendered HTML stays identical for every visitor. */

function Bookmark({ filled, size = 20 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

export default function SaveButton({ j, label }: { j: Job; label?: boolean }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const sync = () => setSaved(isSaved(j.occ, j.id));
    sync();
    return onSavedChange(sync);
  }, [j.occ, j.id]);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const now = toggleSave({
      occ: j.occ, id: j.id, title: j.title, company: j.company,
      location: j.location, remote: j.remote,
      smin: j.smin ?? undefined, smax: j.smax ?? undefined,
      posted: j.posted, url: j.url, logo: j.logo,
    });
    posthog.capture(now ? 'job_saved' : 'job_unsaved', { occ: j.occ, job_id: j.id });
    // signed in? mirror to the account, fire-and-forget (getSession is local)
    const sb = supabaseBrowser();
    if (sb) {
      void sb.auth.getSession().then(({ data }) => {
        if (!data.session) return;
        if (now) {
          const row = readSaved().find((s) => s.occ === j.occ && s.id === j.id);
          if (row) void upsertSave(row);
        } else {
          void removeSave(j.occ, j.id);
        }
      });
    }
  };

  return (
    <button
      type="button"
      className={`jv-save${saved ? ' on' : ''}${label ? ' jv-save-lbl' : ''}`}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved jobs' : 'Save job'}
      title={saved ? 'Saved' : 'Save'}
      onClick={onClick}
    >
      <Bookmark filled={saved} size={label ? 17 : 20} />
      {label && <span>{saved ? 'Saved' : 'Save'}</span>}
    </button>
  );
}
