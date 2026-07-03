// GET /api/demo-pdf
// Returns: application/pdf — the Demo Pocket Script rendered to a
// printable PDF by headless Chromium.
//
// Source of truth is the static /demo-pocket-script.html (v1.4) which
// ships its own @media print styles. The dashboard Download tile fetches
// this endpoint and drops the result into the ZIP bundle as
// Demo_Pocket_Script.pdf at the root of the archive.

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { resp, methodNotAllowed } from './_lib/resp.js';

function siteOrigin(req) {
  // Prefer the origin of the incoming request (works on production,
  // preview and dev deployments alike). Fall back to the Vercel host
  // env vars, then the production domain.
  try {
    const o = new URL(req.url).origin;
    if (o && o !== 'null') return o;
  } catch (_) { /* fall through */ }
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return host ? 'https://' + host : 'https://kit.adamftd.com';
}

async function handler(req) {
  try {
    return await handle(req);
  } catch (e) {
    console.error('demo-pdf fatal:', e?.stack || e);
    return resp(500, { error: 'PDF render failed: ' + (e?.message || 'unknown') });
  }
}

// Vercel Node.js runtime Web Handler: the `fetch` export receives the
// standard Request and handles all HTTP methods in one function.
export default { fetch: handler };

async function handle(req) {
  if (req.method !== 'GET' && req.method !== 'POST') return methodNotAllowed(['GET', 'POST']);

  const url = siteOrigin(req) + '/demo-pocket-script.html';

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1200, height: 1600, deviceScaleFactor: 1 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' },
    });

    return new Response(pdf, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-length': String(pdf.length),
        'content-disposition': 'inline; filename="Demo_Pocket_Script.pdf"',
        'cache-control': 'no-store',
        'x-rendered-by': 'puppeteer',
      },
    });
  } finally {
    if (browser) {
      try { await browser.close(); } catch (_) { /* ignore */ }
    }
  }
}
