import type { Metadata } from 'next';
import { PageShell } from '../components/SiteChrome';
import SignInForm from './SignInForm';
import { Crumbs } from '../components/Crumbs';

export const metadata: Metadata = {
  title: 'Sign in | PivotHop',
  description: 'One click with Google, or an email link. Keeps your saved jobs across devices and opens the postings employers publish on their own sites.',
  alternates: { canonical: '/signin' },
};

export default function SignInPage() {
  return (
    <PageShell v2>
      <div className="auth-wrap">
        <Crumbs trail={[{ label: 'Sign in' }]} />
        <h1>Sign in.</h1>
        <p className="auth-sub">
          No password. One click with Google, or an email link with a 6-digit
          code for another device. Jobs you saved in this browser come with
          you, and the postings employers publish on their own sites open up.
        </p>
        <SignInForm />
      </div>
    </PageShell>
  );
}
