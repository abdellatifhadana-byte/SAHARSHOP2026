import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { t, type Lang, LANGS, isRtlLang } from '../i18n/translations';
import ErrorBoundary from '../components/ErrorBoundary';
import {
  Bot, MessageCircle, Truck, BarChart3, Check, Star, ChevronDown,
  ArrowRight, ArrowLeft, ShoppingBag, Wrench, Calendar, Store, Globe, Gift,
  Image as ImageIcon, Languages, Sparkles, Zap, MapPin, TrendingUp,
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════
// صفحة الهبوط — "Premium Commerce OS"
// تصميم فاتح فاخر · التجارة أولاً (لا الذكاء الاصطناعي كبطل)
// بيانات حقيقية من قاعدة البيانات + Early-stage positioning ذكي
// (لا أرقام وهمية مضخّمة — عند قلّة البيانات نغيّر الرسالة لا الأرقام)
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
    howTitle: 'كيف يعمل؟', howSub: 'ثلاث خطوات بسيطة من الصفر إلى أول عملية بيع',
    how1d: 'سجّل مجاناً وأضف منتجاتك وخدماتك في دقائق — بدون أي خبرة تقنية.',
    how2d: 'استقبل الطلبات والحجوزات والرسائل، ودع المساعد الذكي يرد على زبائنك تلقائياً.',
    how3d: 'وصّل لكل مدن المغرب مع تتبع تلقائي، واستلم أرباحك عند الاستلام.',
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
    howTitle: 'كيفاش خدّام؟', howSub: 'ثلاثة خطوات ساهلة من الصفر حتى أول بيعة',
    how1d: 'سجّل بلاش وزيد منتجاتك وخدماتك ف دقايق — بلا أي خبرة تقنية.',
    how2d: 'استقبل الطلبات والحجوزات والرسائل، وخلي المساعد الذكي يجاوب زبناءك أوتوماتيك.',
    how3d: 'وصّل لكل مدن المغرب مع تتبع أوتوماتيك، وخود رِبحك عند الاستلام.',
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
    howTitle: 'Comment ça marche ?', howSub: 'Trois étapes simples, de zéro à votre première vente',
    how1d: 'Inscrivez-vous gratuitement et ajoutez vos produits et services en quelques minutes — sans compétences techniques.',
    how2d: 'Recevez commandes, réservations et messages, et laissez l’IA répondre à vos clients automatiquement.',
    how3d: 'Livrez dans toutes les villes du Maroc avec suivi automatique, et encaissez à la livraison.',
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
    howTitle: 'How it works', howSub: 'Three simple steps from zero to your first sale',
    how1d: 'Sign up free and add your products and services in minutes — no technical skills needed.',
    how2d: 'Receive orders, bookings and messages, and let the AI reply to your customers automatically.',
    how3d: 'Deliver to every Moroccan city with automatic tracking, and get paid on delivery.',
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
    howTitle: '如何运作', howSub: '三个简单步骤，从零到第一笔订单',
    how1d: '免费注册，几分钟内添加你的产品和服务 — 无需任何技术。',
    how2d: '接收订单、预约和消息，让 AI 助手自动回复你的客户。',
    how3d: '配送至摩洛哥所有城市，自动追踪，货到收款。',
    ctaTitle: '你的智能店铺，几分钟即可拥有', ctaSub: '今天免费开始 — 无需银行卡，无任何约束。',
    footTagline: '摩洛哥智能销售、服务与预约平台', footRights: '版权所有', creditPrefix: '开发',
  },
};

