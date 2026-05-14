// /api/admin/affiliates (v2 function)
//   GET                                          -> { affiliates: {...} }    (full records, incl. access_key)
//   POST   { ...fields }                         -> create new (access_key auto-generated)
//   POST   { op:"bulk_csv", csv:"..." }          -> upsert from CSV
//   POST   { op:"regen_key", code:"..." }        -> rotate access_key
//   PUT    { code, ...fields }                   -> update existing
//   DELETE { code } or ?code=                    -> delete

import { requireAuth } from './_lib/auth.js';
import { getAffiliates, setAffiliates, nowIso } from './_lib/blob.js';
import { isValidCode, normaliseCode, trimToLen, generateAccessKey } from './_lib/validation.js';
import { resp, methodNotAllowed, parseJson } from './_lib/resp.js';

const STATUSES = new Set(['active', 'suspended']);

function sanitiseFields(input, existing) {
  const first_name = trimToLen(input.first_name ?? existing?.first_name, 80);
  const full_name  = trimToLen(input.full_name  ?? existing?.full_name,  120);
  const notes      = trimToLen(input.notes      ?? existing?.notes ?? '', 1000);
  let status = String(input.status ?? existing?.status ?? 'active').toLowerCase();
  if (!STATUSES.has(status)) status = 'active';
  return { first_name, full_name, status, notes };
}

function validateRequired(fields) {
  if (!fields.first_name) return 'First name is required.';
  if (!fields.full_name)  return 'Full name is required.';
  return null;
}

function parseCsvRows(csv) {
  const rows = [];
  const lines = String(csv || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return rows;
  let start = 0;
  const first = lines[0].toLowerCase();
  if (first.startsWith('code,') || first.startsWith('"code"')) start = 1;
  for (let i = start; i < lines.length; i++) {
    const parts = lines[i].split(',').map(s => s.replace(/^"|"$/g, '').trim());
    if (parts.length < 3) continue;
    rows.push({ code: parts[0], first_name: parts[1], full_name: parts[2] });
  }
  return rows;
}

export default async (req) => {
  try {
    return await handle(req);
  } catch (e) {
    console.error('admin-affiliates fatal:', e?.stack || e);
    return resp(500, { error: 'Server error: ' + (e?.message || 'unknown') });
  }
};

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
          const existing = data[code];
          data[code] = {
            first_name: fn,
            full_name: ln,
            status: existing?.status || 'active',
            notes: existing?.notes || '',
            access_key: existing?.access_key || generateAccessKey(),
            created_at: existing?.created_at || now,
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

export const config = { path: '/api/admin/affiliates' };
