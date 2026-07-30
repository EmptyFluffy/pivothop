'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Row, CuratedRow } from './data';
import { OutreachControl } from './OutreachControl';

/* The working surface of the outreach console (phase 1, 2026-07-30).
 *
 * Client-side on purpose: the operator works a 1,200-row queue, and the two
 * things that make that bearable — facet filters and rows MOVING when their
 * status changes — both need immediate state. Status changes bubble up from
 * OutreachControl into `overrides`, so marking a row "contacted" re-buckets it
 * into the Contacted section on the spot; the Supabase write happens behind it.
 *
 * Sections, not sorting: "contacted rises to the top" was the request, but a
 * contacted row above an uncontacted one INSIDE one list re-creates the
 * double-email risk this console exists to prevent. Separate sections make the
 * untouched queue unambiguous — what is in "To contact" has nobody's name on it. */

const SECTIONS: { key: string; title: string; statuses: string[]; open: boolean }[] = [
  { key: 'todo', title: 'To contact', statuses: ['new', 'queued'], open: true },
  { key: 'contacted', title: 'Contacted — awaiting reply', statuses: ['contacted'], open: true },
  { key: 'live', title: 'Replied / won', statuses: ['replied', 'won'], open: true },
  { key: 'dead', title: 'Declined / skipped', statuses: ['declined', 'skip'], open: false },
];

const SCALE_LABEL: Record<string, string> = {
  small: 'Small (<20 roles here)',
  mid: 'Mid (20–99)',
  major: 'Major (100+ — long shot)',
};

