'use client';
import { useEffect, useRef } from 'react';
import { SHELL } from '@/lib/shell';
import { DATA } from '@/lib/data';

type Origin = { slug: string; title: string; field: string; postings: number };
type Controller = { loadOrigin: (d: unknown) => void };

// Phase C: React owns the page; the tuned graph physics run as a vanilla module mounted
// imperatively into the injected shell (per the porting non-negotiables). Origin switching
// (typeahead over the taxonomy → fetch that origin's data → re-derive) is wired here as
// vanilla DOM against the injected shell, keeping the instrument's one-world model.
export default function Home() {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current || !ref.current) return;
    mounted.current = true;
    ref.current.innerHTML = SHELL;
    import('@/lib/instrument.js').then((m) => {
      const controller = (m as unknown as { mountInstrument: (d: unknown) => Controller }).mountInstrument(DATA);
      wireTypeahead(controller);
    });
  }, []);

  return <div ref={ref} suppressHydrationWarning />;
}

function wireTypeahead(controller: Controller) {
  const input = document.getElementById('qRole') as HTMLInputElement | null;
  const bar = document.querySelector('.searchbar') as HTMLElement | null;
  if (!input || !bar) return;

  let origins: Origin[] = [];
  let current = 'architect';
  fetch('/data/origins.json').then((r) => r.json()).then((d) => (origins = d.origins || []));

  const box = document.createElement('div');
  box.className = 'ta-box';
  Object.assign(box.style, {
    position: 'absolute', zIndex: '50', display: 'none', background: 'var(--card)',
    border: '1px solid var(--ink)', maxHeight: '340px', overflowY: 'auto', minWidth: '340px',
  });
  document.body.appendChild(box);

  function place() {
    const r = input!.getBoundingClientRect();
    box.style.left = r.left + window.scrollX + 'px';
    box.style.top = r.bottom + window.scrollY + 'px';
    box.style.width = r.width + 'px';
  }

  async function load(slug: string, title: string) {
    if (slug === current) return;
    current = slug;
    input!.value = title;
    box.style.display = 'none';
    const data = await fetch(`/data/${slug}.json`).then((r) => r.json());
    controller.loadOrigin(data);
    document.getElementById('bandEl')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function render(q: string) {
    const query = q.trim().toLowerCase();
    const hits = origins
      .filter((o) => !query || o.title.toLowerCase().includes(query))
      .sort((a, b) => b.postings - a.postings)
      .slice(0, 8);
    if (!hits.length) { box.style.display = 'none'; return; }
    box.innerHTML = hits
      .map(
        (o) =>
          `<button class="ta-item" data-slug="${o.slug}" data-title="${o.title}"` +
          ` style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;width:100%;text-align:left;` +
          `background:none;border:none;border-bottom:0.5px solid var(--rule);padding:11px 16px;cursor:pointer;font:inherit;color:var(--ink)">` +
          `<span style="font-size:14.5px">${o.title}</span>` +
          `<span style="font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)">${o.field}</span>` +
          `</button>`
      )
      .join('');
    box.querySelectorAll<HTMLButtonElement>('.ta-item').forEach((b) => {
      b.addEventListener('mousedown', (e) => {
        e.preventDefault();
        load(b.dataset.slug!, b.dataset.title!);
      });
      b.addEventListener('mouseenter', () => (b.style.background = 'var(--paper-2)'));
      b.addEventListener('mouseleave', () => (b.style.background = 'none'));
    });
    place();
    box.style.display = 'block';
  }

  input.addEventListener('focus', () => render(input.value));
  input.addEventListener('input', () => render(input.value));
  input.addEventListener('blur', () => setTimeout(() => (box.style.display = 'none'), 150));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = box.querySelector<HTMLButtonElement>('.ta-item');
      if (first && box.style.display !== 'none') { e.preventDefault(); load(first.dataset.slug!, first.dataset.title!); }
    } else if (e.key === 'Escape') box.style.display = 'none';
  });
  window.addEventListener('scroll', () => { if (box.style.display === 'block') place(); });
}
