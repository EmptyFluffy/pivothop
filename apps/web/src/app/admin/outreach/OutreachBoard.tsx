'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Row, CuratedRow, ManualRow } from './data';
import { OutreachControl } from './OutreachControl';
import { setOutreach } from './actions';

/* The working surface of the outreach console (phase 1, 2026-07-30).
 *
 * Client-side on purpose: the operator works a 1,200-row queue, and the two
 * things that make that bearable — facet filters and rows MOVING when their
 * status changes — both need immediate state. Status changes bubble up from
 * OutreachControl into `overrides`, so marking a row "contacted" re-buckets it
 * into the Contacted section on the spot; the Supabase write happens behind it.
 *
 * Status is a FILTER BAR with live counts, not stacked sections. The first
 * version stacked sections and put "Contacted" below the full 1,200-row queue,
 * so marking a row contacted teleported it thousands of pixels down — from the
 * operator's seat it just disappeared. One visible bucket at a time, with the
 * counts ticking on the bar, keeps the move legible: tap contacted, watch the
 * Contacted count go up, click it to see them. Buckets stay separate (never
 * interleaved in one list) so the untouched queue remains unambiguous. */

const BUCKETS: { key: string; title: string; statuses: string[] }[] = [
  { key: 'todo', title: 'To contact', statuses: ['new', 'queued'] },
  { key: 'contacted', title: 'Contacted', statuses: ['contacted'] },
  { key: 'live', title: 'Replied / won', statuses: ['replied', 'won'] },
  { key: 'dead', title: 'Skipped', statuses: ['declined', 'skip'] },
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
  { key: 'studio', label: 'Studios' },
] as const;

/* A hand-added lead: same card weight as curated, plus a MANUAL tag so it is
   obvious the row came from a person, not the corpus or the curated file. */