// مفاتيح المحتوى الجديدة لهذا التصميم (منفصلة للحفاظ على نظافة القاموس الأصلي)
const LX: Record<Lang, Record<string, string>> = {
  ar: {
    osBadge: 'Commerce OS · نظام تجارة متكامل', sample: 'مثال', byStore: 'بواسطة', dh: 'د.م.',
    liveTitle: '🛍️ منتجات وخدمات حيّة من السوق', liveSub: 'إعلانات حقيقية نشرها تجّار SAHAR الآن', liveViewAll: 'تصفّح كل السوق',
    citiesTitle: '🇲🇦 متاجر في كل المغرب', citiesSub: 'تجّار ينمّون أعمالهم من كل المدن', cityUnit: 'إعلان', cityBeFirst: 'كن الأول هنا',
    statMerchants: 'تاجر', statProducts: 'منتج', statOrders: 'طلب', statListings: 'إعلان في السوق',
    earlyBadge: '🚀 منصّة جديدة في الانطلاق', earlyTitle: 'كن من أوائل التجّار في SAHAR', earlySub: 'نبني السوق المغربي الذكي معاً من البداية — مكانك في المقدّمة محجوز الآن.',
    bentoTitle: 'منظومة تجارة كاملة', bentoSub: 'كل أدوات نجاحك في مكان واحد — والذكاء الاصطناعي يدعمها لا يحلّ محلّها.',
    storesTitle: '⭐ لماذا التجّار يختارون SAHAR', previewHint: 'هكذا يبدو متجرك',
    why1: 'إطلاق في دقائق', why1d: 'متجر جاهز برابط خاص دون أي خبرة تقنية.',
    why2: 'يعمل 24/7', why2d: 'المساعد الذكي يرد ويجمع الطلبات حتى وأنت نائم.',
    why3: 'وصول أوسع', why3d: 'السوق الموحّد + كل قنوات التواصل في مكان واحد.',
    seoTitle: 'SAHAR shop — منصّة المغرب الذكية للبيع والخدمات', seoDesc: 'أنشئ متجرك الإلكتروني، اعرض خدماتك، وبِع في السوق المغربي الموحّد — مع ذكاء اصطناعي وتوصيل آلي. مجاني للبدء.',
  },
  darija: {
    osBadge: 'Commerce OS · نظام تجارة كامل', sample: 'مثال', byStore: 'ديال', dh: 'د.م.',
    liveTitle: '🛍️ منتجات وخدمات حيّة من السوق', liveSub: 'إعلانات حقيقية نشروهم تجّار SAHAR دابا', liveViewAll: 'تصفّح السوق كامل',
    citiesTitle: '🇲🇦 متاجر ف كل المغرب', citiesSub: 'تجّار كينمّيو خدمتهم من كل المدن', cityUnit: 'إعلان', cityBeFirst: 'كن الأول هنا',
    statMerchants: 'تاجر', statProducts: 'منتج', statOrders: 'طلب', statListings: 'إعلان ف السوق',
    earlyBadge: '🚀 منصّة جديدة ف الانطلاق', earlyTitle: 'كن من أوائل التجّار ف SAHAR', earlySub: 'كنبنيو السوق المغربي الذكي مع بعضياتنا من البداية — بلاصتك ف المقدّمة محجوزة دابا.',
    bentoTitle: 'منظومة تجارة كاملة', bentoSub: 'كل أدوات النجاح ف بلاصة وحدة — والذكاء الاصطناعي كيدعمها ماشي كيعوّضها.',
    storesTitle: '⭐ علاش التجّار كيختارو SAHAR', previewHint: 'هكذا كيبان متجرك',
    why1: 'إطلاق ف دقايق', why1d: 'متجر واجد برابط ديالك بلا أي خبرة تقنية.',
    why2: 'خدّام 24/7', why2d: 'المساعد الذكي كيجاوب وكيجمع الطلبات حتى وانت نعسان.',
    why3: 'وصول كثر', why3d: 'السوق الموحّد + كل قنوات التواصل ف بلاصة وحدة.',
    seoTitle: 'SAHAR shop — منصّة المغرب الذكية للبيع والخدمات', seoDesc: 'دير متجرك، قدّم خدماتك، وبيع ف السوق المغربي الموحّد — مع ذكاء اصطناعي وتوصيل أوتوماتيك. بلاش باش تبدا.',
  },
  fr: {
    osBadge: 'Commerce OS · plateforme tout-en-un', sample: 'Exemple', byStore: 'par', dh: 'DH',
    liveTitle: '🛍️ Produits & services en direct du Souk', liveSub: 'De vraies annonces publiées par les marchands SAHAR', liveViewAll: 'Explorer tout le Souk',
    citiesTitle: '🇲🇦 Des boutiques partout au Maroc', citiesSub: 'Des marchands qui se développent dans chaque ville', cityUnit: 'annonces', cityBeFirst: 'Soyez le premier ici',
    statMerchants: 'marchands', statProducts: 'produits', statOrders: 'commandes', statListings: 'annonces au Souk',
    earlyBadge: '🚀 Nouvelle plateforme en lancement', earlyTitle: 'Soyez parmi les premiers marchands SAHAR', earlySub: 'Construisons ensemble le souk marocain intelligent dès le départ — votre place en tête est réservée maintenant.',
    bentoTitle: 'Un écosystème commerce complet', bentoSub: 'Tous vos outils de réussite au même endroit — l’IA les soutient, sans les remplacer.',
    storesTitle: '⭐ Pourquoi les marchands choisissent SAHAR', previewHint: 'Voici votre boutique',
    why1: 'Lancement en minutes', why1d: 'Une boutique prête avec votre lien, sans compétences techniques.',
    why2: 'Actif 24/7', why2d: 'L’assistant IA répond et collecte les commandes même la nuit.',
    why3: 'Plus de portée', why3d: 'Le Souk unifié + tous vos canaux au même endroit.',
    seoTitle: 'SAHAR shop — la plateforme commerce intelligente du Maroc', seoDesc: 'Créez votre boutique, proposez vos services et vendez sur le Souk marocain unifié — avec IA et livraison automatique. Gratuit pour démarrer.',
  },
  en: {
    osBadge: 'Commerce OS · all-in-one platform', sample: 'Example', byStore: 'by', dh: 'DH',
    liveTitle: '🛍️ Live products & services from the Market', liveSub: 'Real ads posted by SAHAR merchants', liveViewAll: 'Browse the whole market',
    citiesTitle: '🇲🇦 Stores across Morocco', citiesSub: 'Merchants growing in every city', cityUnit: 'ads', cityBeFirst: 'Be the first here',
    statMerchants: 'merchants', statProducts: 'products', statOrders: 'orders', statListings: 'market ads',
    earlyBadge: '🚀 New platform launching', earlyTitle: 'Be among the first SAHAR merchants', earlySub: 'Let’s build Morocco’s smart marketplace together from day one — your front-row spot is reserved now.',
    bentoTitle: 'A complete commerce ecosystem', bentoSub: 'All your success tools in one place — AI supports them, never replaces them.',
    storesTitle: '⭐ Why merchants choose SAHAR', previewHint: 'This is how your store looks',
    why1: 'Launch in minutes', why1d: 'A ready store with your own link, no technical skills.',
    why2: 'Always on 24/7', why2d: 'The AI assistant replies and collects orders even while you sleep.',
    why3: 'Wider reach', why3d: 'The unified market + all your channels in one place.',
    seoTitle: 'SAHAR shop — Morocco’s smart commerce platform', seoDesc: 'Create your online store, offer services and sell on Morocco’s unified market — with AI and automatic delivery. Free to start.',
  },
  zh: {
    osBadge: 'Commerce OS · 一体化平台', sample: '示例', byStore: '来自', dh: 'DH',
    liveTitle: '🛍️ 来自市场的实时产品与服务', liveSub: 'SAHAR 商家发布的真实广告', liveViewAll: '浏览整个市场',
    citiesTitle: '🇲🇦 遍布摩洛哥的店铺', citiesSub: '在每座城市成长的商家', cityUnit: '条广告', cityBeFirst: '成为这里的第一个',
    statMerchants: '商家', statProducts: '产品', statOrders: '订单', statListings: '市场广告',
    earlyBadge: '🚀 全新平台正在启动', earlyTitle: '成为首批 SAHAR 商家', earlySub: '从第一天起一起打造摩洛哥智能市场 — 你的前排席位现已为你保留。',
    bentoTitle: '完整的商业生态系统', bentoSub: '所有成功工具集于一处 — AI 是助力，而非替代。',
    storesTitle: '⭐ 商家为何选择 SAHAR', previewHint: '你的店铺长这样',
    why1: '几分钟上线', why1d: '拥有专属链接的现成店铺，无需技术。',
    why2: '全天候 24/7', why2d: 'AI 助手在你睡觉时也能回复并收集订单。',
    why3: '更广触达', why3d: '统一市场 + 你的所有渠道集于一处。',
    seoTitle: 'SAHAR shop — 摩洛哥智能商业平台', seoDesc: '创建在线店铺、提供服务并在摩洛哥统一市场销售 — 配备 AI 与自动配送。免费开始。',
  },
};

