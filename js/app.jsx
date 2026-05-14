/*
 * ADAMftd Partner Kit — application shell.
 *
 * Upgrade map (see brief):
 *  1. Code-gate + auto-fill via data/affiliates.json
 *     - Admin override: ?admin=1 (or ?admin=<ADMIN_KEY> if set)
 *  2. Real ZIP via JSZip
 *  3. Co-branded mode — DEFERRED to follow-up PR
 *  4. kit.adamftd.com hard-coded as canonical URL in copy
 *  5. Welcome / "How to use" block
 */
(function () {
  const { useState, useEffect, useMemo, useRef } = React;
  const { ASSETS, POSITIONING_LINES, MIDDOT } = window.AGK;

  // To require a key, set ADMIN_KEY to a non-empty string. URL must then be ?admin=<value>.
  // Default '1' means ?admin=1 is sufficient (per brief's simple deterrent).
  const ADMIN_KEY = '1';

  const CANONICAL_HOST = 'kit.adamftd.com';
  const CONTACT_EMAIL = 'ceo@adamftd.com';

  function normaliseCode(raw) {
    return (raw || '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // -----------------------------------------------------------------------
  // Gate (landing screen)
  // -----------------------------------------------------------------------

  function Gate({ onResolve, prefill }) {
    const [code, setCode] = useState(prefill || '');
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    async function handleSubmit(e) {
      e.preventDefault();
      const c = normaliseCode(code);
      if (!c) { setError('Enter your affiliate code to continue.'); return; }
      setBusy(true); setError(null);
      try {
        const res = await fetch('data/affiliates.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error('affiliate list unavailable');
        const list = await res.json();
        const hit = list[c];
        if (!hit) {
          setError("That code isn't recognised. Please check your welcome email, or write to " + CONTACT_EMAIL + " so we can sort it.");
          setBusy(false);
          return;
        }
        onResolve({ code: c, first_name: hit.first_name, full_name: hit.full_name });
      } catch (err) {
        setError("Couldn't load the affiliate list. Try again, or write to " + CONTACT_EMAIL + " if this keeps happening.");
        setBusy(false);
      }
    }

    return (
      <div className="gate">
        <div className="gate-card">
          <div className="grad" />
          <img className="logo" src="assets/adamftd-affiliate-lockup.png" alt="ADAMftd Affiliate Programme" />
          <h1>Welcome to the ADAMftd Partner Kit</h1>
          <p className="sub">Enter your affiliate code below to generate your personalised marketing assets.</p>
          <form onSubmit={handleSubmit} autoComplete="off">
            <input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="your-affiliate-code"
              spellCheck={false}
              aria-label="Affiliate code"
            />
            <button type="submit" disabled={busy}>{busy ? 'Checking…' : 'Continue'}</button>
          </form>
          {error && <div className="error">{error}</div>}
          <div className="help">
            Forgot your code? Check your welcome email or write to <a href={'mailto:' + CONTACT_EMAIL}>{CONTACT_EMAIL}</a>.
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Welcome block
  // -----------------------------------------------------------------------

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
        <div className="track">
          Track your referrals at <a href="https://adamftd.com/affiliate" target="_blank" rel="noopener">adamftd.com/affiliate</a>.
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Capture utilities
  // -----------------------------------------------------------------------

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
      return await html2canvas(clone, {
        width: w, height: h, scale: 1,
        backgroundColor: null, useCORS: true, allowTaint: true, logging: false,
      });
    } finally {
      document.body.removeChild(wrapper);
    }
  }

  function canvasToBlob(canvas, type) {
    return new Promise((resolve) => canvas.toBlob(resolve, type || 'image/png'));
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // -----------------------------------------------------------------------
  // Generator (post-gate)
  // -----------------------------------------------------------------------

  function Generator({ initialAff, adminMode, onLogout }) {
    const [aff, setAff] = useState(initialAff);
    const [mode, setMode] = useState('light');
    const [line, setLine] = useState(POSITIONING_LINES[0]);
    const [viewportW, setViewportW] = useState(window.innerWidth);
    const [welcomeOpen, setWelcomeOpen] = useState(true);
    const [progress, setProgress] = useState(null); // { current, total, stage }

    useEffect(() => {
      const onResize = () => setViewportW(window.innerWidth);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, []);

    // Wire the per-artboard "Download PNG" button (templates.jsx calls window.__downloadOne)
    useEffect(() => {
      window.__downloadOne = async (node, asset) => {
        try {
          const canvas = await captureNode(node, asset.w, asset.h);
          const blob = await canvasToBlob(canvas);
          triggerDownload(blob, asset.id + '_' + aff.code + '.png');
        } catch (e) {
          console.error('Capture failed', e);
          alert('Could not generate that PNG. Try again, or refresh the page.');
        }
      };
      return () => { delete window.__downloadOne; };
    }, [aff.code]);

    const dark = mode === 'dark';
    const maxArtboardW = Math.min(viewportW - 80, 1500);

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
          zip.file(asset.id + '_' + aff.code + '.png', blob);
          // Yield to the event loop so the progress UI repaints
          await new Promise(r => setTimeout(r, 30));
        }
        setProgress({ current: frames.length, total: frames.length, stage: 'Bundling ZIP' });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const today = new Date().toISOString().slice(0, 10);
        triggerDownload(zipBlob, 'adamftd_partner_kit_' + aff.code + '_' + today + '.zip');
      } catch (e) {
        console.error('ZIP failed', e);
        alert('ZIP generation failed. Try again, or use the per-asset Download PNG buttons.');
      } finally {
        setProgress(null);
      }
    }

    function adminUpdate(field, value) {
      if (field === 'code') setAff({ ...aff, code: normaliseCode(value) });
      else setAff({ ...aff, [field]: value });
    }

    return (
      <>
        {adminMode && (
          <div className="admin-banner">
            Admin override active {MIDDOT} affiliate fields are editable
          </div>
        )}
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
              <button className={mode === 'dark'  ? 'active' : ''} onClick={() => setMode('dark')}>Dark</button>
            </div>
            <button className="btn" onClick={downloadAllZip}>Download all (ZIP)</button>

            {adminMode && (
              <div className="admin-row">
                <div className="field">
                  <label>First name (admin)</label>
                  <input value={aff.first_name} onChange={(e) => adminUpdate('first_name', e.target.value)} />
                </div>
                <div className="field">
                  <label>Full name (admin)</label>
                  <input value={aff.full_name} onChange={(e) => adminUpdate('full_name', e.target.value)} />
                </div>
                <div className="field">
                  <label>Code (admin)</label>
                  <input className="code" value={aff.code} onChange={(e) => adminUpdate('code', e.target.value)} />
                </div>
                <button className="btn secondary" onClick={onLogout} style={{ marginLeft: 'auto' }}>Reset gate</button>
              </div>
            )}
          </div>
        </div>

        <div className="canvas">
          {welcomeOpen
            ? <Welcome aff={aff} onDismiss={() => setWelcomeOpen(false)} />
            : <button className="show-welcome-pill" onClick={() => setWelcomeOpen(true)}>Show welcome</button>
          }
          {groups.map(g => (
            <section className="section" key={g.name}>
              <header className="section-header">
                <h2>{g.name}</h2>
              </header>
              {g.items.map(asset => {
                const scale = Math.min(1, maxArtboardW / asset.w);
                return <window.AGK.Artboard key={asset.id} asset={asset} aff={aff} dark={dark} line={line} scale={scale} />;
              })}
            </section>
          ))}
        </div>

        {progress && (
          <div className="progress-overlay" role="alert" aria-live="polite">
            <div className="progress-card">
              <div className="label">Generating your ZIP</div>
              <div className="stage">{progress.stage}…</div>
              <div className="bar"><div className="bar-fill" style={{ width: ((progress.current / Math.max(progress.total, 1)) * 100).toFixed(1) + '%' }} /></div>
              <div className="count">{progress.current} of {progress.total}</div>
            </div>
          </div>
        )}
      </>
    );
  }

  // -----------------------------------------------------------------------
  // Root
  // -----------------------------------------------------------------------

  function App() {
    const urlParams = new URLSearchParams(window.location.search);
    const adminParam = urlParams.get('admin');
    const codeFromUrl = urlParams.get('code');
    const adminMode = adminParam != null && adminParam === ADMIN_KEY;

    // Admin override: skip the gate, start with a placeholder aff that admin can edit.
    const [aff, setAff] = useState(() => {
      if (adminMode) return { code: 'davidecollu', first_name: 'Davide', full_name: 'Davide Collu' };
      return null;
    });

    // Optional deep-link: ?code=davidecollu auto-resolves against the JSON.
    useEffect(() => {
      if (aff || adminMode || !codeFromUrl) return;
      (async () => {
        try {
          const res = await fetch('data/affiliates.json', { cache: 'no-cache' });
          if (!res.ok) return;
          const list = await res.json();
          const c = normaliseCode(codeFromUrl);
          const hit = list[c];
          if (hit) setAff({ code: c, first_name: hit.first_name, full_name: hit.full_name });
        } catch (_) { /* fall through to gate */ }
      })();
    }, []);

    if (!aff) return <Gate onResolve={setAff} prefill={codeFromUrl || ''} />;
    return <Generator initialAff={aff} adminMode={adminMode} onLogout={() => setAff(null)} />;
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
