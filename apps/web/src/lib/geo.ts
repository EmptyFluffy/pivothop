/* Visitor country, asked once per visitor (2026-09-28).

   Vercel geolocates on the server only (x-vercel-ip-country). This used to run
   in proxy.ts on every page request, crawlers included, so every crawl of
   every page was a function invocation: about a million a day on the
   2026-09 bill, for 2-3k human visits a month. Now the browser asks /api/geo
   only when the ph-cc cookie is missing; crawlers run no scripts, so they
   never ask. The route stores the answer for 30 days, "ZZ" when Vercel could
   not place the visitor, so an unknown country is not asked again on every
   page. Readers: SwissBanner (CH suggestion) and JobsBrowse (sort by visitor
   country). Neither varies the prerendered HTML (docs/32). */
let pending: Promise<string> | null = null;

export function visitorCountry(): Promise<string> {
  if (typeof document === 'undefined') return Promise.resolve('');
  const m = document.cookie.match(/(?:^|; )ph-cc=([A-Z]{2})/);
  if (m) return Promise.resolve(m[1] === 'ZZ' ? '' : m[1]);
  if (!pending) {
    pending = fetch('/api/geo', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { cc: '' }))
      .then((j: { cc?: string }) => (j.cc && /^[A-Z]{2}$/.test(j.cc) ? j.cc : ''))
      .catch(() => '');
  }
  return pending;
}
