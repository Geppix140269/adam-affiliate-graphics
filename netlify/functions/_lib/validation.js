// Shared validators + key generation.

import crypto from 'node:crypto';

export const CODE_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
export const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
// Access keys are base64url, 16 chars from 12 bytes. ~96 bits of entropy.
export const ACCESS_KEY_RE = /^[A-Za-z0-9_-]{16,64}$/;

export function isValidCode(s) {
  return typeof s === 'string' && CODE_RE.test(s) && !s.includes('--');
}

export function isValidHex(s) {
  return typeof s === 'string' && HEX_RE.test(s);
}

export function isValidAccessKey(s) {
  return typeof s === 'string' && ACCESS_KEY_RE.test(s);
}

// 16 chars of url-safe random. ~96 bits of entropy, comfortably unguessable.
export function generateAccessKey() {
  return crypto.randomBytes(12).toString('base64url');
}

export function normaliseCode(raw) {
  return String(raw || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function trimToLen(s, max) {
  return String(s || '').trim().slice(0, max);
}
