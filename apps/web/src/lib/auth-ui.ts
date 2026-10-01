'use client';
import { supabaseBrowser } from './supabase-browser';

/* Sign-in state for the UI, and the one way to ask for it. Any component
   (a locked card, the save button, the unlock row) calls requestSignIn(); the
   SignInSheet mounted in the page shell listens and opens with the Google
   button. Session knowledge is cached here so click handlers can decide
   synchronously; it is primed once per page by the sheet and kept current by
   Supabase's auth listener. */

export type SignInReason = 'job' | 'save' | 'generic';
const EVT = 'ph-signin';

let known: boolean | null = null;   // null = not primed yet
let primed = false;

export function sessionKnown(): boolean | null { return known; }

/** Whether a session is known to exist right now (false when unknown). */
export function isSignedInNow(): boolean { return known === true; }

export function primeSession(): void {
  if (primed || typeof window === 'undefined') return;
  primed = true;
  const sb = supabaseBrowser();
  if (!sb) { known = false; return; }
  sb.auth.getSession().then(({ data }) => { known = !!data.session; }).catch(() => { known = false; });
  sb.auth.onAuthStateChange((_e, s) => { known = !!s; });
}

export function requestSignIn(reason: SignInReason = 'generic', next?: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVT, { detail: { reason, next } }));
}

export function onSignInRequest(cb: (d: { reason: SignInReason; next?: string }) => void): () => void {
  const h = (e: Event) => cb((e as CustomEvent).detail ?? { reason: 'generic' });
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
}

/* The plans sheet (PlanSheet, mounted next to SignInSheet): any surface that
   meets a 402 from /api/direct, or a "See plans" link, opens it. 'limit' is
   the reader who used this month's free opens; 'generic' is everyone else. */
export type PlansReason = 'limit' | 'generic';
const PLANS_EVT = 'ph-plans';

export function requestPlans(reason: PlansReason = 'generic', next?: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PLANS_EVT, { detail: { reason, next } }));
}

export function onPlansRequest(cb: (d: { reason: PlansReason; next?: string }) => void): () => void {
  const h = (e: Event) => cb((e as CustomEvent).detail ?? { reason: 'generic' });
  window.addEventListener(PLANS_EVT, h);
  return () => window.removeEventListener(PLANS_EVT, h);
}
