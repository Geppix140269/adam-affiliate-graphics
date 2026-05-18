/*
 * Partner one-pager infographic. A tall (1080 x 2480) product overview
 * that auto-personalises with the affiliate's name + code + ref link.
 * Recreated in the kit's render system from Giuseppe's Canva design.
 *
 * Registered into window.AGK.ASSETS so it appears as a kit artboard and
 * is included in the Download-all ZIP.
 */
(function () {
  const AGK = window.AGK || {};
  const PALETTE = AGK.PALETTE;
  const TYPE = AGK.TYPE;
  const LOGO_SRC = 'assets/adamftd-affiliate-lockup.png';

  const W = 1080;
  const H = 2480;

  const ink = PALETTE.ink;          // #0F1B2D
  const navy = PALETTE.navy;        // #1F3A5F
  const teal = PALETTE.teal;        // #2D8A7E
  const tealHi = PALETTE.tealHi;    // #3FB5A4
  const paper = PALETTE.paper;      // #FAF6EE
  const white = PALETTE.white;
  const wave = PALETTE.wave;
  const slate = '#5A6B85';

  function Hairline({ h = 3 }) {
    const stops = wave.map((c, i) => `${c} ${(i / (wave.length - 1)) * 100}%`).join(', ');
    return <div style={{ height: h, width: '100%', background: `linear-gradient(90deg, ${stops})` }} />;
  }

  // Small geometric stat block (no complex icons).
  function StatBlock({ value, label, color }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 999, background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.92)' }} />
        </div>
        <div style={{ fontFamily: TYPE.sans, fontSize: 40, fontWeight: 700, color: ink, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
        <div style={{ fontFamily: TYPE.sans, fontSize: 14, fontWeight: 500, color: slate, textAlign: 'center', lineHeight: 1.3, maxWidth: 170 }}>{label}</div>
      </div>
    );
  }

  function BenefitCard({ value, title, detail }) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontFamily: TYPE.sans, fontSize: 34, fontWeight: 700, color: tealHi, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
        <div style={{ fontFamily: TYPE.sans, fontSize: 16, fontWeight: 600, color: white, lineHeight: 1.2 }}>{title}</div>
        <div style={{ fontFamily: TYPE.sans, fontSize: 12.5, fontWeight: 400, color: 'rgba(238,243,250,0.7)', lineHeight: 1.45 }}>{detail}</div>
      </div>
    );
  }

  function ListRow({ name, desc }) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '5px 0' }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: teal, flex: '0 0 auto', transform: 'translateY(-1px)' }} />
        <div style={{ fontFamily: TYPE.sans, fontSize: 12.5, lineHeight: 1.4 }}>
          <span style={{ fontWeight: 600, color: ink }}>{name}</span>
          {desc && <span style={{ fontWeight: 400, color: slate }}>{'  ' + desc}</span>}
        </div>
      </div>
    );
  }

  function TierRow({ name, lines }) {
    return (
      <div style={{ padding: '9px 0', borderTop: '1px solid rgba(15,27,45,0.1)' }}>
        <div style={{ fontFamily: TYPE.sans, fontSize: 13.5, fontWeight: 700, color: teal }}>{name}</div>
        {lines.map((l, i) => (
          <div key={i} style={{ fontFamily: TYPE.sans, fontSize: 11.5, color: slate, lineHeight: 1.4, marginTop: 2 }}>{l}</div>
        ))}
      </div>
    );
  }

  function HormuzStat({ value, unit, label }) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontFamily: TYPE.sans, fontWeight: 700, color: white, letterSpacing: '-0.02em', lineHeight: 1 }}>
          <span style={{ fontSize: 30 }}>{value}</span>
          {unit && <span style={{ fontSize: 14, marginLeft: 4, color: tealHi }}>{unit}</span>}
        </div>
        <div style={{ fontFamily: TYPE.sans, fontSize: 12, color: 'rgba(238,243,250,0.7)', lineHeight: 1.4 }}>{label}</div>
      </div>
    );
  }

  function ProductInfographic({ aff }) {
    const codeUpper = aff.code.toUpperCase();
    const refUrl = 'ADAMftd.com/ref/' + aff.code;
    const fullName = aff.full_name;

    const tools = [
      ['Trade Data', 'Shipments & declarations'],
      ['HS Codes, Tariffs & Landed Costs', 'Duty calculator, any country pair'],
      ['Sanctions Screening', 'Global screening & entity types'],
      ['Global Tender Intelligence', '200,000+ live tenders, 84 countries'],
      ['Vessels & Ports Intelligence', 'Maritime intelligence map'],
      ['Trade Companies Finder', 'Shipping-document fuzzy search'],
      ['Company Lookup', '10+ registries, single query'],
      ['Countries & Markets', '199 country trade profiles'],
      ['Market Reports', 'World Bank, WTO, ITC, OECD data'],
      ['Market Analytics', '11 functions, structured reports'],
      ['Enrichment & Verification', 'Verified emails & decision makers'],
      ['Scenario Simulator', 'Hormuz oil-shock simulator'],
      ['Search History', 'Replay and export every query'],
    ];

    const marketOverview = [
      ['Retail Snapshot', 'Channels, prices, labels'],
      ['Market Size & Demand', 'Size, trends, forecasts'],
      ['Consumer Preferences', 'Behaviors, segments'],
      ['Sentiment Analysis', 'AI sentiment, opinions'],
      ['Seasonal Demand Intelligence', 'Month-by-month KPIs'],
      ['Local Production Overview', 'Capacity, competitors'],
    ];
    const tradeReadiness = [
      ['Substitutes & Competitors', 'Threat levels'],
      ['SWOT Analysis', 'For this product & market'],
      ['Market Entry Barriers', 'Licensing, quota, lead times'],
      ['Packaging & Labelling', 'Country requirements'],
      ['Quality Standards & Certifications', 'Compliance'],
    ];

    const checklist = [
      '50 signup credits (25 standard + 25 partner)',
      '$50 off your first paid month',
      'Free Market Report with annual Pro signup',
      'Access to 7 intelligence modules and 13 tools',
      'No credit card required for free signup',
    ];

    return (
      <div style={{ width: W, height: H, background: white, position: 'relative', overflow: 'hidden', fontFamily: TYPE.sans, color: ink, boxSizing: 'border-box' }}>

        {/* ---------------- HEADER (navy) ---------------- */}
        <div style={{ background: ink, padding: '34px 56px 30px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}><Hairline h={4} /></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 28 }}>
            <div style={{ background: white, borderRadius: 12, padding: '14px 18px', display: 'inline-flex' }}>
              <img src={LOGO_SRC} alt="ADAMftd" crossOrigin="anonymous" style={{ width: 240, height: 'auto', display: 'block' }} draggable={false} />
            </div>
            <div style={{ background: 'rgba(238,243,250,0.08)', border: '1px solid rgba(238,243,250,0.18)', borderRadius: 12, padding: '14px 20px', minWidth: 300 }}>
              <div style={{ fontFamily: TYPE.mono, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(238,243,250,0.55)', fontWeight: 500 }}>Referred by</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: white, marginTop: 4, letterSpacing: '-0.01em' }}>{fullName}</div>
              <div style={{ fontSize: 12.5, color: tealHi, marginTop: 2 }}>Independent ADAMftd Partner</div>
            </div>
          </div>
          <div style={{ marginTop: 22 }}>
            <div style={{ fontFamily: TYPE.mono, fontSize: 14, letterSpacing: '0.2em', textTransform: 'uppercase', color: tealHi, fontWeight: 500 }}>AI-native trade intelligence</div>
            <div style={{ fontSize: 52, fontWeight: 700, color: white, lineHeight: 1.04, letterSpacing: '-0.03em', marginTop: 8 }}>
              Grounded in source data.
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, color: 'rgba(238,243,250,0.75)', marginTop: 10 }}>Real trade data. Real insights. Real results.</div>
          </div>
        </div>

        {/* ---------------- BUILT FOR + STATS ---------------- */}
        <div style={{ padding: '32px 56px 26px' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: ink, letterSpacing: '-0.02em' }}>Built for companies that trade internationally</div>
          <div style={{ fontSize: 14, color: slate, lineHeight: 1.55, marginTop: 10, maxWidth: 960 }}>
            ADAMftd helps importers, exporters, traders, forwarders, consultants and trade teams discover buyers, suppliers, tariffs, tenders, company intelligence, sanctions screening, market reports and trade workflows. All in one platform.
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 26 }}>
            <StatBlock value="7B+" label="Verified trade records" color={teal} />
            <StatBlock value="200+" label="Countries covered" color={navy} />
            <StatBlock value="80%+" label="Global trade coverage" color="#7A3F8F" />
            <StatBlock value="50+" label="Structured data sources" color="#E29A2C" />
          </div>
          <div style={{ fontSize: 10.5, color: 'rgba(15,27,45,0.45)', marginTop: 16, textAlign: 'center' }}>
            Coverage varies by country, commodity, source and data availability.
          </div>
        </div>

        {/* ---------------- PARTNER BENEFITS (navy band) ---------------- */}
        <div style={{ background: ink, margin: '0 36px', borderRadius: 16, padding: '24px 32px' }}>
          <div style={{ fontFamily: TYPE.mono, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: tealHi, fontWeight: 600, marginBottom: 18 }}>
            Partner benefits for your referrals
          </div>
          <div style={{ display: 'flex', gap: 26 }}>
            <BenefitCard value="50" title="Signup credits" detail="For every new referral. 25 standard credits plus 25 partner credits." />
            <BenefitCard value="$50" title="Off first paid month" detail="Applied once on the first Growth or Pro monthly upgrade." />
            <BenefitCard value="Free" title="Market Report" detail="With annual Pro signup. Standard value $500." />
            <BenefitCard value="%" title="Recurring commissions" detail="Build your network and earn when your referrals succeed." />
          </div>
        </div>

        {/* ---------------- POWERFUL PLATFORM ---------------- */}
        <div style={{ padding: '28px 36px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: ink, letterSpacing: '-0.015em' }}>Powerful platform. Real trade intelligence.</div>
          <div style={{ display: 'flex', gap: 14, marginTop: 16 }}>
            {[
              ['13', 'Platform tools'],
              ['11', 'Analysis functions'],
              ['CRM', 'Trade workflow + AI'],
              ['4', 'Access tiers'],
            ].map(([n, l]) => (
              <div key={l} style={{ flex: 1, background: paper, borderRadius: 10, padding: '12px 8px' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: teal, lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: slate, marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ---------------- 3 DETAIL PANELS ---------------- */}
        <div style={{ padding: '14px 36px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {/* 13 tools */}
          <div style={{ background: paper, borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontFamily: TYPE.mono, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: teal, fontWeight: 600, marginBottom: 8 }}>13 platform tools</div>
            {tools.map(([n, d]) => <ListRow key={n} name={n} desc={d} />)}
          </div>
          {/* 11 functions */}
          <div style={{ background: paper, borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontFamily: TYPE.mono, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: teal, fontWeight: 600, marginBottom: 8 }}>11 analysis functions</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: navy, margin: '4px 0 4px' }}>Market Overview (6)</div>
            {marketOverview.map(([n, d]) => <ListRow key={n} name={n} desc={d} />)}
            <div style={{ fontSize: 12, fontWeight: 700, color: navy, margin: '12px 0 4px' }}>Trade Readiness (5)</div>
            {tradeReadiness.map(([n, d]) => <ListRow key={n} name={n} desc={d} />)}
          </div>
          {/* access tiers */}
          <div style={{ background: paper, borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontFamily: TYPE.mono, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: teal, fontWeight: 600, marginBottom: 4 }}>Access tiers</div>
            <div style={{ fontSize: 11, color: slate, marginBottom: 4 }}>Free signup. No card. Try before you commit.</div>
            <TierRow name="Starter" lines={['Free signup. 25 base credits plus up to 75 task-earnable.', 'With a partner code: 50 bonus credits.']} />
            <TierRow name="Growth" lines={['$100/mo or $900/yr annual. 25 base plus 220 credits/mo.', 'With partner code: $50 off the first month.']} />
            <TierRow name="Pro" lines={['$500/mo or $4,000/yr annual. 25 base plus 1,200 credits/mo.', 'With partner code: one annual-free Market Report.']} />
            <TierRow name="Enterprise" lines={['From $20k/yr. Custom credit allocation.', 'SLA, backed white-glove onboarding.']} />
          </div>
        </div>

        {/* ---------------- HORMUZ BAND (navy) ---------------- */}
        <div style={{ background: ink, margin: '14px 36px 0', borderRadius: 16, padding: '20px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: '0 0 240px' }}>
              <div style={{ fontFamily: TYPE.mono, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: tealHi, fontWeight: 600 }}>Flagship</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: white, marginTop: 4, lineHeight: 1.15 }}>Hormuz Impact Simulator</div>
              <div style={{ fontSize: 11.5, color: 'rgba(238,243,250,0.65)', marginTop: 4, lineHeight: 1.4 }}>Scenario modelling to estimate potential global trade impacts.</div>
            </div>
            <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(238,243,250,0.16)' }} />
            <div style={{ flex: 1, display: 'flex', gap: 14, paddingLeft: 6 }}>
              <HormuzStat value="20" unit="MB/D" label="Through the Strait. Critical chokepoint monitored." />
              <HormuzStat value="25%" label="Global seaborne oil flows through Hormuz." />
              <HormuzStat value="5,000+" label="HS-6 codes modelled across key scenarios." />
              <HormuzStat value="4" label="Conflict scenarios. Evaluate risks across situations." />
            </div>
          </div>
        </div>

        {/* ---------------- COMMISSION MODEL ---------------- */}
        <div style={{ padding: '26px 36px 14px' }}>
          <div style={{ fontFamily: TYPE.mono, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: teal, fontWeight: 600, marginBottom: 14 }}>
            Partner commission model
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1.3, background: paper, borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: ink }}>How you earn</div>
              <div style={{ fontSize: 12, color: slate, lineHeight: 1.5, marginTop: 6 }}>
                Earn ongoing commissions when your referrals become paid users. Commission is based on monthly subscription value. Paid monthly.
              </div>
            </div>
            <div style={{ flex: 1, background: ink, borderRadius: 12, padding: '16px 18px', color: white }}>
              <div style={{ fontSize: 12, color: 'rgba(238,243,250,0.6)', fontWeight: 500 }}>Standard partners</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: tealHi, lineHeight: 1.1, marginTop: 4 }}>Up to 15%</div>
              <div style={{ fontSize: 12, color: 'rgba(238,243,250,0.7)', marginTop: 2 }}>Commission, for 12 months</div>
            </div>
            <div style={{ flex: 1, background: ink, borderRadius: 12, padding: '16px 18px', color: white }}>
              <div style={{ fontSize: 12, color: 'rgba(238,243,250,0.6)', fontWeight: 500 }}>EDOs / Chambers</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: tealHi, lineHeight: 1.1, marginTop: 4 }}>Up to 20%</div>
              <div style={{ fontSize: 12, color: 'rgba(238,243,250,0.7)', marginTop: 2 }}>Commission, for 24 months</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: slate, lineHeight: 1.5, marginTop: 12 }}>
            <span style={{ fontWeight: 700, color: ink }}>Build your network.</span>{'  '}
            Invite approved sub-affiliates to join your network and earn from their referrals.
          </div>
        </div>

        {/* ---------------- BOTTOM CTA ---------------- */}
        <div style={{ padding: '6px 36px 0', display: 'flex', gap: 14 }}>
          <div style={{ flex: 1.15, background: ink, borderRadius: 16, padding: '22px 26px', color: white }}>
            <div style={{ fontFamily: TYPE.mono, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(238,243,250,0.55)', fontWeight: 500 }}>Your full partner code</div>
            <div style={{ fontFamily: TYPE.mono, fontSize: 34, fontWeight: 700, color: white, letterSpacing: '0.02em', marginTop: 6 }}>{codeUpper}</div>
            <div style={{ fontFamily: TYPE.mono, fontSize: 15, color: tealHi, marginTop: 6 }}>{refUrl}</div>
            <div style={{ height: 1, background: 'rgba(238,243,250,0.16)', margin: '14px 0' }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: white, marginBottom: 8 }}>Start free today</div>
            {checklist.map((c) => (
              <div key={c} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '3px 0' }}>
                <span style={{ color: tealHi, fontWeight: 700, fontSize: 13 }}>{'✓'}</span>
                <span style={{ fontSize: 12, color: 'rgba(238,243,250,0.82)', lineHeight: 1.4 }}>{c}</span>
              </div>
            ))}
          </div>
          <div style={{ flex: 0.85, background: paper, borderRadius: 16, padding: '22px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: ink, lineHeight: 1.2 }}>Interested in promoting ADAMftd?</div>
            <div style={{ fontSize: 12.5, color: slate, lineHeight: 1.5, marginTop: 8 }}>
              Ask your partner about joining their network as an approved sub-affiliate.
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: teal, marginTop: 12, letterSpacing: '-0.01em' }}>Up to 15% / 20%</div>
            <div style={{ fontSize: 12, color: slate }}>in recurring commissions.</div>
          </div>
        </div>

        {/* ---------------- FOOTER ---------------- */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: ink, padding: '14px 56px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: TYPE.mono, fontSize: 10.5, color: 'rgba(238,243,250,0.6)', letterSpacing: '0.04em' }}>
            Supported by the International Trade Council network{'   '}{PALETTE && '·'}{'   '}Operated by ICTTM Ltd (UK)
          </div>
          <div style={{ fontFamily: TYPE.mono, fontSize: 10.5, color: 'rgba(238,243,250,0.6)', letterSpacing: '0.04em' }}>
            ADAMftd.com{'   ·   '}ceo@adamftd.com
          </div>
        </div>
      </div>
    );
  }

  // Register as a kit asset (new "Partner one-pager" group).
  if (Array.isArray(AGK.ASSETS)) {
    AGK.ASSETS.push({
      id: 'partner_onepager',
      label: 'Partner one-pager (product overview)',
      w: W, h: H,
      Comp: ProductInfographic,
      noDark: true,
      group: 'Partner one-pager',
    });
  }
  AGK.ProductInfographic = ProductInfographic;
})();
