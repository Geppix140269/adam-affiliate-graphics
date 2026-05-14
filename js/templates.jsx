/*
 * ADAMftd Partner Kit — 15 asset templates with optional co-brand mode.
 *
 * Standard mode (cobrand = null): identical to v1 approved design.
 * Cobrand mode (cobrand = { partner, hero_override }):
 *   - The single ADAMftd lockup is replaced by a dual-lockup
 *     (ADAMftd × Partner). Both halves get equal visual weight.
 *   - The teal accent is replaced by the partner's primary_color
 *     where it appears as a brand accent.
 *   - On templates that take a hero `line`, hero_override (if set)
 *     wins over the line dropdown.
 *
 * Non-ASCII chars declared once at top via \u escapes so any tooling
 * that re-encodes the file can't mangle them.
 */
(function () {
  const { useRef } = React;

  const MIDDOT = "·";
  const NUMERO = "№";
  const LDQUO  = "“";
  const RSQUO  = "’";
  const TIMES  = "×";

  const LOGO_SRC = "assets/adamftd-affiliate-lockup.png";

  const PALETTE = {
    navy: '#1F3A5F', ink: '#0F1B2D', ink2: '#16263D', ink3: '#1a2942',
    slate: '#5A6B85', teal: '#2D8A7E', tealHi: '#3FB5A4',
    soft: '#EEF3FA', cream: '#F4ECDC', paper: '#FAF6EE', paperWarm: '#F1E9D8',
    white: '#FFFFFF',
    wave: ['#2A9D8F', '#7AC74F', '#E29A2C', '#D04A3B', '#7A3F8F', '#1F6BA8'],
  };

  const TYPE = {
    sans: '"Inter", "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif',
    mono: '"JetBrains Mono", "IBM Plex Mono", ui-monospace, Menlo, monospace',
  };

  const POSITIONING_LINES = [
    'AI-native trade intelligence, grounded in source data.',
    'AI-native AND source-anchored.',
    'Trade intelligence for SMEs and the consultancies advising them.',
    'The world' + RSQUO + 's first grounded AI for international trade.',
  ];

  const BRAND_EYEBROW = 'ADAMftd ' + MIDDOT + ' Partner Programme';

  // accent(cobrand) — return the right brand colour: teal by default,
  // partner's primary_color in co-brand mode.
  function accent(cobrand) {
    return cobrand?.partner?.primary_color || PALETTE.teal;
  }

  // ------------------------------------------------------------------
  // Shared primitives
  // ------------------------------------------------------------------

  function GradientHairline({ h = 2, style = {}, vertical = false }) {
    const stops = PALETTE.wave.map((c, i) => `${c} ${(i / (PALETTE.wave.length - 1)) * 100}%`).join(', ');
    return <div style={{
      height: vertical ? '100%' : h,
      width: vertical ? h : '100%',
      background: `linear-gradient(${vertical ? 180 : 90}deg, ${stops})`,
      borderRadius: h, ...style,
    }} />;
  }

  function AdamLogo({ width }) {
    return <img src={LOGO_SRC} alt="ADAMftd Affiliate Programme"
      style={{ width, height: 'auto', display: 'block' }}
      draggable={false} crossOrigin="anonymous" />;
  }

  // Brand mark — single ADAMftd lockup OR dual ADAMftd × Partner.
  // `width` is the FULL width budget; in cobrand mode each half gets ~(width-50)/2.
  function Brand({ width, cobrand, inset = false, padding = 24, radius = 14, bg = PALETTE.paper, shadow = false, onDark = false }) {
    const hasCobrand = !!cobrand?.partner;
    const inner = (() => {
      if (!hasCobrand) return <AdamLogo width={width} />;
      const halfW = Math.max(80, (width - 56) / 2);
      const partner = cobrand.partner;
      const partnerNode = partner.logo_url
        ? <img src={partner.logo_url} alt={partner.short_name + ' logo'}
            style={{ maxWidth: halfW, maxHeight: width * 0.55, height: 'auto', display: 'block' }}
            draggable={false} crossOrigin="anonymous" />
        : <div style={{
            fontFamily: TYPE.sans, fontSize: Math.min(halfW * 0.18, 44),
            fontWeight: 700, letterSpacing: '-0.02em',
            color: partner.primary_color || PALETTE.navy,
            lineHeight: 1, textAlign: 'center',
            maxWidth: halfW, wordBreak: 'break-word',
          }}>{partner.short_name}</div>;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, width }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
            <AdamLogo width={halfW} />
          </div>
          <div style={{
            fontFamily: TYPE.sans, fontSize: Math.min(width * 0.085, 36),
            fontWeight: 400, color: 'rgba(15,27,45,0.45)',
            lineHeight: 1, userSelect: 'none',
          }}>{TIMES}</div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            {partnerNode}
          </div>
        </div>
      );
    })();
    if (!inset) return inner;
    return (
      <div style={{
        background: bg, padding, borderRadius: radius, display: 'inline-flex',
        boxShadow: shadow ? '0 18px 50px rgba(0,0,0,0.32)' : 'none',
      }}>{inner}</div>
    );
  }

  function CodeBlock({ aff, dark = true, size = 'md', align = 'left', cobrand = null }) {
    const sizes = {
      sm: { label: 11, code: 18, url: 12, gap: 8, lblGap: 10 },
      md: { label: 13, code: 26, url: 14, gap: 10, lblGap: 14 },
      lg: { label: 15, code: 36, url: 17, gap: 14, lblGap: 18 },
      xl: { label: 17, code: 52, url: 22, gap: 18, lblGap: 22 },
    };
    const s = sizes[size] || sizes.md;
    const labelColor = dark ? 'rgba(238,243,250,0.55)' : 'rgba(15,27,45,0.55)';
    const codeColor = dark ? PALETTE.white : PALETTE.ink;
    const urlColor = dark ? 'rgba(238,243,250,0.78)' : 'rgba(15,27,45,0.72)';
    const dotColor = accent(cobrand);
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', gap: s.gap,
        alignItems: align === 'center' ? 'center' : 'flex-start',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: s.lblGap, fontFamily: TYPE.mono, flexWrap: 'nowrap' }}>
          <span style={{
            fontSize: s.label, letterSpacing: '0.22em', color: labelColor,
            fontWeight: 500, textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>Use code</span>
          <span style={{
            fontSize: s.code, color: codeColor, fontWeight: 600,
            letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>{aff.code}</span>
        </div>
        <div style={{
          fontFamily: TYPE.mono, fontSize: s.url, color: urlColor,
          letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
        }}>
          <span style={{
            width: Math.max(5, s.url * 0.42), height: Math.max(5, s.url * 0.42),
            borderRadius: 999, background: dotColor, display: 'inline-block',
          }} />
          {`adamftd.com/ref/${aff.code}`}
        </div>
      </div>
    );
  }

  function ReferredBy({ name, dark = true, prominence = 'caption' }) {
    const muted = dark ? 'rgba(238,243,250,0.55)' : 'rgba(15,27,45,0.55)';
    const strong = dark ? PALETTE.white : PALETTE.ink;
    if (prominence === 'caption') {
      return <div style={{
        fontFamily: TYPE.mono, fontSize: 12, letterSpacing: '0.2em',
        textTransform: 'uppercase', color: muted,
      }}>Referred by <span style={{ color: strong, fontWeight: 500 }}>{name}</span></div>;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontFamily: TYPE.mono, fontSize: 11, letterSpacing: '0.24em',
          textTransform: 'uppercase', color: muted, fontWeight: 500 }}>Referred by</div>
        <div style={{ fontFamily: TYPE.sans, fontSize: 22, fontWeight: 600,
          color: strong, letterSpacing: '-0.01em' }}>{name}</div>
      </div>
    );
  }

  function Eyebrow({ children, color, size = 13 }) {
    return (
      <div style={{
        fontFamily: TYPE.mono, fontSize: size, letterSpacing: '0.22em',
        textTransform: 'uppercase', color: color || PALETTE.teal, fontWeight: 500,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ width: 16, height: 1, background: color || PALETTE.teal, display: 'inline-block' }} />
        {children}
      </div>
    );
  }

  // Pick the headline for templates that accept one.
  function pickHeadline(line, cobrand, fallback) {
    if (cobrand?.hero_override?.trim()) return cobrand.hero_override.trim();
    return line || fallback || POSITIONING_LINES[0];
  }

  // ------------------------------------------------------------------
  // Artboards (15)
  // ------------------------------------------------------------------

  function LinkedInBanner({ aff, dark = true, line, cobrand }) {
    const bg = dark ? PALETTE.ink : PALETTE.paper;
    const fg = dark ? PALETTE.white : PALETTE.ink;
    const muted = dark ? 'rgba(238,243,250,0.65)' : 'rgba(15,27,45,0.65)';
    const ruleColor = dark ? 'rgba(238,243,250,0.18)' : 'rgba(15,27,45,0.15)';
    const brandW = cobrand?.partner ? 380 : 240;
    const leftCol = cobrand?.partner ? '420px' : '280px';
    return (
      <div style={{ width: 1584, height: 396, background: bg, position: 'relative', overflow: 'hidden', fontFamily: TYPE.sans, color: fg }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}><GradientHairline h={3} /></div>
        <div style={{ position: 'absolute', top: 28, left: 72, fontFamily: TYPE.mono, fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: muted, fontWeight: 500 }}>{BRAND_EYEBROW}</div>
        <div style={{ position: 'absolute', inset: '56px 72px 40px 72px', display: 'grid', gridTemplateColumns: `${leftCol} 1px 1fr`, gap: 44, alignItems: 'stretch' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
            <Brand width={brandW} cobrand={cobrand} inset={dark} padding={12} radius={10} bg={dark ? PALETTE.paper : 'transparent'} />
            <ReferredBy name={aff.full_name} dark={dark} prominence="emphasis" />
          </div>
          <div style={{ width: 1, background: ruleColor, alignSelf: 'stretch' }} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0, gap: 16 }}>
            <div style={{ fontSize: 44, fontWeight: 600, lineHeight: 1.06, letterSpacing: '-0.025em', color: fg, textWrap: 'balance', maxWidth: 900 }}>
              {pickHeadline(line, cobrand)}
            </div>
            <CodeBlock aff={aff} dark={dark} size="md" cobrand={cobrand} />
          </div>
        </div>
      </div>
    );
  }

  function InstagramCuriosity({ aff, dark = true, cobrand }) {
    const bg = dark ? PALETTE.ink : PALETTE.paper;
    const fg = dark ? PALETTE.white : PALETTE.ink;
    const muted = dark ? 'rgba(238,243,250,0.6)' : 'rgba(15,27,45,0.6)';
    const panelBg = dark ? PALETTE.paper : PALETTE.white;
    const brandW = cobrand?.partner ? 320 : 180;
    return (
      <div style={{ width: 1080, height: 1080, background: bg, position: 'relative', overflow: 'hidden', fontFamily: TYPE.sans, color: fg }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}><GradientHairline h={3} /></div>
        <div style={{ position: 'absolute', top: 60, left: 80, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: TYPE.mono, fontSize: 13, letterSpacing: '0.24em', textTransform: 'uppercase', color: muted }}>{BRAND_EYEBROW}</div>
          <div style={{ fontFamily: TYPE.mono, fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: muted }}>{NUMERO + ' 01 ' + MIDDOT + ' Curiosity'}</div>
        </div>
        <div style={{ position: 'absolute', top: 200, left: 80, right: 80, display: 'flex', flexDirection: 'column', gap: 48 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
            <div style={{ fontFamily: TYPE.sans, fontSize: 140, fontWeight: 600, lineHeight: 0.75, color: accent(cobrand), marginTop: -8, letterSpacing: '-0.04em' }}>{LDQUO}</div>
            <div style={{ fontSize: 60, fontWeight: 600, lineHeight: 1.06, letterSpacing: '-0.025em', color: fg, textWrap: 'pretty' }}>How do you find verified buyers and suppliers without Bloomberg-tier budgets?</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginLeft: 4 }}>
            <Eyebrow color={accent(cobrand)} size={12}>The answer</Eyebrow>
            <div style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.32, color: muted, maxWidth: 880, letterSpacing: '-0.01em' }}>AI-native trade intelligence, grounded in 7B+ source records.</div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 270, left: 80 }}>
          <ReferredBy name={aff.full_name} dark={dark} prominence="caption" />
        </div>
        <div style={{ position: 'absolute', left: 60, right: 60, bottom: 60, background: panelBg, borderRadius: 18, padding: '24px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 28, boxShadow: dark ? '0 24px 60px rgba(0,0,0,0.35)' : '0 1px 0 rgba(15,27,45,0.06)' }}>
          <Brand width={brandW} cobrand={cobrand} />
          <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(15,27,45,0.10)' }} />
          <CodeBlock aff={aff} dark={false} size="md" cobrand={cobrand} />
        </div>
      </div>
    );
  }

  function InstagramStats({ aff, dark = true, cobrand }) {
    const bg = dark ? PALETTE.ink : PALETTE.paper;
    const fg = dark ? PALETTE.white : PALETTE.ink;
    const muted = dark ? 'rgba(238,243,250,0.6)' : 'rgba(15,27,45,0.6)';
    const ruleColor = dark ? 'rgba(238,243,250,0.18)' : 'rgba(15,27,45,0.15)';
    const panelBg = dark ? PALETTE.paper : PALETTE.white;
    const brandW = cobrand?.partner ? 320 : 180;
    const stats = [
      { value: '7B+', label: 'Verified trade records' },
      { value: '87', label: 'Platform capabilities' },
      { value: '5', label: 'Intelligence layers' },
    ];
    return (
      <div style={{ width: 1080, height: 1080, background: bg, position: 'relative', overflow: 'hidden', fontFamily: TYPE.sans, color: fg }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}><GradientHairline h={3} /></div>
        <div style={{ position: 'absolute', top: 60, left: 80, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: TYPE.mono, fontSize: 13, letterSpacing: '0.24em', textTransform: 'uppercase', color: muted }}>{BRAND_EYEBROW}</div>
          <div style={{ fontFamily: TYPE.mono, fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: muted }}>{NUMERO + ' 02 ' + MIDDOT + ' By the numbers'}</div>
        </div>
        <div style={{ position: 'absolute', top: 170, left: 80, right: 80 }}>
          <Eyebrow color={accent(cobrand)} size={13}>The substrate</Eyebrow>
          <div style={{ fontSize: 56, fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.025em', color: fg, maxWidth: 760, marginTop: 18 }}>
            AI-native.<br />
            <span style={{ color: accent(cobrand) }}>Source-anchored.</span>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 480, left: 80, right: 80, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
          {stats.map((s, i) => (
            <div key={s.value} style={{ padding: '24px 28px 28px 28px', borderLeft: i === 0 ? 'none' : `1px solid ${ruleColor}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontFamily: TYPE.sans, fontSize: 112, fontWeight: 600, lineHeight: 0.92, letterSpacing: '-0.045em', color: fg, fontFeatureSettings: '"tnum" 1, "ss01" 1' }}>{s.value}</div>
              <div style={{ fontFamily: TYPE.sans, fontSize: 17, fontWeight: 500, lineHeight: 1.3, color: muted, letterSpacing: '-0.005em', maxWidth: 220 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 80, right: 80, bottom: 340, height: 1, background: ruleColor }} />
        <div style={{ position: 'absolute', bottom: 290, left: 80, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <ReferredBy name={aff.full_name} dark={dark} prominence="caption" />
          <div style={{ fontFamily: TYPE.mono, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: muted, textAlign: 'right', maxWidth: 520 }}>Trade intelligence for SMEs and the consultancies advising them.</div>
        </div>
        <div style={{ position: 'absolute', left: 60, right: 60, bottom: 60, background: panelBg, borderRadius: 18, padding: '24px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 28, boxShadow: dark ? '0 24px 60px rgba(0,0,0,0.35)' : '0 1px 0 rgba(15,27,45,0.06)' }}>
          <Brand width={brandW} cobrand={cobrand} />
          <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(15,27,45,0.10)' }} />
          <CodeBlock aff={aff} dark={false} size="md" cobrand={cobrand} />
        </div>
      </div>
    );
  }

  function EmailSignature({ aff, dark = false, cobrand }) {
    const bg = dark ? PALETTE.ink : PALETTE.paper;
    const fg = dark ? PALETTE.white : PALETTE.ink;
    const muted = dark ? 'rgba(238,243,250,0.7)' : 'rgba(15,27,45,0.62)';
    return (
      <div style={{ width: 600, height: 120, background: bg, position: 'relative', overflow: 'hidden', fontFamily: TYPE.sans, color: fg, display: 'flex', alignItems: 'stretch' }}>
        <div style={{ width: 4, alignSelf: 'stretch' }}>
          <div style={{ width: 4, height: '100%', background: `linear-gradient(180deg, ${PALETTE.wave.join(', ')})` }} />
        </div>
        <div style={{ padding: '14px 18px 14px 20px', display: 'flex', alignItems: 'center' }}>
          <Brand width={cobrand?.partner ? 240 : 130} cobrand={cobrand} />
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: dark ? 'rgba(238,243,250,0.18)' : 'rgba(15,27,45,0.10)', margin: '20px 0' }} />
        <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
          <div style={{ fontFamily: TYPE.mono, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: muted, fontWeight: 500 }}>{BRAND_EYEBROW}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontFamily: TYPE.mono }}>
            <span style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: muted, fontWeight: 500 }}>USE CODE</span>
            <span style={{ fontSize: 18, fontWeight: 600, color: fg, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{aff.code}</span>
          </div>
          <div style={{ fontFamily: TYPE.mono, fontSize: 12, color: dark ? 'rgba(238,243,250,0.8)' : 'rgba(15,27,45,0.72)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: accent(cobrand) }} />
            adamftd.com/ref/{aff.code}
          </div>
        </div>
      </div>
    );
  }

  function InstagramStoryCuriosity({ aff, dark = true, cobrand }) {
    const bg = dark ? PALETTE.ink : PALETTE.paper;
    const fg = dark ? PALETTE.white : PALETTE.ink;
    const muted = dark ? 'rgba(238,243,250,0.6)' : 'rgba(15,27,45,0.6)';
    const panelBg = dark ? PALETTE.paper : PALETTE.white;
    const brandW = cobrand?.partner ? 540 : 300;
    return (
      <div style={{ width: 1080, height: 1920, background: bg, position: 'relative', overflow: 'hidden', fontFamily: TYPE.sans, color: fg }}>
        <div style={{ position: 'absolute', top: 120, left: 0, right: 0 }}><GradientHairline h={3} /></div>
        <div style={{ position: 'absolute', top: 60, left: 80, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: TYPE.mono, fontSize: 14, letterSpacing: '0.24em', textTransform: 'uppercase', color: muted }}>{BRAND_EYEBROW}</div>
          <div style={{ fontFamily: TYPE.mono, fontSize: 14, letterSpacing: '0.18em', textTransform: 'uppercase', color: muted }}>{NUMERO + ' 01 ' + MIDDOT + ' Story'}</div>
        </div>
        <div style={{ position: 'absolute', top: 280, left: 80, right: 80 }}>
          <div style={{ fontFamily: TYPE.sans, fontSize: 200, fontWeight: 600, lineHeight: 0.75, color: accent(cobrand), letterSpacing: '-0.04em', marginBottom: 12 }}>{LDQUO}</div>
          <div style={{ fontSize: 88, fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.025em', color: fg, textWrap: 'pretty', maxWidth: 920 }}>How do you find verified buyers and suppliers without Bloomberg-tier budgets?</div>
        </div>
        <div style={{ position: 'absolute', top: 1180, left: 80, right: 80 }}>
          <Eyebrow color={accent(cobrand)} size={16}>The answer</Eyebrow>
          <div style={{ marginTop: 22, fontSize: 44, fontWeight: 500, lineHeight: 1.28, color: muted, maxWidth: 900, letterSpacing: '-0.01em' }}>AI-native trade intelligence, grounded in 7B+ source records.</div>
        </div>
        <div style={{ position: 'absolute', left: 60, right: 60, bottom: 80, background: panelBg, borderRadius: 22, padding: '40px 56px', display: 'flex', flexDirection: 'column', gap: 24, boxShadow: dark ? '0 24px 60px rgba(0,0,0,0.35)' : 'none' }}>
          <Brand width={brandW} cobrand={cobrand} />
          <div style={{ height: 1, background: 'rgba(15,27,45,0.10)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 28 }}>
            <ReferredBy name={aff.full_name} dark={false} prominence="emphasis" />
            <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(15,27,45,0.10)' }} />
            <CodeBlock aff={aff} dark={false} size="md" cobrand={cobrand} />
          </div>
        </div>
      </div>
    );
  }

  function InstagramStoryStats({ aff, dark = true, cobrand }) {
    const bg = dark ? PALETTE.ink : PALETTE.paper;
    const fg = dark ? PALETTE.white : PALETTE.ink;
    const muted = dark ? 'rgba(238,243,250,0.6)' : 'rgba(15,27,45,0.6)';
    const ruleColor = dark ? 'rgba(238,243,250,0.18)' : 'rgba(15,27,45,0.15)';
    const panelBg = dark ? PALETTE.paper : PALETTE.white;
    const brandW = cobrand?.partner ? 540 : 300;
    const stats = [
      { value: '7B+', label: 'Verified trade records' },
      { value: '87', label: 'Platform capabilities' },
      { value: '5', label: 'Intelligence layers' },
    ];
    return (
      <div style={{ width: 1080, height: 1920, background: bg, position: 'relative', overflow: 'hidden', fontFamily: TYPE.sans, color: fg }}>
        <div style={{ position: 'absolute', top: 120, left: 0, right: 0 }}><GradientHairline h={3} /></div>
        <div style={{ position: 'absolute', top: 60, left: 80, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: TYPE.mono, fontSize: 14, letterSpacing: '0.24em', textTransform: 'uppercase', color: muted }}>{BRAND_EYEBROW}</div>
          <div style={{ fontFamily: TYPE.mono, fontSize: 14, letterSpacing: '0.18em', textTransform: 'uppercase', color: muted }}>{NUMERO + ' 02 ' + MIDDOT + ' Story'}</div>
        </div>
        <div style={{ position: 'absolute', top: 260, left: 80, right: 80 }}>
          <Eyebrow color={accent(cobrand)} size={16}>The substrate</Eyebrow>
          <div style={{ marginTop: 28, fontSize: 96, fontWeight: 600, lineHeight: 1.02, letterSpacing: '-0.03em', color: fg, maxWidth: 880 }}>
            AI-native.<br />
            <span style={{ color: accent(cobrand) }}>Source-anchored.</span>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 720, left: 80, right: 80, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {stats.map((s, i) => (
            <div key={s.value} style={{ display: 'grid', gridTemplateColumns: '260px 1fr', alignItems: 'baseline', padding: '24px 0 20px 0', borderTop: `1px solid ${ruleColor}`, borderBottom: i === stats.length - 1 ? `1px solid ${ruleColor}` : 'none', gap: 24 }}>
              <div style={{ fontFamily: TYPE.sans, fontSize: 124, fontWeight: 600, lineHeight: 0.9, letterSpacing: '-0.045em', color: fg, fontFeatureSettings: '"tnum" 1' }}>{s.value}</div>
              <div style={{ fontFamily: TYPE.sans, fontSize: 24, fontWeight: 500, lineHeight: 1.3, color: muted, letterSpacing: '-0.005em', alignSelf: 'end', paddingBottom: 14 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 60, right: 60, bottom: 80, background: panelBg, borderRadius: 22, padding: '40px 56px', display: 'flex', flexDirection: 'column', gap: 24, boxShadow: dark ? '0 24px 60px rgba(0,0,0,0.35)' : 'none' }}>
          <Brand width={brandW} cobrand={cobrand} />
          <div style={{ height: 1, background: 'rgba(15,27,45,0.10)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 28 }}>
            <ReferredBy name={aff.full_name} dark={false} prominence="emphasis" />
            <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(15,27,45,0.10)' }} />
            <CodeBlock aff={aff} dark={false} size="md" cobrand={cobrand} />
          </div>
        </div>
      </div>
    );
  }

  function XHeader({ aff, dark = true, line, cobrand }) {
    const bg = dark ? PALETTE.ink : PALETTE.paper;
    const fg = dark ? PALETTE.white : PALETTE.ink;
    const ruleColor = dark ? 'rgba(238,243,250,0.18)' : 'rgba(15,27,45,0.15)';
    const brandW = cobrand?.partner ? 460 : 260;
    const leftCol = cobrand?.partner ? '500px' : '360px';
    return (
      <div style={{ width: 1500, height: 500, background: bg, position: 'relative', overflow: 'hidden', fontFamily: TYPE.sans, color: fg }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}><GradientHairline h={3} /></div>
        <div style={{ position: 'absolute', inset: '80px 80px 60px 80px', display: 'grid', gridTemplateColumns: `${leftCol} 1px 1fr`, gap: 48, alignItems: 'stretch' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Brand width={brandW} cobrand={cobrand} inset={dark} padding={14} radius={10} bg={dark ? PALETTE.paper : 'transparent'} />
            <ReferredBy name={aff.full_name} dark={dark} prominence="emphasis" />
          </div>
          <div style={{ width: 1, background: ruleColor }} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
            <div style={{ fontSize: 60, fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.03em', color: fg, textWrap: 'balance', maxWidth: 880 }}>
              {pickHeadline(line, cobrand, 'AI-native AND source-anchored.')}
            </div>
            <CodeBlock aff={aff} dark={dark} size="lg" cobrand={cobrand} />
          </div>
        </div>
      </div>
    );
  }

  function ShareCard({ aff, dark = true, line, cobrand }) {
    const bg = dark ? PALETTE.ink : PALETTE.paper;
    const fg = dark ? PALETTE.white : PALETTE.ink;
    const muted = dark ? 'rgba(238,243,250,0.6)' : 'rgba(15,27,45,0.6)';
    const ruleColor = dark ? 'rgba(238,243,250,0.18)' : 'rgba(15,27,45,0.15)';
    const brandW = cobrand?.partner ? 360 : 200;
    return (
      <div style={{ width: 1600, height: 900, background: bg, position: 'relative', overflow: 'hidden', fontFamily: TYPE.sans, color: fg }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}><GradientHairline h={4} /></div>
        <div style={{ position: 'absolute', top: 60, left: 80, right: 80, display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: TYPE.mono, fontSize: 15, letterSpacing: '0.26em', textTransform: 'uppercase', color: muted }}>{BRAND_EYEBROW}</div>
          <div style={{ fontFamily: TYPE.mono, fontSize: 15, letterSpacing: '0.18em', textTransform: 'uppercase', color: muted }}>adamftd.com</div>
        </div>
        <div style={{ position: 'absolute', top: 140, left: 80, right: 80, bottom: 270, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Eyebrow color={accent(cobrand)} size={15}>Trade intelligence, grounded</Eyebrow>
          <div style={{ marginTop: 24, fontSize: 88, fontWeight: 600, lineHeight: 1.02, letterSpacing: '-0.03em', color: fg, textWrap: 'balance', maxWidth: 1280 }}>
            {pickHeadline(line, cobrand)}
          </div>
          <div style={{ marginTop: 28, fontSize: 28, fontWeight: 500, color: muted, letterSpacing: '-0.01em', maxWidth: 1100 }}>For SMEs, exporters, and the consultancies advising them. Not Bloomberg-tier budgets.</div>
        </div>
        <div style={{ position: 'absolute', bottom: 50, left: 80, right: 80, height: 220, paddingTop: 28, borderTop: `1px solid ${ruleColor}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 48, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <Brand width={brandW} cobrand={cobrand} inset={dark} padding={12} radius={10} bg={dark ? PALETTE.paper : 'transparent'} />
            <div style={{ width: 1, height: 80, background: ruleColor }} />
            <ReferredBy name={aff.full_name} dark={dark} prominence="emphasis" />
          </div>
          <CodeBlock aff={aff} dark={dark} size="lg" cobrand={cobrand} />
        </div>
      </div>
    );
  }

  function FacebookCover({ aff, dark = true, cobrand }) {
    const bg = dark ? PALETTE.ink : PALETTE.paper;
    const fg = dark ? PALETTE.white : PALETTE.ink;
    const muted = dark ? 'rgba(238,243,250,0.65)' : 'rgba(15,27,45,0.65)';
    const ruleColor = dark ? 'rgba(238,243,250,0.18)' : 'rgba(15,27,45,0.15)';
    const brandW = cobrand?.partner ? 360 : 200;
    const leftCol = cobrand?.partner ? '380px' : '220px';
    return (
      <div style={{ width: 820, height: 312, background: bg, position: 'relative', overflow: 'hidden', fontFamily: TYPE.sans, color: fg }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}><GradientHairline h={2} /></div>
        <div style={{ position: 'absolute', inset: '36px 40px', display: 'grid', gridTemplateColumns: `${leftCol} 1px 1fr`, gap: 28, alignItems: 'stretch' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Brand width={brandW} cobrand={cobrand} inset={dark} padding={10} radius={8} bg={dark ? PALETTE.paper : 'transparent'} />
            <div style={{ fontFamily: TYPE.mono, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: muted }}>Referred by <span style={{ color: fg, fontWeight: 500 }}>{aff.full_name}</span></div>
          </div>
          <div style={{ width: 1, background: ruleColor }} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.02em', color: fg, textWrap: 'balance' }}>
              {cobrand?.hero_override?.trim() || 'AI-native trade intelligence, grounded in source data.'}
            </div>
            <CodeBlock aff={aff} dark={dark} size="sm" cobrand={cobrand} />
          </div>
        </div>
      </div>
    );
  }

  function EmailBanner({ aff, dark = true, cobrand }) {
    const bg = dark ? PALETTE.ink : PALETTE.paper;
    const fg = dark ? PALETTE.white : PALETTE.ink;
    const ruleColor = dark ? 'rgba(238,243,250,0.18)' : 'rgba(15,27,45,0.15)';
    const brandW = cobrand?.partner ? 420 : 240;
    const leftCol = cobrand?.partner ? '460px' : '320px';
    return (
      <div style={{ width: 1200, height: 400, background: bg, position: 'relative', overflow: 'hidden', fontFamily: TYPE.sans, color: fg }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}><GradientHairline h={3} /></div>
        <div style={{ position: 'absolute', inset: '52px 60px', display: 'grid', gridTemplateColumns: `${leftCol} 1px 1fr`, gap: 40, alignItems: 'stretch' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Brand width={brandW} cobrand={cobrand} inset={dark} padding={14} radius={10} bg={dark ? PALETTE.paper : 'transparent'} />
            <ReferredBy name={aff.full_name} dark={dark} prominence="emphasis" />
          </div>
          <div style={{ width: 1, background: ruleColor }} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
            <div>
              <Eyebrow color={accent(cobrand)} size={12}>{'You' + RSQUO + 've been invited'}</Eyebrow>
              <div style={{ marginTop: 14, fontSize: 36, fontWeight: 600, lineHeight: 1.08, letterSpacing: '-0.025em', color: fg, textWrap: 'balance', maxWidth: 720 }}>{aff.first_name} thinks ADAMftd can help your trade work.</div>
            </div>
            <CodeBlock aff={aff} dark={dark} size="md" cobrand={cobrand} />
          </div>
        </div>
      </div>
    );
  }

  function ZoomBackground({ aff, dark = true, cobrand }) {
    const bg = dark ? PALETTE.ink : PALETTE.paper;
    const fg = dark ? PALETTE.white : PALETTE.ink;
    const muted = dark ? 'rgba(238,243,250,0.55)' : 'rgba(15,27,45,0.55)';
    const ruleColor = dark ? 'rgba(238,243,250,0.14)' : 'rgba(15,27,45,0.10)';
    const brandW = cobrand?.partner ? 600 : 340;
    return (
      <div style={{ width: 1920, height: 1080, background: bg, position: 'relative', overflow: 'hidden', fontFamily: TYPE.sans, color: fg }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}><GradientHairline h={3} /></div>
        <div style={{ position: 'absolute', top: 80, left: 100, fontFamily: TYPE.mono, fontSize: 16, letterSpacing: '0.26em', textTransform: 'uppercase', color: muted }}>{BRAND_EYEBROW}</div>
        <div style={{ position: 'absolute', top: 240, left: 100, right: 800 }}>
          <Eyebrow color={accent(cobrand)} size={16}>Trade intelligence, grounded</Eyebrow>
          <div style={{ marginTop: 28, fontSize: 84, fontWeight: 600, lineHeight: 1.02, letterSpacing: '-0.03em', color: fg, textWrap: 'balance' }}>
            {cobrand?.hero_override?.trim() || 'AI-native AND source-anchored.'}
          </div>
          <div style={{ marginTop: 28, fontSize: 24, fontWeight: 500, color: muted, letterSpacing: '-0.005em', maxWidth: 760 }}>For SMEs, exporters, and the consultancies advising them.</div>
        </div>
        <div style={{ position: 'absolute', left: 100, bottom: 80 }}>
          <Brand width={brandW} cobrand={cobrand} inset={dark} padding={20} radius={12} bg={dark ? PALETTE.paper : 'transparent'} />
        </div>
        <div style={{ position: 'absolute', top: 80, right: 100, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ fontFamily: TYPE.mono, fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: muted }}>Referred by <span style={{ color: fg, fontWeight: 500 }}>{aff.full_name}</span></div>
          <div style={{ padding: '18px 24px', background: dark ? 'rgba(238,243,250,0.06)' : 'rgba(15,27,45,0.04)', border: `1px solid ${ruleColor}`, borderRadius: 10 }}>
            <CodeBlock aff={aff} dark={dark} size="md" align="right" cobrand={cobrand} />
          </div>
        </div>
      </div>
    );
  }

  function BusinessCardFront({ aff, cobrand }) {
    const brandW = cobrand?.partner ? 700 : 420;
    return (
      <div style={{ width: 1050, height: 600, background: PALETTE.paper, position: 'relative', overflow: 'hidden', fontFamily: TYPE.sans, color: PALETTE.ink }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}><GradientHairline h={4} /></div>
        <div style={{ position: 'absolute', inset: '60px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Brand width={brandW} cobrand={cobrand} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Eyebrow color={accent(cobrand)} size={11}>Trade intelligence, grounded</Eyebrow>
            <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15, maxWidth: 760, textWrap: 'balance', color: PALETTE.ink }}>AI-native AND source-anchored.</div>
          </div>
        </div>
      </div>
    );
  }

  function BusinessCardBack({ aff, cobrand }) {
    return (
      <div style={{ width: 1050, height: 600, background: PALETTE.ink, position: 'relative', overflow: 'hidden', fontFamily: TYPE.sans, color: PALETTE.white }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}><GradientHairline h={4} /></div>
        <div style={{ position: 'absolute', inset: '60px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: TYPE.mono, fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(238,243,250,0.6)' }}>{BRAND_EYEBROW}</div>
            <div style={{ marginTop: 14, fontFamily: TYPE.mono, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(238,243,250,0.55)' }}>Referred by</div>
            <div style={{ marginTop: 4, fontSize: 38, fontWeight: 600, letterSpacing: '-0.02em', color: PALETTE.white, lineHeight: 1.05 }}>{aff.full_name}</div>
          </div>
          <CodeBlock aff={aff} dark={true} size="lg" cobrand={cobrand} />
        </div>
      </div>
    );
  }

  function A4OnePager({ aff, cobrand }) {
    const ruleColor = 'rgba(15,27,45,0.10)';
    const muted = 'rgba(15,27,45,0.6)';
    const brandW = cobrand?.partner ? 540 : 300;
    return (
      <div style={{ width: 794, height: 1123, background: PALETTE.paper, position: 'relative', overflow: 'hidden', fontFamily: TYPE.sans, color: PALETTE.ink }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}><GradientHairline h={3} /></div>
        <div style={{ position: 'absolute', inset: '64px 56px 56px 56px', display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Brand width={brandW} cobrand={cobrand} />
            <div style={{ fontFamily: TYPE.mono, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: muted, textAlign: 'right' }}>{'One-pager ' + MIDDOT + ' v1'}<br />May 2026</div>
          </div>
          <div style={{ height: 1, background: ruleColor }} />
          <div>
            <Eyebrow color={accent(cobrand)} size={11}>Trade intelligence, grounded</Eyebrow>
            <div style={{ marginTop: 14, fontSize: 36, fontWeight: 600, lineHeight: 1.08, letterSpacing: '-0.025em', color: PALETTE.ink, textWrap: 'balance', maxWidth: 640 }}>
              {cobrand?.hero_override?.trim() || 'AI-native trade intelligence, grounded in source data.'}
            </div>
            <div style={{ marginTop: 14, fontSize: 16, lineHeight: 1.5, color: muted, maxWidth: 600 }}>For SMEs, exporters, and the consultancies advising them. A conversational AI that talks to verified trade data, not a search box.</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: `1px solid ${ruleColor}`, borderBottom: `1px solid ${ruleColor}` }}>
            {[{ v: '7B+', l: 'Verified trade records' }, { v: '87', l: 'Platform capabilities' }, { v: '5', l: 'Intelligence layers' }].map((s, i) => (
              <div key={s.v} style={{ padding: '22px 22px', borderLeft: i === 0 ? 'none' : `1px solid ${ruleColor}` }}>
                <div style={{ fontSize: 56, fontWeight: 600, lineHeight: 0.95, letterSpacing: '-0.04em', color: PALETTE.ink, fontFeatureSettings: '"tnum" 1' }}>{s.v}</div>
                <div style={{ marginTop: 10, fontSize: 12, fontWeight: 500, color: muted, letterSpacing: '-0.002em' }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 28 }}>
            {[
              { h: 'What it is', b: 'A conversational AI for international trade. Ask in plain language, get answers cited to source records.' },
              { h: 'Who it' + RSQUO + 's for', b: 'SMEs, exporters, and the consultancies that advise them. Not Bloomberg-tier budgets.' },
              { h: 'How it differs', b: 'AI-native AND source-anchored. Both halves matter. No search box, no scraped guesses.' },
            ].map(c => (
              <div key={c.h}>
                <div style={{ fontFamily: TYPE.mono, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: accent(cobrand), fontWeight: 500, marginBottom: 10 }}>{c.h}</div>
                <div style={{ fontSize: 13, lineHeight: 1.5, color: PALETTE.ink }}>{c.b}</div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ background: PALETTE.ink, color: PALETTE.white, borderRadius: 14, padding: '28px 32px', display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 28, alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: TYPE.mono, fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(238,243,250,0.55)' }}>Referred by</div>
              <div style={{ marginTop: 4, fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>{aff.full_name}</div>
            </div>
            <div style={{ width: 1, height: 56, background: 'rgba(238,243,250,0.2)' }} />
            <CodeBlock aff={aff} dark={true} size="md" cobrand={cobrand} />
          </div>
        </div>
      </div>
    );
  }

  const ASSETS = [
    { id: 'linkedin_banner',     label: 'LinkedIn banner',                w: 1584, h: 396,  Comp: LinkedInBanner,         useLine: true,  group: 'Cover rails (profile headers)' },
    { id: 'x_header',            label: 'X header',                       w: 1500, h: 500,  Comp: XHeader,                useLine: true,  group: 'Cover rails (profile headers)' },
    { id: 'facebook_cover',      label: 'Facebook cover',                 w: 820,  h: 312,  Comp: FacebookCover,                          group: 'Cover rails (profile headers)' },
    { id: 'instagram_curiosity', label: 'IG / LI feed (curiosity)',       w: 1080, h: 1080, Comp: InstagramCuriosity,                     group: 'Feed posts (square)' },
    { id: 'instagram_stats',     label: 'IG / LI feed (stats)',           w: 1080, h: 1080, Comp: InstagramStats,                         group: 'Feed posts (square)' },
    { id: 'story_curiosity',     label: 'Story (curiosity)',              w: 1080, h: 1920, Comp: InstagramStoryCuriosity,                group: 'Stories (vertical)' },
    { id: 'story_stats',         label: 'Story (stats)',                  w: 1080, h: 1920, Comp: InstagramStoryStats,                    group: 'Stories (vertical)' },
    { id: 'share_card',          label: 'Share card (OG / X)',            w: 1600, h: 900,  Comp: ShareCard,              useLine: true,  group: 'Share card (OG / X)' },
    { id: 'email_signature',     label: 'Email signature (light)',        w: 600,  h: 120,  Comp: EmailSignature,         forceLight: true, group: 'Email' },
    { id: 'email_signature_dark',label: 'Email signature (dark)',         w: 600,  h: 120,  Comp: EmailSignature,         forceDark: true,  group: 'Email' },
    { id: 'email_banner',        label: 'Email banner (newsletter hero)', w: 1200, h: 400,  Comp: EmailBanner,                            group: 'Email' },
    { id: 'zoom_background',     label: 'Zoom / Meet virtual background', w: 1920, h: 1080, Comp: ZoomBackground,                         group: 'Virtual presence' },
    { id: 'business_card_front', label: 'Business card (front)',          w: 1050, h: 600,  Comp: BusinessCardFront,      noDark: true,   group: 'Print' },
    { id: 'business_card_back',  label: 'Business card (back)',           w: 1050, h: 600,  Comp: BusinessCardBack,       noDark: true,   group: 'Print' },
    { id: 'a4_onepager',         label: 'A4 one-pager',                   w: 794,  h: 1123, Comp: A4OnePager,             noDark: true,   group: 'Print' },
  ];

  function Artboard({ asset, aff, dark, line, scale, cobrand }) {
    const ref = useRef(null);
    const { Comp, w, h } = asset;
    const compProps = { aff, cobrand };
    if (!asset.noDark) compProps.dark = asset.forceLight ? false : asset.forceDark ? true : dark;
    if (asset.useLine) compProps.line = line;
    return (
      <div className="artboard-wrap">
        <div className="artboard-meta">
          <div className="artboard-label">{asset.label + ' ' + MIDDOT + ' ' + w + 'x' + h}</div>
          <button className="btn" onClick={() => window.__downloadOne && window.__downloadOne(ref.current, asset)}>Download PNG</button>
        </div>
        <div className="artboard-scaler" style={{ width: w * scale, height: h * scale }}>
          <div ref={ref} data-asset-id={asset.id} className="artboard-frame" style={{ width: w, height: h, transform: `scale(${scale})` }}>
            <Comp {...compProps} />
          </div>
        </div>
      </div>
    );
  }

  window.AGK = {
    PALETTE, TYPE, POSITIONING_LINES, ASSETS,
    Artboard, MIDDOT,
  };
})();
