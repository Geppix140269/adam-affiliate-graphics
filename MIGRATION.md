# Netlify → Vercel migration (July 2026)

The Partner Kit moved from Netlify to Vercel. Same static site, same 11 API
endpoints at the same URLs. This file covers what changed and what to set up.

## What changed

| Area | Before (Netlify) | After (Vercel) |
|---|---|---|
| Functions | `netlify/functions/*.js` (v2, `export const config = { path }`) | `api/**/*.js` file-based routing, same `/api/...` URLs, no rewrites needed |
| Handler style | Web API `(Request) => Response` | Unchanged bodies, exported as `export default { fetch: handler }` |
| Storage | Netlify Blobs (`config` + `sub_affiliate_referrals` stores) | Upstash Redis over REST. Keys: `config:affiliates`, `config:cobranded_partners`, `config:promotions`, `referrals:<code>` |
| Referral email to ceo@adamftd.com | Netlify Forms (deleted `__forms.html`) | Resend API, optional — skipped silently if `RESEND_API_KEY` is unset; the referral is persisted either way |
| Site origin in functions | `URL` / `DEPLOY_URL` env | Derived from the incoming request URL; falls back to `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL`, then `https://kit.adamftd.com` |
| Deploy config | `netlify.toml` | `vercel.json` (rewrites `/admin`, `/admin/*`, `/render`; same cache headers; `X-Robots-Tag: noindex` on `/admin*`; 60s + 3009 MB for the two Chromium functions) |
| Runtime | Netlify Functions | Node 22.x (`engines` in package.json) |

Deleted: `netlify.toml`, `netlify/`, `__forms.html`. Dependency swap:
`@netlify/blobs` → `@upstash/redis`. Everything else pinned as before.

## Vercel project setup (one-time)

1. **Import the repo** at https://vercel.com/new — framework preset **Other**,
   no build command, no output directory (`vercel.json` handles everything).
2. **Storage**: install the **Upstash Redis** integration from the Vercel
   Marketplace (Storage tab → Create database → Upstash for Redis) and link it
   to this project. That auto-injects the Redis env vars (either
   `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` or
   `KV_REST_API_URL`/`KV_REST_API_TOKEN` — the code accepts both namings).
3. **Environment variables** (Settings → Environment Variables):

   | Variable | Required | Purpose |
   |---|---|---|
   | `ADMIN_PASSWORD` | yes | Password for /admin |
   | `ADMIN_JWT_SECRET` | yes | Random 32+ chars, signs admin session tokens |
   | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | yes (auto-injected by the integration) | Storage |
   | `RESEND_API_KEY` | optional | Enables referral notification emails via Resend |
   | `NOTIFY_EMAIL` | optional | Referral notification recipient (default `ceo@adamftd.com`) |
   | `NOTIFY_FROM` | optional | Sender (default `onboarding@resend.dev`; use a verified domain sender in production) |

4. **Domain**: Settings → Domains → add `kit.adamftd.com`, point Cloudflare
   `CNAME kit → cname.vercel-dns.com` (DNS only / grey cloud).
5. Redeploy after saving env vars.

## Data: what survived, what didn't

Live Netlify Blobs data (affiliate access keys rotated since 14 May, any
promotions edits, all sub-affiliate referrals) was **not exported** before the
Netlify site went away. On first request against an empty Redis, the store
re-seeds from `data/*.json` — the committed 14 May state: **20 affiliates**
(with freshly generated access keys), 2 co-branded partners, 3 promotions.

After the first deploy:
- run the admin **migrate** action `v3-roster-sync-2026-05-14` (Admin → tools)
  to restore the verified roster contact details, or re-add newer affiliates
  manually;
- every affiliate gets a **new access key** — re-send kit links to active
  partners;
- the referrals list starts empty.

## Watch-outs

- `api/render-cover.js` and `api/demo-pdf.js` run headless Chromium
  (`@sparticuz/chromium` 131) — first invocation is slow (cold start +
  browser unpack). `memory: 3009` in vercel.json needs a plan that allows it;
  Vercel silently clamps otherwise.
- Those two functions fetch the site's own `/render` / `/demo-pocket-script.html`
  pages. If **Deployment Protection** (Vercel Authentication) is enabled for
  the environment, that self-fetch gets blocked — leave protection off for
  production or add a protection bypass.
- Login rate-limiting is per-instance in-memory (same as on Netlify): resets
  on cold starts, fine for a one-admin site.
