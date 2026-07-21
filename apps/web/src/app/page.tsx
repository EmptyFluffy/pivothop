'use client';
import { useEffect, useRef } from 'react';
import { SHELL } from '@/lib/shell';
import { DATA } from '@/lib/data';
import { seedChips, rankPersonalized } from '@/lib/personalize';

type Origin = { slug: string; title: string; field: string; postings: number };
type Controller = { loadOrigin: (d: unknown) => void };
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
    import('@/lib/instrument.js').then((m) => {
      const controller = (m as unknown as { mountInstrument: (d: unknown) => Controller }).mountInstrument(DATA);
      wireSearch(controller);
    });
  }, []);

  return <div ref={ref} suppressHydrationWarning />;
}

function el(tag: string, css: Partial<CSSStyleDeclaration>, html?: string) {
  const e = document.createElement(tag);
  Object.assign(e.style, css);
  if (html) e.innerHTML = html;
  return e;
}

function wireSearch(controller: Controller) {
  const roleInput = document.getElementById('qRole') as HTMLInputElement | null;
  const skillInput = document.getElementById('qSkills') as HTMLInputElement | null;
  if (!roleInput || !skillInput) return;

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
  ]).then(() => { chips = seedChips(profiles, current.slug); refreshSummary(); });
  fetch('/data/skill-cooccur.json').then((r) => r.json()).then((d) => (cooccur = d.skills || {}));

  // ---------- role typeahead ----------
  const taBox = el('div', { position: 'absolute', zIndex: '50', display: 'none', background: 'var(--card)', border: '1px solid var(--ink)', maxHeight: '340px', overflowY: 'auto' });
  document.body.appendChild(taBox);
  const placeUnder = (box: HTMLElement, input: HTMLElement) => {
    const r = input.getBoundingClientRect();
    Object.assign(box.style, { left: r.left + window.scrollX + 'px', top: r.bottom + window.scrollY + 'px', width: Math.max(r.width, 340) + 'px' });
  };

  async function loadOriginBySlug(slug: string, title: string) {
    current = { slug, title };
    roleInput!.value = title;
    taBox.style.display = 'none';
    standardData = await fetch(`/data/${slug}.json`).then((r) => r.json());
    personalized = false;
    chips = seedChips(profiles, slug);
    refreshSummary();
    controller.loadOrigin(standardData);
    document.getElementById('bandEl')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderTa(q: string) {
    const query = q.trim().toLowerCase();
    const hits = origins.filter((o) => !query || o.title.toLowerCase().includes(query)).sort((a, b) => b.postings - a.postings).slice(0, 8);
    if (!hits.length) { taBox.style.display = 'none'; return; }
    taBox.innerHTML = hits.map((o) =>
      `<button class="ta-item" data-slug="${o.slug}" data-title="${o.title}" style="display:flex;justify-content:space-between;gap:12px;width:100%;text-align:left;background:none;border:none;border-bottom:0.5px solid var(--rule);padding:11px 16px;cursor:pointer;font:inherit;color:var(--ink)"><span style="font-size:14.5px">${o.title}</span><span style="font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)">${o.field}</span></button>`
    ).join('');
    taBox.querySelectorAll<HTMLButtonElement>('.ta-item').forEach((b) => {
      b.addEventListener('mousedown', (e) => { e.preventDefault(); loadOriginBySlug(b.dataset.slug!, b.dataset.title!); });
    });
    placeUnder(taBox, roleInput!);
    taBox.style.display = 'block';
  }
  roleInput.addEventListener('focus', () => renderTa(roleInput.value));
  roleInput.addEventListener('input', () => renderTa(roleInput.value));
  roleInput.addEventListener('blur', () => setTimeout(() => (taBox.style.display = 'none'), 150));

  // ---------- skill chips panel ----------
  const panel = el('div', { position: 'absolute', zIndex: '60', display: 'none', background: 'var(--card)', border: '1px solid var(--ink)', padding: '16px 18px', width: '460px' });
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

  function renderPanel(addQuery = '') {
    const chipHtml = chips.map((c) =>
      `<button class="chip" data-id="${c}" title="Remove" style="display:inline-flex;align-items:center;gap:7px;background:var(--accent-tint);border:none;color:var(--accent-press);font:inherit;font-size:12.5px;padding:6px 10px;margin:0 6px 6px 0;cursor:pointer">${skillNames[c] || c}<span style="font-weight:700">&times;</span></button>`
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
      b.addEventListener('mousedown', (e) => { e.preventDefault(); chips = chips.filter((c) => c !== b.dataset.id); refreshSummary(); renderPanel(); scheduleApply(); })
    );
    panel.querySelectorAll<HTMLButtonElement>('.sugg').forEach((b) =>
      b.addEventListener('mousedown', (e) => { e.preventDefault(); if (!chips.includes(b.dataset.id!)) chips.push(b.dataset.id!); refreshSummary(); renderPanel(); scheduleApply(); })
    );
    const add = panel.querySelector<HTMLInputElement>('#chipAdd')!;
    add.addEventListener('input', () => { const v = add.value; renderPanel(v); (panel.querySelector('#chipAdd') as HTMLInputElement).focus(); const na = panel.querySelector<HTMLInputElement>('#chipAdd')!; na.setSelectionRange(v.length, v.length); });
    panel.querySelector<HTMLButtonElement>('#chipReset')!.addEventListener('mousedown', (e) => {
      e.preventDefault(); chips = seedChips(profiles, current.slug); personalized = false; refreshSummary(); renderPanel();
      controller.loadOrigin(standardData);
    });
  }

  skillInput.addEventListener('focus', async () => {
    await core;
    renderPanel();
    placeUnder(panel, skillInput);
    panel.style.display = 'block';
    skillInput.blur(); // panel takes over; the field is a summary, not a text input
  });
  document.addEventListener('mousedown', (e) => {
    const t = e.target as Node;
    if (panel.style.display === 'block' && t.isConnected && !panel.contains(t) && t !== skillInput) panel.style.display = 'none';
  });
  window.addEventListener('scroll', () => {
    if (taBox.style.display === 'block') placeUnder(taBox, roleInput);
    if (panel.style.display === 'block') placeUnder(panel, skillInput);
  });
}
