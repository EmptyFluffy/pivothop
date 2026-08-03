import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '../../components/SiteChrome';
import { POSTS, PillarIcons } from '../posts';

// E-E-A-T + freshness signals for answer engines: a named author, per-post
// publish dates, and a modified date that tracks the nightly data refresh.
const AUTHOR = { name: 'Carlos Alvarez', url: 'https://www.pivothop.com/about' };
const DATA_UPDATED = '2026-07-27'; // the corpus date the posts' numbers recompute against
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
function pubISO(date: string): string {
  const m = /([A-Za-z]+)\s+(\d{4})/.exec(date || '');
  if (!m) return DATA_UPDATED;
  const mi = MONTHS.indexOf(m[1].toLowerCase());
  return mi >= 0 ? `${m[2]}-${String(mi + 1).padStart(2, '0')}-01` : DATA_UPDATED;
}

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return {};
  return { title: post.title, description: post.dek, alternates: { canonical: `/blog/${slug}` } };
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
            <span className="lbl">By Carlos Alvarez</span>
            <span className="lbl bc-dot">·</span>
            <span className="lbl">{post.minutes} min read</span>
          </div>
          <h1 className="post-h1">{post.title}</h1>
          <p className="post-dek">{post.dek}</p>
          {post.takeaways && post.takeaways.length > 0 && (
            <aside className="post-tldr" aria-label="The short version">
              <div className="lbl">The short version</div>
              <ul>{post.takeaways.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </aside>
          )}
          <article className="post-body">{post.body}</article>
          {post.faq && (
            <div className="post-faq">
              <h2>Quick answers</h2>
              {post.faq.map((f) => (
                <details key={f.q} name="pagefaq">
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
        datePublished: pubISO(post.date),
        dateModified: DATA_UPDATED,
        author: { '@type': 'Person', name: AUTHOR.name, url: AUTHOR.url },
        publisher: { '@type': 'Organization', name: 'PivotHop', logo: { '@type': 'ImageObject', url: 'https://www.pivothop.com/icon.svg' } },
        mainEntityOfPage: `https://www.pivothop.com/blog/${slug}`,
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PivotHop', item: 'https://www.pivothop.com/' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.pivothop.com/blog' },
          { '@type': 'ListItem', position: 3, name: post.title, item: `https://www.pivothop.com/blog/${slug}` },
        ],
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
