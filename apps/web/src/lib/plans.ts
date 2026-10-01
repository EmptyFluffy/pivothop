/* The Direct plans (2026-10-01, Carlos): $8 a month or $50 once. Signed in
   without a plan, FREE_PER_MONTH direct postings a month open in full; the
   employer names and logos in lists are for members only. Shared by the
   server (the gate) and the browser (the copy), so nothing here reads env.
   The amounts shown are set here; the amounts charged are the Lemon Squeezy
   variants (lib/paywall.ts). Change both together. */

export const PLANS = { monthly: 8, lifetime: 50 } as const;
export type PlanKind = keyof typeof PLANS;

export const FREE_PER_MONTH = 3;

/** Whether the plans are live for everyone (also switches the public copy). */
export const PLANS_PUBLIC = process.env.NEXT_PUBLIC_PAYWALL === '1';

export type Membership = {
  lifetime: boolean;
  sub_status: string | null;
  sub_renews_at?: string | null;
  sub_ends_at: string | null;
} | null;

/** An active grant: lifetime, or a subscription Lemon Squeezy still serves.
    past_due keeps access while Lemon Squeezy retries the card; a cancelled
    subscription runs to the end of the month already paid. */
export function isMember(m: Membership): boolean {
  if (!m) return false;
  if (m.lifetime) return true;
  const s = m.sub_status;
  if (s === 'active' || s === 'on_trial' || s === 'past_due') return true;
  return s === 'cancelled' && !!m.sub_ends_at && Date.parse(m.sub_ends_at) > Date.now();
}

/** The first instant of the current calendar month, UTC: the free quota resets here. */
export function monthStartIso(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}
