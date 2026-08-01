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
    return await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  } finally {
    await browser.close();
  }
}
