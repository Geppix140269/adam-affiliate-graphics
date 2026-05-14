// GET /api/data
// Public read used by the generator at runtime.
// Returns ONLY the fields the generator needs (no notes, no timestamps).
// Suspended entries are filtered out so a deactivated affiliate can't pass the gate.

const { getAffiliates, getCobranded } = require('./_lib/blob');
const { resp, methodNotAllowed } = require('./_lib/resp');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return methodNotAllowed(['GET']);

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
    console.error('public-data error:', e);
    return resp(500, { error: 'Could not load data' });
  }
};
