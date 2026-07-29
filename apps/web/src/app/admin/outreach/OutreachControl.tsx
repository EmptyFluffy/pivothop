'use client';
import { useState } from 'react';
import { setOutreach } from './actions';
import type { Row } from './data';

const STATUSES = ['new', 'queued', 'contacted', 'replied', 'won', 'declined', 'skip'];

/* Per-target controls: status, owner, and the note that carries what was actually
   said. Optimistic — the select moves immediately and the write follows, because a
   round trip per row makes working a 1,200-row queue unbearable.

   mail_ok=false disables the whole control rather than warning: Germany (UWG s7)
   and Canada (CASL) require prior consent for B2B email, so a company posting only
   from there is not a decision the operator should be able to get wrong in a hurry. */
export function OutreachControl({ r }: { r: Row }) {
  const [status, setStatus] = useState(r.state?.status ?? 'new');
  const [owner, setOwner] = useState(r.state?.owner ?? '');
  const [note, setNote] = useState(r.state?.note ?? '');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  async function save(patch: Parameters<typeof setOutreach>[2]) {
    setSaving(true);
    await setOutreach(r.key, r.company, patch);
    setSaving(false);
  }

  if (!r.mail_ok) {
    return (
      <div className="otr-ctl">
        <span className="otr-blocked" title="Prior consent required in every country this company posts from">
          consent required
        </span>
      </div>
    );
  }

  return (
    <div className="otr-ctl">
      <label className="adm-status">
        <select
          value={status}
          disabled={saving}
          onChange={(e) => { const v = e.target.value; setStatus(v); void save({ status: v }); }}
        >
          {STATUSES.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
      <button type="button" className="otr-more" onClick={() => setOpen(!open)}>
        {open ? 'less' : 'note'}
      </button>
      {saving && <span className="adm-saving">saving…</span>}
      {open && (
        <div className="otr-fields">
          <input
            type="text" placeholder="owner" value={owner}
            onChange={(e) => setOwner(e.target.value)}
            onBlur={() => void save({ owner })}
          />
          <textarea
            rows={2} placeholder="what was sent / what came back" value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => void save({ note })}
          />
        </div>
      )}
    </div>
  );
}
