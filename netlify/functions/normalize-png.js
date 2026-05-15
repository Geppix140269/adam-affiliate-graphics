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

  const output = await sharp(inputBuffer, { failOn: 'none' })
    // Normalise pipeline colour space to sRGB and embed the standard
    // sRGB ICC profile in the output PNG. This is the metadata Windows
    // Snipping Tool / Photoshop / Photos write that browsers don't.
    .toColorspace('srgb')
    .withMetadata({ icc: 'srgb' })
    // Force re-encode via libpng with high compression (smaller file,
    // standard chunk layout).
    .png({ compressionLevel: 9, adaptiveFiltering: false, force: true })
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
