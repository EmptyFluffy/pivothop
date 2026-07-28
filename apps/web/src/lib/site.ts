/* Single source of truth for site-wide contact details.
   Change SITE_EMAIL here and it updates the employer form, the listing-claim
   link, the about page, and the submission-notification default. Set up the
   matching mailbox (see docs/21) before launch. */

export const SITE_EMAIL = 'hello@pivothop.com';

/** "a" or "an" for an occupation title. Vowel-initial takes "an" — except the
    U-words that start with a "yoo" sound ("a UX designer", not "an UX
    designer"), which our lexicon has three of. Acronyms like AI and IT read as
    letter names and correctly take "an". */
export function article(title: string): 'a' | 'an' {
  const t = title.trim();
  if (/^u[xi]\b/i.test(t) || /^(uni|use|usu|uti|uro|eu)/i.test(t)) return 'a';
  return /^[aeiou]/i.test(t) ? 'an' : 'a';
}

/** Anchor phrasings for a link to /routes/<occupation>. Templated links at
    scale need variation: thousands of pages pointing at 125 targets with one
    identical phrase reads as automated, and the exact-match share should sit
    around a quarter rather than all of it. Pick with `pickAnchor` so a given
    page is stable across builds. */
export function originAnchors(title: string): string[] {
  const tl = title.toLowerCase();
  return [
    `Alternative careers for ${article(title)} ${tl}`,   // exact-match
    `Where ${tl}s move next`,                            // partial
    `Careers ${article(title)} ${tl} can move into`,     // partial
    `${title} career changes, measured`,                 // branded/entity
    `What ${tl}s do instead`,                            // generic
  ];
}

/** Stable choice from a list, seeded by any string (a slug or id). */
export function pickAnchor(list: string[], seed: string, offset = 0): string {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return list[(h + offset) % list.length];
}
