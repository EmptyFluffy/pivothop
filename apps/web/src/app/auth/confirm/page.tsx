import type { Metadata } from 'next';
import { PageShell } from '../../components/SiteChrome';
import ConfirmForm from './ConfirmForm';

/* The magic-link interstitial. The email links HERE with ?token_hash=...;
   this GET renders a form and nothing else — corporate mail scanners and
   Outlook SafeLinks prefetch every URL in an email, and a GET that verified
   the token would let the scanner consume it before the human clicks. Only
   the form's POST (auto-submitted on load, with a visible button as the
   no-JS fallback) calls verifyOtp. The same page takes the typeable 6-digit
   code for the cross-device case: link requested on the desktop, email
   opened on the phone. */

export const metadata: Metadata = {
  title: 'Confirm sign-in — PivotHop',
  robots: { index: false },
};

export default async function ConfirmPage({ searchParams }: {
  searchParams: Promise<{ token_hash?: string; next?: string; error?: string; email?: string }>;
}) {
  const sp = await searchParams;
  return (
    <PageShell v2>
      <div className="auth-wrap">
        <h1>Confirm sign-in.</h1>
        <ConfirmForm
          tokenHash={sp.token_hash || ''}
          next={sp.next || '/dashboard'}
          expired={sp.error === 'expired'}
          email={sp.email || ''}
        />
      </div>
    </PageShell>
  );
}
