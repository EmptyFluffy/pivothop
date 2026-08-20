/* The salary time-series chart. Two axes: year (x) against annual pay (y),
   drawn as a 25th-to-75th-percentile band with the median line on top, an
   AI-era marker, and the current live-posting read as a distinct point.
   Vanilla canvas in device pixels (a scaled context turns strokes fuzzy),
   dependency-free, static under prefers-reduced-motion.

   v2: the palette is read from the page's CSS tokens at every draw, so the
   chart follows the mode (violet on light, gold on dark) and redraws itself
   when the theme toggle flips. Lines are Catmull-Rom curves, not polylines,
   and every label sits in the words face. The numbers are also
   server-rendered as text on the page; this is the visual. */

function readPal(canvas) {
  const cs = getComputedStyle(canvas);
  const v = (name, fb) => (cs.getPropertyValue(name) || '').trim() || fb;
  const value = v('--v-value', '#6219FF');
  return {
    ink: v('--v-text', '#141414'),
    ink2: v('--v-text2', '#66646B'),
    rule: v('--v-border', '#E4E2DC'),
    bg: v('--v-bg', '#FFFFFF'),
    value,
    tint: withAlpha(value, 0.10),
    tintFaint: withAlpha(value, 0.05),
    edge: withAlpha(value, 0.30),
    bridge: withAlpha(value, 0.40),
  };
}

function withAlpha(hex, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const FONT = (px, w = 500) => `${w} ${px}px "Instrument Sans", ui-sans-serif, sans-serif`;

function money(v) {
  if (v >= 1000) return '$' + Math.round(v / 1000) + 'k';
  return '$' + Math.round(v);
}

/* Catmull-Rom through the points (tension 1/6), so the series reads as one
   drawn stroke rather than a polygon. Call inside an open path. */
function curveTo(ctx, pts, move) {
  if (pts.length === 0) return;
  if (move) ctx.moveTo(pts[0].x, pts[0].y);
  else ctx.lineTo(pts[0].x, pts[0].y);
  if (pts.length === 1) return;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    ctx.bezierCurveTo(
      p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6,
      p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6,
      p2.x, p2.y
    );
  }
}

