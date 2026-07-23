'use client';
import { useMemo, useState } from 'react';

/* Post a job — the full page. A single Swiss-brutalist flow in five numbered
   sections (the role, compensation, the posting, the company, how to apply),
   with a sticky rail that renders the listing live and the adjacency fan-in for
   the matched occupation. Fields chosen from what actually helps the listing and
   our matching: occupation match, salary min/max, a benefits picker that maps to
   the board's filter tags, a skills picker against our own skill bank, and a
   company logo. No upsells, no billing — the launch offer is one free featured
   month. No backend yet: submit composes one structured email, reviewed by hand
   within two days. When Supabase lands, the same fields post to a table. */

export type FanIn = { n: number; top: { t: string; m: number }[]; live: number };
type Occ = { slug: string; title: string; syn: string[] };

const TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
// Benefits worth surfacing. The first four map to the board's derived filter
// tags (a candidate can filter on them); the rest render on the listing.
const BENEFITS = [
  'Equity', '4-day week', 'Visa sponsorship', 'Unlimited PTO',
  'Health insurance', '401(k) / pension', 'Learning budget', 'Home-office budget',
  'Async', 'Flexible hours', 'Company retreats', 'Profit sharing',
  'Parental leave', 'Equipment provided', 'No whiteboard interview',
];

const kfmt = (n: number) => '$' + Math.round(n / 1000) + 'k';
function salaryLabel(smin: string, smax: string): string {
  const a = parseInt(smin.replace(/[^0-9]/g, ''), 10);
  const b = parseInt(smax.replace(/[^0-9]/g, ''), 10);
  if (a && b) return `${kfmt(a)}–${kfmt(b)}`;
  if (a) return `${kfmt(a)}+`;
  if (b) return `up to ${kfmt(b)}`;
  return '';
}

