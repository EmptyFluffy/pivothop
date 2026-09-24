'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';
import { supabaseBrowser } from '../../lib/supabase-browser';
import { ensurePrefs } from '../auth/actions';

/* Google One Tap: the account chooser Google draws over the page for anyone
   already signed into Google in this browser. One click, no redirect. The
   credential is a Google ID token that Supabase verifies (signInWithIdToken)
   under the same OAuth client as the redirect flow, with a nonce: the raw
   value goes to Supabase, its SHA-256 to Google, as Supabase's docs require.
   Shown to signed-out visitors only, never on /signin (which has its own
   button) or /auth pages. Google enforces its own cooldown when dismissed. */

declare global {
  interface Window {
    google?: { accounts: { id: {
      initialize: (o: Record<string, unknown>) => void;
      prompt: (cb?: (n: { isNotDisplayed?: () => boolean; isSkippedMoment?: () => boolean }) => void) => void;
      cancel: () => void;
    } } };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '447580415113-hfbj63vme5ill00tsvia1dnu9ova5lo3.apps.googleusercontent.com';

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function GoogleOneTap() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith('/signin') || pathname.startsWith('/auth') || pathname.startsWith('/admin')) return;
    const sb = supabaseBrowser();
    if (!sb) return;
    let cancelled = false;
    (async () => {
      const { data } = await sb.auth.getSession();
      if (data.session || cancelled) return;
      const nonce = crypto.randomUUID() + crypto.randomUUID();
      const hashed = await sha256Hex(nonce);
      const boot = () => {
        if (cancelled || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          nonce: hashed,
          use_fedcm_for_prompt: true,
          itp_support: true,
          context: 'signin',
          callback: async (res: { credential: string }) => {
            const { error } = await sb.auth.signInWithIdToken({ provider: 'google', token: res.credential, nonce });
            if (error) { posthog.capture('one_tap_failed'); return; }
            posthog.capture('one_tap_signed_in');
            void ensurePrefs();
            window.location.reload();
          },
        });
        window.google.accounts.id.prompt();
      };
      if (window.google) { boot(); return; }
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.defer = true;
      s.onload = boot;
      document.head.appendChild(s);
    })();
    return () => { cancelled = true; try { window.google?.accounts.id.cancel(); } catch { /* not loaded */ } };
  }, [pathname]);
  return null;
}
