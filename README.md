# ADAMftd Partner Kit

Self-service marketing-asset generator + admin dashboard for the ADAMftd Affiliate Programme.

**Public site:** https://kit.adamftd.com (planned)
**Admin:** https://kit.adamftd.com/admin
**Repo:** `C:\Development\adam-affiliate-graphics`

## What it does

### Public side (kit.adamftd.com)
An affiliate enters their code on a landing screen. The site validates the code against the live whitelist (Netlify Blobs, seeded from `data/affiliates.json` on first boot). If valid, 15 personalised marketing graphics render at their exact deliverable dimensions, with light/dark toggle, a hero-headline dropdown of pre-approved positioning lines, a per-asset Download PNG, and a single Download all (ZIP).

### Co-branded mode (institutional partners only)
If the affiliate's code also appears in the co-branded partners whitelist, a Co-brand toggle becomes visible next to Light/Dark. When toggled on, a setup strip appears (partner logo upload, short-name override, custom hero text) and all 15 templates re-render with an ADAMftd × Partner dual-lockup. Standard affiliates never see this toggle.

### Admin dashboard (kit.adamftd.com/admin)
Password-protected dashboard for Giuseppe to manage both whitelists in the browser:
- **Affiliates tab** — add / edit / delete affiliates, search, bulk CSV import, status (active / suspended)
- **Co-Branded Partners tab** — same CRUD for institutional partners (code, short name, full name, primary colour, logo URL, status, notes)

Changes propagate to the public site within ~5 seconds (the public read endpoint uses `cache-control: max-age=5`).

## Project layout

```
.
├── index.html                      Generator entry
├── admin.html                      Admin entry (served at /admin)
├── netlify.toml                    Static + functions deploy config + API rewrites
├── package.json                    Dependencies for Functions (@netlify/blobs, jsonwebtoken)
├── css/
│   ├── styles.css                  Generator styles + co-brand strip
│   └── admin.css                   Admin dashboard styles
├── js/
│   ├── templates.jsx               15 artboards (with co-brand support)
│   ├── app.jsx                     Generator shell (fetches from /api/data)
│   └── admin.jsx                   Admin dashboard
├── data/
│   ├── affiliates.json             Seed for first boot
│   └── cobranded_partners.json     Seed for first boot
├── netlify/
│   └── functions/
│       ├── admin-login.js          POST  /api/admin/login
│       ├── admin-affiliates.js     CRUD  /api/admin/affiliates  (+ CSV bulk)
│       ├── admin-cobranded.js      CRUD  /api/admin/cobranded
│       ├── public-data.js          GET   /api/data
│       └── _lib/
│           ├── auth.js             JWT issue/verify
│           ├── blob.js             Netlify Blobs wrapper + seed-on-empty
│           ├── ratelimit.js        5 attempts / 15 min on login
│           ├── validation.js       Code + hex validators
│           └── resp.js             JSON response helpers
└── assets/
    └── adamftd-affiliate-lockup.png
```

## One-time deploy (after the GitHub push)

### 1. Push to GitHub
```bash
cd C:\Development\adam-affiliate-graphics
git remote add origin https://github.com/<YOUR-ORG>/adam-affiliate-graphics.git
git push -u origin main
```

### 2. Connect Netlify to the repo
- https://app.netlify.com/start → Import from Git → GitHub → pick the repo
- Build settings: leave everything blank (the `netlify.toml` handles it)
- Click Deploy

### 3. Set environment variables (REQUIRED — admin won't work without these)
In Netlify → Site configuration → Environment variables → Add:

| Variable | Value |
|---|---|
| `ADMIN_PASSWORD` | A strong password you'll type into /admin. **Use a password manager. 20+ chars.** |
| `ADMIN_JWT_SECRET` | A random 32+ character string. Used to sign session tokens. You never see it again — generate once and forget. |

