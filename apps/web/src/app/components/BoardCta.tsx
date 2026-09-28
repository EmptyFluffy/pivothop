'use client';
import Link from 'next/link';
import { track } from '@vercel/analytics';

/* The job board, one tap from the top of every SEO page (2026-09-28).
   Search traffic lands on salary, compare, routes, guides, skills and company
   pages, and the first link to live jobs sat 16% to 97% of the way down the
   text (measured on production HTML, three pages per family). One button
   under the head: the first viewport's only CTA (non-negotiable 6).

   The count is the destination's own count, so the number on the button is
   the number on arrival, and a board under BOARD_CTA_MIN roles gets no button
   ("3 open jobs" argues against the click). Clicks are a Vercel Analytics
   event, not a ?from= parameter, which would mint a crawlable duplicate of
   every board URL. Hire pages keep their employer CTA instead: the people
   landing there are hiring, not looking. */
export const BOARD_CTA_MIN = 6;

export type BoardLink = { href: string; n: number; text: string; down?: boolean };

export function BoardCta({ from, links }: { from: string; links: BoardLink[] }) {
  const shown = links.filter((l) => l.n >= BOARD_CTA_MIN);
  if (!shown.length) return null;
  return (
    <p className="rt-head-cta board-cta">
      {shown.map((l, i) => (
        <Link
          key={l.href}
          className={i ? 'rt-go rt-go-alt' : 'rt-go'}
          href={l.href}
          onClick={() => track('board_cta', { from, to: l.href })}
        >
          {l.text} {l.down ? <>&darr;</> : <>&rarr;</>}
        </Link>
      ))}
    </p>
  );
}
