import type { Metadata } from 'next';
import { PageShell } from '../components/SiteChrome';
import { SITE_EMAIL } from '../../lib/site';

export const metadata: Metadata = {
  title: 'Terms | PivotHop',
  description: 'Terms governing use of PivotHop, its career measurements, job board, and read-only MCP tools.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <PageShell v2>
      <main className="ab-main">
        <div className="lbl acc" style={{ marginBottom: 18 }}>Terms</div>
        <h1 className="ab-h1">Terms of use.</h1>
        <p>Effective August 22, 2026.</p>

        <section className="ab-sec">
          <h2>Using PivotHop</h2>
          <p>
            By using PivotHop, including its website, job board, career tools, and public MCP endpoint, you agree to use the service lawfully and in a way that does not disrupt the service, misrepresent its data, bypass technical safeguards, or abuse third-party systems linked from PivotHop.
          </p>
        </section>

        <section className="ab-sec">
          <h2>Career measurements are information, not a hiring promise</h2>
          <p>
            PivotHop estimates career adjacency, readiness, skill gaps, salaries, demand, and related measures from job postings and public datasets. These are measurements of market evidence, not predictions that a particular person will be hired, earn a stated salary, qualify for a licence, or complete a career change in a particular time.
          </p>
          <p>
            You are responsible for evaluating your own circumstances and for checking current licensing, immigration, tax, education, employment, and professional requirements before acting on a result. PivotHop does not provide legal, financial, immigration, or professional-licensing advice.
          </p>
        </section>

        <section className="ab-sec">
          <h2>Job listings</h2>
          <p>
            Many jobs displayed by PivotHop originate on employer career pages, public-sector sources, or third-party job services. PivotHop normalizes and organizes eligible listings but generally does not employ the hiring company, control the underlying vacancy, or process the application. Applications are sent to the original employer or source.
          </p>
          <p>
            Jobs can change, expire, contain errors, or be removed without notice. Verify important details on the original posting before applying or making a decision. PivotHop does not guarantee that a listing remains open, that an employer will respond, or that third-party content is complete or error-free.
          </p>
        </section>

        <section className="ab-sec">
          <h2>MCP tools</h2>
          <p>
            PivotHop's public MCP tools are currently read-only. They retrieve or compute career and job information and may return links to PivotHop or to an original job application page. Tool availability, schemas, coverage, and results may change as the underlying market data changes.
          </p>
          <p>
            Do not use the MCP endpoint to overload the service, circumvent reasonable rate limits, republish restricted third-party material, or create a misleading impression that PivotHop guarantees a career or hiring outcome.
          </p>
        </section>

        <section className="ab-sec">
          <h2>Employer submissions</h2>
          <p>
            If you submit or pay to feature a job, you must have authority to publish the role and the information must be accurate, lawful, non-discriminatory, and connected to a genuine hiring opportunity. PivotHop may reject or remove misleading, unlawful, expired, duplicated, or otherwise inappropriate listings.
          </p>
        </section>

        <section className="ab-sec">
          <h2>Intellectual property and sources</h2>
          <p>
            PivotHop's software, original visual design, career-graph presentation, scoring methodology, explanatory text, and original analyses are protected by applicable intellectual-property law. Third-party names, trademarks, job-posting content, and datasets remain the property of their respective owners or are used under the terms applicable to those sources.
          </p>
          <p>
            You may link to and quote reasonable portions of public PivotHop pages with attribution. These terms do not grant a right to bulk-copy, resell, or create a substitute database from material where PivotHop or an underlying source does not grant those rights.
          </p>
        </section>

        <section className="ab-sec">
          <h2>Availability and warranties</h2>
          <p>
            PivotHop is provided on an "as is" and "as available" basis. We work to make the measurements honest and the data current, but we do not promise uninterrupted availability or that every occupation, salary market, career route, or job will have enough data to produce a result.
          </p>
        </section>

        <section className="ab-sec">
          <h2>Liability</h2>
          <p>
            To the extent permitted by law, PivotHop is not liable for indirect, incidental, special, consequential, or lost-opportunity damages arising from use of the service, reliance on career estimates, third-party job listings, external websites, or decisions made using the information provided. Nothing in these terms excludes liability that cannot lawfully be excluded.
          </p>
        </section>

        <section className="ab-sec">
          <h2>Changes</h2>
          <p>
            We may update the service or these terms as PivotHop evolves. The current version and effective date will remain available on this page.
          </p>
        </section>

        <section className="ab-sec ab-contact">
          <h2>Contact</h2>
          <p>
            Questions about these terms: <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>.
          </p>
        </section>
      </main>
    </PageShell>
  );
}
