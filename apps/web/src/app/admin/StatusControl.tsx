'use client';
import { useState } from 'react';
import { updateStatus } from './actions';

const STATUSES = ['new', 'reviewing', 'posted', 'declined'];

export function StatusControl({ id, status }: { id: number; status: string }) {
  const [s, setS] = useState(status);
  const [saving, setSaving] = useState(false);
  return (
    <label className="adm-status">
      <select
        value={s}
        disabled={saving}
        onChange={async (e) => {
          const v = e.target.value;
          setS(v);
          setSaving(true);
          await updateStatus(id, v);
          setSaving(false);
        }}
      >
        {STATUSES.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {saving && <span className="adm-saving">saving…</span>}
    </label>
  );
}
