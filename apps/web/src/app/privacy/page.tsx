import type { Metadata } from 'next';
import { PageShell } from '../components/SiteChrome';
import { SITE_EMAIL } from '../../lib/site';
import { Crumbs } from '../components/Crumbs';

export const metadata: Metadata = {
  title: 'Privacy | PivotHop',
  description: 'How PivotHop handles data on the website, job board, and read-only MCP tools.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <PageShell v2>
      <main className="ab-main">
        <Crumbs trail={[{ label: 'Privacy' }]} />
        <h1 className="ab-h1">Privacy policy.</h1>
        <p>Effective August 22, 2026.</p>

        <section className="ab-sec">
          <h2>What PivotHop is</h2>
          <p>
            PivotHop is a career-data and job-discovery service. It analyzes job postings and public labor-market data to measure career adjacency, skill gaps, salary ranges, and current openings. The public PivotHop MCP tools expose a read-only version of that information to compatible AI assistants.
          </p>
        </section>

        <section className="ab-sec">
          <h2>Information you provide</h2>
          <p>
            If you submit a form, join a waitlist, request a roadmap, contact us, or post a job, we may receive the information you choose to provide, such as your email address, message, job details, company information, or the career inputs needed to produce the requested result.
          </p>
          <p>
            Payments, when available, are processed by our payment provider. PivotHop does not need or intend to store full payment-card details.
          </p>
        </section>

        <section className="ab-sec">
          <h2>Website and analytics data</h2>
          <p>
            Like most websites, our hosting and analytics providers may process technical information such as IP address, browser or device information, referring page, pages viewed, approximate location, timestamps, and performance or error data. PivotHop uses this information to operate the site, understand aggregate usage, fix problems, and measure which distribution channels are useful.
          </p>
          <p>
            PivotHop uses privacy-conscious analytics settings and does not intentionally use session replay to record the contents of your browsing session. We do not sell personal information to advertisers.
          </p>
        </section>

        <section className="ab-sec">
          <h2>MCP and AI-assistant requests</h2>
          <p>
            PivotHop's public MCP endpoint does not currently require a PivotHop account. When an AI client calls a tool, PivotHop receives the tool arguments needed to answer the request and standard server request metadata. The tools are designed for career and job queries and do not require sensitive personal information.
          </p>
          <p>
            URLs returned by the MCP may include <code>utm_source=mcp</code> so we can distinguish click-throughs from MCP clients from other referrals. The AI product you use may separately process your conversation under its own privacy terms; PivotHop does not control that product's handling of your chat.
          </p>
        </section>

        <section className="ab-sec">
          <h2>Job and labor-market data</h2>
          <p>
            The core PivotHop corpus is built from job postings, company career pages, public APIs, and public labor-market datasets. Job listings shown on the public board come from sources PivotHop treats as eligible for re-display and link back to the original employer or source for application. Other sources may be used only in aggregate analysis and are not exposed as listings.
          </p>
        </section>

        <section className="ab-sec">
          <h2>Service providers and external links</h2>
          <p>
            We use service providers for hosting, analytics, email or form delivery, and payment processing. They process information as needed to provide those services. PivotHop also links to third-party employer and job-board sites; their privacy practices are governed by their own policies.
          </p>
        </section>

        <section className="ab-sec">
          <h2>Retention, access, and deletion</h2>
          <p>
            We keep submitted information only as long as reasonably needed for the purpose it was provided, to operate the service, or to meet legal and security obligations. You can ask what personal information we hold about you, request a correction, or request deletion where applicable by contacting us.
          </p>
        </section>

        <section className="ab-sec">
          <h2>Changes</h2>
          <p>
            We may update this policy as PivotHop changes. Material changes will be reflected on this page with a new effective date.
          </p>
        </section>

        <section className="ab-sec ab-contact">
          <h2>Contact</h2>
          <p>
            Privacy questions or requests: <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>.
          </p>
        </section>
      </main>
    </PageShell>
  );
}
