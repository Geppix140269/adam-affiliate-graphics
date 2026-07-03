// /api/admin/affiliates (v2 function)
//   GET                                          -> { affiliates: {...} }    (full records, incl. access_key)
//   POST   { ...fields }                         -> create new (access_key auto-generated)
//   POST   { op:"bulk_csv", csv:"..." }          -> upsert from CSV
//   POST   { op:"regen_key", code:"..." }        -> rotate access_key
//   PUT    { code, ...fields }                   -> update existing
//   DELETE { code } or ?code=                    -> delete

import { requireAuth } from '../_lib/auth.js';
import { getAffiliates, setAffiliates, nowIso } from '../_lib/blob.js';
import { isValidCode, normaliseCode, trimToLen, generateAccessKey, isValidE164, normaliseE164, isValidEmail } from '../_lib/validation.js';
import { resp, methodNotAllowed, parseJson } from '../_lib/resp.js';

const STATUSES = new Set(['active', 'suspended']);

function existing(data, code, field) {
  return data[code] ? data[code][field] : undefined;
}

function sanitiseFields(input, existing) {
  const first_name = trimToLen(input.first_name ?? existing?.first_name, 80);
  const full_name  = trimToLen(input.full_name  ?? existing?.full_name,  120);
  const notes      = trimToLen(input.notes      ?? existing?.notes ?? '', 1000);
  let status = String(input.status ?? existing?.status ?? 'active').toLowerCase();
  if (!STATUSES.has(status)) status = 'active';

  // mobile_e164: optional; if provided, normalise + validate. Empty string = clear.
  let mobile_e164 = input.mobile_e164 !== undefined ? input.mobile_e164 : existing?.mobile_e164;
  if (mobile_e164 === null || mobile_e164 === undefined) mobile_e164 = '';
  mobile_e164 = String(mobile_e164).trim();
  if (mobile_e164) {
    mobile_e164 = normaliseE164(mobile_e164);
    if (!isValidE164(mobile_e164)) {
      mobile_e164 = String(input.mobile_e164 ?? existing?.mobile_e164 ?? '').trim();
      // If still invalid, blow up — caller catches via validateRequired
    }
  }

  const wa_validated = input.wa_validated !== undefined
    ? !!input.wa_validated
    : !!existing?.wa_validated;

  let email = input.email !== undefined ? input.email : existing?.email;
  if (email === null || email === undefined) email = '';
  email = String(email).trim().toLowerCase();

  return { first_name, full_name, status, notes, email, mobile_e164, wa_validated };
}

function validateRequired(fields) {
  if (!fields.first_name) return 'First name is required.';
  if (!fields.full_name)  return 'Full name is required.';
  if (fields.mobile_e164 && !isValidE164(fields.mobile_e164)) {
    return 'Mobile number must be in E.164 format, e.g. +447988540154.';
  }
  if (fields.email && !isValidEmail(fields.email)) {
    return 'Email looks invalid.';
  }
  return null;
}

