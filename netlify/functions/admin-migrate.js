// /api/admin/migrate
// Body: { migration_id: string }
// Idempotent named migrations.

import { requireAuth } from './_lib/auth.js';
import { getAffiliates, setAffiliates, getCobranded, setCobranded, nowIso } from './_lib/blob.js';
import { generateAccessKey } from './_lib/validation.js';
import { resp, methodNotAllowed, parseJson } from './_lib/resp.js';

// ------ Migration: v3-roster-sync-2026-05-14 ------
// Source of truth: roster Giuseppe provided on 2026-05-14, paired with the
// brief's name updates. For existing rows the migration updates contact
// fields and names but PRESERVES access_key. For missing rows it creates
// the record (generating a new access_key for the 2 truly-new affiliates).

const ROSTER = {
  'valteo':                  { first_name: 'Katia',    full_name: 'Katia Tinto',                 email: 'katia@valteoltd.com',             mobile_e164: '+393383808040',   wa_validated: true  },
  'futuretend':              { first_name: 'Elmarie',  full_name: 'Elmarie van Noorden',         email: 'elmarie@futuretend.co.za',        mobile_e164: '+27794200879',    wa_validated: true  },
  'future-tend':             { first_name: 'Etienne',  full_name: 'Etienne Chazal',              email: 'etienne@futuretend.co.za',        mobile_e164: '+27622693792',    wa_validated: true  },
  'ramporrt':                { first_name: 'Preyan',   full_name: 'Preyan Jain',                 email: 'preyan@ramporrt.com',             mobile_e164: '+918120384007',   wa_validated: true  },
  'davidecollu':             { first_name: 'Davide',   full_name: 'Davide Collu',                email: 'd.collu69@gmail.com',             mobile_e164: '+393355647586',   wa_validated: true  },
  'isrmp-org':               { first_name: 'Ron',      full_name: 'Ron Qin Luan Gui',            email: 'admin@isrmp.org',                 mobile_e164: '+61410239623',    wa_validated: false },
  'upal-outdoors':           { first_name: 'Alex',     full_name: 'Alex Wang',                   email: '349577915@qq.com',                mobile_e164: '+8613922532177',  wa_validated: false },
  'scanmed':                 { first_name: 'Daniel',   full_name: 'Daniel Soh',                  email: 'dsoh@scanmed.com.sg',             mobile_e164: '+6596803059',     wa_validated: false },
  'sdotjhospitality':        { first_name: 'Sushant',  full_name: 'Sushant Jha',                 email: 'sushant@sdotjhospitality.com',    mobile_e164: '+919818103012',   wa_validated: false },
  'agromax-ng':              { first_name: 'AgroMax',  full_name: 'AgroMax (Real Resources)',    email: 'agromaxrealresources@outlook.com', mobile_e164: '+2348058351493', wa_validated: false },
  'buddystore-my':           { first_name: 'Vincent',  full_name: 'Vincent Cheong',              email: 'vincent@buddystore.my',           mobile_e164: '+60189037988',    wa_validated: true  },
  'sl-employers-federation': { first_name: 'Oness',    full_name: 'Oness Walker',                email: 'kobi.walker@yahoo.co.uk',         mobile_e164: '+23278240111',    wa_validated: true  },
  'groupecanal':             { first_name: 'James',    full_name: 'James Charles Baker',         email: 'ceo@groupecanal.ca',              mobile_e164: '+16132225730',    wa_validated: true  },
  'rrd-invest':              { first_name: 'Richard',  full_name: 'Richard Rana Das',            email: 'chief@rrd.investments',           mobile_e164: '+917439869623',   wa_validated: false },
  'abwci':                   { first_name: 'Srishti',  full_name: 'Srishti (ABWCI India)',       email: 'srishti@abwci.org',               mobile_e164: '+918795050014',   wa_validated: true  },
  'harryweber':              { first_name: 'Harry',    full_name: 'Harry Weber',                 email: 'harryweber7@gmail.com',           mobile_e164: '+436643380883',   wa_validated: false },
  'intishartours':           { first_name: 'Nadir',    full_name: 'Nadir Rehan',                 email: 'info@intishartours.com',          mobile_e164: '+249912443296',   wa_validated: false },
  'yellowmay':               { first_name: 'Jussi',    full_name: 'Jussi Tommola',               email: 'jussi.tommola@yellowmay.fi',      mobile_e164: '+358445357098',   wa_validated: false },
  'msmeworld':               { first_name: 'JD',       full_name: 'JD Waverley',                 email: 'office@msmeworld.org',            mobile_e164: '+447500610100',   wa_validated: true  },
  'rizwan-pk':               { first_name: 'Muhammad', full_name: 'Muhammad Rizwan',             email: 'rizwan6500983@gmail.com',         mobile_e164: '+923086500983',   wa_validated: true  },
  'tarisa':                  { first_name: 'Dipendu',  full_name: 'Dipendu Biswas',              email: 'dipendu@tarisa.tk',               mobile_e164: '+919980796314',   wa_validated: false },
  'flexcap-au':              { first_name: 'Rodney',   full_name: 'Rodney Berryman',             email: 'rod.b@flexiblecapital.com.au',    mobile_e164: '+61419375834',    wa_validated: false },
  '1402celsius':             { first_name: 'Giuseppe', full_name: 'Giuseppe Funaro',             email: 'g.funaro@1402celsius.com',        mobile_e164: '+447988540154',   wa_validated: false },
  // Phone/email pending — Giuseppe to fill in via admin once located:
  'itc2026':                 { first_name: 'Tristan',  full_name: 'Tristan Evans',               email: '',                                mobile_e164: '',                wa_validated: false },
  'aacc':                    { first_name: 'Duncan',   full_name: 'Duncan Harris',               email: '',                                mobile_e164: '',                wa_validated: false },
};

