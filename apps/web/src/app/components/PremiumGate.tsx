'use client';
import { useEffect } from 'react';
import { supabaseBrowser } from '../../lib/supabase-browser';

/* The one client island behind the direct-jobs lock. The site is static, so
   every page ships redacted; this flips `html.ph-premium` when the browser
   holds a session (free tier today, the plan check lands with the paywall)
   and the stylesheet adjusts the chrome. Display only: nothing locked is in
   the HTML to reveal, the real fields come from /api/direct per posting. The
   legacy localStorage flag `ph-premium` is still honoured for the demo. */
export default function PremiumGate() {
  useEffect(() => {
    let flag = false;
    try { flag = localStorage.getItem('ph-premium') === '1'; } catch { /* storage blocked */ }
    const apply = (on: boolean) => document.documentElement.classList.toggle('ph-premium', flag || on);
    apply(false);
    const sb = supabaseBrowser();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => apply(!!data.session)).catch(() => undefined);
    const { data: sub } = sb.auth.onAuthStateChange((_evt, session) => apply(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);
  return null;
}
