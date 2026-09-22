'use client';
import { supabaseBrowser } from './supabase-browser';
import type { ListingSection, ListingPart } from '../app/jobs/detail';

/* Client side of the direct-jobs lock. A direct row ships redacted (company
   "Direct employer", no logo, no apply URL, a teaser of the posting); when the
   browser holds a session, or the page URL carries a share token (?u=), the
   real fields are fetched from /api/direct and swapped in by the surface that
   asked. Nothing here can reveal anything the API would not. */

export type Unlocked = { company: string; logo?: string; url: string; sections?: { h: string | null; t: string }[] };

const mem = new Map<string, Promise<Unlocked | null>>();

/** The share token in the current page URL, if any. */
export function shareTokenFromPage(): string | null {
  if (typeof window === 'undefined') return null;
  try { return new URLSearchParams(window.location.search).get('u'); } catch { return null; }
}

/** Whether a session exists (cheap: local cookie/storage check, no network). */
export async function signedIn(): Promise<boolean> {
  const sb = supabaseBrowser();
  if (!sb) return false;
  try { const { data } = await sb.auth.getSession(); return !!data.session; } catch { return false; }
}

/** The real fields of one direct posting, or null (not signed in, no token,
    capped, or not a direct row). Memoised per page. */
export function unlockJob(occ: string, id: string): Promise<Unlocked | null> {
  const key = `${occ}/${id}`;
  const have = mem.get(key);
  if (have) return have;
  const p = (async () => {
    const tok = shareTokenFromPage();
    if (!tok && !(await signedIn())) return null;
    try {
      const r = await fetch(`/api/direct?occ=${encodeURIComponent(occ)}&id=${encodeURIComponent(id)}${tok ? `&u=${encodeURIComponent(tok)}` : ''}`, { credentials: 'same-origin' });
      if (!r.ok) return null;
      return (await r.json()) as Unlocked;
    } catch { return null; }
  })();
  mem.set(key, p);
  p.then((v) => { if (v === null) mem.delete(key); });
  return p;
}

/** Where to send someone who has to sign in first, returning here after. */
export function signInHref(): string {
  const here = typeof window === 'undefined' ? '/jobs' : `${window.location.pathname}${window.location.search}`;
  return `/signin?next=${encodeURIComponent(here)}`;
}

/** Raw vault sections into the pane/sheet section format. */
export function toListingSections(raw: { h: string | null; t: string }[] | undefined): ListingSection[] {
  if (!raw) return [];
  return raw.map((s) => {
    const parts: ListingPart[] = [];
    let ul: string[] | null = null;
    const flush = () => { if (ul?.length) parts.push({ ul }); ul = null; };
    for (const lineRaw of s.t.split('\n')) {
      const line = lineRaw.replace(/\\([*#_[\]()~`>])/g, '$1').trim();
      if (!line || /^[-=_]{4,}$/.test(line)) continue;
      const h = /^#{2,6}\s+(.*)$/.exec(line);
      if (h) { flush(); parts.push({ h4: h[1] }); continue; }
      const li = /^[+*·-]\s+(.*)$/.exec(line);
      if (li) { (ul ??= []).push(li[1]); continue; }
      flush(); parts.push({ p: line });
    }
    flush();
    return { h: s.h, parts };
  });
}
