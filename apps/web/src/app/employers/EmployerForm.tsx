'use client';
import { useState } from 'react';

/* V0 capture per docs/08: no backend, no marketing list, no automation. The form
   composes a personal email in the visitor's own mail client. The conversation
   IS the product at this stage. */
export function EmployerForm() {
  const [f, setF] = useState({ name: '', company: '', role: '', challenge: '', linkedin: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  const ready = f.name.trim() && f.company.trim() && f.role.trim();

  function send() {
    const subject = `Hiring for ${f.role.slice(0, 60)} at ${f.company}`;
    const body = [
      `Name: ${f.name}`,
      `Company: ${f.company}`,
      '',
      `Role we are hiring for:`,
      f.role,
      '',
      `Biggest challenge filling it:`,
      f.challenge || '(not stated)',
      f.linkedin ? `\nLinkedIn: ${f.linkedin}` : '',
    ].join('\n');
    window.location.href = `mailto:cvinocoura@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="emp-form">
      <div className="ef-row2">
        <label className="ef-field"><span className="lbl">Your name</span>
          <input value={f.name} onChange={set('name')} autoComplete="name" /></label>
        <label className="ef-field"><span className="lbl">Company</span>
          <input value={f.company} onChange={set('company')} autoComplete="organization" /></label>
      </div>
      <label className="ef-field"><span className="lbl">The role you are hiring for</span>
        <textarea rows={2} value={f.role} onChange={set('role')} placeholder="One or two sentences. Title plus what actually matters." /></label>
      <label className="ef-field"><span className="lbl">Biggest challenge filling it</span>
        <textarea rows={2} value={f.challenge} onChange={set('challenge')} placeholder="Optional, but this is the part Carlos reads twice." /></label>
      <label className="ef-field"><span className="lbl">LinkedIn (optional)</span>
        <input value={f.linkedin} onChange={set('linkedin')} placeholder="https://linkedin.com/in/..." /></label>
      <button className="ef-send" disabled={!ready} onClick={send}>
        <span>Open the email</span>
        <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg>
      </button>
      <p className="ef-note">
        This opens a prefilled email in your own mail app, addressed to Carlos. No
        form backend, no CRM, no list. If you prefer, write directly to{' '}
        <a href="mailto:cvinocoura@gmail.com">cvinocoura@gmail.com</a>.
      </p>
    </div>
  );
}
