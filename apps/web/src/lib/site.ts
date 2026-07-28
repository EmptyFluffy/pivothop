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
