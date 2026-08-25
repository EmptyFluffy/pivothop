'use client';
import { useEffect, useMemo, useState } from 'react';
import posthog from 'posthog-js';
import { JobCard, type Job } from '../jobs/JobCard';
import type { JobPayload } from './actions';
import { submitFreeJob } from './free-actions';
import { importJobFromUrl } from './import-job';
import { SITE_EMAIL } from '../../lib/site';

/* Post a job — third pass, friction-first. People hate forms, so:
   - Paste an existing job description and we parse out the title, salary, and
     the About / Responsibilities / Qualifications sections plus any skills that
     match our bank (same heading detection the scraper uses). Most of the form
     fills itself.
   - Salary is a bracket dropdown (pick, don't type), with a one-click "typical
     for this role" prefill from our real per-occupation band, and a custom
     range for anyone who wants exact numbers.
   - Everything non-essential is optional; only four fields are required.
   One calm centered column; the preview is the board's real JobCard, docked to
   the viewport bottom. Submit composes one structured email (no backend yet);
   fields map 1:1 to the future Supabase table. */

export type FanIn = { n: number; top: { t: string; m: number }[]; live: number };
type Occ = { slug: string; title: string; syn: string[] };
type Mode = 'onsite' | 'hybrid' | 'remote';

const TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const MODES: { key: Mode; label: string }[] = [
  { key: 'onsite', label: 'On-site' }, { key: 'hybrid', label: 'Hybrid' }, { key: 'remote', label: 'Remote' },
];
const BENEFITS = [
  'Equity', '4-day week', 'Visa sponsorship', 'Unlimited PTO', 'Health insurance',
  '401(k) / pension', 'Learning budget', 'Home-office budget', 'Async', 'Flexible hours',
  'Company retreats', 'Profit sharing', 'Parental leave', 'Equipment provided', 'No whiteboard interview',
];
const BRACKETS: { label: string; min: number | null; max: number | null }[] = [
  { label: 'Under $50k', min: null, max: 50000 },
  { label: '$50k – $75k', min: 50000, max: 75000 },
  { label: '$75k – $100k', min: 75000, max: 100000 },
  { label: '$100k – $130k', min: 100000, max: 130000 },
  { label: '$130k – $160k', min: 130000, max: 160000 },
  { label: '$160k – $200k', min: 160000, max: 200000 },
  { label: '$200k – $250k', min: 200000, max: 250000 },
  { label: '$250k+', min: 250000, max: null },
];

const num = (v: string) => { const n = parseInt(v.replace(/[^0-9]/g, ''), 10); return Number.isFinite(n) && n > 0 ? n : null; };
const fmtK = (n: number) => '$' + Math.round(n / 1000) + 'k';

// ── Parse a pasted job description into our fields ──────────────────────────
const H_RESP = /responsibilit|what you.?ll do|what you will do|your role\b|the role\b|day.?to.?day|in this role|what you.?ll be doing/i;
const H_QUAL = /qualification|requirement|what you.?ll bring|what you bring|who you are|must have|you have\b|your experience|skills? (and|&) experience|nice to have|we.?re looking|looking for|about you|you.?ll need/i;
const H_ABOUT = /^about (the|us|this)|overview|summary|who we are|the company|the team|the opportunity/i;
function normSal(n: string, suf: string): string {
  let v = parseFloat((n || '').replace(/,/g, ''));
  if (!isFinite(v)) return '';
  if (/k/i.test(suf || '') || v < 1000) v = v * 1000;
  return String(Math.round(v));
}
function parseJD(text: string, bank: string[]) {
  const raw = text.replace(/\r/g, '');
  const lines = raw.split('\n');
  const res = { title: '', smin: '', smax: '', about: '', resp: '', quals: '', skills: [] as string[] };
  const first = lines.map((l) => l.trim()).find((l) => l);
  if (first && first.length <= 80 && !/[.!?]$/.test(first) && !/^http/i.test(first)) res.title = first;
  const m = raw.match(/\$\s*([\d][\d.,]*)\s*(k|,000|000)?\s*[-–—]\s*\$?\s*([\d][\d.,]*)\s*(k|,000|000)?/i)
    || raw.match(/\$\s*([\d][\d.,]*)\s*(k|,000|000)?\s*(?:to|up to)\s*\$?\s*([\d][\d.,]*)\s*(k|,000|000)?/i);
  if (m) { res.smin = normSal(m[1], m[2]); res.smax = normSal(m[3], m[4]); }
  const buckets: Record<'about' | 'resp' | 'quals', string[]> = { about: [], resp: [], quals: [] };
  let cur: 'about' | 'resp' | 'quals' = 'about';
  for (const line of lines) {
    const s = line.trim();
    const head = s.length > 0 && s.length <= 64 && (H_RESP.test(s) || H_QUAL.test(s) || H_ABOUT.test(s));
    if (head) { cur = H_RESP.test(s) ? 'resp' : H_QUAL.test(s) ? 'quals' : 'about'; continue; }
    if (s) buckets[cur].push(s.replace(/^[•·\-–*•]\s*/, ''));
  }
  res.about = buckets.about.slice(0, 6).join(' ').slice(0, 600);
  res.resp = buckets.resp.join('\n');
  res.quals = buckets.quals.join('\n');
  const low = raw.toLowerCase();
  res.skills = bank.filter((sk) => low.includes(sk.toLowerCase())).slice(0, 8);
  return res;
}

