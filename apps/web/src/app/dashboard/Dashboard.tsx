'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import posthog from 'posthog-js';
import { salaryLabel, postedLabel, companyInitial, monoTint } from '../jobs/JobCard';
import {
  readSaved, updateSaved, removeSaved, replaceAll, onSavedChange,
  type SavedJob, type SavedStatus,
} from '../../lib/saved';
import { supabaseBrowser } from '../../lib/supabase-browser';
import { mergeSaved, updateSave, removeSave } from './actions';

/* The saved-jobs dashboard. One list, status tabs over it — no kanban, no
   contacts, no reminders (the V1 cut every tracker research pass agreed on).
   Works signed out (guest saves), and signing in merges those into the
   account with the furthest-progressed status winning.

   A saved job that rotated out of the nightly build renders from its stored
   snapshot tagged "No longer listed" — never auto-deleted; knowing a lead
   died is information. */

const STATUSES: { key: SavedStatus; label: string }[] = [
  { key: 'saved', label: 'Saved' },
  { key: 'applied', label: 'Applied' },
  { key: 'interviewing', label: 'Interviewing' },
  { key: 'offer', label: 'Offer' },
  { key: 'rejected', label: 'Rejected' },
];

export default function Dashboard() {
  const [list, setList] = useState<SavedJob[]>([]);
  const [live, setLive] = useState<Set<string> | null>(null);   // "occ/id" pairs on today's board
  const [tab, setTab] = useState<'all' | SavedStatus>('all');
  const [me, setMe] = useState<{ email: string } | null | 'loading'>('loading');
  const [notesOpen, setNotesOpen] = useState<string | null>(null);
  const merged = useRef(false);

  // guest list + subscription
  useEffect(() => {
    const sync = () => setList(readSaved());
    sync();
    posthog.capture('dashboard_viewed');
    return onSavedChange(sync);
  }, []);

  // session, then one merge per mount
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) { setMe(null); return; }
    void sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setMe(null); return; }
      setMe({ email: data.user.email ?? '' });
      posthog.identify(data.user.id);
      if (!merged.current) {
        merged.current = true;
        const canonical = await mergeSaved(readSaved());
        if (canonical) replaceAll(canonical);
      }
    });
  }, []);

  // resolve against today's board to tag expired saves
  useEffect(() => {
    let ok = true;
    void fetch('/data/all-jobs.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((jobs: { occ: string; id: string }[]) => {
        if (ok) setLive(new Set(jobs.map((j) => `${j.occ}/${j.id}`)));
      })
      .catch(() => { /* leave null: no aliveness claims without data */ });
    return () => { ok = false; };
  }, []);

  const signedIn = me !== 'loading' && me !== null;
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: list.length };
    for (const s of STATUSES) c[s.key] = list.filter((x) => x.status === s.key).length;
    return c;
  }, [list]);
  const rows = tab === 'all' ? list : list.filter((x) => x.status === tab);

  const setStatus = (s: SavedJob, status: SavedStatus) => {
    updateSaved(s.occ, s.id, { status });
    if (signedIn) void updateSave(s.occ, s.id, { status });
  };
  const setNotes = (s: SavedJob, notes: string) => {
    updateSaved(s.occ, s.id, { notes });
    if (signedIn) void updateSave(s.occ, s.id, { notes });
  };
  const remove = (s: SavedJob) => {
    removeSaved(s.occ, s.id);
    if (signedIn) void removeSave(s.occ, s.id);
  };
  const signOut = () => {
    void supabaseBrowser()?.auth.signOut().then(() => setMe(null));
  };

  return (
    <div className="dash">
      <header className="dash-head">
        <div>
          <h1>Saved jobs.</h1>
          <p className="dash-sub">
            {list.length === 0
              ? 'Nothing saved yet.'
              : `${list.length} saved · ${counts.applied + counts.interviewing + counts.offer} in motion`}
          </p>
        </div>
        <div className="dash-auth">
          {me === 'loading' ? null : signedIn ? (
            <>
              <span className="dash-who">{(me as { email: string }).email}</span>
              <button type="button" className="dash-ghost" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <Link className="dash-signin" href="/signin">
              Sign in to keep these across devices
            </Link>
          )}
        </div>
      </header>

      {list.length === 0 ? (
        <div className="dash-empty">
          <p>Save a job from the board and it lands here, with a place to track the application.</p>
          <Link className="dash-cta" href="/jobs">Browse jobs</Link>
        </div>
      ) : (
        <>
          <nav className="dash-tabs" aria-label="Filter by status">
            <button type="button" className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>
              All <i>{counts.all}</i>
            </button>
            {STATUSES.map((s) => (
              <button key={s.key} type="button" className={tab === s.key ? 'on' : ''} onClick={() => setTab(s.key)}>
                {s.label} <i>{counts[s.key]}</i>
              </button>
            ))}
          </nav>

          {/* The board's card anatomy (logo, title at company, location, pay,
              date) with the tracker's controls in the cell where the board
              keeps save + Apply: one job, drawn one way everywhere. */}
          <ul className="job-list dash-list">
            {rows.map((s) => {
              const key = `${s.occ}/${s.id}`;
              const alive = live === null ? true : live.has(key);
              const pay = salaryLabel(s.smin ?? null, s.smax ?? null);
              const [tbg, tfg] = monoTint(s.company);
              return (
                <li key={key} className={`dash-row${alive ? '' : ' dead'}`}>
                  <div className="job-card dash-card">
                    <span className="job-logo" aria-hidden="true">
                      {s.logo
                        ? <img src={s.logo} alt="" width={34} height={34} loading="lazy" />
                        : <span className="job-mono" style={{ background: tbg, color: tfg }}>{companyInitial(s.company)}</span>}
                    </span>
                    <span className="jv-main">
                      {alive
                        ? <Link className="jv-ti" href={`/jobs/${s.occ}/${s.id}`}>{s.title} <span className="jv-at">at {s.company}</span></Link>
                        : <span className="jv-ti">{s.title} <span className="jv-at">at {s.company}</span></span>}
                      <span className="jv-loc">
                        {s.location || 'Location unlisted'}
                        {!alive && <em className="dash-dead-tag">No longer listed</em>}
                      </span>
                    </span>
                    <span className="jv-pay">{pay}</span>
                    <span className="jv-age">{s.posted ? postedLabel(s.posted) : ''}</span>
                    <span className="jv-cell dash-ctl">
                      <select
                        className="dash-status"
                        value={s.status}
                        aria-label="Application status"
                        onChange={(e) => setStatus(s, e.target.value as SavedStatus)}
                      >
                        {STATUSES.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                      </select>
                      <button
                        type="button"
                        className={`dash-ghost${(s.notes || notesOpen === key) ? ' has' : ''}`}
                        onClick={() => setNotesOpen(notesOpen === key ? null : key)}
                      >Notes</button>
                      <button type="button" className="dash-x" aria-label={`Remove ${s.title}`} onClick={() => remove(s)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                      </button>
                    </span>
                  </div>
                  {notesOpen === key && (
                    <textarea
                      className="dash-notes"
                      defaultValue={s.notes ?? ''}
                      placeholder="Contact, referral, follow-up date…"
                      onBlur={(e) => setNotes(s, e.target.value)}
                    />
                  )}
                </li>
              );
            })}
          </ul>

          {!signedIn && me !== 'loading' && (
            <p className="dash-keep">
              These live only in this browser. <Link href="/signin">Sign in</Link> and
              they follow you.
            </p>
          )}
        </>
      )}
    </div>
  );
}
