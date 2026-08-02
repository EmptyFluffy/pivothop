/* HTML -> PDF. The one env-specific seam in the export flow.

   It loads the serverless Chromium stack (puppeteer-core + @sparticuz/chromium)
   at runtime via computed specifiers, so the Next build never tries to resolve
   them before they're installed. Until they are (the render-env decision:
   Vercel serverless vs a VPS), renderPdf returns null and /api/roadmap degrades
   to lead-capture. Once installed + `serverExternalPackages` is set, this works
   with no further change. */

export async function renderPdf(html) {
  let puppeteer, chromium;
  try {
    // LITERAL specifiers, deliberately. These were concatenated ('puppeteer' +
    // '-core') so the build would not resolve them before they were installed —
    // correct at the time, and the exact reason the first deploy failed: Next's
    // file tracer is a STATIC analyser, so a computed specifier is invisible to
    // it and the 67MB chromium binary was never packaged into the function. The
    // import then threw at runtime, renderPdf returned null, and /api/roadmap
    // degraded to lead-capture with delivered=false and no error anywhere.
    // The packages are real dependencies now, so the specifiers must be literal.
    puppeteer = (await import('puppeteer-core')).default;
    chromium = (await import('@sparticuz/chromium')).default;
  } catch {
    return null; // render deps not installed yet — see the step-3 wiring
  }
  const browser = await puppeteer.launch({
    args: [...chromium.args, '--font-render-hinting=none'],
    defaultViewport: { width: 1240, height: 1754 },
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 25000 });
    await page.evaluateHandle('document.fonts.ready');
    /* THE LAYOUT REVIEW, before anything is sent.
       Pages are fixed A4 (.pg is 297mm, overflow:hidden, absolute footer), so
       overlong content prints THROUGH the footer, which is exactly what the
       founder's report did on page 3 when the AI's course titles ran long. A
       model cannot see geometry, but the browser we are already inside can
       MEASURE it: for every page, while the content is taller than the page,
       remove the least-important row (elements marked data-trim, last first).
       Deterministic, runs on every render, and logs what it cut so a trimmed
       page is visible in the logs rather than silently shorter. */
    const trimmed = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('.pg').forEach((pg, i) => {
        let guard = 60;
        while (pg.scrollHeight > pg.clientHeight + 1 && guard-- > 0) {
          const rows = pg.querySelectorAll('[data-trim]');
          const last = rows[rows.length - 1];
          if (!last) break;
          out.push(`p${i + 1}:${last.getAttribute('data-trim')}`);
          last.remove();
        }
        if (pg.scrollHeight > pg.clientHeight + 1) out.push(`p${i + 1}:STILL-OVERFLOWING`);
      });
      // Husk cleanup: if every row of a list block was trimmed, remove the block —
      // a "Where to actually learn this" heading with nothing under it reads as a
      // rendering bug, which is exactly how the founder experienced it.
      document.querySelectorAll('.res-b, .sal-onward, .sm-stones').forEach((blk) => {
        if (!blk.querySelector('[data-trim]')) { blk.remove(); out.push('husk-removed'); }
      });
      return out;
    });
    if (trimmed.length) console.error('[roadmap] layout trim:', trimmed.join(' '));
    return await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  } finally {
    await browser.close();
  }
}
