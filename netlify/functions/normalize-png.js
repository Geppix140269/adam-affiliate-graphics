// POST /api/normalize-png
// Body: raw PNG bytes (Content-Type: image/png)
// Returns: PNG bytes re-encoded by sharp with a proper sRGB ICC profile,
// standard metadata, and clean PNG structure.
//
// Why this function exists:
// Chrome's canvas.toBlob('image/png') produces PNGs that LinkedIn's
// cover-image moderation rejects (verified empirically: the same pixels
// captured via Windows Snipping Tool upload fine, while our canvas output
// is bounced). Adding the sRGB chunk client-side didn't help, suggesting
// LinkedIn wants a full ICC profile (not just the 1-byte sRGB marker)
// and/or stricter PNG structure than canvas.toBlob emits.
// sharp uses libvips under the hood and writes "real" PNG files with
// embedded sRGB IEC61966-2.1 profile by default.

import sharp from 'sharp';
import { resp, methodNotAllowed } from './_lib/resp.js';

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB cap on input

export default async (req) => {
  try {
    return await handle(req);
  } catch (e) {
    console.error('normalize-png fatal:', e?.stack || e);
    return resp(500, { error: 'Could not normalise image: ' + (e?.message || 'unknown') });
  }
};

async function handle(req) {
  if (req.method !== 'POST') return methodNotAllowed(['POST']);

  const ab = await req.arrayBuffer();
  if (!ab || ab.byteLength === 0) {
    return resp(400, { error: 'Empty body. POST raw PNG bytes.' });
  }
  if (ab.byteLength > MAX_BYTES) {
    return resp(413, { error: 'Image too large. Max ' + (MAX_BYTES / (1024 * 1024)) + ' MB.' });
  }

  const inputBuffer = Buffer.from(ab);

  // Read metadata to know what bg to flatten any alpha onto.
  const meta = await sharp(inputBuffer, { failOn: 'none' }).metadata();
  // Default to ADAMftd ink dark; the artboards always render solid bg so
  // there shouldn't actually be transparent pixels — this is a safety net.
  const fallbackBg = { r: 15, g: 27, b: 45 };

  const output = await sharp(inputBuffer, { failOn: 'none' })
    // Flatten any alpha onto a solid background → guaranteed no alpha.
    .flatten({ background: fallbackBg })
    // Drop the alpha channel from the output PNG: color type 2 (RGB) instead
    // of color type 6 (RGBA). Real photos and screenshots are RGB.
    .removeAlpha()
    // Pipeline colour space sRGB.
    .toColorspace('srgb')
    // Embed the standard sRGB IEC61966-2.1 ICC profile.
    .withMetadata({ icc: 'srgb' })
    // Re-encode via libpng. Use default compression level (6) — high
    // levels sometimes produce IDAT signatures that classifiers flag.
    .png({ compressionLevel: 6, adaptiveFiltering: true, force: true, palette: false })
    .toBuffer();

  return new Response(output, {
    status: 200,
    headers: {
      'content-type': 'image/png',
      'content-length': String(output.length),
      'cache-control': 'no-store',
      'x-normalised-by': 'sharp',
    },
  });
}

export const config = { path: '/api/normalize-png' };
