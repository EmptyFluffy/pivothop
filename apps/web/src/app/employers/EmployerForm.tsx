'use client';
import { useState } from 'react';

/* Post-a-role capture (docs/08 revised). No backend yet: composes one
   structured email in the visitor's own mail client; reviewed by hand within
   two days. When Supabase lands, this posts to a table + notification instead
   — same fields, same journey. */
export function EmployerForm() {
  const [f, setF] = useState({ company: '', email: '', name: '', role: '', link: '', salary: '', pitch: '' });
  const [remote, setRemote] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });
  const ready = f.company.trim().length > 1 && f.role.trim().length > 1 && /.+@.+\..+/.test(f.email);

  function send() {
    const subject = `Post a role: ${f.role} at ${f.company}`;
    const body = [
      `Company: ${f.company}`,
      `Work email: ${f.email}`,
      f.name ? `Contact: ${f.name}` : '',
      '',
      `Role: ${f.role}`,
      f.link ? `Apply link: ${f.link}` : 'Apply link: (none yet)',
      f.salary ? `Salary band: ${f.salary}` : 'Salary band: (not stated)',
      `Remote: ${remote ? 'yes' : 'no / hybrid / on-site'}`,
      '',
      f.pitch ? `About the role:\n${f.pitch}` : '',
      '',
      'Requesting the free first featured month.',
    ].join('\n');
    window.location.href = `mailto:cvinocoura@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="emp-form">
      <div className="ef-row2">
        <label className="ef-field"><span className="lbl">Company</span>
          <input value={f.company} onChange={set('company')} autoComplete="organization" /></label>
        <label className="ef-field"><span className="lbl">Work email</span>
          <input type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
      </div>
      <div className="ef-row2">
        <label className="ef-field"><span className="lbl">Role title</span>
          <input value={f.role} onChange={set('role')} placeholder="e.g. Product designer" /></label>
        <label className="ef-field"><span className="lbl">Apply link (optional)</span>
          <input value={f.link} onChange={set('link')} placeholder="https://" inputMode="url" /></label>
      </div>
      <div className="ef-row2">
        <label className="ef-field"><span className="lbl">Salary band (optional, listings with pay rank higher)</span>
          <input value={f.salary} onChange={set('salary')} placeholder="e.g. $95k–$130k" /></label>
        <label className="ef-field ef-check"><span className="lbl">Fully remote</span>
          <button type="button" className={`jb-toggle${remote ? ' on' : ''}`} aria-pressed={remote} onClick={() => setRemote((v) => !v)}>{remote ? 'Yes' : 'No'}</button></label>
      </div>
      <label className="ef-field"><span className="lbl">About the role, two sentences (optional)</span>
        <textarea rows={3} value={f.pitch} onChange={set('pitch')} /></label>
      <button className="ef-send" disabled={!ready} onClick={send}>
        <span>Post the role, first month featured free</span>
        <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg>
      </button>
      <p className="ef-note">
        This opens one prefilled email in your own mail app; submissions are reviewed by hand and
        listed within two days. No form backend, no CRM, no drip sequence. Already listed from your
        careers page? Say so and we mark it claimed. Prefer writing directly?{' '}
        <a href="mailto:cvinocoura@gmail.com">cvinocoura@gmail.com</a>.
      </p>
    </div>
  );
}
