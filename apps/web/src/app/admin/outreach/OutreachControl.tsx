'use client';
import { useState } from 'react';
import { setOutreach } from './actions';

const STATUSES = ['new', 'queued', 'contacted', 'replied', 'won', 'declined', 'skip'];

/* Per-target controls: status, owner, and the note that carries what was actually
   said. Optimistic — the select moves immediately and the write follows, because a
   round trip per row makes working a 1,200-row queue unbearable.

   Takes the minimal shape rather than a full employer Row so the curated targets
   (launch boards, press, backlink orgs — phases 2-3) share the same control and
   the same Supabase table; their keys are namespaced "cur:<slug>".

   mailOk=false disables the whole control rather than warning: Germany (UWG s7)
   and Canada (CASL) require prior consent for B2B email, so a company posting only
   from there is not a decision the operator should be able to get wrong in a hurry. */
export function OutreachControl({ id, company, mailOk, state, onStatus }: {
  id: string;
  company: string;
  mailOk: boolean;
  state: { status?: string; owner?: string | null; note?: string | null } | null;
  onStatus?: (s: string) => void;
}) {
  const [status, setStatus] = useState(state?.status ?? 'new');
  const [owner, setOwner] = useState(state?.owner ?? '');
  const [note, setNote] = useState(state?.note ?? '');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  async function save(patch: Parameters<typeof setOutreach>[2]) {
    setSaving(true);
    await setOutreach(id, company, patch);
    setSaving(false);
  }

  if (!mailOk) {
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
          onChange={(e) => { const v = e.target.value; setStatus(v); onStatus?.(v); void save({ status: v }); }}
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
