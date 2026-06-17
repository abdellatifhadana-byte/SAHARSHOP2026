import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { t, type Lang, LANGS, isRtlLang } from '../i18n/translations';
import { Bot, MessageCircle, Truck, BarChart3, ShieldCheck, Sparkles, Check, Star, ChevronDown, ArrowRight, ArrowLeft } from 'lucide-react';

// ════════════════════════════════════════════════════════════════
// صفحة الهبوط — تصميم عصري متعدّد الأقسام يشرح المنصّة بالكامل.
// النصوص الموجودة مسبقاً تُقرأ عبر t() (5 لغات)، والنصوص الجديدة
// لهذا التصميم محفوظة في قاموس محلّي L (5 لغات) ليبقى الملف مستقلاً.
// ════════════════════════════════════════════════════════════════

const L: Record<Lang, Record<string, string>> = {
  ar: {
    market: '🏪 السوق', login: 'دخول', dashboard: 'لوحة التحكم', browseMarket: '🏪 تصفّح السوق',
    heroNote: 'مجاني للأبد · بدون بطاقة بنكية · جاهز في 5 دقائق',
    seeHow: 'شاهد كيف يعمل', scrollHint: 'مرّر للأسفل لاكتشاف المزيد',
    pillarsTitle: 'منصّة واحدة لكل أعمالك', pillarsSub: 'بِع، قدّم خدماتك، استقبل الحجوزات، ووصّل — من نفس المكان',
    howTitle: 'كيف يعمل؟', howSub: 'ثلاث خطوات بسيطة من الصفر إلى أول عملية بيع',
    how1d: 'سجّل مجاناً وأضف منتجاتك وخدماتك في دقائق — بدون أي خبرة تقنية.',
    how2d: 'استقبل الطلبات والحجوزات والرسائل، ودع المساعد الذكي يرد على زبائنك تلقائياً.',
    how3d: 'وصّل لكل مدن المغرب مع تتبع تلقائي، واستلم أرباحك عند الاستلام.',
    featTitle: 'كل ما تحتاجه لتنجح', featSub: 'أدوات احترافية مدمجة — جاهزة من اليوم الأول',
    featAiD: 'مساعد يرد على الزبائن ويقترح المنتجات على مدار الساعة.',
    featWaD: 'استقبل الطلبات وأكّدها مباشرة عبر واتساب بضغطة واحدة.',
    featDelD: 'اربط شركات التوصيل وأرسل الشحنات تلقائياً مع تتبع لحظي.',
    featAnD: 'تابع الزيارات والمبيعات والأرباح بأرقام حيّة وواضحة.',
    featSecD: 'بياناتك وبيانات زبائنك محمية مع نسخ احتياطي تلقائي.',
    featBnD: 'صمّم بانرات وإعلانات احترافية بالذكاء الاصطناعي وانشرها.',
    whoTitle: 'مناسب لك مهما كان نشاطك',
    who1: 'بائع منتجات', who2: 'مقدّم خدمات', who3: 'حرفي (كهربائي/سباك)', who4: 'مصمم / مبرمج', who5: 'بوتيك أزياء', who6: 'تاجر جملة',
    testiTitle: 'تجّار يثقون بنا', testiSub: 'انضم لمئات التجار الذين ينمّون أعمالهم مع SAHAR',
    t1: 'ضاعفتُ مبيعاتي في شهر واحد. الذكاء الاصطناعي يرد على الزبائن أفضل مني!',
    t2: 'كنت أضيّع وقتاً طويلاً في بيانات التوصيل. الآن كل شيء تلقائي.',
    t3: 'الربط مع واتساب غيّر كل شيء. الزبون يطلب والطلب يصلني فوراً.',
    ctaTitle: 'متجرك الذكي على بُعد دقائق', ctaSub: 'ابدأ مجاناً اليوم — بدون بطاقة بنكية وبدون أي التزام.',
    footTagline: 'منصّة المغرب الذكية للبيع والخدمات والحجوزات', footRights: 'كل الحقوق محفوظة',
  },
  darija: {
    market: '🏪 السوق', login: 'دخول', dashboard: 'لوحة التحكم', browseMarket: '🏪 تصفّح السوق',
    heroNote: 'مجاني للأبد · بلا كارط بانكير · واجد ف 5 دقايق',
    seeHow: 'شوف كيفاش خدّام', scrollHint: 'مرّر لتحت باش تكتشف كثر',
    pillarsTitle: 'بلاتفورم وحدة لكل خدمتك', pillarsSub: 'بيع، قدّم خدماتك، استقبل الحجوزات، ووصّل — من نفس البلاصة',
    howTitle: 'كيفاش خدّام؟', howSub: 'ثلاثة خطوات ساهلة من الصفر حتى أول بيعة',
    how1d: 'سجّل بلاش وزيد منتجاتك وخدماتك ف دقايق — بلا أي خبرة تقنية.',
    how2d: 'استقبل الطلبات والحجوزات والرسائل، وخلي المساعد الذكي يجاوب زبناءك أوتوماتيك.',
    how3d: 'وصّل لكل مدن المغرب مع تتبع أوتوماتيك، وخود رِبحك عند الاستلام.',
    featTitle: 'كل ما تحتاجو باش تنجح', featSub: 'أدوات احترافية مدمجة — واجدة من النهار الأول',
    featAiD: 'مساعد كيجاوب الزبناء وكيقترح المنتجات 24/7.',
    featWaD: 'استقبل الطلبات وأكّدها مباشرة ف واتساب بضغطة وحدة.',
    featDelD: 'ربط شركات التوصيل وصيفط الشحنات أوتوماتيك مع تتبع دغيا.',
    featAnD: 'تبّع الزيارات والمبيعات والأرباح بأرقام حية وواضحة.',
    featSecD: 'معطياتك ومعطيات زبناءك محمية مع نسخة احتياطية أوتوماتيك.',
    featBnD: 'صمّم بانرات وإعلانات احترافية بالذكاء الاصطناعي ونشرها.',
    whoTitle: 'مناسب ليك مهما كان نشاطك',
    who1: 'بائع منتجات', who2: 'مقدّم خدمات', who3: 'صنايعي (طوبيس/سباك)', who4: 'مصمم / مبرمج', who5: 'بوتيك ديال الموضة', who6: 'تاجر بالجملة',
    testiTitle: 'تجار كيثقو فينا', testiSub: 'انضم لمئات التجار اللي كينمّيو خدمتهم مع SAHAR',
    t1: 'ضاعفت مبيعاتي ف شهر. الذكاء الاصطناعي كيجاوب الزبناء حسن مني!',
    t2: 'كنت كنضيّع بزاف ديال الوقت ف بيانات التوصيل. دابا كلشي أوتوماتيك.',
    t3: 'الربط مع واتساب بدّل كلشي. الزبون كيطلب والطلب كيوصلني دغيا.',
    ctaTitle: 'متجرك الذكي على بعد دقايق', ctaSub: 'بدا بلاش اليوم — بلا كارط بانكير وبلا أي التزام.',
    footTagline: 'منصة المغرب الذكية للبيع والخدمات والحجوزات', footRights: 'كل الحقوق محفوظة',
  },
  fr: {
    market: '🏪 Le Souk', login: 'Connexion', dashboard: 'Tableau de bord', browseMarket: '🏪 Explorer Le Souk',
    heroNote: 'Gratuit à vie · Sans carte bancaire · Prêt en 5 min',
    seeHow: 'Voir comment ça marche', scrollHint: 'Faites défiler pour en découvrir plus',
    pillarsTitle: 'Une seule plateforme pour tout votre business', pillarsSub: 'Vendez, proposez des services, prenez des réservations et livrez — au même endroit',
    howTitle: 'Comment ça marche ?', howSub: 'Trois étapes simples, de zéro à votre première vente',
    how1d: 'Inscrivez-vous gratuitement et ajoutez vos produits et services en quelques minutes — sans compétences techniques.',
    how2d: 'Recevez commandes, réservations et messages, et laissez l’IA répondre à vos clients automatiquement.',
    how3d: 'Livrez dans toutes les villes du Maroc avec suivi automatique, et encaissez à la livraison.',
    featTitle: 'Tout ce qu’il faut pour réussir', featSub: 'Des outils professionnels intégrés — prêts dès le premier jour',
    featAiD: 'Un assistant qui répond aux clients et suggère des produits 24/7.',
    featWaD: 'Recevez et confirmez les commandes directement via WhatsApp.',
    featDelD: 'Connectez les transporteurs et expédiez automatiquement avec suivi.',
    featAnD: 'Suivez visites, ventes et bénéfices avec des chiffres en temps réel.',
    featSecD: 'Vos données et celles de vos clients protégées, sauvegarde automatique.',
    featBnD: 'Créez des bannières et publicités professionnelles avec l’IA.',
    whoTitle: 'Fait pour vous, quel que soit votre métier',
    who1: 'Vendeur de produits', who2: 'Prestataire de services', who3: 'Artisan (électricien/plombier)', who4: 'Designer / développeur', who5: 'Boutique de mode', who6: 'Grossiste',
    testiTitle: 'Des marchands qui nous font confiance', testiSub: 'Rejoignez des centaines de marchands qui développent leur activité avec SAHAR',
    t1: 'J’ai doublé mes ventes en un mois. L’IA répond aux clients mieux que moi !',
    t2: 'Je perdais beaucoup de temps sur les livraisons. Maintenant tout est automatique.',
    t3: 'L’intégration WhatsApp a tout changé. Le client commande et je reçois aussitôt.',
    ctaTitle: 'Votre boutique intelligente à quelques minutes', ctaSub: 'Commencez gratuitement aujourd’hui — sans carte bancaire ni engagement.',
    footTagline: 'La plateforme marocaine intelligente pour la vente, les services et les réservations', footRights: 'Tous droits réservés',
  },
  en: {
    market: '🏪 Market', login: 'Sign in', dashboard: 'Dashboard', browseMarket: '🏪 Browse the market',
    heroNote: 'Free forever · No credit card · Ready in 5 minutes',
    seeHow: 'See how it works', scrollHint: 'Scroll to discover more',
    pillarsTitle: 'One platform for your entire business', pillarsSub: 'Sell, offer services, take bookings and deliver — all in one place',
    howTitle: 'How it works', howSub: 'Three simple steps from zero to your first sale',
    how1d: 'Sign up free and add your products and services in minutes — no technical skills needed.',
    how2d: 'Receive orders, bookings and messages, and let the AI reply to your customers automatically.',
    how3d: 'Deliver to every Moroccan city with automatic tracking, and get paid on delivery.',
    featTitle: 'Everything you need to succeed', featSub: 'Professional tools built in — ready from day one',
    featAiD: 'An assistant that answers customers and suggests products around the clock.',
    featWaD: 'Receive and confirm orders directly via WhatsApp in one tap.',
    featDelD: 'Connect couriers and ship automatically with live tracking.',
    featAnD: 'Track visits, sales and profits with clear, live numbers.',
    featSecD: 'Your data and your customers’ data protected, with automatic backups.',
    featBnD: 'Design professional banners and ads with AI and publish them.',
    whoTitle: 'Built for you, whatever your business',
    who1: 'Product seller', who2: 'Service provider', who3: 'Craftsman (electrician/plumber)', who4: 'Designer / developer', who5: 'Fashion boutique', who6: 'Wholesaler',
    testiTitle: 'Merchants who trust us', testiSub: 'Join hundreds of merchants growing their business with SAHAR',
    t1: 'I doubled my sales in one month. The AI answers customers better than me!',
    t2: 'I used to waste so much time on delivery data. Now it’s all automatic.',
    t3: 'WhatsApp integration changed everything. The customer orders and it reaches me instantly.',
    ctaTitle: 'Your smart store is minutes away', ctaSub: 'Start free today — no credit card, no commitment.',
    footTagline: 'Morocco’s smart platform for selling, services and bookings', footRights: 'All rights reserved',
  },
  zh: {
    market: '🏪 市场', login: '登录', dashboard: '控制台', browseMarket: '🏪 浏览市场',
    heroNote: '永久免费 · 无需银行卡 · 5 分钟搞定',
    seeHow: '看看如何运作', scrollHint: '向下滚动了解更多',
    pillarsTitle: '一个平台，搞定你的全部业务', pillarsSub: '销售、提供服务、接受预约并配送 — 全部一处完成',
    howTitle: '如何运作', howSub: '三个简单步骤，从零到第一笔订单',
    how1d: '免费注册，几分钟内添加你的产品和服务 — 无需任何技术。',
    how2d: '接收订单、预约和消息，让 AI 助手自动回复你的客户。',
    how3d: '配送至摩洛哥所有城市，自动追踪，货到收款。',
    featTitle: '成功所需的一切', featSub: '内置专业工具 — 第一天即可使用',
    featAiD: '全天候回复客户并推荐产品的智能助手。',
    featWaD: '通过 WhatsApp 一键接收并确认订单。',
    featDelD: '连接快递公司并自动发货，实时追踪。',
    featAnD: '用清晰的实时数据追踪访问、销售和利润。',
    featSecD: '你和客户的数据受保护，自动备份。',
    featBnD: '用 AI 设计并发布专业横幅和广告。',
    whoTitle: '无论你做什么生意，都适合你',
    who1: '产品卖家', who2: '服务提供者', who3: '工匠（电工/水管工）', who4: '设计师 / 开发者', who5: '时尚精品店', who6: '批发商',
    testiTitle: '信赖我们的商家', testiSub: '加入数百位用 SAHAR 发展业务的商家',
    t1: '我一个月内销售额翻倍。AI 回复客户比我还好！',
    t2: '以前我在配送信息上浪费很多时间。现在全自动了。',
    t3: 'WhatsApp 集成改变了一切。客户下单我立即收到。',
    ctaTitle: '你的智能店铺，几分钟即可拥有', ctaSub: '今天免费开始 — 无需银行卡，无任何约束。',
    footTagline: '摩洛哥智能销售、服务与预约平台', footRights: '版权所有',
  },
};

