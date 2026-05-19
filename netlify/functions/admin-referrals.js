// /api/admin/referrals
//   GET                                              -> { referrals: [...] }
//   PUT { affiliate_code, referral_id, status }       -> update one status
//
// Admin view of every sub-affiliate referral across all affiliates.
// JWT-protected (the same admin session as the rest of the dashboard),
// because referral records contain prospect names and emails.

import { requireAuth } from './_lib/auth.js';
import { getAllReferrals, updateReferralStatus } from './_lib/blob.js';
import { resp, methodNotAllowed, parseJson } from './_lib/resp.js';

const VALID_STATUS = ['submitted', 'reviewing', 'approved', 'declined'];

export default async (req) => {
  try {
    return await handle(req);
  } catch (e) {
    console.error('admin-referrals fatal:', e?.stack || e);
    return resp(500, { error: 'Server error: ' + (e?.message || 'unknown') });
  }
};

async function handle(req) {
  const session = requireAuth(req);
  if (!session) return resp(401, { error: 'Unauthorized' });

  if (req.method === 'GET') {
    const all = await getAllReferrals();
    all.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
    return resp(200, { referrals: all });
  }

  if (req.method === 'PUT') {
    const body = await parseJson(req);
    if (!body || !body.affiliate_code || !body.referral_id || !body.status) {
      return resp(400, { error: 'affiliate_code, referral_id and status are required.' });
    }
    if (!VALID_STATUS.includes(body.status)) {
      return resp(400, { error: 'Invalid status. Use one of: ' + VALID_STATUS.join(', ') });
    }
    const ok = await updateReferralStatus(body.affiliate_code, body.referral_id, body.status);
    if (!ok) return resp(404, { error: 'Referral not found.' });
    return resp(200, { ok: true });
  }

  return methodNotAllowed(['GET', 'PUT']);
}

export const config = { path: '/api/admin/referrals' };
