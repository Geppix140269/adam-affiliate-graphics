// Response helpers for v2 Functions (Web API Response objects).

export function resp(statusCode, body, extraHeaders) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...(extraHeaders || {}),
  };
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status: statusCode,
    headers,
  });
}

export function methodNotAllowed(allowed) {
  return resp(405, { error: 'Method not allowed' }, { allow: allowed.join(', ') });
}

export async function parseJson(req) {
  try { return await req.json(); } catch (_) { return null; }
}
