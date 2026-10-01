import type { SupabaseClient } from '@supabase/supabase-js';
import { FREE_PER_MONTH, isMember, monthStartIso, type Membership } from './plans';

/* Server side of the Direct plans. Lemon Squeezy (merchant of record) sells
   two variants; its webhook writes `memberships` (migration 0013). Graceful
   like the rest of the stack: without the Lemon Squeezy env the lock stays
   what it was before plans, and any session opens every direct posting.

   Turning it on, in order:
     1. the five LEMONSQUEEZY_* values below in Vercel (test mode first)
     2. PAYWALL_TEST_EMAILS=a@b.com,... : the gate applies to those accounts only
     3. NEXT_PUBLIC_PAYWALL=1 : the gate and the public copy, for everyone */

export function plansConfigured(): boolean {
  return !!(process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_STORE_ID
    && process.env.LEMONSQUEEZY_WEBHOOK_SECRET
    && process.env.LEMONSQUEEZY_VARIANT_MONTHLY && process.env.LEMONSQUEEZY_VARIANT_LIFETIME);
}

/** Whether the paywall applies to this account. */
export function paywallFor(email: string | null | undefined): boolean {
  if (!plansConfigured()) return false;
  if (process.env.NEXT_PUBLIC_PAYWALL === '1') return true;
  const list = (process.env.PAYWALL_TEST_EMAILS ?? '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}

export function variantFor(plan: 'monthly' | 'lifetime'): string {
  return (plan === 'monthly' ? process.env.LEMONSQUEEZY_VARIANT_MONTHLY : process.env.LEMONSQUEEZY_VARIANT_LIFETIME) ?? '';
}

/** The caller's own membership row (RLS), or null. */
export async function membershipOf(sb: SupabaseClient): Promise<Membership> {
  const { data } = await sb.from('memberships').select('lifetime, sub_status, sub_renews_at, sub_ends_at').maybeSingle();
  return (data as Membership) ?? null;
}

/** The distinct direct postings the caller opened this month (RLS). */
export async function openedThisMonth(sb: SupabaseClient): Promise<Set<string>> {
  const { data } = await sb.from('unlocks').select('occ, job_id').gte('at', monthStartIso()).limit(1000);
  return new Set((data ?? []).map((r: { occ: string; job_id: string }) => `${r.occ}/${r.job_id}`));
}

export type Access = { plan: 'member' } | { plan: 'free'; left: number };

/** The caller's standing for one posting: member, a free open (with what is
    left after it), or out of free opens. Re-opening a posting already opened
    this month is free and does not spend another. */
export async function accessFor(sb: SupabaseClient, key: string): Promise<Access | 'limit'> {
  if (isMember(await membershipOf(sb))) return { plan: 'member' };
  const seen = await openedThisMonth(sb);
  const again = seen.has(key);
  if (!again && seen.size >= FREE_PER_MONTH) return 'limit';
  return { plan: 'free', left: Math.max(0, FREE_PER_MONTH - seen.size - (again ? 0 : 1)) };
}

export const LS_API = 'https://api.lemonsqueezy.com/v1';
export function lsHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY ?? ''}`,
    'Content-Type': 'application/vnd.api+json',
    Accept: 'application/vnd.api+json',
  };
}
