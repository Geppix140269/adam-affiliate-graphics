// POST /api/admin/login
// Body: { password: string }
// Returns: { token, expiresIn } on success, 401/429/500 otherwise.

const crypto = require('crypto');
const { issueToken, TOKEN_TTL_HOURS } = require('./_lib/auth');
const { checkRate } = require('./_lib/ratelimit');
const { resp, methodNotAllowed, parseJson } = require('./_lib/resp');

function timingSafeEq(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return methodNotAllowed(['POST']);

  // Rate limit
  const rate = checkRate(event);
  if (!rate.allowed) {
    return resp(429, {
      error: 'Too many attempts. Try again in ' + Math.ceil(rate.retryAfterSeconds / 60) + ' min.',
    }, { 'retry-after': String(rate.retryAfterSeconds) });
  }

  // Env-var checks (fail loud)
  const expected = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!expected || !secret) {
    return resp(500, {
      error: 'Server is not configured. Set ADMIN_PASSWORD and ADMIN_JWT_SECRET in Netlify env vars.',
    });
  }

  const body = parseJson(event);
  if (!body) return resp(400, { error: 'Invalid JSON' });

  if (!timingSafeEq(body.password || '', expected)) {
    return resp(401, { error: 'Invalid password' });
  }

  try {
    const token = issueToken();
    return resp(200, { token, expiresIn: TOKEN_TTL_HOURS * 60 * 60 });
  } catch (e) {
    return resp(500, { error: 'Could not issue token: ' + e.message });
  }
};
