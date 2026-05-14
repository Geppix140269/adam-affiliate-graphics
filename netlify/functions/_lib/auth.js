// JWT issuance + verification for the admin session.
// Single user (Giuseppe), so we just sign a token with the secret.
//
// Env vars required:
//   ADMIN_PASSWORD    - the password Giuseppe types into /admin
//   ADMIN_JWT_SECRET  - random 32+ char string used to sign tokens
// Set both in Netlify dashboard -> Site settings -> Environment variables.

const jwt = require('jsonwebtoken');

const TOKEN_TTL_HOURS = 8;

function issueToken() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error('ADMIN_JWT_SECRET not configured');
  return jwt.sign(
    { role: 'admin', iat: Math.floor(Date.now() / 1000) },
    secret,
    { expiresIn: TOKEN_TTL_HOURS + 'h' }
  );
}

function verifyToken(token) {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret || !token) return null;
  try {
    return jwt.verify(token, secret);
  } catch (_) {
    return null;
  }
}

// Extract the bearer token from a request and verify it.
// Returns the decoded payload, or null if missing/invalid.
function requireAuth(event) {
  const headers = event.headers || {};
  const raw = headers.authorization || headers.Authorization || '';
  if (!raw.startsWith('Bearer ')) return null;
  return verifyToken(raw.slice(7));
}

module.exports = { issueToken, verifyToken, requireAuth, TOKEN_TTL_HOURS };
