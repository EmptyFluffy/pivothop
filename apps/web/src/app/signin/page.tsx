import type { Metadata } from 'next';
import { PageShell } from '../components/SiteChrome';
import SignInForm from './SignInForm';

export const metadata: Metadata = {
  title: 'Sign in — PivotHop',
  description: 'Sign in with a magic link to keep your saved jobs across devices. No password.',
  alternates: { canonical: '/signin' },
};

export default function SignInPage() {
  return (
    <PageShell v2>
      <div className="auth-wrap">
        <h1>Sign in.</h1>
        <p className="auth-sub">
          No password. Enter your email and we send a one-time link; the same
          email carries a 6-digit code if you are reading it on another device.
          Jobs you saved in this browser come with you.
        </p>
        <SignInForm />
      </div>
    </PageShell>
  );
}
