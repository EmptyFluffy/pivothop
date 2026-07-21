import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '../../components/SiteChrome';
import { POSTS, PillarIcons } from '../posts';

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return {};
  return { title: `${post.title} — PivotHop`, description: post.dek };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) notFound();
  const Icon = PillarIcons[post.pillar];
  return (
    <PageShell>
      <div className="about-page">
        <main className="ab-main post-main">
          <div className="bc-meta" style={{ marginBottom: 20 }}>
            <span className="bc-ico"><Icon /></span>
            <span className="lbl acc">{post.pillar}</span>
            <span className="lbl bc-dot">·</span>
            <span className="lbl">{post.date}</span>
            <span className="lbl bc-dot">·</span>
            <span className="lbl">{post.minutes} min read</span>
          </div>
          <h1 className="post-h1">{post.title}</h1>
          <p className="post-dek">{post.dek}</p>
          <article className="post-body">{post.body}</article>
          {post.faq && (
            <div className="post-faq">
              <h3>Quick answers</h3>
              {post.faq.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          )}
          <div className="post-foot">
            <Link href="/blog" className="lbl">&larr; All posts</Link>
            <Link href="/" className="lbl acc">Run your own numbers &rarr;</Link>
          </div>
        </main>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.dek,
        datePublished: '2026-07-22',
        author: { '@type': 'Person', name: 'Carlos', url: 'https://pivothop.com/about' },
        publisher: { '@type': 'Organization', name: 'PivotHop' },
      }) }} />
      {post.faq && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: post.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
        }) }} />
      )}
    </PageShell>
  );
}
