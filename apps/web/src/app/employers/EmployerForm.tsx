'use client';
import { useState } from 'react';

/* Founding-list capture. No backend, no CRM: composes one email in the
   visitor's own mail client. The list is the product until the board opens. */
export function EmployerForm() {
  const [f, setF] = useState({ company: '', name: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });
  const ready = f.company.trim().length > 1;

  function send() {
    const subject = `Founding employer: ${f.company}`;
    const body = [
      `Company: ${f.company}`,
      f.name ? `Name: ${f.name}` : '',
      '',
      'We want a founding spot on the adjacent-talent board.',
      '',
      'Optional, if you want the free adjacency map now: paste the role title and two sentences about it below.',
      '',
    ].join('\n');
    window.location.href = `mailto:cvinocoura@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="emp-form">
      <div className="ef-row2">
        <label className="ef-field"><span className="lbl">Company</span>
          <input value={f.company} onChange={set('company')} autoComplete="organization" /></label>
        <label className="ef-field"><span className="lbl">Your name (optional)</span>
          <input value={f.name} onChange={set('name')} autoComplete="name" /></label>
      </div>
      <button className="ef-send" disabled={!ready} onClick={send}>
        <span>Claim a founding spot</span>
        <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg>
      </button>
      <p className="ef-note">
        This opens one prefilled email in your own mail app. No form backend, no CRM,
        no list beyond the founding roster itself. You get one email when the board
        opens and nothing else. Prefer writing directly?{' '}
        <a href="mailto:cvinocoura@gmail.com">cvinocoura@gmail.com</a>.
      </p>
    </div>
  );
}
