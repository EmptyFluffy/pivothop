'use client';
import { requestPlans } from '../../lib/auth-ui';

/* The /direct page's plan button: opens the plans sheet in place. */
export default function PlansButton({ label }: { label: string }) {
  return <button type="button" className="rt-go" onClick={() => requestPlans('generic', '/direct')}>{label}</button>;
}