// القدرات — التجارة أولاً، والذكاء الاصطناعي عنصر داعم (بترتيب Bento)
const CAPS = [
  { Icon: ShoppingBag, k: 'products', c: '#FF6B35', feat: true },
  { Icon: Bot, k: 'ai', c: '#0EA5E9', wide: true },
  { Icon: Globe, k: 'market', c: '#7C3AED', wide: true },
  { Icon: Wrench, k: 'services', c: '#10B981' },
  { Icon: Store, k: 'store', c: '#F59E0B' },
  { Icon: Truck, k: 'delivery', c: '#3B82F6' },
  { Icon: MessageCircle, k: 'messages', c: '#16A34A' },
  { Icon: Calendar, k: 'bookings', c: '#8B5CF6' },
  { Icon: Gift, k: 'coupons', c: '#EC4899' },
  { Icon: BarChart3, k: 'analytics', c: '#F97316' },
  { Icon: ImageIcon, k: 'banner', c: '#A855F7' },
  { Icon: Languages, k: 'langs', c: '#06B6D4' },
];

// عناصر توضيحية (احتياط بصري فقط — مُعلَّمة بوضوح "مثال"، لا تُعرض كبيانات حقيقية)
type Listing = { id: string; type?: string; name: string; price: number; city?: string; images?: string[]; sellerName?: string; ratingAvg?: number; emoji?: string; sample?: boolean };
const SAMPLES: Listing[] = [
  { id: 's1', type: 'product', name: 'حذاء رياضي', price: 299, city: 'الدار البيضاء', sellerName: 'FootZone', ratingAvg: 4.8, emoji: '👟', sample: true },
  { id: 's2', type: 'product', name: 'فستان أنيق', price: 459, city: 'مراكش', sellerName: 'ModaChic', ratingAvg: 4.9, emoji: '👗', sample: true },
  { id: 's3', type: 'service', name: 'إصلاح كهربائي', price: 150, city: 'الرباط', sellerName: 'ProFix', ratingAvg: 5.0, emoji: '🛠️', sample: true },
  { id: 's4', type: 'product', name: 'ساعة ذكية', price: 849, city: 'طنجة', sellerName: 'TechVibe', ratingAvg: 4.7, emoji: '⌚', sample: true },
  { id: 's5', type: 'product', name: 'حقيبة جلدية', price: 599, city: 'فاس', sellerName: 'Artisan', ratingAvg: 4.9, emoji: '👜', sample: true },
  { id: 's6', type: 'service', name: 'تصميم شعار', price: 400, city: 'أكادير', sellerName: 'StudioX', ratingAvg: 5.0, emoji: '🎨', sample: true },
];
const CITY_FALLBACK = ['الدار البيضاء', 'الرباط', 'مراكش', 'طنجة', 'أكادير', 'فاس'];

// ألوان النظام — فاتح فاخر
const C = {
  bg: '#F8FAFC', surface: '#FFFFFF', alt: '#F1F5F9',
  ink: '#0F172A', ink2: '#475569', ink3: '#94A3B8',
  border: 'rgba(15,23,42,0.08)', borderH: 'rgba(15,23,42,0.16)',
  shadow: '0 12px 40px rgba(15,23,42,0.08)', shadowH: '0 24px 60px rgba(15,23,42,0.14)',
  orange: '#FF6B35', orangeD: '#E8551F', blue: '#0EA5E9', green: '#10B981', purple: '#7C3AED',
};

function apiBase() {
  if (typeof window !== 'undefined') {
    if (window.location.port === '5173' || window.location.port === '4173') return 'http://localhost:3001/api';
    return `${window.location.origin}/api`;
  }
  return '/api';
}

function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); o.disconnect(); } }, { threshold: 0.12 });
    o.observe(el); return () => o.disconnect();
  }, []);
  return <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(24px)', transition: `opacity .7s ease ${delay}ms, transform .7s cubic-bezier(.16,1,.3,1) ${delay}ms`, ...style }}>{children}</div>;
}

