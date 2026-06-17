import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { t, type Lang, LANGS, isRtlLang } from '../i18n/translations';
import {
  Bot, MessageCircle, Truck, BarChart3, Check, Star, ChevronDown,
  ArrowRight, ArrowLeft, ShoppingBag, Wrench, Calendar, Store, Globe, Gift, Image as ImageIcon, Languages,
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════
// صفحة الهبوط — تصميم Premium متعدّد الأقسام يعرض كل ميزات التطبيق.
// نصوص موجودة مسبقاً عبر t() (5 لغات) + قاموس محلّي L للمحتوى الجديد.
// ════════════════════════════════════════════════════════════════

const L: Record<Lang, Record<string, string>> = {
  ar: {
    market: '🏪 السوق', login: 'دخول', dashboard: 'لوحة التحكم', browseMarket: '🏪 تصفّح السوق',
    heroNote: 'مجاني للأبد · بدون بطاقة بنكية · جاهز في 5 دقائق', seeHow: 'شاهد كيف يعمل', scrollHint: 'اكتشف المزيد',
    capTitle: 'كل ما تحتاجه في تطبيق واحد', capSub: 'منصّة متكاملة تدير تجارتك من الألف إلى الياء — منتجات، خدمات، حجوزات، سوق، توصيل، وذكاء اصطناعي.',
    'cap.products': 'المنتجات', 'cap.products.d': 'أضف منتجاتك بصور وفيديو وخيارات (مقاس/لون) ووصف يكتبه الذكاء الاصطناعي.',
    'cap.services': 'الخدمات', 'cap.services.d': 'قدّم خدماتك مع حجز موعد، طلب عادي، أو طلب عاجل — ومعرض أعمالك.',
    'cap.bookings': 'المواعيد والحجوزات', 'cap.bookings.d': 'استقبل المواعيد بالتاريخ والساعة، أو التدخلات الاستعجالية الفورية.',
    'cap.store': 'متجرك الإلكتروني', 'cap.store.d': 'متجر أنيق برابط خاص بك — تشاركه وتستقبل الطلبات فوراً.',
    'cap.market': 'السوق الموحّد', 'cap.market.d': 'انشر إعلاناتك في السوق المغربي الموحّد وابلغ آلاف الزبائن الجدد.',
    'cap.ai': 'الذكاء الاصطناعي', 'cap.ai.d': 'مساعد يرد على الزبائن، يقترح المنتجات، ويجمع بيانات الطلب 24/7.',
    'cap.messages': 'الرسائل الموحّدة', 'cap.messages.d': 'واتساب وفيسبوك وإنستغرام في صندوق واحد — لا تفوّت أي رسالة.',
    'cap.delivery': 'التوصيل والتتبع', 'cap.delivery.d': 'اربط شركات التوصيل، أرسل الشحنات تلقائياً، وتتبّعها لحظة بلحظة.',
    'cap.coupons': 'الكوبونات وعجلة الحظ', 'cap.coupons.d': 'أنشئ أكواد خصم، برامج ولاء، وعجلة حظ تزيد تفاعل زبائنك.',
    'cap.analytics': 'التحليلات', 'cap.analytics.d': 'تابع الزيارات والمبيعات والأرباح ومصادر الزوار بأرقام حيّة.',
    'cap.banner': 'استوديو البانر', 'cap.banner.d': 'صمّم بانرات وإعلانات احترافية بالذكاء الاصطناعي وانشرها بضغطة.',
    'cap.langs': 'متعدّد اللغات', 'cap.langs.d': 'متجرك بخمس لغات: العربية، الدارجة، الفرنسية، الإنجليزية، والصينية.',
    pillarsTitle: 'منصّة واحدة لكل أعمالك', pillarsSub: 'بِع، قدّم خدماتك، استقبل الحجوزات، ووصّل — من نفس المكان',
    howTitle: 'كيف يعمل؟', howSub: 'ثلاث خطوات بسيطة من الصفر إلى أول عملية بيع',
    how1d: 'سجّل مجاناً وأضف منتجاتك وخدماتك في دقائق — بدون أي خبرة تقنية.',
    how2d: 'استقبل الطلبات والحجوزات والرسائل، ودع المساعد الذكي يرد على زبائنك تلقائياً.',
    how3d: 'وصّل لكل مدن المغرب مع تتبع تلقائي، واستلم أرباحك عند الاستلام.',
    whoTitle: 'مناسب لك مهما كان نشاطك',
    who1: 'بائع منتجات', who2: 'مقدّم خدمات', who3: 'حرفي (كهربائي/سباك)', who4: 'مصمم / مبرمج', who5: 'بوتيك أزياء', who6: 'تاجر جملة',
    testiTitle: 'تجّار يثقون بنا', testiSub: 'انضم لمئات التجار الذين ينمّون أعمالهم مع SAHAR',
    t1: 'ضاعفتُ مبيعاتي في شهر واحد. الذكاء الاصطناعي يرد على الزبائن أفضل مني!',
    t2: 'كنت أضيّع وقتاً طويلاً في بيانات التوصيل. الآن كل شيء تلقائي.',
    t3: 'الربط مع واتساب غيّر كل شيء. الزبون يطلب والطلب يصلني فوراً.',
    ctaTitle: 'متجرك الذكي على بُعد دقائق', ctaSub: 'ابدأ مجاناً اليوم — بدون بطاقة بنكية وبدون أي التزام.',
    footTagline: 'منصّة المغرب الذكية للبيع والخدمات والحجوزات', footRights: 'كل الحقوق محفوظة', creditPrefix: 'تطوير',
  },
  darija: {
    market: '🏪 السوق', login: 'دخول', dashboard: 'لوحة التحكم', browseMarket: '🏪 تصفّح السوق',
    heroNote: 'مجاني للأبد · بلا كارط بانكير · واجد ف 5 دقايق', seeHow: 'شوف كيفاش خدّام', scrollHint: 'كتشف كثر',
    capTitle: 'كل ما تحتاجو ف تطبيق واحد', capSub: 'منصّة متكاملة كتسيّر تجارتك من الألف للياء — منتجات، خدمات، حجوزات، سوق، توصيل، وذكاء اصطناعي.',
    'cap.products': 'المنتجات', 'cap.products.d': 'زيد منتجاتك بصور وفيديو وخيارات (قياس/لون) ووصف كيكتبو الذكاء الاصطناعي.',
    'cap.services': 'الخدمات', 'cap.services.d': 'قدّم خدماتك مع حجز موعد، طلب عادي، ولا طلب مستعجل — ومعرض ديال خدماتك.',
    'cap.bookings': 'المواعيد والحجوزات', 'cap.bookings.d': 'استقبل المواعيد بالتاريخ والساعة، ولا التدخلات المستعجلة دغيا.',
    'cap.store': 'متجرك الإلكتروني', 'cap.store.d': 'متجر شيك برابط ديالك — تشاركو وتستقبل الطلبات دغيا.',
    'cap.market': 'السوق الموحّد', 'cap.market.d': 'نشر إعلاناتك ف السوق المغربي الموحّد وابلغ آلاف الزبناء الجداد.',
    'cap.ai': 'الذكاء الاصطناعي', 'cap.ai.d': 'مساعد كيجاوب الزبناء، كيقترح المنتجات، وكيجمع بيانات الطلب 24/7.',
    'cap.messages': 'الرسائل الموحّدة', 'cap.messages.d': 'واتساب وفيسبوك وإنستغرام ف صندوق واحد — ماتفوّت حتى رسالة.',
    'cap.delivery': 'التوصيل والتتبع', 'cap.delivery.d': 'ربط شركات التوصيل، صيفط الشحنات أوتوماتيك، وتبّعها لحظة بلحظة.',
    'cap.coupons': 'الكوبونات وعجلة الحظ', 'cap.coupons.d': 'دير أكواد تخفيض، برامج ولاء، وعجلة حظ كتزيد تفاعل زبناءك.',
    'cap.analytics': 'التحليلات', 'cap.analytics.d': 'تبّع الزيارات والمبيعات والأرباح ومصادر الزوار بأرقام حية.',
    'cap.banner': 'استوديو البانر', 'cap.banner.d': 'صمّم بانرات وإعلانات احترافية بالذكاء الاصطناعي ونشرها بضغطة.',
    'cap.langs': 'متعدّد اللغات', 'cap.langs.d': 'متجرك بخمس لغات: العربية، الدارجة، الفرنسية، الإنجليزية، والصينية.',
    pillarsTitle: 'بلاتفورم وحدة لكل خدمتك', pillarsSub: 'بيع، قدّم خدماتك، استقبل الحجوزات، ووصّل — من نفس البلاصة',
    howTitle: 'كيفاش خدّام؟', howSub: 'ثلاثة خطوات ساهلة من الصفر حتى أول بيعة',
    how1d: 'سجّل بلاش وزيد منتجاتك وخدماتك ف دقايق — بلا أي خبرة تقنية.',
    how2d: 'استقبل الطلبات والحجوزات والرسائل، وخلي المساعد الذكي يجاوب زبناءك أوتوماتيك.',
    how3d: 'وصّل لكل مدن المغرب مع تتبع أوتوماتيك، وخود رِبحك عند الاستلام.',
    whoTitle: 'مناسب ليك مهما كان نشاطك',
    who1: 'بائع منتجات', who2: 'مقدّم خدمات', who3: 'صنايعي (طوبيس/سباك)', who4: 'مصمم / مبرمج', who5: 'بوتيك ديال الموضة', who6: 'تاجر بالجملة',
    testiTitle: 'تجار كيثقو فينا', testiSub: 'انضم لمئات التجار اللي كينمّيو خدمتهم مع SAHAR',
    t1: 'ضاعفت مبيعاتي ف شهر. الذكاء الاصطناعي كيجاوب الزبناء حسن مني!',
    t2: 'كنت كنضيّع بزاف ديال الوقت ف بيانات التوصيل. دابا كلشي أوتوماتيك.',
    t3: 'الربط مع واتساب بدّل كلشي. الزبون كيطلب والطلب كيوصلني دغيا.',
    ctaTitle: 'متجرك الذكي على بعد دقايق', ctaSub: 'بدا بلاش اليوم — بلا كارط بانكير وبلا أي التزام.',
    footTagline: 'منصة المغرب الذكية للبيع والخدمات والحجوزات', footRights: 'كل الحقوق محفوظة', creditPrefix: 'تطوير',
  },
  fr: {
    market: '🏪 Le Souk', login: 'Connexion', dashboard: 'Tableau de bord', browseMarket: '🏪 Explorer Le Souk',
    heroNote: 'Gratuit à vie · Sans carte bancaire · Prêt en 5 min', seeHow: 'Voir comment ça marche', scrollHint: 'Découvrir plus',
    capTitle: 'Tout ce qu’il vous faut dans une seule app', capSub: 'Une plateforme complète qui gère votre commerce de A à Z — produits, services, réservations, souk, livraison et IA.',
    'cap.products': 'Produits', 'cap.products.d': 'Ajoutez vos produits avec photos, vidéo, options (taille/couleur) et descriptions générées par l’IA.',
    'cap.services': 'Services', 'cap.services.d': 'Proposez vos services : rendez-vous, demande simple ou urgente — et votre portfolio.',
    'cap.bookings': 'Rendez-vous & Réservations', 'cap.bookings.d': 'Recevez des rendez-vous par date et heure, ou des interventions urgentes immédiates.',
    'cap.store': 'Votre boutique en ligne', 'cap.store.d': 'Une boutique élégante avec votre propre lien — partagez et recevez les commandes aussitôt.',
    'cap.market': 'Le Souk unifié', 'cap.market.d': 'Publiez vos annonces sur Le Souk marocain unifié et touchez des milliers de nouveaux clients.',
    'cap.ai': 'Intelligence artificielle', 'cap.ai.d': 'Un assistant qui répond aux clients, suggère des produits et collecte les commandes 24/7.',
    'cap.messages': 'Messagerie unifiée', 'cap.messages.d': 'WhatsApp, Facebook et Instagram dans une seule boîte — ne ratez aucun message.',
    'cap.delivery': 'Livraison & Suivi', 'cap.delivery.d': 'Connectez les transporteurs, expédiez automatiquement et suivez en temps réel.',
    'cap.coupons': 'Coupons & Roue de la chance', 'cap.coupons.d': 'Créez des codes promo, des programmes de fidélité et une roue de la chance.',
    'cap.analytics': 'Analytique', 'cap.analytics.d': 'Suivez visites, ventes, bénéfices et sources de trafic en temps réel.',
    'cap.banner': 'Studio de bannières', 'cap.banner.d': 'Créez des bannières et publicités professionnelles avec l’IA, en un clic.',
    'cap.langs': 'Multilingue', 'cap.langs.d': 'Votre boutique en 5 langues : arabe, darija, français, anglais et chinois.',
    pillarsTitle: 'Une seule plateforme pour tout votre business', pillarsSub: 'Vendez, proposez des services, prenez des réservations et livrez — au même endroit',
    howTitle: 'Comment ça marche ?', howSub: 'Trois étapes simples, de zéro à votre première vente',
    how1d: 'Inscrivez-vous gratuitement et ajoutez vos produits et services en quelques minutes — sans compétences techniques.',
    how2d: 'Recevez commandes, réservations et messages, et laissez l’IA répondre à vos clients automatiquement.',
    how3d: 'Livrez dans toutes les villes du Maroc avec suivi automatique, et encaissez à la livraison.',
    whoTitle: 'Fait pour vous, quel que soit votre métier',
    who1: 'Vendeur de produits', who2: 'Prestataire de services', who3: 'Artisan (électricien/plombier)', who4: 'Designer / développeur', who5: 'Boutique de mode', who6: 'Grossiste',
    testiTitle: 'Des marchands qui nous font confiance', testiSub: 'Rejoignez des centaines de marchands qui développent leur activité avec SAHAR',
    t1: 'J’ai doublé mes ventes en un mois. L’IA répond aux clients mieux que moi !',
    t2: 'Je perdais beaucoup de temps sur les livraisons. Maintenant tout est automatique.',
    t3: 'L’intégration WhatsApp a tout changé. Le client commande et je reçois aussitôt.',
    ctaTitle: 'Votre boutique intelligente à quelques minutes', ctaSub: 'Commencez gratuitement aujourd’hui — sans carte bancaire ni engagement.',
    footTagline: 'La plateforme marocaine intelligente pour la vente, les services et les réservations', footRights: 'Tous droits réservés', creditPrefix: 'Développé par',
  },
  en: {
    market: '🏪 Market', login: 'Sign in', dashboard: 'Dashboard', browseMarket: '🏪 Browse the market',
    heroNote: 'Free forever · No credit card · Ready in 5 minutes', seeHow: 'See how it works', scrollHint: 'Discover more',
    capTitle: 'Everything you need in one app', capSub: 'A complete platform that runs your business end to end — products, services, bookings, marketplace, delivery and AI.',
    'cap.products': 'Products', 'cap.products.d': 'Add products with photos, video, options (size/color) and AI-written descriptions.',
    'cap.services': 'Services', 'cap.services.d': 'Offer services with appointment, standard or urgent request — plus your portfolio.',
    'cap.bookings': 'Appointments & Bookings', 'cap.bookings.d': 'Take appointments by date and time, or instant urgent interventions.',
    'cap.store': 'Your online store', 'cap.store.d': 'A sleek store with your own link — share it and receive orders instantly.',
    'cap.market': 'Unified marketplace', 'cap.market.d': 'Post your ads on the unified Moroccan Market and reach thousands of new customers.',
    'cap.ai': 'Artificial intelligence', 'cap.ai.d': 'An assistant that answers customers, suggests products and collects orders 24/7.',
    'cap.messages': 'Unified inbox', 'cap.messages.d': 'WhatsApp, Facebook and Instagram in one inbox — never miss a message.',
    'cap.delivery': 'Delivery & Tracking', 'cap.delivery.d': 'Connect couriers, ship automatically and track in real time.',
    'cap.coupons': 'Coupons & Lucky wheel', 'cap.coupons.d': 'Create discount codes, loyalty programs and a lucky wheel to boost engagement.',
    'cap.analytics': 'Analytics', 'cap.analytics.d': 'Track visits, sales, profits and traffic sources with live numbers.',
    'cap.banner': 'Banner studio', 'cap.banner.d': 'Design professional banners and ads with AI and publish in one click.',
    'cap.langs': 'Multilingual', 'cap.langs.d': 'Your store in 5 languages: Arabic, Darija, French, English and Chinese.',
    pillarsTitle: 'One platform for your entire business', pillarsSub: 'Sell, offer services, take bookings and deliver — all in one place',
    howTitle: 'How it works', howSub: 'Three simple steps from zero to your first sale',
    how1d: 'Sign up free and add your products and services in minutes — no technical skills needed.',
    how2d: 'Receive orders, bookings and messages, and let the AI reply to your customers automatically.',
    how3d: 'Deliver to every Moroccan city with automatic tracking, and get paid on delivery.',
    whoTitle: 'Built for you, whatever your business',
    who1: 'Product seller', who2: 'Service provider', who3: 'Craftsman (electrician/plumber)', who4: 'Designer / developer', who5: 'Fashion boutique', who6: 'Wholesaler',
    testiTitle: 'Merchants who trust us', testiSub: 'Join hundreds of merchants growing their business with SAHAR',
    t1: 'I doubled my sales in one month. The AI answers customers better than me!',
    t2: 'I used to waste so much time on delivery data. Now it’s all automatic.',
    t3: 'WhatsApp integration changed everything. The customer orders and it reaches me instantly.',
    ctaTitle: 'Your smart store is minutes away', ctaSub: 'Start free today — no credit card, no commitment.',
    footTagline: 'Morocco’s smart platform for selling, services and bookings', footRights: 'All rights reserved', creditPrefix: 'Developed by',
  },
  zh: {
    market: '🏪 市场', login: '登录', dashboard: '控制台', browseMarket: '🏪 浏览市场',
    heroNote: '永久免费 · 无需银行卡 · 5 分钟搞定', seeHow: '看看如何运作', scrollHint: '了解更多',
    capTitle: '一个应用，满足全部需求', capSub: '端到端运营你业务的完整平台 — 产品、服务、预约、市场、配送与 AI。',
    'cap.products': '产品', 'cap.products.d': '添加带照片、视频、选项（尺寸/颜色）和 AI 撰写描述的产品。',
    'cap.services': '服务', 'cap.services.d': '提供服务：预约、普通申请或紧急申请 — 以及你的作品集。',
    'cap.bookings': '预约与预定', 'cap.bookings.d': '按日期和时间接受预约，或即时紧急上门。',
    'cap.store': '你的在线店铺', 'cap.store.d': '拥有专属链接的精美店铺 — 分享即可即时接单。',
    'cap.market': '统一市场', 'cap.market.d': '在统一的摩洛哥市场发布广告，触达数千新客户。',
    'cap.ai': '人工智能', 'cap.ai.d': '全天候回复客户、推荐产品并收集订单的智能助手。',
    'cap.messages': '统一收件箱', 'cap.messages.d': 'WhatsApp、Facebook 和 Instagram 集于一个收件箱 — 不漏任何消息。',
    'cap.delivery': '配送与追踪', 'cap.delivery.d': '连接快递、自动发货并实时追踪。',
    'cap.coupons': '优惠券与幸运转盘', 'cap.coupons.d': '创建折扣码、会员计划和幸运转盘，提升互动。',
    'cap.analytics': '数据分析', 'cap.analytics.d': '用实时数据追踪访问、销售、利润和流量来源。',
    'cap.banner': '横幅工作室', 'cap.banner.d': '用 AI 一键设计并发布专业横幅和广告。',
    'cap.langs': '多语言', 'cap.langs.d': '你的店铺支持 5 种语言：阿拉伯语、达里贾语、法语、英语和中文。',
    pillarsTitle: '一个平台，搞定你的全部业务', pillarsSub: '销售、提供服务、接受预约并配送 — 全部一处完成',
    howTitle: '如何运作', howSub: '三个简单步骤，从零到第一笔订单',
    how1d: '免费注册，几分钟内添加你的产品和服务 — 无需任何技术。',
    how2d: '接收订单、预约和消息，让 AI 助手自动回复你的客户。',
    how3d: '配送至摩洛哥所有城市，自动追踪，货到收款。',
    whoTitle: '无论你做什么生意，都适合你',
    who1: '产品卖家', who2: '服务提供者', who3: '工匠（电工/水管工）', who4: '设计师 / 开发者', who5: '时尚精品店', who6: '批发商',
    testiTitle: '信赖我们的商家', testiSub: '加入数百位用 SAHAR 发展业务的商家',
    t1: '我一个月内销售额翻倍。AI 回复客户比我还好！',
    t2: '以前我在配送信息上浪费很多时间。现在全自动了。',
    t3: 'WhatsApp 集成改变了一切。客户下单我立即收到。',
    ctaTitle: '你的智能店铺，几分钟即可拥有', ctaSub: '今天免费开始 — 无需银行卡，无任何约束。',
    footTagline: '摩洛哥智能销售、服务与预约平台', footRights: '版权所有', creditPrefix: '开发',
  },
};

const CAPS = [
  { Icon: ShoppingBag, k: 'products', c: '#FF6A00' },
  { Icon: Wrench, k: 'services', c: '#00D2B3' },
  { Icon: Calendar, k: 'bookings', c: '#a78bfa' },
  { Icon: Store, k: 'store', c: '#60a5fa' },
  { Icon: Globe, k: 'market', c: '#FF8533' },
  { Icon: Bot, k: 'ai', c: '#FF6A00' },
  { Icon: MessageCircle, k: 'messages', c: '#25D366' },
  { Icon: Truck, k: 'delivery', c: '#00D2B3' },
  { Icon: Gift, k: 'coupons', c: '#EC4899' },
  { Icon: BarChart3, k: 'analytics', c: '#FF8533' },
  { Icon: ImageIcon, k: 'banner', c: '#a78bfa' },
  { Icon: Languages, k: 'langs', c: '#60a5fa' },
];

const PILLARS = [
  { icon: '🛍️', k: 'products', color: '#FF6A00' },
  { icon: '🛠️', k: 'services', color: '#00D2B3' },
  { icon: '📅', k: 'booking', color: '#a78bfa' },
  { icon: '🚚', k: 'delivery', color: '#60a5fa' },
] as const;

const WHO = [
  { icon: '🛍️', k: 'who1' }, { icon: '🛠️', k: 'who2' }, { icon: '⚡', k: 'who3' },
  { icon: '🎨', k: 'who4' }, { icon: '👗', k: 'who5' }, { icon: '📦', k: 'who6' },
];

const STATS = [
  { to: 500, suffix: '+', k: 'landing.stats.merchants' },
  { to: 15, suffix: 'K+', k: 'landing.stats.products' },
  { to: 50, suffix: 'K+', k: 'landing.stats.orders' },
];

const TESTI = [
  { q: 't1', name: 'أحمد', city: 'الدار البيضاء' },
  { q: 't2', name: 'فاطمة', city: 'مراكش' },
  { q: 't3', name: 'يوسف', city: 'طنجة' },
];

// كشف الظهور عند التمرير
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

// عدّاد متحرك يبدأ عند ظهوره
function CountUp({ to, suffix = '', dur = 1500 }: { to: number; suffix?: string; dur?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true; const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / dur);
          setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    o.observe(el); return () => o.disconnect();
  }, [to, dur]);
  return <span ref={ref}>{val}{suffix}</span>;
}

