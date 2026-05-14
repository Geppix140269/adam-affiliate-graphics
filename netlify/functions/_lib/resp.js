// Standard JSON response helper.

function resp(statusCode, body, extraHeaders) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(extraHeaders || {}),
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}

function methodNotAllowed(allowed) {
  return resp(405, { error: 'Method not allowed' }, { allow: allowed.join(', ') });
}

function parseJson(event) {
  try { return JSON.parse(event.body || '{}'); }
  catch (_) { return null; }
}

module.exports = { resp, methodNotAllowed, parseJson };
