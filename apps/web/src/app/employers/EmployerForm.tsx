'use client';
import { useMemo, useState } from 'react';
import { JobCard, type Job } from '../jobs/JobCard';

/* Post a job — the full page, second pass. One calm centered column in five
   numbered sections; the adjacency fan-in appears inline the moment the role
   matches an occupation (context where the action is, not in a far rail); and
   the preview is docked to the bottom of the viewport, rendered by the actual
   JobCard component the board uses — real by construction, updating as you
   type. Workplace is a three-way (on-site / hybrid / remote), employment type
   is a chip row, and the skills picker accepts custom skills our bank lacks.
   No backend yet: submit composes one structured email, reviewed by hand
   within two days. Fields map 1:1 to the future Supabase table. */

export type FanIn = { n: number; top: { t: string; m: number }[]; live: number };
type Occ = { slug: string; title: string; syn: string[] };
type Mode = 'onsite' | 'hybrid' | 'remote';

const TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const MODES: { key: Mode; label: string }[] = [
  { key: 'onsite', label: 'On-site' },
  { key: 'hybrid', label: 'Hybrid' },
  { key: 'remote', label: 'Remote' },
];
// Benefits worth surfacing. The first three map to the board's derived filter
// tags (candidates can filter on them); the rest render on the listing.
const BENEFITS = [
  'Equity', '4-day week', 'Visa sponsorship', 'Unlimited PTO',
  'Health insurance', '401(k) / pension', 'Learning budget', 'Home-office budget',
  'Async', 'Flexible hours', 'Company retreats', 'Profit sharing',
  'Parental leave', 'Equipment provided', 'No whiteboard interview',
];

const num = (v: string) => { const n = parseInt(v.replace(/[^0-9]/g, ''), 10); return Number.isFinite(n) && n > 0 ? n : null; };

