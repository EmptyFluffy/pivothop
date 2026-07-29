import type { Metadata } from 'next';
import Link from 'next/link';
import { readOutreach, meta, type Row } from './data';
import { OutreachControl } from './OutreachControl';

export const metadata: Metadata = { title: 'Admin — outreach', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/* Contact-discovery providers. Deliberately links, not an integration: the lookup
   is paid and per-domain, so it is run by a human against the shortlist below with
   a spend cap, never swept across the whole corpus. */
const PROVIDERS = [
  { name: 'Hunter.io', href: 'https://hunter.io/domain-search', note: 'domain search + confidence score; best measured accuracy (~90%)' },
  { name: 'Dropcontact', href: 'https://www.dropcontact.com', note: 'stores no database, computes in real time — use this for any EU target' },
  { name: 'Findymail', href: 'https://findymail.com', note: 'charges only for verified hits, so a miss costs nothing' },
  { name: 'MillionVerifier', href: 'https://millionverifier.com', note: 'verify before sending; bounces are what burn a domain' },
  { name: 'Instantly', href: 'https://instantly.ai', note: 'sending + warmup — from a SECONDARY domain, never pivothop.com' },
];

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

function TargetRow({ r }: { r: Row }) {
  const st = r.state?.status ?? 'new';
  return (
    <article className={`otr-row status-${st}${r.mail_ok ? '' : ' otr-nomail'}`}>
      <div className="otr-main">
        <div className="otr-id">
          <span className="otr-score">{Math.round(r.score)}</span>
          <h2>{r.company}</h2>
          <span className="lbl">
            {r.adjacent_roles} adjacent of {r.open_roles} open · {r.days_open}d ·{' '}
            {r.country_known ? r.countries.join(' ') : 'country unknown'}
            {r.staffing ? ' · staffing' : ''}
          </span>
        </div>
        <OutreachControl r={r} />
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
          ? r.domain_candidates.map((d) => (
              <a key={d} href={`https://hunter.io/search/${d}`} target="_blank" rel="noopener noreferrer">{d}</a>
            )).reduce((a, b) => <>{a}{' · '}{b}</>)
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

export default async function Outreach() {
  const { rows, error } = await readOutreach();
  const done = rows.filter((r) => r.state && r.state.status !== 'new').length;
  const contacted = rows.filter((r) => r.state?.status === 'contacted' || r.state?.status === 'replied').length;

  return (
    <div className="adm">
      <header className="adm-head">
        <h1>Outreach</h1>
        <span className="lbl">
          {meta.scored.toLocaleString()} scored · {meta.emitted.toLocaleString()} listed · {done} touched · {contacted} contacted
        </span>
      </header>

      <nav className="otr-nav">
        <Link href="/admin">← Submissions</Link>
        <span className="lbl">list built {meta.generated}</span>
      </nav>

      {error === 'not-configured' && (
        <p className="adm-note">
          Read-only: the target list is a build artefact, but status won&rsquo;t save until <b>SUPABASE_URL</b> and{' '}
          <b>SUPABASE_SERVICE_KEY</b> are set and migration <b>0007_outreach.sql</b> has been applied.
        </p>
      )}
      {error && error !== 'not-configured' && <p className="adm-note">Status unavailable ({error}) — the list below still works.</p>}
      {rows.length === 0 && (
        <p className="adm-note">
          No targets built yet. Run <b>python3 apps/scraper/scripts/build-outreach-targets.py</b> from the repo root
          (the nightly does this automatically before the web build).
        </p>
      )}

      <section className="otr-rules">
        <h2>Rules — read once, then follow them</h2>
        <ol>
          <li><b>Never send from pivothop.com.</b> Buy a secondary domain and warm it for 2–3 weeks. A spam complaint against the sending domain takes the board&rsquo;s transactional mail down with it.</li>
          <li><b>Germany and Canada are off.</b> UWG §7 and CASL require prior consent for B2B email — up to €300,000 and CAD $10M. Rows sourced only from those countries are locked in this console and cannot be queued.</li>
          <li><b>Every send needs a real postal address and a working unsubscribe.</b> CAN-SPAM is $53,088 per email and there is no B2B exemption.</li>
          <li><b>Verify before sending.</b> Bounces are what kill deliverability. Keep complaints under 0.3%.</li>
          <li><b>Volume is the enemy.</b> Work the top of this list — tens per day, not thousands. The pitch only works because it is specific.</li>
          <li><b>Claim before you write.</b> Set status to <i>queued</i> and put your name in <i>owner</i>, so the two of us never email the same company twice.</li>
          <li><b>Never mail an accommodations@ or privacy@ address.</b> Those are statutory ADA and data-subject channels; pitching them generates complaints faster than anything else.</li>
        </ol>
      </section>

      <section className="otr-prov">
        <h2>Contact discovery</h2>
        <p className="adm-note">
          The corpus has company names and public posting URLs — no personal emails ({meta.scored.toLocaleString()} companies
          scored, {meta.blocked.toLocaleString()} consent-blocked). Finding a person is a paid, per-domain lookup. Run it on the
          top of this list with a monthly cap, not across the corpus.
        </p>
        <ul>
          {PROVIDERS.map((p) => (
            <li key={p.name}>
              <a href={p.href} target="_blank" rel="noopener noreferrer">{p.name}</a>
              <span className="lbl">{p.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="otr-list">
        {rows.map((r) => <TargetRow key={r.key} r={r} />)}
      </div>
    </div>
  );
}
