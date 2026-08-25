'use client';

import { useMemo, useState } from 'react';
import posthog from 'posthog-js';
import { JobCard, type Job } from '../jobs/JobCard';
import type { JobPayload } from './actions';
import { importJobFromUrl } from './import-job';
import { submitFreeJob } from './free-actions';
import { SITE_EMAIL } from '../../lib/site';

export type FanIn = { n: number; top: { t: string; m: number }[]; live: number };
type Occ = { slug: string; title: string; syn: string[] };
type Mode = 'onsite' | 'hybrid' | 'remote';

const TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const MODES: { key: Mode; label: string }[] = [
  { key: 'remote', label: 'Remote' },
  { key: 'hybrid', label: 'Hybrid' },
  { key: 'onsite', label: 'On-site' },
];
const BENEFITS = [
  'Equity', '4-day week', 'Visa sponsorship', 'Unlimited PTO', 'Health insurance',
  '401(k) / pension', 'Learning budget', 'Home-office budget', 'Async', 'Flexible hours',
  'Company retreats', 'Profit sharing', 'Parental leave', 'Equipment provided', 'No whiteboard interview',
];
const BRACKETS: { label: string; min: number | null; max: number | null }[] = [
  { label: 'Under $50k', min: null, max: 50000 },
  { label: '$50k - $75k', min: 50000, max: 75000 },
  { label: '$75k - $100k', min: 75000, max: 100000 },
  { label: '$100k - $130k', min: 100000, max: 130000 },
  { label: '$130k - $160k', min: 130000, max: 160000 },
  { label: '$160k - $200k', min: 160000, max: 200000 },
  { label: '$200k - $250k', min: 200000, max: 250000 },
  { label: '$250k+', min: 250000, max: null },
];

const H_RESP = /responsibilit|what you.?ll do|what you will do|your role\b|day.?to.?day|in this role|what you.?ll be doing/i;
const H_QUAL = /qualification|requirement|what you.?ll bring|what you bring|who you are|must have|you have\b|your experience|skills? (and|&) experience|nice to have|we.?re looking|looking for|about you|you.?ll need/i;
const H_ABOUT = /^about (the|us|this)|overview|summary|who we are|the company|the team|the opportunity/i;

const num = (v: string) => { const n = parseInt(v.replace(/[^0-9]/g, ''), 10); return Number.isFinite(n) && n > 0 ? n : null; };
const fmtK = (n: number) => '$' + Math.round(n / 1000) + 'k';
function normSal(n: string, suffix: string) {
  let v = parseFloat((n || '').replace(/,/g, ''));
  if (!Number.isFinite(v)) return '';
  if (/k/i.test(suffix || '') || v < 1000) v *= 1000;
  return String(Math.round(v));
}
function parseJD(input: string, bank: string[]) {
  const raw = input.replace(/\r/g, '');
  const lines = raw.split('\n');
  const out = { title: '', smin: '', smax: '', about: '', resp: '', quals: '', skills: [] as string[] };
  const first = lines.map((l) => l.trim()).find(Boolean);
  if (first && first.length <= 80 && !/[.!?]$/.test(first) && !/^https?:/i.test(first)) out.title = first;
  const m = raw.match(/\$\s*([\d][\d.,]*)\s*(k|,000|000)?\s*[-–—]\s*\$?\s*([\d][\d.,]*)\s*(k|,000|000)?/i)
    || raw.match(/\$\s*([\d][\d.,]*)\s*(k|,000|000)?\s*(?:to|up to)\s*\$?\s*([\d][\d.,]*)\s*(k|,000|000)?/i);
  if (m) { out.smin = normSal(m[1], m[2]); out.smax = normSal(m[3], m[4]); }
  const buckets: Record<'about' | 'resp' | 'quals', string[]> = { about: [], resp: [], quals: [] };
  let current: 'about' | 'resp' | 'quals' = 'about';
  for (const line of lines) {
    const s = line.trim();
    const heading = s.length > 0 && s.length <= 64 && (H_RESP.test(s) || H_QUAL.test(s) || H_ABOUT.test(s));
    if (heading) { current = H_RESP.test(s) ? 'resp' : H_QUAL.test(s) ? 'quals' : 'about'; continue; }
    if (s) buckets[current].push(s.replace(/^[•·\-–*]\s*/, ''));
  }
  out.about = buckets.about.slice(0, 8).join(' ').slice(0, 900);
  out.resp = buckets.resp.join('\n');
  out.quals = buckets.quals.join('\n');
  const low = raw.toLowerCase();
  out.skills = bank.filter((skill) => low.includes(skill.toLowerCase())).slice(0, 10);
  return out;
}

