import type { Metadata } from 'next';
import { PageShell } from '../components/SiteChrome';
import Dashboard from './Dashboard';

/* Thin static shell: the page prerenders identically for everyone (the
   static-posture doctrine), and every per-user pixel hydrates client-side —
   guest saves from localStorage, account saves after the merge action. */

export const metadata: Metadata = {
  title: 'Saved jobs | PivotHop',
  description: 'The jobs you saved, with where each application stands.',
  robots: { index: false },
};

export default function DashboardPage() {
  return (
    <PageShell wide v2 active="jobs">
      <Dashboard />
    </PageShell>
  );
}
