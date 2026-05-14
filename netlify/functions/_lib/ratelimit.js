// Simple in-memory rate limiter for the login endpoint.
//
// Netlify keeps functions warm between invocations, so an in-memory Map
// works for short windows. If the container cycles, the counter resets —
// that's an acceptable tradeoff for a single-user admin endpoint.

const buckets = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

function clientIp(event) {
  const h = event.headers || {};
  const fwd = h['x-forwarded-for'] || h['X-Forwarded-For'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return h['client-ip'] || h['Client-Ip'] || 'unknown';
}

// Returns { allowed: boolean, retryAfterSeconds: number }.
function checkRate(event) {
  const ip = clientIp(event);
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

module.exports = { checkRate, MAX_ATTEMPTS, WINDOW_MS };
