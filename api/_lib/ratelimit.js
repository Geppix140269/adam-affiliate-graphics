// Simple in-memory rate limiter for the login endpoint.
// Container-local: cycles reset it, which is acceptable for one-admin use.

const buckets = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function clientIp(req) {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.headers.get('client-ip') || 'unknown';
}

export function checkRate(req) {
  const ip = clientIp(req);
  const now = Date.now();
  const bucket = (buckets.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (bucket.length >= MAX_ATTEMPTS) {
    const oldest = Math.min(...bucket);
    const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
    return { allowed: false, retryAfterSeconds };
  }
  bucket.push(now);
  buckets.set(ip, bucket);
  return { allowed: true, retryAfterSeconds: 0 };
}

export { MAX_ATTEMPTS, WINDOW_MS };
