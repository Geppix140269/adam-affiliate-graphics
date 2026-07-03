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

// Email a plain-text summary of the new referral via Resend
// (https://resend.com). Entirely optional: if RESEND_API_KEY is not set the
// notification is skipped silently — the referral itself is already
// persisted in Redis and visible in the admin dashboard either way.
// Non-fatal: a notification failure must never break the referral itself.
async function notifyByEmail(record, aff) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  try {
    const to = process.env.NOTIFY_EMAIL || 'ceo@adamftd.com';
    const from = process.env.NOTIFY_FROM || 'onboarding@resend.dev';
    const lines = [
      'New sub-affiliate referral',
      '',
      'Referring affiliate: ' + (aff.full_name || '') + ' (' + (aff.code || '') + ')',
      'Referral ID: ' + record.id,
      'Submitted at: ' + record.created_at,
      '',
      'Name: ' + (record.sub_name || ''),
      'Email: ' + (record.sub_email || ''),
      'Company: ' + (record.sub_company || ''),
      'Country: ' + (record.sub_country || ''),
      'Phone: ' + (record.sub_phone || ''),
      'Website: ' + (record.sub_website || ''),
      'Role: ' + (record.sub_role || ''),
      'Target market: ' + (record.sub_target || ''),
      'Relationship: ' + (record.sub_relationship || ''),
      '',
      'Pitch:',
      record.sub_pitch || '',
      '',
      'Notes:',
      record.notes || '',
    ];
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'authorization': 'Bearer ' + apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: 'New sub-affiliate referral — ' + (record.sub_name || 'unknown') +
                 ' via ' + (aff.code || 'unknown'),
        text: lines.join('\n'),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.warn('sub-affiliate Resend notification HTTP', res.status, detail.slice(0, 300));
    }
  } catch (e) {
    console.warn('sub-affiliate Resend notification failed (non-fatal):', e?.message || e);
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

async function handler(req) {
  try {
    return await handle(req);
  } catch (e) {
    console.error('sub-affiliate fatal:', e?.stack || e);
    return resp(500, { error: 'Server error: ' + (e?.message || 'unknown') });
  }
}

// Vercel Node.js runtime Web Handler: the `fetch` export receives the
// standard Request and handles all HTTP methods in one function.
export default { fetch: handler };

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
  await notifyByEmail(record, aff);
  return resp(200, { affiliate: aff, referral: publicReferral(record), referrals: list.map(publicReferral) });
}
