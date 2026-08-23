// Shared listing loader for the split pane (desktop) and the bottom sheet
// (phones). Fetches the listing's own ISR page and extracts the content, so
// one ~50KB payload per listing replaces the old per-occupation detail files
// (multi-MB for the big occupations: the "stuck on loading" bug), and the
// in-place surfaces can never disagree with the full page. The apply URL is
// taken from the page too, which the stripped global browse file never has.

export type ListingPart = { p: string } | { ul: string[] } | { h4: string };
export type ListingSection = { h: string | null; parts: ListingPart[] };
export type Listing = {
  applyUrl: string | null;
  skills: { term: string; href: string }[];
  benefits: { slug: string; term: string }[];
  gates: { key: string; label: string; value: string }[];
  sections: ListingSection[];
};

const cache = new Map<string, Listing | null>();

/* Source feeds ship markdown escapes and ASCII divider lines; strip both. */
const clean = (t: string) => t.replace(/\\([*#_[\]()~`>])/g, '$1').trim();
const isDivider = (t: string) => /^[-=_]{4,}$/.test(t);

export async function loadListing(occ: string, id: string): Promise<Listing | null> {
  const key = `${occ}:${id}`;
  if (cache.has(key)) return cache.get(key) ?? null;
  try {
    const r = await fetch(`/jobs/${occ}/${id}/`);
    if (!r.ok) { cache.set(key, null); return null; }
    const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
    const applyUrl = doc.querySelector('a.jd-apply')?.getAttribute('href') ?? null;
    const skills = Array.from(doc.querySelectorAll('.jd-skills a.jd-skill')).map((a) => ({
      term: a.textContent?.trim() ?? '',
      href: a.getAttribute('href') ?? '#',
    })).filter((s) => s.term);
    const gates = Array.from(doc.querySelectorAll('.jd-gates [data-gate]')).map((el) => ({
      key: el.getAttribute('data-gate') ?? '',
      label: el.querySelector('.k')?.textContent?.trim() ?? '',
      value: el.querySelector('.v')?.textContent?.trim() ?? '',
    })).filter((g) => g.key && g.value);
    const benefits = Array.from(doc.querySelectorAll('.jd-benefits .jd-benefit')).map((el) => ({
      slug: el.getAttribute('data-benefit') ?? '',
      term: (el.textContent ?? '').trim(),
    })).filter((b) => b.slug && b.term);
    const sections: ListingSection[] = Array.from(doc.querySelectorAll('.jd-desc .jd-sec')).map((sec) => {
      const parts: ListingPart[] = [];
      let ul: string[] | null = null;
      const flush = () => { if (ul?.length) parts.push({ ul }); ul = null; };
      // Some feeds (jobroom among them) ship raw markdown the pipeline never
      // converted; the page shows it as-is. Normalize at render: ### becomes a
      // heading, +/-/* lines become list items, dividers vanish.
      const addText = (rawIn: string) => {
        let raw = rawIn;
        // A "### " in the text means unconverted markdown jammed onto one line
        // (jobroom). Only then, re-break it: *** separators, headings, and
        // inline "+ " bullets each get their own line.
        if (/#{2,6}\s/.test(raw)) {
          raw = raw
            .replace(/\*{3,}/g, '\n')
            .replace(/(#{2,6}\s)/g, '\n$1')
            .replace(/([^\s+])\+ (?=\S)/g, '$1\n+ ');
        }
        for (const lineRaw of raw.split('\n')) {
          const line = clean(lineRaw);
          if (!line || isDivider(line)) continue;
          const h = /^#{2,6}\s+(.*)$/.exec(line);
          if (h) { flush(); parts.push({ h4: h[1] }); continue; }
          const li = /^[+*\u00b7-]\s+(.*)$/.exec(line);
          if (li) { (ul ??= []).push(li[1]); continue; }
          flush(); parts.push({ p: line });
        }
      };
      for (const el of Array.from(sec.children)) {
        if (el.tagName === 'H3') continue;
        if (el.tagName === 'UL') {
          flush();
          const items = Array.from(el.children).map((li) => clean(li.textContent ?? '')).filter(Boolean);
          if (items.length) parts.push({ ul: items });
        } else if (el.tagName === 'P') {
          addText(el.textContent ?? '');
        }
      }
      flush();
      return { h: sec.querySelector('.jd-h3')?.textContent?.trim() ?? null, parts };
    }).filter((s) => s.parts.length);
    const out = { applyUrl, skills, benefits, gates, sections };
    cache.set(key, out);
    return out;
  } catch {
    return null;
  }
}
