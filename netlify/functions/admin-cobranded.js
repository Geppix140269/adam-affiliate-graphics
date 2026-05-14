// /api/admin/cobranded — CRUD on the co-branded partners blob.

const { requireAuth } = require('./_lib/auth');
const { getCobranded, setCobranded, nowIso } = require('./_lib/blob');
const { isValidCode, isValidHex, normaliseCode, trimToLen } = require('./_lib/validation');
const { resp, methodNotAllowed, parseJson } = require('./_lib/resp');

const STATUSES = new Set(['active', 'suspended']);
const DEFAULT_COLOR = '#1F3A5F';

function sanitiseFields(input, existing) {
  const short_name = trimToLen(input.short_name ?? existing?.short_name, 12);
  const full_name  = trimToLen(input.full_name  ?? existing?.full_name,  160);
  const notes      = trimToLen(input.notes      ?? existing?.notes ?? '', 1000);
  let primary_color = String(input.primary_color ?? existing?.primary_color ?? '').trim();
  if (!primary_color) primary_color = DEFAULT_COLOR;
  if (!isValidHex(primary_color)) primary_color = DEFAULT_COLOR;
  let logo_url = input.logo_url;
  if (logo_url === undefined) logo_url = existing?.logo_url ?? null;
  if (logo_url === '') logo_url = null;
  let status = String(input.status ?? existing?.status ?? 'active').toLowerCase();
  if (!STATUSES.has(status)) status = 'active';
  return { short_name, full_name, primary_color, logo_url, status, notes };
}

function validateRequired(fields) {
  if (!fields.short_name) return 'Short name is required.';
  if (fields.short_name.length > 12) return 'Short name must be 12 characters or fewer.';
  if (!fields.full_name)  return 'Full name is required.';
  return null;
}

exports.handler = async (event) => {
  const session = requireAuth(event);
  if (!session) return resp(401, { error: 'Unauthorized' });

  const method = event.httpMethod;

  try {
    if (method === 'GET') {
      const data = await getCobranded();
      return resp(200, { cobranded: data });
    }

    if (method === 'POST') {
      const body = parseJson(event);
      if (!body) return resp(400, { error: 'Invalid JSON' });
      const code = normaliseCode(body.code);
      if (!isValidCode(code)) return resp(400, { error: 'Invalid code. Use lowercase letters, digits, and hyphens.' });
      const data = await getCobranded();
      if (data[code]) return resp(409, { error: 'Code already exists. Use Edit to modify.' });
      const fields = sanitiseFields(body, null);
      const err = validateRequired(fields); if (err) return resp(400, { error: err });
      const now = nowIso();
      data[code] = { ...fields, created_at: now, updated_at: now };
      await setCobranded(data);
      return resp(201, { code, partner: data[code] });
    }

    if (method === 'PUT') {
      const body = parseJson(event);
      if (!body) return resp(400, { error: 'Invalid JSON' });
      const code = normaliseCode(body.code);
      if (!isValidCode(code)) return resp(400, { error: 'Invalid code' });
      const data = await getCobranded();
      if (!data[code]) return resp(404, { error: 'Partner not found' });
      const fields = sanitiseFields(body, data[code]);
      const err = validateRequired(fields); if (err) return resp(400, { error: err });
      data[code] = { ...data[code], ...fields, updated_at: nowIso() };
      await setCobranded(data);
      return resp(200, { code, partner: data[code] });
    }

    if (method === 'DELETE') {
      let code = null;
      const body = parseJson(event);
      if (body && body.code) code = normaliseCode(body.code);
      else if (event.queryStringParameters?.code) code = normaliseCode(event.queryStringParameters.code);
      if (!isValidCode(code)) return resp(400, { error: 'Invalid code' });
      const data = await getCobranded();
      if (!data[code]) return resp(404, { error: 'Partner not found' });
      delete data[code];
      await setCobranded(data);
      return resp(200, { deleted: code });
    }

    return methodNotAllowed(['GET', 'POST', 'PUT', 'DELETE']);
  } catch (e) {
    console.error('admin-cobranded error:', e);
    return resp(500, { error: 'Server error: ' + (e.message || 'unknown') });
  }
};
