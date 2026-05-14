// /api/admin/promotions
//   GET                       -> { promotions: {...} }    full records (incl. disabled)
//   PUT  { promotions: {...} } -> overwrite all promotions
// Promotions are a small fixed set of offer cards (signup_bonus,
// first_month_discount, market_report). Admin edits headline/detail/
// enabled/order for each; the public side fetches them via validate.

import { requireAuth } from './_lib/auth.js';
import { getPromotions, setPromotions } from './_lib/blob.js';
import { trimToLen } from './_lib/validation.js';
import { resp, methodNotAllowed, parseJson } from './_lib/resp.js';

const ID_RE = /^[a-z0-9_]{2,40}$/;

function sanitiseOne(entry, fallback) {
  return {
    headline: trimToLen(entry?.headline ?? fallback?.headline, 80),
    detail:   trimToLen(entry?.detail   ?? fallback?.detail,   200),
    enabled:  entry?.enabled !== undefined ? !!entry.enabled : (fallback?.enabled !== false),
    order:    typeof entry?.order === 'number'
                ? entry.order
                : (typeof fallback?.order === 'number' ? fallback.order : 99),
    updated_at: new Date().toISOString(),
  };
}

export default async (req) => {
  try {
    return await handle(req);
  } catch (e) {
    console.error('admin-promotions fatal:', e?.stack || e);
    return resp(500, { error: 'Server error: ' + (e?.message || 'unknown') });
  }
};

async function handle(req) {
  const session = requireAuth(req);
  if (!session) return resp(401, { error: 'Unauthorized' });

  if (req.method === 'GET') {
    const data = await getPromotions();
    return resp(200, { promotions: data });
  }

  if (req.method === 'PUT') {
    const body = await parseJson(req);
    if (!body || typeof body.promotions !== 'object') {
      return resp(400, { error: 'Body must be { promotions: { id: {...} } }' });
    }
    const current = await getPromotions();
    const merged = {};
    for (const [id, entry] of Object.entries(body.promotions)) {
      if (!ID_RE.test(id)) continue; // skip bad keys silently
      merged[id] = sanitiseOne(entry, current[id]);
      if (!merged[id].headline) {
        return resp(400, { error: 'Headline is required for promotion "' + id + '".' });
      }
    }
    if (!Object.keys(merged).length) {
      return resp(400, { error: 'At least one valid promotion is required.' });
    }
    await setPromotions(merged);
    return resp(200, { promotions: merged });
  }

  return methodNotAllowed(['GET', 'PUT']);
}

export const config = { path: '/api/admin/promotions' };