const PILLARS = [
  { icon: '🛍️', k: 'products', color: '#FF6A00' },
  { icon: '🛠️', k: 'services', color: '#00D2B3' },
  { icon: '📅', k: 'booking', color: '#a78bfa' },
  { icon: '🚚', k: 'delivery', color: '#60a5fa' },
] as const;

const FEATURES = [
  { Icon: Bot, name: 'landing.feature.ai', d: 'featAiD', color: '#FF6A00' },
  { Icon: MessageCircle, name: 'landing.feature.whatsapp', d: 'featWaD', color: '#25D366' },
  { Icon: Truck, name: 'landing.feature.delivery', d: 'featDelD', color: '#00D2B3' },
  { Icon: BarChart3, name: 'landing.feature.analytics', d: 'featAnD', color: '#FF8533' },
  { Icon: ShieldCheck, name: 'landing.feature.secure', d: 'featSecD', color: '#a78bfa' },
  { Icon: Sparkles, name: 'landing.feature.banner', d: 'featBnD', color: '#60a5fa' },
];

const WHO = [
  { icon: '🛍️', k: 'who1' }, { icon: '🛠️', k: 'who2' }, { icon: '⚡', k: 'who3' },
  { icon: '🎨', k: 'who4' }, { icon: '👗', k: 'who5' }, { icon: '📦', k: 'who6' },
];