// Header-aware CSV parser. Recognises columns: code, first_name, full_name,
// mobile_e164 (also accepts: phone, mobile, whatsapp). If no header is
// detected, falls back to positional: code, first_name, full_name.
function parseCsvRows(csv) {
  const rows = [];
  const lines = String(csv || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return rows;

  function splitCells(line) {
    // Naive CSV (no escaped commas inside quotes for now — keep parser small)
    return line.split(',').map(s => s.replace(/^"|"$/g, '').trim());
  }

  const headerCells = splitCells(lines[0]).map(s => s.toLowerCase());
  const hasHeader = headerCells.includes('code') ||
                    headerCells[0] === 'code' ||
                    headerCells[0] === '"code"';

  if (hasHeader) {
    const idx = (...names) => {
      for (const n of names) {
        const i = headerCells.indexOf(n);
        if (i >= 0) return i;
      }
      return -1;
    };
    const iCode      = idx('code');
    const iFirst     = idx('first_name', 'firstname', 'first');
    const iFull      = idx('full_name', 'fullname', 'name');
    const iPhone     = idx('mobile_e164', 'phone', 'mobile', 'whatsapp', 'wa');
    if (iCode < 0) return rows;
    for (let i = 1; i < lines.length; i++) {
      const cells = splitCells(lines[i]);
      const row = {
        code: cells[iCode] ?? '',
        first_name: iFirst >= 0 ? cells[iFirst] ?? '' : '',
        full_name:  iFull  >= 0 ? cells[iFull]  ?? '' : '',
      };
      if (iPhone >= 0 && cells[iPhone]) row.mobile_e164 = cells[iPhone];
      rows.push(row);
    }
    return rows;
  }

  // Positional fallback
  for (let i = 0; i < lines.length; i++) {
    const parts = splitCells(lines[i]);
    if (parts.length < 3) continue;
    rows.push({ code: parts[0], first_name: parts[1], full_name: parts[2] });
  }
  return rows;
}

async function handler(req) {
  try {
    return await handle(req);
  } catch (e) {
    console.error('admin-affiliates fatal:', e?.stack || e);
    return resp(500, { error: 'Server error: ' + (e?.message || 'unknown') });
  }
}

// Vercel Node.js runtime Web Handler: the `fetch` export receives the
// standard Request and handles all HTTP methods in one function.
export default { fetch: handler };

async function handle(req) {
  const session = requireAuth(req);
  if (!session) return resp(401, { error: 'Unauthorized' });

  const method = req.method;

  try {
    if (method === 'GET') {
      const data = await getAffiliates();
      return resp(200, { affiliates: data });
    }

    if (method === 'POST') {
      const body = await parseJson(req);
      if (!body) return resp(400, { error: 'Invalid JSON' });

      // Regenerate access key for an existing affiliate
      if (body.op === 'regen_key') {
        const code = normaliseCode(body.code);
        if (!isValidCode(code)) return resp(400, { error: 'Invalid code' });
        const data = await getAffiliates();
        if (!data[code]) return resp(404, { error: 'Affiliate not found' });
        data[code].access_key = generateAccessKey();
        data[code].updated_at = nowIso();
        await setAffiliates(data);
        return resp(200, { code, access_key: data[code].access_key });
      }

      // Bulk CSV import — generates fresh keys for new rows, preserves
      // keys on existing rows.
      if (body.op === 'bulk_csv') {
        const rows = parseCsvRows(body.csv);
        const data = await getAffiliates();
        let imported = 0, skipped = 0;
        const skippedDetail = [];
        const now = nowIso();
        for (const r of rows) {
          const code = normaliseCode(r.code);
          if (!isValidCode(code)) { skipped++; skippedDetail.push({ code: r.code, reason: 'invalid code' }); continue; }
          const fn = trimToLen(r.first_name, 80);
          const ln = trimToLen(r.full_name, 120);
          if (!fn || !ln) { skipped++; skippedDetail.push({ code, reason: 'missing name' }); continue; }
          let phone = existing(data, code, 'mobile_e164');
          if (r.mobile_e164) {
            const p = normaliseE164(r.mobile_e164);
            if (p && isValidE164(p)) phone = p;
            else { skippedDetail.push({ code, reason: 'invalid mobile_e164 (kept previous)' }); }
          }
          const ex = data[code];
          data[code] = {
            first_name: fn,
            full_name: ln,
            status: ex?.status || 'active',
            notes: ex?.notes || '',
            email: ex?.email || '',
            mobile_e164: phone || '',
            wa_validated: !!ex?.wa_validated,
            access_key: ex?.access_key || generateAccessKey(),
            created_at: ex?.created_at || now,
            updated_at: now,
          };
          imported++;
        }
        await setAffiliates(data);
        return resp(200, { imported, skipped, skippedDetail });
      }

      // Single create
      const code = normaliseCode(body.code);
      if (!isValidCode(code)) return resp(400, { error: 'Invalid code. Use lowercase letters, digits, and hyphens.' });
      const data = await getAffiliates();
      if (data[code]) return resp(409, { error: 'Code already exists. Use Edit to modify.' });
      const fields = sanitiseFields(body, null);
      const err = validateRequired(fields); if (err) return resp(400, { error: err });
      const now = nowIso();
      data[code] = { ...fields, access_key: generateAccessKey(), created_at: now, updated_at: now };
      await setAffiliates(data);
      return resp(201, { code, affiliate: data[code] });
    }

    if (method === 'PUT') {
      const body = await parseJson(req);
      if (!body) return resp(400, { error: 'Invalid JSON' });
      const code = normaliseCode(body.code);
      if (!isValidCode(code)) return resp(400, { error: 'Invalid code' });
      const data = await getAffiliates();
      if (!data[code]) return resp(404, { error: 'Affiliate not found' });
      const fields = sanitiseFields(body, data[code]);
      const err = validateRequired(fields); if (err) return resp(400, { error: err });
      // Edit never changes access_key — that's only via regen_key.
      data[code] = { ...data[code], ...fields, updated_at: nowIso() };
      await setAffiliates(data);
      return resp(200, { code, affiliate: data[code] });
    }

    if (method === 'DELETE') {
      let code = null;
      const body = await parseJson(req);
      if (body && body.code) code = normaliseCode(body.code);
      else {
        const url = new URL(req.url);
        const q = url.searchParams.get('code');
        if (q) code = normaliseCode(q);
      }
      if (!isValidCode(code)) return resp(400, { error: 'Invalid code' });
      const data = await getAffiliates();
      if (!data[code]) return resp(404, { error: 'Affiliate not found' });
      delete data[code];
      await setAffiliates(data);
      return resp(200, { deleted: code });
    }

    return methodNotAllowed(['GET', 'POST', 'PUT', 'DELETE']);
  } catch (e) {
    console.error('admin-affiliates handler error:', e?.stack || e);
    return resp(500, { error: 'Server error: ' + (e?.message || 'unknown') });
  }
}

