/* The adjacency field — the whole measured network as one ambient canvas.
   Marketing surface with one honest interaction: hover a dot and it names
   itself with its real posting count and connection count — proof the cloud
   is data, not decoration. Canvas 2D drawn in DEVICE pixels (a scaled
   context turns arc() circles into ellipses), ~30fps only while visible,
   static frame under prefers-reduced-motion. */

const W = 900, H = 520;

export async function initCloud(canvas, capEl) {
  const data = await fetch('/data/cloud.json').then((r) => r.json()).catch(() => null);
  if (!data) return;
  const { p, d, e, n, stats } = data;
  const N = p.length;

  if (capEl) {
    capEl.innerHTML =
      stats.occupations + ' occupations · ' + stats.postings.toLocaleString() +
      ' live postings · ' + stats.connections.toLocaleString() +
      ' measured connections · rebuilt daily';
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ctx = canvas.getContext('2d');
  let cw = 0, ch = 0;
  function size() {
    cw = canvas.clientWidth; ch = canvas.clientHeight;
    canvas.width = cw * dpr; canvas.height = ch * dpr;
  }
  size();
  window.addEventListener('resize', size);

  const phase = new Array(N), amp = new Array(N);
  for (let i = 0; i < N; i++) { phase[i] = (i * 2654435761 % 628) / 100; amp[i] = 2.2 + (i * 40503 % 100) / 100 * 3.2; }

  const sx = new Array(N), sy = new Array(N); // device-pixel positions this frame
  let hoverIdx = -1;

  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const kx = (cw * dpr) / W, ky = (ch * dpr) / H;
    for (let i = 0; i < N; i++) {
      sx[i] = (p[i][0] + Math.sin(t * 0.0008 + phase[i]) * amp[i]) * kx;
      sy[i] = (p[i][1] + Math.cos(t * 0.00064 + phase[i] * 1.7) * amp[i] * 0.8) * ky;
    }
    ctx.lineWidth = 0.55 * dpr;
    for (let k = 0; k < e.length; k++) {
      const ed = e[k], a = ed[0], b = ed[1];
      const hot = hoverIdx >= 0 && (a === hoverIdx || b === hoverIdx);
      ctx.strokeStyle = hot ? 'rgba(0,47,166,0.5)' : 'rgba(0,47,166,' + (0.025 + ed[2] * 0.07) + ')';
      ctx.beginPath(); ctx.moveTo(sx[a], sy[a]); ctx.lineTo(sx[b], sy[b]); ctx.stroke();
    }
    for (let i = 0; i < N; i++) {
      const r = (1.1 + Math.min(d[i], 60) / 60 * 1.5) * dpr;
      ctx.fillStyle = d[i] > 34 ? '#002FA6' : 'rgba(21,21,26,0.66)';
      ctx.beginPath(); ctx.arc(sx[i], sy[i], i === hoverIdx ? r + 1.6 * dpr : r, 0, 6.2832); ctx.fill();
      if (i === hoverIdx) {
        ctx.strokeStyle = '#002FA6'; ctx.lineWidth = 1.2 * dpr;
        ctx.beginPath(); ctx.arc(sx[i], sy[i], r + 4 * dpr, 0, 6.2832); ctx.stroke();
        ctx.lineWidth = 0.55 * dpr;
      }
    }
  }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // hover: nearest node within 11px names itself with its real numbers
  const tip = document.createElement('div');
  tip.className = 'hop-tip cloud-tip';
  canvas.parentElement.appendChild(tip);
  canvas.addEventListener('mousemove', (ev) => {
    const r = canvas.getBoundingClientRect();
    const mx = (ev.clientX - r.left) * dpr, my = (ev.clientY - r.top) * dpr;
    let best = -1, bd = 11 * dpr * 11 * dpr;
    for (let i = 0; i < N; i++) {
      const dx = sx[i] - mx, dy = sy[i] - my, q = dx * dx + dy * dy;
      if (q < bd) { bd = q; best = i; }
    }
    if (best !== hoverIdx) {
      hoverIdx = best;
      if (best >= 0) {
        tip.textContent = n[best][0] + ' · ' + (n[best][1] ? n[best][1].toLocaleString() + ' postings · ' : '') + d[best] + ' connections';
        tip.style.left = canvas.offsetLeft + sx[best] / dpr + 'px';
        tip.style.top = canvas.offsetTop + sy[best] / dpr - 10 + 'px';
        tip.classList.add('on');
        canvas.style.cursor = 'crosshair';
      } else { tip.classList.remove('on'); canvas.style.cursor = 'default'; }
      if (reduced) draw(0);
    } else if (best >= 0) {
      tip.style.left = canvas.offsetLeft + sx[best] / dpr + 'px';
      tip.style.top = canvas.offsetTop + sy[best] / dpr - 10 + 'px';
    }
  });
  canvas.addEventListener('mouseleave', () => { hoverIdx = -1; tip.classList.remove('on'); if (reduced) draw(0); });

  if (reduced) { draw(0); return; }

  let visible = false, raf = null, last = 0;
  function loop(t) {
    raf = null;
    if (!visible) return;
    if (t - last > 33) { draw(t); last = t; }
    raf = requestAnimationFrame(loop);
  }
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(loop);
  }, { threshold: 0.05 }).observe(canvas);
  draw(0);
}