type Tier = { name: string; full: number; launch: number };
export function EmployerForm({ occs, fan, skills, salaryHints, pricing }: {
  occs: Occ[]; fan: Record<string, FanIn>; skills: string[]; salaryHints: Record<string, { lo: number; hi: number }>; pricing: { std: Tier; feat: Tier };
}) {
  const [f, setF] = useState({
    role: '', region: '', smin: '', smax: '',
    about: '', resp: '', quals: '',
    company: '', logo: '', email: '', name: '', applyUrl: '', applyEmail: '',
  });
  const [etype, setEtype] = useState('Full-time');
  const [mode, setMode] = useState<Mode>('remote');
  const [occSlug, setOccSlug] = useState('');
  const [chosen, setChosen] = useState<string[]>([]);
  const [skillList, setSkillList] = useState<string[]>([]);
  const [skillQ, setSkillQ] = useState('');
  const [salaryPick, setSalaryPick] = useState('');   // '' | '0'..'7' | 'custom'
  const [jd, setJd] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [filled, setFilled] = useState('');
  // tier stays in state so buildPayload keeps emitting it; the picker UI is
  // gone while posting is free (payments later re-add it).
  const [tier] = useState<'std' | 'feat'>('std');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<'' | 'paid' | 'queued'>('');   // '' none, paid (checkout), queued (concierge)
  const [submitError, setSubmitError] = useState('');
  const [tried, setTried] = useState(false);   // show required-field errors after a failed attempt
  // Returning from checkout: ?paid=1 shows the live confirmation, ?canceled=1 a gentle note.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('paid') === '1') { setDone('paid'); window.history.replaceState(null, '', '/employers'); }
    else if (p.get('canceled') === '1') { setSubmitError('Payment was canceled — nothing charged. Your details are still here; submit again when ready.'); window.history.replaceState(null, '', '/employers'); }
  }, []);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const suggestions = useMemo(() => {
    const q = f.role.trim().toLowerCase();
    if (q.length < 3) return [];
    return occs.map((o) => {
      const hay = [o.title.toLowerCase(), ...o.syn].join(' ');
      let s = 0;
      for (const tok of q.split(/\s+/)) { if (!tok) continue; if (hay.includes(tok)) s += tok.length; else if (hay.split(/\s+/).some((w) => w.startsWith(tok) || (tok.length >= 4 && tok.startsWith(w)))) s += 2; }
      return { o, s };
    }).filter((x) => x.s > 2).sort((a, b) => b.s - a.s).slice(0, 3).map((x) => x.o);
  }, [f.role, occs]);
  const occ = occs.find((o) => o.slug === occSlug) ?? null;
  const info = occSlug ? fan[occSlug] : undefined;
  const hint = occSlug ? salaryHints[occSlug] : undefined;

  const q = skillQ.trim();
  const skillMatches = useMemo(() => {
    if (!q) return [];
    const ql = q.toLowerCase();
    return skills.filter((s) => s.toLowerCase().includes(ql) && !skillList.includes(s)).slice(0, 5);
  }, [q, skills, skillList]);
  const canCustom = q.length > 1 && !skillMatches.some((s) => s.toLowerCase() === q.toLowerCase()) && !skillList.some((s) => s.toLowerCase() === q.toLowerCase());
  const addSkill = (s: string) => { const v = s.trim(); if (v && !skillList.includes(v)) setSkillList((p) => [...p, v]); setSkillQ(''); };
  const toggleBenefit = (b: string) => setChosen((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b]));

  function salVals(): { min: number | null; max: number | null } {
    if (salaryPick === 'custom') return { min: num(f.smin), max: num(f.smax) };
    if (salaryPick !== '') { const b = BRACKETS[+salaryPick]; return { min: b.min, max: b.max }; }
    return { min: null, max: null };
  }
  function useTypical() { if (hint) { setF((p) => ({ ...p, smin: String(hint.lo), smax: String(hint.hi) })); setSalaryPick('custom'); } }

  function applyJD(text?: string) {
    const p = parseJD(text ?? jd, skills);
    setF((prev) => ({
      ...prev,
      role: prev.role || p.title,
      about: prev.about || p.about,
      resp: prev.resp || p.resp,
      quals: prev.quals || p.quals,
      smin: p.smin && salaryPick === '' ? p.smin : prev.smin,
      smax: p.smax && salaryPick === '' ? p.smax : prev.smax,
    }));
    if ((p.smin || p.smax) && salaryPick === '') setSalaryPick('custom');
    if (p.skills.length) setSkillList((prev) => [...prev, ...p.skills.filter((s) => !prev.includes(s))]);
    const got = [p.title && 'title', (p.smin || p.smax) && 'salary', p.about && 'summary', p.resp && 'responsibilities', p.quals && 'qualifications', p.skills.length && `${p.skills.length} skill${p.skills.length === 1 ? '' : 's'}`].filter(Boolean);
    setFilled(got.length ? `Filled ${got.join(', ')}. Review and edit below.` : 'Nothing obvious to pull — fill it in below, it is quick.');
  }

  async function importUrlNow() {
    if (!importUrl.trim() || importing) return;
    setImporting(true); setFilled('');
    const r = await importJobFromUrl(importUrl);
    setImporting(false);
    if (!r.job) { setFilled(r.error || 'Could not read that job page.'); return; }
    const j = r.job;
    if (j.description) { setJd(j.description); applyJD(j.description); }
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
    setFilled(`Imported from ${j.sourceHost || 'the job page'}. Review anything we could not verify.${salaryNote}`);
    posthog.capture('employer_job_imported', { source_host: j.sourceHost || null });
  }

  const sv = salVals();
  const location = mode === 'remote' ? (f.region.trim() || 'Remote')
    : mode === 'hybrid' ? (f.region.trim() ? `${f.region.trim()} · Hybrid` : 'Hybrid')
    : (f.region.trim() || '');
  const previewJob: Job = {
    id: 'preview', occ: occSlug || 'preview', title: f.role.trim() || 'Your role title',
    company: f.company.trim() || 'Your company', location, remote: mode === 'remote',
    smin: sv.min, smax: sv.max, source: 'employer', posted: '', featured: true,
    fl: chosen.includes('4-day week') ? ['4d'] : undefined,
    // url makes JobCard render the employer outbound link, not an internal
    // /jobs/preview/preview route that doesn't exist (the link-integrity gate).
    url: f.applyUrl.trim() || 'https://www.pivothop.com/employers',
  };

  const noRole = f.role.trim().length <= 1;
  const noCompany = f.company.trim().length <= 1;
  const noEmail = !/.+@.+\..+/.test(f.email);
  const noApply = f.applyUrl.trim() === '' && f.applyEmail.trim() === '';
  const ok = !noRole && !noCompany && !noEmail && !noApply;
  const missing = [noRole && 'a role title', noCompany && 'the company name', noEmail && 'a work email', noApply && 'where to apply'].filter(Boolean);
  const err = (bad: boolean) => (tried && bad ? ' ejf-err' : '');

  function buildPayload(): JobPayload {
    return {
      tier: tier === 'feat' ? 'featured' : 'standard',
      role: f.role.trim(), occupation_slug: occSlug || null,
      employment_type: etype, workplace: mode, region: f.region.trim(),
      salary_min: sv.min, salary_max: sv.max,
      about: f.about.trim(), responsibilities: f.resp.trim(), qualifications: f.quals.trim(),
      skills: skillList, benefits: chosen,
      company: f.company.trim(), logo_url: f.logo.trim(),
      contact_email: f.email.trim(), contact_name: f.name.trim(),
      apply_url: f.applyUrl.trim(), apply_email: f.applyEmail.trim(),
    };
  }
  function mailto() {
    const modeLabel = MODES.find((m) => m.key === mode)!.label;
    const salTxt = sv.min && sv.max ? `${fmtK(sv.min)}–${fmtK(sv.max)}` : sv.min ? `${fmtK(sv.min)}+` : sv.max ? `up to ${fmtK(sv.max)}` : '';
    const subject = `Post a job: ${f.role} at ${f.company}`;
    const body = [
      `Company: ${f.company}`, `Work email: ${f.email}`, f.name ? `Contact: ${f.name}` : '', f.logo ? `Logo: ${f.logo}` : '', '',
      `Role: ${f.role}`, occ ? `Occupation match: ${occ.title} (${occ.slug})` : 'Occupation match: (unmatched)',
      `Type: ${etype}`, `Workplace: ${modeLabel}${f.region ? ` — ${f.region}` : ''}`,
      salTxt ? `Salary: ${salTxt} /yr` : 'Salary: (not stated)',
      skillList.length ? `Required skills: ${skillList.join(', ')}` : '', chosen.length ? `Benefits: ${chosen.join(', ')}` : '',
      f.applyUrl ? `Apply URL: ${f.applyUrl}` : '', f.applyEmail ? `Apply email: ${f.applyEmail}` : '',
      f.about ? `\nAbout the role:\n${f.about}` : '', f.resp ? `\nResponsibilities:\n${f.resp}` : '', f.quals ? `\nQualifications:\n${f.quals}` : '',
      '', 'Free early-access post, review before publication.',
    ].filter((l) => l !== '').join('\n');
    window.location.href = `mailto:${SITE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  function attemptSend() {
    if (!ok) {
      setTried(true);
      setTimeout(() => document.querySelector('.ejf-err')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 40);
      return;
    }
    send();
  }
  async function send() {
    setSubmitError(''); setSubmitting(true);
    const payload = buildPayload();
    const r = await submitFreeJob(payload);
    setSubmitting(false);
    if (r.ok) {
      posthog.capture('employer_job_queued', { tier: 'free', occupation_slug: payload.occupation_slug });
      setDone('queued'); window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (r.error === 'not-configured') { mailto(); }
    else { setSubmitError('Could not submit just now — opening email as a fallback.'); mailto(); }
  }

  if (done) {
    return (
      <div className="ejf-done">
        <span className="ejf-done-mark" aria-hidden="true">&#10003;</span>
        {done === 'paid' ? (
          <>
            <h2>Paid. Your job is live.</h2>
            <p>Your listing is on the board now &mdash; featured to the candidates whose skills already reach it. A receipt is on its way to your email. Edit or take it down any time by replying to that email.</p>
          </>
        ) : (
          <>
            <h2>Submitted.</h2>
            <p>A real person reviews every listing before it publishes, typically within 1 business day. We email {f.email.trim() || 'you'} either way.</p>
          </>
        )}
        <div className="ejf-done-card"><ul className="job-list"><JobCard j={previewJob} /></ul></div>
        <a className="lbl acc" href="/jobs">See the board &rarr;</a>
      </div>
    );
  }

  return (
    <div className="ejf-layout">
      <div className="ejf-form">
        {/* Accelerator: paste an existing posting, the form below prefills.
            Never a separate mode — the manual form is always on screen. */}
        <div className="ejf-paste">
          <p className="ejf-paste-lead">Already posted elsewhere? Import it and the form below fills itself.</p>
          <div className="ejf-import-row">
            <input value={importUrl} onChange={(e) => setImportUrl(e.target.value)} inputMode="url"
              placeholder="https://boards.greenhouse.io/&hellip;"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void importUrlNow(); } }} />
            <button type="button" className="ejf-paste-go" disabled={!importUrl.trim() || importing} onClick={() => void importUrlNow()}>{importing ? 'Importing\u2026' : 'Import'}</button>
          </div>
          <p className="ejf-paste-sub">Greenhouse, Lever, Ashby, Workday and most public job pages expose structured data we can read. URL not working? Paste the description instead:</p>
          <textarea className="ejf-paste-box" value={jd} onChange={(e) => setJd(e.target.value)} rows={jd ? 5 : 2} placeholder="Paste the job description&hellip;" />
          <div className="ejf-paste-actions">
            <button type="button" className="ejf-paste-go" disabled={!jd.trim()} onClick={() => applyJD()}>Prefill the form</button>
            {filled && <span className="ejf-paste-msg">{filled}</span>}
          </div>
        </div>

        {/* 01 — The role */}
        <section className="ejf-sec">
          <div className="ejf-sec-h"><span className="ejf-num">01</span><h2>The role</h2></div>
          <label className={`ef-field${err(noRole)}`}><span className="efl">Role title <em className="ejf-req">Required</em></span>
            <input value={f.role} onChange={(e) => { set('role')(e); setOccSlug(''); }} placeholder="e.g. Senior Product Designer" />
            <span className="ef-hint">One role, the way it reads on a listing. Posting several? One job per post.</span></label>
          {suggestions.length > 0 && (
            <div className="ejf-suggest">
              <span className="efl">Closest occupation on our graph{occ ? '' : ' — pick one to see who it reaches'}</span>
              <div className="ejf-chips">{suggestions.map((o) => (<button key={o.slug} type="button" className={`ejf-chip${occSlug === o.slug ? ' on' : ''}`} onClick={() => setOccSlug(occSlug === o.slug ? '' : o.slug)}>{o.title}</button>))}</div>
            </div>
          )}
          <div className="ejf-block"><span className="efl">Employment type</span>
            <div className="ejf-chips">{TYPES.map((t) => (<button key={t} type="button" className={`ejf-chip${etype === t ? ' on' : ''}`} onClick={() => setEtype(t)}>{t}</button>))}</div></div>
          <div className="ejf-block"><span className="efl">Workplace</span>
            <div className="ejf-chips">{MODES.map((m) => (<button key={m.key} type="button" className={`ejf-chip${mode === m.key ? ' on' : ''}`} onClick={() => setMode(m.key)}>{m.label}</button>))}</div></div>
          <label className="ef-field"><span className="efl">{mode === 'remote' ? 'Where can they work from?' : mode === 'hybrid' ? 'Where is the office?' : 'Location'}</span>
            <input value={f.region} onChange={set('region')} placeholder={mode === 'remote' ? 'e.g. Worldwide, or US time zones' : 'e.g. Austin, TX'} />
            <span className="ef-hint">{mode === 'remote' ? 'Worldwide reaches the most candidates and ranks higher.' : mode === 'hybrid' ? 'City the hybrid role reports to, and days on-site if fixed.' : 'City or region the role sits in.'}</span></label>
        </section>

        {/* 02 — Pay & details */}
        <section className="ejf-sec">
          <div className="ejf-sec-h"><span className="ejf-num">02</span><h2>Pay &amp; details</h2></div>
          {hint && salaryPick === '' && (
            <button type="button" className="ejf-hintchip" onClick={useTypical}>
              Typical for {occ!.title}: {fmtK(hint.lo)}&ndash;{fmtK(hint.hi)} <span>&mdash; use it</span>
            </button>
          )}
          <label className="ef-field"><span className="efl">Salary range, USD / year</span>
            <select value={salaryPick} onChange={(e) => setSalaryPick(e.target.value)}>
              <option value="">Prefer not to say</option>
              {BRACKETS.map((b, i) => <option key={b.label} value={i}>{b.label}</option>)}
              <option value="custom">Custom range&hellip;</option>
            </select>
            <span className="ef-hint">Listings without a salary band get limited distribution.</span></label>
          {salaryPick === 'custom' && (
            <div className="ejf-salary">
              <label className="ef-field"><span className="efl">Minimum</span><input value={f.smin} onChange={set('smin')} inputMode="numeric" placeholder="95000" /></label>
              <span className="ejf-dash">&ndash;</span>
              <label className="ef-field"><span className="efl">Maximum</span><input value={f.smax} onChange={set('smax')} inputMode="numeric" placeholder="130000" /></label>
            </div>
          )}
          <label className="ef-field"><span className="efl">About the role <em className="ejf-opt">Optional</em></span><textarea rows={3} value={f.about} onChange={set('about')} placeholder="Two or three sentences on what the role is and why it exists." /></label>
          <label className="ef-field"><span className="efl">Responsibilities, one per line <em className="ejf-opt">Optional</em></span><textarea rows={4} value={f.resp} onChange={set('resp')} placeholder={'Own the reporting pipeline\nRun the weekly planning'} /></label>
          <label className="ef-field"><span className="efl">Qualifications, one per line <em className="ejf-opt">Optional</em></span><textarea rows={4} value={f.quals} onChange={set('quals')} placeholder={'3+ years with SQL\nNice to have: dbt'} /></label>
          <div className="ejf-block">
            <span className="efl">Benefits &amp; perks <em className="ejf-opt">Optional</em></span>
            <span className="ef-hint">The first few become filters candidates can search on. Pick what is true.</span>
            <div className="ejf-chips">{BENEFITS.map((b) => (<button key={b} type="button" className={`ejf-chip${chosen.includes(b) ? ' on' : ''}`} onClick={() => toggleBenefit(b)}>{b}</button>))}</div>
          </div>
        </section>

        {/* 03 — Who sees it: the adjacency section, the part no other board has */}
        <section className="ejf-sec">
          <div className="ejf-sec-h"><span className="ejf-num">03</span><h2>Who sees it</h2></div>
          {occ ? (
            <aside className="ejf-fanbox">
              {info && info.n > 0 ? (
                <>
                  <p className="ew-fan-lead">{`${occ.title} sits on ${info.n} measured route${info.n === 1 ? '' : 's'} in our skill graph. Your listing shows on each, to candidates arriving with the gap already itemized:`}</p>
                  <ul className="ew-fan-list">{info.top.map((x) => (<li key={x.t}><span>{x.t} &rarr; {occ.title}</span><span className="ew-fan-m">{x.m}% ready</span></li>))}</ul>
                  {info.live > 0 && <p className="ew-fan-note">{`Joins ${info.live} live ${occ.title.toLowerCase()} listings, featured above all of them.`}</p>}
                </>
              ) : (<p className="ew-fan-lead">{`${occ.title} listings appear on its board, its salary page, and everywhere the instrument ranks it for a candidate's skills.`}</p>)}
            </aside>
          ) : (
            <p className="ef-hint">Type the role title above and pick the closest occupation — this section then shows the measured routes your listing appears on.</p>
          )}
          <div className="ejf-block">
            <span className="efl">Required skills <em className="ejf-opt">Optional</em></span>
            <span className="ef-hint">We match your role to people who already hold these, from adjacent professions. Search our bank, or add your own.</span>
            {skillList.length > 0 && (<div className="ejf-chips ejf-skill-tags">{skillList.map((s) => (<button key={s} type="button" className="ejf-chip on" onClick={() => setSkillList((p) => p.filter((x) => x !== s))}>{s}<span className="ejf-x">&times;</span></button>))}</div>)}
            <div className="ejf-skillbox">
              <input value={skillQ} onChange={(e) => setSkillQ(e.target.value)} placeholder="Type a skill, e.g. Figma, Python, Revit" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (skillMatches[0]) addSkill(skillMatches[0]); else if (canCustom) addSkill(q); } }} />
              {(skillMatches.length > 0 || canCustom) && (<div className="ejf-skill-dd">{skillMatches.map((s) => <button key={s} type="button" onClick={() => addSkill(s)}>{s}</button>)}{canCustom && <button type="button" className="ejf-skill-add" onClick={() => addSkill(q)}>Add &ldquo;{q}&rdquo; as a new skill</button>}</div>)}
            </div>
          </div>
        </section>

        {/* 04 — How to apply */}
        <section className="ejf-sec">
          <div className="ejf-sec-h"><span className="ejf-num">04</span><h2>How to apply</h2></div>
          <div className="ef-row2">
            <label className={`ef-field${err(noApply)}`}><span className="efl">Apply URL <em className="ejf-req">Required</em></span><input value={f.applyUrl} onChange={set('applyUrl')} placeholder="https://&hellip;" inputMode="url" /></label>
            <label className={`ef-field${err(noApply)}`}><span className="efl">or apply email</span><input type="email" value={f.applyEmail} onChange={set('applyEmail')} placeholder="jobs@company.com" /></label>
          </div>
          <p className="ef-hint ejf-wide">Every listing links out to you. One of these is required; a link to your own form pulls more, cleaner applicants than an email.</p>
        </section>

        {/* 05 — The company */}
        <section className="ejf-sec">
          <div className="ejf-sec-h"><span className="ejf-num">05</span><h2>The company</h2></div>
          <div className="ef-row2">
            <label className={`ef-field${err(noCompany)}`}><span className="efl">Company name <em className="ejf-req">Required</em></span><input value={f.company} onChange={set('company')} autoComplete="organization" placeholder="Your brand name, no Inc. / Ltd." /></label>
            <label className="ef-field"><span className="efl">Logo URL <em className="ejf-opt">Optional</em></span><input value={f.logo} onChange={set('logo')} placeholder="https://&hellip;/logo.png" inputMode="url" /></label>
          </div>
        </section>

        {/* 06 — Your email */}
        <section className="ejf-sec">
          <div className="ejf-sec-h"><span className="ejf-num">06</span><h2>Your email</h2></div>
          <div className="ef-row2">
            <label className={`ef-field${err(noEmail)}`}><span className="efl">Work email <em className="ejf-req">Required</em></span><input type="email" value={f.email} onChange={set('email')} autoComplete="email" placeholder="you@company.com" /><span className="ef-hint">Private. Where we send the review result.</span></label>
            <label className="ef-field"><span className="efl">Your name <em className="ejf-opt">Optional</em></span><input value={f.name} onChange={set('name')} autoComplete="name" /></label>
          </div>
        </section>

        {/* phones: the same live preview, inline before the submit */}
        <div className="ejf-prev ejf-prev-inline" aria-label="Listing preview">
          <span className="ejf-prev-cap">Preview</span>
          <ul className="job-list"><JobCard j={previewJob} v2 /></ul>
        </div>

        <div className="ejf-submit">
          <button className="ejf-send" disabled={submitting} onClick={attemptSend}>
            <span>{submitting ? 'Submitting\u2026' : 'Submit for review'}</span>
            <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg>
          </button>
          {tried && !ok && <p className="ejf-errbox">Before you can submit, add {missing.join(', ')} &mdash; the fields marked Required above.</p>}
          {submitError && <p className="ejf-errbox">{submitError}</p>}
          <p className="ejf-note">Free during early access &mdash; no card, no account.</p>
          <p className="ejf-note">Reviewed within 1 business day. You get an email either way. Questions first? <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>.</p>
        </div>
      </div>

      <aside className="ejf-rail" aria-label="Listing preview">
        <div className="ejf-prev">
          <span className="ejf-prev-cap">Preview</span>
          <ul className="job-list"><JobCard j={previewJob} v2 /></ul>
          <span className="ejf-prev-note">Your card on the board, as you type.</span>
        </div>
      </aside>
    </div>
  );
}
