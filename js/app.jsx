/*
 * ADAMftd Partner Kit — application shell.
 *
 * v2.2 security update:
 *  - Gate now validates ACCESS KEY against /api/validate (server-side),
 *    not a guessable affiliate code against a client-fetched list.
 *  - URL deep-link is ?key=ACCESS_KEY (not ?code=).
 *  - The cobranded entitlement comes back in the same validate response,
 *    so the generator never sees the full affiliate or partner lists.
 */
(function () {
  const { useState, useEffect, useMemo, useRef } = React;
  const { ASSETS, POSITIONING_LINES, MIDDOT, Artboard, ContentSection,
    CaptionsCard, EmailsCard, DmsCard, PitchesCard, FaqCard, QrCard, PersonalLinksCard,
    buildCaptionsTxt, buildEmailsTxt, buildDmsTxt, buildPitchesTxt, buildFaqTxt,
    renderQrToCanvas, canvasToPngBlob } = window.AGK;

  const ADMIN_KEY = '1';
  const CONTACT_EMAIL = 'ceo@adamftd.com';
  const MAX_LOGO_MB = 2;
  const MAX_HERO_CHARS = 80;

  function normaliseCode(raw) {
    return (raw || '')
      .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  // ---------- API ----------

  async function validateKey(key) {
    const r = await fetch('/api/validate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: String(key || '').trim() }),
    });
    let data = null;
    try { data = await r.json(); } catch (_) { data = null; }
    if (r.status === 429) throw new Error('Too many tries. Wait a minute and try again.');
    if (!r.ok) throw new Error(data?.error || ("That access key isn't valid."));
    return data; // { affiliate: { code, first_name, full_name }, cobranded: {...} | null }
  }

  // ---------- Gate ----------

  function Gate({ onResolve, prefill }) {
    const [key, setKey] = useState(prefill || '');
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    async function handleSubmit(e) {
      e.preventDefault();
      if (!key.trim()) { setError('Paste your access key (from your welcome email) to continue.'); return; }
      setBusy(true); setError(null);
      try {
        const trimmed = key.trim();
        const data = await validateKey(trimmed);
        // Persist for next visit on this device
        try { window.localStorage.setItem('adamftd_kit_key', trimmed); } catch (_) {}
        onResolve(data);
      } catch (err) {
        setError(err.message + ' Check your welcome email, or write to ' + CONTACT_EMAIL + '.');
      } finally { setBusy(false); }
    }

    return (
      <div className="gate">
        <div className="gate-card">
          <div className="grad" />
          <img className="logo" src="assets/adamftd-affiliate-lockup.png" alt="ADAMftd Affiliate Programme" />
          <h1>Welcome to the ADAMftd Partner Kit</h1>
          <p className="sub">Click the personal link in your welcome email, or paste your access key below.</p>
          <form onSubmit={handleSubmit} autoComplete="off">
            <input
              autoFocus
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="your-access-key"
              spellCheck={false}
              aria-label="Access key"
              type="password"
            />
            <button type="submit" disabled={busy}>{busy ? 'Checking...' : 'Continue'}</button>
          </form>
          {error && <div className="error">{error}</div>}
          <div className="help">
            Don't have your link? Check your welcome email or write to <a href={'mailto:' + CONTACT_EMAIL}>{CONTACT_EMAIL}</a>.
          </div>
        </div>
      </div>
    );
  }

  // ---------- Welcome ----------

  function Welcome({ aff, promos, onDismiss }) {
    return (
      <div className="welcome">
        <div className="welcome-head">
          <h2>{'Welcome, ' + aff.first_name + '.'}</h2>
          <button onClick={onDismiss} aria-label="Dismiss welcome block">Dismiss</button>
        </div>
        <p>Your personalised ADAMftd Partner Kit is ready.</p>
        <ol>
          <li>Pick the headline you want from the dropdown (top).</li>
          <li>Click <strong>Download all</strong> to grab the full ZIP.</li>
          <li>Post the assets to LinkedIn, X, Instagram, your newsletter, your Zoom background.</li>
        </ol>

        {promos && promos.length > 0 && (
          <>
            <div className="rules-head">What your referrals get when they sign up with your code</div>
            <ul className="promos">
              {promos.map(p => (
                <li key={p.id}>
                  <strong>{p.headline}.</strong>{p.detail ? ' ' + p.detail : ''}
                </li>
              ))}
            </ul>
            <p style={{ fontSize: 13, color: 'rgba(15,27,45,0.55)', marginTop: 4 }}>
              Mention these in your posts. They're already baked into the LinkedIn banner, share card, email banner, and one-pager.
            </p>
          </>
        )}

        <div className="rules-head">Three rules to keep the kit working</div>
        <ul className="rules">
          <li>Use the assets as-generated. Don't crop, recolour, or overlay other text.</li>
          <li>Always include the code (<code>USE CODE {aff.code.toUpperCase()}</code>) or the link (<code>adamftd.com/ref/{aff.code}</code>). That's how you get credit.</li>
          <li>If you want a different headline angle, ask: <a href={'mailto:' + CONTACT_EMAIL}>{CONTACT_EMAIL}</a>.</li>
        </ul>
        <div className="track">Track your referrals at <a href="https://adamftd.com/affiliate" target="_blank" rel="noopener">adamftd.com/affiliate</a>.</div>
      </div>
    );
  }

  // ---------- Co-brand setup strip ----------

  function CobrandSetup({ partner, onChange }) {
    const fileRef = useRef(null);
    const [err, setErr] = useState(null);

    function handleFile(file) {
      setErr(null);
      if (!file) return;
      const maxBytes = MAX_LOGO_MB * 1024 * 1024;
      if (file.size > maxBytes) { setErr('Logo is over ' + MAX_LOGO_MB + ' MB. Please use a smaller file.'); return; }
      if (!/^image\//.test(file.type)) { setErr("That doesn't look like an image file."); return; }
      const reader = new FileReader();
      reader.onload = () => onChange({ ...partner, logo_url: String(reader.result) });
      reader.onerror = () => setErr('Could not read the file. Try a different one.');
      reader.readAsDataURL(file);
    }

    function onDrop(e) {
      e.preventDefault(); e.stopPropagation();
      const file = e.dataTransfer?.files?.[0];
      handleFile(file);
    }

    return (
      <div className="cobrand-strip">
        <div className="cobrand-strip-head">
          <span className="cobrand-label">Co-brand setup</span>
          <span className="cobrand-hint">Partner: <strong>{partner.full_name}</strong></span>
        </div>
        <div className="cobrand-fields">
          <div className="cobrand-field cobrand-logo-field">
            <label>Partner logo (PNG or SVG, max {MAX_LOGO_MB} MB)</label>
            <div
              className="cobrand-drop"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              {partner.logo_url
                ? <img src={partner.logo_url} alt="Partner logo preview" />
                : <span>Drop a logo here, or click to choose</span>}
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
            {partner.logo_url && (
              <button type="button" className="link-btn" onClick={() => onChange({ ...partner, logo_url: null })}>Remove logo</button>
            )}
          </div>
          <div className="cobrand-field">
            <label>Partner short name</label>
            <input type="text" maxLength={12} value={partner.short_name || ''}
              onChange={(e) => onChange({ ...partner, short_name: e.target.value.slice(0, 12) })}
              placeholder="e.g. AACC" />
            <div className="cobrand-help">Max 12 characters. Shown in the dual lockup if no logo is uploaded.</div>
          </div>
          <div className="cobrand-field" style={{ flex: 2 }}>
            <label>Custom hero headline (overrides the dropdown)</label>
            <input type="text" maxLength={MAX_HERO_CHARS} value={partner.hero_override || ''}
              onChange={(e) => onChange({ ...partner, hero_override: e.target.value.slice(0, MAX_HERO_CHARS) })}
              placeholder="Leave blank to use the standard headline dropdown" />
            <div className="cobrand-help">{(partner.hero_override || '').length}/{MAX_HERO_CHARS}</div>
          </div>
        </div>
        {err && <div className="cobrand-error">{err}</div>}
      </div>
    );
  }

  // ---------- Capture utilities ----------

  // Read the rendered background colour of the artboard's first element so
  // JPEG export (no alpha channel) shows the right colour, not pure black.
  function readBg(node) {
    const inner = node.firstElementChild || node;
    const cs = window.getComputedStyle(inner);
    const bg = cs.backgroundColor;
    if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return '#FAF6EE';
    return bg;
  }

  async function captureNode(node, w, h, opts = {}) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:fixed;left:-10000px;top:0;width:' + w + 'px;height:' + h + 'px;';
    const clone = node.cloneNode(true);
    clone.style.transform = 'none';
    clone.style.width = w + 'px';
    clone.style.height = h + 'px';
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);
    const targetBg = opts.bgColor || readBg(node);
    try {
      const raw = await html2canvas(clone, {
        width: w, height: h, scale: 1,
        backgroundColor: opts.opaque ? targetBg : null,
        useCORS: true, allowTaint: true, logging: false,
      });

      // Re-blit through a clean canvas with explicit integer dims, no
      // alpha channel, and sRGB colour space. This produces a JPEG with
      // proper colour-space metadata and clean dimensions — html2canvas's
      // raw output sometimes ships without these, which LinkedIn (and
      // some other CDNs) silently reject.
      const ctxOpts = { colorSpace: 'srgb' };
      if (opts.opaque) ctxOpts.alpha = false;
      const clean = document.createElement('canvas');
      clean.width = w;
      clean.height = h;
      const ctx = clean.getContext('2d', ctxOpts);
      if (opts.opaque) {
        ctx.fillStyle = targetBg;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(raw, 0, 0, w, h);
      return clean;
    } finally {
      document.body.removeChild(wrapper);
    }
  }

  function canvasToBlob(canvas, mime, quality) {
    return new Promise((resolve) => canvas.toBlob(resolve, mime || 'image/png', quality));
  }

  // For autoHeight assets, the real capture height is the rendered inner
  // element's height, not the asset's nominal h. node is the artboard-frame;
  // its first child is the asset component's root.
  function captureHeight(node, asset) {
    if (asset.autoHeight && node && node.firstElementChild) {
      return node.firstElementChild.scrollHeight || node.firstElementChild.offsetHeight || asset.h;
    }
    return asset.h;
  }

  function exportFor(asset) {
    if (asset.format === 'jpeg') return { mime: 'image/jpeg', ext: 'jpg', opaque: true, quality: 0.95 };
    // For PNG we always render opaque now (and we'll splice an sRGB chunk
    // into the bytes before download — see finaliseBlob).
    return { mime: 'image/png', ext: 'png', opaque: true, quality: undefined };
  }

  // -------------------- Server-side cover render --------------------
  // For the 4 cover assets, ask the Puppeteer-backed Function to render
  // them in real Chromium and return a PNG. Returns null if the function
  // fails so the caller can fall back to html2canvas.

  async function renderCoverServerSide(asset, aff, mode, line, cobrand, promos) {
    try {
      const body = {
        asset: asset.id,
        aff: { code: aff.code, first_name: aff.first_name, full_name: aff.full_name },
        mode: mode,
        line: line || undefined,
      };
      if (asset.useLine === false) delete body.line;
      if (cobrand && cobrand.partner) {
        body.cobrand = {
          partner: {
            short_name: cobrand.partner.short_name,
            full_name: cobrand.partner.full_name,
            primary_color: cobrand.partner.primary_color,
            // logo_url omitted — too long for the URL params the server
            // forwards to /render. Cobrand falls back to short_name text.
          },
          hero_override: cobrand.hero_override || '',
        };
      }
      if (asset.usePromos && Array.isArray(promos) && promos.length) {
        body.promos = promos.map(p => ({ headline: p.headline, detail: p.detail || '' }));
      }
      const res = await fetch('/api/render-cover', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.warn('render-cover returned', res.status, text);
        return null;
      }
      return await res.blob();
    } catch (e) {
      console.warn('renderCoverServerSide error', e);
      return null;
    }
  }

  // -------------------- PNG sRGB chunk injection --------------------
  // canvas.toBlob('image/png') produces a PNG with NO sRGB chunk, even
  // when the canvas was opened with colorSpace: 'srgb'. LinkedIn's image-
  // moderation pipeline rejects metadata-less PNGs (verified: a Windows
  // Snipping Tool screenshot of the SAME banner uploads fine because
  // Windows writes sRGB metadata). We splice a standard sRGB chunk into
  // the byte stream right after IHDR.

  const PNG_SIG = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c;
    }
    return t;
  })();

  function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function injectSRGBInPng(bytes) {
    if (bytes.length < 33) return bytes;
    for (let i = 0; i < 8; i++) if (bytes[i] !== PNG_SIG[i]) return bytes;
    const ihdrEnd = 33; // PNG signature (8) + IHDR chunk (4 len + 4 type + 13 data + 4 crc = 25)
    // Already has sRGB chunk right after IHDR? skip.
    if (bytes[ihdrEnd + 4] === 0x73 && bytes[ihdrEnd + 5] === 0x52 &&
        bytes[ihdrEnd + 6] === 0x47 && bytes[ihdrEnd + 7] === 0x42) {
      return bytes;
    }
    // Build sRGB chunk: length=1, type "sRGB", data=0 (rendering intent: perceptual)
    const typeAndData = new Uint8Array([0x73, 0x52, 0x47, 0x42, 0x00]);
    const crc = crc32(typeAndData);
    const chunk = new Uint8Array(13);
    chunk[0] = 0; chunk[1] = 0; chunk[2] = 0; chunk[3] = 1; // length = 1
    chunk.set(typeAndData, 4);
    chunk[9]  = (crc >>> 24) & 0xff;
    chunk[10] = (crc >>> 16) & 0xff;
    chunk[11] = (crc >>>  8) & 0xff;
    chunk[12] =  crc         & 0xff;
    const out = new Uint8Array(bytes.length + chunk.length);
    out.set(bytes.subarray(0, ihdrEnd), 0);
    out.set(chunk, ihdrEnd);
    out.set(bytes.subarray(ihdrEnd), ihdrEnd + chunk.length);
    return out;
  }

  async function finaliseBlob(blob, mime, opts = {}) {
    if (mime !== 'image/png') return blob;

    // For cover assets, route through the server-side sharp normaliser.
    // That function decodes + re-encodes the PNG via libvips, which writes
    // the sRGB ICC profile and standard PNG structure LinkedIn expects.
    if (opts.coverAsset) {
      try {
        const res = await fetch('/api/normalize-png', {
          method: 'POST',
          headers: { 'content-type': 'image/png' },
          body: blob,
        });
        if (res.ok) {
          return await res.blob();
        }
        console.warn('Server normalisation returned', res.status, '— falling back to client sRGB injection');
      } catch (e) {
        console.warn('Server normalisation request failed, falling back', e);
      }
    }

    // Fallback / non-cover: client-side sRGB chunk injection.
    try {
      const buf = await blob.arrayBuffer();
      const fixed = injectSRGBInPng(new Uint8Array(buf));
      return new Blob([fixed], { type: 'image/png' });
    } catch (e) {
      console.warn('sRGB injection failed, returning original PNG', e);
      return blob;
    }
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---------- Generator ----------

  function Generator({ initialAff, cobrandedPartner, promotions, adminMode, onSignOut }) {
    const [aff, setAff] = useState(initialAff);
    const [mode, setMode] = useState('light');
    const [line, setLine] = useState(POSITIONING_LINES[0]);
    const [viewportW, setViewportW] = useState(window.innerWidth);
    const [welcomeOpen, setWelcomeOpen] = useState(true);
    const [progress, setProgress] = useState(null);
    const [promosOn, setPromosOn] = useState(true);
    const promos = promosOn ? (promotions || []) : [];

    const [cobrandEnabled, setCobrandEnabled] = useState(false);
    const [partner, setPartner] = useState(() => cobrandedPartner ? {
      short_name: cobrandedPartner.short_name || aff.code.toUpperCase(),
      full_name: cobrandedPartner.full_name || '',
      primary_color: cobrandedPartner.primary_color || '#1F3A5F',
      logo_url: cobrandedPartner.logo_url || null,
      hero_override: '',
    } : null);

    useEffect(() => {
      const onResize = () => setViewportW(window.innerWidth);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, []);

    const dark = mode === 'dark';
    const maxArtboardW = Math.min(viewportW - 80, 1500);
    const cobrand = cobrandEnabled && partner ? { partner, hero_override: partner.hero_override } : null;

    useEffect(() => {
      window.__downloadOne = async (node, asset) => {
        try {
          const filename = asset.id + '_' + aff.code + (cobrand ? '_cobrand' : '') + '.png';
          // Cover assets render server-side via Puppeteer for LinkedIn-
          // compliant output. All other assets keep using html2canvas
          // because those uploads don't have the cover-moderation issue.
          if (asset.coverAsset) {
            const blob = await renderCoverServerSide(asset, aff, mode, line, cobrand, promos);
            if (blob) { triggerDownload(blob, filename); return; }
            // If server render fails, fall through to the html2canvas path
            console.warn('Server render failed, falling back to html2canvas');
          }
          const ex = exportFor(asset);
          const canvas = await captureNode(node, asset.w, captureHeight(node, asset), { opaque: ex.opaque });
          const rawBlob = await canvasToBlob(canvas, ex.mime, ex.quality);
          const finalBlob = await finaliseBlob(rawBlob, ex.mime, { coverAsset: !!asset.coverAsset });
          triggerDownload(finalBlob, asset.id + '_' + aff.code + (cobrand ? '_cobrand' : '') + '.' + ex.ext);
        } catch (e) {
          console.error('Capture failed', e);
          alert('Could not generate that image. Try again, or refresh the page.');
        }
      };

      // Screenshot mode: opens the rendered banner at native resolution in
      // a new tab so the user can capture it with Win+Shift+S. A Windows
      // Snipping Tool screenshot is the ONE format we've confirmed
      // LinkedIn accepts. Browser canvas.toBlob output isn't accepted
      // regardless of sRGB injection / JPEG / opaque background.
      window.__screenshotMode = async (node, asset) => {
        try {
          const canvas = await captureNode(node, asset.w, asset.h, { opaque: true });
          const dataUrl = canvas.toDataURL('image/png');
          const win = window.open('', '_blank');
          if (!win) {
            alert('Pop-up was blocked. Allow pop-ups for this site and try again.');
            return;
          }
          const safeLabel = asset.label.replace(/[<>&"']/g, '');
          win.document.open();
          win.document.write([
            '<!doctype html><html lang="en"><head><meta charset="utf-8" />',
            '<title>Screenshot ' + safeLabel + '</title>',
            '<style>',
            'html,body{margin:0;padding:0;background:#1a1a1a;color:#fff;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;min-height:100vh}',
            'main{padding:32px 24px;display:flex;flex-direction:column;align-items:center;gap:24px}',
            'h1{margin:0;font-size:14px;font-weight:500;letter-spacing:0.02em;color:#eef3fa}',
            'h1 small{color:#5A6B85;font-weight:400;margin-left:8px}',
            '.hint{max-width:720px;font-size:13px;line-height:1.55;color:#bbb;text-align:center;background:#222;padding:16px 20px;border-radius:8px;border:1px solid #333}',
            '.hint b{color:#3FB5A4}',
            '.hint kbd{background:#333;color:#fff;padding:2px 7px;border-radius:4px;font-family:Consolas,Menlo,monospace;font-size:12px;border:1px solid #444}',
            '.frame{box-shadow:0 8px 40px rgba(0,0,0,0.6);background:#fff}',
            'img{display:block;width:' + asset.w + 'px;height:' + asset.h + 'px;max-width:none}',
            '</style></head><body><main>',
            '<h1>' + safeLabel + ' <small>' + asset.w + ' x ' + asset.h + ' px</small></h1>',
            '<div class="hint">',
            'Press <kbd>Win</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd>, drag a rectangle around the banner below, then save or paste it into LinkedIn. ',
            '<b>This bypasses the encoding issue</b> that causes LinkedIn to reject our directly-downloaded PNG.',
            '</div>',
            '<div class="frame"><img src="' + dataUrl + '" /></div>',
            '<div class="hint" style="background:transparent;border:0;color:#666;font-size:11px">Tip: scroll horizontally to see the full banner if your screen is narrower than ' + asset.w + ' px.</div>',
            '</main></body></html>',
          ].join(''));
          win.document.close();
        } catch (e) {
          console.error('Screenshot mode failed', e);
          alert('Could not open screenshot mode. Try refreshing the page.');
        }
      };

      return () => { delete window.__downloadOne; delete window.__screenshotMode; };
    }, [aff.code, !!cobrand]);

    // Map the existing asset `group` labels (kept untouched for ZIP/
    // backwards compat) onto the new sub-section IDs used by the sidebar.
    const GROUP_TO_SUB = useMemo(() => ({
      'Cover rails (profile headers)': { id: 'covers', label: 'Covers' },
      'Feed posts (square)':           { id: 'feed-posts', label: 'Feed posts' },
      'Stories (vertical)':            { id: 'stories', label: 'Stories' },
      'Share card (OG / X)':           { id: 'share-card', label: 'Share card' },
      'Email':                         { id: 'email-graphics', label: 'Email graphics' },
      'Virtual presence':              { id: 'virtual', label: 'Virtual' },
      'Print':                         { id: 'print', label: 'Print' },
      'Partner one-pager':             { id: 'one-pager', label: 'Partner one-pager' },
    }), []);

    const graphicsSubs = useMemo(() => {
      const out = []; const byId = {};
      for (const a of ASSETS) {
        const map = GROUP_TO_SUB[a.group];
        if (!map) continue;
        if (!byId[map.id]) {
          byId[map.id] = { id: map.id, label: map.label, items: [] };
          out.push(byId[map.id]);
        }
        byId[map.id].items.push(a);
      }
      return out;
    }, [GROUP_TO_SUB]);

    // Sidebar IA — the navigation backbone.
    const NAV_SECTIONS = useMemo(() => [
      {
        id: 'graphics', label: 'Graphics', icon: '📁',
        sub: graphicsSubs.map(g => ({ id: g.id, label: g.label })),
      },
      {
        id: 'content', label: 'Content', icon: '✍️',
        sub: [
          { id: 'captions', label: 'Captions' },
          { id: 'emails',   label: 'Email templates' },
          { id: 'dms',      label: 'DM / WhatsApp' },
          { id: 'pitches',  label: 'Elevator pitches' },
          { id: 'faq',      label: 'FAQ' },
        ],
      },
      {
        id: 'tools', label: 'Tools', icon: '🔳',
        sub: [
          { id: 'qr',    label: 'Personal QR code' },
          { id: 'links', label: 'Personal links' },
        ],
      },
      {
        id: 'download', label: 'Download', icon: '📦',
        sub: [],
      },
    ], [graphicsSubs]);

    // Scroll-spy — highlight the sub-section currently in view.
    const [activeSub, setActiveSub] = useState('graphics');
    useEffect(() => {
      const els = document.querySelectorAll('[data-sub-id]');
      if (els.length === 0) return;
      const obs = new IntersectionObserver((entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActiveSub(visible[0].target.dataset.subId);
      }, { rootMargin: '-130px 0px -55% 0px', threshold: 0 });
      els.forEach(el => obs.observe(el));
      return () => obs.disconnect();
    }, [graphicsSubs.length]);

    function smoothScrollTo(id, e) {
      if (e) e.preventDefault();
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const totalGraphics = ASSETS.length;

    async function downloadAllZip() {
      if (typeof JSZip === 'undefined') { alert('ZIP library failed to load. Refresh and try again.'); return; }
      const zip = new JSZip();
      const frames = document.querySelectorAll('.artboard-frame');
      setProgress({ current: 0, total: frames.length, stage: 'Preparing' });
      try {
        for (let i = 0; i < frames.length; i++) {
          const node = frames[i];
          const id = node.dataset.assetId;
          const asset = ASSETS.find(a => a.id === id);
          if (!asset) continue;
          setProgress({ current: i + 1, total: frames.length, stage: 'Rendering ' + asset.label });
          // For cover assets, render server-side. Fall back to html2canvas
          // path on any failure so the ZIP still produces something.
          let added = false;
          if (asset.coverAsset) {
            try {
              const serverBlob = await renderCoverServerSide(asset, aff, mode, line, cobrand, promos);
              if (serverBlob) {
                zip.file(asset.id + '_' + aff.code + (cobrand ? '_cobrand' : '') + '.png', serverBlob);
                added = true;
              }
            } catch (e) {
              console.warn('Server render failed for ' + asset.id + ', falling back', e);
            }
          }
          if (!added) {
            const ex = exportFor(asset);
            const canvas = await captureNode(node, asset.w, captureHeight(node, asset), { opaque: ex.opaque });
            const rawBlob = await canvasToBlob(canvas, ex.mime, ex.quality);
            const finalBlob = await finaliseBlob(rawBlob, ex.mime, { coverAsset: !!asset.coverAsset });
            zip.file(asset.id + '_' + aff.code + (cobrand ? '_cobrand' : '') + '.' + ex.ext, finalBlob);
          }
          await new Promise(r => setTimeout(r, 30));
        }
        // Add the content modules as text files + QR PNGs
        setProgress({ current: frames.length, total: frames.length, stage: 'Adding captions, emails, DMs, pitches, FAQ' });
        try {
          if (buildCaptionsTxt) zip.file('content/captions.txt', buildCaptionsTxt(aff));
          if (buildEmailsTxt)   zip.file('content/emails.txt',   buildEmailsTxt(aff));
          if (buildDmsTxt)      zip.file('content/dms.txt',      buildDmsTxt(aff));
          if (buildPitchesTxt)  zip.file('content/elevator_pitches.txt', buildPitchesTxt(aff));
          if (buildFaqTxt)      zip.file('content/faq.txt',      buildFaqTxt(aff));
        } catch (e) {
          console.warn('Could not add content text files', e);
        }
        // QR codes (transparent + white bg)
        try {
          if (renderQrToCanvas && canvasToPngBlob) {
            const qrUrl = 'https://adamftd.com/ref/' + aff.code;
            setProgress({ current: frames.length, total: frames.length, stage: 'Generating QR codes' });
            const wCanvas = renderQrToCanvas(qrUrl, 1000, '#FFFFFF');
            const wBlob = await canvasToPngBlob(wCanvas);
            if (wBlob) zip.file('content/qr_white_' + aff.code + '.png', wBlob);
            const tCanvas = renderQrToCanvas(qrUrl, 1000, 'transparent');
            const tBlob = await canvasToPngBlob(tCanvas);
            if (tBlob) zip.file('content/qr_transparent_' + aff.code + '.png', tBlob);
          }
        } catch (e) {
          console.warn('Could not add QR codes to zip', e);
        }
        setProgress({ current: frames.length, total: frames.length, stage: 'Bundling ZIP' });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const today = new Date().toISOString().slice(0, 10);
        const suffix = cobrand ? '_cobrand' : '';
        triggerDownload(zipBlob, 'adamftd_partner_kit_' + aff.code + suffix + '_' + today + '.zip');
      } catch (e) {
        console.error('ZIP failed', e);
        alert('ZIP generation failed. Try again, or use the per-asset Download PNG buttons.');
      } finally { setProgress(null); }
    }

    function adminUpdate(field, value) {
      if (field === 'code') setAff({ ...aff, code: normaliseCode(value) });
      else setAff({ ...aff, [field]: value });
    }

    return (
      <>
        {adminMode && <div className="admin-banner">Admin override active {MIDDOT} affiliate fields are editable</div>}
        <div className="toolbar">
          <div className="toolbar-inner">
            <div className="who">
              <span className="who-label">Generating for</span>
              <span className="who-name">{aff.full_name}</span>
              <span className="who-code">{aff.code} {MIDDOT} adamftd.com/ref/{aff.code}</span>
            </div>
            <div className="field">
              <label>Hero headline (banner, X header, share card)</label>
              <select value={line} onChange={(e) => setLine(e.target.value)}>
                {POSITIONING_LINES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="pill" role="radiogroup" aria-label="Mode">
              <button className={mode === 'light' ? 'active' : ''} onClick={() => setMode('light')}>Light</button>
              <button className={mode === 'dark' ? 'active' : ''} onClick={() => setMode('dark')}>Dark</button>
            </div>
            {cobrandedPartner && (
              <div className="pill" role="radiogroup" aria-label="Co-brand">
                <button className={!cobrandEnabled ? 'active' : ''} onClick={() => setCobrandEnabled(false)}>Single</button>
                <button className={cobrandEnabled ? 'active' : ''} onClick={() => setCobrandEnabled(true)}>Co-brand</button>
              </div>
            )}
            {promotions && promotions.length > 0 && (
              <div className="pill" role="radiogroup" aria-label="Promotions">
                <button className={promosOn ? 'active' : ''} onClick={() => setPromosOn(true)}>Perks on</button>
                <button className={!promosOn ? 'active' : ''} onClick={() => setPromosOn(false)}>Perks off</button>
              </div>
            )}
            <button className="btn" onClick={downloadAllZip}>Download all (ZIP)</button>
            <button className="signout-link" onClick={onSignOut} title="Clear your saved key on this device">Sign out</button>
            {adminMode && (
              <div className="admin-row">
                <div className="field"><label>First name (admin)</label><input value={aff.first_name} onChange={(e) => adminUpdate('first_name', e.target.value)} /></div>
                <div className="field"><label>Full name (admin)</label><input value={aff.full_name} onChange={(e) => adminUpdate('full_name', e.target.value)} /></div>
                <div className="field"><label>Code (admin)</label><input className="code" value={aff.code} onChange={(e) => adminUpdate('code', e.target.value)} /></div>
                <button className="btn secondary" onClick={onSignOut} style={{ marginLeft: 'auto' }}>Reset gate</button>
              </div>
            )}
          </div>
        </div>

        {cobrandEnabled && partner && (
          <CobrandSetup partner={partner} onChange={setPartner} />
        )}

        {/* Mobile horizontal pill bar — top-level sections only */}
        <nav className="kit-mobile-nav" aria-label="Kit sections (mobile)">
          {NAV_SECTIONS.map(s => (
            <a
              key={s.id}
              href={'#' + s.id}
              onClick={(e) => smoothScrollTo(s.id, e)}
              className={(activeSub === s.id || s.sub.some(x => x.id === activeSub)) ? 'active' : ''}
            >
              <span className="kit-mobile-icon">{s.icon}</span> {s.label}
            </a>
          ))}
        </nav>

        <div className="kit-layout">
          {/* Desktop sidebar */}
          <aside className="kit-sidebar" aria-label="Kit navigation">
            <nav>
              {NAV_SECTIONS.map(s => (
                <div className="kit-sidebar-section" key={s.id}>
                  <a
                    href={'#' + s.id}
                    onClick={(e) => smoothScrollTo(s.id, e)}
                    className={'kit-sidebar-top' + ((activeSub === s.id || s.sub.some(x => x.id === activeSub)) ? ' active' : '')}
                  >
                    <span className="kit-sidebar-icon" aria-hidden>{s.icon}</span>
                    <span>{s.label}</span>
                  </a>
                  {s.sub.map(sub => (
                    <a
                      key={sub.id}
                      href={'#' + sub.id}
                      onClick={(e) => smoothScrollTo(sub.id, e)}
                      className={'kit-sidebar-sub' + (activeSub === sub.id ? ' active' : '')}
                    >{sub.label}</a>
                  ))}
                </div>
              ))}
            </nav>
          </aside>

          {/* Main pane */}
          <main className="kit-main">
            {/* Welcome line + hero cards */}
            <div className="kit-greeting">Welcome, {aff.first_name}.</div>
            <div className="hero-cards">
              <a href="#graphics" className="hero-card" onClick={(e) => smoothScrollTo('graphics', e)}>
                <span className="hero-card-icon" aria-hidden>📁</span>
                <span className="hero-card-title">Graphics</span>
                <span className="hero-card-meta">{totalGraphics} personalised assets</span>
              </a>
              <a href="#content" className="hero-card" onClick={(e) => smoothScrollTo('content', e)}>
                <span className="hero-card-icon" aria-hidden>✍️</span>
                <span className="hero-card-title">Content</span>
                <span className="hero-card-meta">60+ copy blocks</span>
              </a>
              <a href="#tools" className="hero-card" onClick={(e) => smoothScrollTo('tools', e)}>
                <span className="hero-card-icon" aria-hidden>🔳</span>
                <span className="hero-card-title">Tools</span>
                <span className="hero-card-meta">QR code + ref link</span>
              </a>
              <a href="#download" className="hero-card" onClick={(e) => smoothScrollTo('download', e)}>
                <span className="hero-card-icon" aria-hidden>📦</span>
                <span className="hero-card-title">Download</span>
                <span className="hero-card-meta">Full ZIP bundle</span>
              </a>
            </div>

            {welcomeOpen
              ? <Welcome aff={aff} promos={promotions || []} onDismiss={() => setWelcomeOpen(false)} />
              : <button className="show-welcome-pill" onClick={() => setWelcomeOpen(true)}>Show welcome</button>
            }

            {/* SECTION: Graphics */}
            <section className="ia-section" id="graphics">
              <h2 className="ia-section-h">📁 Graphics</h2>
              {graphicsSubs.map(g => (
                <div className="ia-sub" id={g.id} data-sub-id={g.id} key={g.id}>
                  <h3 className="ia-sub-h">{g.label}</h3>
                  {g.items.map(asset => {
                    const scale = Math.min(1, maxArtboardW / asset.w);
                    return <Artboard key={asset.id} asset={asset} aff={aff} dark={dark} line={line} scale={scale} cobrand={cobrand} promos={promos} />;
                  })}
                </div>
              ))}
            </section>

            {/* SECTION: Content */}
            <section className="ia-section" id="content">
              <h2 className="ia-section-h">✍️ Content</h2>
              <div className="ia-sub" id="captions" data-sub-id="captions">
                <h3 className="ia-sub-h">Captions</h3>
                <CaptionsCard aff={aff} inline />
              </div>
              <div className="ia-sub" id="emails" data-sub-id="emails">
                <h3 className="ia-sub-h">Email templates</h3>
                <EmailsCard aff={aff} inline />
              </div>
              <div className="ia-sub" id="dms" data-sub-id="dms">
                <h3 className="ia-sub-h">DM / WhatsApp / Telegram</h3>
                <DmsCard aff={aff} inline />
              </div>
              <div className="ia-sub" id="pitches" data-sub-id="pitches">
                <h3 className="ia-sub-h">Elevator pitches</h3>
                <PitchesCard aff={aff} inline />
              </div>
              <div className="ia-sub" id="faq" data-sub-id="faq">
                <h3 className="ia-sub-h">FAQ</h3>
                <FaqCard aff={aff} inline />
              </div>
            </section>

            {/* SECTION: Tools */}
            <section className="ia-section" id="tools">
              <h2 className="ia-section-h">🔳 Tools</h2>
              <div className="ia-sub" id="qr" data-sub-id="qr">
                <h3 className="ia-sub-h">Personal QR code</h3>
                <QrCard aff={aff} inline />
              </div>
              <div className="ia-sub" id="links" data-sub-id="links">
                <h3 className="ia-sub-h">Personal links</h3>
                <PersonalLinksCard aff={aff} inline />
              </div>
            </section>

            {/* SECTION: Download */}
            <section className="ia-section" id="download" data-sub-id="download">
              <h2 className="ia-section-h">📦 Download</h2>
              <div className="ia-download-block">
                <p>Get every asset (15 graphics + 5 text files + 2 QR codes) bundled into a single ZIP.</p>
                <button className="btn btn-large" onClick={downloadAllZip}>Download all (ZIP)</button>
                <div className="ia-download-hint">First click can take ~30 seconds while we render the LinkedIn / X / Facebook covers server-side. Subsequent downloads are faster.</div>
              </div>
            </section>
          </main>
        </div>

        {progress && (
          <div className="progress-overlay" role="alert" aria-live="polite">
            <div className="progress-card">
              <div className="label">Generating your ZIP</div>
              <div className="stage">{progress.stage}...</div>
              <div className="bar"><div className="bar-fill" style={{ width: ((progress.current / Math.max(progress.total, 1)) * 100).toFixed(1) + '%' }} /></div>
              <div className="count">{progress.current} of {progress.total}</div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ---------- Root ----------

  // localStorage key persistence
  const STORAGE_KEY = 'adamftd_kit_key';
  function getStoredKey() {
    try { return window.localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
  }
  function setStoredKey(k) {
    try { window.localStorage.setItem(STORAGE_KEY, k); } catch (_) {}
  }
  function clearStoredKey() {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  }

  function App() {
    const urlParams = new URLSearchParams(window.location.search);
    const adminParam = urlParams.get('admin');
    const keyFromUrl = urlParams.get('key');
    const adminMode = adminParam != null && adminParam === ADMIN_KEY;

    const [resolved, setResolved] = useState(null);
    const [booting, setBooting] = useState(!!keyFromUrl || (!!getStoredKey() && !adminMode));

    useEffect(() => {
      if (adminMode) {
        setResolved({
          affiliate: { code: 'davidecollu', first_name: 'Davide', full_name: 'Davide Collu' },
          cobranded: null,
        });
        return;
      }
      (async () => {
        // 1. URL key takes precedence — first-time arrival from welcome email
        if (keyFromUrl) {
          try {
            const data = await validateKey(keyFromUrl);
            setStoredKey(keyFromUrl);
            setResolved(data);
            // Strip the key from the URL once it's safely persisted
            try {
              const url = new URL(window.location.href);
              url.searchParams.delete('key');
              window.history.replaceState({}, '', url.toString());
            } catch (_) {}
          } catch (_) {
            // Bad URL key: fall through to stored-key try (or gate)
          } finally {
            // Try stored key if URL key failed
            if (!resolved) await tryStored();
          }
          setBooting(false);
          return;
        }
        // 2. Stored key from prior visit
        await tryStored();
        setBooting(false);
      })();

      async function tryStored() {
        const stored = getStoredKey();
        if (!stored) return;
        try {
          const data = await validateKey(stored);
          setResolved(data);
        } catch (_) {
          // Stored key no longer valid (e.g. admin regenerated it)
          clearStoredKey();
        }
      }
    }, []);

    function handleResolve(data) {
      // Called from Gate after successful submission. Persist the key the
      // gate validated (we don't have it directly, but we can store the
      // input the user typed via a callback ref). The Gate component now
      // calls setStoredKey itself on success.
      setResolved(data);
    }

    function handleSignOut() {
      clearStoredKey();
      setResolved(null);
    }

    if (booting) return <div className="boot">Loading your kit...</div>;

    if (!resolved) {
      return <Gate onResolve={handleResolve} />;
    }

    return <Generator
      initialAff={resolved.affiliate}
      cobrandedPartner={resolved.cobranded}
      promotions={resolved.promotions || []}
      adminMode={adminMode}
      onSignOut={handleSignOut}
    />;
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
