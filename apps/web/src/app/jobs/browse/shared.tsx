import Link from 'next/link';
import { allCategories, type Category, type CategoryKind } from '../categories-data';

/* The browse spine, tiered (research 2026-08-21: Zillow browse tree, G2
   categories, Zapier /apps). One thin hub + five facet sub-hubs, each safely
   under the ~800-links-a-page practitioner cap, every link server-rendered.
   The hub carries the curated head; the sub-hubs carry the exhaustive tail,
   with combination pages nested under their parent (a country's cell holds
   that country's combos) so no reader re-reads the same prefix 300 times. */

export const FACETS: {
  slug: string; title: string; short: string; h1: string; note: string; kinds: CategoryKind[];
}[] = [
  {
    slug: 'remote', title: 'Remote & flexible', short: 'Remote', h1: 'Remote, preloaded.',
    note: 'Work-from-anywhere roles: the whole board, then by field, by role, and by country.',
    kinds: ['remote', 'remote-field', 'remote-occ', 'remote-country', 'remote-region', 'remote-field-country', 'remote-occ-country'],
  },
  {
    slug: 'fields', title: 'By field', short: 'Fields', h1: 'Every field, preloaded.',
    note: 'Every field on the board, with its seniority, pay and eligibility splits.',
    kinds: ['field', 'level-field', 'pay-field', 'flag-field', 'field-region'],
  },
  {
    slug: 'countries', title: 'By country', short: 'Countries', h1: 'Every country, preloaded.',
    note: 'Where the roles are. Each country holds its own field, role and seniority pages.',
    kinds: ['country', 'region', 'field-country', 'occ-country', 'occ-region'],
  },
  {
    slug: 'seniority', title: 'By seniority', short: 'Seniority', h1: 'Seniority, preloaded.',
    note: 'Senior and entry-level, read from the posting title, overall, by role, and by country.',
    kinds: ['level', 'level-occ', 'level-field-country', 'level-occ-country'],
  },
  {
    slug: 'pay', title: 'By pay & benefits', short: 'Pay', h1: 'Pay and benefits, preloaded.',
    note: 'Salary floors by field, role and country, plus equity and visa sponsorship.',
    kinds: ['pay', 'pay-occ', 'pay-country', 'flag', 'flag-country'],
  },
];

export function facetCats(f: (typeof FACETS)[number]): Category[] {
  const ks = new Set<CategoryKind>(f.kinds);
  return allCategories().filter((c) => ks.has(c.kind));
}

/* "Remote Business jobs in the United States" carries three tokens the cell
   already states twice. Short labels strip whatever the surrounding heading
   says; the full title survives in the title attribute and on the target
   page (gwern's rectangular-block rule: columns only set clean when entries
   stay one line). */
export function shortLabel(c: Category, opts?: { dropCountry?: boolean; dropRemote?: boolean; dropJobs?: boolean }): string {
  let t = c.title;
  if (opts?.dropCountry) t = t.replace(/ in (the )?[A-ZÀ-Þ][^,]*$/, '');
  if (opts?.dropRemote) t = t.replace(/^Remote (jobs )?/, '').replace(/^jobs$/i, 'The whole board') || t;
  if (opts?.dropJobs !== false) t = t.replace(/ jobs\b/, '');
  return t.trim() || c.title;
}

export function countryOf(c: Category): string | null {
  const m = c.title.match(/ in (?:the )?(.+)$/);
  return m ? m[1] : null;
}

/* One ledger row: name, dotted leader, count in tabular mono. The whole row
   is the hit target; nothing transitions. */
export function Row({ href, label, title, count, big }: {
  href: string; label: string; title?: string; count: number; big?: boolean;
}) {
  return (
    <li className={big ? 'bh-row bh-big' : 'bh-row'}>
      <Link href={href} title={title}>
        <span className="bh-t">{label}</span>
        <span className="bh-lead" aria-hidden="true" />
        <span className="bh-n">{count.toLocaleString()}</span>
      </Link>
    </li>
  );
}

export function Cell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bh-cell">
      <h3>{title}</h3>
      <ul>{children}</ul>
    </div>
  );
}
