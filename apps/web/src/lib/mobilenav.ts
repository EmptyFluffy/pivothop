/* Wire any .nav-burger on the page to toggle its nav's mobile dropdown.
   Works for React-rendered navs and the landing's injected HTML string alike,
   so all three navs share one accessible behavior. Idempotent per button. */

export function wireMobileNav(): void {
  document.querySelectorAll<HTMLButtonElement>('.nav-burger').forEach((burger) => {
    if (burger.dataset.wired) return;
    burger.dataset.wired = '1';
    const nav = burger.closest('.nav') as HTMLElement | null;
    if (!nav) return;
    const menu = nav.querySelector('.nav-menu');
    const set = (open: boolean) => {
      nav.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      // full-screen menu on phones: the page behind it must not scroll
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', (e) => { e.stopPropagation(); set(!nav.classList.contains('open')); });
    // close on: link tap in the menu, Escape, tap outside the nav
    menu?.addEventListener('click', (e) => { if ((e.target as Element).closest('a')) set(false); });
    document.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Escape') set(false); });
    document.addEventListener('click', (e) => { if (!nav.contains(e.target as Node)) set(false); });
  });
}
