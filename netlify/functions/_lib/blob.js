// Netlify Blobs wrapper. ESM. Auto-injects on Functions v2.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getStore } from '@netlify/blobs';
import { generateAccessKey } from './validation.js';

const __here = path.dirname(fileURLToPath(import.meta.url));

const STORE_NAME = 'config';
const KEY_AFFILIATES = 'affiliates';
const KEY_COBRANDED = 'cobranded_partners';
const KEY_PROMOTIONS = 'promotions';

function readSeedFile(filename) {
  try {
    const candidates = [
      path.join(__here, '..', '..', '..', 'data', filename),
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

function openStore() {
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_API_TOKEN;
  if (siteID && token) {
    return getStore({ name: STORE_NAME, siteID, token });
  }
  return getStore(STORE_NAME);
}

async function readBlob(key, enrich, seedFile) {
  const store = openStore();
  let data = null;
  try {
    data = await store.get(key, { type: 'json' });
  } catch (_) { data = null; }

  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length === 0) {
    const seed = readSeedFile(seedFile);
    data = enrich(seed);
    try { await store.setJSON(key, data); } catch (_) { /* non-fatal */ }
  }
  return data;
}

async function writeBlob(key, data) {
  const store = openStore();
  await store.setJSON(key, data);
}

// Read affiliates and auto-generate access_key for any record that's
// missing one (lazy migration). Idempotent: writes back only if anything
// changed.
export async function getAffiliates() {
  const data = await readBlob(KEY_AFFILIATES, enrichAffiliateSeed, 'affiliates.json');
  let mutated = false;
  for (const entry of Object.values(data)) {
    if (!entry.access_key) { entry.access_key = generateAccessKey(); mutated = true; }
    // Lazy schema migration for fields added in v2.3
    if (entry.mobile_e164 === undefined) { entry.mobile_e164 = ''; mutated = true; }
    if (entry.wa_validated === undefined) { entry.wa_validated = false; mutated = true; }
  }
  if (mutated) {
    try { await writeBlob(KEY_AFFILIATES, data); } catch (_) { /* non-fatal */ }
  }
  return data;
}

export async function setAffiliates(data) {
  return writeBlob(KEY_AFFILIATES, data);
}

export async function getCobranded() {
  return readBlob(KEY_COBRANDED, enrichCobrandedSeed, 'cobranded_partners.json');
}

export async function setCobranded(data) {
  return writeBlob(KEY_COBRANDED, data);
}

export async function getPromotions() {
  return readBlob(KEY_PROMOTIONS, enrichPromotionsSeed, 'promotions.json');
}

export async function setPromotions(data) {
  return writeBlob(KEY_PROMOTIONS, data);
}
