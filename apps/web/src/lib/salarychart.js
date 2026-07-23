/* The salary time-series chart. Two axes: year (x) against annual pay (y),
   drawn as a 25th-to-75th-percentile band with the median line on top, an
   AI-era marker, and the current live-posting read as a distinct point.
   Vanilla canvas in device pixels (a scaled context turns strokes fuzzy),
   swiss palette, dependency-free, static under prefers-reduced-motion. The
   numbers are also server-rendered as text on the page; this is the visual. */

const PAL = {
  ink: '#15151a', ink2: '#56565e', ink3: '#8a8a93',
  rule: '#d5cfbf', accent: '#002FA6', tint: 'rgba(0,47,166,0.10)', paper: '#f5f3ed',
};

function money(v) {
  if (v >= 1000) return '$' + Math.round(v / 1000) + 'k';
  return '$' + Math.round(v);
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
  // round to tidy gridlines
  const step = niceStep((hi - lo) / 4);
  lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;

  let W = 0, H = 0;
  const M = { t: 18, r: 16, b: 30, l: 52 };

  function size() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
  }
  const X = (yr) => M.l + ((yr - yMin) / (yMax - yMin || 1)) * (W - M.l - M.r);
  const Y = (v) => M.t + (1 - (v - lo) / (hi - lo || 1)) * (H - M.t - M.b);

  function draw(k, hover) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.font = '9px "Space Mono", ui-monospace, monospace';
    ctx.textBaseline = 'middle';

    // y gridlines + labels
    ctx.strokeStyle = PAL.rule; ctx.lineWidth = 0.5;
    ctx.fillStyle = PAL.ink3; ctx.textAlign = 'right';
    for (let v = lo; v <= hi + 1; v += step) {
      const y = Y(v);
      ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.moveTo(M.l, y); ctx.lineTo(W - M.r, y); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillText(money(v), M.l - 8, y);
    }

    // x labels (years) — only integer years within range
    ctx.textAlign = 'center';
    for (let yr = Math.ceil(yMin); yr <= Math.floor(yMax); yr++) {
      if ((Math.floor(yMax) - Math.ceil(yMin)) > 8 && yr % 2 !== 0) continue;
      ctx.fillText(String(yr), X(yr), H - M.b + 14);
    }

    // AI-era marker
    if (aiYear && aiYear >= yMin && aiYear <= yMax) {
      const x = X(aiYear);
      ctx.strokeStyle = PAL.ink3; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(x, M.t); ctx.lineTo(x, H - M.b); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = PAL.ink2; ctx.textAlign = 'left';
      ctx.save(); ctx.translate(x + 5, M.t + 4); ctx.fillText('AI ERA', 0, 0); ctx.restore();
    }

    const clip = M.l + (W - M.l - M.r) * k;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, clip, H); ctx.clip();

    // p25-p75 band
    if (series.length >= 2) {
      ctx.fillStyle = PAL.tint;
      ctx.beginPath();
      series.forEach((p, i) => { const x = X(p.year), y = Y(p.p75); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      for (let i = series.length - 1; i >= 0; i--) { const p = series[i]; ctx.lineTo(X(p.year), Y(p.p25)); }
      ctx.closePath(); ctx.fill();
      // faint p25/p75 edges
      ctx.strokeStyle = 'rgba(0,47,166,0.28)'; ctx.lineWidth = 1;
      for (const key of ['p25', 'p75']) {
        ctx.beginPath();
        series.forEach((p, i) => { const x = X(p.year), y = Y(p[key]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.stroke();
      }
    }

    // p50 median line
    ctx.strokeStyle = PAL.accent; ctx.lineWidth = 2.25; ctx.lineJoin = 'round';
    ctx.beginPath();
    series.forEach((p, i) => { const x = X(p.year), y = Y(p.p50); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke();
    // median dots
    ctx.fillStyle = PAL.accent;
    series.forEach((p) => { ctx.beginPath(); ctx.arc(X(p.year), Y(p.p50), 2.6, 0, 6.29); ctx.fill(); });

    ctx.restore();

    // current live point (ink, distinct) — drawn after clip so it always shows
    if (current && k >= 0.98) {
      const x = X(current.year), y = Y(current.p50);
      // Bridge the official series (ends at the last OEWS year) to the live
      // posting read with a faint dashed connector — signals "official through
      // then, live now" so the stretch reads as intentional, not a broken line.
      if (series.length) {
        const last = series[series.length - 1];
        ctx.strokeStyle = 'rgba(0,47,166,0.38)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(X(last.year), Y(last.p50)); ctx.lineTo(x, y); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.strokeStyle = PAL.ink; ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(x, Y(current.p25)); ctx.lineTo(x, Y(current.p75)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = PAL.ink;
      ctx.beginPath(); ctx.arc(x, y, 4, 0, 6.29); ctx.fill();
      ctx.fillStyle = PAL.paper;
      ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 6.29); ctx.fill();
      ctx.fillStyle = PAL.ink; ctx.textAlign = 'right'; ctx.font = '9px "Space Mono", ui-monospace, monospace';
      ctx.fillText('LIVE ' + money(current.p50), x - 7, y);
    }

    // hover readout: a vertical guide at the nearest year and three value tags
    // pinned to the band — 75th on top, median in the middle, 25th at the bottom.
    if (hover && k >= 1) {
      const hx = X(hover.year);
      ctx.strokeStyle = 'rgba(21,21,26,0.30)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(hx, M.t); ctx.lineTo(hx, H - M.b); ctx.stroke();
      ctx.setLineDash([]);
      const items = [{ v: hover.p75, y: Y(hover.p75) }, { v: hover.p50, y: Y(hover.p50) }, { v: hover.p25, y: Y(hover.p25) }];
      for (const it of items) { ctx.fillStyle = PAL.accent; ctx.beginPath(); ctx.arc(hx, it.y, 3, 0, 6.29); ctx.fill(); }
      ctx.font = '10px "Space Mono", ui-monospace, monospace';
      let prevBot = -1e9;
      for (const it of items) {
        let ty = it.y; if (ty - 8 < prevBot) ty = prevBot + 10; prevBot = ty + 8;
        const label = money(it.v);
        const tw = ctx.measureText(label).width, pad = 6, pw = tw + pad * 2, ph = 16;
        let px = hx + 9; if (px + pw > W - M.r) px = hx - 9 - pw;
        ctx.fillStyle = PAL.ink; roundRect(ctx, px, ty - ph / 2, pw, ph, 2); ctx.fill();
        ctx.fillStyle = PAL.paper; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(label, px + pad, ty);
      }
      ctx.textBaseline = 'middle';
    }

    ctx.restore();
  }

  size();
  window.addEventListener('resize', () => { size(); draw(1); });
  // hover: snap to the nearest year and show the three band values there.
  canvas.style.cursor = 'crosshair';
  canvas.addEventListener('mousemove', (e) => {
    const mx = e.offsetX;
    let best = null, bd = Infinity;
    for (const pt of pts) { const d = Math.abs(X(pt.year) - mx); if (d < bd) { bd = d; best = pt; } }
    draw(1, best);
  });
  canvas.addEventListener('mouseleave', () => draw(1, null));
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
