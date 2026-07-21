// Section-enter reveals, shared by both instruments. Subtle by contract:
// 14px rise + fade, once, only under prefers-reduced-motion: no-preference.
export function mountReveal(root) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    (root || document).querySelectorAll('.rv').forEach((el) => el.classList.add('rv-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('rv-in'); io.unobserve(e.target); }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  (root || document).querySelectorAll('.rv:not(.rv-in)').forEach((el) => io.observe(el));
  return io;
}
