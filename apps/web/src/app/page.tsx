'use client';
import { useEffect, useRef } from 'react';
import { SHELL } from '@/lib/shell';
import { DATA } from '@/lib/data';
import { seedChips, rankPersonalized } from '@/lib/personalize';
import { wireMobileNav } from '@/lib/mobilenav';

type Origin = { slug: string; title: string; field: string; postings: number; ok: boolean; syn: string[] };
type Controller = { loadOrigin: (d: unknown) => void };
type Hooks = { canRecenter: (slug: string) => boolean; onRecenter: (slug: string, title: string) => void; getTrail: () => { slug: string; title: string }[]; onTrailJump: (i: number) => void };
type Profiles = Record<string, { s: Record<string, number>; den: number }>;
type OccMeta = Record<string, { title: string; field: string; cluster: string | null; desc: string; salary: string | null; demand: string; remote: string; postings: number }>;

// Phase C/B: React owns the page; the tuned graph physics run as a vanilla module mounted
// imperatively (per the porting non-negotiables). The search bar is the front door:
// role typeahead (origin switching) + editable skill chips (personalization — readiness
// re-derives for every occupation from the user's actual skill vector).
export default function Home() {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current || !ref.current) return;
    mounted.current = true;
    ref.current.innerHTML = SHELL;
    wireMobileNav();
    import('@/lib/cloud.js').then((m) => {
      const c = document.getElementById('cloudCanvas') as HTMLCanvasElement | null;
      if (c) (m as { initCloud: (c: HTMLCanvasElement, cap: HTMLElement | null) => void }).initCloud(c, document.getElementById('cloudCap'));
    });
    import('@/lib/instrument.js').then((m) => {
      const mount = (m as unknown as { mountInstrument: (d: unknown, h: Hooks) => Controller }).mountInstrument;
      wireSearch(mount);
      // section-enter reveals — never the instrument band itself
      document.querySelectorAll('.how .step, .fieldband, .capture, .proof, .faq').forEach((el) => el.classList.add('rv'));
      import('@/lib/reveal.js').then((r) => (r as { mountReveal: (x?: Element) => void }).mountReveal());
    });
  }, []);

  return (
    <>
      <div ref={ref} suppressHydrationWarning>
        {/* Server-rendered boot state: real brand copy + links to the key pages,
            so the initial HTML is crawlable and the homepage passes structure to
            Google (the graph replaces this on mount; it also serves as the no-JS
            fallback). Rendered once, then wiped by ref.innerHTML = SHELL. */}
        <div className="home-boot">
          <span className="home-boot-mark" aria-hidden="true">
            <svg viewBox="-8 -12 139 124"><g fill="currentColor"><path d="M31.9 0 A25.3 15 0 0 0 82.5 0 Z" /><path fillRule="evenodd" d="M83.3 0 L92 0 C104 0 116 8 121 20 C124 27 123 34 119 38 C112 41 100 40 90 40 L83.3 40 Z M103.3 20 a3.7 3.7 0 1 0 0.01 0 Z" /><path d="M83.1 40 L83.1 76 C91 76 99 82 102 90 C103.5 94 103 98 101.5 99.7 L24 99.7 C23.5 92 25 84 28.6 75 C32 64 40 53 58.9 45 C67 41 73 40 78.6 40 Z" /><circle cx="10" cy="89.5" r="10" /></g></svg>
          </span>
          <h1>PivotHop — Career moves, measured.</h1>
          <p>A career-navigation instrument. It reads live job postings and returns the routes your skills can actually reach — with the salary, the skill gap, and the honest odds attached.</p>
          <nav className="home-boot-nav" aria-label="PivotHop">
            <a href="/jobs">Job board</a>
            <a href="/routes">Career routes</a>
            <a href="/salary">Salaries</a>
            <a href="/employers">Post a job</a>
            <a href="/blog">Blog</a>
            <a href="/glossary">Glossary</a>
            <a href="/about">About</a>
          </nav>
        </div>
      </div>
      {/* Server-rendered FAQ schema (the visible FAQ mounts client-side with the
          rest of SHELL; this keeps the structured data in the initial HTML for
          reliable rich-result eligibility). Text mirrors the SHELL FAQ. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: LANDING_FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      }) }} />
    </>
  );
}

const LANDING_FAQ = [
  { q: 'How do I know which careers my skills transfer to?', a: 'Start from your skills, not a list of job titles. PivotHop reads live postings for every occupation, measures how much of a destination role you already cover, and ranks the moves by that overlap and by how often people actually make them. You get a shortlist of reachable roles with the salary, the skill gap, and the odds attached.' },
  { q: 'What career can I switch to without going back to school?', a: 'Most adjacent ones. The moves that require a new degree or license, like nurse practitioner or lawyer, are the exception, and the instrument flags them explicitly. The larger group is roles you reach by closing a skill gap on the job or with short courses, which our data estimates at a few months to two years.' },
  { q: 'Which careers are the easiest to switch into?', a: 'The ones next to what you already do. In our data the smoothest moves share a skill base: business analyst to project manager sits at 66 percent readiness, with accountant to financial analyst and data analyst to data engineer close behind. Difficulty rises with the size of the skill gap and whether a license stands in the way.' },
  { q: 'How long does a career change take?', a: 'Most realistic pivots reach hiring readiness in six months to two years, set by the size of the skill gap rather than your effort. High-overlap moves land at the short end; licensed destinations run far longer because the barrier is a credential, not a skill. Every route on the instrument carries its own estimate.' },
  { q: 'Can I change careers at 40 or later?', a: 'The skill gap is the barrier, not your age. Occupational transfers happen across every age band in the federal data, and an established worker usually brings more transferable skills, not fewer. The useful question is which destination your current skills reach soonest, which is what the instrument measures.' },
  { q: 'Will changing careers mean a pay cut?', a: 'Not necessarily, and often the reverse. In our data a third of strong adjacent moves point to a destination that pays more than the origin. PivotHop shows the posted salary band for every route, so you see the pay consequence before you decide instead of assuming a pivot is a step down.' },
  { q: 'How do I find my transferable skills?', a: 'Look at what your work requires, not what your title says. PivotHop seeds a skill profile from your occupation’s typical postings, then lets you edit it to match what you actually do and re-derives every route from it. The skills that open the most doors are usually the general ones, like communication, analysis, and project management, that you stopped noticing you had.' },
];

// The canvas starts empty: a prompt, not a pre-loaded graph. The visitor names
// a role (or taps an example) and the graph draws from there.
const EMPTY_HTML =
  '<span class="ge-mark"><svg viewBox="0 0 123.3 100" aria-hidden="true"><use href="#rabbit"/></svg></span>' +
  '<h3>Map your next move.</h3>' +
  '<p>Name your current role in the search above. The graph draws every career your skills can already reach — with the salary, the gap, and the odds attached.</p>' +
  '<div class="ge-eg"><span class="lbl">Or start from</span>' +
  '<button data-slug="architect" data-title="Architect">Architect</button>' +
  '<button data-slug="software-engineer" data-title="Software Engineer">Software Engineer</button>' +
  '<button data-slug="registered-nurse" data-title="Registered Nurse">Registered Nurse</button>' +
  '<button data-slug="accountant" data-title="Accountant">Accountant</button></div>';

function el(tag: string, css: Partial<CSSStyleDeclaration>, html?: string) {
  const e = document.createElement(tag);
  Object.assign(e.style, css);
  if (html) e.innerHTML = html;
  return e;
}

function wireSearch(mount: (d: unknown, h: Hooks) => Controller) {
  const roleInput = document.getElementById('qRole') as HTMLInputElement | null;
  const skillInput = document.getElementById('qSkills') as HTMLInputElement | null;
  if (!roleInput || !skillInput) return;

  // ---------- hop navigation state (the trail) ----------
  let hops: { slug: string; title: string }[] = [{ slug: 'architect', title: 'Architect' }];
  const hooks: Hooks = {
    canRecenter: (slug) => !!origins.find((o) => o.slug === slug && o.ok) && slug !== current.slug,
    onRecenter: (slug, title) => { hopTo(slug, title, true, 'push'); },
    getTrail: () => hops,
    onTrailJump: (i) => { const h = hops[i]; if (!h) return; hops = hops.slice(0, i + 1); hopTo(h.slug, h.title, false, 'replace'); },
  };
  const controller = mount(DATA, hooks);

  // Empty state: the default graph mounts hidden behind a prompt; the
  // role-specific proof stats stay hidden; the first role load dismisses both.
  const proofEl = document.querySelector('.proof');
  proofEl?.classList.add('pre-role');
  const bandEl0 = document.getElementById('bandEl');
  let emptyEl: HTMLElement | null = el('div', {}, EMPTY_HTML);
  emptyEl.className = 'graph-empty';
  if (bandEl0) { bandEl0.style.position = 'relative'; bandEl0.appendChild(emptyEl); }
  emptyEl.querySelectorAll('button[data-slug]').forEach((b) =>
    b.addEventListener('click', () => loadOriginBySlug((b as HTMLElement).dataset.slug!, (b as HTMLElement).dataset.title!)));
  function dismissEmpty() {
    if (emptyEl) { emptyEl.remove(); emptyEl = null; }
    proofEl?.classList.remove('pre-role');
  }

  function setStatus(msg: string | null) {
    const lbl = document.querySelector('.band-head .lbl');
    if (!lbl) return;
    if (msg) { (lbl as HTMLElement).dataset.prev = lbl.innerHTML; lbl.innerHTML = msg; }
  }
  async function hopTo(slug: string, title: string, addHop: boolean, nav: 'push' | 'replace' | 'none' = 'push') {
    if (addHop) hops = [...hops, { slug, title }];
    current = { slug, title };
    roleInput!.value = title;
    if (personalized) {
      // your skills travel with you: re-rank the personalized graph from the new center
      controller.loadOrigin(rankPersonalized(chips, profiles, occMeta, skillNames, slug, title));
    } else {
      setStatus(`Career graph \u00b7 reading ${title} postings\u2026`);
      try {
        standardData = await fetch(`/data/${slug}.json`).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); });
      } catch {
        setStatus(`Couldn\u2019t load ${title} \u2014 check your connection and try again.`);
        hops = hops.filter((h) => h.slug !== slug);
        return;
      }
      chips = seedChips(profiles, slug);
      refreshSummary();
      controller.loadOrigin(standardData);
    }
    dismissEmpty();
    if (nav === 'push') history.pushState({ hops }, '', `?from=${slug}`);
    else if (nav === 'replace') history.replaceState({ hops }, '', `?from=${slug}`);
  }
  window.addEventListener('popstate', (e) => {
    const st = e.state as { hops?: { slug: string; title: string }[] } | null;
    if (st?.hops?.length) { hops = st.hops; const last = hops[hops.length - 1]; hopTo(last.slug, last.title, false, 'none'); }
  });
  history.replaceState({ hops }, '', location.pathname);

  // ---------- shared state ----------
  let origins: Origin[] = [];
  let profiles: Profiles = {};
  let occMeta: OccMeta = {};
  let skillNames: Record<string, string> = {};
  let cooccur: Record<string, { id: string; name: string }[]> = {};
  let current = { slug: 'architect', title: 'Architect' };
  let standardData: unknown = DATA; // the server-derived origin view
  let chips: string[] = [];
  let personalized = false;
  let applyTimer: ReturnType<typeof setTimeout> | null = null;

  fetch('/data/origins.json').then((r) => r.json()).then((d) => (origins = d.origins || []));
  const core = Promise.all([
    fetch('/data/skill-profiles.json').then((r) => r.json()).then((d) => (profiles = d.profiles)),
    fetch('/data/occ-meta.json').then((r) => r.json()).then((d) => (occMeta = d.meta)),
    fetch('/data/skills-meta.json').then((r) => r.json()).then((d) => (skillNames = d.names)),
  ]).then(() => { if (!emptyEl) { chips = seedChips(profiles, current.slug); refreshSummary(); } });
  fetch('/data/skill-cooccur.json').then((r) => r.json()).then((d) => (cooccur = d.skills || {}));

  // ---------- role typeahead ----------
  const taBox = el('div', { position: 'absolute', zIndex: '50', display: 'none', background: 'var(--card)', border: '1px solid var(--ink)', maxHeight: '340px', overflowY: 'auto', boxShadow: '0 18px 36px rgba(21,21,26,.10)' });
  taBox.className = 'ta-drop';
  document.body.appendChild(taBox);
  // Anchor flush to the search cell: left/width match the field's cell exactly and the
  // dropdown's top border collapses into the searchbar's bottom border (1px overlap) —
  // predictable trigger-aligned placement per combobox UX practice.
  const placeUnder = (box: HTMLElement, input: HTMLElement) => {
    const cell = (input.closest('label') as HTMLElement) || input;
    const r = cell.getBoundingClientRect();
    Object.assign(box.style, {
      left: r.left + window.scrollX + 'px',
      top: r.bottom + window.scrollY - 1 + 'px',
      width: r.width + 'px',
    });
  };

  async function loadOriginBySlug(slug: string, title: string) {
    hops = [{ slug, title }];
    history.replaceState({ hops }, '', `?from=${slug}`);
    current = { slug, title };
    roleInput!.value = title;
    taBox.style.display = 'none';
    setStatus(`Career graph \u00b7 reading ${title} postings\u2026`);
    try {
      standardData = await fetch(`/data/${slug}.json`).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); });
    } catch {
      setStatus(`Couldn\u2019t load ${title} \u2014 check your connection and try again.`);
      return;
    }
    personalized = false;
    chips = seedChips(profiles, slug);
    refreshSummary();
    controller.loadOrigin(standardData);
    dismissEmpty();
    document.getElementById('bandEl')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderTa(q: string) {
    const query = q.trim().toLowerCase();
    // Search titles AND synonyms — "web designer" must find UX Designer. When the hit
    // came via a synonym, show it as context. Occupations without enough data appear
    // disabled with an honest label instead of silently missing (per the docs' rule:
    // the empty state is shown, never nothing).
    // word-boundary ranking: a query like "ai" must surface "AI Engineer" (word start),
    // never "M-ai-ntenance" (mid-word substring) first.
    const wordStart = (text: string, q: string) => text.split(/[\s/&-]+/).some((w) => w.startsWith(q));
    const scored = origins
      .map((o) => {
        const t = o.title.toLowerCase();
        if (!query) return { o, via: null as string | null, rank: o.ok ? 0 : 1 };
        let rank: number | null = null;
        let via: string | null = null;
        if (t.startsWith(query)) rank = 0;
        else if (wordStart(t, query)) rank = 1;
        else {
          const synW = (o.syn || []).find((x) => wordStart(x, query));
          if (synW) { rank = 2; via = synW; }
          else if (t.includes(query)) rank = 3;
          else {
            const synI = (o.syn || []).find((x) => x.includes(query));
            if (synI) { rank = 4; via = synI; }
          }
        }
        if (rank == null) return null;
        // data-thin occupations sink a little, but an exact title hit must stay visible
        return { o, via, rank: rank + (o.ok ? 0 : 1.5) };
      })
      .filter((x): x is { o: Origin; via: string | null; rank: number } => !!x)
      .sort((a, b) => a.rank - b.rank || b.o.postings - a.o.postings)
      .slice(0, 8);
    if (!scored.length) { taBox.style.display = 'none'; return; }
    taBox.innerHTML = scored.map(({ o, via }) => {
      const right = o.ok
        ? `<span style="font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)">${o.field}</span>`
        : `<span style="font-family:var(--mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--rule-2)">Not enough data yet</span>`;
      const viaLine = via ? `<span style="display:block;font-family:var(--mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);margin-top:2px">${via} →</span>` : '';
      return `<button class="ta-item" data-slug="${o.slug}" data-title="${o.title}" ${o.ok ? '' : 'disabled'} style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;width:100%;text-align:left;background:none;border:none;border-bottom:0.5px solid var(--rule);padding:11px 16px;font:inherit;color:${o.ok ? 'var(--ink)' : 'var(--ink-3)'};cursor:${o.ok ? 'pointer' : 'default'}"><span style="font-size:14.5px">${viaLine}${o.title}</span>${right}</button>`;
    }).join('');
    taBox.querySelectorAll<HTMLButtonElement>('.ta-item:not([disabled])').forEach((b) => {
      b.addEventListener('mousedown', (e) => { e.preventDefault(); loadOriginBySlug(b.dataset.slug!, b.dataset.title!); });
    });
    placeUnder(taBox, roleInput!);
    taBox.style.display = 'block';
  }
  let taIdx = -1;
  function taHighlight(items: NodeListOf<HTMLButtonElement>) {
    items.forEach((b, i) => b.classList.toggle('hi', i === taIdx));
    if (taIdx >= 0 && items[taIdx]) items[taIdx].scrollIntoView({ block: 'nearest' });
  }
  roleInput.addEventListener('focus', () => { taIdx = -1; renderTa(roleInput.value); });
  roleInput.addEventListener('input', () => { taIdx = -1; renderTa(roleInput.value); });
  roleInput.addEventListener('blur', () => setTimeout(() => (taBox.style.display = 'none'), 150));
  roleInput.addEventListener('keydown', (e) => {
    if (taBox.style.display !== 'block') return;
    const items = taBox.querySelectorAll<HTMLButtonElement>('.ta-item:not([disabled])');
    if (!items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); taIdx = (taIdx + 1) % items.length; taHighlight(items); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); taIdx = (taIdx - 1 + items.length) % items.length; taHighlight(items); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = (taIdx >= 0 && items[taIdx]) || items[0];
      if (pick) loadOriginBySlug(pick.dataset.slug!, pick.dataset.title!);
    } else if (e.key === 'Escape') { taBox.style.display = 'none'; roleInput!.blur(); }
  });

  // ---------- skill chips panel ----------
  const panel = el('div', { position: 'absolute', zIndex: '60', display: 'none', background: 'var(--card)', border: '1px solid var(--ink)', padding: '18px 30px 16px', boxShadow: '0 18px 36px rgba(21,21,26,.10)', maxHeight: '420px', overflowY: 'auto' });
  panel.className = 'chips-drop';
  document.body.appendChild(panel);

  function refreshSummary() {
    const names = chips.map((c) => skillNames[c] || c);
    skillInput!.value = names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3} more` : '');
  }

  function scheduleApply() {
    if (applyTimer) clearTimeout(applyTimer);
    applyTimer = setTimeout(() => {
      personalized = true;
      const pdata = rankPersonalized(chips, profiles, occMeta, skillNames, current.slug, current.title);
      controller.loadOrigin(pdata);
    }, 650);
  }

  function suggestions(q: string): { id: string; name: string }[] {
    const have = new Set(chips);
    const query = q.trim().toLowerCase();
    if (query) {
      return Object.entries(skillNames)
        .filter(([id, n]) => !have.has(id) && n.toLowerCase().includes(query))
        .slice(0, 6).map(([id, n]) => ({ id, name: n }));
    }
    // no query: co-occurrence suggestions from current chips ("you have Rhino → Grasshopper")
    const seen = new Map<string, number>();
    chips.forEach((c) => (cooccur[c] || []).forEach((r, i) => { if (!have.has(r.id)) seen.set(r.id, (seen.get(r.id) || 0) + (10 - i)); }));
    return [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id]) => ({ id, name: skillNames[id] || id }));
  }

  function renderPanel(addQuery = '', animateId?: string) {
    const chipHtml = chips.map((c) =>
      `<button class="chip${c === animateId ? ' chip-in' : ''}" data-id="${c}" title="Remove" style="display:inline-flex;align-items:center;gap:7px;background:var(--accent-tint);border:none;color:var(--accent-press);font:inherit;font-size:12.5px;padding:6px 10px;margin:0 6px 6px 0;cursor:pointer">${skillNames[c] || c}<span style="font-weight:700">&times;</span></button>`
    ).join('') || '<span style="font-size:12.5px;color:var(--ink-3)">No skills — add some below</span>';
    const sugg = suggestions(addQuery);
    const suggHtml = sugg.map((s) =>
      `<button class="sugg" data-id="${s.id}" style="display:inline-flex;background:none;border:0.5px solid var(--rule-2);color:var(--ink-2);font:inherit;font-size:12px;padding:5px 10px;margin:0 6px 6px 0;cursor:pointer">+ ${s.name}</button>`
    ).join('') || '<span style="font-size:11.5px;color:var(--ink-3)">Type to search the skill dictionary</span>';
    panel.innerHTML =
      `<div style="font-family:var(--mono);font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3);margin-bottom:10px">Your skills — the graph derives from these</div>` +
      `<div>${chipHtml}</div>` +
      `<input id="chipAdd" type="text" placeholder="Add a skill…" value="${addQuery.replace(/"/g, '')}" autocomplete="off" style="width:100%;background:none;border:none;border-bottom:1px solid var(--ink);font:inherit;font-size:14px;padding:8px 0;margin:10px 0 10px;outline:none;color:var(--ink)"/>` +
      `<div style="font-family:var(--mono);font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);margin-bottom:8px">${addQuery ? 'Matches' : 'People with your skills also list'}</div>` +
      `<div>${suggHtml}</div>` +
      `<div style="display:flex;justify-content:space-between;margin-top:12px;border-top:0.5px solid var(--rule);padding-top:10px">` +
      `<button id="chipReset" style="background:none;border:none;font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3);cursor:pointer">Reset to ${current.title}</button>` +
      `<span style="font-family:var(--mono);font-size:10px;color:var(--ink-3)">${chips.length} skills</span></div>`;

    panel.querySelectorAll<HTMLButtonElement>('.chip').forEach((b) =>
      b.addEventListener('mousedown', (e) => {
        e.preventDefault();
        b.classList.add('chip-out');
        setTimeout(() => { chips = chips.filter((c) => c !== b.dataset.id); refreshSummary(); renderPanel(); scheduleApply(); }, 150);
      })
    );
    panel.querySelectorAll<HTMLButtonElement>('.sugg').forEach((b) =>
      b.addEventListener('mousedown', (e) => { e.preventDefault(); const id = b.dataset.id!; if (!chips.includes(id)) chips.push(id); refreshSummary(); renderPanel('', id); scheduleApply(); })
    );
    const add = panel.querySelector<HTMLInputElement>('#chipAdd')!;
    add.addEventListener('input', () => { const v = add.value; renderPanel(v); (panel.querySelector('#chipAdd') as HTMLInputElement).focus(); const na = panel.querySelector<HTMLInputElement>('#chipAdd')!; na.setSelectionRange(v.length, v.length); });
    panel.querySelector<HTMLButtonElement>('#chipReset')!.addEventListener('mousedown', (e) => {
      e.preventDefault(); chips = seedChips(profiles, current.slug); personalized = false; refreshSummary(); renderPanel();
      controller.loadOrigin(standardData);
    });
  }

  // The skills field is a live combobox: focus clears it to a query box (summary
  // restores on close), typing filters the dictionary, Enter adds the top match,
  // Backspace on empty removes the last chip, Escape closes. Fully keyboard-usable.
  let skillsOpen = false;
  function openSkills() {
    skillsOpen = true;
    skillInput!.value = '';
    renderPanel();
    placeUnder(panel, skillInput!);
    panel.style.display = 'block';
  }
  function closeSkills() {
    if (!skillsOpen) return;
    skillsOpen = false;
    panel.style.display = 'none';
    refreshSummary();
  }
  skillInput.addEventListener('focus', async () => { await core; openSkills(); });
  skillInput.addEventListener('input', () => { if (skillsOpen) renderPanel(skillInput!.value); });
  skillInput.addEventListener('keydown', (e) => {
    if (!skillsOpen) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      const top = panel.querySelector<HTMLButtonElement>('.sugg');
      if (top) { const id = top.dataset.id!; if (!chips.includes(id)) chips.push(id); skillInput!.value = ''; renderPanel('', id); scheduleApply(); }
    } else if (e.key === 'Backspace' && !skillInput!.value && chips.length) {
      chips = chips.slice(0, -1); renderPanel(); scheduleApply();
    } else if (e.key === 'Escape') { closeSkills(); skillInput!.blur(); }
  });
  skillInput.addEventListener('blur', (e) => {
    setTimeout(() => { if (!panel.contains(document.activeElement)) closeSkills(); }, 140);
  });
  document.addEventListener('mousedown', (e) => {
    const t = e.target as Node;
    if (panel.style.display === 'block' && t.isConnected && !panel.contains(t) && t !== skillInput) closeSkills();
  });
  window.addEventListener('scroll', () => {
    if (taBox.style.display === 'block') placeUnder(taBox, roleInput);
    if (panel.style.display === 'block') placeUnder(panel, skillInput);
  });
}
