/*
 * ADAMftd Partner Kit — admin dashboard.
 *
 * Tabs: Affiliates, Co-Branded Partners.
 * Auth: POST /api/admin/login with the ADMIN_PASSWORD; token kept in sessionStorage.
 */
(function () {
  const { useState, useEffect, useMemo, useRef, useCallback } = React;

  const TOKEN_KEY = 'adamftd_admin_token';
  const TOKEN_EXP_KEY = 'adamftd_admin_token_exp';

  function getToken() {
    const t = sessionStorage.getItem(TOKEN_KEY);
    const exp = parseInt(sessionStorage.getItem(TOKEN_EXP_KEY) || '0', 10);
    if (!t || !exp || Date.now() >= exp) { clearToken(); return null; }
    return t;
  }
  function setToken(token, expiresInSec) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(TOKEN_EXP_KEY, String(Date.now() + (expiresInSec - 60) * 1000));
  }
  function clearToken() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXP_KEY);
  }

  async function apiCall(path, opts = {}) {
    const token = getToken();
    const headers = { ...(opts.headers || {}) };
    if (token) headers.authorization = 'Bearer ' + token;
    if (opts.body && typeof opts.body !== 'string') {
      headers['content-type'] = 'application/json';
      opts.body = JSON.stringify(opts.body);
    }
    const res = await fetch(path, { ...opts, headers });
    let data = null;
    try { data = await res.json(); } catch (_) { data = null; }
    if (res.status === 401) { clearToken(); throw new Error('Session expired. Please log in again.'); }
    if (!res.ok) throw new Error(data?.error || ('Request failed (' + res.status + ')'));
    return data;
  }

  function fmtDate(iso) {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toISOString().slice(0, 10);
    } catch (_) { return '-'; }
  }

  function normaliseCode(raw) {
    return (raw || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  // ---------- Toast manager (very simple) ----------
  let toastCount = 0;
  function useToasts() {
    const [items, setItems] = useState([]);
    const push = (kind, msg, ms = 3500) => {
      const id = ++toastCount;
      setItems((x) => [...x, { id, kind, msg }]);
      setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), ms);
    };
    return { items, push };
  }
  function ToastTray({ items }) {
    return (
      <div className="toasts">
        {items.map(t => <div key={t.id} className={'toast ' + t.kind}>{t.msg}</div>)}
      </div>
    );
  }

  // ---------- Login ----------
  function Login({ onSuccess }) {
    const [pw, setPw] = useState('');
    const [err, setErr] = useState(null);
    const [busy, setBusy] = useState(false);
    async function submit(e) {
      e.preventDefault();
      setErr(null); setBusy(true);
      try {
        const r = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ password: pw }),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || 'Login failed');
        setToken(data.token, data.expiresIn || 8 * 60 * 60);
        onSuccess();
      } catch (e) { setErr(e.message); }
      finally { setBusy(false); }
    }
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <div className="grad" />
          <div className="label">ADAMftd Partner Kit</div>
          <h1>Admin sign-in</h1>
          <form onSubmit={submit} autoComplete="off">
            <input type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Admin password" aria-label="Admin password" />
            <button type="submit" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
          </form>
          {err && <div className="err">{err}</div>}
        </div>
      </div>
    );
  }

  // ---------- Shared modal shell ----------
  function Modal({ title, onClose, children, foot }) {
    useEffect(() => {
      const onKey = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);
    return (
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal">
          <div className="modal-head">
            <h2>{title}</h2>
            <button className="x" onClick={onClose} aria-label="Close">×</button>
          </div>
          <div className="modal-body">{children}</div>
          {foot && <div className="modal-foot">{foot}</div>}
        </div>
      </div>
    );
  }

  function personalUrl(accessKey) {
    return window.location.origin + '/?key=' + accessKey;
  }

  async function copyToClipboard(text, toast, label) {
    try {
      await navigator.clipboard.writeText(text);
      toast('ok', label + ' copied');
    } catch (e) {
      toast('err', 'Could not copy. Long-press to select and copy manually.');
    }
  }

  // ---------- Affiliate edit form ----------
  function AffiliateModal({ editing, onClose, onSave, toast }) {
    const isNew = !editing?.code || editing.__new;
    const [code, setCode] = useState(editing?.code || '');
    const [firstName, setFirstName] = useState(editing?.first_name || '');
    const [fullName, setFullName] = useState(editing?.full_name || '');
    const [status, setStatus] = useState(editing?.status || 'active');
    const [notes, setNotes] = useState(editing?.notes || '');
    const [email, setEmail] = useState(editing?.email || '');
    const [mobile, setMobile] = useState(editing?.mobile_e164 || '');
    const [waValidated, setWaValidated] = useState(!!editing?.wa_validated);
    const [accessKey, setAccessKey] = useState(editing?.access_key || '');
    const [err, setErr] = useState(null);
    const [busy, setBusy] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [regenBusy, setRegenBusy] = useState(false);

    async function submit() {
      setErr(null); setBusy(true);
      try {
        const c = normaliseCode(code);
        if (!c) throw new Error('Code is required.');
        if (!firstName.trim()) throw new Error('First name is required.');
        if (!fullName.trim()) throw new Error('Full name is required.');
        const body = {
          code: c,
          first_name: firstName.trim(),
          full_name: fullName.trim(),
          status,
          notes: notes.trim(),
          email: email.trim().toLowerCase(),
          mobile_e164: mobile.trim(),
          wa_validated: !!waValidated,
        };
        if (isNew) {
          const r = await apiCall('/api/admin/affiliates', { method: 'POST', body });
          // Newly created — show the access key prominently so admin can copy it
          if (r?.affiliate?.access_key) {
            setAccessKey(r.affiliate.access_key);
            setShowKey(true);
            toast('ok', 'Created. Copy the personal URL before closing.');
            return; // Don't auto-close — admin needs the key
          }
        } else {
          await apiCall('/api/admin/affiliates', { method: 'PUT', body });
        }
        onSave();
      } catch (e) { setErr(e.message); }
      finally { setBusy(false); }
    }

    async function regenKey() {
      if (!confirm('Regenerate the access key? The current key will stop working immediately. Make sure you send the new personal URL to the affiliate.')) return;
      setRegenBusy(true); setErr(null);
      try {
        const r = await apiCall('/api/admin/affiliates', { method: 'POST', body: { op: 'regen_key', code } });
        setAccessKey(r.access_key);
        setShowKey(true);
        toast('ok', 'New access key generated. Copy the URL now.');
      } catch (e) { setErr(e.message); }
      finally { setRegenBusy(false); }
    }

    const url = accessKey ? personalUrl(accessKey) : '';

    return (
      <Modal
        title={isNew ? 'Add affiliate' : 'Edit affiliate'}
        onClose={onClose}
        foot={
          <>
            <button className="btn-secondary" onClick={onClose} disabled={busy}>{accessKey && isNew ? 'Done' : 'Cancel'}</button>
            {!(accessKey && isNew) && <button className="btn-primary" onClick={submit} disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>}
          </>
        }
      >
        <div className="row">
          <label>Code (public — used in referral URLs)</label>
          <input type="text" className="mono" value={code} onChange={(e) => setCode(e.target.value)} disabled={!isNew || !!accessKey} placeholder="lowercase-hyphens" />
          <div className="hint">Lowercase letters, digits, hyphens. Cannot be changed after creation.</div>
        </div>
        <div className="row">
          <label>First name</label>
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Davide" />
        </div>
        <div className="row">
          <label>Full name</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Davide Collu" />
        </div>
        <div className="row">
          <label>Email (optional)</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
        </div>
        <div className="row">
          <label>Mobile (E.164, optional, e.g. +447988540154)</label>
          <input
            type="text"
            className="mono"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="+44..."
          />
          <div className="hint">Used for the affiliate WhatsApp group. Must start with + and country code.</div>
        </div>
        <div className="row" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox"
            id="wa-validated-cb"
            checked={waValidated}
            onChange={(e) => setWaValidated(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <label htmlFor="wa-validated-cb" style={{ margin: 0, cursor: 'pointer' }}>WhatsApp validated (internal flag)</label>
        </div>
        <div className="row">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="suspended">Suspended (hidden from gate)</option>
          </select>
        </div>

        {accessKey && (
          <div className="key-panel">
            <div className="key-panel-head">
              <span className="key-panel-label">Access key (private — send only to this affiliate)</span>
              <button type="button" className="link-btn" onClick={() => setShowKey(!showKey)}>{showKey ? 'Hide' : 'Show'}</button>
            </div>
            <input
              type="text"
              className="mono"
              readOnly
              value={showKey ? accessKey : accessKey.replace(/./g, '•')}
              onClick={(e) => e.target.select()}
            />
            <div className="key-panel-actions">
              <button type="button" className="btn-secondary" onClick={() => copyToClipboard(accessKey, toast, 'Access key')}>Copy key</button>
              <button type="button" className="btn-primary" onClick={() => copyToClipboard(url, toast, 'Personal URL')}>Copy personal URL</button>
              {!isNew && <button type="button" className="btn-danger" onClick={regenKey} disabled={regenBusy}>{regenBusy ? 'Regenerating...' : 'Regenerate key'}</button>}
            </div>
            <div className="hint">Personal URL: <span className="mono">{url}</span></div>
          </div>
        )}

        <div className="row">
          <label>Internal notes (admin only)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Applied via web form, qualified 2026-05-14" />
        </div>
        {err && <div className="err">{err}</div>}
      </Modal>
    );
  }

  // ---------- Co-branded edit form ----------
  function CobrandedModal({ editing, onClose, onSave }) {
    const isNew = !editing?.code || editing.__new;
    const [code, setCode] = useState(editing?.code || '');
    const [shortName, setShortName] = useState(editing?.short_name || '');
    const [fullName, setFullName] = useState(editing?.full_name || '');
    const [color, setColor] = useState(editing?.primary_color || '#1F3A5F');
    const [logoUrl, setLogoUrl] = useState(editing?.logo_url || '');
    const [status, setStatus] = useState(editing?.status || 'active');
    const [notes, setNotes] = useState(editing?.notes || '');
    const [err, setErr] = useState(null);
    const [busy, setBusy] = useState(false);

    async function submit() {
      setErr(null); setBusy(true);
      try {
        const c = normaliseCode(code);
        if (!c) throw new Error('Code is required.');
        if (!shortName.trim()) throw new Error('Short name is required.');
        if (shortName.length > 12) throw new Error('Short name must be 12 characters or fewer.');
        if (!fullName.trim()) throw new Error('Full name is required.');
        if (!/^#[0-9A-Fa-f]{6}$/.test(color)) throw new Error('Primary colour must be a 6-digit hex code, e.g. #1F3A5F.');
        const body = {
          code: c,
          short_name: shortName.trim(),
          full_name: fullName.trim(),
          primary_color: color,
          logo_url: logoUrl.trim() || null,
          status,
          notes: notes.trim(),
        };
        if (isNew) {
          await apiCall('/api/admin/cobranded', { method: 'POST', body });
        } else {
          await apiCall('/api/admin/cobranded', { method: 'PUT', body });
        }
        onSave();
      } catch (e) { setErr(e.message); }
      finally { setBusy(false); }
    }

    return (
      <Modal
        title={isNew ? 'Add co-branded partner' : 'Edit co-branded partner'}
        onClose={onClose}
        foot={
          <>
            <button className="btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="btn-primary" onClick={submit} disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
          </>
        }
      >
        <div className="row">
          <label>Code</label>
          <input type="text" className="mono" value={code} onChange={(e) => setCode(e.target.value)} disabled={!isNew} placeholder="aacc" />
          <div className="hint">Lowercase letters, digits, hyphens. The partner types this into the gate to enter co-brand mode.</div>
        </div>
        <div className="row">
          <label>Short name</label>
          <input type="text" maxLength={12} value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="AACC" />
          <div className="hint">Max 12 chars. Used in the dual-lockup graphic.</div>
        </div>
        <div className="row">
          <label>Full name</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Australia Africa Chamber of Commerce" />
        </div>
        <div className="row color">
          <label>Primary colour</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value.toUpperCase())} />
          <input type="text" className="mono" value={color} onChange={(e) => setColor(e.target.value)} placeholder="#1F3A5F" />
        </div>
        <div className="row">
          <label>Logo URL (read-only, set when partner uploads)</label>
          <input type="text" className="mono" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="(none — clear to force re-upload)" />
          <div className="hint">If you clear this, the partner must re-upload from the generator.</div>
        </div>
        <div className="row">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="suspended">Suspended (hidden from gate)</option>
          </select>
        </div>
        <div className="row">
          <label>Internal notes (admin only)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Contract signed 2026-05-10, primary contact: Jane Doe" />
        </div>
        {err && <div className="err">{err}</div>}
      </Modal>
    );
  }

  // ---------- Confirm dialog ----------
  function ConfirmModal({ title, message, onClose, onConfirm, busy }) {
    return (
      <Modal
        title={title}
        onClose={onClose}
        foot={
          <>
            <button className="btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="btn-danger" onClick={onConfirm} disabled={busy}>{busy ? 'Working...' : 'Delete'}</button>
          </>
        }
      >
        <div>{message}</div>
      </Modal>
    );
  }

  // ---------- Affiliates tab ----------
  function AffiliatesTab({ toast }) {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [csvOpen, setCsvOpen] = useState(false);
    const [csvText, setCsvText] = useState('');
    const [csvSummary, setCsvSummary] = useState(null);
    const [csvBusy, setCsvBusy] = useState(false);

    const load = useCallback(async () => {
      setLoading(true);
      try {
        const r = await apiCall('/api/admin/affiliates');
        setData(r.affiliates || {});
      } catch (e) { toast('err', e.message); }
      finally { setLoading(false); }
    }, [toast]);

    useEffect(() => { load(); }, [load]);

    const rows = useMemo(() => {
      const all = Object.entries(data).map(([code, e]) => ({ code, ...e }));
      all.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
      const q = search.trim().toLowerCase();
      if (!q) return all;
      return all.filter(r =>
        r.code.toLowerCase().includes(q) ||
        (r.first_name || '').toLowerCase().includes(q) ||
        (r.full_name || '').toLowerCase().includes(q)
      );
    }, [data, search]);

    async function confirmDelete() {
      if (!deleting) return;
      setDeleteBusy(true);
      try {
        await apiCall('/api/admin/affiliates', { method: 'DELETE', body: { code: deleting.code } });
        toast('ok', 'Deleted ' + deleting.code);
        setDeleting(null);
        load();
      } catch (e) { toast('err', e.message); }
      finally { setDeleteBusy(false); }
    }

    function exportCsv() {
      const headers = [
        'code', 'first_name', 'full_name', 'status',
        'email', 'mobile_e164', 'wa_validated',
        'access_key', 'personal_url',
      ];
      const lines = [headers.join(',')];
      for (const [code, e] of Object.entries(data)) {
        const url = e.access_key ? personalUrl(e.access_key) : '';
        const row = [
          code,
          e.first_name || '',
          e.full_name || '',
          e.status || 'active',
          e.email || '',
          e.mobile_e164 || '',
          e.wa_validated ? 'true' : 'false',
          e.access_key || '',
          url,
        ].map(s => {
          const v = String(s);
          return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
        });
        lines.push(row.join(','));
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'adamftd_affiliates_' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('ok', 'Exported ' + Object.keys(data).length + ' rows');
    }

    const [migBusy, setMigBusy] = useState(false);
    const [migResult, setMigResult] = useState(null);

    async function runMigration() {
      if (!confirm('Apply the v3 roster sync? Updates 14 names + creates up to 5 affiliates if missing (itc2026, valteo, aacc, futuretend-elmarie, abwci). Safe to run twice.')) return;
      setMigBusy(true); setMigResult(null);
      try {
        const r = await apiCall('/api/admin/migrate', {
          method: 'POST',
          body: { migration_id: 'v3-roster-sync-2026-05-14' },
        });
        setMigResult(r);
        toast('ok', 'Migration applied. ' + (r.summary.rows_updated ?? 0) + ' rows updated, ' + (r.summary.rows_created ?? 0) + ' created.');
        load();
      } catch (e) { toast('err', e.message); }
      finally { setMigBusy(false); }
    }

    async function importCsv() {
      setCsvBusy(true); setCsvSummary(null);
      try {
        const r = await apiCall('/api/admin/affiliates', { method: 'POST', body: { op: 'bulk_csv', csv: csvText } });
        setCsvSummary({ imported: r.imported, skipped: r.skipped, detail: r.skippedDetail || [] });
        toast('ok', 'Imported ' + r.imported + (r.skipped ? ' (' + r.skipped + ' skipped)' : ''));
        load();
      } catch (e) { toast('err', e.message); }
      finally { setCsvBusy(false); }
    }

    return (
      <>
        <div className="tbl-toolbar">
          <input className="search" placeholder="Search by code or name..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <span className="count">{rows.length} of {Object.keys(data).length}</span>
          <button className="btn-secondary" onClick={exportCsv}>Export CSV</button>
          <button className="btn-secondary" onClick={() => setCsvOpen(!csvOpen)}>{csvOpen ? 'Hide CSV import' : 'Bulk CSV import'}</button>
          <button className="btn-secondary" onClick={runMigration} disabled={migBusy}>{migBusy ? 'Running...' : 'Apply v3 roster sync'}</button>
          <button className="btn-primary" onClick={() => setEditing({ __new: true })}>+ Add affiliate</button>
        </div>

        {migResult && (
          <div className="csv-panel">
            <h3>Migration applied: {migResult.migration_id}</h3>
            <p className="sub">
              {migResult.summary.rows_updated ?? 0} rows updated,
              &nbsp;{migResult.summary.rows_already_correct ?? 0} already correct,
              &nbsp;{migResult.summary.rows_created ?? 0} created,
              &nbsp;total now {migResult.summary.total_in_blob ?? 0}.
              &nbsp;abwci co-branded: <strong>{migResult.cobranded_abwci}</strong>.
            </p>
            {migResult.name_updates_applied && migResult.name_updates_applied.length > 0 && (
              <details style={{ marginTop: 12 }}>
                <summary style={{ fontSize: 13, cursor: 'pointer' }}>Show {migResult.name_updates_applied.length} updated rows</summary>
                <ul style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', marginTop: 8 }}>
                  {migResult.name_updates_applied.map(u => (
                    <li key={u.code}><strong>{u.code}</strong> {u.full_name} <span style={{ color: 'rgba(15,27,45,0.5)' }}>({(u.changed || []).join(', ')})</span></li>
                  ))}
                </ul>
              </details>
            )}
            {migResult.created && migResult.created.length > 0 && (
              <>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--teal)', fontWeight: 600, margin: '14px 0 8px' }}>
                  New personal URLs (copy these and send to the affiliates)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {migResult.created.map(c => (
                    <div key={c.code} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'var(--paper)', borderRadius: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, wordBreak: 'break-all' }}>
                      <span style={{ flex: '0 0 200px', fontWeight: 600 }}>{c.code}</span>
                      <span style={{ flex: 1, color: 'rgba(15,27,45,0.7)' }}>{personalUrl(c.access_key)}</span>
                      <button type="button" className="btn-secondary" onClick={() => copyToClipboard(personalUrl(c.access_key), toast, c.code + ' personal URL')}>Copy</button>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="actions">
              <button className="btn-secondary" onClick={() => setMigResult(null)}>Dismiss</button>
            </div>
          </div>
        )}

        {csvOpen && (
          <div className="csv-panel">
            <h3>Bulk CSV import</h3>
            <p className="sub">Paste rows in <code>code,first_name,full_name</code> format. Header line is optional. Existing codes are updated, new codes are added.</p>
            <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder={'code,first_name,full_name\ndavidecollu,Davide,Davide Collu\nisrmp-org,Ron,Ron Mathews'} />
            <div className="actions">
              <button className="btn-primary" onClick={importCsv} disabled={csvBusy || !csvText.trim()}>{csvBusy ? 'Importing...' : 'Import'}</button>
              {csvSummary && (
                <span className="summary"><strong>{csvSummary.imported}</strong> imported, <strong>{csvSummary.skipped}</strong> skipped{csvSummary.detail.length > 0 ? ' (see console)' : ''}</span>
              )}
            </div>
            {csvSummary?.detail?.length > 0 && (() => { console.table(csvSummary.detail); return null; })()}
          </div>
        )}

        <table className="tbl">
          <thead>
            <tr>
              <th>Code</th>
              <th>First name</th>
              <th>Full name</th>
              <th>Mobile (E.164)</th>
              <th>Access</th>
              <th>Status</th>
              <th>Last modified</th>
              <th style={{ width: 150, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="empty-row">Loading...</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={8} className="empty-row">No affiliates match your search.</td></tr>}
            {!loading && rows.map((r) => (
              <tr key={r.code}>
                <td className="mono">{r.code}</td>
                <td>{r.first_name}</td>
                <td>{r.full_name}</td>
                <td className="mono" style={{ color: r.mobile_e164 ? 'var(--ink)' : 'rgba(15,27,45,0.4)' }}>
                  {r.mobile_e164 || <span title="No phone on file">—</span>}
                  {r.wa_validated && <span title="WhatsApp validated" style={{ marginLeft: 6, color: 'var(--teal)' }}>✓</span>}
                </td>
                <td className="mono key-cell">
                  {r.access_key
                    ? <span title="Access key (truncated for privacy)">•••{String(r.access_key).slice(-4)}</span>
                    : <span style={{ color: 'rgba(208,74,59,0.7)' }}>missing</span>}
                </td>
                <td><span className={'status-badge status-' + (r.status || 'active')}>{r.status || 'active'}</span></td>
                <td className="mono">{fmtDate(r.updated_at)}</td>
                <td className="actions">
                  {r.access_key && (
                    <button
                      className="icon-btn"
                      onClick={() => copyToClipboard(personalUrl(r.access_key), toast, 'Personal URL')}
                      aria-label="Copy personal URL"
                      title="Copy personal URL"
                    >🔗</button>
                  )}
                  <button className="icon-btn" onClick={() => setEditing(r)} aria-label="Edit">✎</button>
                  <button className="icon-btn danger" onClick={() => setDeleting(r)} aria-label="Delete">🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {editing && (
          <AffiliateModal
            editing={editing}
            toast={toast}
            onClose={() => setEditing(null)}
            onSave={() => { setEditing(null); toast('ok', 'Saved'); load(); }}
          />
        )}
        {deleting && (
          <ConfirmModal
            title="Delete affiliate"
            message={<>Delete <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>{deleting.code}</code> ({deleting.full_name})? This cannot be undone. Their existing graphics still work, but the code will no longer pass the gate.</>}
            onClose={() => setDeleting(null)}
            onConfirm={confirmDelete}
            busy={deleteBusy}
          />
        )}
      </>
    );
  }

  // ---------- Co-Branded tab ----------
  function CobrandedTab({ toast }) {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const load = useCallback(async () => {
      setLoading(true);
      try {
        const r = await apiCall('/api/admin/cobranded');
        setData(r.cobranded || {});
      } catch (e) { toast('err', e.message); }
      finally { setLoading(false); }
    }, [toast]);

    useEffect(() => { load(); }, [load]);

    const rows = useMemo(() => {
      const all = Object.entries(data).map(([code, e]) => ({ code, ...e }));
      all.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
      const q = search.trim().toLowerCase();
      if (!q) return all;
      return all.filter(r =>
        r.code.toLowerCase().includes(q) ||
        (r.short_name || '').toLowerCase().includes(q) ||
        (r.full_name || '').toLowerCase().includes(q)
      );
    }, [data, search]);

    async function confirmDelete() {
      if (!deleting) return;
      setDeleteBusy(true);
      try {
        await apiCall('/api/admin/cobranded', { method: 'DELETE', body: { code: deleting.code } });
        toast('ok', 'Deleted ' + deleting.code);
        setDeleting(null);
        load();
      } catch (e) { toast('err', e.message); }
      finally { setDeleteBusy(false); }
    }

    return (
      <>
        <div className="tbl-toolbar">
          <input className="search" placeholder="Search by code or name..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <span className="count">{rows.length} of {Object.keys(data).length}</span>
          <button className="btn-primary" onClick={() => setEditing({ __new: true })}>+ Add partner</button>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th>Code</th>
              <th>Short name</th>
              <th>Full name</th>
              <th>Primary colour</th>
              <th>Status</th>
              <th>Last modified</th>
              <th style={{ width: 110, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="empty-row">Loading...</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={7} className="empty-row">No partners match your search.</td></tr>}
            {!loading && rows.map((r) => (
              <tr key={r.code}>
                <td className="mono">{r.code}</td>
                <td>{r.short_name}</td>
                <td>{r.full_name}</td>
                <td className="mono"><span className="swatch" style={{ background: r.primary_color }} />{r.primary_color}</td>
                <td><span className={'status-badge status-' + (r.status || 'active')}>{r.status || 'active'}</span></td>
                <td className="mono">{fmtDate(r.updated_at)}</td>
                <td className="actions">
                  <button className="icon-btn" onClick={() => setEditing(r)} aria-label="Edit">✎</button>
                  <button className="icon-btn danger" onClick={() => setDeleting(r)} aria-label="Delete">🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {editing && (
          <CobrandedModal
            editing={editing}
            onClose={() => setEditing(null)}
            onSave={() => { setEditing(null); toast('ok', 'Saved'); load(); }}
          />
        )}
        {deleting && (
          <ConfirmModal
            title="Delete co-branded partner"
            message={<>Delete <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>{deleting.code}</code> ({deleting.full_name})? This will disable co-brand mode for that code.</>}
            onClose={() => setDeleting(null)}
            onConfirm={confirmDelete}
            busy={deleteBusy}
          />
        )}
      </>
    );
  }

  // ---------- Promotions tab ----------
  function PromotionsTab({ toast }) {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState(null);

    const load = useCallback(async () => {
      setLoading(true); setErr(null);
      try {
        const r = await apiCall('/api/admin/promotions');
        setData(r.promotions || {});
      } catch (e) { setErr(e.message); toast('err', e.message); }
      finally { setLoading(false); }
    }, [toast]);

    useEffect(() => { load(); }, [load]);

    function updateField(id, field, value) {
      setData(d => ({ ...d, [id]: { ...d[id], [field]: value } }));
    }

    async function save() {
      setSaving(true); setErr(null);
      try {
        await apiCall('/api/admin/promotions', { method: 'PUT', body: { promotions: data } });
        toast('ok', 'Promotions saved. Live within ~5 seconds.');
        load();
      } catch (e) { setErr(e.message); toast('err', e.message); }
      finally { setSaving(false); }
    }

    const ordered = Object.entries(data).sort((a, b) => (a[1].order ?? 99) - (b[1].order ?? 99));

    return (
      <>
        <div className="tbl-toolbar">
          <span className="count">{ordered.length} promotion{ordered.length === 1 ? '' : 's'}</span>
          <button className="btn-primary" onClick={save} disabled={saving || loading}>{saving ? 'Saving...' : 'Save all'}</button>
        </div>

        <div className="promo-form">
          {loading && <div className="empty-row">Loading...</div>}
          {!loading && ordered.length === 0 && <div className="empty-row">No promotions configured.</div>}
          {!loading && ordered.map(([id, entry]) => (
            <div key={id} className="promo-card">
              <div className="promo-card-head">
                <span className="promo-card-id">{id}</span>
                <label className="promo-toggle">
                  <input
                    type="checkbox"
                    checked={entry.enabled !== false}
                    onChange={(e) => updateField(id, 'enabled', e.target.checked)}
                  />
                  <span>{entry.enabled !== false ? 'Enabled' : 'Disabled (hidden from kit)'}</span>
                </label>
              </div>
              <div className="row">
                <label>Headline (max 80 chars)</label>
                <input
                  type="text"
                  maxLength={80}
                  value={entry.headline || ''}
                  onChange={(e) => updateField(id, 'headline', e.target.value)}
                  placeholder="e.g. 50 bonus credits at signup"
                />
                <div className="hint">{(entry.headline || '').length}/80</div>
              </div>
              <div className="row">
                <label>Detail (max 200 chars, optional)</label>
                <textarea
                  maxLength={200}
                  value={entry.detail || ''}
                  onChange={(e) => updateField(id, 'detail', e.target.value)}
                  placeholder="e.g. Double the default 25 credits."
                />
                <div className="hint">{(entry.detail || '').length}/200</div>
              </div>
              <div className="row" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <label style={{ margin: 0 }}>Display order</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={entry.order ?? 99}
                  onChange={(e) => updateField(id, 'order', parseInt(e.target.value, 10) || 99)}
                  style={{ width: 80 }}
                />
              </div>
            </div>
          ))}
          {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}
        </div>
      </>
    );
  }

  // ---------- Sub-affiliate referral view ----------
  const REFERRAL_STATUS = [
    { value: 'submitted', label: 'Submitted' },
    { value: 'reviewing', label: 'In review' },
    { value: 'approved',  label: 'Approved' },
    { value: 'declined',  label: 'Not a fit' },
  ];

  function ReferralModal({ referral, onClose }) {
    const r = referral || {};
    function Row({ label, value }) {
      if (!value) return null;
      return (
        <div className="row">
          <label>{label}</label>
          <div className="ref-view-val">{value}</div>
        </div>
      );
    }
    return (
      <Modal
        title={'Referral: ' + (r.sub_company || r.sub_name || 'sub-affiliate')}
        onClose={onClose}
        foot={<button className="btn-secondary" onClick={onClose}>Close</button>}
      >
        <Row label="Referred by" value={(r.ma_name ? r.ma_name + ' ' : '') + '(' + (r.ma_code || '') + ')'} />
        <Row label="Submitted" value={fmtDate(r.created_at)} />
        <Row label="Current status" value={(REFERRAL_STATUS.find(s => s.value === r.status) || {}).label || 'Submitted'} />
        <Row label="Sub-affiliate name" value={r.sub_name} />
        <Row label="Company" value={r.sub_company} />
        <Row label="Email" value={r.sub_email} />
        <Row label="Country" value={r.sub_country} />
        <Row label="Phone" value={r.sub_phone} />
        <Row label="Website" value={r.sub_website} />
        <Row label="Role or title" value={r.sub_role} />
        <Row label="Target market / vertical" value={r.sub_target} />
        <Row label="Why they are a strong fit" value={r.sub_pitch} />
        <Row label="Relationship to the affiliate" value={r.sub_relationship} />
        <Row label="Other notes" value={r.notes} />
      </Modal>
    );
  }

  // ---------- Referrals tab ----------
  function ReferralsTab({ toast }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [viewing, setViewing] = useState(null);
    const [savingId, setSavingId] = useState(null);

    const load = useCallback(async () => {
      setLoading(true);
      try {
        const r = await apiCall('/api/admin/referrals');
        setData(Array.isArray(r.referrals) ? r.referrals : []);
      } catch (e) { toast('err', e.message); }
      finally { setLoading(false); }
    }, [toast]);

    useEffect(() => { load(); }, [load]);

    const rows = useMemo(() => {
      const q = search.trim().toLowerCase();
      if (!q) return data;
      return data.filter((r) =>
        [r.ma_code, r.ma_name, r.sub_name, r.sub_company, r.sub_email, r.sub_country, r.sub_target]
          .some((v) => String(v || '').toLowerCase().includes(q))
      );
    }, [data, search]);

    async function changeStatus(r, status) {
      setSavingId(r.id);
      setData((d) => d.map((x) => (x.id === r.id ? { ...x, status } : x)));
      try {
        await apiCall('/api/admin/referrals', {
          method: 'PUT',
          body: { affiliate_code: r.ma_code, referral_id: r.id, status },
        });
        toast('ok', 'Status updated');
      } catch (e) {
        toast('err', e.message);
        load();
      } finally {
        setSavingId(null);
      }
    }

    return (
      <>
        <div className="tbl-toolbar">
          <input
            className="search"
            placeholder="Search by affiliate, company, name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="count">{rows.length} of {data.length}</span>
          <button className="btn-secondary" onClick={load} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th>Affiliate</th>
              <th>Sub-affiliate</th>
              <th>Email</th>
              <th>Target market</th>
              <th>Submitted</th>
              <th style={{ width: 130 }}>Status</th>
              <th style={{ width: 80, textAlign: 'right' }}>View</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="empty-row">Loading...</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={7} className="empty-row">No sub-affiliate referrals yet.</td></tr>}
            {!loading && rows.map((r) => (
              <tr key={r.id}>
                <td className="mono">{r.ma_code}</td>
                <td>
                  {r.sub_company || '-'}
                  <div style={{ fontSize: 12, color: 'rgba(15,27,45,0.55)' }}>{r.sub_name}</div>
                </td>
                <td className="mono" style={{ fontSize: 12 }}>{r.sub_email}</td>
                <td>{r.sub_target}</td>
                <td className="mono">{fmtDate(r.created_at)}</td>
                <td>
                  <select
                    className="status-select"
                    value={r.status || 'submitted'}
                    disabled={savingId === r.id}
                    onChange={(e) => changeStatus(r, e.target.value)}
                  >
                    {REFERRAL_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </td>
                <td className="actions">
                  <button className="icon-btn" onClick={() => setViewing(r)} aria-label="View" title="View full referral">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {viewing && <ReferralModal referral={viewing} onClose={() => setViewing(null)} />}
      </>
    );
  }

  // ---------- Root ----------
  function App() {
    const [authed, setAuthed] = useState(() => !!getToken());
    const [tab, setTab] = useState('affiliates');
    const { items, push } = useToasts();

    function logout() { clearToken(); setAuthed(false); }

    if (!authed) return (
      <>
        <Login onSuccess={() => setAuthed(true)} />
        <ToastTray items={items} />
      </>
    );

    return (
      <>
        <div className="admin-bar">
          <div className="admin-bar-inner">
            <h1>ADAMftd Partner Kit</h1>
            <span className="crumb">Admin</span>
            <button className="logout" onClick={logout}>Sign out</button>
          </div>
        </div>
        <div className="admin-shell">
          <div className="tabs">
            <button className={tab === 'affiliates' ? 'active' : ''} onClick={() => setTab('affiliates')}>Affiliates</button>
            <button className={tab === 'cobranded' ? 'active' : ''} onClick={() => setTab('cobranded')}>Co-branded partners</button>
            <button className={tab === 'promotions' ? 'active' : ''} onClick={() => setTab('promotions')}>Promotions</button>
            <button className={tab === 'referrals' ? 'active' : ''} onClick={() => setTab('referrals')}>Sub-affiliate referrals</button>
          </div>
          {tab === 'affiliates' && <AffiliatesTab toast={push} />}
          {tab === 'cobranded' && <CobrandedTab toast={push} />}
          {tab === 'promotions' && <PromotionsTab toast={push} />}
          {tab === 'referrals' && <ReferralsTab toast={push} />}
        </div>
        <ToastTray items={items} />
      </>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
