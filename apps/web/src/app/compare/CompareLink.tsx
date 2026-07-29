import Link from 'next/link';
import { compareSlugs } from './compare-data';

/** A link to /compare/<a>-vs-<b> that survives the pair dropping out of the data.
 *
 *  Compare pages are generated only for pairs that still qualify — mutual
 *  measurement, or one direction ≥45%, or a curated seed that has at least one
 *  measured direction. A pair can therefore vanish between nightly runs, and on
 *  2026-07-29 graphic-designer|ux-designer did: both directions fell out of the
 *  emit, the page stopped being generated, and two hard-coded links (the
 *  Adjacency Index and a blog post) turned into 404s. The link gate caught it
 *  and correctly refused to publish — but that blocked the whole nightly.
 *
 *  Anything editorial that points at a computed page needs this guard. When the
 *  pair exists it links straight there; when it does not, it falls back to the
 *  compare hub rather than dangling. Same shape as hasOriginPage() on routes. */
export function CompareLink({
  slug, children, className = 'gl', fallbackHref = '/compare',
}: {
  slug: string;
  children: React.ReactNode;
  className?: string;
  fallbackHref?: string;
}) {
  const exists = compareSlugs().includes(slug);
  return (
    <Link className={className} href={exists ? `/compare/${slug}` : fallbackHref}>
      {children}
    </Link>
  );
}

/** Resolve a compare href, falling back to the hub. For places that need the
    string rather than the element (data tables, schema, metadata). */
export function compareHref(slug: string, fallback = '/compare'): string {
  return compareSlugs().includes(slug) ? `/compare/${slug}` : fallback;
}
