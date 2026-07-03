// Persistent storage wrapper — Upstash Redis over REST. ESM.
// Drop-in replacement for the old Netlify Blobs wrapper: the exported API
// and its semantics are unchanged (seed-on-empty from data/*.json, lazy
// affiliate schema migration, per-affiliate referral lists trimmed to 300).
//
// Key scheme:
//   config:affiliates          object keyed by affiliate code
//   config:cobranded_partners  object keyed by partner code
//   config:promotions          object keyed by promotion id
//   referrals:<code>           array of referral records (newest first)
//
// Env: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN, with fallback to
// KV_REST_API_URL / KV_REST_API_TOKEN (Vercel marketplace integrations
// inject either naming depending on provider/vintage).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Redis } from '@upstash/redis';
import { generateAccessKey } from './validation.js';

const __here = path.dirname(fileURLToPath(import.meta.url));

const KEY_AFFILIATES = 'config:affiliates';
const KEY_COBRANDED = 'config:cobranded_partners';
const KEY_PROMOTIONS = 'config:promotions';
const REF_PREFIX = 'referrals:';

let _redis = null;
function redis() {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error(
      'Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL and ' +
      'UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL / KV_REST_API_TOKEN).'
    );
  }
  // automaticDeserialization (default) stores/reads values as JSON.
  _redis = new Redis({ url, token });
  return _redis;
}

function readSeedFile(filename) {
  try {
    const candidates = [
      path.join(__here, '..', '..', 'data', filename),
      path.join(process.cwd(), 'data', filename),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (_) { /* fall through */ }
  return {};
}

export function nowIso() {
  return new Date().toISOString();
}

function enrichAffiliateSeed(seed) {
  const now = nowIso();
  const out = {};
  for (const [code, entry] of Object.entries(seed || {})) {
    out[code] = {
      first_name: entry.first_name || '',
      full_name: entry.full_name || '',
      status: entry.status || 'active',
      notes: entry.notes || '',
      email: entry.email || '',
      mobile_e164: entry.mobile_e164 || '',
      wa_validated: !!entry.wa_validated,
      access_key: entry.access_key || generateAccessKey(),
      created_at: entry.created_at || now,
      updated_at: entry.updated_at || now,
    };
  }
  return out;
}

function enrichPromotionsSeed(seed) {
  const now = nowIso();
  const out = {};
  let i = 1;
  for (const [id, entry] of Object.entries(seed || {})) {
    out[id] = {
      headline: entry.headline || '',
      detail: entry.detail || '',
      enabled: entry.enabled !== false,
      order: typeof entry.order === 'number' ? entry.order : i++,
      updated_at: entry.updated_at || now,
    };
  }
  return out;
}

function enrichCobrandedSeed(seed) {
  const now = nowIso();
  const out = {};
  for (const [code, entry] of Object.entries(seed || {})) {
    out[code] = {
      short_name: entry.short_name || code.toUpperCase(),
      full_name: entry.full_name || '',
      primary_color: entry.primary_color || '#1F3A5F',
      logo_url: entry.logo_url || null,
      status: entry.status || 'active',
      notes: entry.notes || '',
      created_at: entry.created_at || now,
      updated_at: entry.updated_at || now,
    };
  }
  return out;
}

async function readKey(key, enrich, seedFile) {
  let data = null;
  try {
    data = await redis().get(key);
  } catch (_) { data = null; }

  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length === 0) {
    const seed = readSeedFile(seedFile);
    data = enrich(seed);
    try { await redis().set(key, data); } catch (_) { /* non-fatal */ }
  }
  return data;
}

async function writeKey(key, data) {
  await redis().set(key, data);
}

// Read affiliates and auto-generate access_key for any record that's
// missing one (lazy migration). Idempotent: writes back only if anything
// changed.
export async function getAffiliates() {
  const data = await readKey(KEY_AFFILIATES, enrichAffiliateSeed, 'affiliates.json');
  let mutated = false;
  for (const entry of Object.values(data)) {
    if (!entry.access_key) { entry.access_key = generateAccessKey(); mutated = true; }
    // Lazy schema migrations
    if (entry.mobile_e164 === undefined) { entry.mobile_e164 = ''; mutated = true; }
    if (entry.wa_validated === undefined) { entry.wa_validated = false; mutated = true; }
    if (entry.email === undefined) { entry.email = ''; mutated = true; }
  }
  if (mutated) {
    try { await writeKey(KEY_AFFILIATES, data); } catch (_) { /* non-fatal */ }
  }
  return data;
}

export async function setAffiliates(data) {
  return writeKey(KEY_AFFILIATES, data);
}

export async function getCobranded() {
  return readKey(KEY_COBRANDED, enrichCobrandedSeed, 'cobranded_partners.json');
}

export async function setCobranded(data) {
  return writeKey(KEY_COBRANDED, data);
}

export async function getPromotions() {
  return readKey(KEY_PROMOTIONS, enrichPromotionsSeed, 'promotions.json');
}

export async function setPromotions(data) {
  return writeKey(KEY_PROMOTIONS, data);
}

// ---------- Sub-affiliate referrals ----------
// One Redis key per referring affiliate code (referrals:<code>), each
// holding an array of referral records (newest first). No seed file.

export async function getReferrals(code) {
  let data = null;
  try {
    data = await redis().get(REF_PREFIX + String(code));
  } catch (_) { data = null; }
  return Array.isArray(data) ? data : [];
}

export async function addReferral(code, referral) {
  const list = await getReferrals(code);
  list.unshift(referral);
  // Keep the per-affiliate history bounded.
  const trimmed = list.slice(0, 300);
  await writeKey(REF_PREFIX + String(code), trimmed);
  return trimmed;
}

// Enumerate every referrals:<code> key via SCAN (cursor loop).
async function listReferralCodes() {
  const keys = [];
  try {
    let cursor = '0';
    do {
      const [next, batch] = await redis().scan(cursor, { match: REF_PREFIX + '*', count: 200 });
      cursor = String(next);
      for (const k of batch || []) keys.push(String(k));
    } while (cursor !== '0');
  } catch (_) { /* partial results acceptable */ }
  return keys.map((k) => k.slice(REF_PREFIX.length));
}

// Admin: every referral across every affiliate, flattened. Each record
// carries ma_code so the admin can see who referred it.
export async function getAllReferrals() {
  const codes = await listReferralCodes();
  const out = [];
  for (const code of codes) {
    let list = null;
    try { list = await redis().get(REF_PREFIX + code); } catch (_) { list = null; }
    if (Array.isArray(list)) {
      for (const r of list) out.push({ ...r, ma_code: r.ma_code || code });
    }
  }
  return out;
}

// Admin: update one referral's status in place.
export async function updateReferralStatus(code, id, status) {
  let list = null;
  try { list = await redis().get(REF_PREFIX + String(code)); } catch (_) { list = null; }
  if (!Array.isArray(list)) return false;
  let found = false;
  for (const r of list) {
    if (r && r.id === id) {
      r.status = status;
      r.updated_at = nowIso();
      found = true;
      break;
    }
  }
  if (found) await writeKey(REF_PREFIX + String(code), list);
  return found;
}