Generate the JWT secret on Windows with PowerShell:
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
```

After saving env vars, **redeploy** (Site → Deploys → Trigger deploy → Deploy site) so the Functions pick them up.

### 4. Custom domain (kit.adamftd.com)
- Cloudflare DNS → add `CNAME kit → <your-netlify-site>.netlify.app` (DNS only / grey cloud)
- Netlify → Domain management → Add `kit.adamftd.com` → set as primary domain
- Wait ~5 min for Let's Encrypt to provision HTTPS

## Local development

Functions need Netlify CLI; static-only preview works with plain Python.

### Static-only (generator + admin UI shell, no Functions)
```bash
cd C:\Development\adam-affiliate-graphics
python -m http.server 8765
# generator: http://localhost:8765/
# admin shell (login will fail without functions): http://localhost:8765/admin.html
```
The generator falls back to reading `data/*.json` directly when `/api/data` 404s, so the public side works offline. The admin needs Functions.

### Full local with Functions (Netlify CLI)
```bash
npm install -g netlify-cli   # one-time
cd C:\Development\adam-affiliate-graphics
npm install
netlify dev
# everything on http://localhost:8888
```
For local Functions to work you must put `ADMIN_PASSWORD` + `ADMIN_JWT_SECRET` in a `.env` file in the repo root (the `.gitignore` already excludes it).

## Daily operations

### Add a new affiliate
1. Go to `https://kit.adamftd.com/admin`
2. Sign in
3. **Add affiliate** → enter code, first name, full name → Save
4. Code is live in the generator within seconds.

### Bulk-import 18 affiliates at once
Bulk CSV import on the Affiliates tab. Paste rows like:
```
code,first_name,full_name
davidecollu,Davide,Davide Collu
isrmp-org,Ron,Ron Mathews
```
Existing codes are updated, new ones are added. Invalid rows are skipped with a count.

### Suspend an affiliate temporarily
Edit → Status: Suspended → Save. The code stops working in the gate but stays in the table for re-activation later.

### Add a co-branded partner
Co-Branded Partners tab → Add partner → enter code, short name, full name, primary brand colour → Save. The partner can now toggle Co-brand mode when they enter their code in the gate.

## API surface (admin-only)

All `/api/admin/*` writes require `Authorization: Bearer <token>` from `/api/admin/login`.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/admin/login` | POST | `{ password }` → `{ token, expiresIn }`. Rate-limited 5/15min/IP. |
| `/api/admin/affiliates` | GET | List all affiliates (full records) |
| `/api/admin/affiliates` | POST | `{ code, first_name, full_name, status?, notes? }` create new |
| `/api/admin/affiliates` | POST | `{ op: "bulk_csv", csv: "..." }` bulk upsert |
| `/api/admin/affiliates` | PUT | `{ code, ...fields }` update existing |
| `/api/admin/affiliates` | DELETE | `{ code }` or `?code=` delete |
| `/api/admin/cobranded` | GET | List all co-branded partners |
| `/api/admin/cobranded` | POST | `{ code, short_name, full_name, primary_color, logo_url?, status?, notes? }` |
| `/api/admin/cobranded` | PUT | update existing |
| `/api/admin/cobranded` | DELETE | delete |
| `/api/data` | GET | **Public.** Sanitised view of both whitelists for the generator. Excludes suspended entries. |

## Brand rules (do not violate)

| Rule | Why |
|---|---|
| Use the lockup file. Never typeset "ADAMftd" as plain text. | Brand integrity. |
| No em-dashes (—) in copy or graphics. | Brand style. |
| No platform-savings figures ("$X saved"). | Banned. |
| No "search bar" framing. ADAMftd is a conversational AI. | Positioning. |
| Codes are LOWERCASE in URLs (`davidecollu`), UPPERCASE in display only (`USE CODE DAVIDECOLLU`). | Codes are live in admin. |
| Referral URL format is exactly `adamftd.com/ref/{code}`. | Wired. |
| Admin route is not linked from the public site or sitemap. | Security by obscurity, weak but better than nothing. |
| The Co-brand toggle is invisible to standard affiliates. No "upgrade to co-branded" upsell copy anywhere. | Co-branding is a contractual entitlement, not a feature flag. |

## Contact

Giuseppe Funaro, CEO, ADAMftd · `ceo@adamftd.com`