export function EmployerFormV2({ occs, fan, skills, salaryHints }: {
  occs: Occ[];
  fan: Record<string, FanIn>;
  skills: string[];
  salaryHints: Record<string, { lo: number; hi: number }>;
}) {
  const [entry, setEntry] = useState<'import' | 'scratch'>('import');
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [jd, setJd] = useState('');
  const [f, setF] = useState({
    role: '', region: '', smin: '', smax: '', about: '', resp: '', quals: '',
    company: '', logo: '', email: '', name: '', applyUrl: '', applyEmail: '',
  });
  const [etype, setEtype] = useState('Full-time');
  const [mode, setMode] = useState<Mode>('remote');
  const [occSlug, setOccSlug] = useState('');
  const [benefits, setBenefits] = useState<string[]>([]);
  const [skillList, setSkillList] = useState<string[]>([]);
  const [skillQ, setSkillQ] = useState('');
  const [salaryPick, setSalaryPick] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [tried, setTried] = useState(false);

  const set = (key: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((prev) => ({ ...prev, [key]: e.target.value }));
  const suggestions = useMemo(() => {
    const q = f.role.trim().toLowerCase();
    if (q.length < 3) return [];
    return occs.map((o) => {
      const words = [o.title.toLowerCase(), ...o.syn].join(' ');
      let score = 0;
      for (const token of q.split(/\s+/)) {
        if (words.includes(token)) score += token.length;
        else if (token.length >= 4 && words.split(/\s+/).some((w) => w.startsWith(token) || token.startsWith(w))) score += 2;
      }
      return { o, score };
    }).filter((x) => x.score > 2).sort((a, b) => b.score - a.score).slice(0, 3).map((x) => x.o);
  }, [f.role, occs]);
  const occ = occs.find((o) => o.slug === occSlug) || null;
  const info = occSlug ? fan[occSlug] : undefined;
  const hint = occSlug ? salaryHints[occSlug] : undefined;

  const matches = useMemo(() => {
    const q = skillQ.trim().toLowerCase();
    if (!q) return [];
    return skills.filter((s) => s.toLowerCase().includes(q) && !skillList.includes(s)).slice(0, 5);
  }, [skillQ, skills, skillList]);
  const addSkill = (s: string) => { const v = s.trim(); if (v && !skillList.includes(v)) setSkillList((p) => [...p, v]); setSkillQ(''); };

  function applyDescription(text: string, overwrite = false) {
    const p = parseJD(text, skills);
    setF((prev) => ({
      ...prev,
      role: overwrite ? p.title || prev.role : prev.role || p.title,
      about: overwrite ? p.about || prev.about : prev.about || p.about,
      resp: overwrite ? p.resp || prev.resp : prev.resp || p.resp,
      quals: overwrite ? p.quals || prev.quals : prev.quals || p.quals,
      smin: prev.smin || p.smin,
      smax: prev.smax || p.smax,
    }));
    if ((p.smin || p.smax) && !salaryPick) setSalaryPick('custom');
    if (p.skills.length) setSkillList((prev) => [...new Set([...prev, ...p.skills])]);
    return p;
  }

  async function importUrlNow() {
    if (!importUrl.trim()) return;
    setImporting(true); setImportStatus('');
    const r = await importJobFromUrl(importUrl);
    setImporting(false);
    if (!r.job) { setImportStatus(r.error || 'Could not import that job.'); return; }
    const j = r.job;
    if (j.description) { setJd(j.description); applyDescription(j.description); }
    setF((prev) => ({
      ...prev,
      role: j.title || prev.role,
      company: j.company || prev.company,
      logo: j.logo || prev.logo,
      region: j.region || prev.region,
      applyUrl: j.applyUrl || prev.applyUrl,
      smin: (j.salaryCurrency === 'USD' && j.salaryMin) ? String(j.salaryMin) : prev.smin,
      smax: (j.salaryCurrency === 'USD' && j.salaryMax) ? String(j.salaryMax) : prev.smax,
    }));
    if (j.workplace) setMode(j.workplace);
    if (j.employmentType && TYPES.includes(j.employmentType)) setEtype(j.employmentType);
    if (j.salaryCurrency === 'USD' && (j.salaryMin || j.salaryMax)) setSalaryPick('custom');
    const salaryNote = j.salaryCurrency && j.salaryCurrency !== 'USD' ? ` Salary was listed in ${j.salaryCurrency}; review it below rather than silently converting it.` : '';
    setImportStatus(`Imported from ${j.sourceHost || 'the job page'}. Review anything we could not verify.${salaryNote}`);
    posthog.capture('employer_job_imported', { source_host: j.sourceHost || null });
  }

  function salaryValues() {
    if (salaryPick === 'custom') return { min: num(f.smin), max: num(f.smax) };
    if (salaryPick !== '') return BRACKETS[+salaryPick];
    return { min: null, max: null };
  }
  function useTypical() {
    if (!hint) return;
    setF((prev) => ({ ...prev, smin: String(hint.lo), smax: String(hint.hi) }));
    setSalaryPick('custom');
  }

  const sv = salaryValues();
  const preview: Job = {
    id: 'preview', occ: occSlug || 'preview', title: f.role.trim() || 'Your role title', company: f.company.trim() || 'Your company',
    location: mode === 'remote' ? (f.region.trim() || 'Remote') : f.region.trim(), remote: mode === 'remote',
    smin: sv.min, smax: sv.max, source: 'employer', posted: '', featured: true,
    fl: benefits.includes('4-day week') ? ['4d'] : undefined,
    url: f.applyUrl.trim() || 'https://www.pivothop.com/employers',
  };

  const noRole = f.role.trim().length < 2;
  const noCompany = f.company.trim().length < 2;
  const noEmail = !/.+@.+\..+/.test(f.email);
  const noApply = !f.applyUrl.trim() && !f.applyEmail.trim();
  const ok = !noRole && !noCompany && !noEmail && !noApply;
  const err = (bad: boolean) => tried && bad ? ' ejf-err' : '';

  function payload(): JobPayload {
    return {
      tier: 'free', role: f.role.trim(), occupation_slug: occSlug || null,
      employment_type: etype, workplace: mode, region: f.region.trim(), salary_min: sv.min, salary_max: sv.max,
      about: f.about.trim(), responsibilities: f.resp.trim(), qualifications: f.quals.trim(),
      skills: skillList, benefits, company: f.company.trim(), logo_url: f.logo.trim(),
      contact_email: f.email.trim(), contact_name: f.name.trim(), apply_url: f.applyUrl.trim(), apply_email: f.applyEmail.trim(),
    };
  }
  function mailto() {
    const p = payload();
    const subject = `Free job submission: ${p.role} at ${p.company}`;
    const body = [`Company: ${p.company}`, `Contact: ${p.contact_email}`, `Role: ${p.role}`, `Workplace: ${p.workplace} ${p.region}`, `Apply: ${p.apply_url || p.apply_email}`, '', p.about, '', p.responsibilities, '', p.qualifications].filter(Boolean).join('\n');
    window.location.href = `mailto:${SITE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  async function send() {
    if (!ok) { setTried(true); setTimeout(() => document.querySelector('.ejf-err')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 30); return; }
    setSubmitting(true); setSubmitError('');
    const p = payload();
    const r = await submitFreeJob(p);
    setSubmitting(false);
    if (r.ok) {
      posthog.capture('employer_job_submitted_free', { occupation_slug: p.occupation_slug, workplace: p.workplace });
      setDone(true); window.scrollTo({ top: 0, behavior: 'smooth' }); return;
    }
    if (r.error === 'not-configured') { mailto(); return; }
    setSubmitError('Could not save the listing just now. Opening email as a fallback.');
    mailto();
  }

  if (done) return (
    <div className="ejf-done">
      <span className="ejf-done-mark" aria-hidden="true">✓</span>
      <h2>Submitted for review.</h2>
      <p>We received the role. We review free listings before they go live so the board stays useful and spam-free. We will email {f.email.trim()} when it is published.</p>
      <div className="ejf-done-card"><ul className="job-list"><JobCard j={preview} /></ul></div>
      <a className="lbl acc" href="/jobs">See the board →</a>
    </div>
  );

  return (
    <>
      <div className="ejf-form">
        <div className="ejf-paste">
          <div className="ejf-paste-head"><span className="lbl acc">Start here</span><span>Post free while PivotHop is growing. No payment required.</span></div>
          <div className="ejf-chips" role="tablist" aria-label="How do you want to post?">
            <button type="button" className={`ejf-chip${entry === 'import' ? ' on' : ''}`} onClick={() => setEntry('import')}>Import an existing job</button>
            <button type="button" className={`ejf-chip${entry === 'scratch' ? ' on' : ''}`} onClick={() => setEntry('scratch')}>Create from scratch</button>
          </div>
          {entry === 'import' && <>
            <label className="ef-field"><span className="lbl">Job URL</span>
              <input value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="https://boards.greenhouse.io/..." inputMode="url" />
              <span className="ef-hint">Greenhouse, Lever, Workday, Ashby, SmartRecruiters and most public job pages expose structured data we can read.</span>
            </label>
            <div className="ejf-paste-actions">
              <button type="button" className="ejf-paste-go" disabled={!importUrl.trim() || importing} onClick={importUrlNow}>{importing ? 'Reading job…' : 'Import job ↓'}</button>
              {importStatus && <span className="lbl ejf-paste-msg">{importStatus}</span>}
            </div>
            <details>
              <summary className="lbl">URL not working? Paste the description instead</summary>
              <textarea className="ejf-paste-box" value={jd} onChange={(e) => setJd(e.target.value)} rows={5} placeholder="Paste the existing job description…" />
              <button type="button" className="ejf-paste-go" disabled={!jd.trim()} onClick={() => { applyDescription(jd, true); setImportStatus('Description parsed. Review the form below.'); }}>Autofill from description ↓</button>
            </details>
          </>}
          {entry === 'scratch' && <p className="ef-hint ejf-wide">Fill only what matters. Role, company, work email, and an application destination are required. Everything else improves matching and discovery.</p>}
        </div>

        <section className="ejf-sec">
          <div className="ejf-sec-h"><span className="ejf-num">01</span><h2>The role</h2></div>
          <label className={`ef-field${err(noRole)}`}><span className="lbl">Role title <span className="ejf-req">Required</span></span><input value={f.role} onChange={(e) => { set('role')(e); setOccSlug(''); }} placeholder="Senior Product Designer" /></label>
          {suggestions.length > 0 && <div className="ejf-suggest"><span className="lbl">Closest occupation on the PivotHop graph</span><div className="ejf-chips">{suggestions.map((o) => <button key={o.slug} type="button" className={`ejf-chip${occSlug === o.slug ? ' on' : ''}`} onClick={() => setOccSlug(occSlug === o.slug ? '' : o.slug)}>{o.title}</button>)}</div></div>}
          {occ && <aside className="ejf-fanbox">{info?.n ? <><p className="ew-fan-lead">{occ.title} sits on {info.n} measured career route{info.n === 1 ? '' : 's'}. The post can surface to adjacent candidates whose skill gap is already measured.</p><ul className="ew-fan-list">{info.top.map((x) => <li key={x.t}><span>{x.t} → {occ.title}</span><span className="lbl">{x.m}% ready</span></li>)}</ul></> : <p className="ew-fan-lead">We will place this role on its occupation board, salary surface and matching graph.</p>}</aside>}
          <div className="ejf-block"><span className="lbl">Employment type</span><div className="ejf-chips">{TYPES.map((t) => <button key={t} type="button" className={`ejf-chip${etype === t ? ' on' : ''}`} onClick={() => setEtype(t)}>{t}</button>)}</div></div>
          <div className="ejf-block"><span className="lbl">Workplace</span><div className="ejf-chips">{MODES.map((m) => <button key={m.key} type="button" className={`ejf-chip${mode === m.key ? ' on' : ''}`} onClick={() => setMode(m.key)}>{m.label}</button>)}</div></div>
          <label className="ef-field"><span className="lbl">{mode === 'remote' ? 'Who can work from where?' : 'Location'}</span><input value={f.region} onChange={set('region')} placeholder={mode === 'remote' ? 'Worldwide, Costa Rica, LATAM, US time zones…' : 'San José, Costa Rica'} /></label>
        </section>

        <section className="ejf-sec">
          <div className="ejf-sec-h"><span className="ejf-num">02</span><h2>Compensation</h2></div>
          {hint && !salaryPick && <button type="button" className="ejf-hintchip" onClick={useTypical}>Typical for {occ!.title}: {fmtK(hint.lo)}-{fmtK(hint.hi)} <span>use it</span></button>}
          <label className="ef-field"><span className="lbl">Salary range, USD / year</span><select value={salaryPick} onChange={(e) => setSalaryPick(e.target.value)}><option value="">Prefer not to say</option>{BRACKETS.map((b, i) => <option key={b.label} value={i}>{b.label}</option>)}<option value="custom">Custom range…</option></select></label>
          {salaryPick === 'custom' && <div className="ejf-salary"><label className="ef-field"><span className="lbl">Minimum</span><input value={f.smin} onChange={set('smin')} inputMode="numeric" placeholder="45000" /></label><span className="ejf-dash">-</span><label className="ef-field"><span className="lbl">Maximum</span><input value={f.smax} onChange={set('smax')} inputMode="numeric" placeholder="65000" /></label></div>}
          <p className="ef-hint ejf-wide">Salary is optional, strongly encouraged. Transparent listings are easier to discover and easier for candidates to evaluate.</p>
        </section>

        <section className="ejf-sec">
          <div className="ejf-sec-h"><span className="ejf-num">03</span><h2>The posting</h2></div>
          <label className="ef-field"><span className="lbl">About the role</span><textarea rows={4} value={f.about} onChange={set('about')} placeholder="What the role is, the team, and why it exists." /></label>
          <label className="ef-field"><span className="lbl">Responsibilities</span><textarea rows={5} value={f.resp} onChange={set('resp')} placeholder={'Own the reporting pipeline\nRun weekly planning'} /></label>
          <label className="ef-field"><span className="lbl">Qualifications</span><textarea rows={5} value={f.quals} onChange={set('quals')} placeholder={'3+ years with SQL\nNice to have: dbt'} /></label>
          <div className="ejf-block"><span className="lbl">Required skills</span>{skillList.length > 0 && <div className="ejf-chips ejf-skill-tags">{skillList.map((s) => <button key={s} type="button" className="ejf-chip on" onClick={() => setSkillList((p) => p.filter((x) => x !== s))}>{s}<span className="ejf-x">×</span></button>)}</div>}<div className="ejf-skillbox"><input value={skillQ} onChange={(e) => setSkillQ(e.target.value)} placeholder="Figma, Python, Revit…" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (matches[0]) addSkill(matches[0]); else if (skillQ.trim()) addSkill(skillQ); } }} />{matches.length > 0 && <div className="ejf-skill-dd">{matches.map((s) => <button key={s} type="button" onClick={() => addSkill(s)}>{s}</button>)}</div>}</div></div>
          <div className="ejf-block"><span className="lbl">Benefits &amp; perks</span><div className="ejf-chips">{BENEFITS.map((b) => <button key={b} type="button" className={`ejf-chip${benefits.includes(b) ? ' on' : ''}`} onClick={() => setBenefits((p) => p.includes(b) ? p.filter((x) => x !== b) : [...p, b])}>{b}</button>)}</div></div>
        </section>

        <section className="ejf-sec">
          <div className="ejf-sec-h"><span className="ejf-num">04</span><h2>The company</h2></div>
          <div className="ef-row2"><label className={`ef-field${err(noCompany)}`}><span className="lbl">Company <span className="ejf-req">Required</span></span><input value={f.company} onChange={set('company')} autoComplete="organization" placeholder="Acme" /></label><label className={`ef-field${err(noEmail)}`}><span className="lbl">Work email <span className="ejf-req">Required</span></span><input type="email" value={f.email} onChange={set('email')} autoComplete="email" placeholder="you@company.com" /><span className="ef-hint">Private. Used for review and the future edit link.</span></label></div>
          <div className="ef-row2"><label className="ef-field"><span className="lbl">Logo URL</span><input value={f.logo} onChange={set('logo')} inputMode="url" placeholder="https://…/logo.png" /></label><label className="ef-field"><span className="lbl">Your name</span><input value={f.name} onChange={set('name')} autoComplete="name" /></label></div>
        </section>

        <section className="ejf-sec">
          <div className="ejf-sec-h"><span className="ejf-num">05</span><h2>How to apply</h2></div>
          <div className="ef-row2"><label className={`ef-field${err(noApply)}`}><span className="lbl">Apply URL <span className="ejf-req">Required</span></span><input value={f.applyUrl} onChange={set('applyUrl')} inputMode="url" placeholder="https://…" /></label><label className={`ef-field${err(noApply)}`}><span className="lbl">or apply email</span><input type="email" value={f.applyEmail} onChange={set('applyEmail')} placeholder="jobs@company.com" /></label></div>
        </section>

        <div className="ejf-submit">
          <ol className="ejf-nextrow" aria-label="What happens next"><li>Submit free.</li><li>PivotHop reviews the company and role.</li><li>The listing goes live for 30 days and links directly to you.</li></ol>
          <button className="ef-send ejf-send" disabled={submitting} onClick={send}><span>{submitting ? 'Submitting…' : 'Post the job - free'}</span><svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg></button>
          {tried && !ok && <p className="ejf-errbox">Add the fields marked Required before submitting.</p>}
          {submitError && <p className="ejf-errbox">{submitError}</p>}
          <p className="ef-note">Free while the employer product is in early access. We review listings before publication. Questions? <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>.</p>
        </div>
      </div>

      <div className="ejf-dock" aria-label="Listing preview"><div className="ejf-dock-cap"><span className="lbl">Live preview</span><span className="lbl ejf-dock-note">Updates as you type</span></div><ul className="ejf-dock-list"><JobCard j={preview} /></ul></div>
    </>
  );
}
