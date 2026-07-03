/*
 * ADAMftd Partner Kit — Sub-affiliate referrals panel.
 *
 * Renders inside the dashboard "Sub-affiliate referrals" tile. The form
 * is connected to the signed-in affiliate: their access key (from the
 * gate, stored in localStorage) is sent with every request, and the
 * server derives the referring affiliate code from it. Each affiliate
 * sees a live list of the sub-affiliates they have referred.
 *
 * Exposed on window.AGK.SubAffiliatePanel.
 */
(function () {
  const { useState, useEffect, useCallback } = React;

  const STORAGE_KEY = 'adamftd_kit_key';
  const API = '/api/sub-affiliate';

  const RELATIONSHIPS = [
    'Direct business partner',
    'Client of mine',
    'Industry contact',
    'Personal referral',
    'Other',
  ];

  const STATUS_LABEL = {
    submitted: 'Submitted',
    reviewing: 'In review',
    approved: 'Approved',
    declined: 'Not a fit',
  };

  const EMPTY = {
    sub_name: '', sub_email: '', sub_company: '', sub_country: '',
    sub_phone: '', sub_website: '', sub_role: '',
    sub_target: '', sub_pitch: '', sub_relationship: '', notes: '',
  };

  function getKey() {
    try { return window.localStorage.getItem(STORAGE_KEY) || ''; }
    catch (_) { return ''; }
  }

  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch (_) { return iso || ''; }
  }

  function Field({ label, name, value, onChange, required, type, placeholder, help, textarea, options }) {
    const common = {
      id: 'subaff_' + name,
      name: name,
      value: value,
      onChange: (e) => onChange(name, e.target.value),
      placeholder: placeholder || '',
    };
    return (
      <div className="subaff-field">
        <label htmlFor={'subaff_' + name}>
          {label}{required && <span className="subaff-req"> *</span>}
        </label>
        {textarea
          ? <textarea {...common} rows={3} />
          : options
            ? (
              <select {...common}>
                <option value="">Select one</option>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            )
            : <input type={type || 'text'} {...common} />}
        {help && <div className="subaff-help">{help}</div>}
      </div>
    );
  }

  function SubAffiliatePanel({ aff }) {
    const affKey = getKey();
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [justSubmitted, setJustSubmitted] = useState(false);

    const load = useCallback(async () => {
      if (!affKey) { setLoading(false); setLoadError('no-key'); return; }
      setLoading(true); setLoadError(null);
      try {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'list', key: affKey }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error((data && data.error) || 'Could not load your referrals.');
        setReferrals(Array.isArray(data.referrals) ? data.referrals : []);
      } catch (e) {
        setLoadError(e.message || 'Could not load your referrals.');
      } finally {
        setLoading(false);
      }
    }, [affKey]);

    useEffect(() => { load(); }, [load]);

    function setField(name, val) {
      setForm((f) => ({ ...f, [name]: val }));
    }

    async function handleSubmit(e) {
      e.preventDefault();
      setSubmitError(null);
      const required = ['sub_name', 'sub_email', 'sub_company', 'sub_country', 'sub_target', 'sub_pitch'];
      if (required.some((k) => !String(form[k]).trim())) {
        setSubmitError('Please complete all required fields.');
        return;
      }
      setSubmitting(true);
      try {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'create', key: affKey, referral: form }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error((data && data.error) || 'Submission failed. Try again.');
        setReferrals(Array.isArray(data.referrals) ? data.referrals : referrals);
        setForm(EMPTY);
        setShowForm(false);
        setJustSubmitted(true);
        setTimeout(() => setJustSubmitted(false), 8000);
      } catch (e) {
        setSubmitError(e.message || 'Submission failed. Try again.');
      } finally {
        setSubmitting(false);
      }
    }

    if (!affKey) {
      return (
        <div className="subaff-empty">
          Sub-affiliate referrals open up once you are signed in with your access key.
          This panel is not available in the admin preview.
        </div>
      );
    }

    return (
      <div className="subaff">
        <p className="tile-intro">
          Refer trusted contacts as Tier 2 sub-affiliates under <strong>{aff.full_name}</strong>{' '}
          ({aff.code.toUpperCase()}). Every referral is logged against your code, so you can
          track it here. Once a sub-affiliate generates revenue, your commission share applies
          automatically.
        </p>

        {justSubmitted && (
          <div className="subaff-msg ok">
            Referral submitted. We will review it within one business day and contact the
            prospect directly. It now appears in your list below.
          </div>
        )}

        {!showForm && (
          <button type="button" className="btn" onClick={() => { setShowForm(true); setSubmitError(null); }}>
            Refer a new sub-affiliate
          </button>
        )}

        {showForm && (
          <form className="subaff-form" onSubmit={handleSubmit}>
            <div className="subaff-form-head">Prospective sub-affiliate</div>
            <Field label="Full name" name="sub_name" value={form.sub_name} onChange={setField} required />
            <Field label="Email" name="sub_email" type="email" value={form.sub_email} onChange={setField} required />
            <Field label="Company" name="sub_company" value={form.sub_company} onChange={setField} required />
            <Field label="Country" name="sub_country" value={form.sub_country} onChange={setField} required />
            <Field label="Phone (incl. country code)" name="sub_phone" value={form.sub_phone} onChange={setField} placeholder="+44..." />
            <Field label="Website" name="sub_website" type="url" value={form.sub_website} onChange={setField} placeholder="https://" />
            <Field label="Role or title" name="sub_role" value={form.sub_role} onChange={setField} placeholder="e.g. Director, Head of Business Development" />

            <div className="subaff-form-head">Commercial fit</div>
            <Field
              label="Target market or industry vertical" name="sub_target"
              value={form.sub_target} onChange={setField} required
              placeholder="e.g. EU commodity traders, GCC trade finance, ASEAN logistics"
            />
            <Field
              label="Why they are a strong fit" name="sub_pitch" textarea required
              value={form.sub_pitch} onChange={setField}
              placeholder="What network do they bring? What revenue potential do you see? What is their existing book of clients or prospects?"
            />
            <Field
              label="Your relationship with this prospect" name="sub_relationship"
              value={form.sub_relationship} onChange={setField} options={RELATIONSHIPS}
            />
            <Field
              label="Anything else we should know" name="notes" textarea
              value={form.notes} onChange={setField}
              placeholder="Timeline, urgency, language preference, special considerations..."
            />

            {submitError && <div className="subaff-msg err">{submitError}</div>}

            <div className="subaff-actions">
              <button
                type="button" className="subaff-ghost"
                onClick={() => { setShowForm(false); setForm(EMPTY); setSubmitError(null); }}
              >Cancel</button>
              <button type="submit" className="btn" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit referral'}
              </button>
            </div>
          </form>
        )}

        <div className="subaff-list-head">
          Your referrals{referrals.length ? ' (' + referrals.length + ')' : ''}
        </div>

        {loading && <div className="subaff-empty">Loading your referrals...</div>}
        {!loading && loadError && loadError !== 'no-key' && (
          <div className="subaff-msg err">
            {loadError}{' '}
            <button type="button" className="subaff-link" onClick={load}>Retry</button>
          </div>
        )}
        {!loading && !loadError && referrals.length === 0 && (
          <div className="subaff-empty">
            No referrals yet. Use the button above to refer your first sub-affiliate.
          </div>
        )}

        {referrals.length > 0 && (
          <div className="subaff-list">
            {referrals.map((r) => (
              <div className="subaff-item" key={r.id}>
                <div className="subaff-item-main">
                  <span className="subaff-item-company">{r.sub_company || r.sub_name}</span>
                  <span className={'subaff-status status-' + (r.status || 'submitted')}>
                    {STATUS_LABEL[r.status] || 'Submitted'}
                  </span>
                </div>
                <div className="subaff-item-meta">
                  {[r.sub_name, r.sub_country, r.sub_target].filter(Boolean).join(' · ')}
                </div>
                <div className="subaff-item-date">Submitted {fmtDate(r.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  window.AGK = window.AGK || {};
  window.AGK.SubAffiliatePanel = SubAffiliatePanel;
})();
