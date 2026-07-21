/* The adjacency field — the whole measured network as one ambient canvas.
   Marketing surface, not an instrument: no labels, no interaction, just the
   scale of what the pipeline reads. Canvas 2D (2.9k edges kills SVG), draws
   only while in the viewport, drifts a few pixels on slow sine phases, and
   respects prefers-reduced-motion with a single static frame. */

const W = 900, H = 520;

export async function initCloud(canvas, capEl) {
  const data = await fetch('/data/cloud.json').then((r) => r.json()).catch(() => null);
  if (!data) return;
  const { p, d, e, stats } = data;

  if (capEl) {
    capEl.innerHTML =
      stats.occupations + ' occupations · ' + stats.postings.toLocaleString() +
      ' live postings · ' + stats.connections.toLocaleString() +
      ' measured connections · rebuilt daily';
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ctx = canvas.getContext('2d');
  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform((w * dpr) / W, 0, 0, (h * dpr) / H, 0, 0);
  }
  size();
  window.addEventListener('resize', size);

  const n = p.length;
  const phase = new Array(n), amp = new Array(n);
  for (let i = 0; i < n; i++) { phase[i] = (i * 2654435761 % 628) / 100; amp[i] = 1.2 + (i * 40503 % 100) / 100 * 1.6; }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const ox = new Array(n), oy = new Array(n);
    for (let i = 0; i < n; i++) {
      ox[i] = p[i][0] + Math.sin(t * 0.00021 + phase[i]) * amp[i];
      oy[i] = p[i][1] + Math.cos(t * 0.00017 + phase[i] * 1.7) * amp[i] * 0.8;
    }
    ctx.lineWidth = 0.5;
    for (let k = 0; k < e.length; k++) {
      const [a, b, w] = e[k];
      ctx.strokeStyle = 'rgba(0,47,166,' + (0.025 + w * 0.075) + ')';
      ctx.beginPath(); ctx.moveTo(ox[a], oy[a]); ctx.lineTo(ox[b], oy[b]); ctx.stroke();
    }
    for (let i = 0; i < n; i++) {
      const r = 1.3 + Math.min(d[i], 60) / 60 * 2.1;
      ctx.fillStyle = d[i] > 34 ? '#002FA6' : 'rgba(21,21,26,0.72)';
      ctx.beginPath(); ctx.arc(ox[i], oy[i], r, 0, 6.2832); ctx.fill();
    }
  }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { draw(0); return; }

  let visible = false, raf = null, last = 0;
  function loop(t) {
    raf = null;
    if (!visible) return;
    if (t - last > 33) { draw(t); last = t; } // ~30fps is plenty for ambient drift
    raf = requestAnimationFrame(loop);
  }
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(loop);
  }, { threshold: 0.05 }).observe(canvas);
  draw(0);
}