export function initSalaryChart(canvas, data) {
  if (!canvas || !data) return;
  const series = (data.series || []).slice().sort((a, b) => a.year - b.year);
  const current = data.current || null;
  const aiYear = data.aiYear || null;
  const pts = series.concat(current ? [current] : []);
  if (pts.length < 1) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const years = pts.map((p) => p.year);
  const yMin = Math.min(...years), yMax = Math.max(...years);
  const vals = pts.flatMap((p) => [p.p25, p.p75].filter((v) => v != null));
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = (hi - lo) * 0.12 || hi * 0.1;
  lo = Math.max(0, lo - pad); hi = hi + pad;
  const step = niceStep((hi - lo) / 4);
  lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;

  let W = 0, H = 0;
  const M = { t: 24, r: 18, b: 32, l: 54 };

  function size() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
  }
  const X = (yr) => M.l + ((yr - yMin) / (yMax - yMin || 1)) * (W - M.l - M.r);
  const Y = (v) => M.t + (1 - (v - lo) / (hi - lo || 1)) * (H - M.t - M.b);
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const yearAtX = (px) => clampN(yMin + ((px - M.l) / (W - M.l - M.r || 1)) * (yMax - yMin), yMin, yMax);
  const P = (key) => pts.map((p) => ({ x: X(p.year), y: Y(p[key]) }));
  function bandAt(yr) {
    if (yr <= pts[0].year) return pts[0];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      if (yr >= a.year && yr <= b.year) {
        const t = (yr - a.year) / (b.year - a.year || 1);
        return { p25: a.p25 + (b.p25 - a.p25) * t, p50: a.p50 + (b.p50 - a.p50) * t, p75: a.p75 + (b.p75 - a.p75) * t };
      }
    }
    return pts[pts.length - 1];
  }

  function draw(k, hover) {
    const pal = readPal(canvas);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.font = FONT(11);
    ctx.textBaseline = 'middle';

    // y gridlines + labels
    ctx.strokeStyle = pal.rule; ctx.lineWidth = 0.5;
    ctx.fillStyle = pal.ink2; ctx.textAlign = 'right';
    for (let v = lo; v <= hi + 1; v += step) {
      const y = Y(v);
      ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.moveTo(M.l, y); ctx.lineTo(W - M.r, y); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillText(money(v), M.l - 9, y);
    }

    // x labels (years)
    ctx.textAlign = 'center';
    for (let yr = Math.ceil(yMin); yr <= Math.floor(yMax); yr++) {
      if ((Math.floor(yMax) - Math.ceil(yMin)) > 8 && yr % 2 !== 0) continue;
      ctx.fillText(String(yr), X(yr), H - M.b + 15);
    }

    // AI-era marker. The label flips to the left of the line when the line
    // sits in the right third, so it never crowds the edge.
    if (aiYear && aiYear >= yMin && aiYear <= yMax) {
      const x = X(aiYear);
      ctx.strokeStyle = pal.ink2; ctx.lineWidth = 1; ctx.globalAlpha = 0.6;
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(x, M.t); ctx.lineTo(x, H - M.b); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      ctx.fillStyle = pal.ink2; ctx.font = FONT(10.5, 550);
      const flip = x > M.l + (W - M.l - M.r) * 0.62;
      ctx.textAlign = flip ? 'right' : 'left';
      ctx.fillText('AI era', flip ? x - 8 : x + 8, M.t + 6);
      ctx.font = FONT(11);
    }

    const clip = M.l + (W - M.l - M.r) * k;
    const lastX = series.length ? X(series[series.length - 1].year) : clip;

    // One continuous curved ribbon over ALL points, live read included. The
    // official years draw solid; past them the same curves continue dashed,
    // so nothing on the chart is a polygon.
    const seg = (x0, x1, dash, width, style, drawFn) => {
      ctx.save();
      ctx.beginPath(); ctx.rect(x0, 0, Math.max(0, x1 - x0), H); ctx.clip();
      ctx.setLineDash(dash); ctx.lineWidth = width; ctx.strokeStyle = style;
      drawFn();
      ctx.restore();
    };
    if (pts.length >= 2) {
      // the ribbon fill: solid tint through the official years, faint after
      const ribbon = () => {
        ctx.beginPath();
        curveTo(ctx, P('p75'), true);
        curveTo(ctx, P('p25').reverse(), false);
        ctx.closePath(); ctx.fill();
      };
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, Math.min(clip, lastX), H); ctx.clip();
      ctx.fillStyle = pal.tint; ribbon(); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(lastX, 0, Math.max(0, clip - lastX), H); ctx.clip();
      ctx.fillStyle = pal.tintFaint; ribbon(); ctx.restore();
      // band edges
      for (const key of ['p25', 'p75']) {
        const edge = () => { ctx.beginPath(); curveTo(ctx, P(key), true); ctx.stroke(); };
        seg(0, Math.min(clip, lastX), [], 1, pal.edge, edge);
        seg(lastX, clip, [4, 4], 1, pal.edge, edge);
      }
      // median
      const med = () => { ctx.beginPath(); ctx.lineJoin = 'round'; curveTo(ctx, P('p50'), true); ctx.stroke(); };
      seg(0, Math.min(clip, lastX), [], 2.25, pal.value, med);
      seg(lastX, clip, [4, 4], 1.5, pal.bridge, med);
    }
    ctx.setLineDash([]);
    ctx.fillStyle = pal.value;
    series.forEach((p) => {
      if (X(p.year) <= clip) { ctx.beginPath(); ctx.arc(X(p.year), Y(p.p50), 2.6, 0, 6.29); ctx.fill(); }
    });

    // the live read: dot, whisker, tag
    if (current && k >= 0.98) {
      const x = X(current.year), y = Y(current.p50);
      ctx.strokeStyle = pal.ink; ctx.lineWidth = 1; ctx.setLineDash([2, 3]); ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.moveTo(x, Y(current.p25)); ctx.lineTo(x, Y(current.p75)); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      ctx.fillStyle = pal.value;
      ctx.beginPath(); ctx.arc(x, y, 4.2, 0, 6.29); ctx.fill();
      ctx.fillStyle = pal.bg;
      ctx.beginPath(); ctx.arc(x, y, 1.7, 0, 6.29); ctx.fill();
      ctx.fillStyle = pal.ink; ctx.textAlign = 'right'; ctx.font = FONT(11, 550);
      ctx.fillText('Live ' + money(current.p50), x - 9, y);
      ctx.font = FONT(11);
    }

    // hover readout
    if (hover && k >= 1 && hover.alpha > 0.01) {
      const hx = hover.x;
      const b = bandAt(yearAtX(hx));
      ctx.globalAlpha = hover.alpha;
      ctx.strokeStyle = pal.ink2; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(hx, M.t); ctx.lineTo(hx, H - M.b); ctx.stroke();
      ctx.setLineDash([]);
      const items = [{ v: b.p75, y: Y(b.p75) }, { v: b.p50, y: Y(b.p50) }, { v: b.p25, y: Y(b.p25) }];
      for (const it of items) { ctx.fillStyle = pal.value; ctx.beginPath(); ctx.arc(hx, it.y, 3, 0, 6.29); ctx.fill(); }
      ctx.font = FONT(11.5, 550);
      let prevBot = -1e9;
      for (const it of items) {
        let ty = it.y; if (ty - 9 < prevBot) ty = prevBot + 11; prevBot = ty + 9;
        const label = money(it.v);
        const tw = ctx.measureText(label).width, padX = 7, pw = tw + padX * 2, ph = 18;
        let px = hx + 10; if (px + pw > W - M.r) px = hx - 10 - pw;
        ctx.fillStyle = pal.ink; roundRect(ctx, px, ty - ph / 2, pw, ph, 4); ctx.fill();
        ctx.fillStyle = pal.bg; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(label, px + padX, ty);
      }
      ctx.font = FONT(11);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  size();
  window.addEventListener('resize', () => { size(); draw(1); });

  // the theme toggle flips a class on <html>; the palette is read per draw,
  // so a mode change only needs one redraw
  const mo = new MutationObserver(() => draw(1));
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  if (window.matchMedia) {
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => draw(1));
    } catch { /* older engines */ }
  }

  canvas.style.cursor = 'crosshair';
  const MAG = 16;
  let hoverOn = false, targetX = 0, dispX = 0, alpha = 0, raf2 = null;
  function hoverTick() {
    dispX += (targetX - dispX) * 0.28;
    const ta = hoverOn ? 1 : 0;
    alpha += (ta - alpha) * 0.2;
    const settled = Math.abs(targetX - dispX) < 0.4 && Math.abs(ta - alpha) < 0.01;
    if (settled) { dispX = targetX; alpha = ta; }
    draw(1, alpha > 0.01 ? { x: dispX, alpha } : null);
    raf2 = settled ? null : requestAnimationFrame(hoverTick);
  }
  canvas.addEventListener('mousemove', (e) => {
    const mx = e.offsetX;
    let tx = clampN(mx, M.l, W - M.r), bd = Infinity, nearX = 0;
    for (const pt of pts) { const px = X(pt.year); const d = Math.abs(px - mx); if (d < bd) { bd = d; nearX = px; } }
    if (bd < MAG) tx = nearX;
    targetX = tx;
    if (!hoverOn) { hoverOn = true; dispX = tx; }
    if (!raf2) raf2 = requestAnimationFrame(hoverTick);
  });
  canvas.addEventListener('mouseleave', () => { hoverOn = false; if (!raf2) raf2 = requestAnimationFrame(hoverTick); });
  if (reduce) { draw(1); return; }
  let start = null;
  function anim(ts) {
    if (start == null) start = ts;
    const k = Math.min(1, (ts - start) / 800);
    draw(k < 1 ? 1 - Math.pow(1 - k, 3) : 1);
    if (k < 1) requestAnimationFrame(anim);
  }
  requestAnimationFrame(anim);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function niceStep(raw) {
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  const s = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return s * mag;
}
