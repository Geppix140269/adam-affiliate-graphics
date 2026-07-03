// POST /api/sub-affiliate
// Body: { action: 'list' | 'create', key: <affiliate access key>, referral?: {...} }
//
// The referring affiliate is identified server-side from their access key
// (the same credential the Kit gate validates), so the affiliate code on
// every referral is trustworthy and cannot be spoofed by the client.
//
//  - action 'list':   returns the referrals submitted by this affiliate.
//  - action 'create': stores a new sub-affiliate referral under this
//                     affiliate and returns the updated list.

import { getAffiliates, getReferrals, addReferral, nowIso } from './_lib/blob.js';
import { resp, methodNotAllowed, parseJson } from './_lib/resp.js';

// Per-IP rate limit: 40 requests / 60s.
const ATTEMPTS = new Map();
const WINDOW_MS = 60 * 1000;
const MAX = 40;

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

function clean(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function looksLikeEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function siteOrigin() {
  return process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.DEPLOY_URL ||
         'https://adamftd-affiliates.netlify.app';
}

// Mirror the new referral into the Netlify Forms "sub-affiliate-referral"
// form so a submission email can fire to ceo@adamftd.com. The form itself
// is declared statically in /__forms.html for build-time detection.
// Non-fatal: a notification failure must never break the referral itself.
async function notifyByForm(record, aff) {
  try {
    const params = new URLSearchParams();
    params.set('form-name', 'sub-affiliate-referral');
    params.set('ma_code', aff.code || '');
    params.set('ma_name', aff.full_name || '');
    params.set('referral_id', record.id);
    params.set('submitted_at', record.created_at);
    for (const k of ['sub_name', 'sub_email', 'sub_company', 'sub_country', 'sub_phone',
                      'sub_website', 'sub_role', 'sub_target', 'sub_pitch',
                      'sub_relationship', 'notes']) {
      params.set(k, record[k] || '');
    }
    const res = await fetch(siteOrigin() + '/', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    if (!res.ok) console.warn('sub-affiliate form notification HTTP', res.status);
  } catch (e) {
    console.warn('sub-affiliate form notification failed (non-fatal):', e?.message || e);
  }
}

async function resolveAffiliate(key) {
  const affiliates = await getAffiliates();
  for (const [code, entry] of Object.entries(affiliates)) {
    if (entry.status === 'suspended') continue;
    if (entry.access_key && entry.access_key === key) {
      return { code, first_name: entry.first_name || '', full_name: entry.full_name || '' };
    }
  }
  return null;
}

// Strip internal fields the client does not need to see.
function publicReferral(r) {
  return {
    id: r.id,
    created_at: r.created_at,
    status: r.status || 'submitted',
    sub_name: r.sub_name || '',
    sub_company: r.sub_company || '',
    sub_email: r.sub_email || '',
    sub_country: r.sub_country || '',
    sub_target: r.sub_target || '',
    sub_relationship: r.sub_relationship || '',
  };
}

export default async (req) => {
  try {
    return await handle(req);
  } catch (e) {
    console.error('sub-affiliate fatal:', e?.stack || e);
    return resp(500, { error: 'Server error: ' + (e?.message || 'unknown') });
  }
};

async function handle(req) {
  if (req.method !== 'POST') return methodNotAllowed(['POST']);

  if (!checkRate(req)) {
    return resp(429, { error: 'Too many requests. Slow down for a minute.' });
  }

  const body = await parseJson(req);
  if (!body) return resp(400, { error: 'Invalid request body.' });

  const key = clean(body.key, 200);
  if (!key) return resp(400, { error: 'Access key required.' });

  const aff = await resolveAffiliate(key);
  if (!aff) return resp(404, { error: "That access key isn't recognised." });

  const action = body.action === 'create' ? 'create' : 'list';

  if (action === 'list') {
    const list = await getReferrals(aff.code);
    return resp(200, { affiliate: aff, referrals: list.map(publicReferral) });
  }

  // ---- create ----
  const r = body.referral || {};
  const referral = {
    sub_name:         clean(r.sub_name, 160),
    sub_email:        clean(r.sub_email, 160),
    sub_company:      clean(r.sub_company, 200),
    sub_country:      clean(r.sub_country, 120),
    sub_phone:        clean(r.sub_phone, 60),
    sub_website:      clean(r.sub_website, 300),
    sub_role:         clean(r.sub_role, 160),
    sub_target:       clean(r.sub_target, 300),
    sub_pitch:        clean(r.sub_pitch, 2000),
    sub_relationship: clean(r.sub_relationship, 60),
    notes:            clean(r.notes, 2000),
  };

  const missing = ['sub_name', 'sub_email', 'sub_company', 'sub_country', 'sub_target', 'sub_pitch']
    .filter((f) => !referral[f]);
  if (missing.length) {
    return resp(400, { error: 'Please complete all required fields.', missing });
  }
  if (!looksLikeEmail(referral.sub_email)) {
    return resp(400, { error: 'The sub-affiliate email does not look valid.' });
  }

  const record = {
    id: (globalThis.crypto && globalThis.crypto.randomUUID)
      ? globalThis.crypto.randomUUID()
      : 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10),
    created_at: nowIso(),
    status: 'submitted',
    ma_code: aff.code,
    ma_name: aff.full_name,
    ...referral,
  };

  const list = await addReferral(aff.code, record);
  await notifyByForm(record, aff);
  return resp(200, { affiliate: aff, referral: publicReferral(record), referrals: list.map(publicReferral) });
}

export const config = { path: '/api/sub-affiliate' };
