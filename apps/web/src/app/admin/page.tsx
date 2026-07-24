import type { Metadata } from 'next';
import { readSubmissions, type Submission } from './data';
import { StatusControl } from './StatusControl';

export const metadata: Metadata = { title: 'Admin — job submissions', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const k = (n: number) => '$' + Math.round(n / 1000) + 'k';
function salary(r: Submission): string {
  if (r.salary_min && r.salary_max) return `${k(r.salary_min)}–${k(r.salary_max)}`;
  if (r.salary_min) return `${k(r.salary_min)}+`;
  if (r.salary_max) return `up to ${k(r.salary_max)}`;
  return '—';
}
function replyHref(r: Submission): string {
  const applyLine = r.apply_url || r.apply_email || '';
  const subject = `Your PivotHop job post: ${r.role}`;
  const body = [
    `Hi${r.contact_name ? ' ' + r.contact_name : ''},`,
    '',
    `Thanks for posting "${r.role}" at ${r.company} on PivotHop. It's a great fit for our adjacent-talent board — we'll get it live within two days.`,
    '',
    `You chose the ${r.tier} tier (launch rate). Reply here and I'll send the payment link and the go-live confirmation.`,
    applyLine ? `\nApply destination on file: ${applyLine}` : '',
    '',
    '— PivotHop',
  ].filter((l) => l !== '').join('\n');
  return `mailto:${r.contact_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function Card({ r }: { r: Submission }) {
  const applyTo = r.apply_url || r.apply_email;
  return (
    <article className={`adm-card status-${r.status}`}>
      <div className="adm-card-top">
        <div className="adm-card-id">
          <span className="adm-tier">{r.tier}</span>
          <h2>{r.role}</h2>
          <span className="adm-co">{r.company}</span>
        </div>
        <div className="adm-card-actions">
          <StatusControl id={r.id} status={r.status} />
          <span className="lbl adm-date">{r.created_at.slice(0, 10)}</span>
        </div>
      </div>
      <dl className="adm-meta">
        <div><dt>Contact</dt><dd><a href={`mailto:${r.contact_email}`}>{r.contact_email}</a>{r.contact_name ? ` · ${r.contact_name}` : ''}</dd></div>
        <div><dt>Type</dt><dd>{[r.employment_type, r.workplace, r.region].filter(Boolean).join(' · ') || '—'}</dd></div>
        <div><dt>Salary</dt><dd>{salary(r)}</dd></div>
        <div><dt>Occupation</dt><dd>{r.occupation_slug || '(unmatched)'}</dd></div>
        <div><dt>Apply</dt><dd>{applyTo ? <a href={r.apply_url || `mailto:${r.apply_email}`} target="_blank" rel="noopener noreferrer">{applyTo}</a> : '—'}</dd></div>
        {r.logo_url ? <div><dt>Logo</dt><dd><a href={r.logo_url} target="_blank" rel="noopener noreferrer">{r.logo_url}</a></dd></div> : null}
      </dl>
      {r.skills?.length ? <div className="adm-tags"><span className="lbl">Skills</span>{r.skills.map((s) => <span key={s}>{s}</span>)}</div> : null}
      {r.benefits?.length ? <div className="adm-tags"><span className="lbl">Benefits</span>{r.benefits.map((s) => <span key={s}>{s}</span>)}</div> : null}
      {(r.about || r.responsibilities || r.qualifications) && (
        <details className="adm-desc">
          <summary>Description</summary>
          {r.about && <p><b>About</b>{'\n'}{r.about}</p>}
          {r.responsibilities && <p><b>Responsibilities</b>{'\n'}{r.responsibilities}</p>}
          {r.qualifications && <p><b>Qualifications</b>{'\n'}{r.qualifications}</p>}
        </details>
      )}
      <div className="adm-card-foot">
        <a className="adm-reply" href={replyHref(r)}>Reply to {r.company}</a>
      </div>
    </article>
  );
}

export default async function Admin() {
  const { rows, error } = await readSubmissions();
  const open = rows.filter((r) => r.status === 'new').length;
  return (
    <div className="adm">
      <header className="adm-head">
        <h1>Submissions</h1>
        <span className="lbl">{error ? error : `${rows.length} total · ${open} new`}</span>
      </header>
      {error === 'not-configured' && <p className="adm-note">Not connected. Set <b>SUPABASE_URL</b> and <b>SUPABASE_SERVICE_KEY</b> in the Vercel environment.</p>}
      {error && error !== 'not-configured' && <p className="adm-note">Couldn&rsquo;t load submissions ({error}).</p>}
      {!error && rows.length === 0 && <p className="adm-note">No submissions yet. They&rsquo;ll appear here the moment an employer posts.</p>}
      <div className="adm-list">
        {rows.map((r) => <Card key={r.id} r={r} />)}
      </div>
    </div>
  );
}
