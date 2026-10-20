import Link from 'next/link';

// Review-only viewport harness; inherits the lab's production 404 and noindex.
export default async function LandingReview({ searchParams }: { searchParams: Promise<{ width?: string }> }) {
  const requested = Number((await searchParams).width);
  const width = [360, 390, 768, 1280].includes(requested) ? requested : 390;
  return <main style={{ minHeight: '100vh', background: '#ededed', color: '#141414', padding: 20, fontFamily: 'var(--font-sans), sans-serif' }}>
    <form style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 20 }}>
      <label htmlFor="review-width">Viewport width </label>
      <select id="review-width" name="width" defaultValue={width} style={{ font: 'inherit', padding: 8 }}>
        {[360, 390, 768, 1280].map(w => <option value={w} key={w}>{w}px</option>)}
      </select>
      <button type="submit" style={{ font: 'inherit', padding: '8px 16px', cursor: 'pointer' }}>View</button>
      <Link href="/design-lab/landing">Open preview</Link>
      <Link href="/">Current homepage</Link>
    </form>
    <iframe title={`Landing preview at ${width}px`} src="/design-lab/landing" width={width} height={900} style={{ display: 'block', border: 'none', background: '#fff' }} />
  </main>;
}
