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
  const { ASSETS, POSITIONING_LINES, MIDDOT, Artboard } = window.AGK;

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
        const data = await validateKey(key);
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

  function Welcome({ aff, onDismiss }) {
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

  async function captureNode(node, w, h) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:fixed;left:-10000px;top:0;width:' + w + 'px;height:' + h + 'px;';
    const clone = node.cloneNode(true);
    clone.style.transform = 'none';
    clone.style.width = w + 'px';
    clone.style.height = h + 'px';
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);
    try {
      return await html2canvas(clone, { width: w, height: h, scale: 1, backgroundColor: null, useCORS: true, allowTaint: true, logging: false });
    } finally {
      document.body.removeChild(wrapper);
    }
  }
  function canvasToBlob(canvas, type) { return new Promise((resolve) => canvas.toBlob(resolve, type || 'image/png')); }
  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---------- Generator ----------

  function Generator({ initialAff, cobrandedPartner, adminMode, onLogout }) {
    const [aff, setAff] = useState(initialAff);
    const [mode, setMode] = useState('light');
    const [line, setLine] = useState(POSITIONING_LINES[0]);
    const [viewportW, setViewportW] = useState(window.innerWidth);
    const [welcomeOpen, setWelcomeOpen] = useState(true);
    const [progress, setProgress] = useState(null);

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
          const canvas = await captureNode(node, asset.w, asset.h);
          const blob = await canvasToBlob(canvas);
          triggerDownload(blob, asset.id + '_' + aff.code + (cobrand ? '_cobrand' : '') + '.png');
        } catch (e) {
          console.error('Capture failed', e);
          alert('Could not generate that PNG. Try again, or refresh the page.');
        }
      };
      return () => { delete window.__downloadOne; };
    }, [aff.code, !!cobrand]);

    const groups = useMemo(() => {
      const out = []; const seen = {};
      for (const a of ASSETS) {
        if (!seen[a.group]) { seen[a.group] = []; out.push({ name: a.group, items: seen[a.group] }); }
        seen[a.group].push(a);
      }
      return out;
    }, []);

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
          const canvas = await captureNode(node, asset.w, asset.h);
          const blob = await canvasToBlob(canvas);
          zip.file(asset.id + '_' + aff.code + (cobrand ? '_cobrand' : '') + '.png', blob);
          await new Promise(r => setTimeout(r, 30));
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
            <button className="btn" onClick={downloadAllZip}>Download all (ZIP)</button>
            {adminMode && (
              <div className="admin-row">
                <div className="field"><label>First name (admin)</label><input value={aff.first_name} onChange={(e) => adminUpdate('first_name', e.target.value)} /></div>
                <div className="field"><label>Full name (admin)</label><input value={aff.full_name} onChange={(e) => adminUpdate('full_name', e.target.value)} /></div>
                <div className="field"><label>Code (admin)</label><input className="code" value={aff.code} onChange={(e) => adminUpdate('code', e.target.value)} /></div>
                <button className="btn secondary" onClick={onLogout} style={{ marginLeft: 'auto' }}>Reset gate</button>
              </div>
            )}
          </div>
        </div>

        {cobrandEnabled && partner && (
          <CobrandSetup partner={partner} onChange={setPartner} />
        )}

        <div className="canvas">
          {welcomeOpen
            ? <Welcome aff={aff} onDismiss={() => setWelcomeOpen(false)} />
            : <button className="show-welcome-pill" onClick={() => setWelcomeOpen(true)}>Show welcome</button>
          }
          {groups.map(g => (
            <section className="section" key={g.name}>
              <header className="section-header"><h2>{g.name}</h2></header>
              {g.items.map(asset => {
                const scale = Math.min(1, maxArtboardW / asset.w);
                return <Artboard key={asset.id} asset={asset} aff={aff} dark={dark} line={line} scale={scale} cobrand={cobrand} />;
              })}
            </section>
          ))}
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

  function App() {
    const urlParams = new URLSearchParams(window.location.search);
    const adminParam = urlParams.get('admin');
    const keyFromUrl = urlParams.get('key');
    const adminMode = adminParam != null && adminParam === ADMIN_KEY;

    const [resolved, setResolved] = useState(null); // { affiliate, cobranded }
    const [bootError, setBootError] = useState(null);
    const [booting, setBooting] = useState(!!keyFromUrl);

    useEffect(() => {
      if (adminMode) {
        setResolved({
          affiliate: { code: 'davidecollu', first_name: 'Davide', full_name: 'Davide Collu' },
          cobranded: null,
        });
        return;
      }
      if (!keyFromUrl) return;
      (async () => {
        try {
          const data = await validateKey(keyFromUrl);
          setResolved(data);
          // Strip the key from the URL so it isn't kept in history/screenshots
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete('key');
            window.history.replaceState({}, '', url.toString());
          } catch (_) {}
        } catch (e) {
          setBootError(e.message);
        } finally {
          setBooting(false);
        }
      })();
    }, []);

    if (booting) return <div className="boot">Checking your access key...</div>;

    if (!resolved) {
      return <Gate
        onResolve={setResolved}
        prefill=""
      />;
    }

    return <Generator
      initialAff={resolved.affiliate}
      cobrandedPartner={resolved.cobranded}
      adminMode={adminMode}
      onLogout={() => setResolved(null)}
    />;
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
