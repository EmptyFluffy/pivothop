'use client';
import { useMemo, useState } from 'react';

/* Post-a-role wizard (docs/08 revised). Progressive disclosure across four
   short steps, fields per job-posting standards: role basics (title, type,
   location, remote, pay) -> the posting (summary, responsibilities,
   qualifications, benefits) -> the company -> review. The right rail shows the
   listing live plus the adjacency fan-in for the matched occupation.
   No backend yet: send composes one structured email, reviewed by hand within
   two days. When Supabase lands, the same fields post to a table. */

export type FanIn = { n: number; top: { t: string; m: number }[]; live: number };
type Occ = { slug: string; title: string; syn: string[] };

const TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const STEPS = ['The role', 'The posting', 'The company', 'Send'];

export function EmployerForm({ occs, fan }: { occs: Occ[]; fan: Record<string, FanIn> }) {
  const [step, setStep] = useState(1);
  const [f, setF] = useState({
    role: '', etype: 'Full-time', location: '', salary: '', link: '',
    about: '', resp: '', quals: '', benefits: '',
    company: '', email: '', name: '',
  });
  const [remote, setRemote] = useState(false);
  const [occSlug, setOccSlug] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
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
  const step3ok = f.company.trim().length > 1 && /.+@.+\..+/.test(f.email);

  function send() {
    const subject = `Post a role: ${f.role} at ${f.company}`;
    const body = [
      `Company: ${f.company}`,
      `Work email: ${f.email}`,
      f.name ? `Contact: ${f.name}` : '',
      '',
      `Role: ${f.role}`,
      occ ? `Occupation match: ${occ.title} (${occ.slug})` : 'Occupation match: (unmatched)',
      `Type: ${f.etype}`,
      `Location: ${f.location || (remote ? 'Remote' : '(not stated)')}`,
      `Remote: ${remote ? 'yes' : 'no / hybrid / on-site'}`,
      f.salary ? `Salary band: ${f.salary}` : 'Salary band: (not stated)',
      f.link ? `Apply link: ${f.link}` : 'Apply link: (none yet)',
      f.about ? `\nAbout the role:\n${f.about}` : '',
      f.resp ? `\nResponsibilities:\n${f.resp}` : '',
      f.quals ? `\nQualifications:\n${f.quals}` : '',
      f.benefits ? `\nBenefits:\n${f.benefits}` : '',
      '',
      'Requesting the free first featured month.',
    ].join('\n');
    window.location.href = `mailto:cvinocoura@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="ew">
      <div className="ew-main">
        <div className="ew-steps lbl" aria-label="Steps">
          {STEPS.map((label, i) => (
            <span key={label} className={`ew-step${step === i + 1 ? ' on' : ''}${step > i + 1 ? ' done' : ''}`}>
              0{i + 1} {label}
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
              <label className="ef-field"><span className="lbl">Employment type</span>
                <select value={f.etype} onChange={set('etype')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
              <label className="ef-field ef-check"><span className="lbl">Fully remote</span>
                <button type="button" className={`jb-toggle${remote ? ' on' : ''}`} aria-pressed={remote} onClick={() => setRemote((v) => !v)}>{remote ? 'Yes' : 'No'}</button></label>
            </div>
            <div className="ef-row2">
              <label className="ef-field"><span className="lbl">{remote ? 'Hiring region (optional)' : 'Location'}</span>
                <input value={f.location} onChange={set('location')} placeholder={remote ? 'e.g. US time zones' : 'e.g. Austin, TX'} /></label>
              <label className="ef-field"><span className="lbl">Salary band</span>
                <input value={f.salary} onChange={set('salary')} placeholder="e.g. $95k–$130k" /></label>
            </div>
            <p className="ew-hint lbl">Listings that state pay rank higher on the board.</p>
            <button className="ef-send" disabled={!step1ok} onClick={() => setStep(2)}><span>Next: the posting</span></button>
          </div>
        )}

        {step === 2 && (
          <div className="ew-panel">
            <label className="ef-field"><span className="lbl">About the role, two or three sentences</span>
              <textarea rows={3} value={f.about} onChange={set('about')} placeholder="What the role is and why it exists." /></label>
            <label className="ef-field"><span className="lbl">Responsibilities, one per line</span>
              <textarea rows={4} value={f.resp} onChange={set('resp')} placeholder={'Own the reporting pipeline\nRun the weekly planning'} /></label>
            <label className="ef-field"><span className="lbl">Qualifications, one per line</span>
              <textarea rows={4} value={f.quals} onChange={set('quals')} placeholder={'3+ years with SQL\nNice to have: dbt'} /></label>
            <label className="ef-field"><span className="lbl">Benefits (optional)</span>
              <textarea rows={2} value={f.benefits} onChange={set('benefits')} /></label>
            <div className="ew-nav">
              <button type="button" className="ew-back" onClick={() => setStep(1)}>&larr; Back</button>
              <button className="ef-send" onClick={() => setStep(3)}><span>Next: the company</span></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="ew-panel">
            <div className="ef-row2">
              <label className="ef-field"><span className="lbl">Company</span>
                <input value={f.company} onChange={set('company')} autoComplete="organization" autoFocus /></label>
              <label className="ef-field"><span className="lbl">Work email</span>
                <input type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
            </div>
            <div className="ef-row2">
              <label className="ef-field"><span className="lbl">Your name (optional)</span>
                <input value={f.name} onChange={set('name')} autoComplete="name" /></label>
              <label className="ef-field"><span className="lbl">Apply link (optional)</span>
                <input value={f.link} onChange={set('link')} placeholder="https://" inputMode="url" /></label>
            </div>
            <div className="ew-nav">
              <button type="button" className="ew-back" onClick={() => setStep(2)}>&larr; Back</button>
              <button className="ef-send" disabled={!step3ok} onClick={() => setStep(4)}><span>Next: review and send</span></button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="ew-panel">
            <ul className="ew-review">
              <li><span className="lbl">Role</span><span>{f.role}{occ ? ` · ${occ.title}` : ''} · {f.etype}</span></li>
              <li><span className="lbl">Where</span><span>{remote ? 'Fully remote' : f.location || 'On-site or hybrid'}{remote && f.location ? ` · ${f.location}` : ''}</span></li>
              <li><span className="lbl">Pay</span><span>{f.salary || 'Not stated'}</span></li>
              <li><span className="lbl">Posting</span><span>{[f.about && 'about', f.resp && 'responsibilities', f.quals && 'qualifications', f.benefits && 'benefits'].filter(Boolean).join(', ') || 'to be added in review'}</span></li>
              <li><span className="lbl">Company</span><span>{f.company} · {f.email}</span></li>
              {f.link && <li><span className="lbl">Apply at</span><span>{f.link}</span></li>}
            </ul>
            <div className="ew-nav">
              <button type="button" className="ew-back" onClick={() => setStep(3)}>&larr; Back</button>
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
        <div>
          <span className="lbl ew-rail-cap">How it will look</span>
          <div className="job-card ew-preview">
            <span className="job-main">
              <span className="job-t">{f.role.trim() || 'Your role title'}</span>
              <span className="job-co">{f.company.trim() || 'Your company'}{(remote || f.location) ? <span className="job-loc"> · {remote ? 'Remote' : f.location}</span> : null}</span>
            </span>
            <span className="job-side">
              {f.salary.trim() && <span className="job-pay">{f.salary.trim()}</span>}
              <span className="job-m lbl"><span className="job-tag">Featured</span></span>
            </span>
          </div>
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