function ManualCard({ m, status, onStatus }: { m: ManualRow; status: string; onStatus: (key: string, s: string) => void }) {
  return (
    <article className={`otr-row status-${status}`}>
      <div className="otr-main">
        <div className="otr-id">
          <span className="otr-score">MANUAL</span>
          <h2>{m.url ? <a href={m.url} target="_blank" rel="noopener noreferrer">{m.name}</a> : m.name}</h2>
          {m.url ? <span className="lbl">{m.url.replace(/^https?:\/\//, '')}</span> : null}
        </div>
        <OutreachControl id={m.key} company={m.name} mailOk state={m.state} onStatus={(s) => onStatus(m.key, s)} />
      </div>
      {m.state.note ? <dl className="otr-meta"><div><dt>Note</dt><dd>{m.state.note}</dd></div></dl> : null}
    </article>
  );
}

/* Add a lead by hand. Writes an outreach_status row with manual=true (0008) and
   refreshes the server data so the new card appears in its tab. */
function AddLead({ activeTab }: { activeTab: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(activeTab);
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    const n = name.trim();
    if (!n) return;
    setSaving(true);
    const key = `man:${n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
    const cleanUrl = url.trim() ? (/^https?:\/\//.test(url.trim()) ? url.trim() : `https://${url.trim()}`) : undefined;
    await setOutreach(key, n, { status: 'new', manual: true, category, url: cleanUrl, note: note.trim() || undefined });
    setSaving(false);
    setName(''); setUrl(''); setNote('');
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return <button type="button" className="otr-add" onClick={() => { setCategory(activeTab); setOpen(true); }}>+ Add lead</button>;
  }
  return (
    <div className="otr-addform">
      <input type="text" placeholder="Company or contact name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
        {TABS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
      </select>
      <input type="text" placeholder="URL (optional)" value={url} onChange={(e) => setUrl(e.target.value)} />
      <input type="text" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <button type="button" className="adm-reply" disabled={saving || !name.trim()} onClick={() => void submit()}>
        {saving ? 'Saving…' : 'Save'}
      </button>
      <button type="button" className="otr-more" onClick={() => setOpen(false)}>cancel</button>
    </div>
  );
}

/* CSV of the CURRENT tab with facet filters applied, all status buckets, one
   status column — what you see is what lands in Sheets/Excel. Client-side blob:
   no endpoint, nothing new exposed. Excel-embed was considered and rejected: an
   embedded sheet forks the source of truth; export is a one-way snapshot. */
const csvEsc = (v: unknown) => { const t = String(v ?? ''); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
function downloadCsv(filename: string, header: string[], lines: unknown[][]) {
  const csv = [header, ...lines].map((row) => row.map(csvEsc).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function OutreachBoard({ rows, curated, manual }: { rows: Row[]; curated: CuratedRow[]; manual: ManualRow[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('employers');
  const [bucket, setBucket] = useState('todo');
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
  const manStatusOf = (m: ManualRow) => overrides[m.key] ?? m.state.status ?? 'new';
  const manualIn = (cat: string) => manual.filter((m) => m.category === cat);

  function exportCsv() {
    const header = ['category', 'company', 'status', 'owner', 'contact_email', 'url_or_domain', 'score', 'industry', 'scale', 'pitch', 'readiness', 'days_open', 'countries', 'note'];
    const lines: unknown[][] = [];
    if (tab === 'employers') {
      for (const m of manualIn('employers')) lines.push(['manual', m.name, manStatusOf(m), m.state.owner, m.state.contact_email, m.url, '', '', '', '', '', '', '', m.state.note]);
      for (const r of filtered) lines.push([
        'employer', r.company, statusOf(r), r.state?.owner, r.state?.contact_email, r.domain_candidates[0],
        Math.round(r.score), r.field, r.scale, `${r.pitch.from} -> ${r.pitch.role}`, r.pitch.readiness,
        r.days_open, r.countries.join(' '), r.state?.note,
      ]);
    } else {
      for (const m of manualIn(tab)) lines.push(['manual', m.name, manStatusOf(m), m.state.owner, m.state.contact_email, m.url, '', '', '', '', '', '', '', m.state.note]);
      for (const c of curated.filter((x) => x.category === tab)) lines.push([c.category, c.name, curStatusOf(c), c.state?.owner, c.state?.contact_email, c.url, '', '', '', c.pitch, '', '', '', c.state?.note]);
    }
    downloadCsv(`pivothop-outreach-${tab}-${new Date().toISOString().slice(0, 10)}.csv`, header, lines);
  }

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

      <div className="otr-toolbar">
        <AddLead activeTab={tab} />
        <button type="button" className="otr-add" onClick={exportCsv}>Export CSV</button>
      </div>

      {tab !== 'employers' && (() => {
        const inTab = curated.filter((c) => c.category === tab);
        const mans = manualIn(tab);
        const bk0 = BUCKETS.find((bk) => bk.key === bucket)!;
        const shown = inTab.filter((c) => bk0.statuses.includes(curStatusOf(c)));
        const shownMan = mans.filter((m) => bk0.statuses.includes(manStatusOf(m)));
        return (
          <>
            <nav className="otr-subtabs" aria-label="Status">
              {BUCKETS.map((bk) => {
                const n = inTab.filter((c) => bk.statuses.includes(curStatusOf(c))).length
                  + mans.filter((m) => bk.statuses.includes(manStatusOf(m))).length;
                return (
                  <button key={bk.key} type="button" className={bucket === bk.key ? 'on' : ''} onClick={() => setBucket(bk.key)}>
                    {bk.title} <span>{n}</span>
                  </button>
                );
              })}
            </nav>
            <div className="otr-list" style={{ marginTop: 16 }}>
              {shownMan.map((m) => (
                <ManualCard key={m.key} m={m} status={manStatusOf(m)}
                  onStatus={(key, s) => setOverrides((o) => ({ ...o, [key]: s }))} />
              ))}
              {shown.map((c) => (
                <CuratedCard key={c.slug} c={c} status={curStatusOf(c)}
                  onStatus={(key, s) => setOverrides((o) => ({ ...o, [key]: s }))} />
              ))}
              {!shown.length && !shownMan.length && <p className="adm-note">Nothing in this bucket for this tab.</p>}
            </div>
          </>
        );
      })()}

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

      <nav className="otr-subtabs" aria-label="Status">
        {BUCKETS.map((bk) => {
          const n = filtered.filter((r) => bk.statuses.includes(statusOf(r))).length
            + manualIn('employers').filter((m) => bk.statuses.includes(manStatusOf(m))).length;
          return (
            <button key={bk.key} type="button" className={bucket === bk.key ? 'on' : ''} onClick={() => setBucket(bk.key)}>
              {bk.title} <span>{n}</span>
            </button>
          );
        })}
      </nav>
      <div className="otr-list" style={{ marginTop: 16 }}>
        {manualIn('employers').filter((m) => BUCKETS.find((bk) => bk.key === bucket)!.statuses.includes(manStatusOf(m))).map((m) => (
          <ManualCard key={m.key} m={m} status={manStatusOf(m)}
            onStatus={(key, s) => setOverrides((o) => ({ ...o, [key]: s }))} />
        ))}
        {filtered.filter((r) => BUCKETS.find((bk) => bk.key === bucket)!.statuses.includes(statusOf(r))).map((r) => (
          <TargetRow
            key={r.key} r={r} status={statusOf(r)}
            onStatus={(key, s) => setOverrides((o) => ({ ...o, [key]: s }))}
          />
        ))}
      </div>
      </>)}
    </div>
  );
}
