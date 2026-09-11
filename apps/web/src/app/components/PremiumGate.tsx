'use client';
import { useEffect } from 'react';

/* The one client island behind the direct-jobs lock. The site is static, so
   every page ships locked; this flips `html.ph-premium` when the browser holds
   an active plan, and the stylesheet does the rest. Today the flag is the
   localStorage key `ph-premium` (set by the account flow once subscriptions
   exist); nothing here can be trusted for anything but display, and the
   server-side gate arrives with the accounts phase (docs/34). */
export default function PremiumGate() {
  useEffect(() => {
    let on = false;
    try { on = localStorage.getItem('ph-premium') === '1'; } catch { /* storage blocked */ }
    document.documentElement.classList.toggle('ph-premium', on);
    if (!on) return;
    // premium readers get the real apply destination on locked cards
    for (const a of document.querySelectorAll<HTMLAnchorElement>('a[data-apply]')) {
      const href = a.getAttribute('data-apply');
      if (href) { a.href = href; a.target = '_blank'; a.rel = 'nofollow noopener noreferrer'; }
    }
  }, []);
  return null;
}
