'use client';
import { useEffect, useState } from 'react';
import { requestPlans } from '../../lib/auth-ui';
import { PLANS } from '../../lib/plans';

/* The account's Direct plan, under the dashboard header. Renders nothing
   where plans do not apply (not configured, or not in the test list). */
type Plan = {
  paywall: boolean; member?: boolean; lifetime?: boolean; status?: string | null;
  renews_at?: string | null; ends_at?: string | null; left?: number | null; free?: number;
};

const day = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export default function PlanStatus() {
  const [p, setP] = useState<Plan | null>(null);
  useEffect(() => {
    fetch('/api/plan', { credentials: 'same-origin', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null)).then((d: Plan | null) => setP(d)).catch(() => setP(null));
  }, []);
  if (!p?.paywall) return null;

  const billing = (label: string) => <a className="gl" href="/api/billing">{label}</a>;
  let text: string;
  let action: React.ReactNode;
  if (p.lifetime) {
    text = 'Direct plan: lifetime. Every direct job is open.';
    action = billing('Receipts');
  } else if (p.member && p.status === 'cancelled') {
    text = `Direct plan: cancelled, open until ${day(p.ends_at)}.`;
    action = billing('Resume in billing');
  } else if (p.member && p.status === 'past_due') {
    text = 'Direct plan: the last payment did not go through. Lemon Squeezy is retrying it; update the card to keep access.';
    action = billing('Update the card');
  } else if (p.member) {
    text = `Direct plan: $${PLANS.monthly} a month${p.renews_at ? `, renews ${day(p.renews_at)}` : ''}.`;
    action = billing('Manage billing');
  } else {
    text = `Free: ${p.left ?? 0} of ${p.free ?? 3} direct jobs left this month.`;
    action = <button type="button" className="gl-btn" onClick={() => requestPlans('generic', '/dashboard')}>See plans</button>;
  }
  return <p className="dash-plan"><span>{text}</span> {action}</p>;
}
