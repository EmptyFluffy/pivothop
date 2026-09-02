import type { Metadata } from 'next';
import { PageShell } from '../components/SiteChrome';
import { SITE_EMAIL } from '../../lib/site';
import { Crumbs } from '../components/Crumbs';

export const metadata: Metadata = {
  title: 'Support | PivotHop',
  description: 'Get help with PivotHop career tools, jobs, employer listings, or the PivotHop MCP integration.',
  alternates: { canonical: '/support' },
};

export default function SupportPage() {
  return (
    <PageShell v2>
      <main className="ab-main">
        <Crumbs trail={[{ label: 'Support' }]} />
        <h1 className="ab-h1">Something not adding up?</h1>

        <section className="ab-sec">
          <h2>Contact</h2>
          <p>
            Email <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>. Include the page URL, occupation or job you were looking at, and what you expected to happen. Screenshots are useful when the issue is visual.
          </p>
        </section>

        <section className="ab-sec">
          <h2>PivotHop in ChatGPT or another MCP client</h2>
          <p>
            For MCP issues, include the client you are using, the prompt that produced the problem, the tool name if it is visible, and whether the failure happens consistently. The production MCP endpoint is <code>https://www.pivothop.com/api/mcp</code>.
          </p>
          <p>
            The public MCP tools are read-only. If a tool cannot find an occupation, route, salary, or current job, that can also be a genuine coverage limit rather than a service failure. PivotHop returns explicit insufficient-data or not-found states instead of filling those gaps with guesses.
          </p>
        </section>

        <section className="ab-sec">
          <h2>Incorrect or expired job</h2>
          <p>
            Send the PivotHop job URL and, if possible, the employer's original posting URL. Job listings change quickly and PivotHop refreshes them from source data; reports help catch cases where the source changed before the next refresh.
          </p>
        </section>

        <section className="ab-sec">
          <h2>Privacy or data requests</h2>
          <p>
            For access, correction, deletion, or other privacy questions, email <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a> and mention "privacy" in the subject line.
          </p>
        </section>
      </main>
    </PageShell>
  );
}
