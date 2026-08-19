import type { Metadata } from 'next';
import Link from 'next/link';
import { queue } from '../../../lib/social/store';
import { RowControls, ReplacementButton } from './QueueControls';

export const metadata: Metadata = { title: 'Admin | social queue', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/* The social queue console (docs/35). Drafts wait here for approval; approved
   rows appear in the Zapier feed; consumed rows show as published. */

const dt = (s: string | null) => (s ? new Date(s).toLocaleString('en-US', { timeZone: 'America/Costa_Rica', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '');

export default async function SocialQueuePage() {
  const rows = await queue(60);
  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui' }}>
      <p style={{ marginBottom: 6 }}><Link href="/admin">&larr; admin</Link></p>
      <h1 style={{ fontSize: 26, marginBottom: 4 }}>Social queue</h1>
      <p style={{ opacity: 0.75, marginBottom: 8 }}>
        Cron selects into <b>draft</b> &middot; Approve moves to <b>scheduled</b> &middot; Zapier
        publishes scheduled items and burns them to <b>published</b>. Expired jobs are dropped
        from the feed automatically.
      </p>
      <p style={{ marginBottom: 22 }}><ReplacementButton /></p>
      {rows.length === 0 && <p>Queue is empty. The next cron tick (08:45, 12:45, 16:45 Costa Rica) will select one, or queue a replacement above.</p>}
      {rows.map((r) => (
        <div key={r.id} style={{ border: '1px solid #ccc', padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <b>{r.job_title} · {r.job_company}</b>
            <span>
              <code style={{ marginRight: 10 }}>{r.status}</code>
              score {r.selection_score} &middot; {dt(r.scheduled_at)}
            </span>
          </div>
          <p style={{ opacity: 0.75, margin: '6px 0' }}>why: {r.selection_reason} &middot; pub id <code>ph-li-{r.id}</code>
            {r.external_post_id && <> &middot; <a href={r.external_post_id}>posted</a></>}
            {r.last_error && <> &middot; <span style={{ color: '#a00' }}>{r.last_error}</span></>}
          </p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f5f1', padding: 12, fontSize: 13 }}>{r.generated_copy}</pre>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <RowControls id={r.id} status={r.status} occ={r.job_occ} jobId={r.job_id} variant={r.template_variant} />
            <a href={`/jobs/${r.job_occ}/${r.job_id}`} target="_blank" rel="noreferrer">preview listing &rarr;</a>
          </div>
        </div>
      ))}
    </main>
  );
}
