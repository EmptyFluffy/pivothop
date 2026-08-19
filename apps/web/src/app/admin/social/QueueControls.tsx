'use client';
import { useState, useTransition } from 'react';
import { approvePost, skipPost, regeneratePost, queueReplacement } from './actions';

export function RowControls({ id, status, occ, jobId, variant }: { id: number; status: string; occ: string; jobId: string; variant: number }) {
  const [pending, start] = useTransition();
  return (
    <span style={{ display: 'inline-flex', gap: 8 }}>
      {status === 'draft' && (
        <button disabled={pending} onClick={() => start(async () => { await approvePost(id); })}>Approve</button>
      )}
      {(status === 'draft' || status === 'scheduled') && (
        <>
          <button disabled={pending} onClick={() => start(async () => { await skipPost(id); })}>Skip</button>
          <button disabled={pending} onClick={() => start(async () => { await regeneratePost(id, occ, jobId, variant); })}>Regenerate</button>
        </>
      )}
    </span>
  );
}

export function ReplacementButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState('');
  return (
    <span>
      <button disabled={pending} onClick={() => start(async () => {
        const r = await queueReplacement();
        setMsg(r.ok ? `queued: ${r.picked}` : 'no eligible candidate');
      })}>Queue a replacement now</button>
      {msg && <span style={{ marginLeft: 10, opacity: 0.7 }}>{msg}</span>}
    </span>
  );
}
