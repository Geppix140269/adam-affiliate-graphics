# ADAMftd Partner Kit

Self-service marketing-asset generator for ADAMftd Affiliate Programme partners.

**Live:** https://kit.adamftd.com (planned)
**Repo lives at:** `C:\Development\adam-affiliate-graphics`

## What it does

An affiliate enters their code on a landing screen. We look it up in `data/affiliates.json`. If valid, the kit renders 15 personalised marketing assets (LinkedIn banner, X header, Facebook cover, IG feed squares, IG stories, share card, email sig light + dark, email banner, Zoom background, business card front + back, A4 one-pager) at their exact deliverable dimensions, and lets them download the full set as a single ZIP.

## Project layout

```
.
├── index.html                  Entry HTML (loads React + Babel + JSZip + html2canvas via CDN)
├── netlify.toml                Static deploy config, cache headers
├── css/styles.css              Design system
├── js/
│   ├── templates.jsx           15 asset components, palette, type tokens
│   └── app.jsx                 Gate, generator, ZIP, admin override
├── data/
│   └── affiliates.json         Whitelist: { code: { first_name, full_name } }
└── assets/
    └── adamftd-affiliate-lockup.png   Approved brand lockup
```

No build step. Netlify serves the repo root.

## Local preview

```bash
cd C:\Development\adam-affiliate-graphics
python -m http.server 8000
# open http://localhost:8000
```

A static server is required because the app fetches `data/affiliates.json` at runtime — `file://` won't work.

## Modes

### Standard (affiliates)
- Land on `/`
- Enter affiliate code
- If recognised: auto-populated generator with all 15 assets
- If not recognised: "That code isn't recognised…" with `ceo@adamftd.com` contact

### Deep-link
- `https://kit.adamftd.com/?code=davidecollu` skips the gate and goes straight to the kit

### Admin (Giuseppe)
- `https://kit.adamftd.com/?admin=1`
- Re-exposes editable First Name / Full Name / Code fields
- Useful for testing or generating a kit for a not-yet-listed affiliate
- To require a key: edit `ADMIN_KEY` in `js/app.jsx` and use `?admin=<your-key>`

## Adding / updating affiliates (30-second flow)

1. Open `data/affiliates.json`
2. Add a new entry: `"new-code": { "first_name": "First", "full_name": "First Last" }`
3. Commit + push. Netlify auto-deploys in ~30 seconds.

**Rules:**
- Codes are lowercase, hyphen-separated, ASCII only.
- Match exactly what's wired in admin (these codes are live).

## Deploy checklist (one-time)

### 1. GitHub
```bash
cd C:\Development\adam-affiliate-graphics
git add -A
git commit -m "Initial commit: ADAMftd Partner Kit"
gh repo create adamftd/adam-affiliate-graphics --private --source=. --push
```

### 2. Netlify
- New site from Git → select the `adamftd/adam-affiliate-graphics` repo
- Build settings: leave empty (the `netlify.toml` handles it)
- Deploy → confirm the auto-generated `*.netlify.app` URL works
- **Smoke test against the auto-URL first** before adding the custom domain:
  - Open the site, enter `davidecollu`, confirm the kit renders
  - Try an invalid code, confirm the error message
  - Click "Download all (ZIP)" and confirm you get 15 PNGs

### 3. Custom domain (kit.adamftd.com)
**In Cloudflare DNS for adamftd.com:**
- Add CNAME record:
  - Name: `kit`
  - Target: `<your-netlify-site>.netlify.app`
  - Proxy: **DNS only** (grey cloud) until Let's Encrypt provisions; you can flip to proxied after
  - TTL: Auto

**In Netlify dashboard:**
- Site settings → Domain management → Add custom domain → `kit.adamftd.com`
- Wait ~5 min for HTTPS cert (Let's Encrypt, auto)
- Set `kit.adamftd.com` as **primary domain** → the `*.netlify.app` URL will 301-redirect automatically

### 4. Verify
- `https://kit.adamftd.com/` resolves with valid HTTPS
- `https://kit.adamftd.com/?admin=1` shows the admin override row
- ZIP download produces `adamftd_partner_kit_<code>_<YYYY-MM-DD>.zip` with 15 PNGs
- Test at least 3 codes from `affiliates.json` (suggest `davidecollu`, `1402celsius`, `harryweber`)
- Test an unknown code: `xxx-nope` should show the recognised-error message

## Brand rules (do not violate)

| Rule | Reason |
|---|---|
| Use the lockup file. Never typeset "ADAMftd" as plain text. | Brand integrity. |
| No em-dashes (—) in copy or graphics. | Brand style. |
| No platform-savings figures ("$X saved"). | Banned. |
| No "search bar" framing. ADAMftd is a conversational AI. | Positioning. |
| Codes are LOWERCASE in URLs (`davidecollu`), UPPERCASE in display only (`USE CODE DAVIDECOLLU`). | Codes are live in admin. |
| Referral URL format is exactly `adamftd.com/ref/{code}`. | Wired. |
| No "free" / "trial" framing for the Starter tier. | Misframing causes problems. |
| No Bloomberg-as-competitor claim. The "Bloomberg-tier budgets" line is a pricing-positioning device only. | Legal / positioning. |

## What's NOT in this PR (deferred)

**Upgrade 3 — Co-Branded Mode** for institutional partners (AACC, ABWCI, etc.) is intentionally deferred per Giuseppe's note in the brief. Follow-up PR will add `data/cobranded_partners.json`, partner logo upload, custom hero text, partner-color override, and dual-lockup re-renders of all 15 templates. The current code does not surface any "upgrade to co-branded" copy — the toggle is invisible until that PR lands.

## Contact

Giuseppe Funaro, CEO, ADAMftd · `ceo@adamftd.com`