const STATS = [
  { n: '+500', k: 'landing.stats.merchants' },
  { n: '+15K', k: 'landing.stats.products' },
  { n: '+50K', k: 'landing.stats.orders' },
];

const TESTI = [
  { q: 't1', name: 'أحمد', city: 'الدار البيضاء' },
  { q: 't2', name: 'فاطمة', city: 'مراكش' },
  { q: 't3', name: 'يوسف', city: 'طنجة' },
];

// كشف العنصر عند الظهور في الشاشة (تأثير دخول سلس عند التمرير)
function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); o.disconnect(); } }, { threshold: 0.12 });
    o.observe(el); return () => o.disconnect();
  }, []);
  return <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(26px)', transition: `opacity .7s ease ${delay}ms, transform .7s cubic-bezier(.16,1,.3,1) ${delay}ms`, ...style }}>{children}</div>;
}

export default function LandingPage() {
  const { token, user, settings, updateSettings } = useStore();
  const [lang, setLang] = useState<Lang>(() => ((settings.brand as any)?.language || 'ar') as Lang);
  const [loaded, setLoaded] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const userId = user?.id || (() => { try { const u = localStorage.getItem('ai_commerce_user'); return u ? JSON.parse(u)?.id : null; } catch { return null; } })();
  const storeUrl = userId ? `/store/${userId}` : null;
  const isAuthed = !!token || token === 'demo-token-local';
  const isRtl = isRtlLang(lang);
  const tx = (k: string) => (L[lang] || L.ar)[k] || L.ar[k] || k;
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 50); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLangMenu(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const switchLang = (code: Lang) => { setLang(code); setShowLangMenu(false); updateSettings('brand', { ...(settings.brand as any), language: code }); };
  const curLang = LANGS.find(l => l.code === lang) || LANGS[0];
  const startDemo = () => { try { localStorage.setItem('ai_commerce_token', 'demo-token-local'); } catch {} window.location.href = '/dashboard'; };
  const scrollToHow = () => { document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' }); };

  const C = { ember: '#FF6A00', emberD: '#CC5500', mint: '#00D2B3', purple: '#a78bfa', blue: '#60a5fa' };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{
      minHeight: '100dvh', overflowX: 'hidden', background: '#08080C', color: '#FAFAFA',
      fontFamily: 'Tajawal, system-ui, sans-serif',
    }}>
      <style>{`
        @keyframes lpUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lpIn { from{opacity:0} to{opacity:1} }
        @keyframes lpShimmer { 0%,100%{opacity:.45} 50%{opacity:1} }
        @keyframes lpFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(28px,-26px) scale(1.08)} }
        @keyframes lpFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-24px,22px) scale(1.06)} }
        @keyframes lpBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(7px)} }
        .lp-lift { transition: transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s ease, border-color .3s ease; }
        .lp-lift:hover { transform: translateY(-4px); box-shadow: 0 22px 60px rgba(0,0,0,.5); }
        .lp-menu::-webkit-scrollbar { width: 6px; } .lp-menu::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 3px; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* خلفية متوهّجة متحركة */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-12%', insetInlineEnd: '-8%', width: '52vw', maxWidth: 620, height: '52vw', maxHeight: 620, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,106,0,0.12), transparent 70%)', animation: 'lpFloat1 16s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-10%', insetInlineStart: '-8%', width: '46vw', maxWidth: 540, height: '46vw', maxHeight: 540, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)', animation: 'lpFloat2 19s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '38%', insetInlineStart: '42%', width: '30vw', maxWidth: 360, height: '30vw', maxHeight: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,210,179,0.08), transparent 70%)', animation: 'lpFloat1 22s ease-in-out infinite' }} />
      </div>

      {/* ══ HEADER ══ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50, height: 60, padding: '0 clamp(14px,4vw,40px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(10,10,15,0.82)' : 'transparent',
        backdropFilter: scrolled ? 'blur(18px)' : 'none', WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.07)' : 'transparent'}`,
        transition: 'background .3s ease, border-color .3s ease, backdrop-filter .3s ease',
        animation: loaded ? 'lpIn .5s ease both' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, overflow: 'hidden', background: 'rgba(255,106,0,0.1)', border: '1.5px solid rgba(255,106,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255,106,0,0.25)' }}>
            <img src="/sahar-logo-text.png" alt="S" style={{ width: '80%', height: '80%', objectFit: 'contain' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).innerHTML = '<span style="font-size:16px;font-weight:900;color:#FF6A00">S</span>'; }} />
          </div>
          <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-0.02em' }}><span style={{ color: '#FF6A00' }}>SAHAR</span> shop</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div ref={langRef} style={{ position: 'relative' }}>
            <button onClick={() => setShowLangMenu(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 11px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#FAFAFA', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {curLang.flag} <span className="hide-xs">{curLang.label}</span>
              <ChevronDown size={10} style={{ transform: showLangMenu ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>
            {showLangMenu && (
              <div className="lp-menu" style={{ position: 'absolute', top: '120%', [isRtl ? 'right' : 'left']: 0, minWidth: 150, background: '#15151E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', zIndex: 100 } as any}>
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => switchLang(l.code)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', background: l.code === lang ? 'rgba(255,106,0,0.1)' : 'transparent', border: 'none', color: l.code === lang ? '#FF6A00' : '#999', fontSize: 13, fontWeight: l.code === lang ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', textAlign: isRtl ? 'right' : 'left' }}>
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <a href="/market" className="hide-xs" style={{ padding: '8px 14px', borderRadius: 9, background: 'rgba(255,106,0,0.08)', border: '1px solid rgba(255,106,0,0.2)', color: '#FF9A55', fontSize: 12.5, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>{tx('market')}</a>
          {isAuthed ? (
            <a href="/dashboard" style={{ padding: '8px 16px', borderRadius: 9, background: 'linear-gradient(135deg, #FF6A00, #CC5500)', color: '#fff', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>{tx('dashboard')}</a>
          ) : (
            <a href="/login" style={{ padding: '8px 16px', borderRadius: 9, background: '#FAFAFA', color: '#0A0A0F', fontSize: 12.5, fontWeight: 800, textDecoration: 'none' }}>{tx('login')}</a>
          )}
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1 }}>
        {/* ══ HERO ══ */}
        <section style={{ minHeight: 'calc(100dvh - 60px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'clamp(28px,5vh,64px) clamp(16px,5vw,24px) clamp(24px,4vh,48px)', gap: 'clamp(16px,2.5vh,26px)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 15px', borderRadius: 99, background: 'rgba(255,106,0,0.08)', border: '1px solid rgba(255,106,0,0.22)', animation: loaded ? 'lpUp .6s .05s ease both' : 'none' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6A00', boxShadow: '0 0 8px #FF6A00', animation: 'lpShimmer 2s ease infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#FF9A55', letterSpacing: '.03em' }}>{t(lang, 'landing.tagline')}</span>
          </div>

          <h1 style={{ fontSize: 'clamp(32px, 6.5vw, 60px)', fontWeight: 900, lineHeight: 1.08, margin: 0, letterSpacing: '-0.03em', maxWidth: 900, animation: loaded ? 'lpUp .6s .12s ease both' : 'none' }}>
            <span style={{ background: 'linear-gradient(135deg, #FFFFFF 30%, #E8E4DC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block' }}>{t(lang, 'landing.hero.title1')}</span>
            <span style={{ background: 'linear-gradient(120deg, #00D2B3, #FF6A00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block' }}>{t(lang, 'landing.hero.title2')}</span>
          </h1>

          <p style={{ fontSize: 'clamp(14px, 1.8vw, 18px)', color: 'rgba(255,255,255,0.55)', maxWidth: 600, margin: 0, lineHeight: 1.7, animation: loaded ? 'lpUp .6s .2s ease both' : 'none' }}>{t(lang, 'landing.hero.sub')}</p>

          {/* CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 4, animation: loaded ? 'lpUp .6s .28s ease both' : 'none' }}>
            <a href={isAuthed ? '/dashboard' : '/login'} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '14px 30px', borderRadius: 14, background: 'linear-gradient(135deg, #FF6A00, #CC5500)', color: '#fff', fontSize: 15, fontWeight: 800, textDecoration: 'none', boxShadow: '0 10px 36px rgba(255,106,0,0.32)' }}>
              {isAuthed ? t(lang, 'landing.merchant.ctaExisting') : t(lang, 'landing.merchant.ctaNew')} <Arrow size={17} />
            </a>
            <a href={storeUrl || '/market'} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '14px 26px', borderRadius: 14, background: 'rgba(0,210,179,0.1)', border: '1px solid rgba(0,210,179,0.3)', color: '#00D2B3', fontSize: 15, fontWeight: 800, textDecoration: 'none' }}>
              🛍️ {t(lang, 'landing.customer.cta')}
            </a>
          </div>

          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 7, animation: loaded ? 'lpUp .6s .34s ease both' : 'none' }}>
            <Check size={14} color="#00D2B3" /> {tx('heroNote')}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'clamp(18px,5vw,46px)', marginTop: 'clamp(8px,2vh,20px)', animation: loaded ? 'lpUp .6s .42s ease both' : 'none' }}>
            {STATS.map(s => (
              <div key={s.k} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 900, background: 'linear-gradient(135deg, #FF6A00, #FF9A55)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.n}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginTop: 2 }}>{t(lang, s.k)}</div>
              </div>
            ))}
          </div>

          <button onClick={scrollToHow} style={{ marginTop: 'clamp(6px,1.5vh,14px)', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 600 }}>
            {tx('scrollHint')}
            <ChevronDown size={18} style={{ animation: 'lpBounce 1.8s ease infinite' }} />
          </button>
        </section>

        {/* ══ PILLARS ══ */}
        <Section>
          <Reveal><SecHead title={tx('pillarsTitle')} sub={tx('pillarsSub')} /></Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,230px), 1fr))', gap: 16, marginTop: 30 }}>
            {PILLARS.map((p, i) => (
              <Reveal key={p.k} delay={i * 80}>
                <div className="lp-lift" style={{ height: '100%', padding: '26px 22px', borderRadius: 20, background: `linear-gradient(160deg, ${p.color}12, rgba(255,255,255,0.02))`, border: `1px solid ${p.color}2e`, textAlign: isRtl ? 'right' : 'left' }}>
                  <div style={{ width: 54, height: 54, borderRadius: 16, background: `${p.color}1e`, border: `1px solid ${p.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 16 }}>{p.icon}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 8px', color: p.color }}>{t(lang, `landing.pillar.${p.k}`)}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>{t(lang, `landing.pillar.${p.k}.d`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* ══ HOW IT WORKS ══ */}
        <section id="how" style={{ padding: 0 }}>
          <Section>
            <Reveal><SecHead title={tx('howTitle')} sub={tx('howSub')} /></Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,260px), 1fr))', gap: 18, marginTop: 30 }}>
              {[
                { n: '1', t: 'landing.how.step1', d: 'how1d', color: C.ember },
                { n: '2', t: 'landing.how.step2', d: 'how2d', color: C.purple },
                { n: '3', t: 'landing.how.step3', d: 'how3d', color: C.mint },
              ].map((s, i) => (
                <Reveal key={s.n} delay={i * 100}>
                  <div style={{ height: '100%', padding: '28px 24px', borderRadius: 20, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', position: 'relative', textAlign: isRtl ? 'right' : 'left' }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: `${s.color}1e`, border: `1.5px solid ${s.color}`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, marginBottom: 16 }}>{s.n}</div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 8px' }}>{t(lang, s.t)}</h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>{tx(s.d)}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Section>
        </section>

        {/* ══ FEATURES ══ */}
        <Section>
          <Reveal><SecHead title={tx('featTitle')} sub={tx('featSub')} /></Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,250px), 1fr))', gap: 16, marginTop: 30 }}>
            {FEATURES.map((f, i) => { const FIcon = f.Icon; return (
              <Reveal key={f.name} delay={i * 70}>
                <div className="lp-lift" style={{ height: '100%', padding: '24px 22px', borderRadius: 18, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', textAlign: isRtl ? 'right' : 'left' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${f.color}1a`, border: `1px solid ${f.color}38`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, marginBottom: 15 }}><FIcon size={22} /></div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 7px' }}>{t(lang, f.name)}</h3>
                  <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.48)', lineHeight: 1.7, margin: 0 }}>{tx(f.d)}</p>
                </div>
              </Reveal>
            ); })}
          </div>
        </Section>

        {/* ══ WHO IS IT FOR ══ */}
        <Section>
          <Reveal><SecHead title={tx('whoTitle')} /></Reveal>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 26 }}>
            {WHO.map((w, i) => (
              <Reveal key={w.k} delay={i * 50}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 18px', borderRadius: 99, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 13.5, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                  <span style={{ fontSize: 17 }}>{w.icon}</span> {tx(w.k)}
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* ══ PRICING ══ */}
        <Section>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#FF6A00', background: 'rgba(255,106,0,0.08)', border: '1px solid rgba(255,106,0,0.15)', borderRadius: 99, padding: '5px 15px', letterSpacing: '.05em', textTransform: 'uppercase' }}>{t(lang, 'pricing.badge')}</span>
            </div>
            <SecHead title={t(lang, 'pricing.title')} sub={t(lang, 'pricing.sub')} />
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,260px), 1fr))', gap: 18, marginTop: 30, maxWidth: 720, marginInline: 'auto' }}>
            <Reveal>
              <div style={{ height: '100%', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 11, textAlign: isRtl ? 'right' : 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#00C896' }}>{t(lang, 'pricing.free.name')}</div>
                <div style={{ fontSize: 32, fontWeight: 900 }}>{t(lang, 'pricing.free.price')}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{t(lang, 'pricing.free.desc')}</div>
                {(['pricing.free.f1', 'pricing.free.f2', 'pricing.free.f3'] as const).map(k => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}><Check size={14} color="#00C896" /> {t(lang, k)}</div>
                ))}
                <a href="/login" style={{ marginTop: 'auto', textAlign: 'center', padding: '13px', borderRadius: 13, background: 'rgba(0,200,150,0.1)', border: '1px solid rgba(0,200,150,0.25)', color: '#00C896', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>{t(lang, 'pricing.free.cta')}</a>
              </div>
            </Reveal>
            <Reveal delay={90}>
              <div style={{ height: '100%', background: 'linear-gradient(160deg, rgba(255,106,0,0.1), rgba(255,106,0,0.02))', border: '1px solid rgba(255,106,0,0.3)', borderRadius: 20, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 11, position: 'relative', textAlign: isRtl ? 'right' : 'left', boxShadow: '0 16px 50px rgba(255,106,0,0.12)' }}>
                <span style={{ position: 'absolute', top: 16, insetInlineEnd: 18, fontSize: 10, fontWeight: 800, color: '#fff', background: '#FF6A00', borderRadius: 99, padding: '4px 11px' } as any}>⭐ Pro</span>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#FF6A00' }}>{t(lang, 'pricing.pro.name')}</div>
                <div style={{ fontSize: 32, fontWeight: 900 }}>{t(lang, 'pricing.pro.price')}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{t(lang, 'pricing.pro.desc')}</div>
                {(['pricing.pro.f1', 'pricing.pro.f2', 'pricing.pro.f3'] as const).map(k => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}><Check size={14} color="#FF6A00" /> {t(lang, k)}</div>
                ))}
                <a href="/login" style={{ marginTop: 'auto', textAlign: 'center', padding: '13px', borderRadius: 13, background: 'linear-gradient(135deg, #FF6A00, #CC5500)', color: '#fff', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>{t(lang, 'pricing.pro.cta')}</a>
              </div>
            </Reveal>
          </div>
        </Section>

        {/* ══ TESTIMONIALS ══ */}
        <Section>
          <Reveal><SecHead title={tx('testiTitle')} sub={tx('testiSub')} /></Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,240px), 1fr))', gap: 16, marginTop: 30 }}>
            {TESTI.map((tm, i) => (
              <Reveal key={tm.q} delay={i * 90}>
                <div style={{ height: '100%', padding: '24px 22px', borderRadius: 18, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', textAlign: isRtl ? 'right' : 'left' }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={13} fill="#F59E0B" color="#F59E0B" />)}</div>
                  <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.62)', lineHeight: 1.7, marginBottom: 14 }}>“{tx(tm.q)}”</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #FF6A00, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#fff' }}>{tm.name[0]}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>{tm.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>📍 {tm.city}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* ══ FINAL CTA ══ */}
        <Section>
          <Reveal>
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 28, padding: 'clamp(36px,6vw,64px) clamp(20px,5vw,40px)', textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,106,0,0.14), rgba(124,58,237,0.14))', border: '1px solid rgba(255,106,0,0.25)' }}>
              <div style={{ position: 'absolute', top: '-30%', insetInlineStart: '50%', transform: 'translateX(-50%)', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,106,0,0.18), transparent 65%)', pointerEvents: 'none' }} />
              <h2 style={{ position: 'relative', fontSize: 'clamp(24px,4.5vw,40px)', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>{tx('ctaTitle')}</h2>
              <p style={{ position: 'relative', fontSize: 'clamp(13px,1.8vw,16px)', color: 'rgba(255,255,255,0.6)', maxWidth: 520, margin: '0 auto 26px', lineHeight: 1.7 }}>{tx('ctaSub')}</p>
              <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <a href={isAuthed ? '/dashboard' : '/login'} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '15px 34px', borderRadius: 14, background: 'linear-gradient(135deg, #FF6A00, #CC5500)', color: '#fff', fontSize: 15.5, fontWeight: 800, textDecoration: 'none', boxShadow: '0 12px 40px rgba(255,106,0,0.35)' }}>
                  {isAuthed ? t(lang, 'landing.merchant.ctaExisting') : t(lang, 'landing.merchant.ctaNew')} <Arrow size={18} />
                </a>
                <button onClick={startDemo} style={{ padding: '15px 28px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#FAFAFA', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{t(lang, 'landing.demo')}</button>
                <a href="/market" style={{ padding: '15px 24px', borderRadius: 14, background: 'rgba(0,210,179,0.1)', border: '1px solid rgba(0,210,179,0.28)', color: '#00D2B3', fontSize: 14.5, fontWeight: 700, textDecoration: 'none' }}>{tx('browseMarket')}</a>
              </div>
            </div>
          </Reveal>
        </Section>
      </main>

      {/* ══ FOOTER ══ */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(28px,5vw,40px) clamp(16px,5vw,40px)', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, overflow: 'hidden', background: 'rgba(255,106,0,0.1)', border: '1px solid rgba(255,106,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/sahar-logo-text.png" alt="S" style={{ width: '80%', height: '80%', objectFit: 'contain' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).innerHTML = '<span style="font-size:13px;font-weight:900;color:#FF6A00">S</span>'; }} />
          </div>
          <span style={{ fontWeight: 900, fontSize: 15 }}><span style={{ color: '#FF6A00' }}>SAHAR</span> shop</span>
        </div>
        <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', maxWidth: 460, margin: '0 auto 16px', lineHeight: 1.7 }}>{tx('footTagline')}</p>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 12, marginBottom: 14 }}>
          <a href="https://wa.me/212649200188" target="_blank" rel="noreferrer" style={{ color: '#25D366', fontWeight: 700, textDecoration: 'none' }}>💬 +212 649 200 188</a>
          <a href="https://wa.me/212612265893" target="_blank" rel="noreferrer" style={{ color: '#25D366', fontWeight: 700, textDecoration: 'none' }}>💬 +212 612 265 893</a>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>📍 Casablanca, Maroc</span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          <span style={{ color: '#C9954C', fontWeight: 600 }}>AI Commerce OS © 2026</span> · {tx('footRights')}
        </div>
      </footer>
    </div>
  );
}

// قسم بحاوية متجاوبة موحّدة
function Section({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ padding: 'clamp(44px,8vh,90px) clamp(16px,5vw,40px)' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>{children}</div>
    </section>
  );
}

// عنوان قسم موحّد
function SecHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ fontSize: 'clamp(22px,3.6vw,34px)', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{title}</h2>
      {sub && <p style={{ fontSize: 'clamp(13px,1.6vw,16px)', color: 'rgba(255,255,255,0.45)', maxWidth: 560, margin: '12px auto 0', lineHeight: 1.7 }}>{sub}</p>}
    </div>
  );
}
