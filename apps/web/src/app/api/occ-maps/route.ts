import { occMaps } from '../../jobs/jobs-data';

export const dynamic = 'force-static';

/* The occupation maps behind the board's typeahead and field filter. They are
   65KB and the same on every page, so category boards carry only the
   occupations they list and fetch the rest here once. Serialised into each of
   ~15k category pages, they were a third of the build output. */
export function GET() {
  return Response.json(occMaps());
}
