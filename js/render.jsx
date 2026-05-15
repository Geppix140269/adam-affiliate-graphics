/*
 * Render route. Loads a SINGLE banner from URL params and renders it at
 * native resolution. Puppeteer (server-side) visits this URL and screenshots
 * the #render-root element to produce a Chrome-native-rendered PNG that
 * LinkedIn accepts.
 *
 * URL params:
 *   asset        - asset id (linkedin_banner / x_header / facebook_cover / zoom_background)
 *   code         - affiliate code
 *   first_name   - affiliate first name
 *   full_name    - affiliate full name
 *   mode         - 'dark' or 'light' (default 'light')
 *   line         - optional hero headline override
 *   cb_short     - optional cobrand partner short name
 *   cb_full      - optional cobrand partner full name
 *   cb_color     - optional cobrand primary hex colour
 *   cb_hero      - optional cobrand custom hero headline
 *   (cobrand logo upload is NOT passed via URL — too long. Server-rendered
 *    covers use partner short_name text as fallback.)
 *
 * Signals readiness for screenshot via document.body.dataset.ready = '1'.
 */
(function () {
  const { ASSETS } = window.AGK;
  const params = new URLSearchParams(window.location.search);

  function abort(msg) {
    document.body.innerHTML = '<pre style="font:14px monospace;padding:24px;color:#c00">' + msg + '</pre>';
    document.body.setAttribute('data-error', '1');
  }

  const id = params.get('asset');
  const asset = ASSETS.find(a => a.id === id);
  if (!asset) return abort('Unknown asset: ' + id);

  const aff = {
    code: params.get('code') || 'demo',
    first_name: params.get('first_name') || 'Demo',
    full_name: params.get('full_name') || 'Demo Demo',
  };

  const mode = params.get('mode') === 'dark' ? 'dark' : 'light';
  const dark = mode === 'dark';
  const line = params.get('line') || undefined;

  let cobrand = null;
  if (params.get('cb_short')) {
    cobrand = {
      partner: {
        short_name: params.get('cb_short'),
        full_name: params.get('cb_full') || params.get('cb_short'),
        primary_color: params.get('cb_color') || '#1F3A5F',
        logo_url: null, // Server render uses text fallback for partner identity
      },
      hero_override: params.get('cb_hero') || '',
    };
  }

  const compProps = { aff, cobrand };
  if (!asset.noDark) compProps.dark = asset.forceLight ? false : asset.forceDark ? true : dark;
  if (asset.useLine) compProps.line = line;
  // Promos are not passed to server-rendered covers — they're already in the
  // template's default rendering path via the LinkedInBanner component
  // checking the promos prop (omitted = no perks line).
  // For the LinkedIn cover specifically we DO want perks. Read from URL.
  if (asset.usePromos) {
    // Encode perks as a single CSV-ish list in URL, e.g. ?promos=h1|d1,h2|d2,h3|d3
    const promosRaw = params.get('promos');
    if (promosRaw) {
      const items = promosRaw.split(',').map((s, i) => {
        const [headline, detail] = s.split('|');
        return { id: 'p' + i, headline: (headline || '').trim(), detail: (detail || '').trim() };
      }).filter(p => p.headline);
      if (items.length) compProps.promos = items;
    }
  }

  const Comp = asset.Comp;
  ReactDOM.createRoot(document.getElementById('render-root')).render(<Comp {...compProps} />);

  // Mark ready once fonts AND images have loaded.
  (async () => {
    try {
      // Wait for webfonts to load (Inter, JetBrains Mono)
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      // Wait for all images in the rendered tree to finish loading
      const imgs = document.querySelectorAll('#render-root img');
      await Promise.all([...imgs].map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        });
      }));
      // Small grace period for any final paint/layout
      await new Promise(r => setTimeout(r, 200));
      document.body.setAttribute('data-ready', '1');
    } catch (e) {
      console.error('render readiness check failed', e);
      document.body.setAttribute('data-ready', '1'); // proceed anyway
    }
  })();
})();
