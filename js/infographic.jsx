/*
 * Affiliate Kit Asset #16 — Partner One-Pager.
 *
 * A deterministic, website-rendered HTML/CSS one-pager (NOT an AI image):
 * all text is real DOM text so affiliate names, codes and links are always
 * correct. Faithful build of Giuseppe's official partner-onepager.html +
 * partner-onepager.css (the CSS lives in css/partner-onepager.css, scoped
 * under .onepager).
 *
 * Dynamic fields injected per affiliate:
 *   affiliate_name   - aff.full_name
 *   affiliate_entity - derived from the code (title-cased; 2-letter tokens
 *                      treated as uppercase country codes)
 *   affiliate_code   - aff.code.toUpperCase()
 *   referral_link    - ADAMftd.com/ref/{code}
 *
 * Registered into window.AGK.ASSETS as id 'partner_onepager',
 * group 'Partner one-pager'.
 */
(function () {
  const AGK = window.AGK || {};

  const W = 1200;
  const H = 1800;

  // Derive a presentable entity name from the affiliate code.
  // buddystore-my -> "Buddystore MY", rizwan-pk -> "Rizwan PK",
  // groupecanal -> "Groupecanal". A real entity field can be added to the
  // schema later if exact names are needed.
  function deriveEntity(code) {
    return String(code || '')
      .split('-')
      .filter(Boolean)
      .map((p) => (p.length <= 2 ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1)))
      .join(' ');
  }

  const TOOLS = [
    'Trade Data (Shipments & Declarations)',
    'HS Codes, Tariffs & Landed Costs',
    'Sanctions Screening',
    'Global Tender Intelligence',
    'Vessels & Ports Intelligence',
    'Trade Companies Finder',
    'Company Lookup',
    'Countries & Markets',
    'Market Reports',
    'Market Analytics',
    'Enrichment & Verification',
    'Scenario Simulator',
    'Search History',
  ];

  const MARKET_OVERVIEW = [
    'Retail Snapshot, channels, prices, labels',
    'Market Size & Demand, size, trends, forecasts',
    'Consumer Preferences, behaviours, segments',
    'Sentiment Analysis, AI sentiment, opinions',
    'Seasonal Demand Intelligence, month-by-month KPIs',
    'Local Production Overview, capacity, competitors',
  ];

  const TRADE_READINESS = [
    'Substitutes & Competitors, threat levels',
    'SWOT Analysis, for this product & market',
    'Market Entry Barriers, licensing, quota, lead times',
    'Packaging & Labelling, country requirements',
    'Quality Standards & Certifications, compliance',
  ];

  const START_LIST = [
    '50 signup credits (25 standard + 25 partner)',
    '$50 off your first paid month',
    'Free Market Report with annual Pro signup',
    'Access to platform tools and trade workflows',
    'No credit card required for free signup',
  ];

  function ProductInfographic({ aff }) {
    const name = aff.full_name;
    const entity = deriveEntity(aff.code);
    const codeUpper = aff.code.toUpperCase();
    const refLink = 'ADAMftd.com/ref/' + aff.code;

    return (
      <div className="onepager">
        {/* HERO */}
        <section className="hero">
          <div className="brand-panel">
            <img
              className="partner-logo"
              src="assets/ADAMftd_Independent_Partner.png"
              alt="ADAMftd Independent Partner"
              crossOrigin="anonymous"
              draggable={false}
            />
          </div>
          <div className="hero-copy">
            <div className="eyebrow">AI-NATIVE TRADE INTELLIGENCE</div>
            <h1>GROUNDED IN<br />SOURCE DATA</h1>
            <p>Real trade data. Real insights. Real results.</p>
          </div>
          <aside className="ref-card">
            <div className="label">REFERRED BY</div>
            <div className="ref-name">{name} / {entity}</div>
            <div className="ref-role">Independent ADAMftd Partner</div>
          </aside>
          <div className="verified">Platform information verified, May 2026.</div>
        </section>

        {/* INTRO + METRICS */}
        <section className="intro">
          <div className="intro-copy">
            <h2>BUILT FOR COMPANIES<br />THAT TRADE INTERNATIONALLY</h2>
            <p>ADAMftd helps importers, exporters, traders, forwarders, consultants and trade teams discover buyers, suppliers, tariffs, tenders, company intelligence, sanctions screening, market reports and trade workflows, all in one platform.</p>
          </div>
          <div className="metric-grid">
            <div className="metric"><span>7B+</span><small>Verified Trade<br />Records</small></div>
            <div className="metric"><span>200+</span><small>Countries<br />Covered</small></div>
            <div className="metric"><span>80%+</span><small>Global Trade<br />Coverage*</small></div>
            <div className="metric"><span>50+</span><small>Structured Data<br />Sources</small></div>
          </div>
          <p className="coverage-note">*Coverage varies by country, commodity, source and data availability.</p>
        </section>

        {/* PARTNER BENEFITS */}
        <section className="benefits">
          <div className="section-tab">PARTNER BENEFITS FOR YOUR REFERRALS</div>
          <article className="benefit">
            <div className="benefit-icon">{'＋'}</div>
            <div>
              <h3>50 Signup Credits</h3>
              <p>Includes 25 standard credits plus 25 partner credits.</p>
            </div>
          </article>
          <article className="benefit">
            <div className="benefit-icon">$</div>
            <div>
              <h3>$50 Off First Paid Month</h3>
              <p>Applied once on first Growth or Pro monthly upgrade.</p>
            </div>
          </article>
          <article className="benefit">
            <div className="benefit-icon">{'▣'}</div>
            <div>
              <h3>Free Market Report</h3>
              <p>Included with annual Pro signup. Standard value: $500.</p>
            </div>
          </article>
          <article className="benefit">
            <div className="benefit-icon">{'◎'}</div>
            <div>
              <h3>Earn Recurring Commissions</h3>
              <p>Build your network and earn when they succeed.</p>
            </div>
          </article>
        </section>

        {/* PLATFORM */}
        <section className="platform">
          <h2>POWERFUL PLATFORM. REAL TRADE INTELLIGENCE.</h2>
          <div className="platform-summary">
            <div><strong>13</strong><span>Platform Tools<br />Across the Workspace</span></div>
            <div><strong>11</strong><span>Analysis Functions<br />Powerful Insights</span></div>
            <div><strong>Trade Workflow + AI</strong><span>Built-in CRM-style workflow</span></div>
            <div><strong>Access Tiers</strong><span>Flexible for Everyone</span></div>
          </div>
          <div className="columns">
            <article className="column">
              <h3>13 PLATFORM TOOLS</h3>
              <ul>
                {TOOLS.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </article>
            <article className="column">
              <h3>11 ANALYSIS FUNCTIONS</h3>
              <h4>Market Overview (6)</h4>
              <ul>
                {MARKET_OVERVIEW.map((t) => <li key={t}>{t}</li>)}
              </ul>
              <h4>Trade Readiness (5)</h4>
              <ul>
                {TRADE_READINESS.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </article>
            <article className="column">
              <h3>ACCESS TIERS</h3>
              <ul className="tier-list">
                <li><strong>Starter</strong>{'  '}Free signup. 25 base credits plus up to 75 task-earnable. With a partner code: 50 bonus credits.</li>
                <li><strong>Growth</strong>{'  '}$100/mo or $900/yr annual. 220 credits/mo. With partner code: $50 off first month.</li>
                <li><strong>Pro</strong>{'  '}$500/mo or $4,000/yr annual. 1,200 credits/mo. With partner code: one annual-free Market Report.</li>
                <li><strong>Enterprise</strong>{'  '}From $20k/yr. Custom credit allocation, SLA-backed onboarding.</li>
              </ul>
            </article>
          </div>
        </section>

        {/* HORMUZ */}
        <section className="hormuz">
          <div>
            <strong>Hormuz Impact Simulator</strong>
            <p>Scenario modelling to estimate potential global trade impacts.</p>
          </div>
          <div><strong>20 MB/D</strong><span>Through the Strait</span></div>
          <div><strong>25%</strong><span>Global Seaborne Oil</span></div>
          <div><strong>5,000+</strong><span>HS-6 Codes</span></div>
          <div><strong>4</strong><span>Conflict Scenarios</span></div>
        </section>

        {/* COMMISSION */}
        <section className="commission">
          <div className="commission-left">
            <h2>PARTNER COMMISSION MODEL</h2>
            <p>Earn ongoing commissions when your referrals become paid users. Commission is based on eligible monthly subscription value and paid monthly.</p>
          </div>
          <div className="commission-stat"><strong>Up to 15%</strong><span>Commission for eligible referrals</span></div>
          <div className="commission-stat"><strong>Up to 20%</strong><span>For EDOs & Chambers</span></div>
          <div className="commission-stat"><strong>Build Your Network</strong><span>Invite approved sub-affiliates to join your network and earn eligible commissions from their referrals.</span></div>
        </section>

        {/* CTA */}
        <section className="cta">
          <div className="code-box">
            <div className="label">YOUR FULL PARTNER CODE</div>
            <div className="code">{codeUpper}</div>
            <div className="link">{refLink}</div>
          </div>
          <div className="start-box">
            <h2>START FREE TODAY</h2>
            <ul>
              {START_LIST.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
          <div className="sub-box">
            <h2>INTERESTED IN PROMOTING ADAMftd?</h2>
            <p>Ask your partner about joining their network as an approved sub-affiliate.</p>
            <strong>Up to 15% / 20%</strong>
            <span>In recurring commissions.</span>
          </div>
        </section>

        {/* FOOTER */}
        <footer>
          <span>Supported by the International Trade Council network</span>
          <span>Operated by ICTTM Ltd (UK)</span>
          <span><strong>ADAMftd.com</strong></span>
        </footer>
      </div>
    );
  }

  if (Array.isArray(AGK.ASSETS)) {
    // Replace any prior partner_onepager registration, then add this one.
    for (let i = AGK.ASSETS.length - 1; i >= 0; i--) {
      if (AGK.ASSETS[i].id === 'partner_onepager') AGK.ASSETS.splice(i, 1);
    }
    AGK.ASSETS.push({
      id: 'partner_onepager',
      label: 'Partner one-pager (Asset #16)',
      w: W, h: H,
      autoHeight: true,   // content-driven height — measured at render/capture
      Comp: ProductInfographic,
      noDark: true,
      group: 'Partner one-pager',
    });
  }
  AGK.ProductInfographic = ProductInfographic;
})();
