// /api/admin/migrate
// Body: { migration_id: string }
// Applies a named, idempotent data migration. Safe to call repeatedly.
//
// Supported migrations:
//   "v3-roster-sync-2026-05-14"
//     - Updates full_name for 14 affiliates per Giuseppe's brief
//     - Creates 5 affiliates if missing: itc2026, valteo, aacc,
//       futuretend-elmarie, abwci (preserving any pre-existing access_keys)
//     - Confirms abwci co-branded partner exists and is active
//     - Returns access_keys + a summary

import { requireAuth } from './_lib/auth.js';
import { getAffiliates, setAffiliates, getCobranded, setCobranded, nowIso } from './_lib/blob.js';
import { generateAccessKey } from './_lib/validation.js';
import { resp, methodNotAllowed, parseJson } from './_lib/resp.js';

// ------ Migration: v3-roster-sync-2026-05-14 ------

const NAME_UPDATES = {
  'isrmp-org':               { first_name: 'Ron',       full_name: 'Ron Qin Luan Gui' },
  'upal-outdoors':           { first_name: 'Alex',      full_name: 'Alex Wang' },
  'scanmed':                 { first_name: 'Daniel',    full_name: 'Daniel Soh' },
  'sdotjhospitality':        { first_name: 'Sushant',   full_name: 'Sushant Jha' },
  'agromax-ng':              { first_name: 'AgroMax',   full_name: 'AgroMax (Real Resources)' },
  'buddystore-my':           { first_name: 'Vincent',   full_name: 'Vincent Cheong' },
  'sl-employers-federation': { first_name: 'Oness',     full_name: 'Oness Walker' },
  'groupecanal':             { first_name: 'James',     full_name: 'James Charles Baker' },
  'rrd-invest':              { first_name: 'Richard',   full_name: 'Richard Rana Das' },
  'future-tend':             { first_name: 'Etienne',   full_name: 'Etienne' },
  'intishartours':           { first_name: 'Nadir',     full_name: 'Nadir Rehan' },
  'yellowmay':               { first_name: 'Jussi',     full_name: 'Jussi Tommola' },
  'msmeworld':               { first_name: 'JD',        full_name: 'JD Waverley' },
  'flexcap-au':              { first_name: 'Rodney',    full_name: 'Rodney Berryman' },
  'ramporrt':                { first_name: 'Preyan',    full_name: 'Preyan Jain' },
};

const ADD_IF_MISSING = {
  'itc2026':            { first_name: 'Tristan',  full_name: 'Tristan Evans' },
  'valteo':             { first_name: 'Katia',    full_name: 'Katia Tinto' },
  'aacc':               { first_name: 'Duncan',   full_name: 'Duncan Harris' },
  'futuretend-elmarie': { first_name: 'Elmarie',  full_name: 'Elmarie van Noorden' },
  'abwci':              { first_name: 'Srishti',  full_name: 'Srishti (ABWCI India)' },
};

async function runRosterSync() {
  const data = await getAffiliates();
  const now = nowIso();

  const updated = [];
  const already_correct = [];
  const missing_codes = [];
  for (const [code, target] of Object.entries(NAME_UPDATES)) {
    const row = data[code];
    if (!row) { missing_codes.push(code); continue; }
    if (row.full_name === target.full_name && row.first_name === target.first_name) {
      already_correct.push(code);
      continue;
    }
    row.first_name = target.first_name;
    row.full_name = target.full_name;
    row.updated_at = now;
    updated.push({ code, full_name: target.full_name });
  }

  const created = [];
  const already_existed = [];
  for (const [code, target] of Object.entries(ADD_IF_MISSING)) {
    if (data[code]) {
      already_existed.push({ code, full_name: data[code].full_name });
      continue;
    }
    data[code] = {
      first_name: target.first_name,
      full_name: target.full_name,
      status: 'active',
      notes: 'Added by v3-roster-sync-2026-05-14',
      mobile_e164: '',
      wa_validated: false,
      access_key: generateAccessKey(),
      created_at: now,
      updated_at: now,
    };
    created.push({ code, access_key: data[code].access_key });
  }

  await setAffiliates(data);

  // Confirm abwci co-branded exists and is active
  const cb = await getCobranded();
  let cobranded_status = 'unchanged';
  if (!cb.abwci) {
    cb.abwci = {
      short_name: 'ABWCI',
      full_name: 'Association of Business Women in Commerce and Industry',
      primary_color: '#1F3A5F',
      logo_url: null,
      status: 'active',
      notes: 'Confirmed by v3-roster-sync-2026-05-14',
      created_at: now,
      updated_at: now,
    };
    cobranded_status = 'created';
    await setCobranded(cb);
  } else if (cb.abwci.status === 'suspended') {
    cb.abwci.status = 'active';
    cb.abwci.updated_at = now;
    cobranded_status = 'reactivated';
    await setCobranded(cb);
  } else {
    cobranded_status = 'already_active';
  }

  return {
    migration_id: 'v3-roster-sync-2026-05-14',
    name_updates_applied: updated,
    already_correct,
    missing_codes,
    created,
    already_existed,
    cobranded_abwci: cobranded_status,
    summary: {
      total_in_blob: Object.keys(data).length,
      names_changed: updated.length,
      names_already_correct: already_correct.length,
      names_missing_from_blob: missing_codes.length,
      affiliates_created: created.length,
      affiliates_already_existed: already_existed.length,
    },
  };
}

const MIGRATIONS = {
  'v3-roster-sync-2026-05-14': runRosterSync,
};

export default async (req) => {
  try {
    return await handle(req);
  } catch (e) {
    console.error('admin-migrate fatal:', e?.stack || e);
    return resp(500, { error: 'Server error: ' + (e?.message || 'unknown') });
  }
};

async function handle(req) {
  const session = requireAuth(req);
  if (!session) return resp(401, { error: 'Unauthorized' });
  if (req.method !== 'POST') return methodNotAllowed(['POST']);

  const body = await parseJson(req);
  const id = body?.migration_id;
  if (!id) return resp(400, { error: 'migration_id is required' });

  const fn = MIGRATIONS[id];
  if (!fn) return resp(404, { error: 'Unknown migration: ' + id });

  const result = await fn();
  return resp(200, result);
}

export const config = { path: '/api/admin/migrate' };
