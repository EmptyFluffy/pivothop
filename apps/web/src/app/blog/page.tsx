import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../components/SiteChrome';
import { POSTS, PillarIcons } from './posts';
import { Crumbs } from '../components/Crumbs';

export const metadata: Metadata = {
  title: 'Blog | PivotHop',
  description:
    'Career moves, written up with the numbers attached. Every article runs on the same live posting data as the instrument.',
  alternates: { canonical: '/blog' },
};

export default function Blog() {
  return (
    <PageShell v2 active="blog">
      <div className="about-page">
        <main className="ab-main blog-main">
          <Crumbs trail={[{ label: 'Blog' }]} />
          <h1 className="ab-h1">Career moves, written up.</h1>
          <p className="emp-lead">
            Five pillars, one rule: every claim traces to the same live posting
            data that powers the instrument, or to a named public dataset. No
            listicles, no affiliate links, no advice we cannot measure.
          </p>

          <div className="blog-list">
            {POSTS.map((p) => {
              const Icon = PillarIcons[p.pillar];
              return (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="blog-card">
                  <div className="bc-meta">
                    <span className="bc-ico"><Icon /></span>
                    <span className="lbl">{p.pillar}</span>
                    <span className="lbl bc-dot">·</span>
                    <span className="lbl">{p.date}</span>
                    <span className="lbl bc-dot">·</span>
                    <span className="lbl">{p.minutes} min</span>
                  </div>
                  <h2>{p.title}</h2>
                  <p>{p.dek}</p>
                  <span className="bc-read">Read it
                    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg>
                  </span>
                </Link>
              );
            })}
          </div>
        </main>
      </div>
    </PageShell>
  );
}
