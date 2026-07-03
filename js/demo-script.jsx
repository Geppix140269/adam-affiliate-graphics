/*
 * ADAMftd Partner Kit — Demo Pocket Script (Trader Track) v1.4.
 *
 * Renders the inline-accordion content for the hero tile in the
 * dashboard redesign. Content is lifted from demo-pocket-script.html
 * v1.4 and the affiliate-kit-dashboard-v1.html mockup (design source
 * of truth). The 7 modules are a second-level accordion: each module
 * row expands its own talk track and close question.
 *
 * Exposed on window.AGK.DemoScript so app.jsx can drop it into the
 * Demo Pocket Script hero tile body.
 */
(function () {
  const { useState } = React;

  // Second-level accordion row: one of the 7 demo modules.
  function Module({ num, title, wow, children }) {
    const [open, setOpen] = useState(false);
    return (
      <div className={'module-row' + (open ? ' open' : '')}>
        <div
          className="module-row-header"
          onClick={() => setOpen(o => !o)}
          role="button"
          tabIndex={0}
          aria-expanded={open}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o); } }}
        >
          <div className="module-num">{num}</div>
          <div className="module-row-title">{title}</div>
          {wow && <span className="module-wow">WOW</span>}
          <span className="module-chevron" aria-hidden>{'▾'}</span>
        </div>
        <div className="module-body">
          <div className="module-body-inner">{children}</div>
        </div>
      </div>
    );
  }

  function Data({ label, children }) {
    return (
      <div className="module-row-data">
        <div className="module-row-label">{label}</div>
        {children}
      </div>
    );
  }

  function DemoScript() {
    return (
      <>
        {/* Hard rule 4: the qualifier banner stays at the top, always visible
            when the tile is expanded. It tells the affiliate when NOT to use
            this script. */}
        <div className="qualifier-banner">
          <strong>Qualify the prospect in the first 60 seconds</strong>
          For trading companies: importers, exporters, distributors, manufacturers,
          trading houses, retailers. If the prospect is an institutional consultant,
          commercial lawyer, trade finance provider, insurance underwriter or ratings
          agency, use the Institutional Demo Script instead.
        </div>

        <div className="how-to-card">
          <h4>How to use this script</h4>
          <p>
            This is a 10-12 minute live demo flow. Open <b>adamftd.com</b> alongside
            the prospect. Read the talk tracks word-for-word the first three times,
            then make them yours.
          </p>
          <ul>
            <li>Total runtime: 10-12 minutes plus questions.</li>
            <li>Biggest WOW: Module 3 (HS Disambiguator) and Module 5 (Trade History Pivot).</li>
            <li>In Module 5 you must know if the prospect is BUYER or SELLER. Ask at the end of Module 4.</li>
            <li>Each module ends with a question in yellow. That is how you find their pain.</li>
          </ul>
        </div>

        <div className="modules-label">{'The 7 modules · click each to expand'}</div>

        <Module num={1} title="The Opening (60s)">
          <Data label="Screen">
            ADAM Assistant dashboard.
            <div className="screen-detail">
              <code>adamftd.com/dashboard</code>. Six quick-action cards: Top importers,
              Importing countries, Market price, Market sentiment, Retail snapshot,
              Consumer preferences.
            </div>
          </Data>
          <Data label="Talk track">
            <div className="talk-track">
              Tell me what you trade. A product, a market, an industry. In the next ten
              minutes I will show you everything we know about the people who already
              trade that thing globally. Real shipments. Real buyer names. Real supplier
              names. Real prices. Real volumes. Real dates. Not estimates. Not industry
              reports. Bills of lading. The actual transactions. Then I will show you
              what you do with that data.
            </div>
          </Data>
          <Data label="Close">
            <div className="close-q">What product do you want me to search?</div>
          </Data>
        </Module>

        <Module num={2} title="Market Search (60s)">
          <Data label="Screen">
            Trade Data tool.
            <div className="screen-detail">
              Real page title: <b>Customs Declarations & Shipping Data</b>. URL:{' '}
              <code>adamftd.com/trade-data</code>. Leave countries on "Any Country" for the opener.
            </div>
          </Data>
          <Data label="Talk track">
            <div className="talk-track">
              I am going to type the product the prospect just named. No HS code
              knowledge required, the platform handles that. I hit search. Watch what
              happens next, because this is where most platforms fall flat and ours
              does not.
            </div>
          </Data>
          <Data label="Action">
            Type the product (e.g. <b>coffee</b>) and click Search. The "AI Lookup" tag appears.
          </Data>
        </Module>

        <Module num={3} title="HS Disambiguator (90s)" wow>
          <Data label="Screen">
            "Select the best HS code for [product]" panel.
            <div className="screen-detail">
              Each row shows: HS-6 code, <b>live buyer count</b>, <b>live supplier count</b>,
              official product description, real example brands. Top row carries a green{' '}
              <b>Recommended</b> badge.
            </div>
          </Data>
          <Data label="Talk track">
            <div className="talk-track">
              You typed coffee. The platform broke that into the real HS categories used
              in customs filings. Roasted coffee beans: 4,575 buyers, 2,510 suppliers
              globally. Unroasted green coffee beans: 11,289 buyers, 5,174 suppliers.
              Instant coffee: 6,000 buyers, 3,363 suppliers. These are real companies
              filing real customs paperwork. Even better, the platform shows you what
              brand names sit inside each category. Starbucks Whole Bean. Lavazza
              Espresso. Nespresso. Nestle. You pick the one that matches what you sell
              or buy and we do the rest.
            </div>
          </Data>
          <Data label="Action">
            Click the Recommended row. Resolves with a <b>High Confidence</b> badge.
          </Data>
          <Data label="Close">
            <div className="close-q">
              When you classify a product today for customs or quotes, who does that and
              how often does it slow you down?
            </div>
          </Data>
        </Module>

        <Module num={4} title="12 Views on the Same Data (90s)" wow>
          <Data label="Screen">
            "VIEW RESULTS AS" panel.
            <div className="screen-detail">
              12 buttons: Buyer Countries, Supplier Countries, <b>Buyers</b>, <b>Suppliers</b>,{' '}
              <b>Bills of Lading</b>, Unit Price (Buyers), Unit Price (Suppliers), Market
              Avg Price, Market Analytics, Delivery Ports, Origin Ports, Tariffs. Unit
              toggle: USD / B/L / WEIGHT / QTY.
            </div>
          </Data>
          <Data label="Talk track">
            <div className="talk-track">
              One search, twelve angles. Want to see which countries import the most?
              Click. Which buyers? Click. Which bills of lading were filed last quarter?
              Click. The platform is built so you do not need a data analyst. You just
              click the angle you need.
            </div>
          </Data>
          <Data label="Action">
            Click <b>Buyers</b>, switch to table view. Real numbers: Nestle Argentina
            $28.03M, Nespresso Mexico $22.26M, WAL-MART $20.4M.
          </Data>
          <div className="caveat">
            Banner: "US Dollar values are not recorded for the majority of US imports and
            exports." If the prospect is US-heavy, toggle to <b>B/L</b> or <b>WEIGHT</b>.
          </div>
          <div className="module-row-data" style={{ marginTop: 12 }}>
            <div className="module-row-label">Close</div>
            <div className="close-q">
              Quick check before I drill in. Are you on the buy side or the sell side of
              this product?
            </div>
          </div>
        </Module>

        <Module num={5} title="Trade History Pivot (2 min)" wow>
          <Data label="Screen">
            Click a company in the Buyers table. Company profile page.
            <div className="screen-detail">
              Tabs: Overview, Contacts, Web & Media, Reviews, Trade Analytics, HS Codes,{' '}
              <b>Customers</b> (who they sell to), <b>Suppliers</b> (who they buy from),{' '}
              <b>Bills of Lading</b>. Buttons: PDF Report, Bookmark, Enrich Company.
              Overview shows Sanctions: Clear or Flagged.
            </div>
          </Data>
          <Data label="Talk track">
            <div className="branch buyer">
              <div className="branch-label">If prospect is a BUYER</div>
              <div className="talk-track">
                You buy this product. Here is one of the suppliers we just saw. We are on
                the company profile. Sanctions: Clear. Click Customers tab. Now you see
                every buyer this supplier sells to, the trade value, bills of lading
                count, the weight, the share. You can see if they give your competitor a
                better deal. Before you renegotiate, before you onboard them, you walk in
                knowing everything.
              </div>
            </div>
            <div className="branch supplier">
              <div className="branch-label">If prospect is a SELLER</div>
              <div className="talk-track">
                You sell this product. Here is one of the buyers we just saw. We are on
                the company profile. Sanctions: Clear. Click Suppliers tab. Now you see
                every supplier they currently buy from. Look at this. Their number one
                supplier owns 50.4 percent of their volume. The number two is 48.3
                percent. There is a 1.2 percent third player. You walk into your pitch
                knowing exactly what you are competing against, what they pay, and where
                the gap is.
              </div>
            </div>
          </Data>
          <Data label="Close">
            <div className="close-q">
              Imagine you had this view on every counterparty you negotiate with this
              year. What would it change?
            </div>
          </Data>
        </Module>

        <Module num={6} title="Duty and Landed Cost (90s)">
          <Data label="Screen">
            Sidebar: HS, Tariffs & Landed Costs.
            <div className="screen-detail">
              Real page title: <b>Duty & Tariff Calculator</b>. URL:{' '}
              <code>adamftd.com/calculator</code>. Three fields: Origin, Destination, HS
              Code or Product Description.
            </div>
          </Data>
          <Data label="Talk track">
            <div className="talk-track">
              Same product. Pick origin. Pick destination. The platform asks "do you want
              full landed cost?" If yes, you add quantity and sale price and we model
              duties, fees, VAT, and import taxes. Either way you get: MFN duty rate, WTO
              bound rate, preferential trade agreements, Merchandise Processing Fee,
              Harbor Maintenance Fee, state and local sales tax range, plus any political
              surcharges with their current legal status. On coffee Brazil to USA, MFN is
              zero percent, but there is a ten percent Section 122 surcharge whose legal
              status is currently challenged. That kind of footnote is the difference
              between a confident quote and a missed margin.
            </div>
          </Data>
          <Data label="Bonus">
            Same screen lists Regulatory Requirements (FDA, USDA APHIS for coffee) and a
            Required Documents badge. Plus an Export Certificate button and a Simplified
            or Detailed toggle.
          </Data>
          <Data label="Close">
            <div className="close-q">
              When you quote a deal today, how confident are you in the landed cost number?
            </div>
          </Data>
        </Module>

        <Module num={7} title="Documents (90s)">
          <Data label="Screen">
            Sidebar: CRM, Documents, Generate with AI.
            <div className="screen-detail">
              Real page title: <b>AI Document Generator</b>. URL:{' '}
              <code>adamftd.com/crm/documents/generator</code>. Tagline: "Generate
              professional trade documents with AI-powered branding. Choose from 331
              document types across 12 categories."
            </div>
          </Data>
          <Data label="Talk track">
            <div className="talk-track">
              Now it gets operational. 331 trade document templates across twelve
              categories, ready to generate with AI-powered branding. Proforma invoice.
              Commercial invoice. Packing list. Certificate of Origin. NDA. Distribution
              contract. Cargo insurance claim. ESG due diligence report. Cross-border
              travel letter. They auto-populate from the data already in the platform.
              Branded PDFs in seconds. The trade intelligence becomes paperwork without
              leaving the tab.
            </div>
          </Data>
          <Data label="Close">
            <div className="close-q">
              How many tools does your team currently touch to move one shipment from
              quote to documents?
            </div>
          </Data>
        </Module>

        <div className="dark-section">
          <h4>Bridges between modules</h4>
          <p>One-liners to flow from one module into the next.</p>
          <div className="bridge-grid">
            <div className="bridge"><strong>Search to HS:</strong> "Watch the next thing. You did not have to know any HS codes."</div>
            <div className="bridge"><strong>HS to Views:</strong> "Now that we have the right code, look at the angles we can slice this from."</div>
            <div className="bridge"><strong>Views to Pivot:</strong> "That is the market view. Let me drill into one company."</div>
            <div className="bridge"><strong>Pivot to Tariffs:</strong> "You have the counterparty. What does it cost to move the goods?"</div>
            <div className="bridge"><strong>Tariffs to Docs:</strong> "Last piece, how do you turn it into a transaction?"</div>
            <div className="bridge"><strong>Skip ahead:</strong> "I will jump ahead because you mentioned X earlier."</div>
          </div>
        </div>

        <div className="wildcard">
          <strong>Wildcard modules (drop in only when relevant)</strong>
          <p>
            <b>ADAM Assistant chat:</b> Type natural language like "top coffee importers
            in Mexico last year." Use for non-technical prospects.
          </p>
          <p>
            <b>Hormuz Impact:</b> Specialized 4-step wizard modeling oil shock across
            5,000+ HS-6 codes. Only for energy traders, Middle East-exposed prospects,
            commodity desks.
          </p>
        </div>

        <div className="dark-section">
          <h4>Closing the call</h4>
          <p>Do not summarise. Ask one of these.</p>
          <ul>
            <li>Of the seven things you saw, which one would change your work tomorrow?</li>
            <li>If we gave your team a free seven-day trial starting Monday, what counterparty would you look up first?</li>
            <li>Who else on your team should see this before you make a decision?</li>
          </ul>
          <p>Then book the follow-up before you hang up. Calendar open on screen, propose two slots, close.</p>
        </div>

        <div className="institutional-note">
          <strong>Different prospect, different demo</strong>
          If the prospect is a consultant, commercial lawyer, trade finance provider,
          insurance underwriter or ratings agency, do not use this script. Switch to the
          Institutional Demo Script (separate tile, in production).
        </div>
      </>
    );
  }

  window.AGK = window.AGK || {};
  window.AGK.DemoScript = DemoScript;
})();
