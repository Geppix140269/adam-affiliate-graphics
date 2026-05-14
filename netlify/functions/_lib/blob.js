// Netlify Blobs wrapper.
//
// Two stores live under the "config" namespace:
//   - "affiliates"          : { code: { first_name, full_name, status, notes, created_at, updated_at } }
//   - "cobranded_partners"  : { code: { short_name, full_name, primary_color, logo_url, status, notes, created_at, updated_at } }
//
// On first read of an empty blob, we seed from the static data/*.json files
// shipped in the repo. This means a fresh Netlify site comes up with the
// current affiliate roster automatically.

const fs = require('fs');
const path = require('path');
const { getStore } = require('@netlify/blobs');

const STORE_NAME = 'config';
const KEY_AFFILIATES = 'affiliates';
const KEY_COBRANDED = 'cobranded_partners';

function readSeedFile(filename) {
  try {
    // Functions bundle picks up /data via the project root.
    // Path resolution is relative to the bundled function file at runtime,
    // so we try a couple of locations.
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

function nowIso() {
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

async function readBlob(key, enrich, seedFile) {
  const store = getStore(STORE_NAME);
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
  const store = getStore(STORE_NAME);
  await store.setJSON(key, data);
}

async function getAffiliates() {
  return readBlob(KEY_AFFILIATES, enrichAffiliateSeed, 'affiliates.json');
}

async function setAffiliates(data) {
  return writeBlob(KEY_AFFILIATES, data);
}

async function getCobranded() {
  return readBlob(KEY_COBRANDED, enrichCobrandedSeed, 'cobranded_partners.json');
}

async function setCobranded(data) {
  return writeBlob(KEY_COBRANDED, data);
}

module.exports = {
  getAffiliates, setAffiliates,
  getCobranded,  setCobranded,
  nowIso,
};