export function EmployerForm({ occs, fan, skills }: { occs: Occ[]; fan: Record<string, FanIn>; skills: string[] }) {
  const [f, setF] = useState({
    role: '', etype: 'Full-time', region: '', smin: '', smax: '',
    about: '', resp: '', quals: '',
    company: '', logo: '', email: '', name: '', applyUrl: '', applyEmail: '',
  });
  const [remote, setRemote] = useState(true);
  const [occSlug, setOccSlug] = useState('');
  const [chosen, setChosen] = useState<string[]>([]);        // benefits
  const [skillList, setSkillList] = useState<string[]>([]);  // required skills
  const [skillQ, setSkillQ] = useState('');
  const [logoOk, setLogoOk] = useState(true);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  // Live occupation match (title + synonyms) — drives the fan-in panel.
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

  const skillMatches = useMemo(() => {
    const q = skillQ.trim().toLowerCase();
    if (!q) return [];
    return skills.filter((s) => s.toLowerCase().includes(q) && !skillList.includes(s)).slice(0, 6);
  }, [skillQ, skills, skillList]);
  const addSkill = (s: string) => { const v = s.trim(); if (v && !skillList.includes(v)) setSkillList((p) => [...p, v]); setSkillQ(''); };
  const toggleBenefit = (b: string) => setChosen((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b]));

  const salLabel = salaryLabel(f.smin, f.smax);
  const loc = remote ? (f.region ? `Remote · ${f.region}` : 'Remote') : (f.region || 'On-site');
  const previewTags = [...chosen, ...skillList].slice(0, 4);
  const ok = f.role.trim().length > 1 && f.company.trim().length > 1 && /.+@.+\..+/.test(f.email) && (f.applyUrl.trim() !== '' || f.applyEmail.trim() !== '');
  const missing = [
    !f.role.trim() && 'a role title',
    !f.company.trim() && 'the company',
    !/.+@.+\..+/.test(f.email) && 'a work email',
    !(f.applyUrl.trim() || f.applyEmail.trim()) && 'where to apply',
  ].filter(Boolean);

  function send() {
    const subject = `Post a job: ${f.role} at ${f.company}`;
    const body = [
      `Company: ${f.company}`,
      `Work email: ${f.email}`,
      f.name ? `Contact: ${f.name}` : '',
      f.logo ? `Logo: ${f.logo}` : '',
      '',
      `Role: ${f.role}`,
      occ ? `Occupation match: ${occ.title} (${occ.slug})` : 'Occupation match: (unmatched)',
      `Type: ${f.etype}`,
      `Location: ${loc}`,
      salLabel ? `Salary: ${salLabel} /yr (min ${f.smin || '—'}, max ${f.smax || '—'})` : 'Salary: (not stated)',
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
    <div className="ejf">
      <div className="ejf-main">
        {/* 01 — The role */}
        <section className="ejf-sec">
          <div className="ejf-sec-h"><span className="ejf-num">01</span><h2>The role</h2></div>
          <label className="ef-field"><span className="lbl">Role title</span>
            <input value={f.role} onChange={(e) => { set('role')(e); setOccSlug(''); }} placeholder="e.g. Senior Product Designer" autoFocus />
            <span className="ef-hint">One role, the way it would read on a listing. Not a sentence, not ALL CAPS. Posting several? One job per post.</span>
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
          <div className="ef-row2">
            <label className="ef-field"><span className="lbl">Employment type</span>
              <select value={f.etype} onChange={set('etype')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
            <label className="ef-field ef-check"><span className="lbl">Fully remote</span>
              <button type="button" className={`jb-toggle${remote ? ' on' : ''}`} aria-pressed={remote} onClick={() => setRemote((v) => !v)}>{remote ? 'Yes' : 'No'}</button></label>
          </div>
          <label className="ef-field"><span className="lbl">{remote ? 'Where can they work from?' : 'Location'}</span>
            <input value={f.region} onChange={set('region')} placeholder={remote ? 'e.g. Worldwide, or US time zones' : 'e.g. Austin, TX'} />
            <span className="ef-hint">{remote ? 'Worldwide reaches the most candidates and ranks higher. Narrow it only if you must.' : 'City or region the role sits in.'}</span>
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
            <span className="ef-hint">The skills a candidate needs. We match your role to people who already hold them, from adjacent professions.</span>
            {skillList.length > 0 && (
              <div className="ejf-chips ejf-skill-tags">
                {skillList.map((s) => (
                  <button key={s} type="button" className="ejf-chip on" onClick={() => setSkillList((p) => p.filter((x) => x !== s))}>{s}<span className="ejf-x">&times;</span></button>
                ))}
              </div>
            )}
            <div className="ejf-skillbox">
              <input value={skillQ} onChange={(e) => setSkillQ(e.target.value)} placeholder="Type a skill, e.g. Figma, Python, Revit"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillMatches[0] || skillQ); } }} />
              {skillMatches.length > 0 && (
                <div className="ejf-skill-dd">
                  {skillMatches.map((s) => <button key={s} type="button" onClick={() => addSkill(s)}>{s}</button>)}
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
              <input value={f.logo} onChange={(e) => { set('logo')(e); setLogoOk(true); }} placeholder="https://…/logo.png" inputMode="url" />
              <span className="ef-hint">A square logo makes the listing yours. Paste a link; we handle the rest.</span></label>
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
          <button className="ef-send ejf-send" disabled={!ok} onClick={send}>
            <span>Post the job — first month featured, free</span>
            <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg>
          </button>
          {!ok && missing.length > 0 && <p className="ejf-missing lbl">Still need {missing.join(', ')}.</p>}
          <p className="ef-note">
            This opens one prefilled email in your own mail app; reviewed by hand and listed within two days.
            No form backend, no CRM, no drip sequence. Already listed from your careers page? Say so and we mark it
            claimed. Prefer writing directly? <a href="mailto:cvinocoura@gmail.com">cvinocoura@gmail.com</a>.
          </p>
        </div>
      </div>

      <aside className="ejf-rail" aria-label="Listing preview">
        <div>
          <span className="lbl ew-rail-cap">How it will look</span>
          <div className="job-card ejf-preview">
            {f.logo && logoOk && <img className="ejf-logo" src={f.logo} alt="" onError={() => setLogoOk(false)} />}
            <span className="job-main">
              <span className="job-t">{f.role.trim() || 'Your role title'}</span>
              <span className="job-co">{f.company.trim() || 'Your company'}<span className="job-loc"> · {loc}</span></span>
              {previewTags.length > 0 && <span className="ejf-ptags">{previewTags.map((t) => <span key={t} className="ejf-ptag">{t}</span>)}</span>}
            </span>
            <span className="job-side">
              {salLabel && <span className="job-pay">{salLabel}</span>}
              <span className="job-m lbl"><span className="job-tag">Featured</span>{remote && <span className="job-tag">Remote</span>}</span>
            </span>
          </div>
        </div>

        <div className="ew-fan">
          <span className="lbl ew-rail-cap">Who will see it</span>
          {occ && info && info.n > 0 ? (
            <>
              <p className="ew-fan-lead">{`${occ.title} sits on ${info.n} measured route${info.n === 1 ? '' : 's'} in our skill graph. Your listing shows on each, to candidates arriving with the gap already itemized:`}</p>
              <ul className="ew-fan-list">
                {info.top.map((x) => (
                  <li key={x.t}><span>{x.t} &rarr; {occ.title}</span><span className="lbl">{x.m}% ready</span></li>
                ))}
              </ul>
              {info.live > 0 && <p className="ew-fan-note lbl">{`Joins ${info.live} live ${occ.title.toLowerCase()} listings, featured above all of them.`}</p>}
            </>
          ) : occ ? (
            <p className="ew-fan-lead">{`${occ.title} listings appear on its board, its salary page, and everywhere the instrument ranks it for a candidate's skills.`}</p>
          ) : (
            <p className="ew-fan-note lbl">Name the role above and pick the closest occupation to see exactly who it reaches.</p>
          )}
        </div>

        <div className="ejf-next">
          <span className="lbl ew-rail-cap">What happens next</span>
          <ol className="ejf-steps">
            <li>You send one prefilled email.</li>
            <li>We review and post it by hand, within two days.</li>
            <li>First month featured is free. No card, no contract.</li>
          </ol>
        </div>
      </aside>
    </div>
  );
}
