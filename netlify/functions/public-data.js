// GET /api/data (v2 function)
// Public read used by the generator. Returns sanitised view, filtering suspended entries.

import { getAffiliates, getCobranded } from './_lib/blob.js';
import { resp, methodNotAllowed } from './_lib/resp.js';

export default async (req) => {
  try {
    return await handle(req);
  } catch (e) {
    console.error('public-data fatal:', e?.stack || e);
    return resp(500, { error: 'Server error: ' + (e?.message || 'unknown') });
  }
};

async function handle(req) {
  if (req.method !== 'GET') return methodNotAllowed(['GET']);

  try {
    const [aff, cb] = await Promise.all([getAffiliates(), getCobranded()]);

    const affiliates = {};
    for (const [code, e] of Object.entries(aff)) {
      if (e.status === 'suspended') continue;
      affiliates[code] = { first_name: e.first_name, full_name: e.full_name };
    }

    const cobranded = {};
    for (const [code, e] of Object.entries(cb)) {
      if (e.status === 'suspended') continue;
      cobranded[code] = {
        short_name: e.short_name,
        full_name: e.full_name,
        primary_color: e.primary_color || '#1F3A5F',
        logo_url: e.logo_url || null,
      };
    }

    return resp(200, { affiliates, cobranded }, {
      'cache-control': 'public, max-age=5, stale-while-revalidate=30',
    });
  } catch (e) {
    console.error('public-data handler error:', e?.stack || e);
    return resp(500, { error: 'Could not load data: ' + (e?.message || 'unknown') });
  }
}

export const config = { path: '/api/data' };
