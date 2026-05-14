// Validators shared between admin endpoints.

const CODE_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

function isValidCode(s) {
  return typeof s === 'string' && CODE_RE.test(s) && !s.includes('--');
}

function isValidHex(s) {
  return typeof s === 'string' && HEX_RE.test(s);
}

function normaliseCode(raw) {
  return String(raw || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function trimToLen(s, max) {
  return String(s || '').trim().slice(0, max);
}

module.exports = { isValidCode, isValidHex, normaliseCode, trimToLen, CODE_RE, HEX_RE };