export default function LandingPage() {
  const { token, user, settings, updateSettings } = useStore();
  const [lang, setLang] = useState<Lang>(() => ((settings.brand as any)?.language || 'ar') as Lang);
  const [loaded, setLoaded] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [prog, setProg] = useState(0);
  const langRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);

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
    const onScroll = () => {
      const el = document.documentElement;
      setScrolled(el.scrollTop > 16);
      setProg(el.scrollTop / ((el.scrollHeight - el.clientHeight) || 1));
    };
    window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const onHeroMove = (e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (spotRef.current) spotRef.current.style.background = `radial-gradient(420px circle at ${e.clientX - r.left}px ${e.clientY - r.top}px, rgba(255,106,0,0.13), transparent 70%)`;
  };

  const switchLang = (code: Lang) => { setLang(code); setShowLangMenu(false); updateSettings('brand', { ...(settings.brand as any), language: code }); };
  const curLang = LANGS.find(l => l.code === lang) || LANGS[0];
  const startDemo = () => { try { localStorage.setItem('ai_commerce_token', 'demo-token-local'); } catch {} window.location.href = '/dashboard'; };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ minHeight: '100dvh', overflowX: 'hidden', background: '#07070B', color: '#FAFAFA', fontFamily: 'Tajawal, system-ui, sans-serif' }}>
      <style>{`
        @keyframes lpUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lpIn { from{opacity:0} to{opacity:1} }
        @keyframes lpShimmer { 0%,100%{opacity:.45} 50%{opacity:1} }
        @keyframes lpFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-28px) scale(1.08)} }
        @keyframes lpFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-26px,24px) scale(1.06)} }
        @keyframes lpSpinSlow { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes lpBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(7px)} }
        @keyframes lpGrad { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        @keyframes lpShine { 0%{transform:translateX(-220%) skewX(-18deg)} 60%,100%{transform:translateX(320%) skewX(-18deg)} }
        @keyframes lpPulse { 0%,100%{box-shadow:0 10px 36px rgba(255,106,0,.30)} 50%{box-shadow:0 12px 50px rgba(255,106,0,.55)} }
        @keyframes lpRing { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        .lp-card { transition: transform .32s cubic-bezier(.16,1,.3,1), box-shadow .32s ease, border-color .32s ease, background .32s ease; }
        .lp-card:hover { transform: translateY(-6px); box-shadow: 0 24px 64px rgba(0,0,0,.55); }
        .lp-card:hover .lp-ico { transform: scale(1.12) rotate(-6deg); }
        .lp-ico { transition: transform .32s cubic-bezier(.16,1,.3,1); }
        .lp-btn { position: relative; overflow: hidden; }
        .lp-btn .sh { position:absolute; top:0; bottom:0; width:34%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent); transform:translateX(-220%) skewX(-18deg); animation:lpShine 4.5s ease-in-out infinite; pointer-events:none; }
        .lp-menu::-webkit-scrollbar { width:6px } .lp-menu::-webkit-scrollbar-thumb { background:rgba(255,255,255,.12); border-radius:3px }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* شريط تقدّم التمرير */}
      <div style={{ position: 'fixed', top: 0, insetInlineStart: 0, height: 3, width: `${Math.round(prog * 100)}%`, background: 'linear-gradient(90deg, #FF6A00, #00D2B3, #a78bfa)', zIndex: 60, transition: 'width .1s linear', boxShadow: '0 0 12px rgba(255,106,0,.5)' }} />

      {/* خلفية متوهّجة متحركة (aurora) + حبيبات */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-18%', insetInlineStart: '50%', width: '120vw', height: '120vw', maxWidth: 1400, maxHeight: 1400, transform: 'translateX(-50%)', borderRadius: '50%', background: 'conic-gradient(from 0deg, rgba(255,106,0,0.06), rgba(124,58,237,0.05), rgba(0,210,179,0.05), rgba(255,106,0,0.06))', filter: 'blur(60px)', animation: 'lpSpinSlow 40s linear infinite', opacity: 0.7 }} />
        <div style={{ position: 'absolute', top: '-10%', insetInlineEnd: '-8%', width: '50vw', maxWidth: 600, height: '50vw', maxHeight: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,106,0,0.14), transparent 70%)', animation: 'lpFloat1 16s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-12%', insetInlineStart: '-8%', width: '46vw', maxWidth: 560, height: '46vw', maxHeight: 560, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.13), transparent 70%)', animation: 'lpFloat2 19s ease-in-out infinite' }} />
      </div>
      {/* طبقة حُبيبات خفيفة للعمق */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', opacity: 0.04, mixBlendMode: 'overlay', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* ══ HEADER ══ */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, height: 60, padding: '0 clamp(14px,4vw,40px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: scrolled ? 'rgba(8,8,12,0.82)' : 'transparent', backdropFilter: scrolled ? 'blur(18px)' : 'none', WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none', borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.07)' : 'transparent'}`, transition: 'background .3s ease, border-color .3s ease', animation: loaded ? 'lpIn .5s ease both' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, overflow: 'hidden', background: 'rgba(255,106,0,0.1)', border: '1.5px solid rgba(255,106,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255,106,0,0.25)' }}>
            <img src="/sahar-logo-text.png" alt="SAHAR" style={{ width: '80%', height: '80%', objectFit: 'contain' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).innerHTML = '<span style="font-size:16px;font-weight:900;color:#FF6A00">S</span>'; }} />
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
          {isAuthed
            ? <a href="/dashboard" style={{ padding: '8px 16px', borderRadius: 9, background: 'linear-gradient(135deg, #FF6A00, #CC5500)', color: '#fff', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>{tx('dashboard')}</a>
            : <a href="/login" style={{ padding: '8px 16px', borderRadius: 9, background: '#FAFAFA', color: '#0A0A0F', fontSize: 12.5, fontWeight: 800, textDecoration: 'none' }}>{tx('login')}</a>}
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 2 }}>
        {/* ══ HERO ══ */}
        <section onMouseMove={onHeroMove} style={{ position: 'relative', minHeight: 'calc(100dvh - 60px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'clamp(28px,5vh,64px) clamp(16px,5vw,24px) clamp(24px,4vh,48px)', gap: 'clamp(16px,2.5vh,26px)' }}>
          <div ref={spotRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', transition: 'background .12s ease' }} />

          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 15px', borderRadius: 99, background: 'rgba(255,106,0,0.08)', border: '1px solid rgba(255,106,0,0.22)', animation: loaded ? 'lpUp .6s .05s ease both' : 'none' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6A00', boxShadow: '0 0 8px #FF6A00', animation: 'lpShimmer 2s ease infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#FF9A55', letterSpacing: '.03em' }}>{t(lang, 'landing.tagline')}</span>
          </div>

          <h1 style={{ position: 'relative', fontSize: 'clamp(34px, 7vw, 66px)', fontWeight: 900, lineHeight: 1.06, margin: 0, letterSpacing: '-0.03em', maxWidth: 920, animation: loaded ? 'lpUp .6s .12s ease both' : 'none' }}>
            <span style={{ background: 'linear-gradient(135deg, #FFFFFF 30%, #E8E4DC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block' }}>{t(lang, 'landing.hero.title1')}</span>
            <span style={{ background: 'linear-gradient(90deg, #FF6A00, #00D2B3, #a78bfa, #FF6A00)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block', animation: 'lpGrad 6s linear infinite' }}>{t(lang, 'landing.hero.title2')}</span>
          </h1>

          <p style={{ position: 'relative', fontSize: 'clamp(14px, 1.8vw, 18px)', color: 'rgba(255,255,255,0.55)', maxWidth: 600, margin: 0, lineHeight: 1.7, animation: loaded ? 'lpUp .6s .2s ease both' : 'none' }}>{t(lang, 'landing.hero.sub')}</p>

          <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 4, animation: loaded ? 'lpUp .6s .28s ease both' : 'none' }}>
            <a href={isAuthed ? '/dashboard' : '/login'} className="lp-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '15px 32px', borderRadius: 14, background: 'linear-gradient(135deg, #FF6A00, #CC5500)', color: '#fff', fontSize: 15.5, fontWeight: 800, textDecoration: 'none', animation: 'lpPulse 3s ease-in-out infinite' }}>
              <span className="sh" />{isAuthed ? t(lang, 'landing.merchant.ctaExisting') : t(lang, 'landing.merchant.ctaNew')} <Arrow size={17} />
            </a>
            <a href={storeUrl || '/market'} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '15px 28px', borderRadius: 14, background: 'rgba(0,210,179,0.1)', border: '1px solid rgba(0,210,179,0.3)', color: '#00D2B3', fontSize: 15, fontWeight: 800, textDecoration: 'none' }}>
              🛍️ {t(lang, 'landing.customer.cta')}
            </a>
          </div>

          <div style={{ position: 'relative', fontSize: 12.5, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 7, animation: loaded ? 'lpUp .6s .34s ease both' : 'none' }}>
            <Check size={14} color="#00D2B3" /> {tx('heroNote')}
          </div>

          <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'clamp(18px,5vw,46px)', marginTop: 'clamp(8px,2vh,20px)', animation: loaded ? 'lpUp .6s .42s ease both' : 'none' }}>
            {STATS.map(s => (
              <div key={s.k} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(24px,4.4vw,34px)', fontWeight: 900, background: 'linear-gradient(135deg, #FF6A00, #FF9A55)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}><CountUp to={s.to} suffix={s.suffix} /></div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginTop: 2 }}>{t(lang, s.k)}</div>
              </div>
            ))}
          </div>

          <button onClick={() => scrollTo('caps')} style={{ position: 'relative', marginTop: 'clamp(6px,1.5vh,14px)', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 600 }}>
            {tx('scrollHint')} <ChevronDown size={18} style={{ animation: 'lpBounce 1.8s ease infinite' }} />
          </button>
        </section>

        {/* ══ CAPABILITIES — كل ميزات التطبيق ══ */}
        <section id="caps"><Section>
          <Reveal><SecHead title={tx('capTitle')} sub={tx('capSub')} /></Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,260px), 1fr))', gap: 16, marginTop: 34 }}>
            {CAPS.map((cp, i) => { const CIcon = cp.Icon; return (
              <Reveal key={cp.k} delay={(i % 3) * 80}>
                <div className="lp-card" style={{ height: '100%', padding: '24px 22px', borderRadius: 20, background: `linear-gradient(165deg, ${cp.c}10, rgba(255,255,255,0.02))`, border: `1px solid ${cp.c}28`, textAlign: isRtl ? 'right' : 'left' }}>
                  <div className="lp-ico" style={{ width: 52, height: 52, borderRadius: 15, background: `${cp.c}1c`, border: `1px solid ${cp.c}45`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cp.c, marginBottom: 15, boxShadow: `0 8px 24px ${cp.c}22` }}><CIcon size={24} /></div>
                  <h3 style={{ fontSize: 16.5, fontWeight: 800, margin: '0 0 7px' }}>{tx('cap.' + cp.k)}</h3>
                  <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>{tx('cap.' + cp.k + '.d')}</p>
                </div>
              </Reveal>
            ); })}
          </div>
        </Section></section>

        {/* ══ PILLARS ══ */}
        <Section>
          <Reveal><SecHead title={tx('pillarsTitle')} sub={tx('pillarsSub')} /></Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,230px), 1fr))', gap: 16, marginTop: 30 }}>
            {PILLARS.map((p, i) => (
              <Reveal key={p.k} delay={i * 80}>
                <div className="lp-card" style={{ height: '100%', padding: '26px 22px', borderRadius: 20, background: `linear-gradient(160deg, ${p.color}12, rgba(255,255,255,0.02))`, border: `1px solid ${p.color}2e`, textAlign: isRtl ? 'right' : 'left' }}>
                  <div className="lp-ico" style={{ width: 54, height: 54, borderRadius: 16, background: `${p.color}1e`, border: `1px solid ${p.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 16 }}>{p.icon}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 8px', color: p.color }}>{t(lang, `landing.pillar.${p.k}`)}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>{t(lang, `landing.pillar.${p.k}.d`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* ══ HOW IT WORKS ══ */}
        <section id="how"><Section>
          <Reveal><SecHead title={tx('howTitle')} sub={tx('howSub')} /></Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,260px), 1fr))', gap: 18, marginTop: 30 }}>
            {[
              { n: '1', t: 'landing.how.step1', d: 'how1d', color: '#FF6A00' },
              { n: '2', t: 'landing.how.step2', d: 'how2d', color: '#a78bfa' },
              { n: '3', t: 'landing.how.step3', d: 'how3d', color: '#00D2B3' },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div className="lp-card" style={{ height: '100%', padding: '28px 24px', borderRadius: 20, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', textAlign: isRtl ? 'right' : 'left' }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: `${s.color}1e`, border: `1.5px solid ${s.color}`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, marginBottom: 16 }}>{s.n}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 8px' }}>{t(lang, s.t)}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>{tx(s.d)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section></section>

        {/* ══ WHO IS IT FOR ══ */}
        <Section>
          <Reveal><SecHead title={tx('whoTitle')} /></Reveal>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 26 }}>
            {WHO.map((w, i) => (
              <Reveal key={w.k} delay={i * 50}>
                <div className="lp-card" style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 18px', borderRadius: 99, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 13.5, fontWeight: 700, color: 'rgba(255,255,255,0.72)' }}>
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
              <div className="lp-card" style={{ height: '100%', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 11, textAlign: isRtl ? 'right' : 'left' }}>
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
              <div style={{ position: 'relative', height: '100%', borderRadius: 20, padding: 1.5, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: '-40%', background: 'conic-gradient(from 0deg, transparent, #FF6A00, transparent 35%)', animation: 'lpRing 6s linear infinite' }} />
                <div style={{ position: 'relative', height: '100%', background: 'linear-gradient(160deg, #1a1208, #0e0c14)', borderRadius: 19, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 11, textAlign: isRtl ? 'right' : 'left' }}>
                  <span style={{ position: 'absolute', top: 16, insetInlineEnd: 18, fontSize: 10, fontWeight: 800, color: '#fff', background: '#FF6A00', borderRadius: 99, padding: '4px 11px' } as any}>⭐ Pro</span>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#FF6A00' }}>{t(lang, 'pricing.pro.name')}</div>
                  <div style={{ fontSize: 32, fontWeight: 900 }}>{t(lang, 'pricing.pro.price')}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{t(lang, 'pricing.pro.desc')}</div>
                  {(['pricing.pro.f1', 'pricing.pro.f2', 'pricing.pro.f3'] as const).map(k => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}><Check size={14} color="#FF6A00" /> {t(lang, k)}</div>
                  ))}
                  <a href="/login" className="lp-btn" style={{ marginTop: 'auto', textAlign: 'center', padding: '13px', borderRadius: 13, background: 'linear-gradient(135deg, #FF6A00, #CC5500)', color: '#fff', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}><span className="sh" />{t(lang, 'pricing.pro.cta')}</a>
                </div>
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
                <div className="lp-card" style={{ height: '100%', padding: '24px 22px', borderRadius: 18, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', textAlign: isRtl ? 'right' : 'left' }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={13} fill="#F59E0B" color="#F59E0B" />)}</div>
                  <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.62)', lineHeight: 1.7, marginBottom: 14 }}>“{tx(tm.q)}”</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #FF6A00, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#fff' }}>{tm.name[0]}</div>
                    <div><div style={{ fontSize: 13, fontWeight: 800 }}>{tm.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>📍 {tm.city}</div></div>
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
              <div style={{ position: 'absolute', top: '-40%', insetInlineStart: '50%', transform: 'translateX(-50%)', width: 460, height: 460, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,106,0,0.2), transparent 65%)', pointerEvents: 'none' }} />
              <h2 style={{ position: 'relative', fontSize: 'clamp(24px,4.5vw,40px)', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>{tx('ctaTitle')}</h2>
              <p style={{ position: 'relative', fontSize: 'clamp(13px,1.8vw,16px)', color: 'rgba(255,255,255,0.62)', maxWidth: 520, margin: '0 auto 26px', lineHeight: 1.7 }}>{tx('ctaSub')}</p>
              <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <a href={isAuthed ? '/dashboard' : '/login'} className="lp-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '15px 34px', borderRadius: 14, background: 'linear-gradient(135deg, #FF6A00, #CC5500)', color: '#fff', fontSize: 15.5, fontWeight: 800, textDecoration: 'none', boxShadow: '0 12px 40px rgba(255,106,0,0.35)' }}>
                  <span className="sh" />{isAuthed ? t(lang, 'landing.merchant.ctaExisting') : t(lang, 'landing.merchant.ctaNew')} <Arrow size={18} />
                </a>
                <button onClick={startDemo} style={{ padding: '15px 28px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#FAFAFA', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{t(lang, 'landing.demo')}</button>
                <a href="/market" style={{ padding: '15px 24px', borderRadius: 14, background: 'rgba(0,210,179,0.1)', border: '1px solid rgba(0,210,179,0.28)', color: '#00D2B3', fontSize: 14.5, fontWeight: 700, textDecoration: 'none' }}>{tx('browseMarket')}</a>
              </div>
            </div>
          </Reveal>
        </Section>
      </main>

      {/* ══ FOOTER ══ */}
      <footer style={{ position: 'relative', zIndex: 2, borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(30px,5vw,44px) clamp(16px,5vw,40px)', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, overflow: 'hidden', background: 'rgba(255,106,0,0.1)', border: '1px solid rgba(255,106,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/sahar-logo-text.png" alt="SAHAR" style={{ width: '80%', height: '80%', objectFit: 'contain' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).innerHTML = '<span style="font-size:13px;font-weight:900;color:#FF6A00">S</span>'; }} />
          </div>
          <span style={{ fontWeight: 900, fontSize: 15 }}><span style={{ color: '#FF6A00' }}>SAHAR</span> shop</span>
        </div>
        <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', maxWidth: 460, margin: '0 auto 16px', lineHeight: 1.7 }}>{tx('footTagline')}</p>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 12, marginBottom: 14 }}>
          <a href="https://wa.me/212649200188" target="_blank" rel="noreferrer" style={{ color: '#25D366', fontWeight: 700, textDecoration: 'none' }}>💬 +212 649 200 188</a>
          <a href="https://wa.me/212612265893" target="_blank" rel="noreferrer" style={{ color: '#25D366', fontWeight: 700, textDecoration: 'none' }}>💬 +212 612 265 893</a>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>📍 Casablanca, Maroc</span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ color: '#C9954C', fontWeight: 600 }}>AI Commerce OS © 2026</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>{tx('footRights')}</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>{tx('creditPrefix')}: <a href="https://wa.me/212649200188" target="_blank" rel="noreferrer" style={{ color: '#FF9A55', fontWeight: 700, textDecoration: 'none' }}>Alloservix · Abdellatif hadana</a></span>
        </div>
      </footer>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <section style={{ padding: 'clamp(44px,8vh,90px) clamp(16px,5vw,40px)' }}><div style={{ maxWidth: 1080, margin: '0 auto' }}>{children}</div></section>;
}

function SecHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ fontSize: 'clamp(22px,3.6vw,34px)', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{title}</h2>
      {sub && <p style={{ fontSize: 'clamp(13px,1.6vw,16px)', color: 'rgba(255,255,255,0.45)', maxWidth: 580, margin: '12px auto 0', lineHeight: 1.7 }}>{sub}</p>}
    </div>
  );
}
