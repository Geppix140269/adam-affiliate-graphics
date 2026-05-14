// Shared validators.

export const CODE_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
export const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export function isValidCode(s) {
  return typeof s === 'string' && CODE_RE.test(s) && !s.includes('--');
}

export function isValidHex(s) {
  return typeof s === 'string' && HEX_RE.test(s);
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