function mailto(r: Row): string {
  const p = r.pitch;
  const many = p.openings > 1;
  const subject = `${p.role} at ${r.company} — ${p.from}s are ${p.readiness}% ready for it`;
  const body = [
    'Hi,',
    '',
    `You've had ${many ? `${p.openings} ${p.role} roles` : p.role} open${r.days_open >= 14 ? ` for ${r.days_open} days` : ''}. I run PivotHop, which measures how close one occupation's skills sit to another's using live postings.`,
    '',
    `On that measurement, ${p.from}s cover ${p.readiness}% of what your ${p.role} posting asks for${p.pool > 1 ? `, and they're one of ${p.pool} adjacent titles that clear our bar for it` : ''}. That's a pool you're probably not seeing, because they don't have your job title on their CV.`,
    '',
    'Worth a look? I can send the skill-gap breakdown for that role — what these candidates already have and the two or three things they\'d need.',
    '',
    '— Carlos, PivotHop',
    'https://www.pivothop.com',
  ].join('\n');
  return `mailto:${r.state?.contact_email ?? ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function TargetRow({ r, status, onStatus }: { r: Row; status: string; onStatus: (key: string, s: string) => void }) {
  return (
    <article className={`otr-row status-${status}${r.mail_ok ? '' : ' otr-nomail'}`}>
      <div className="otr-main">
        <div className="otr-id">
          <span className="otr-score">{Math.round(r.score)}</span>
          <h2>{r.company}</h2>
          <span className="lbl">
            {r.field} · {SCALE_LABEL[r.scale]?.split(' ')[0].toLowerCase() ?? r.scale} ·{' '}
            {r.adjacent_roles} adjacent of {r.open_roles} open · {r.days_open}d ·{' '}
            {r.country_known ? r.countries.join(' ') : 'country unknown'}
            {r.staffing ? ' · staffing' : ''}
          </span>
        </div>
        <OutreachControl id={r.key} company={r.company} mailOk={r.mail_ok} state={r.state} onStatus={(s) => onStatus(r.key, s)} />
      </div>

      <p className={`otr-pitch kind-${r.pitch.kind}`}>
        <Link href={`/routes/${r.pitch.from_slug}`}>{r.pitch.from}</Link>
        {' → '}
        <Link href={`/jobs/${r.pitch.role_slug}`}>{r.pitch.role}</Link>
        {' at '}<b>{r.pitch.readiness}% readiness</b>
        {r.pitch.openings > 1 ? ` · ${r.pitch.openings} open here` : ''}
        {r.pitch.pool > 1 ? ` · ${r.pitch.pool} adjacent titles reach it` : ''}
        {r.pitch.kind === 'lateral'
          ? <span className="otr-obvious">same industry — they may find this obvious</span>
          : null}
      </p>

      <dl className="otr-meta">
        <div><dt>Hiring</dt><dd>{r.top_occupations.map((o) => `${o.title} (${o.n})`).join(' · ')}</dd></div>
        <div><dt>Domain</dt><dd>{r.domain_candidates.length
          ? r.domain_candidates.map((d, i) => (
              <span key={d}>{i > 0 ? ' · ' : ''}<a href={`https://hunter.io/search/${d}`} target="_blank" rel="noopener noreferrer">{d}</a></span>
            ))
          : '—'}</dd></div>
        <div><dt>Score</dt><dd>reach {r.why.reach} · volume {r.why.volume} · age {r.why.age}</dd></div>
        {r.state?.contact_email ? <div><dt>Contact</dt><dd>{r.state.contact_email}</dd></div> : null}
        {r.state?.note ? <div><dt>Note</dt><dd>{r.state.note}</dd></div> : null}
      </dl>

      {r.mail_ok && r.state?.contact_email ? (
        <div className="otr-foot"><a className="adm-reply" href={mailto(r)}>Draft to {r.company}</a></div>
      ) : null}
    </article>
  );
}

/* Curated targets (phases 2-3) render a lighter card: no score, no corpus facts —
   the "why" and the pitch angle ARE the row. Same control, same Supabase table,
   keys namespaced "cur:<slug>". */
function CuratedCard({ c, status, onStatus }: { c: CuratedRow; status: string; onStatus: (key: string, s: string) => void }) {
  return (
    <article className={`otr-row status-${status}`}>
      <div className="otr-main">
        <div className="otr-id">
          <h2><a href={c.url} target="_blank" rel="noopener noreferrer">{c.name}</a></h2>
          <span className="lbl">{c.url.replace(/^https?:\/\//, '')}</span>
        </div>
        <OutreachControl id={`cur:${c.slug}`} company={c.name} mailOk state={c.state} onStatus={(s) => onStatus(`cur:${c.slug}`, s)} />
      </div>
      <p className="otr-pitch kind-pivot">{c.why}</p>
      <dl className="otr-meta">
        <div><dt>Angle</dt><dd>{c.pitch}</dd></div>
        {c.state?.note ? <div><dt>Note</dt><dd>{c.state.note}</dd></div> : null}
      </dl>
    </article>
  );
}

const TABS = [
  { key: 'employers', label: 'Employers' },
  { key: 'launch', label: 'Launch boards' },
  { key: 'press', label: 'Press' },
  { key: 'backlink', label: 'Backlinks' },
] as const;

export function OutreachBoard({ rows, curated }: { rows: Row[]; curated: CuratedRow[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('employers');
  // Status truth for THIS session: server state overlaid with local changes, so a
  // row moves sections the moment its select changes rather than on next load.
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [field, setField] = useState('all');
  const [scale, setScale] = useState('all');
  const [mailable, setMailable] = useState(false);
  const [q, setQ] = useState('');

  const fieldOptions = useMemo(
    () => [...new Set(rows.map((r) => r.field))].sort(),
    [rows],
  );

  const statusOf = (r: Row) => overrides[r.key] ?? r.state?.status ?? 'new';

  const filtered = rows.filter((r) =>
    (field === 'all' || r.field === field) &&
    (scale === 'all' || r.scale === scale) &&
    (!mailable || r.mail_ok) &&
    (!q || r.company.toLowerCase().includes(q.toLowerCase())));

  const curStatusOf = (c: CuratedRow) => overrides[`cur:${c.slug}`] ?? c.state?.status ?? 'new';

  return (
    <div>
      <nav className="otr-tabs" aria-label="Target category">
        {TABS.map((t) => {
          const n = t.key === 'employers' ? rows.length : curated.filter((c) => c.category === t.key).length;
          return (
            <button key={t.key} type="button" className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>
              {t.label} <span>{n}</span>
            </button>
          );
        })}
      </nav>

      {tab !== 'employers' && (
        <div className="otr-list" style={{ marginTop: 18 }}>
          {curated.filter((c) => c.category === tab).map((c) => (
            <CuratedCard key={c.slug} c={c} status={curStatusOf(c)}
              onStatus={(key, s) => setOverrides((o) => ({ ...o, [key]: s }))} />
          ))}
        </div>
      )}

      {tab === 'employers' && (<>
      <div className="otr-filters">
        <input
          type="search" placeholder="Search company…" value={q}
          onChange={(e) => setQ(e.target.value)} aria-label="Search company"
        />
        <select value={field} onChange={(e) => setField(e.target.value)} aria-label="Industry">
          <option value="all">All industries</option>
          {fieldOptions.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={scale} onChange={(e) => setScale(e.target.value)} aria-label="Company scale">
          <option value="all">All scales</option>
          {Object.entries(SCALE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="otr-mailable">
          <input type="checkbox" checked={mailable} onChange={(e) => setMailable(e.target.checked)} />
          mailable only
        </label>
        <span className="lbl">{filtered.length} of {rows.length}</span>
      </div>

      {SECTIONS.map((sec) => {
        const inSec = filtered.filter((r) => sec.statuses.includes(statusOf(r)));
        if (!inSec.length) return null;
        return (
          <details key={sec.key} className="otr-sec" open={sec.open}>
            <summary>
              <h2>{sec.title}</h2>
              <span className="lbl">{inSec.length}</span>
            </summary>
            <div className="otr-list">
              {inSec.map((r) => (
                <TargetRow
                  key={r.key} r={r} status={statusOf(r)}
                  onStatus={(key, s) => setOverrides((o) => ({ ...o, [key]: s }))}
                />
              ))}
            </div>
          </details>
        );
      })}
      </>)}
    </div>
  );
}
