// POST /api/render-cover
// Body: { asset, aff, mode, line, cobrand, promos }
// Returns: PNG bytes (image/png) rendered by a real headless Chromium.
//
// Why this function exists:
// canvas.toBlob + sharp post-processing both fail LinkedIn's cover
// moderation, even with proper sRGB ICC profile and RGB colour type.
// The remaining theory is that html2canvas's pixel output differs from
// real Chrome rendering (subpixel antialiasing, font hinting, gradient
// interpolation) and LinkedIn's classifier reacts to those signatures.
// Puppeteer launches actual headless Chromium, navigates to /render
// with the banner params, screenshots the rendered element. The PNG
// is byte-identical in character to a manual Win+Shift+S screenshot —
// which we've verified LinkedIn accepts.

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { resp, methodNotAllowed, parseJson } from './_lib/resp.js';

const COVER_SPECS = {
  linkedin_banner:  { w: 1584, h: 396  },
  x_header:         { w: 1500, h: 500  },
  facebook_cover:   { w: 820,  h: 312  },
  zoom_background:  { w: 1920, h: 1080 },
};

function siteOrigin() {
  // Netlify injects URL/DEPLOY_URL. Fall back to the prod host.
  return process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.DEPLOY_URL ||
         'https://adamftd-affiliates.netlify.app';
}

function buildRenderUrl(input) {
  const params = new URLSearchParams({
    asset: input.asset,
    code: input.aff.code,
    first_name: input.aff.first_name || '',
    full_name: input.aff.full_name || '',
    mode: input.mode || 'light',
  });
  if (input.line) params.set('line', input.line);
  if (input.cobrand?.partner) {
    params.set('cb_short', input.cobrand.partner.short_name || '');
    params.set('cb_full',  input.cobrand.partner.full_name  || '');
    params.set('cb_color', input.cobrand.partner.primary_color || '#1F3A5F');
    if (input.cobrand.hero_override) params.set('cb_hero', input.cobrand.hero_override);
    // cobrand logo (data: URI) is intentionally NOT passed — too long for URL.
    // Render falls back to short-name text in the dual lockup.
  }
  if (Array.isArray(input.promos) && input.promos.length) {
    // Encode as 'h1|d1,h2|d2,...' — escape commas/pipes if any (rare)
    const enc = (s) => String(s || '').replace(/\|/g, ' ').replace(/,/g, ';');
    const csv = input.promos.map(p => enc(p.headline) + '|' + enc(p.detail)).join(',');
    if (csv) params.set('promos', csv);
  }
  return siteOrigin() + '/render?' + params.toString();
}

export default async (req) => {
  try {
    return await handle(req);
  } catch (e) {
    console.error('render-cover fatal:', e?.stack || e);
    return resp(500, { error: 'Render failed: ' + (e?.message || 'unknown') });
  }
};

async function handle(req) {
  if (req.method !== 'POST') return methodNotAllowed(['POST']);

  const body = await parseJson(req);
  if (!body) return resp(400, { error: 'Invalid JSON body' });

  const spec = COVER_SPECS[body.asset];
  if (!spec) return resp(400, { error: 'Unknown or non-cover asset: ' + body.asset });
  if (!body.aff || !body.aff.code) return resp(400, { error: 'Affiliate data required' });

  const url = buildRenderUrl(body);

  let browser;
  try {
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--font-render-hinting=none', // match desktop Chrome's text rendering
      ],
      defaultViewport: { width: spec.w, height: spec.h, deviceScaleFactor: 1 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: spec.w, height: spec.h, deviceScaleFactor: 1 });

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });
    await page.waitForFunction(
      () => document.body.dataset.ready === '1' || document.body.dataset.error === '1',
      { timeout: 15000 }
    );

    // Check for render errors
    const errored = await page.evaluate(() => document.body.dataset.error === '1');
    if (errored) {
      const msg = await page.evaluate(() => document.body.textContent || 'render error');
      throw new Error('Render reported error: ' + msg.slice(0, 200));
    }

    const target = await page.$('#render-root > *');
    if (!target) throw new Error('Render root child not found');

    const screenshot = await target.screenshot({ type: 'png', omitBackground: false });

    return new Response(screenshot, {
      status: 200,
      headers: {
        'content-type': 'image/png',
        'content-length': String(screenshot.length),
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

export const config = { path: '/api/render-cover' };
