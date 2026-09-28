/** A title as a running noun: lower case, acronyms kept ("IT support
 *  specialist", "UX designer", "FF&E specialist", "3D modeler"). Its own
 *  module because BoardCta is a client component, and a server page cannot
 *  call a plain function exported from a 'use client' file. */
export function roleNoun(title: string): string {
  return title.split(' ').map((w) => (/^[A-Z0-9&+/]{2,}$/.test(w) ? w : w.toLowerCase())).join(' ');
}