export function EmployerForm({ occs, fan, skills }: { occs: Occ[]; fan: Record<string, FanIn>; skills: string[] }) {
  const [f, setF] = useState({
    role: '', region: '', smin: '', smax: '',
    about: '', resp: '', quals: '',
    company: '', logo: '', email: '', name: '', applyUrl: '', applyEmail: '',
  });
  const [etype, setEtype] = useState('Full-time');
  const [mode, setMode] = useState<Mode>('remote');
  const [occSlug, setOccSlug] = useState('');
  const [chosen, setChosen] = useState<string[]>([]);        // benefits
  const [skillList, setSkillList] = useState<string[]>([]);  // required skills (bank + custom)
  const [skillQ, setSkillQ] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  // Live occupation match (title + synonyms) — drives the inline fan-in panel.
  const suggestions = useMemo(() => {
    const q = f.role.trim().toLowerCase();
    if (q.length < 3) return [];
    return occs.map((o) => {
      const hay = [o.title.toLowerCase(), ...o.syn].join(' ');
      let s = 0;
      for (const tok of q.split(/\s+/)) {
        if (!tok) continue;
        if (hay.includes(tok)) s += tok.length;
        else if (hay.split(/\s+/).some((w) => w.startsWith(tok) || (tok.length >= 4 && tok.startsWith(w)))) s += 2;
      }
      return { o, s };
    }).filter((x) => x.s > 2).sort((a, b) => b.s - a.s).slice(0, 3).map((x) => x.o);
  }, [f.role, occs]);
  const occ = occs.find((o) => o.slug === occSlug) ?? null;
  const info = occSlug ? fan[occSlug] : undefined;

  // Skills: bank matches first; a custom entry is always offered when the
  // query isn't an exact bank skill, so no real requirement gets blocked.
  const q = skillQ.trim();
  const skillMatches = useMemo(() => {
    if (!q) return [];
    const ql = q.toLowerCase();
    return skills.filter((s) => s.toLowerCase().includes(ql) && !skillList.includes(s)).slice(0, 5);
  }, [q, skills, skillList]);
  const exactInBank = skillMatches.some((s) => s.toLowerCase() === q.toLowerCase());
  const canCustom = q.length > 1 && !exactInBank && !skillList.some((s) => s.toLowerCase() === q.toLowerCase());
  const addSkill = (s: string) => { const v = s.trim(); if (v && !skillList.includes(v)) setSkillList((p) => [...p, v]); setSkillQ(''); };
  const toggleBenefit = (b: string) => setChosen((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b]));

  // The preview job, fed to the board's real JobCard component.
  const location = mode === 'remote' ? (f.region.trim() || 'Remote')
    : mode === 'hybrid' ? (f.region.trim() ? `${f.region.trim()} · Hybrid` : 'Hybrid')
    : (f.region.trim() || '');
  const previewJob: Job = {
    id: 'preview', occ: occSlug || 'preview',
    title: f.role.trim() || 'Your role title',
    company: f.company.trim() || 'Your company',
    location, remote: mode === 'remote',
    smin: num(f.smin), smax: num(f.smax),
    source: 'employer', posted: '', featured: true,
    fl: chosen.includes('4-day week') ? ['4d'] : undefined,
  };

  const ok = f.role.trim().length > 1 && f.company.trim().length > 1 && /.+@.+\..+/.test(f.email) && (f.applyUrl.trim() !== '' || f.applyEmail.trim() !== '');
  const missing = [
    !f.role.trim() && 'a role title',
    !f.company.trim() && 'the company',
    !/.+@.+\..+/.test(f.email) && 'a work email',
    !(f.applyUrl.trim() || f.applyEmail.trim()) && 'where to apply',
  ].filter(Boolean);

  function send() {
    const modeLabel = MODES.find((m) => m.key === mode)!.label;
    const subject = `Post a job: ${f.role} at ${f.company}`;
    const body = [
      `Company: ${f.company}`,
      `Work email: ${f.email}`,
      f.name ? `Contact: ${f.name}` : '',
      f.logo ? `Logo: ${f.logo}` : '',
      '',
      `Role: ${f.role}`,
      occ ? `Occupation match: ${occ.title} (${occ.slug})` : 'Occupation match: (unmatched)',
      `Type: ${etype}`,
      `Workplace: ${modeLabel}${f.region ? ` — ${f.region}` : ''}`,
      (num(f.smin) || num(f.smax)) ? `Salary: ${f.smin || '—'} to ${f.smax || '—'} USD/yr` : 'Salary: (not stated)',
      skillList.length ? `Required skills: ${skillList.join(', ')}` : '',
      chosen.length ? `Benefits: ${chosen.join(', ')}` : '',
      f.applyUrl ? `Apply URL: ${f.applyUrl}` : '',
      f.applyEmail ? `Apply email: ${f.applyEmail}` : '',
      f.about ? `\nAbout the role:\n${f.about}` : '',
      f.resp ? `\nResponsibilities:\n${f.resp}` : '',
      f.quals ? `\nQualifications:\n${f.quals}` : '',
      '',
      'Requesting the free first featured month.',
    ].filter((l) => l !== '').join('\n');
    window.location.href = `mailto:cvinocoura@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <>
      <div className="ejf-form">
        {/* 01 — The role */}
        <section className="ejf-sec">
          <div className="ejf-sec-h"><span className="ejf-num">01</span><h2>The role</h2></div>
          <label className="ef-field"><span className="lbl">Role title</span>
            <input value={f.role} onChange={(e) => { set('role')(e); setOccSlug(''); }} placeholder="e.g. Senior Product Designer" autoFocus />
            <span className="ef-hint">One role, the way it reads on a listing. Posting several? One job per post.</span>
          </label>
          {suggestions.length > 0 && (
            <div className="ejf-suggest">
              <span className="lbl">Closest occupation on our graph{occ ? '' : ' — pick one to see who it reaches'}</span>
              <div className="ejf-chips">
                {suggestions.map((o) => (
                  <button key={o.slug} type="button" className={`ejf-chip${occSlug === o.slug ? ' on' : ''}`} onClick={() => setOccSlug(occSlug === o.slug ? '' : o.slug)}>{o.title}</button>
                ))}
              </div>
            </div>
          )}
          {occ && (
            <aside className="ejf-fanbox">
              {info && info.n > 0 ? (
                <>
                  <p className="ew-fan-lead">{`${occ.title} sits on ${info.n} measured route${info.n === 1 ? '' : 's'} in our skill graph. Your listing shows on each, to candidates arriving with the gap already itemized:`}</p>
                  <ul className="ew-fan-list">
                    {info.top.map((x) => (
                      <li key={x.t}><span>{x.t} &rarr; {occ.title}</span><span className="lbl">{x.m}% ready</span></li>
                    ))}
                  </ul>
                  {info.live > 0 && <p className="ew-fan-note lbl">{`Joins ${info.live} live ${occ.title.toLowerCase()} listings, featured above all of them.`}</p>}
                </>
              ) : (
                <p className="ew-fan-lead">{`${occ.title} listings appear on its board, its salary page, and everywhere the instrument ranks it for a candidate's skills.`}</p>
              )}
            </aside>
          )}
          <div className="ejf-block">
            <span className="lbl">Employment type</span>
            <div className="ejf-chips">
              {TYPES.map((t) => (
                <button key={t} type="button" className={`ejf-chip${etype === t ? ' on' : ''}`} onClick={() => setEtype(t)}>{t}</button>
              ))}
            </div>
          </div>
          <div className="ejf-block">
            <span className="lbl">Workplace</span>
            <div className="ejf-chips">
              {MODES.map((m) => (
                <button key={m.key} type="button" className={`ejf-chip${mode === m.key ? ' on' : ''}`} onClick={() => setMode(m.key)}>{m.label}</button>
              ))}
            </div>
          </div>
          <label className="ef-field"><span className="lbl">
            {mode === 'remote' ? 'Where can they work from?' : mode === 'hybrid' ? 'Where is the office?' : 'Location'}</span>
            <input value={f.region} onChange={set('region')} placeholder={mode === 'remote' ? 'e.g. Worldwide, or US time zones' : 'e.g. Austin, TX'} />
            <span className="ef-hint">{mode === 'remote' ? 'Worldwide reaches the most candidates and ranks higher. Narrow it only if you must.' : mode === 'hybrid' ? 'City the hybrid role reports to, and days on-site if fixed.' : 'City or region the role sits in.'}</span>
          </label>
        </section>

        {/* 02 — Compensation */}
        <section className="ejf-sec">
          <div className="ejf-sec-h"><span className="ejf-num">02</span><h2>Compensation</h2></div>
          <div className="ejf-salary">
            <label className="ef-field"><span className="lbl">Minimum, USD / year</span>
              <input value={f.smin} onChange={set('smin')} inputMode="numeric" placeholder="e.g. 95000" /></label>
            <span className="ejf-dash">&ndash;</span>
            <label className="ef-field"><span className="lbl">Maximum, USD / year</span>
              <input value={f.smax} onChange={set('smax')} inputMode="numeric" placeholder="e.g. 130000" /></label>
          </div>
          <p className="ef-hint ejf-wide">Listings with a stated salary get indexed by Google, rank higher on our board, and draw more of the right applicants. A range beats &ldquo;competitive.&rdquo; Optional, strongly encouraged.</p>
        </section>

        {/* 03 — The posting */}
        <section className="ejf-sec">
          <div className="ejf-sec-h"><span className="ejf-num">03</span><h2>The posting</h2></div>
          <label className="ef-field"><span className="lbl">About the role, two or three sentences</span>
            <textarea rows={3} value={f.about} onChange={set('about')} placeholder="What the role is and why it exists." /></label>
          <label className="ef-field"><span className="lbl">Responsibilities, one per line</span>
            <textarea rows={4} value={f.resp} onChange={set('resp')} placeholder={'Own the reporting pipeline\nRun the weekly planning'} /></label>
          <label className="ef-field"><span className="lbl">Qualifications, one per line</span>
            <textarea rows={4} value={f.quals} onChange={set('quals')} placeholder={'3+ years with SQL\nNice to have: dbt'} /></label>

          <div className="ejf-block">
            <span className="lbl">Required skills</span>
            <span className="ef-hint">We match your role to people who already hold these, from adjacent professions. Type to search our skill bank, or add your own.</span>
            {skillList.length > 0 && (
              <div className="ejf-chips ejf-skill-tags">
                {skillList.map((s) => (
                  <button key={s} type="button" className="ejf-chip on" onClick={() => setSkillList((p) => p.filter((x) => x !== s))}>{s}<span className="ejf-x">&times;</span></button>
                ))}
              </div>
            )}
            <div className="ejf-skillbox">
              <input value={skillQ} onChange={(e) => setSkillQ(e.target.value)} placeholder="Type a skill, e.g. Figma, Python, Revit"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (skillMatches[0]) addSkill(skillMatches[0]); else if (canCustom) addSkill(q); } }} />
              {(skillMatches.length > 0 || canCustom) && (
                <div className="ejf-skill-dd">
                  {skillMatches.map((s) => <button key={s} type="button" onClick={() => addSkill(s)}>{s}</button>)}
                  {canCustom && <button type="button" className="ejf-skill-add" onClick={() => addSkill(q)}>Add &ldquo;{q}&rdquo; as a new skill</button>}
                </div>
              )}
            </div>
          </div>

          <div className="ejf-block">
            <span className="lbl">Benefits &amp; perks</span>
            <span className="ef-hint">The first few become filters candidates can search on. Pick what is true.</span>
            <div className="ejf-chips">
              {BENEFITS.map((b) => (
                <button key={b} type="button" className={`ejf-chip${chosen.includes(b) ? ' on' : ''}`} onClick={() => toggleBenefit(b)}>{b}</button>
              ))}
            </div>
          </div>
        </section>

        {/* 04 — The company */}
        <section className="ejf-sec">
          <div className="ejf-sec-h"><span className="ejf-num">04</span><h2>The company</h2></div>
          <div className="ef-row2">
            <label className="ef-field"><span className="lbl">Company name</span>
              <input value={f.company} onChange={set('company')} autoComplete="organization" placeholder="Your brand name, no Inc. / Ltd." /></label>
            <label className="ef-field"><span className="lbl">Work email</span>
              <input type="email" value={f.email} onChange={set('email')} autoComplete="email" placeholder="you@company.com" />
              <span className="ef-hint">Private. Used to reach you and send the edit link, never shown.</span></label>
          </div>
          <div className="ef-row2">
            <label className="ef-field"><span className="lbl">Logo URL (optional)</span>
              <input value={f.logo} onChange={set('logo')} placeholder="https://…/logo.png" inputMode="url" />
              <span className="ef-hint">Shown on your listing&rsquo;s page. The board itself stays typographic.</span></label>
            <label className="ef-field"><span className="lbl">Your name (optional)</span>
              <input value={f.name} onChange={set('name')} autoComplete="name" /></label>
          </div>
        </section>

        {/* 05 — How to apply */}
        <section className="ejf-sec">
          <div className="ejf-sec-h"><span className="ejf-num">05</span><h2>How to apply</h2></div>
          <div className="ef-row2">
            <label className="ef-field"><span className="lbl">Apply URL</span>
              <input value={f.applyUrl} onChange={set('applyUrl')} placeholder="https://…" inputMode="url" /></label>
            <label className="ef-field"><span className="lbl">or apply email</span>
              <input type="email" value={f.applyEmail} onChange={set('applyEmail')} placeholder="jobs@company.com" /></label>
          </div>
          <p className="ef-hint ejf-wide">Where candidates go to apply — every listing links out to you. A link to your own form pulls more, cleaner applicants than an email.</p>
        </section>

        <div className="ejf-submit">
          <ol className="ejf-nextrow" aria-label="What happens next">
            <li>You send one prefilled email.</li>
            <li>We review and post it by hand, within two days.</li>
            <li>First month featured, free. No card, no contract.</li>
          </ol>
          <button className="ef-send ejf-send" disabled={!ok} onClick={send}>
            <span>Post the job &mdash; first month featured, free</span>
            <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg>
          </button>
          {!ok && missing.length > 0 && <p className="ejf-missing lbl">Still need {missing.join(', ')}.</p>}
          <p className="ef-note">
            No form backend, no CRM, no drip sequence. Already listed from your careers page? Say so and we mark it
            claimed. Prefer writing directly? <a href="mailto:cvinocoura@gmail.com">cvinocoura@gmail.com</a>.
          </p>
        </div>
      </div>

      {/* The preview, docked: the board's actual card component, live. */}
      <div className="ejf-dock" aria-label="Listing preview">
        <div className="ejf-dock-cap">
          <span className="lbl">Preview &mdash; your card on the board</span>
          <span className="lbl ejf-dock-note">Updates as you type</span>
        </div>
        <ul className="ejf-dock-list">
          <JobCard j={previewJob} />
        </ul>
      </div>
    </>
  );
}