const FIELDS_TO_SYNC = ['first_name', 'full_name', 'email', 'mobile_e164', 'wa_validated'];

async function runRosterSync() {
  const data = await getAffiliates();
  const now = nowIso();

  const updated = [];
  const already_correct = [];
  const created = [];

  for (const [code, target] of Object.entries(ROSTER)) {
    const ex = data[code];
    if (!ex) {
      // Brand-new row — create with full target data and a fresh access_key.
      data[code] = {
        first_name: target.first_name,
        full_name: target.full_name,
        status: 'active',
        notes: 'Added by v3-roster-sync-2026-05-14',
        email: target.email || '',
        mobile_e164: target.mobile_e164 || '',
        wa_validated: !!target.wa_validated,
        access_key: generateAccessKey(),
        created_at: now,
        updated_at: now,
      };
      created.push({ code, full_name: target.full_name, access_key: data[code].access_key });
      continue;
    }

    // Existing row — diff each tracked field. NEVER touch access_key.
    const changes = [];
    for (const f of FIELDS_TO_SYNC) {
      if (target[f] === undefined || target[f] === '') {
        // Don't overwrite an existing value with a blank target
        if (target[f] === '' && ex[f]) continue;
        if (target[f] === undefined) continue;
      }
      const cur = f === 'wa_validated' ? !!ex[f] : (ex[f] ?? '');
      const want = f === 'wa_validated' ? !!target[f] : target[f];
      if (cur !== want) {
        ex[f] = want;
        changes.push(f);
      }
    }
    if (changes.length) {
      ex.updated_at = now;
      updated.push({ code, full_name: ex.full_name, changed: changes });
    } else {
      already_correct.push(code);
    }
  }

  await setAffiliates(data);

  // ------ Confirm abwci co-branded partner ------
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
    created,
    cobranded_abwci: cobranded_status,
    summary: {
      total_in_blob: Object.keys(data).length,
      rows_updated: updated.length,
      rows_already_correct: already_correct.length,
      rows_created: created.length,
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
