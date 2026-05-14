// POST /api/validate
// Body: { key: string }
// Returns: { affiliate, cobranded } on hit, 404 on miss.
//
// Replaces the old /api/data endpoint. The full affiliate list is no longer
// exposed to the public — only the entry whose access_key matches the
// submitted key. Access keys are ~96 bits of entropy so brute force is
// infeasible; a light rate limit deters abuse.

import { getAffiliates, getCobranded, getPromotions } from './_lib/blob.js';
import { resp, methodNotAllowed, parseJson } from './_lib/resp.js';

// Simple per-IP rate limit: 30 attempts / 60s. Keys are unguessable so
// the only purpose here is to prevent abuse, not real brute-force defence.
const ATTEMPTS = new Map();
const WINDOW_MS = 60 * 1000;
const MAX = 30;

function clientIp(req) {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.headers.get('client-ip') || 'unknown';
}

function checkRate(req) {
  const ip = clientIp(req);
  const now = Date.now();
  const bucket = (ATTEMPTS.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (bucket.length >= MAX) return false;
  bucket.push(now);
  ATTEMPTS.set(ip, bucket);
  return true;
}

export default async (req) => {
  try {
    return await handle(req);
  } catch (e) {
    console.error('public-validate fatal:', e?.stack || e);
    return resp(500, { error: 'Server error: ' + (e?.message || 'unknown') });
  }
};

async function handle(req) {
  if (req.method !== 'POST') return methodNotAllowed(['POST']);

  if (!checkRate(req)) {
    return resp(429, { error: 'Too many attempts. Slow down for a minute.' });
  }

  const body = await parseJson(req);
  if (!body || !body.key) return resp(400, { error: 'Access key required.' });

  const key = String(body.key).trim();
  if (!key) return resp(400, { error: 'Access key required.' });

  const [affiliates, cobranded, promotions] = await Promise.all([
    getAffiliates(), getCobranded(), getPromotions(),
  ]);

  let match = null;
  for (const [code, entry] of Object.entries(affiliates)) {
    if (entry.status === 'suspended') continue;
    if (entry.access_key === key) {
      match = { code, first_name: entry.first_name, full_name: entry.full_name };
      break;
    }
  }
  if (!match) {
    return resp(404, { error: "That access key isn't recognised." });
  }

  const cb = cobranded[match.code];
  const cobrandedOut = cb && cb.status !== 'suspended' ? {
    short_name: cb.short_name,
    full_name: cb.full_name,
    primary_color: cb.primary_color || '#1F3A5F',
    logo_url: cb.logo_url || null,
  } : null;

  // Promotions: only enabled ones, sorted by `order`, stripped of timestamps.
  const promoList = Object.entries(promotions || {})
    .filter(([, p]) => p && p.enabled !== false && p.headline)
    .map(([id, p]) => ({ id, headline: p.headline, detail: p.detail || '', order: p.order ?? 99 }))
    .sort((a, b) => a.order - b.order)
    .map(({ id, headline, detail }) => ({ id, headline, detail }));

  return resp(200, { affiliate: match, cobranded: cobrandedOut, promotions: promoList });
}

export const config = { path: '/api/validate' };