function CountUp({ to, suffix = '', dur = 1600 }: { to: number; suffix?: string; dur?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true; const t0 = performance.now();
        const tick = (now: number) => { const p = Math.min(1, (now - t0) / dur); setVal(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    o.observe(el); return () => o.disconnect();
  }, [to, dur]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// بطاقة منتج/خدمة (تعرض صورة حقيقية إن وُجدت، وإلا رمز تعبيري)
function ProductCard({ it, tx, big }: { it: Listing; tx: (k: string) => string; big?: boolean }) {
  const [imgOk, setImgOk] = useState(true);
  const img = it.images && it.images[0];
  const emoji = it.emoji || (it.type === 'service' ? '🛠️' : '🛍️');
  return (
    <div className="lpcard" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: C.shadow, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', height: big ? 150 : 110, background: C.alt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: big ? 52 : 40 }}>
        {img && imgOk
          ? <img src={img} alt={it.name} loading="lazy" onError={() => setImgOk(false)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span>{emoji}</span>}
        {it.sample && <span style={{ position: 'absolute', top: 8, insetInlineStart: 8, fontSize: 9.5, fontWeight: 800, color: '#fff', background: 'rgba(15,23,42,0.55)', borderRadius: 99, padding: '3px 9px' } as any}>{tx('sample')}</span>}
        {it.ratingAvg ? <span style={{ position: 'absolute', top: 8, insetInlineEnd: 8, fontSize: 10, fontWeight: 800, color: '#B45309', background: 'rgba(255,255,255,0.92)', borderRadius: 99, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 3 } as any}><Star size={9} fill="#F59E0B" color="#F59E0B" />{it.ratingAvg.toFixed(1)}</span> : null}
      </div>
      <div style={{ padding: '12px 13px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</div>
        <div style={{ fontSize: 10.5, color: C.ink3, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx('byStore')} {it.sellerName || 'SAHAR'}{it.city ? ` · ${it.city}` : ''}</div>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 }}>
          <span style={{ fontWeight: 900, color: C.orange, fontSize: big ? 17 : 15 }}>{it.price} {tx('dh')}</span>
          <span style={{ fontSize: 14 }}>🛒</span>
        </div>
      </div>
    </div>
  );
}

function LandingInner() {
  const { token, user, settings, updateSettings } = useStore();
  const [lang, setLang] = useState<Lang>(() => ((settings.brand as any)?.language || 'ar') as Lang);
  const [loaded, setLoaded] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [prog, setProg] = useState(0);
  const [stats, setStats] = useState<null | { merchants: number; products: number; services: number; orders: number; listings: number; cities: { city: string; count: number }[] }>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const langRef = useRef<HTMLDivElement>(null);

  const userId = user?.id || (() => { try { const u = localStorage.getItem('ai_commerce_user'); return u ? JSON.parse(u)?.id : null; } catch { return null; } })();
  const storeUrl = userId ? `/store/${userId}` : null;
  const isAuthed = !!token || token === 'demo-token-local';
  const isRtl = isRtlLang(lang);
  const tx = (k: string) => (LX[lang]?.[k] ?? L[lang]?.[k] ?? LX.ar[k] ?? L.ar[k] ?? k);
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 50); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLangMenu(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);
  useEffect(() => {
    const onScroll = () => { const el = document.documentElement; setScrolled(el.scrollTop > 16); setProg(el.scrollTop / ((el.scrollHeight - el.clientHeight) || 1)); };
    window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll);
  }, []);
  // جلب البيانات الحقيقية (عام، بلا مصادقة) — مع فشل صامت رشيق
  useEffect(() => {
    const base = apiBase();
    fetch(`${base}/listings/public/stats`).then(r => r.ok ? r.json() : null).then(d => { if (d) setStats(d); }).catch(() => {});
    fetch(`${base}/listings/public/catalog`).then(r => r.ok ? r.json() : null).then(d => { if (d?.listings) setListings(d.listings); }).catch(() => {});
  }, []);
  // SEO ديناميكي حسب اللغة
  useEffect(() => {
    document.title = tx('seoTitle');
    const m = document.querySelector('meta[name="description"]'); if (m) m.setAttribute('content', tx('seoDesc'));
    document.documentElement.lang = lang === 'darija' ? 'ar' : lang;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [lang]); // eslint-disable-line

  const switchLang = (code: Lang) => { setLang(code); setShowLangMenu(false); updateSettings('brand', { ...(settings.brand as any), language: code }); };
  const curLang = LANGS.find(l => l.code === lang) || LANGS[0];
  const startDemo = () => { try { localStorage.setItem('ai_commerce_token', 'demo-token-local'); } catch {} window.location.href = '/dashboard'; };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  // منطق Early-stage: لا نكذب — نعرض الحقيقي، ونغيّر الرسالة عند القلّة
  const established = !!stats && stats.merchants >= 12 && (stats.products + stats.listings) >= 30;
  const realList = listings.slice(0, 8);
  const heroItems = realList.length >= 2 ? realList.slice(0, 4) : [...realList, ...SAMPLES].slice(0, 4);
  const gridItems = realList.length >= 3 ? realList.slice(0, 6) : [...realList, ...SAMPLES].slice(0, 6);
  const cityItems = (stats?.cities && stats.cities.length)
    ? stats.cities.slice(0, 6)
    : CITY_FALLBACK.map(c => ({ city: c, count: 0 }));

  const btnPrimary: React.CSSProperties = { position: 'relative', overflow: 'hidden', display: 'inline-flex', alignItems: 'center', gap: 9, padding: '15px 30px', borderRadius: 14, background: `linear-gradient(135deg, ${C.orange}, ${C.orangeD})`, color: '#fff', fontSize: 15.5, fontWeight: 800, textDecoration: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 14px 30px ${C.orange}40` };
  const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 9, padding: '15px 26px', borderRadius: 14, background: C.surface, color: C.ink, fontSize: 15.5, fontWeight: 800, textDecoration: 'none', border: `1px solid ${C.borderH}`, cursor: 'pointer', fontFamily: 'inherit' };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ minHeight: '100dvh', overflowX: 'hidden', background: C.bg, color: C.ink, fontFamily: 'Tajawal, system-ui, sans-serif' }}>
      <style>{`
        @keyframes lpIn { from{opacity:0} to{opacity:1} }
        @keyframes lpUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lpShimmer { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes lpFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes lpFloat2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(9px)} }
        @keyframes lpBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(7px)} }
        @keyframes lpGrad { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        @keyframes lpShine { 0%{transform:translateX(-220%) skewX(-18deg)} 60%,100%{transform:translateX(320%) skewX(-18deg)} }
        .lpcard { transition: transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s ease, border-color .3s ease; }
        .lpcard:hover { transform: translateY(-5px); box-shadow: ${C.shadowH}; border-color: ${C.borderH}; }
        .lpcard:hover .lpico { transform: scale(1.1) rotate(-6deg); }
        .lpico { transition: transform .3s cubic-bezier(.16,1,.3,1); }
        .lpbtn .sh { position:absolute; top:0; bottom:0; width:34%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent); transform:translateX(-220%) skewX(-18deg); animation:lpShine 4.5s ease-in-out infinite; pointer-events:none; }
        .lpmenu::-webkit-scrollbar { width:6px } .lpmenu::-webkit-scrollbar-thumb { background:rgba(0,0,0,.14); border-radius:3px }
        .bento { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
        @media(min-width:780px){ .bento{ grid-template-columns:repeat(4,1fr); grid-auto-rows:1fr } .bento .feat{ grid-column:span 2; grid-row:span 2 } .bento .wide{ grid-column:span 2 } }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* شريط تقدّم */}
      <div style={{ position: 'fixed', top: 0, insetInlineStart: 0, height: 3, width: `${Math.round(prog * 100)}%`, background: `linear-gradient(90deg, ${C.orange}, ${C.blue}, ${C.purple})`, zIndex: 60, transition: 'width .1s linear' }} />

      {/* ══ HEADER ══ */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, height: 64, padding: '0 clamp(14px,4vw,40px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: scrolled ? 'rgba(248,250,252,0.85)' : 'transparent', backdropFilter: scrolled ? 'blur(16px)' : 'none', WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none', borderBottom: `1px solid ${scrolled ? C.border : 'transparent'}`, transition: 'background .3s, border-color .3s', animation: loaded ? 'lpIn .5s ease both' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg, ${C.orange}, ${C.orangeD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 18px ${C.orange}44`, overflow: 'hidden' }}>
            <img src="/sahar-logo-text.png" alt="SAHAR" style={{ width: '78%', height: '78%', objectFit: 'contain' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).innerHTML = '<span style="font-size:17px;font-weight:900;color:#fff">S</span>'; }} />
          </div>
          <span style={{ fontWeight: 900, fontSize: 16.5, letterSpacing: '-0.02em', color: C.ink }}><span style={{ color: C.orange }}>SAHAR</span> shop</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div ref={langRef} style={{ position: 'relative' }}>
            <button onClick={() => setShowLangMenu(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 11px', borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, color: C.ink2, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {curLang.flag} <span className="hide-xs">{curLang.label}</span>
              <ChevronDown size={10} style={{ transform: showLangMenu ? 'rotate(180deg)' : 'none', transition: '.2s' }} />
            </button>
            {showLangMenu && (
              <div className="lpmenu" style={{ position: 'absolute', top: '120%', [isRtl ? 'right' : 'left']: 0, minWidth: 150, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: C.shadowH, zIndex: 100 } as any}>
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => switchLang(l.code)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', background: l.code === lang ? `${C.orange}12` : 'transparent', border: 'none', color: l.code === lang ? C.orangeD : C.ink2, fontSize: 13, fontWeight: l.code === lang ? 800 : 500, cursor: 'pointer', fontFamily: 'inherit', textAlign: isRtl ? 'right' : 'left' }}>{l.flag} {l.label}</button>
                ))}
              </div>
            )}
          </div>
          <a href="/market" className="hide-xs" style={{ padding: '9px 14px', borderRadius: 10, background: `${C.orange}12`, border: `1px solid ${C.orange}33`, color: C.orangeD, fontSize: 12.5, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap' }}>{tx('market')}</a>
          {isAuthed
            ? <a href="/dashboard" style={{ padding: '9px 16px', borderRadius: 10, background: `linear-gradient(135deg, ${C.orange}, ${C.orangeD})`, color: '#fff', fontSize: 12.5, fontWeight: 800, textDecoration: 'none' }}>{tx('dashboard')}</a>
            : <a href="/login" style={{ padding: '9px 16px', borderRadius: 10, background: C.ink, color: '#fff', fontSize: 12.5, fontWeight: 800, textDecoration: 'none' }}>{tx('login')}</a>}
        </div>
      </header>

      <main>
        {/* ══ HERO ══ */}
        <section style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(34px,6vh,68px) clamp(16px,5vw,40px) clamp(26px,5vh,52px)' }}>
          <div style={{ position: 'absolute', top: '-18%', insetInlineEnd: '-8%', width: 460, height: 460, borderRadius: '50%', background: `radial-gradient(circle, ${C.orange}16, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-26%', insetInlineStart: '-10%', width: 440, height: 440, borderRadius: '50%', background: `radial-gradient(circle, ${C.blue}12, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'relative', maxWidth: 1160, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,360px), 1fr))', gap: 'clamp(28px,5vw,56px)', alignItems: 'center' }}>
            {/* نص */}
            <div style={{ textAlign: isRtl ? 'right' : 'left', animation: loaded ? 'lpUp .6s .05s ease both' : 'none' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 15px', borderRadius: 99, background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
                <Sparkles size={14} color={C.orange} />
                <span style={{ fontSize: 12, fontWeight: 800, color: C.ink2 }}>{tx('osBadge')}</span>
              </div>
              <h1 style={{ fontSize: 'clamp(31px, 5.4vw, 55px)', fontWeight: 900, lineHeight: 1.08, margin: '16px 0 0', letterSpacing: '-0.03em', color: C.ink }}>
                {t(lang, 'landing.hero.title1')}
                <span style={{ display: 'block', background: `linear-gradient(90deg, ${C.orange}, ${C.purple}, ${C.blue}, ${C.orange})`, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'lpGrad 6s linear infinite' }}>{t(lang, 'landing.hero.title2')}</span>
              </h1>
              <p style={{ fontSize: 'clamp(14px,1.7vw,18px)', color: C.ink2, lineHeight: 1.7, margin: '16px 0 0', maxWidth: 540 }}>{t(lang, 'landing.hero.sub')}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
                <a href={isAuthed ? '/dashboard' : '/login'} className="lpbtn" style={btnPrimary}><span className="sh" /><Zap size={17} /> {isAuthed ? t(lang, 'landing.merchant.ctaExisting') : t(lang, 'landing.merchant.ctaNew')} <Arrow size={17} /></a>
                <a href={storeUrl || '/market'} style={btnGhost}>🛍️ {t(lang, 'landing.customer.cta')}</a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 16, fontSize: 12.5, color: C.ink3, fontWeight: 600 }}>
                <Check size={14} color={C.green} /> {tx('heroNote')}
              </div>
            </div>
            {/* معاينة المتجر التجارية */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', animation: loaded ? 'lpUp .7s .2s ease both' : 'none' }}>
              <div style={{ animation: 'lpFloat 6s ease-in-out infinite', width: '100%', maxWidth: 400 }}>
                <div style={{ background: C.surface, borderRadius: 22, border: `1px solid ${C.border}`, boxShadow: C.shadowH, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 15px', borderBottom: `1px solid ${C.border}`, background: C.alt }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${C.orange}, ${C.purple})` }} />
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 900, color: C.ink }}>{tx('previewHint')}</div>
                      <div style={{ fontSize: 9, color: C.ink3, fontWeight: 700 }}>sahar.shop/store</div>
                    </div>
                    <span style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 800, color: C.green, background: `${C.green}1a`, borderRadius: 99, padding: '3px 9px' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, animation: 'lpShimmer 2s ease infinite' }} /> online</span>
                  </div>
                  <div style={{ padding: 13, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {heroItems.map(it => <ProductCard key={it.id} it={it} tx={tx} />)}
                  </div>
                  <div style={{ padding: '0 13px 14px' }}>
                    <div style={{ height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${C.orange}, ${C.orangeD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12.5, fontWeight: 800, boxShadow: `0 10px 22px ${C.orange}44` }}>🛒 {isRtl ? 'إتمام الطلب' : 'Checkout'}</div>
                  </div>
                </div>
              </div>
              {/* شريحتان عائمتان (عناصر واجهة) */}
              <div style={{ position: 'absolute', top: 6, insetInlineStart: -6, animation: 'lpFloat2 5s ease-in-out infinite', background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.shadow, borderRadius: 13, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: `${C.green}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔔</div>
                <div><div style={{ fontSize: 11, fontWeight: 900, color: C.ink }}>+1</div><div style={{ fontSize: 8.5, color: C.ink3, fontWeight: 700 }}>{isRtl ? 'طلب جديد' : 'new order'}</div></div>
              </div>
              <div style={{ position: 'absolute', bottom: 14, insetInlineEnd: -6, animation: 'lpFloat 6.5s ease-in-out infinite', background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.shadow, borderRadius: 13, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: `${C.blue}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bot size={15} color={C.blue} /></div>
                <div><div style={{ fontSize: 10, fontWeight: 900, color: C.ink }}>AI</div><div style={{ fontSize: 8.5, color: C.ink3, fontWeight: 700 }}>24/7</div></div>
              </div>
            </div>
          </div>

          {/* شريط الأرقام / Early-stage */}
          <div style={{ position: 'relative', maxWidth: 1000, margin: 'clamp(26px,4vh,44px) auto 0', animation: loaded ? 'lpUp .7s .3s ease both' : 'none' }}>
            {established ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 14, padding: '22px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, boxShadow: C.shadow }}>
                {[
                  { n: stats!.merchants, l: t(lang, 'landing.stats.merchants') },
                  { n: stats!.products, l: t(lang, 'landing.stats.products') },
                  { n: stats!.orders, l: t(lang, 'landing.stats.orders') },
                  { n: stats!.listings, l: tx('statListings') },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'clamp(22px,3.4vw,32px)', fontWeight: 900, color: C.ink }}><CountUp to={s.n} /></div>
                    <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 700, marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '20px 24px', background: `linear-gradient(135deg, ${C.orange}0d, ${C.blue}0d)`, border: `1px solid ${C.orange}26`, borderRadius: 20, textAlign: 'center' }}>
                <span style={{ fontSize: 11.5, fontWeight: 900, color: C.orangeD, background: C.surface, border: `1px solid ${C.orange}33`, borderRadius: 99, padding: '6px 14px', whiteSpace: 'nowrap' }}>{tx('earlyBadge')}</span>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: C.ink }}>{tx('earlyTitle')}</div>
                  <div style={{ fontSize: 12, color: C.ink2, marginTop: 2 }}>{tx('earlySub')}</div>
                </div>
                <a href={isAuthed ? '/dashboard' : '/login'} style={{ ...btnPrimary, padding: '11px 22px', fontSize: 14 }}>{t(lang, 'landing.merchant.ctaNew')} <Arrow size={15} /></a>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 'clamp(18px,3vh,32px)' }}>
            <button onClick={() => scrollTo('live')} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: C.ink3, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700 }}>{tx('scrollHint')} <ChevronDown size={18} style={{ animation: 'lpBounce 1.8s ease infinite' }} /></button>
          </div>
        </section>

        {/* ══ LIVE MARKETPLACE ══ */}
        <Section id="live" alt>
          <Reveal><SecHead title={tx('liveTitle')} sub={tx('liveSub')} /></Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,200px), 1fr))', gap: 16, marginTop: 30 }}>
            {gridItems.map((it, i) => <Reveal key={it.id} delay={(i % 4) * 70}><ProductCard it={it} tx={tx} big /></Reveal>)}
          </div>
          <div style={{ textAlign: 'center', marginTop: 26 }}>
            <a href="/market" style={{ ...btnGhost, display: 'inline-flex' }}>{tx('liveViewAll')} <Arrow size={16} /></a>
          </div>
        </Section>

        {/* ══ CITIES (المغرب) ══ */}
        <Section>
          <Reveal><SecHead title={tx('citiesTitle')} sub={tx('citiesSub')} /></Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,150px), 1fr))', gap: 14, marginTop: 30 }}>
            {cityItems.map((c, i) => (
              <Reveal key={c.city + i} delay={(i % 3) * 70}>
                <div className="lpcard" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: C.shadow, padding: '20px 16px', textAlign: 'center' }}>
                  <div className="lpico" style={{ width: 42, height: 42, borderRadius: 12, background: `${C.orange}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: C.orange }}><MapPin size={20} /></div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>{c.city}</div>
                  <div style={{ fontSize: 11.5, color: c.count > 0 ? C.ink3 : C.orangeD, fontWeight: 700, marginTop: 3 }}>{c.count > 0 ? `${c.count} ${tx('cityUnit')}` : tx('cityBeFirst')}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* ══ BENTO CAPABILITIES ══ */}
        <Section alt>
          <Reveal><SecHead title={tx('bentoTitle')} sub={tx('bentoSub')} /></Reveal>
          <div className="bento" style={{ marginTop: 32 }}>
            {CAPS.map((cp, i) => {
              const CIcon = cp.Icon;
              const featured = cp.feat || cp.wide;
              return (
                <Reveal key={cp.k} delay={(i % 4) * 60} style={{ height: '100%' }}>
                  <div className={`lpcard ${cp.feat ? 'feat' : cp.wide ? 'wide' : ''}`} style={{ height: '100%', minHeight: cp.feat ? 200 : 0, padding: cp.feat ? 26 : '20px 18px', borderRadius: 18, background: featured ? `linear-gradient(135deg, ${cp.c}, ${cp.c}cc)` : C.surface, border: featured ? 'none' : `1px solid ${C.border}`, boxShadow: C.shadow, color: featured ? '#fff' : C.ink, display: 'flex', flexDirection: 'column', textAlign: isRtl ? 'right' : 'left' }}>
                    <div className="lpico" style={{ width: cp.feat ? 56 : 46, height: cp.feat ? 56 : 46, borderRadius: 14, background: featured ? 'rgba(255,255,255,0.2)' : `${cp.c}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: featured ? '#fff' : cp.c, marginBottom: 13 }}><CIcon size={cp.feat ? 28 : 22} /></div>
                    <h3 style={{ fontSize: cp.feat ? 20 : 15.5, fontWeight: 800, margin: '0 0 6px' }}>{tx('cap.' + cp.k)}</h3>
                    <p style={{ fontSize: cp.feat ? 13.5 : 12, color: featured ? 'rgba(255,255,255,0.92)' : C.ink2, lineHeight: 1.65, margin: 0 }}>{tx('cap.' + cp.k + '.d')}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Section>

        {/* ══ HOW IT WORKS ══ */}
        <Section>
          <Reveal><SecHead title={tx('howTitle')} sub={tx('howSub')} /></Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,260px), 1fr))', gap: 18, marginTop: 30 }}>
            {[
              { n: '1', t: 'landing.how.step1', d: 'how1d', color: C.orange },
              { n: '2', t: 'landing.how.step2', d: 'how2d', color: C.blue },
              { n: '3', t: 'landing.how.step3', d: 'how3d', color: C.green },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div className="lpcard" style={{ height: '100%', padding: '28px 24px', borderRadius: 18, background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.shadow, textAlign: isRtl ? 'right' : 'left' }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: `${s.color}14`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, marginBottom: 16, border: `1.5px solid ${s.color}55` }}>{s.n}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 8px', color: C.ink }}>{t(lang, s.t)}</h3>
                  <p style={{ fontSize: 13, color: C.ink2, lineHeight: 1.7, margin: 0 }}>{tx(s.d)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* ══ WHY SAHAR (trust) ══ */}
        <Section alt>
          <Reveal><SecHead title={tx('storesTitle')} /></Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,260px), 1fr))', gap: 18, marginTop: 30 }}>
            {[
              { icon: <Zap size={22} />, t: 'why1', d: 'why1d', c: C.orange },
              { icon: <Bot size={22} />, t: 'why2', d: 'why2d', c: C.blue },
              { icon: <TrendingUp size={22} />, t: 'why3', d: 'why3d', c: C.green },
            ].map((w, i) => (
              <Reveal key={w.t} delay={i * 90}>
                <div className="lpcard" style={{ height: '100%', padding: '26px 22px', borderRadius: 18, background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.shadow, textAlign: isRtl ? 'right' : 'left' }}>
                  <div className="lpico" style={{ width: 50, height: 50, borderRadius: 14, background: `${w.c}14`, color: w.c, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>{w.icon}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 7px', color: C.ink }}>{tx(w.t)}</h3>
                  <p style={{ fontSize: 13, color: C.ink2, lineHeight: 1.7, margin: 0 }}>{tx(w.d)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* ══ PRICING ══ */}
        <Section>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: C.orangeD, background: `${C.orange}12`, border: `1px solid ${C.orange}26`, borderRadius: 99, padding: '5px 15px', letterSpacing: '.05em', textTransform: 'uppercase' }}>{t(lang, 'pricing.badge')}</span>
            </div>
            <SecHead title={t(lang, 'pricing.title')} sub={t(lang, 'pricing.sub')} />
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,260px), 1fr))', gap: 18, marginTop: 30, maxWidth: 720, marginInline: 'auto' }}>
            <Reveal>
              <div className="lpcard" style={{ height: '100%', background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.shadow, borderRadius: 20, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 11, textAlign: isRtl ? 'right' : 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.green }}>{t(lang, 'pricing.free.name')}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: C.ink }}>{t(lang, 'pricing.free.price')}</div>
                <div style={{ fontSize: 12, color: C.ink3 }}>{t(lang, 'pricing.free.desc')}</div>
                {(['pricing.free.f1', 'pricing.free.f2', 'pricing.free.f3'] as const).map(k => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink2 }}><Check size={14} color={C.green} /> {t(lang, k)}</div>
                ))}
                <a href="/login" style={{ marginTop: 'auto', textAlign: 'center', padding: '13px', borderRadius: 13, background: `${C.green}14`, border: `1px solid ${C.green}40`, color: C.green, fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>{t(lang, 'pricing.free.cta')}</a>
              </div>
            </Reveal>
            <Reveal delay={90}>
              <div className="lpcard" style={{ height: '100%', position: 'relative', background: C.surface, border: `2px solid ${C.orange}`, boxShadow: `0 18px 50px ${C.orange}26`, borderRadius: 20, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 11, textAlign: isRtl ? 'right' : 'left' }}>
                <span style={{ position: 'absolute', top: 14, insetInlineEnd: 16, fontSize: 10, fontWeight: 800, color: '#fff', background: C.orange, borderRadius: 99, padding: '4px 11px' } as any}>⭐ Pro</span>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.orangeD }}>{t(lang, 'pricing.pro.name')}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: C.ink }}>{t(lang, 'pricing.pro.price')}</div>
                <div style={{ fontSize: 12, color: C.ink3 }}>{t(lang, 'pricing.pro.desc')}</div>
                {(['pricing.pro.f1', 'pricing.pro.f2', 'pricing.pro.f3'] as const).map(k => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink2 }}><Check size={14} color={C.orange} /> {t(lang, k)}</div>
                ))}
                <a href="/login" className="lpbtn" style={{ marginTop: 'auto', position: 'relative', overflow: 'hidden', textAlign: 'center', padding: '13px', borderRadius: 13, background: `linear-gradient(135deg, ${C.orange}, ${C.orangeD})`, color: '#fff', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}><span className="sh" />{t(lang, 'pricing.pro.cta')}</a>
              </div>
            </Reveal>
          </div>
        </Section>

        {/* ══ FINAL CTA ══ */}
        <Section>
          <Reveal>
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 28, padding: 'clamp(36px,6vw,64px) clamp(20px,5vw,40px)', textAlign: 'center', background: `linear-gradient(135deg, ${C.orange}, ${C.purple})`, boxShadow: `0 24px 70px ${C.orange}33` }}>
              <div style={{ position: 'absolute', top: '-40%', insetInlineStart: '50%', transform: 'translateX(-50%)', width: 460, height: 460, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.18), transparent 65%)', pointerEvents: 'none' }} />
              <h2 style={{ position: 'relative', fontSize: 'clamp(24px,4.5vw,40px)', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em', color: '#fff' }}>{tx('ctaTitle')}</h2>
              <p style={{ position: 'relative', fontSize: 'clamp(13px,1.8vw,16px)', color: 'rgba(255,255,255,0.92)', maxWidth: 520, margin: '0 auto 26px', lineHeight: 1.7 }}>{tx('ctaSub')}</p>
              <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <a href={isAuthed ? '/dashboard' : '/login'} className="lpbtn" style={{ position: 'relative', overflow: 'hidden', display: 'inline-flex', alignItems: 'center', gap: 9, padding: '15px 34px', borderRadius: 14, background: '#fff', color: C.orangeD, fontSize: 15.5, fontWeight: 800, textDecoration: 'none', boxShadow: '0 12px 30px rgba(0,0,0,0.18)' }}><span className="sh" />{isAuthed ? t(lang, 'landing.merchant.ctaExisting') : t(lang, 'landing.merchant.ctaNew')} <Arrow size={18} /></a>
                <button onClick={startDemo} style={{ padding: '15px 28px', borderRadius: 14, background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', fontSize: 14.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{t(lang, 'landing.demo')}</button>
                <a href="/market" style={{ padding: '15px 24px', borderRadius: 14, background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', fontSize: 14.5, fontWeight: 800, textDecoration: 'none' }}>{tx('browseMarket')}</a>
              </div>
            </div>
          </Reveal>
        </Section>
      </main>

      {/* ══ FOOTER ══ */}
      <footer style={{ borderTop: `1px solid ${C.border}`, background: C.surface, padding: 'clamp(30px,5vw,44px) clamp(16px,5vw,40px)', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg, ${C.orange}, ${C.orangeD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src="/sahar-logo-text.png" alt="SAHAR" style={{ width: '78%', height: '78%', objectFit: 'contain' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).innerHTML = '<span style="font-size:13px;font-weight:900;color:#fff">S</span>'; }} />
          </div>
          <span style={{ fontWeight: 900, fontSize: 15, color: C.ink }}><span style={{ color: C.orange }}>SAHAR</span> shop</span>
        </div>
        <p style={{ fontSize: 12.5, color: C.ink2, maxWidth: 460, margin: '0 auto 16px', lineHeight: 1.7 }}>{tx('footTagline')}</p>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 12, marginBottom: 14 }}>
          <a href="https://wa.me/212649200188" target="_blank" rel="noreferrer" style={{ color: '#16A34A', fontWeight: 700, textDecoration: 'none' }}>💬 +212 649 200 188</a>
          <a href="https://wa.me/212612265893" target="_blank" rel="noreferrer" style={{ color: '#16A34A', fontWeight: 700, textDecoration: 'none' }}>💬 +212 612 265 893</a>
          <span style={{ color: C.ink3 }}>📍 Casablanca, Maroc</span>
        </div>
        <div style={{ fontSize: 11, color: C.ink3, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ color: '#B07A2B', fontWeight: 700 }}>AI Commerce OS © 2026</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{tx('footRights')}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{tx('creditPrefix')}: <a href="https://wa.me/212649200188" target="_blank" rel="noreferrer" style={{ color: C.orangeD, fontWeight: 700, textDecoration: 'none' }}>Alloservix · Abdellatif hadana</a></span>
        </div>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return <ErrorBoundary><LandingInner /></ErrorBoundary>;
}

function Section({ children, id, alt }: { children: React.ReactNode; id?: string; alt?: boolean }) {
  return <section id={id} style={{ padding: 'clamp(44px,8vh,88px) clamp(16px,5vw,40px)', background: alt ? C.alt : 'transparent' }}><div style={{ maxWidth: 1100, margin: '0 auto' }}>{children}</div></section>;
}

function SecHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ fontSize: 'clamp(22px,3.6vw,34px)', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2, color: C.ink }}>{title}</h2>
      {sub && <p style={{ fontSize: 'clamp(13px,1.6vw,16px)', color: C.ink2, maxWidth: 580, margin: '12px auto 0', lineHeight: 1.7 }}>{sub}</p>}
    </div>
  );
}
