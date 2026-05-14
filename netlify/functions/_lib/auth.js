// JWT issuance + verification for the admin session.
// ESM module (project has "type": "module").

import jwt from 'jsonwebtoken';

export const TOKEN_TTL_HOURS = 8;

export function issueToken() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error('ADMIN_JWT_SECRET not configured');
  return jwt.sign(
    { role: 'admin', iat: Math.floor(Date.now() / 1000) },
    secret,
    { expiresIn: TOKEN_TTL_HOURS + 'h' }
  );
}

export function verifyToken(token) {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret || !token) return null;
  try { return jwt.verify(token, secret); } catch (_) { return null; }
}

// Extract bearer token from a v2-function Request and verify it.
// Returns the decoded payload, or null if missing/invalid.
export function requireAuth(req) {
  const raw = req.headers.get('authorization') || '';
  if (!raw.startsWith('Bearer ')) return null;
  return verifyToken(raw.slice(7));
}
