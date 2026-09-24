'use client';
import { useEffect } from 'react';
import { supabaseBrowser } from '../../lib/supabase-browser';
import { companyInitial, monoTint } from '../jobs/JobCard';

/* Signed in, every locked row on a static page (a listing's header, the
   "More X roles" cards, category and company pages) gets its employer name
   and logo from /api/direct/peek and stops looking locked. The HTML is the
   same for everyone; this patches the DOM after mount. Elements opt in with
   data-lk="occ/id" (JobCard, the detail header). The live board (JobsBrowse)
   patches its own state as well; a second pass over the same DOM sets the
   same values. Name and logo only: the apply link and the text still come
   per posting through /api/direct. */
export default function RevealDirect() {
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    let running = false;
    const run = async () => {
      if (running) return;
      running = true;
      try {
        const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-lk]'));
        const byOcc = new Map<string, Map<string, HTMLElement[]>>();
        for (const n of nodes) {
          const [occ, id] = (n.dataset.lk ?? '').split('/');
          if (!occ || !id) continue;
          const m = byOcc.get(occ) ?? byOcc.set(occ, new Map()).get(occ)!;
          (m.get(id) ?? m.set(id, []).get(id)!).push(n);
        }
        for (const [occ, m] of byOcc) {
          const ids = [...m.keys()];
          for (let i = 0; i < ids.length; i += 60) {
            const chunk = ids.slice(i, i + 60);
            const r = await fetch('/api/direct/peek', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ occ, ids: chunk }), credentials: 'same-origin' });
            if (!r.ok) return;
            const got = (await r.json()) as Record<string, { company: string; logo?: string }>;
            for (const id of chunk) {
              const v = got[id];
              if (!v) continue;
              for (const n of m.get(id) ?? []) patch(n, v);
            }
          }
        }
      } finally { running = false; }
    };
    const patch = (n: HTMLElement, v: { company: string; logo?: string }) => {
      n.querySelectorAll<HTMLElement>('.jv-locked').forEach((el) => { el.textContent = v.company; el.classList.remove('jv-locked'); });
      n.querySelectorAll<HTMLElement>('.jd-blur').forEach((tile) => {
        const size = tile.offsetWidth || 34;
        const isMark = tile.classList.contains('jd-mark');
        let repl: HTMLElement;
        if (v.logo) {
          const img = document.createElement('img');
          img.src = v.logo; img.alt = ''; img.width = size; img.height = size;
          if (isMark) { repl = document.createElement('span'); repl.className = 'jd-mark'; repl.appendChild(img); }
          else repl = img;
        } else {
          const [bg, fg] = monoTint(v.company);
          repl = document.createElement('span');
          repl.className = isMark ? 'jd-mark jd-mono' : 'job-mono';
          repl.style.background = bg; repl.style.color = fg;
          repl.setAttribute('aria-hidden', 'true');
          repl.textContent = companyInitial(v.company);
        }
        tile.replaceWith(repl);
      });
      n.querySelectorAll<HTMLElement>('.jv-unlock').forEach((el) => { el.textContent = 'Apply'; el.classList.remove('jv-unlock'); });
      n.querySelectorAll<HTMLElement>('.job-tag-direct').forEach((el) => { el.textContent = 'Direct'; });
      n.removeAttribute('data-lk');
    };
    sb.auth.getSession().then(({ data }) => { if (data.session) void run(); }).catch(() => undefined);
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => { if (s) void run(); });
    // pages that render more cards after mount (show more, pager)
    const mo = new MutationObserver(() => { if (document.querySelector('[data-lk]')) void run(); });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { sub.subscription.unsubscribe(); mo.disconnect(); };
  }, []);
  return null;
}
