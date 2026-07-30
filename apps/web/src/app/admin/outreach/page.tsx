import type { Metadata } from 'next';
import Link from 'next/link';
import { readOutreach, meta } from './data';
import { OutreachBoard } from './OutreachBoard';

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

export default async function Outreach() {
  const { rows, curated, manual, error } = await readOutreach();
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
        <Link href="/admin/research">Competitor research →</Link>
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

      <details className="otr-rules">
        <summary><h2>Rules — read once, then follow them</h2></summary>
        <ol>
          <li><b>Never send from pivothop.com.</b> Buy a secondary domain and warm it for 2–3 weeks. A spam complaint against the sending domain takes the board&rsquo;s transactional mail down with it.</li>
          <li><b>Germany and Canada are off.</b> UWG §7 and CASL require prior consent for B2B email — up to €300,000 and CAD $10M. Rows sourced only from those countries are locked in this console and cannot be queued.</li>
          <li><b>Every send needs a real postal address and a working unsubscribe.</b> CAN-SPAM is $53,088 per email and there is no B2B exemption.</li>
          <li><b>Verify before sending.</b> Bounces are what kill deliverability. Keep complaints under 0.3%.</li>
          <li><b>Volume is the enemy.</b> Work the top of this list — tens per day, not thousands. The pitch only works because it is specific.</li>
          <li><b>Claim before you write.</b> Set status to <i>queued</i> and put your name in <i>owner</i>, so the two of us never email the same company twice.</li>
          <li><b>Never mail an accommodations@ or privacy@ address.</b> Those are statutory ADA and data-subject channels; pitching them generates complaints faster than anything else.</li>
        </ol>
      </details>

      <details className="otr-prov">
        <summary><h2>Contact discovery</h2></summary>
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
      </details>

      <OutreachBoard rows={rows} curated={curated} manual={manual} />
    </div>
  );
}
