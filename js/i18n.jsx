/*
 * ADAMftd Partner Kit — internationalisation (Phase 1: app frame).
 *
 * Provides a language switcher and translations for the dashboard
 * frame: gate, toolbar, greeting and all tile headers. Deep content
 * (content blocks, Demo Pocket Script, graphics text) is translated in
 * later phases and currently stays in English.
 *
 * Translations are machine drafts for review. Brand terms (ADAMftd,
 * the affiliate code, adamftd.com) are intentionally left untranslated.
 *
 * Exposes window.AGK.i18n = { LANGS, LangProvider, useT }.
 */
(function () {
  const { createContext, useContext, useState, useCallback, useEffect } = React;

  const LANGS = [
    { code: 'en', label: 'English',  native: 'English',  dir: 'ltr' },
    { code: 'it', label: 'Italian',  native: 'Italiano', dir: 'ltr' },
    { code: 'es', label: 'Spanish',  native: 'Espanol',  dir: 'ltr' },
    { code: 'zh', label: 'Chinese',  native: '中文', dir: 'ltr' },
    { code: 'ar', label: 'Arabic',   native: 'العربية', dir: 'rtl' },
  ];

  const LANG_KEY = 'adamftd_kit_lang';

  const STR = {
    en: {
      'gate.title': 'Welcome to the ADAMftd Partner Kit',
      'gate.sub': 'Click the personal link in your welcome email, or paste your access key below.',
      'gate.placeholder': 'your-access-key',
      'gate.continue': 'Continue',
      'gate.checking': 'Checking...',
      'gate.help': "Don't have your link? Check your welcome email or write to ",

      'tb.generatingFor': 'Generating for',
      'tb.heroLabel': 'Hero headline (banner, X header, share card)',
      'tb.light': 'Light',
      'tb.dark': 'Dark',
      'tb.single': 'Single',
      'tb.cobrand': 'Co-brand',
      'tb.perksOn': 'Perks on',
      'tb.perksOff': 'Perks off',
      'tb.downloadZip': 'Download all (ZIP)',
      'tb.signout': 'Sign out',
      'tb.language': 'Language',

      'greet.hello': 'Welcome, {name}.',
      'greet.sub': 'Your personalised ADAMftd Partner Kit. Click any tile to expand.',
      'welcome.show': 'Show welcome',

      'demo.title': 'Demo Pocket Script',
      'demo.badgeNew': 'New',
      'demo.badgeTrack': 'Trader track v1.4',
      'demo.sub': '10-minute live walkthrough every Affiliate uses on a prospect call. Screen by screen, talk track by talk track.',
      'demo.count': '7 modules',

      'graphics.title': 'Graphics',
      'graphics.sub': 'Personalised covers, social posts, share cards, one-pager.',
      'graphics.count': '{n} assets',

      'content.title': 'Content',
      'content.sub': 'Captions, email templates, DM scripts, elevator pitches, FAQ.',
      'content.count': '60+ blocks',

      'tools.title': 'Tools',
      'tools.sub': 'Personal QR code, your trackable referral link.',
      'tools.count': '2 tools',

      'download.title': 'Download',
      'download.sub': 'Full ZIP bundle of every asset in your Kit.',
      'download.count': '1 file',

      'sub.title': 'Sub-affiliate referrals',
      'sub.sub': 'Refer Tier 2 sub-affiliates under you, and track them here.',
    },

    it: {
      'gate.title': 'Benvenuto nel Partner Kit di ADAMftd',
      'gate.sub': 'Clicca il link personale nella tua email di benvenuto, oppure incolla qui sotto la tua chiave di accesso.',
      'gate.placeholder': 'la-tua-chiave-di-accesso',
      'gate.continue': 'Continua',
      'gate.checking': 'Verifica in corso...',
      'gate.help': 'Non hai il link? Controlla la tua email di benvenuto o scrivi a ',

      'tb.generatingFor': 'Generazione per',
      'tb.heroLabel': 'Titolo principale (banner, header X, share card)',
      'tb.light': 'Chiaro',
      'tb.dark': 'Scuro',
      'tb.single': 'Singolo',
      'tb.cobrand': 'Co-brand',
      'tb.perksOn': 'Vantaggi attivi',
      'tb.perksOff': 'Vantaggi spenti',
      'tb.downloadZip': 'Scarica tutto (ZIP)',
      'tb.signout': 'Esci',
      'tb.language': 'Lingua',

      'greet.hello': 'Benvenuto, {name}.',
      'greet.sub': 'Il tuo Partner Kit ADAMftd personalizzato. Clicca un riquadro per espanderlo.',
      'welcome.show': 'Mostra benvenuto',

      'demo.title': 'Demo Pocket Script',
      'demo.badgeNew': 'Nuovo',
      'demo.badgeTrack': 'Percorso trader v1.4',
      'demo.sub': 'Percorso live di 10 minuti che ogni Affiliato usa nelle chiamate con i prospect. Schermata per schermata, battuta per battuta.',
      'demo.count': '7 moduli',

      'graphics.title': 'Grafiche',
      'graphics.sub': 'Copertine personalizzate, post social, share card, one-pager.',
      'graphics.count': '{n} risorse',

      'content.title': 'Contenuti',
      'content.sub': 'Didascalie, modelli email, script per DM, pitch, FAQ.',
      'content.count': '60+ blocchi',

      'tools.title': 'Strumenti',
      'tools.sub': 'Codice QR personale, il tuo link referral tracciabile.',
      'tools.count': '2 strumenti',

      'download.title': 'Download',
      'download.sub': 'Pacchetto ZIP completo di tutte le risorse del tuo Kit.',
      'download.count': '1 file',

      'sub.title': 'Referral sub-affiliati',
      'sub.sub': 'Segnala sub-affiliati di livello 2 sotto di te e monitorali qui.',
    },

    es: {
      'gate.title': 'Bienvenido al Partner Kit de ADAMftd',
      'gate.sub': 'Haz clic en el enlace personal de tu correo de bienvenida, o pega tu clave de acceso abajo.',
      'gate.placeholder': 'tu-clave-de-acceso',
      'gate.continue': 'Continuar',
      'gate.checking': 'Comprobando...',
      'gate.help': 'No tienes tu enlace? Revisa tu correo de bienvenida o escribe a ',

      'tb.generatingFor': 'Generando para',
      'tb.heroLabel': 'Titular principal (banner, encabezado de X, share card)',
      'tb.light': 'Claro',
      'tb.dark': 'Oscuro',
      'tb.single': 'Individual',
      'tb.cobrand': 'Co-marca',
      'tb.perksOn': 'Ventajas activadas',
      'tb.perksOff': 'Ventajas desactivadas',
      'tb.downloadZip': 'Descargar todo (ZIP)',
      'tb.signout': 'Cerrar sesion',
      'tb.language': 'Idioma',

      'greet.hello': 'Bienvenido, {name}.',
      'greet.sub': 'Tu Partner Kit de ADAMftd personalizado. Haz clic en cualquier panel para expandirlo.',
      'welcome.show': 'Mostrar bienvenida',

      'demo.title': 'Demo Pocket Script',
      'demo.badgeNew': 'Nuevo',
      'demo.badgeTrack': 'Ruta trader v1.4',
      'demo.sub': 'Recorrido en vivo de 10 minutos que cada Afiliado usa en una llamada con un prospecto. Pantalla por pantalla, guion por guion.',
      'demo.count': '7 modulos',

      'graphics.title': 'Graficos',
      'graphics.sub': 'Portadas personalizadas, publicaciones sociales, share cards, one-pager.',
      'graphics.count': '{n} recursos',

      'content.title': 'Contenido',
      'content.sub': 'Textos, plantillas de correo, guiones de DM, pitches, preguntas frecuentes.',
      'content.count': '60+ bloques',

      'tools.title': 'Herramientas',
      'tools.sub': 'Codigo QR personal, tu enlace de referido rastreable.',
      'tools.count': '2 herramientas',

      'download.title': 'Descargar',
      'download.sub': 'Paquete ZIP completo con todos los recursos de tu Kit.',
      'download.count': '1 archivo',

      'sub.title': 'Referidos de sub-afiliados',
      'sub.sub': 'Recomienda sub-afiliados de Nivel 2 bajo tu cuenta y haz seguimiento aqui.',
    },

    zh: {
      'gate.title': '欢迎使用 ADAMftd 合伙人套件',
      'gate.sub': '请点击欢迎邮件中的个人链接，或在下方粘贴您的访问密钥。',
      'gate.placeholder': '您的访问密钥',
      'gate.continue': '继续',
      'gate.checking': '正在检查...',
      'gate.help': '没有链接？请查看欢迎邮件或发邮件至 ',

      'tb.generatingFor': '生成对象',
      'tb.heroLabel': '主标题（横幅、X 页眉、分享卡）',
      'tb.light': '浅色',
      'tb.dark': '深色',
      'tb.single': '单品牌',
      'tb.cobrand': '联名',
      'tb.perksOn': '福利开',
      'tb.perksOff': '福利关',
      'tb.downloadZip': '全部下载（ZIP）',
      'tb.signout': '退出',
      'tb.language': '语言',

      'greet.hello': '欢迎，{name}。',
      'greet.sub': '您专属的 ADAMftd 合伙人套件。点击任意卡片展开。',
      'welcome.show': '显示欢迎信息',

      'demo.title': 'Demo Pocket Script',
      'demo.badgeNew': '新',
      'demo.badgeTrack': '交易商路径 v1.4',
      'demo.sub': '每位合伙人在潜客通话中使用的 10 分钟实时演示。逐屏讲解，逐句话术。',
      'demo.count': '7 个模块',

      'graphics.title': '图形素材',
      'graphics.sub': '个性化封面、社交帖文、分享卡、单页介绍。',
      'graphics.count': '{n} 个素材',

      'content.title': '文案内容',
      'content.sub': '配文、邮件模板、私信话术、电梯演讲、常见问题。',
      'content.count': '60+ 个模块',

      'tools.title': '工具',
      'tools.sub': '个人二维码，可追踪的推荐链接。',
      'tools.count': '2 项工具',

      'download.title': '下载',
      'download.sub': '包含套件全部素材的完整 ZIP 包。',
      'download.count': '1 个文件',

      'sub.title': '下级合伙人推荐',
      'sub.sub': '在您名下推荐二级合伙人，并在此追踪。',
    },

    ar: {
      'gate.title': 'مرحبًا بك في مجموعة شركاء ADAMftd',
      'gate.sub': 'انقر على الرابط الشخصي في رسالة الترحيب، أو الصق مفتاح الوصول أدناه.',
      'gate.placeholder': 'مفتاح-الوصول',
      'gate.continue': 'متابعة',
      'gate.checking': 'جارٍ التحقق...',
      'gate.help': 'ليس لديك الرابط؟ تحقق من رسالة الترحيب أو راسلنا على ',

      'tb.generatingFor': 'إنشاء لـ',
      'tb.heroLabel': 'العنوان الرئيسي (بانر، ترويسة X، بطاقة مشاركة)',
      'tb.light': 'فاتح',
      'tb.dark': 'داكن',
      'tb.single': 'فردي',
      'tb.cobrand': 'علامة مشتركة',
      'tb.perksOn': 'المزايا مفعّلة',
      'tb.perksOff': 'المزايا موقوفة',
      'tb.downloadZip': 'تنزيل الكل (ZIP)',
      'tb.signout': 'تسجيل الخروج',
      'tb.language': 'اللغة',

      'greet.hello': 'مرحبًا، {name}.',
      'greet.sub': 'مجموعة شركاء ADAMftd الخاصة بك. انقر على أي بطاقة لتوسيعها.',
      'welcome.show': 'إظهار الترحيب',

      'demo.title': 'Demo Pocket Script',
      'demo.badgeNew': 'جديد',
      'demo.badgeTrack': 'مسار المتداول v1.4',
      'demo.sub': 'جولة حية مدتها 10 دقائق يستخدمها كل شريك في مكالمة مع عميل محتمل. شاشة تلو الأخرى، ونصًا تلو الآخر.',
      'demo.count': '7 وحدات',

      'graphics.title': 'الرسومات',
      'graphics.sub': 'أغلفة مخصصة، منشورات اجتماعية، بطاقات مشاركة، صفحة واحدة.',
      'graphics.count': '{n} عنصر',

      'content.title': 'المحتوى',
      'content.sub': 'تعليقات، قوالب بريد، نصوص رسائل مباشرة، عروض موجزة، أسئلة شائعة.',
      'content.count': '60+ كتلة',

      'tools.title': 'الأدوات',
      'tools.sub': 'رمز QR شخصي، رابط الإحالة القابل للتتبع.',
      'tools.count': 'أداتان',

      'download.title': 'التنزيل',
      'download.sub': 'حزمة ZIP كاملة بكل عناصر مجموعتك.',
      'download.count': 'ملف واحد',

      'sub.title': 'إحالات الشركاء الفرعيين',
      'sub.sub': 'أحل شركاء فرعيين من المستوى 2 تحتك، وتتبعهم هنا.',
    },
  };

  function readInitialLang() {
    try {
      const url = new URLSearchParams(window.location.search).get('lang');
      if (url && STR[url]) return url;
      const stored = window.localStorage.getItem(LANG_KEY);
      if (stored && STR[stored]) return stored;
    } catch (_) { /* ignore */ }
    return 'en';
  }

  function interpolate(s, vars) {
    if (!vars) return s;
    return s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
  }

  const LangContext = createContext(null);

  function LangProvider({ children }) {
    const [lang, setLangState] = useState(readInitialLang);

    const dir = (LANGS.find((l) => l.code === lang) || {}).dir || 'ltr';

    useEffect(() => {
      try {
        document.documentElement.setAttribute('lang', lang);
        document.documentElement.setAttribute('dir', dir);
      } catch (_) { /* ignore */ }
    }, [lang, dir]);

    const setLang = useCallback((code) => {
      if (!STR[code]) return;
      setLangState(code);
      try { window.localStorage.setItem(LANG_KEY, code); } catch (_) {}
      try {
        const u = new URL(window.location.href);
        if (code === 'en') u.searchParams.delete('lang');
        else u.searchParams.set('lang', code);
        window.history.replaceState({}, '', u.toString());
      } catch (_) {}
    }, []);

    const t = useCallback((key, vars) => {
      const table = STR[lang] || STR.en;
      const s = (table[key] != null ? table[key] : (STR.en[key] != null ? STR.en[key] : key));
      return interpolate(s, vars);
    }, [lang]);

    return React.createElement(LangContext.Provider, { value: { lang, dir, setLang, t } }, children);
  }

  function useT() {
    const ctx = useContext(LangContext);
    if (ctx) return ctx;
    // Fallback if used outside a provider: English, no-op switcher.
    return {
      lang: 'en', dir: 'ltr', setLang: () => {},
      t: (key, vars) => interpolate((STR.en[key] != null ? STR.en[key] : key), vars),
    };
  }

  function LanguageSwitcher({ className }) {
    const { lang, setLang, t } = useT();
    return (
      <label className={className || 'lang-switcher'} aria-label={t('tb.language')}>
        <span className="lang-switcher-icon" aria-hidden>{'🌐'}</span>
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          {LANGS.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
        </select>
      </label>
    );
  }

  window.AGK = window.AGK || {};
  window.AGK.i18n = { LANGS, STR, LangProvider, useT, LanguageSwitcher };
})();
