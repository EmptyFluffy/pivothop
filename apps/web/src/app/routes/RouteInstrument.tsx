'use client';
import { useEffect, useRef } from 'react';
import { SHELL } from '@/lib/shell';
import { DATA } from '@/lib/data';

type Controller = { loadOrigin: (d: unknown) => void };
type Origin = { slug: string; title: string; ok: boolean };
type Payload = { originSlug: string; originLabel: string };

/* The instrument band as a saved state (docs/05): full graph for THIS route's
   origin, its destination already in click-focus. Reuses the landing's markup
   by extracting only the instrument section from SHELL — physics and label
   state stay in the vanilla module, untouched (porting non-negotiables). No
   search bar here: a route page is one state; changing origin happens on the
   instrument home. Hop navigation (double-click) still works via lite hooks so
   the graph stays fully explorable. Architect uses the baked DATA for an
   instant first paint; every other origin loads from its public/data file. */
export default function RouteInstrument({ origin, focus }: { origin: string; focus: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current || !ref.current) return;
    mounted.current = true;

    const t = document.createElement('template');
    t.innerHTML = SHELL;
    const defs = t.content.querySelector('svg');            // symbol defs
    const instr = t.content.querySelector('.instr');
    const modal = t.content.querySelector('#xmodal');
    if (!instr) return;
    instr.querySelector('.searchwrap')?.remove();           // saved state, no origin switcher
    const host = ref.current;
    if (defs) host.appendChild(defs);
    host.appendChild(instr);
    if (modal) host.appendChild(modal);

    let origins: Origin[] = [];
    fetch('/data/origins.json').then((r) => r.json()).then((d) => (origins = d.origins || [])).catch(() => {});

    const loadInitial: Promise<Payload> = origin === 'architect'
      ? Promise.resolve(DATA as unknown as Payload)
      : fetch(`/data/${origin}.json`).then((r) => r.json());

    Promise.all([import('@/lib/instrument.js'), loadInitial]).then(([m, data]) => {
      const mount = (m as unknown as { mountInstrument: (d: unknown, h: unknown) => Controller }).mountInstrument;
      let hops = [{ slug: data.originSlug, title: data.originLabel }];
      const controller = mount(data, {
        canRecenter: (slug: string) => !!origins.find((o) => o.slug === slug && o.ok) && slug !== hops[hops.length - 1].slug,
        onRecenter: async (slug: string, title: string) => {
          try {
            const d = await fetch(`/data/${slug}.json`).then((r) => { if (!r.ok) throw new Error(); return r.json(); });
            hops = [...hops, { slug, title }];
            controller.loadOrigin(d);
          } catch { /* keep current state */ }
        },
        getTrail: () => hops,
        onTrailJump: async (i: number) => {
          const h = hops[i];
          if (!h) return;
          hops = hops.slice(0, i + 1);
          const d = h.slug === origin && origin === 'architect'
            ? DATA
            : await fetch(`/data/${h.slug}.json`).then((r) => r.json()).catch(() => null);
          if (d) controller.loadOrigin(d);
        },
      });
      // Focus the page's destination through the same code path a user's click
      // takes — after the silent settle so the unfold isn't interrupted.
      const tryFocus = (attempt = 0) => {
        const btn = document.querySelector<HTMLButtonElement>(`.rail-item[data-id="${focus}"]`);
        if (btn) btn.click();
        else if (attempt < 10) setTimeout(() => tryFocus(attempt + 1), 300);
      };
      setTimeout(() => tryFocus(), 1500);
    });
  }, [origin, focus]);

  return <div ref={ref} className="route-instrument" suppressHydrationWarning />;
}
