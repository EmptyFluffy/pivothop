'use client';
import { useMemo, useState } from 'react';

/* Post-a-role wizard (docs/08 revised). Progressive disclosure: three short
   steps beat one long form. The right rail shows the listing as candidates
   will see it, live, plus the adjacency fan-in for the matched occupation —
   the "who will see this" evidence no other board can render.
   No backend yet: step three composes one structured email in the visitor's
   own mail client, reviewed by hand within two days. When Supabase lands,
   the same fields post to a table + notification instead. */

export type FanIn = { n: number; top: { t: string; m: number }[]; live: number };
type Occ = { slug: string; title: string; syn: string[] };

export function EmployerForm({ occs, fan }: { occs: Occ[]; fan: Record<string, FanIn> }) {
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ role: '', link: '', salary: '', company: '', email: '', name: '', pitch: '' });
  const [remote, setRemote] = useState(false);
  const [occSlug, setOccSlug] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  // Match the free-text role title to our occupations (title + synonyms), live.
  const suggestions = useMemo(() => {
    const q = f.role.trim().toLowerCase();
    if (q.length < 3) return [];
    const scored = occs.map((o) => {
      const hay = [o.title.toLowerCase(), ...o.syn].join(' ');
      let s = 0;
      for (const tok of q.split(/\s+/)) {
        if (!tok) continue;
        if (hay.includes(tok)) s += tok.length;
        else if (hay.split(/\s+/).some((w) => w.startsWith(tok) || (tok.length >= 4 && tok.startsWith(w)))) s += 2;
      }
      return { o, s };
    }).filter((x) => x.s > 2).sort((a, b) => b.s - a.s).slice(0, 3);
    return scored.map((x) => x.o);
  }, [f.role, occs]);
  const occ = occs.find((o) => o.slug === occSlug) ?? null;
  const info = occSlug ? fan[occSlug] : undefined;

  const step1ok = f.role.trim().length > 1;
  const step2ok = f.company.trim().length > 1 && /.+@.+\..+/.test(f.email);

  function send() {
    const subject = `Post a role: ${f.role} at ${f.company}`;
    const body = [
      `Company: ${f.company}`,
      `Work email: ${f.email}`,
      f.name ? `Contact: ${f.name}` : '',
      '',
      `Role: ${f.role}`,
      occ ? `Occupation match: ${occ.title} (${occ.slug})` : 'Occupation match: (unmatched)',
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
    <div className="ew">
      <div className="ew-main">
        <div className="ew-steps lbl" aria-label="Steps">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`ew-step${step === n ? ' on' : ''}${step > n ? ' done' : ''}`}>
              0{n} {n === 1 ? 'The role' : n === 2 ? 'The company' : 'Send'}
            </span>
          ))}
        </div>

        {step === 1 && (
          <div className="ew-panel">
            <label className="ef-field"><span className="lbl">Role title</span>
              <input value={f.role} onChange={(e) => { set('role')(e); setOccSlug(''); }} placeholder="e.g. Senior product designer" autoFocus /></label>
            {suggestions.length > 0 && (
              <div className="ew-suggest">
                <span className="lbl">Closest occupation on the graph</span>
                <div className="ew-chips">
                  {suggestions.map((o) => (
                    <button key={o.slug} type="button" className={`ew-chip${occSlug === o.slug ? ' on' : ''}`} onClick={() => setOccSlug(o.slug)}>{o.title}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="ef-row2">
              <label className="ef-field"><span className="lbl">Salary band (listings with pay rank higher)</span>
                <input value={f.salary} onChange={set('salary')} placeholder="e.g. $95k–$130k" /></label>
              <label className="ef-field ef-check"><span className="lbl">Fully remote</span>
                <button type="button" className={`jb-toggle${remote ? ' on' : ''}`} aria-pressed={remote} onClick={() => setRemote((v) => !v)}>{remote ? 'Yes' : 'No'}</button></label>
            </div>
            <label className="ef-field"><span className="lbl">Apply link (optional)</span>
              <input value={f.link} onChange={set('link')} placeholder="https://" inputMode="url" /></label>
            <button className="ef-send" disabled={!step1ok} onClick={() => setStep(2)}><span>Next: the company</span></button>
          </div>
        )}

        {step === 2 && (
          <div className="ew-panel">
            <div className="ef-row2">
              <label className="ef-field"><span className="lbl">Company</span>
                <input value={f.company} onChange={set('company')} autoComplete="organization" autoFocus /></label>
              <label className="ef-field"><span className="lbl">Work email</span>
                <input type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
            </div>
            <label className="ef-field"><span className="lbl">Your name (optional)</span>
              <input value={f.name} onChange={set('name')} autoComplete="name" /></label>
            <label className="ef-field"><span className="lbl">About the role, two sentences (optional)</span>
              <textarea rows={3} value={f.pitch} onChange={set('pitch')} /></label>
            <div className="ew-nav">
              <button type="button" className="ew-back" onClick={() => setStep(1)}>&larr; Back</button>
              <button className="ef-send" disabled={!step2ok} onClick={() => setStep(3)}><span>Next: review and send</span></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="ew-panel">
            <ul className="ew-review">
              <li><span className="lbl">Role</span><span>{f.role}{occ ? ` · ${occ.title}` : ''}</span></li>
              <li><span className="lbl">Pay</span><span>{f.salary || 'Not stated'}</span></li>
              <li><span className="lbl">Remote</span><span>{remote ? 'Fully remote' : 'On-site or hybrid'}</span></li>
              <li><span className="lbl">Company</span><span>{f.company} · {f.email}</span></li>
              {f.link && <li><span className="lbl">Apply at</span><span>{f.link}</span></li>}
            </ul>
            <div className="ew-nav">
              <button type="button" className="ew-back" onClick={() => setStep(2)}>&larr; Back</button>
              <button className="ef-send" onClick={send}>
                <span>Post the role, first month featured free</span>
                <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg>
              </button>
            </div>
            <p className="ef-note">
              This opens one prefilled email in your own mail app; reviewed by hand and listed within two days.
              No form backend, no CRM, no drip sequence. Already listed from your careers page? Say so and we
              mark it claimed. Prefer writing directly? <a href="mailto:cvinocoura@gmail.com">cvinocoura@gmail.com</a>.
            </p>
          </div>
        )}
      </div>

      <aside className="ew-rail" aria-label="Listing preview">
        <span className="lbl ew-rail-cap">How it will look</span>
        <div className="job-card ew-preview">
          <span className="job-main">
            <span className="job-t">{f.role.trim() || 'Your role title'}</span>
            <span className="job-co">{f.company.trim() || 'Your company'}{remote ? <span className="job-loc"> · Remote</span> : null}</span>
          </span>
          <span className="job-side">
            {f.salary.trim() && <span className="job-pay">{f.salary.trim()}</span>}
            <span className="job-m lbl"><span className="job-tag">Featured</span></span>
          </span>
        </div>
        {occ && (
          <div className="ew-fan">
            <span className="lbl ew-rail-cap">Who will see it</span>
            {info && info.n > 0 ? (
              <>
                <p className="ew-fan-lead">{`${occ.title} sits on ${info.n} measured route${info.n === 1 ? '' : 's'} in our skill graph. Your listing is shown on each of them, to candidates arriving with the gap already itemized:`}</p>
                <ul className="ew-fan-list">
                  {info.top.map((x) => (
                    <li key={x.t}><span>{x.t} &rarr; {occ.title}</span><span className="lbl">{x.m}% readiness</span></li>
                  ))}
                </ul>
                {info.live > 0 && <p className="ew-fan-note lbl">{`Joins ${info.live} live ${occ.title.toLowerCase()} listings, featured above all of them.`}</p>}
              </>
            ) : (
              <p className="ew-fan-lead">{`${occ.title} listings appear on its board, its salary page, and everywhere the instrument ranks it for a candidate's skills.`}</p>
            )}
          </div>
        )}
        {!occ && <p className="ew-fan-note lbl">Name the role and pick the closest occupation to see exactly who it reaches.</p>}
      </aside>
    </div>
  );
}
