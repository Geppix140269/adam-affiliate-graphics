// Netlify Blobs wrapper. ESM. Works from v2 functions where the runtime
// auto-injects the site context; falls back to explicit env-var creds.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getStore } from '@netlify/blobs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STORE_NAME = 'config';
const KEY_AFFILIATES = 'affiliates';
const KEY_COBRANDED = 'cobranded_partners';

function readSeedFile(filename) {
  try {
    const candidates = [
      path.join(__dirname, '..', '..', '..', 'data', filename),
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
      created_at: entry.created_at || now,
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

// Use explicit creds if provided as env vars (manual override path);
// otherwise rely on v2-function auto-injection.
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

export async function getAffiliates() {
  return readBlob(KEY_AFFILIATES, enrichAffiliateSeed, 'affiliates.json');
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
