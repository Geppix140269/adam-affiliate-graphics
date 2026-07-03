// POST /api/admin/login (v2 function)
// Body: { password: string }
// Returns: { token, expiresIn } on success, 401/429/500 otherwise.

import crypto from 'node:crypto';
import { issueToken, TOKEN_TTL_HOURS } from '../_lib/auth.js';
import { checkRate } from '../_lib/ratelimit.js';
import { resp, methodNotAllowed, parseJson } from '../_lib/resp.js';

function timingSafeEq(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

async function handler(req) {
  try {
    return await handle(req);
  } catch (e) {
    console.error('admin-login fatal:', e?.stack || e);
    return resp(500, { error: 'Server error: ' + (e?.message || 'unknown') });
  }
}

// Vercel Node.js runtime Web Handler: the `fetch` export receives the
// standard Request and handles all HTTP methods in one function.
export default { fetch: handler };

async function handle(req) {
  if (req.method !== 'POST') return methodNotAllowed(['POST']);

  const rate = checkRate(req);
  if (!rate.allowed) {
    return resp(429, {
      error: 'Too many attempts. Try again in ' + Math.ceil(rate.retryAfterSeconds / 60) + ' min.',
    }, { 'retry-after': String(rate.retryAfterSeconds) });
  }

  const expected = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!expected || !secret) {
    return resp(500, {
      error: 'Server is not configured. Set ADMIN_PASSWORD and ADMIN_JWT_SECRET in Vercel env vars.',
    });
  }

  const body = await parseJson(req);
  if (!body) return resp(400, { error: 'Invalid JSON' });

  if (!timingSafeEq(body.password || '', expected)) {
    return resp(401, { error: 'Invalid password' });
  }

  const token = issueToken();
  return resp(200, { token, expiresIn: TOKEN_TTL_HOURS * 60 * 60 });
}

