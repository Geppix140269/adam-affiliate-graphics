/*
 * Content modules for the affiliate kit: captions, emails, DMs, elevator
 * pitches, FAQ, QR code. Each module renders below the visual artboards
 * with copy-to-clipboard buttons. All copy is personalised via the same
 * affiliate data used in the graphics.
 *
 * Placeholders:
 *   {{partner_name}}  - affiliate's full name
 *   {{first_name}}    - affiliate's first name (or recipient name in emails)
 *   {{ref_code}}      - UPPERCASE code (e.g. VINCENTCHEONG)
 *   {{ref_slug}}      - lowercase code (e.g. vincentcheong)
 *   {{ref_link}}      - adamftd.com/ref/{slug}  (no protocol)
 *
 * Brand rules respected:
 *   - No em-dashes
 *   - Codes lowercase in URLs, UPPERCASE in display
 *   - No "search bar" framing, no platform-savings figures, no Bloomberg
 *     as direct competitor claim (Bloomberg-tier budgets is a pricing
 *     positioning device only)
 *   - No "free trial" language for the Starter tier
 *   - Only references features visible on the kit page
 */
(function () {
  const { useState, useEffect, useRef, useMemo } = React;

  function subst(template, vars) {
    return String(template).replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return vars[key] !== undefined ? String(vars[key]) : '';
    });
  }

  function partnerVars(aff) {
    return {
      partner_name: aff.full_name,
      first_name: aff.first_name,
      ref_code: aff.code.toUpperCase(),
      ref_slug: aff.code,
      ref_link: 'adamftd.com/ref/' + aff.code,
    };
  }

  // -----------------------------------------------------------------
  // Content data
  // -----------------------------------------------------------------

  const CAPTIONS = {
    'LinkedIn Feed (Curiosity)': [
      `How do you find verified buyers and suppliers without a Bloomberg-tier budget?

Most trade-intelligence tools force a choice: pay six figures, or settle for scraped guesses.

ADAMftd is the third option. AI-native, source-anchored, conversational. 7B+ verified records, 87 capabilities.

Try it with my code {{ref_code}}: {{ref_link}}`,

      `7B+ verified trade records.
87 platform capabilities.
5 intelligence layers.

That's the substrate behind ADAMftd. The interface is a conversation. Ask, in plain language, get answers cited to source.

For SMEs and the consultancies advising them.

Code {{ref_code}}: {{ref_link}}`,

      `Trade data has two markets: Bloomberg-priced terminals, or scraped guesses dressed up as insight. Both fail the SME exporter who actually has to make a decision today.

I've been using ADAMftd. AI-native, source-anchored. Every answer carries its sources.

Worth a look: {{ref_link}}
Use code {{ref_code}} at signup.`,

      `A consultancy I work with vets new suppliers in 30 minutes now. That used to be a three-day desk-research project.

The tool is ADAMftd. Conversational AI grounded in verified trade records, not a search box.

If you advise SMEs on cross-border anything, this is worth ten minutes of your week.

{{ref_link}} (use code {{ref_code}})`,

      `Two upgrades for anyone considering ADAMftd this month:

50 bonus credits at signup (vs the default 25).
$50 off the first paid month.

Both unlock with my code {{ref_code}} at signup.

{{ref_link}}`,

      `If you do any kind of import / export research, verifying a supplier, sizing a market, checking a counterparty, send me a message.

I'll share my ADAMftd code. You start with 50 bonus credits and $50 off your first month, and you'll know within a week if it earns a place in your stack.

{{ref_link}} · code {{ref_code}}`,
    ],

    'LinkedIn Feed (Stats)': [
      `"Where does the data come from?" is the right question to ask any AI tool.

ADAMftd's comes from 7B+ verified trade records. Every answer cites the underlying source.

AI-native AND source-anchored. Both halves matter.

{{ref_link}} (use code {{ref_code}})`,

      `A few numbers that put ADAMftd in context:

7B+ verified trade records covering global flows.
87 platform capabilities, one conversational interface.
5 intelligence layers stacked beneath every query.

Built for SMEs, exporters, and the consultancies advising them.

{{ref_link}} · code {{ref_code}}`,

      `Trade intelligence used to be a choice between a six-figure terminal and a free-tier scraper. Neither serves the SME exporter making a decision today.

ADAMftd is the third path. AI-native, grounded in source, priced for actual SMEs.

{{ref_link}} (code {{ref_code}} for 50 bonus credits)`,

      `Last week I asked ADAMftd to find verified suppliers of a specific commodity exporting from one region with shipments to the EU in the last 18 months.

Answer back in under a minute, cited to the records. That used to be a freelancer brief.

This is what "grounded AI" actually means.

{{ref_link}} · code {{ref_code}}`,

      `ADAMftd's affiliate stack this month, via my link:

50 bonus credits at signup.
$50 off the first paid month.
A bespoke Market Report (normally $500) on annual PRO upgrade.

Code {{ref_code}} at {{ref_link}}`,

      `Quick ask: if you're a trader, exporter, importer, or consultancy and the trade-intel piece of your stack isn't great, message me.

I'll send my ADAMftd code. 50 bonus credits free, $50 off month one, and you can decide in a week.

{{ref_link}} · {{ref_code}}`,
    ],

    'Instagram Feed (Curiosity)': [
      `How do you find verified buyers without Bloomberg-tier budgets? 🔍 ADAMftd. AI-native trade intel, grounded in 7B+ source records.

Link in bio · use code {{ref_code}}

#TradeIntelligence #SMEexport #AItools #ImportExport #SupplyChain`,

      `7B+ verified trade records. 87 capabilities. 5 intelligence layers. One conversation.

Link in bio · code {{ref_code}}

#GlobalTrade #TradeData #AItools #ExportBusiness`,

      `Vetting suppliers used to take days. Now it's a question and an answer, cited to source.

Try ADAMftd via link in bio, use {{ref_code}}.

#SupplyChain #Sourcing #TradeIntel #ExportImport`,

      `🎁 50 bonus credits + $50 off your first paid month with my ADAMftd code {{ref_code}}.

Link in bio. For SMEs and the consultancies advising them.

#TradeFinance #ExportImport #AItools #SMB`,
    ],

    'Instagram Feed (Stats)': [
      `The substrate: 7B+ verified trade records, 87 capabilities, 5 intelligence layers. The interface: a conversation.

Link in bio · code {{ref_code}}

#TradeData #AItools #GlobalTrade #ExportImport`,

      `Trade intel: pay Bloomberg-tier, or scrape and hope. ADAMftd is the third option.

Link in bio · {{ref_code}}

#SMEexport #TradeIntelligence #AItools`,

      `30 minutes to vet a new supplier across 18 months of shipments. That's the day-to-day with ADAMftd.

Link in bio · code {{ref_code}}

#Sourcing #SupplyChain #TradeData`,

      `🎁 50 bonus credits + $50 off month one when you use {{ref_code}}.

Link in bio. AI-native trade intelligence for SMEs.

#TradeIntel #ExportBusiness #AItools`,
    ],

    'LinkedIn / IG Story (Curiosity)': [
      `How do you find verified buyers without Bloomberg-tier budgets? Code {{ref_code}}`,
      `Trade data, conversational. Code {{ref_code}}`,
      `Asked, answered, cited. ADAMftd. Code {{ref_code}}`,
    ],

    'LinkedIn / IG Story (Stats)': [
      `7B+ verified records. 87 capabilities. Code {{ref_code}}`,
      `AI-native AND source-anchored. Code {{ref_code}}`,
      `The substrate behind every answer: 7B+ records, 5 layers. Code {{ref_code}}`,
    ],

    'Share card / ref link standalone': [
      `AI-native trade intelligence, grounded in source data. {{ref_link}} · use code {{ref_code}}`,
      `If trade intelligence is in your stack: {{ref_link}} (50 bonus credits with code {{ref_code}})`,
      `ADAMftd. Conversational AI for international trade, built for SMEs and the consultancies advising them. {{ref_link}} · {{ref_code}}`,
      `I've been using ADAMftd. AI-native, source-anchored, priced for actual SMEs. {{ref_link}} (code {{ref_code}})`,
      `Trade intel without Bloomberg-tier budgets. {{ref_link}} · use {{ref_code}}`,
    ],
  };

  const EMAILS = [
    {
      label: 'Cold outreach — SME exporter / importer',
      subject: 'A quicker way to vet your trade partners',
      body: `Hi {{first_name}},

If you're doing cross-border trade, a tool worth ten minutes of your week: ADAMftd.

It's a conversational AI for international trade, grounded in 7B+ verified trade records. Ask in plain language ("Find me suppliers of X in country Y who've shipped to the EU in the last 18 months"), get answers cited to source.

Built for SMEs and the consultancies advising them, not Bloomberg-tier budgets.

To try it: {{ref_link}}
Use code {{ref_code}} at signup. You'll get 50 bonus credits and $50 off your first paid month.

Happy to walk you through what I've used it for, just reply.

{{partner_name}}`,
    },
    {
      label: 'Cold outreach — Trade consultancy / advisory',
      subject: 'Trade intel without the Bloomberg invoice',
      body: `Hi {{first_name}},

Quick note from one consultant to another. I've been using ADAMftd for client work (verified-supplier sourcing, market sizing, counterparty checks) and the time savings are meaningful.

7B+ verified trade records, 87 platform capabilities, conversational interface. AI-native AND source-anchored, which is the part that matters: every answer is grounded in records you can audit.

For your client work or your own desk research: {{ref_link}}
Code {{ref_code}} at signup gets you 50 bonus credits and $50 off month one.

Worth a 30-minute exploration. Let me know if useful.

{{partner_name}}`,
    },
    {
      label: 'Cold outreach — Trade finance / banking',
      subject: 'A faster lens on counterparty risk',
      body: `Hi {{first_name}},

For counterparty diligence and trade-finance origination, you may find ADAMftd useful.

It's an AI-native trade-intelligence platform with 7B+ verified records, conversational interface, and source citations on every answer. The use cases I've seen: faster KYB on cross-border counterparties, supplier verification, trade-flow analysis for sectoral lending decisions.

For SMEs and the advisors serving them. Not Bloomberg-priced.

{{ref_link}}
Code {{ref_code}} at signup: 50 bonus credits, $50 off the first paid month.

Happy to compare notes if helpful.

{{partner_name}}`,
    },
    {
      label: 'Warm intro — someone you already know',
      subject: 'A tool I think you will like',
      body: `Hi {{first_name}},

Following up on our conversation about trade research and supplier work.

The platform I mentioned is ADAMftd. Conversational AI for international trade, grounded in 7B+ verified records. It's been a real time-saver for me.

Try it on me: {{ref_link}}
Use code {{ref_code}} at signup, you get 50 bonus credits and $50 off month one.

If you upgrade to annual PRO, there's also a bespoke Market Report (normally $500) that comes included.

Let me know what you think.

{{partner_name}}`,
    },
    {
      label: 'Post-demo follow-up',
      subject: 'Quick recap from the ADAMftd walkthrough',
      body: `Hi {{first_name}},

Quick recap of what we covered.

ADAMftd as a conversational layer over 7B+ verified trade records. Cited answers, not search. The use cases we touched on for your team: supplier verification, market sizing, counterparty checks.

When you're ready to take it for a longer drive: {{ref_link}}
Code {{ref_code}} at signup, you start with 50 bonus credits (double the default) and $50 off the first paid month.

If you go annual PRO, a bespoke Market Report is included at no extra cost.

Reply with any follow-up questions, happy to go deeper on specifics.

{{partner_name}}`,
    },
    {
      label: 'Soft nudge — 5 to 7 days after no reply',
      subject: 'Re: ADAMftd',
      body: `Hi {{first_name}},

Just floating this back up in case it got buried. Sharing again in case useful:

ADAMftd. Conversational AI for trade intelligence, grounded in 7B+ verified records. Built for SMEs and consultancies, priced accordingly.

Try it: {{ref_link}}
Code {{ref_code}} at signup gets 50 bonus credits and $50 off month one.

No pressure if it's not the right time. If you'd rather I stop nudging, just say the word.

{{partner_name}}`,
    },
  ];

  const DMS = [
    {
      label: 'Direct ask',
      text: `Hey, are you doing any trade research at the moment? If yes, worth checking out: {{ref_link}} (use code {{ref_code}}, you get 50 bonus credits and $50 off month one)`,
    },
    {
      label: 'Resource share',
      text: `Saw this and thought of you. ADAMftd, conversational AI for trade intel. {{ref_link}}. Use {{ref_code}} at signup, gets you 50 bonus credits and $50 off your first paid month.`,
    },
    {
      label: 'Discount-led',
      text: `50 bonus credits, $50 off the first paid month, and a free Market Report on annual PRO. Code {{ref_code}} at {{ref_link}}.`,
    },
    {
      label: 'Curiosity',
      text: `How would you find verified buyers and suppliers without a Bloomberg-tier budget? Answer: {{ref_link}} (code {{ref_code}})`,
    },
    {
      label: 'Soft / no-pressure',
      text: `Not for everyone, but if cross-border trade research is part of your day: {{ref_link}}. If it's not for you, no worries, just flagging. Use {{ref_code}} for the signup bonus.`,
    },
  ];

  const PITCHES = [
    {
      label: '15 seconds',
      text: `ADAMftd is conversational AI for international trade, grounded in 7B+ verified records, not scraped guesses. Use my code {{ref_code}} or go to {{ref_link}} for 50 bonus credits and $50 off.`,
    },
    {
      label: '30 seconds',
      text: `Trade intelligence is broken: Bloomberg-tier terminals at six figures, or free-tier scrapers you can't trust. ADAMftd is the third option. AI-native, source-anchored, conversational. 7B+ verified records, 87 capabilities, built for SMEs and the consultancies advising them. Use my code {{ref_code}} or go to {{ref_link}} for 50 bonus credits and $50 off.`,
    },
    {
      label: '60 seconds',
      text: `If you do any kind of cross-border trade work, exporting, sourcing, advising, you probably know the trade-data problem. Bloomberg-tier tools at six figures, or scraped data of dubious provenance. Neither serves the SME exporter making a decision today.

ADAMftd is the third way. It's conversational AI grounded in 7B+ verified trade records. You ask in plain language, you get answers cited to source. 87 platform capabilities, 5 intelligence layers, one interface, not a search box.

I've been using it for supplier verification, sourcing, market sizing, counterparty checks. It's saved me real days.

Use my code {{ref_code}} or go to {{ref_link}} for 50 bonus credits and $50 off. If you go annual PRO, there's a bespoke Market Report on top, normally $500.`,
    },
  ];

  const FAQ = [
    {
      q: 'What does ADAMftd actually do?',
      a: `ADAMftd is a conversational AI platform for international trade intelligence. You ask in plain language (about suppliers, buyers, trade flows, market sizing, counterparty checks) and you get answers cited to verified source records. It runs on 7B+ trade records with 87 platform capabilities organised into 5 intelligence layers. The interface is a conversation, not a search box.`,
    },
    {
      q: 'How is this different from Bloomberg / Refinitiv / S&P Global?',
      a: `Price point and interface. Bloomberg / Refinitiv / S&P are built for institutional desks at six-figure budgets. ADAMftd is built for SMEs and the consultancies advising them, at a fraction of that. The other difference is the interface: a conversation, with every answer source-cited. You don't need a power-user training session to get value on day one.`,
    },
    {
      q: 'Is the data real-time?',
      a: `Trade data is rarely truly real-time anywhere, even at the institutional tier. Official records publish on cadences (monthly, quarterly). ADAMftd surfaces the freshest verified records available across its sources. Every answer carries the source and the date, so you can see exactly how current the information is.`,
    },
    {
      q: 'What does it cost?',
      a: `There's a Starter tier so you can use it before paying. Paid tiers (Growth, Pro) sit far below institutional trade-intel platforms. If you sign up with my code {{ref_code}}, your first paid month is $50 off. Specific pricing is on adamftd.com, which is the source of truth since pricing changes occasionally.`,
    },
    {
      q: 'Who is this for?',
      a: `SMEs that import or export, the consultancies and advisors that serve them, and trade-finance professionals who need a faster lens on counterparty and supplier risk. If your day-to-day involves cross-border trade research or due diligence, you're in the target audience.`,
    },
    {
      q: 'Where does the data come from?',
      a: `Verified trade records from official customs and trade-flow sources, aggregated and harmonised. The 7B+ records figure refers to this verified substrate. Every answer the platform produces cites the underlying records, so you can audit the source. That's the source-anchored part of "AI-native AND source-anchored".`,
    },
    {
      q: 'Can I see a demo before I commit?',
      a: `Yes. The Starter tier lets you use the platform directly, which is the best demo. You can also walk through it with me. Use {{ref_link}} and I'll be your point of contact for setup questions.`,
    },
    {
      q: 'How is this "AI-native"? Is it just ChatGPT with a wrapper?',
      a: `No. The conversational interface is the front end, but the engine underneath is grounded in 7B+ verified trade records, not the public internet. The model doesn't guess. It retrieves from the verified substrate and cites what it returns. That's the difference between "AI-native AND source-anchored" and a generic LLM with a system prompt.`,
    },
    {
      q: 'What languages and regions are covered?',
      a: `Global trade flows are covered in the underlying data. The conversational interface is in English. Specific region or sector coverage is best answered by trying it. The platform will show you what it has, and where coverage is thinner it will say so rather than fabricate.`,
    },
    {
      q: 'Can I export the data?',
      a: `Yes. Query results can be exported for use in your own analysis or reporting. Specific export formats and limits depend on the tier. The platform shows current options when you run a query.`,
    },
    {
      q: 'Is there a free tier?',
      a: `Yes. The Starter tier is permanent, not a time-limited trial. With my code {{ref_code}} you also get 50 bonus credits at signup (double the default 25). If you upgrade to a paid plan, the first month is $50 off with my code as well.`,
    },
    {
      q: 'How does the referral programme work for me as the prospect?',
      a: `You use code {{ref_code}} or sign up via {{ref_link}}. At signup you get 50 bonus credits instead of the default 25. If you upgrade to a paid tier, your first month is $50 off. If you go annual PRO specifically, a bespoke Market Report (normally $500) is included at no extra cost. That's the full picture.`,
    },
  ];

  // -----------------------------------------------------------------
  // Plain-text aggregators (used by ZIP export)
  // -----------------------------------------------------------------

  function buildCaptionsTxt(aff) {
    const v = partnerVars(aff);
    const out = ['ADAMftd Partner Kit — Caption packs', 'Affiliate: ' + aff.full_name + ' (' + aff.code + ')', ''];
    for (const [section, items] of Object.entries(CAPTIONS)) {
      out.push('================================');
      out.push(section);
      out.push('================================');
      out.push('');
      items.forEach((cap, i) => {
        out.push('-- ' + (i + 1) + ' --');
        out.push(subst(cap, v));
        out.push('');
      });
    }
    return out.join('\n');
  }

  function buildEmailsTxt(aff) {
    // Recipient placeholder kept as {{first_name}} for the partner to fill in.
    const v = { ...partnerVars(aff) };
    delete v.first_name; // Don't auto-substitute recipient
    const out = ['ADAMftd Partner Kit — Email templates', 'Affiliate: ' + aff.full_name + ' (' + aff.code + ')', '', 'Replace {{first_name}} with the recipient\'s first name before sending.', ''];
    EMAILS.forEach((tpl, i) => {
      out.push('================================');
      out.push((i + 1) + '. ' + tpl.label);
      out.push('================================');
      out.push('');
      out.push('Subject: ' + subst(tpl.subject, v));
      out.push('');
      out.push(subst(tpl.body, v));
      out.push('');
    });
    return out.join('\n');
  }

  function buildDmsTxt(aff) {
    const v = partnerVars(aff);
    const out = ['ADAMftd Partner Kit — DM / WhatsApp / Telegram', 'Affiliate: ' + aff.full_name + ' (' + aff.code + ')', ''];
    DMS.forEach((d, i) => {
      out.push('-- ' + (i + 1) + '. ' + d.label + ' --');
      out.push(subst(d.text, v));
      out.push('');
    });
    return out.join('\n');
  }

  function buildPitchesTxt(aff) {
    const v = partnerVars(aff);
    const out = ['ADAMftd Partner Kit — Elevator pitches', 'Affiliate: ' + aff.full_name + ' (' + aff.code + ')', ''];
    PITCHES.forEach((p) => {
      out.push('================================');
      out.push(p.label);
      out.push('================================');
      out.push('');
      out.push(subst(p.text, v));
      out.push('');
    });
    return out.join('\n');
  }

  function buildFaqTxt(aff) {
    const v = partnerVars(aff);
    const out = ['ADAMftd Partner Kit — Objection-handling FAQ', 'Affiliate: ' + aff.full_name + ' (' + aff.code + ')', ''];
    FAQ.forEach((item, i) => {
      out.push('Q' + (i + 1) + '. ' + item.q);
      out.push('');
      out.push(subst(item.a, v));
      out.push('');
      out.push('');
    });
    return out.join('\n');
  }

  // -----------------------------------------------------------------
  // QR code generation (qrcode-generator library, loaded via CDN)
  // -----------------------------------------------------------------

  function renderQrToCanvas(text, size, bg /* 'transparent' | string */) {
    if (typeof qrcode !== 'function') throw new Error('qrcode library not loaded');
    const qr = qrcode(0, 'H'); // error correction H (highest)
    qr.addData(text);
    qr.make();
    const moduleCount = qr.getModuleCount();
    const margin = 4; // standard quiet zone
    const totalModules = moduleCount + margin * 2;
    const cellSize = Math.floor(size / totalModules);
    const actual = cellSize * totalModules;
    const offset = Math.floor((size - actual) / 2);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (bg !== 'transparent') {
      ctx.fillStyle = bg || '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
    }

    ctx.fillStyle = '#0F1B2D'; // ink dark
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect(
            offset + (c + margin) * cellSize,
            offset + (r + margin) * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }
    return canvas;
  }

  function canvasToPngBlob(canvas) {
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  }

  // -----------------------------------------------------------------
  // UI primitives
  // -----------------------------------------------------------------

  function CopyButton({ getText, label = 'Copy' }) {
    const [state, setState] = useState('idle'); // 'idle' | 'copied' | 'error'
    async function onClick() {
      try {
        const txt = typeof getText === 'function' ? getText() : String(getText);
        await navigator.clipboard.writeText(txt);
        setState('copied');
        setTimeout(() => setState('idle'), 1500);
      } catch (e) {
        console.error('Copy failed', e);
        setState('error');
        setTimeout(() => setState('idle'), 1500);
      }
    }
    const text = state === 'copied' ? 'Copied ✓' : state === 'error' ? 'Try again' : label;
    return (
      <button
        type="button"
        className={'copy-btn' + (state === 'copied' ? ' copied' : '')}
        onClick={onClick}
      >{text}</button>
    );
  }

  function CopyBlock({ text, footer }) {
    return (
      <div className="copy-block">
        <pre>{text}</pre>
        <div className="copy-block-actions">
          {footer}
          <CopyButton getText={() => text} />
        </div>
      </div>
    );
  }

  function ContentCard({ id, title, subtitle, defaultOpen, children, inline }) {
    // Inline mode = no <details> wrapper; the parent sub-section renders
    // the heading. Used by the new sidebar-driven layout.
    if (inline) {
      return (
        <div className="content-card-inline" id={'card-' + id}>
          {children}
        </div>
      );
    }
    return (
      <details className="content-card" open={!!defaultOpen} id={'card-' + id}>
        <summary>
          <span className="content-card-title">{title}</span>
          {subtitle && <span className="content-card-sub">{subtitle}</span>}
          <span className="content-card-chevron" aria-hidden>▾</span>
        </summary>
        <div className="content-card-body">{children}</div>
      </details>
    );
  }

  // -----------------------------------------------------------------
  // Card: Captions
  // -----------------------------------------------------------------

  function CaptionsCard({ aff, inline }) {
    const v = useMemo(() => partnerVars(aff), [aff]);
    return (
      <ContentCard inline={inline} id="captions" title="Caption packs" subtitle="31 ready-to-post captions across LinkedIn, Instagram, stories, and share-card posts">
        {Object.entries(CAPTIONS).map(([section, items]) => (
          <div key={section} className="caption-section">
            <h3>{section}</h3>
            {items.map((cap, i) => (
              <CopyBlock key={i} text={subst(cap, v)} />
            ))}
          </div>
        ))}
      </ContentCard>
    );
  }

  // -----------------------------------------------------------------
  // Card: Emails (with recipient name input)
  // -----------------------------------------------------------------

  function EmailsCard({ aff, inline }) {
    const [recipientFirstName, setRecipientFirstName] = useState('');
    const v = useMemo(() => {
      const base = partnerVars(aff);
      return { ...base, first_name: recipientFirstName.trim() || '{{first_name}}' };
    }, [aff, recipientFirstName]);

    return (
      <ContentCard inline={inline} id="emails" title="Email templates" subtitle="6 cold + warm templates, ready to paste into Gmail / Outlook">
        <div className="recipient-row">
          <label>Recipient's first name (substitutes into every template)</label>
          <input
            type="text"
            placeholder="e.g. Maria"
            value={recipientFirstName}
            onChange={(e) => setRecipientFirstName(e.target.value)}
          />
        </div>
        {EMAILS.map((tpl, i) => {
          const subject = subst(tpl.subject, v);
          const body = subst(tpl.body, v);
          return (
            <div key={i} className="email-block">
              <h3>{(i + 1) + '. ' + tpl.label}</h3>
              <div className="email-subject">
                <span className="email-subject-label">Subject</span>
                <span className="email-subject-value">{subject}</span>
                <CopyButton getText={() => subject} label="Copy subject" />
              </div>
              <CopyBlock
                text={body}
                footer={<CopyButton getText={() => 'Subject: ' + subject + '\n\n' + body} label="Copy subject + body" />}
              />
            </div>
          );
        })}
      </ContentCard>
    );
  }

  // -----------------------------------------------------------------
  // Card: DMs
  // -----------------------------------------------------------------

  function DmsCard({ aff, inline }) {
    const v = useMemo(() => partnerVars(aff), [aff]);
    return (
      <ContentCard inline={inline} id="dms" title="DM / WhatsApp / Telegram" subtitle="5 short shareable messages for direct conversations">
        {DMS.map((d, i) => (
          <div key={i} className="dm-block">
            <div className="dm-label">{(i + 1) + '. ' + d.label}</div>
            <CopyBlock text={subst(d.text, v)} />
          </div>
        ))}
      </ContentCard>
    );
  }

  // -----------------------------------------------------------------
  // Card: Elevator pitches
  // -----------------------------------------------------------------

  function PitchesCard({ aff, inline }) {
    const v = useMemo(() => partnerVars(aff), [aff]);
    return (
      <ContentCard inline={inline} id="pitches" title="Elevator pitches" subtitle="15, 30, and 60-second scripts for in-person and podcast">
        {PITCHES.map((p, i) => (
          <div key={i} className="pitch-block">
            <h3>{p.label}</h3>
            <CopyBlock text={subst(p.text, v)} />
          </div>
        ))}
      </ContentCard>
    );
  }

  // -----------------------------------------------------------------
  // Card: FAQ
  // -----------------------------------------------------------------

  function FaqCard({ aff, inline }) {
    const v = useMemo(() => partnerVars(aff), [aff]);
    return (
      <ContentCard inline={inline} id="faq" title="Objection-handling FAQ" subtitle="12 prospect questions with crisp answers, ready to paste into a reply">
        {FAQ.map((item, i) => {
          const answer = subst(item.a, v);
          return (
            <details key={i} className="faq-item">
              <summary>{(i + 1) + '. ' + item.q}</summary>
              <div className="faq-answer">
                <p>{answer}</p>
                <CopyButton getText={() => answer} />
              </div>
            </details>
          );
        })}
      </ContentCard>
    );
  }

  // -----------------------------------------------------------------
  // Card: QR code
  // -----------------------------------------------------------------

  function QrCard({ aff, inline }) {
    const transparentRef = useRef(null);
    const whiteRef = useRef(null);
    const fullUrl = 'https://adamftd.com/ref/' + aff.code;
    const [err, setErr] = useState(null);

    useEffect(() => {
      try {
        setErr(null);
        const preview = renderQrToCanvas(fullUrl, 220, '#FFFFFF');
        const target = transparentRef.current;
        if (target) {
          target.innerHTML = '';
          target.appendChild(preview);
        }
      } catch (e) { setErr(e.message); }
    }, [fullUrl]);

    async function download(bg, suffix) {
      try {
        const canvas = renderQrToCanvas(fullUrl, 1000, bg);
        const blob = await canvasToPngBlob(canvas);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'qr_' + suffix + '_' + aff.code + '.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (e) { setErr(e.message); }
    }

    return (
      <ContentCard inline={inline} id="qr" title="Personal QR code" subtitle={'Scans to ' + fullUrl}>
        {err && <div className="qr-error">QR generation failed: {err}</div>}
        <div className="qr-row">
          <div ref={transparentRef} className="qr-preview" aria-label="QR code preview" />
          <div className="qr-actions">
            <div className="qr-action-row">
              <button type="button" className="copy-btn" onClick={() => download('#FFFFFF', 'white')}>Download — white bg (1000×1000)</button>
            </div>
            <div className="qr-action-row">
              <button type="button" className="copy-btn" onClick={() => download('transparent', 'transparent')}>Download — transparent bg (1000×1000)</button>
            </div>
            <div className="qr-action-row">
              <CopyButton getText={() => fullUrl} label="Copy URL" />
            </div>
            <div className="qr-hint">
              Encodes the full URL with https. Error-correction level H, so a small overlay would not break the scan.
            </div>
          </div>
        </div>
      </ContentCard>
    );
  }

  // -----------------------------------------------------------------
  // Card: Personal links (Tools section)
  // -----------------------------------------------------------------

  function PersonalLinksCard({ aff, inline }) {
    const fullUrl = 'https://adamftd.com/ref/' + aff.code;
    const shortUrl = 'adamftd.com/ref/' + aff.code;
    const upperCode = aff.code.toUpperCase();
    return (
      <ContentCard inline={inline} id="links" title="Personal links" subtitle="Your URL and code, ready to copy anywhere">
        <div className="personal-links">
          <div className="link-row">
            <label>Your full referral URL (with https)</label>
            <div className="link-value">
              <code>{fullUrl}</code>
              <CopyButton getText={() => fullUrl} />
            </div>
          </div>
          <div className="link-row">
            <label>Short referral URL (for graphics, captions, signatures)</label>
            <div className="link-value">
              <code>{shortUrl}</code>
              <CopyButton getText={() => shortUrl} />
            </div>
          </div>
          <div className="link-row">
            <label>Your referral code (UPPERCASE, for "USE CODE" display)</label>
            <div className="link-value">
              <code>{upperCode}</code>
              <CopyButton getText={() => upperCode} />
            </div>
          </div>
          <div className="link-row">
            <label>Code slug (lowercase, used inside URLs)</label>
            <div className="link-value">
              <code>{aff.code}</code>
              <CopyButton getText={() => aff.code} />
            </div>
          </div>
        </div>
      </ContentCard>
    );
  }

  // -----------------------------------------------------------------
  // Main section
  // -----------------------------------------------------------------

  function ContentSection({ aff }) {
    return (
      <section className="content-section">
        <header className="section-header">
          <h2>Copy + scripts</h2>
        </header>
        <p className="content-section-intro">
          Personalised captions, emails, DMs, pitches, FAQ answers, and your QR code. Every block has a copy button.
        </p>
        <CaptionsCard aff={aff} />
        <EmailsCard aff={aff} />
        <DmsCard aff={aff} />
        <PitchesCard aff={aff} />
        <FaqCard aff={aff} />
        <QrCard aff={aff} />
      </section>
    );
  }

  // -----------------------------------------------------------------
  // Exports
  // -----------------------------------------------------------------

  window.AGK = Object.assign(window.AGK || {}, {
    ContentSection,
    CaptionsCard, EmailsCard, DmsCard, PitchesCard, FaqCard, QrCard, PersonalLinksCard,
    buildCaptionsTxt,
    buildEmailsTxt,
    buildDmsTxt,
    buildPitchesTxt,
    buildFaqTxt,
    renderQrToCanvas,
    canvasToPngBlob,
  });
})();
