import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import {
  LayoutDashboard, Package, Layers, ShoppingCart, MessageCircle,
  Users, Bot, Megaphone, Truck, Tag, Sparkles, ChevronLeft,
  PlayCircle, CheckCircle2, ArrowLeft, BookOpen, Search,
  X, Zap, Star, Clock, TrendingUp, Shield, Gift, Camera,
  Video, Headphones, HelpCircle, FileText, BarChart3,
  Globe, Smartphone, CreditCard, MapPin, ThumbsUp,
  AlertCircle, Lightbulb, Compass, Target, Award,
  ChevronRight, ExternalLink, Copy, Check,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
interface GuideSection {
  id: string;
  icon: any;
  title: string;
  tagline: string;
  color: string;
  gradient: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeEstimate: string;
  steps: GuideStep[];
  page?: string;
  tips?: string[];
  relatedSections?: string[];
  videoUrl?: string;
}

interface GuideStep {
  t: string;
  d: string;
  icon?: any;
  pro?: boolean;
  action?: { label: string; page?: string; fn?: () => void };
}

interface FAQ {
  q: string;
  a: string;
  section: string;
}

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */
const SECTIONS: GuideSection[] = [
  {
    id: 'start',
    icon: Compass,
    title: 'البداية السريعة',
    tagline: 'من الصفر إلى أول عملية بيع في 5 دقائق',
    color: '#FF6A00',
    gradient: 'linear-gradient(135deg, rgba(255,106,0,0.12), rgba(255,133,51,0.04))',
    difficulty: 'beginner',
    timeEstimate: '5 دقائق',
    page: 'dashboard',
    steps: [
      {
        t: '1) أنشئ حسابك',
        d: 'سجّل بحساب Google أو البريد الإلكتروني. أدخل اسم نشاطك ونوعه (منتجات / خدمات / الاثنين).',
        icon: Sparkles,
      },
      {
        t: '2) أضف أول منتج أو خدمة',
        d: 'من لوحة التحكم، اضغط "إضافة منتج". املأ الاسم، السعر، الصورة، والفئة. للخدمات: أضف المدة ومنطقة التغطية.',
        icon: Package,
        action: { label: 'إضافة منتج', page: 'products' },
      },
      {
        t: '3) اربط واتساب (اختياري لكن مهم)',
        d: 'من صفحة الاتصالات، اربط WhatsApp Business لتستقبل الطلبات مباشرة على هاتفك.',
        icon: MessageCircle,
        action: { label: 'ربط واتساب', page: 'connections' },
      },
      {
        t: '4) انشر متجرك',
        d: 'انسخ رابط متجرك من زر "متجري" في الشريط العلوي. أرسله لزبائنك على واتساب أو انشره على وسائل التواصل.',
        icon: Globe,
        pro: false,
      },
      {
        t: '5) استلم أول طلب! 🎉',
        d: 'عندما يطلب زبون، يصلك إشعار فوري. وافق على الطلب وسيتم إرسال تأكيد للزبون تلقائياً.',
        icon: ThumbsUp,
      },
    ],
    tips: [
      'الصور عالية الجودة تزيد المبيعات 3 أضعاف',
      'أضف وصفاً دقيقاً للمنتج مع المقاسات والألوان',
      'فعّل الذكاء الاصطناعي للرد التلقائي على الزبائن',
    ],
    relatedSections: ['products', 'connections', 'settings'],
  },
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'لوحة التحكم',
    tagline: 'مركز قيادة متجرك — كل شيء في مكان واحد',
    color: '#FF6A00',
    gradient: 'linear-gradient(135deg, rgba(255,106,0,0.1), rgba(255,106,0,0.02))',
    difficulty: 'beginner',
    timeEstimate: '3 دقائق',
    page: 'dashboard',
    steps: [
      {
        t: 'نظرة عامة',
        d: 'شاهد الإيرادات، الطلبات الجديدة، الرسائل غير المقروءة، وعدد الزبائن في لمحة واحدة.',
        icon: TrendingUp,
      },
      {
        t: 'إجراءات سريعة',
        d: 'أزرار سريعة لإضافة منتج، عرض الطلبات، أو الذهاب للإعدادات. كل شيء بنقرة واحدة.',
        icon: Zap,
      },
      {
        t: 'تقرير الصباح اليومي',
        d: 'كل صباح، يصلك ملخص: إيرادات الأمس، الطلبات المعلقة، المنتجات منخفضة المخزون.',
        icon: Clock,
      },
      {
        t: 'إشعارات فورية',
        d: 'فعّل إشعارات المتصفح لتلقي تنبيه فوري عند كل طلب جديد — حتى عندما يكون التطبيق مغلقاً.',
        icon: Bell,
      },
    ],
    tips: [
      'حدد هدفاً يومياً للمبيعات من الإعدادات',
      'فعّل إشعارات Push لتكون أول من يعلم بالطلبات',
      'استخدم اختصارات لوحة التحكم للوصول السريع',
    ],
  },
  {
    id: 'products',
    icon: Package,
    title: 'المنتجات',
    tagline: 'أضف منتجاتك باحترافية — كل التفاصيل التي يحتاجها الزبون',
    color: '#a78bfa',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(167,139,250,0.02))',
    difficulty: 'intermediate',
    timeEstimate: '8 دقائق',
    page: 'products',
    steps: [
      {
        t: 'حقول ذكية حسب الفئة',
        d: 'اختر الفئة أولاً: ملابس، أحذية، إكسسوارات، خدمات... ستظهر الحقول المناسبة تلقائياً (مقاسات، ألوان، خامة، مدة...).',
        icon: Layers,
      },
      {
        t: 'توليد وصف بالذكاء الاصطناعي',
        d: 'اضغط زر "توليد وصف" ليكتب لك AI وصفاً تسويقياً جذاباً بالدارجة أو العربية. يتطلب ربط OpenAI أو Gemini.',
        icon: Bot,
        pro: true,
      },
      {
        t: 'استوديو التصميم',
        d: 'صمم صوراً احترافية لمنتجاتك. اختر من اقتراحات: إزالة الخلفية، إضافة موديل، خلفية بيضاء... أو اكتب برومبت مخصص.',
        icon: Camera,
        pro: true,
      },
      {
        t: 'فيديو المنتج',
        d: 'ارفع فيديو (MP4/MOV/WEBM) ليظهر للزبون في معرض الصور. الفيديو يزيد الثقة والمبيعات.',
        icon: Video,
      },
      {
        t: 'إعدادات متقدمة',
        d: 'حدد سعر التكلفة (للتخفيضات)، المخزون، SKU، الكلمات المفتاحية للبحث، والمنتجات المرتبطة.',
        icon: FileText,
      },
    ],
    tips: [
      'الصور البيضاء تزيد المبيعات في الملابس',
      'أضف جدول مقاسات للملابس — الزبون يثق أكثر',
      'استخدم الكلمات المفتاحية ليظهر منتجك في البحث',
    ],
    relatedSections: ['services', 'banner', 'ai'],
  },
  {
    id: 'services',
    icon: Layers,
    title: 'الخدمات',
    tagline: 'للحرفيين والمهنيين — قدّم خدماتك أونلاين',
    color: '#00D2B3',
    gradient: 'linear-gradient(135deg, rgba(0,210,179,0.1), rgba(0,210,179,0.02))',
    difficulty: 'beginner',
    timeEstimate: '4 دقائق',
    page: 'products',
    steps: [
      {
        t: 'اختر فئة الخدمة',
        d: 'كهربائي، سباك، نجار، صباغ، مصمم، مبرمج، مصور، نقل، تنظيف، تعليم... وغيرها من الفئات المغربية.',
        icon: Layers,
      },
      {
        t: 'حدد التفاصيل',
        d: 'المدة، السعر (ثابت/بالساعة/للمشروع)، منطقة التغطية، هل تذهب للزبون أم يأتي إليك.',
        icon: MapPin,
      },
      {
        t: 'أضف معرض أعمالك',
        d: 'صور من مشاريع سابقة، فيديوهات، شهادات أو رخص — كل ما يبني ثقة الزبون.',
        icon: Camera,
      },
      {
        t: 'استقبل الحجوزات',
        d: 'الزبون يختار الخدمة ويحجز مباشرة. يصلك إشعار بالحجز مع تفاصيل الزبون.',
        icon: ShoppingCart,
      },
    ],
    tips: [
      'أضف صوراً حقيقية من أعمالك السابقة',
      'حدد منطقة التغطية بدقة لتجنب الطلبات البعيدة',
      'اذكر إذا كنت توفر المعدات أم لا',
    ],
    relatedSections: ['products', 'orders'],
  },
  {
    id: 'orders',
    icon: ShoppingCart,
    title: 'الطلبات',
    tagline: 'من الطلب إلى التسليم — نظام متكامل',
    color: '#F6C453',
    gradient: 'linear-gradient(135deg, rgba(246,196,83,0.1), rgba(246,196,83,0.02))',
    difficulty: 'intermediate',
    timeEstimate: '6 دقائق',
    page: 'orders',
    steps: [
      {
        t: 'لوحة المراحل',
        d: 'كل طلب يمر بمراحل: قيد الانتظار ← مقبول ← جارٍ التحضير ← مشحون ← تم التوصيل. تابع التقدم visually.',
        icon: BarChart3,
      },
      {
        t: 'موافقة أو رفض',
        d: 'اضغط ✅ للموافقة (يُرسل تأكيد للزبون) أو ❌ للرفض مع سبب. يمكنك الموافقة ثم الشحن لاحقاً.',
        icon: CheckCircle2,
      },
      {
        t: 'طباعة الفاتورة',
        d: 'بعد الموافقة، اطبع فاتورة احترافية أو أرسلها للزبون عبر واتساب.',
        icon: FileText,
      },
      {
        t: 'إنشاء شحنة التوصيل',
        d: 'اختر شركة التوصيل (Amana، Jibli...) والنظام يملأ البيانات تلقائياً أو يساعدك يدوياً.',
        icon: Truck,
      },
      {
        t: 'تتبع آلي',
        d: 'أدخل رقم التتبع والزبون يتلقى إشعاراً. يمكنه تتبع شحنته من متجرك مباشرة.',
        icon: MapPin,
      },
    ],
    tips: [
      'وافق على الطلبات بسرعة — الزبون يقدّر السرعة',
      'أرسل رقم التتبع فور توفره لزيادة الثقة',
      'استخدم ميزة "إنشاء تلقائي" لتوفير الوقت',
    ],
    relatedSections: ['delivery', 'whatsapp', 'customers'],
  },
  {
    id: 'messages',
    icon: MessageCircle,
    title: 'الرسائل والمحادثات',
    tagline: 'كل تواصلك مع الزبائن في صندوق واحد',
    color: '#25D366',
    gradient: 'linear-gradient(135deg, rgba(37,211,102,0.08), rgba(37,211,102,0.02))',
    difficulty: 'beginner',
    timeEstimate: '4 دقائق',
    page: 'conversations',
    steps: [
      {
        t: 'صندوق موحّد',
        d: 'جميع رسائل واتساب، فيسبوك، وانستغرام تصل إلى صندوق واحد. لا تفوّت أي رسالة.',
        icon: MessageCircle,
      },
      {
        t: 'ردود ذكية تلقائية',
        d: 'الذكاء الاصطناعي يرد على الزبائن فوراً بالدارجة. يعرض المنتجات، يجيب على الأسئلة، ويجمع بيانات الطلب.',
        icon: Bot,
        pro: true,
      },
      {
        t: 'تحويل لمحادثة يدوية',
        d: 'إذا احتاج الزبون تدخلاً بشرياً، يمكنك تولي المحادثة بنفسك في أي لحظة.',
        icon: Headphones,
      },
      {
        t: 'قوالب جاهزة',
        d: 'أنشئ قوالب للردود الشائعة: "شكراً لطلبك"، "طلبك قيد التوصيل"، "عرض خاص"...',
        icon: FileText,
      },
    ],
    tips: [
      'فعّل الرد التلقائي خارج أوقات الدوام',
      'أنشئ قوالب للأسئلة المتكررة لتوفير الوقت',
      'تابع مزاج الزبون من مؤشر المشاعر',
    ],
    relatedSections: ['ai', 'whatsapp', 'templates'],
  },
  {
    id: 'customers',
    icon: Users,
    title: 'الزبائن',
    tagline: 'اعرف زبائنك عن قرب — بيانات، ولاء، وتاريخ',
    color: '#60a5fa',
    gradient: 'linear-gradient(135deg, rgba(96,165,250,0.1), rgba(96,165,250,0.02))',
    difficulty: 'beginner',
    timeEstimate: '3 دقائق',
    page: 'customers',
    steps: [
      {
        t: 'سجل كامل',
        d: 'كل زبون يضاف تلقائياً مع أول طلب. الاسم، الهاتف، المدينة، عدد الطلبات، إجمالي المشتريات.',
        icon: Users,
      },
      {
        t: 'نقاط الولاء',
        d: 'كل طلب يكسب الزبون نقاطاً. حدد أنت قيمة النقاط ومتى يمكن استبدالها بخصومات.',
        icon: Award,
      },
      {
        t: 'مستوى الثقة',
        d: 'يُحسب تلقائياً من تاريخ الطلبات: عدد الطلبات، قيمة المشتريات، الإرجاعات. يساعدك في تقييم المخاطر.',
        icon: Shield,
      },
      {
        t: 'تواصل مباشر',
        d: 'من صفحة أي زبون، يمكنك مراسلته مباشرة عبر واتساب أو إرسال عرض خاص.',
        icon: MessageCircle,
      },
    ],
    tips: [
      'كافئ الزبائن الأوفياء بخصومات خاصة',
      'تابع الزبائن الـ VIP وقدم لهم عروضاً حصرية',
      'استخدم بيانات الزبائن لإرسال عروض مستهدفة',
    ],
    relatedSections: ['orders', 'coupons', 'messages'],
  },
  {
    id: 'ai',
    icon: Bot,
    title: 'الذكاء الاصطناعي',
    tagline: 'بائع آلي يعمل 24/7 — لا ينام ولا يمرض',
    color: '#7C6FFA',
    gradient: 'linear-gradient(135deg, rgba(124,111,250,0.1), rgba(124,111,250,0.02))',
    difficulty: 'intermediate',
    timeEstimate: '5 دقائق',
    page: 'connections',
    steps: [
      {
        t: 'اربط مزود AI',
        d: 'OpenAI (GPT-4o)، Google Gemini (مجاني)، Claude، DeepSeek — اختر ما يناسبك. كلها تعمل بنظام Fallback الذكي.',
        icon: Zap,
        action: { label: 'ربط AI', page: 'connections' },
      },
      {
        t: 'البائع الآلي',
        d: 'يجاوب على أسئلة الزبائن، يعرض المنتجات، يقترح بدائل، ويجمع معلومات الطلب (الاسم، الهاتف، المدينة).',
        icon: Bot,
      },
      {
        t: 'توليد المحتوى',
        d: 'يكتب أوصافاً تسويقية للمنتجات، يولد هاشتاغات للسوشل ميديا، ويصمم صوراً بـ DALL-E.',
        icon: Sparkles,
        pro: true,
      },
      {
        t: 'محاكاة بشرية',
        d: 'فعّل "محاكاة بشرية" ليرد AI ببطء كأنه إنسان حقيقي يكتب. الزبون لا يشعر أنه يتحدث مع روبوت.',
        icon: ThumbsUp,
      },
    ],
    tips: [
      'ابدأ بـ Gemini — مجاني ولا يحتاج بطاقة بنكية',
      'أضف DeepSeek للدارجة — الأفضل والأرخص للعربية',
      'خصص شخصية AI: بائع مغربي، احترافي، ودود...',
    ],
    relatedSections: ['messages', 'products', 'whatsapp'],
  },
  {
    id: 'delivery',
    icon: Truck,
    title: 'التوصيل والشحن',
    tagline: 'أتمتة كاملة لعملية التوصيل',
    color: '#00D2B3',
    gradient: 'linear-gradient(135deg, rgba(0,210,179,0.1), rgba(0,210,179,0.02))',
    difficulty: 'advanced',
    timeEstimate: '8 دقائق',
    page: 'delivery',
    steps: [
      {
        t: 'أضف شركة التوصيل',
        d: 'Amana، Jibli، Naqel، Maystro... أو أي شركة أخرى. أدخل رابط الموقع وبيانات الدخول.',
        icon: Truck,
      },
      {
        t: 'أتمتة كاملة (URL Recipe)',
        d: 'سجّل "وصفة" — النظام يفتح الموقع، يسجل الدخول، يملأ بيانات الطلب، ويرجع رقم التتبع. كل شيء تلقائي.',
        icon: Zap,
        pro: true,
      },
      {
        t: 'مساعدة يدوية',
        d: 'إذا لم تكن الأتمتة متاحة، النظام يعرض لك بيانات الطلب منسقة وجاهزة للنسخ والإدخال اليدوي.',
        icon: Copy,
      },
      {
        t: 'إرسال تلقائي عند الموافقة',
        d: 'فعّل "إرسال تلقائي" — بمجرد الموافقة على طلب، يُرسل فوراً لشركة التوصيل دون تدخل منك.',
        icon: CheckCircle2,
      },
      {
        t: 'إشعار الزبون',
        d: 'الزبون يتلقى إشعاراً فورياً مع رقم التتبع عند الشحن. يمكنه تتبع شحنته من متجرك.',
        icon: Bell,
      },
    ],
    tips: [
      'جرّب الوضع البسيط أولاً (بريد + كلمة مرور فقط)',
      'وصفة URL تحتاج Backend مع Puppeteer',
      'أضف واتساب شركة التوصيل كبديل سريع',
    ],
    relatedSections: ['orders', 'settings', 'whatsapp'],
  },
  {
    id: 'coupons',
    icon: Tag,
    title: 'الكوبونات والخصومات',
    tagline: 'حملات ترويجية تزيد مبيعاتك',
    color: '#FF8533',
    gradient: 'linear-gradient(135deg, rgba(255,133,51,0.1), rgba(255,133,51,0.02))',
    difficulty: 'intermediate',
    timeEstimate: '4 دقائق',
    page: 'coupons',
    steps: [
      {
        t: 'أنشئ كوبون',
        d: 'اختر النوع: نسبة مئوية (10%)، مبلغ ثابت (50 درهم)، أو شحن مجاني. حدد عدد مرات الاستخدام وتاريخ الانتهاء.',
        icon: Tag,
      },
      {
        t: 'حدد الشروط',
        d: 'الحد الأدنى للطلب، الفئات المشمولة، العملاء المستهدفون. الكوبون يتحقق تلقائياً من استيفاء الشروط.',
        icon: Shield,
      },
      {
        t: 'شارك الكوبون',
        d: 'أرسل الكود للزبائن عبر واتساب، انشره على السوشل ميديا، أو أضفه تلقائياً للطلبات الكبيرة.',
        icon: Send,
      },
    ],
    tips: [
      'أنشئ كوبونات محدودة الوقت لإحساس الاستعجال',
      'قدم شحن مجاني للطلبات فوق 400 درهم',
      'تابع أداء الكوبونات من الإحصائيات',
    ],
    relatedSections: ['orders', 'customers', 'marketing'],
  },
  {
    id: 'marketing',
    icon: Megaphone,
    title: 'التسويق والنشر',
    tagline: 'انشر منتجاتك على كل المنصات',
    color: '#f472b6',
    gradient: 'linear-gradient(135deg, rgba(244,114,182,0.1), rgba(244,114,182,0.02))',
    difficulty: 'intermediate',
    timeEstimate: '5 دقائق',
    page: 'banner',
    steps: [
      {
        t: 'استوديو البانرات',
        d: 'صمم إعلانات وبوستات جاهزة للنشر. اختر من قوالب احترافية أو اكتب برومبت للذكاء الاصطناعي.',
        icon: Camera,
      },
      {
        t: 'نشر تلقائي',
        d: 'انشر مباشرة على فيسبوك وانستغرام من داخل التطبيق. اكتب المنشور، أرفق الصورة، وانشر.',
        icon: Globe,
        pro: true,
      },
      {
        t: 'هاشتاغات ذكية',
        d: 'الذكاء الاصطناعي يولد لك هاشتاغات مناسبة للمنتج والسوق المغربي.',
        icon: Hash,
        pro: true,
      },
    ],
    tips: [
      'انشر في أوقات الذروة: 9 صباحاً و9 مساءً',
      'استخدم هاشتاغات مغربية: #تسوق_المغرب',
      'صور المنتجات الحقيقية أفضل من الصور المولدة',
    ],
    relatedSections: ['products', 'ai', 'connections'],
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'الإعدادات',
    tagline: 'خصص متجرك كما تريد',
    color: '#94a3b8',
    gradient: 'linear-gradient(135deg, rgba(148,163,184,0.08), rgba(148,163,184,0.02))',
    difficulty: 'beginner',
    timeEstimate: '5 دقائق',
    page: 'settings',
    steps: [
      {
        t: 'معلومات المتجر',
        d: 'الاسم، الوصف، اللوجو، الهاتف، المدينة، العملة. كل ما يظهر للزبون في متجرك.',
        icon: FileText,
      },
      {
        t: 'إعدادات التوصيل',
        d: 'تكلفة التوصيل لكل مدينة، وسيلة الدفع الافتراضية، مدة التوصيل.',
        icon: Truck,
      },
      {
        t: 'إعدادات الذكاء الاصطناعي',
        d: 'اختر شخصية AI (بائع مغربي، احترافي، ودود...)، لغة الرد (دارجة/عربية/فرنسية)، والتأخير في الرد.',
        icon: Bot,
      },
      {
        t: 'نسخ احتياطي',
        d: 'حمّل نسخة من بياناتك أو استعدها. النسخ الاحتياطي اليومي التلقائي يحمي بياناتك.',
        icon: Shield,
      },
    ],
    tips: [
      'أضف وصفاً جذاباً لمتجرك — يظهر في صفحة الزبون',
      'حدد تكاليف التوصيل بدقة لتجنب الخسائر',
      'فعّل النسخ الاحتياطي التلقائي للإمان',
    ],
    relatedSections: ['delivery', 'ai', 'connections'],
  },
];

const FAQS: FAQ[] = [
  { q: 'هل يمكنني بيع منتجات وخدمات معاً؟', a: 'نعم! SAHAR shop يدعم المنتجات والخدمات والمنتجات الرقمية في نفس المتجر. كل نوع له حقوله الخاصة.', section: 'start' },
  { q: 'كيف يشتري الزبون من متجري؟', a: 'الزبون يدخل رابط متجرك، يتصفح المنتجات، يضيف للسلة، ويملأ بياناته. الطلب يصلك فوراً مع تفاصيله.', section: 'orders' },
  { q: 'هل الذكاء الاصطناعي مجاني؟', a: 'نعم! Gemini من Google مجاني تماماً. OpenAI وClaude وDeepSeek يحتاجون مفاتيح مدفوعة لكن رخيصة.', section: 'ai' },
  { q: 'كيف أربط واتساب؟', a: 'من صفحة الاتصالات، اتبع الخطوات: سجل في Meta for Developers، أنشئ تطبيقاً، فعّل WhatsApp، وانسخ الرموز.', section: 'messages' },
  { q: 'هل يمكنني النشر على فيسبوك وانستغرام؟', a: 'نعم! من صفحة الاتصالات اربط حساباتك. من استوديو البانرات يمكنك تصميم ونشر المنشورات مباشرة.', section: 'marketing' },
  { q: 'ماذا لو لم تصلني إشعارات الطلبات؟', a: 'فعّل إشعارات Push من لوحة التحكم. تأكد أيضاً من تفعيل إشعارات المتصفح على هاتفك.', section: 'dashboard' },
  { q: 'هل تطبيق SAHAR shop يعمل على الهاتف؟', a: 'نعم! التطبيق Progressive Web App — ثبته على شاشتك الرئيسية وسيعمل مثل تطبيق أصلي.', section: 'start' },
  { q: 'كيف أتتبع شحنة طلب؟', a: 'من صفحة الطلب، أدخل رقم التتبع. الزبون أيضاً يمكنه تتبع شحنته من متجرك.', section: 'delivery' },
];

/* ═══════════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

/** بطاقة قسم — في الشاشة الرئيسية */
function SectionCard({ section, onClick, index }: { section: GuideSection; onClick: () => void; index: number }) {
  const [hover, setHover] = useState(false);
  const Icon = section.icon;

  const diffBadge = {
    beginner: { bg: 'rgba(34,197,94,0.1)', color: '#22C55E', label: 'مبتدئ' },
    intermediate: { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B', label: 'متوسط' },
    advanced: { bg: 'rgba(239,68,68,0.1)', color: '#EF4444', label: 'متقدم' },
  }[section.difficulty];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textAlign: 'right', cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', flexDirection: 'column', gap: 12,
        padding: '24px 20px', borderRadius: 20,
        background: hover ? section.gradient : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hover ? `${section.color}30` : 'rgba(255,255,255,0.05)'}`,
        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        transform: hover ? 'translateY(-6px)' : 'none',
        boxShadow: hover ? `0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px ${section.color}20` : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Hover glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%',
        background: `radial-gradient(circle, ${section.color}15, transparent 70%)`,
        opacity: hover ? 1 : 0, transition: 'opacity 0.3s', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {/* Icon + Difficulty */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: `${section.color}15`, border: `1.5px solid ${section.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: section.color, transition: 'transform 0.2s',
            transform: hover ? 'scale(1.1)' : 'scale(1)',
          }}>
            <Icon size={26} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
              background: diffBadge.bg, color: diffBadge.color, border: `1px solid ${diffBadge.color}20`,
            }}>
              {diffBadge.label}
            </span>
            <span style={{ fontSize: 10, color: '#777', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={10} /> {section.timeEstimate}
            </span>
          </div>
        </div>

        {/* Title + Tagline */}
        <div>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#FAFAFA', marginBottom: 4 }}>{section.title}</p>
          <p style={{ fontSize: 12, color: '#999', lineHeight: 1.6 }}>{section.tagline}</p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: section.color, fontSize: 12, fontWeight: 700 }}>
            <CheckCircle2 size={14} /> {section.steps.length} خطوات
          </span>
          {section.pro && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(255,106,0,0.1)', color: '#FF6A00', border: '1px solid rgba(255,106,0,0.2)' }}>PRO</span>
          )}
        </div>
      </div>
    </button>
  );
}

/** عرض تفصيلي لقسم */
function SectionDetail({ section, onBack }: { section: GuideSection; onBack: () => void }) {
  const { setPage } = useStore();
  const Icon = section.icon;
  const [activeTip, setActiveTip] = useState(0);

  // Auto-rotate tips
  useEffect(() => {
    if (!section.tips?.length) return;
    const t = setInterval(() => setActiveTip(p => (p + 1) % section.tips!.length), 5000);
    return () => clearInterval(t);
  }, [section.tips]);

  const handleAction = (action?: { label: string; page?: string }) => {
    if (!action) return;
    if (action.page) setPage(action.page as any);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800, margin: '0 auto' }}>
      {/* Back */}
      <button onClick={onBack}
        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', padding: '8px 0' }}>
        <ChevronLeft size={16} /> رجوع للدليل
      </button>

      {/* Hero */}
      <div style={{
        padding: '32px 28px', borderRadius: 24, background: section.gradient,
        border: `1px solid ${section.color}25`, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -30, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, ${section.color}20, transparent 70%)` }} />
        <div style={{ position: 'absolute', bottom: -50, left: -40, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle, ${section.color}10, transparent 70%)` }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, flexShrink: 0,
            background: `${section.color}18`, border: `2px solid ${section.color}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: section.color,
          }}>
            <Icon size={34} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#FAFAFA', margin: 0 }}>{section.title}</h1>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: `${section.color}15`, color: section.color, border: `1px solid ${section.color}25` }}>
                {section.steps.length} خطوات
              </span>
            </div>
            <p style={{ fontSize: 14, color: '#999', margin: 0 }}>{section.tagline}</p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {section.steps.map((step, i) => {
          const StepIcon = step.icon;
          return (
            <div key={i} style={{
              display: 'flex', gap: 16, padding: '20px', borderRadius: 16,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
              transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
            }}>
              {/* Step number line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 12,
                  background: `${section.color}15`, color: section.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 14, border: `1.5px solid ${section.color}30`,
                }}>
                  {i + 1}
                </div>
                {i < section.steps.length - 1 && (
                  <div style={{ width: 1.5, flex: 1, background: `linear-gradient(${section.color}30, transparent)`, marginTop: 4 }} />
                )}
              </div>

              <div style={{ flex: 1, paddingBottom: i < section.steps.length - 1 ? 8 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {StepIcon && <StepIcon size={15} color={section.color} />}
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#FAFAFA' }}>{step.t}</span>
                  {step.pro && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(255,106,0,0.1)', color: '#FF6A00', border: '1px solid rgba(255,106,0,0.2)' }}>PRO</span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: '#999', lineHeight: 1.8 }}>{step.d}</p>
                {step.action && (
                  <button onClick={() => handleAction(step.action)}
                    style={{
                      marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 16px', borderRadius: 10,
                      background: `${section.color}12`, border: `1px solid ${section.color}25`,
                      color: section.color, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}>
                    {step.action.label} <ChevronRight size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips Carousel */}
      {section.tips && section.tips.length > 0 && (
        <div style={{
          padding: '18px 20px', borderRadius: 16,
          background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <Lightbulb size={18} color="#F59E0B" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', marginBottom: 6, letterSpacing: '0.04em' }}>💡 نصيحة احترافية</p>
            <p style={{ fontSize: 13, color: '#ccc', lineHeight: 1.7 }}>{section.tips[activeTip]}</p>
            {section.tips.length > 1 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                {section.tips.map((_, i) => (
                  <button key={i} onClick={() => setActiveTip(i)}
                    style={{
                      width: 20, height: 4, borderRadius: 2, border: 'none', cursor: 'pointer',
                      background: i === activeTip ? '#F59E0B' : 'rgba(255,255,255,0.1)',
                      transition: 'background 0.2s',
                    }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      {section.page && (
        <button onClick={() => setPage(section.page as any)}
          style={{
            alignSelf: 'flex-start', padding: '14px 28px', borderRadius: 14,
            background: `linear-gradient(135deg, ${section.color}, ${section.color}dd)`,
            border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: `0 8px 24px ${section.color}30`,
            fontFamily: 'inherit',
          }}>
          <ArrowLeft size={16} /> اذهب إلى {section.title}
        </button>
      )}

      {/* Related Sections */}
      {section.relatedSections && section.relatedSections.length > 0 && (
        <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <p style={{ fontSize: 12, color: '#777', marginBottom: 10, fontWeight: 600 }}>مواضيع ذات صلة:</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {section.relatedSections.map(id => {
              const related = SECTIONS.find(s => s.id === id);
              if (!related) return null;
              return (
                <button key={id} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  style={{
                    padding: '6px 14px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    color: '#999', cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                  {related.title}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** بحث عن الأسئلة الشائعة */
function FAQSection({ faqs, onSelectSection }: { faqs: FAQ[]; onSelectSection: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = search.trim()
    ? faqs.filter(f => f.q.includes(search) || f.a.includes(search))
    : faqs;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#777' }} />
        <input
          placeholder="ابحث في الأسئلة الشائعة..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '12px 40px 12px 16px',
            borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.03)', color: '#FAFAFA',
            fontSize: 13, outline: 'none', fontFamily: 'Tajawal, sans-serif',
          }}
        />
        {search && (
          <button onClick={() => setSearch('')}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* FAQ List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(faq => (
          <div key={faq.q} style={{
            borderRadius: 14, overflow: 'hidden',
            background: expanded === faq.q ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <button onClick={() => setExpanded(expanded === faq.q ? null : faq.q)}
              style={{
                width: '100%', padding: '14px 18px', textAlign: 'right',
                background: 'none', border: 'none', color: '#FAFAFA',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: 13, fontWeight: 600,
              }}>
              <span>{faq.q}</span>
              <ChevronRight size={14} style={{
                transform: expanded === faq.q ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.2s', color: '#777',
              }} />
            </button>
            {expanded === faq.q && (
              <div style={{ padding: '0 18px 14px', fontSize: 13, color: '#999', lineHeight: 1.8 }}>
                {faq.a}
                {faq.section && (
                  <button onClick={() => onSelectSection(faq.section)}
                    style={{
                      display: 'block', marginTop: 10, color: '#FF6A00', fontWeight: 600,
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 12,
                      fontFamily: 'inherit',
                    }}>
                    اذهب للقسم ←
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function GuidePage() {
  const { setPage } = useStore();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [view, setView] = useState<'sections' | 'faq'>('sections');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredSections = searchQuery.trim()
    ? SECTIONS.filter(s =>
        s.title.includes(searchQuery) ||
        s.tagline.includes(searchQuery) ||
        s.steps.some(step => step.t.includes(searchQuery) || step.d.includes(searchQuery))
      )
    : SECTIONS;

  // Keyboard shortcut: ESC to go back
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeSection) setActiveSection(null);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [activeSection]);

  const active = activeSection ? SECTIONS.find(s => s.id === activeSection) : null;

  // ── Detail View ──
  if (active) {
    return <SectionDetail section={active} onBack={() => setActiveSection(null)} />;
  }

  // ── Overview ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1100, margin: '0 auto' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .guide-hero { animation: fadeIn 0.6s ease both; }
        .guide-card { animation: fadeIn 0.6s ease both; }
        .guide-card:nth-child(1) { animation-delay: 0.05s; }
        .guide-card:nth-child(2) { animation-delay: 0.1s; }
        .guide-card:nth-child(3) { animation-delay: 0.15s; }
        .guide-card:nth-child(4) { animation-delay: 0.2s; }
        .guide-card:nth-child(5) { animation-delay: 0.25s; }
        .guide-card:nth-child(6) { animation-delay: 0.3s; }
        .guide-card:nth-child(7) { animation-delay: 0.35s; }
        .guide-card:nth-child(8) { animation-delay: 0.4s; }
        .guide-card:nth-child(9) { animation-delay: 0.45s; }
        .guide-card:nth-child(10) { animation-delay: 0.5s; }
        .guide-card:nth-child(11) { animation-delay: 0.55s; }
        .guide-card:nth-child(12) { animation-delay: 0.6s; }
      `}</style>

      {/* Hero Banner */}
      <div className="guide-hero" style={{
        padding: 'clamp(32px, 5vw, 48px) clamp(24px, 4vw, 40px)',
        borderRadius: 28,
        background: 'linear-gradient(135deg, rgba(255,106,0,0.1), rgba(124,58,237,0.06), rgba(0,210,179,0.04))',
        border: '1px solid rgba(255,106,0,0.15)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Ambient glows */}
        <div style={{ position: 'absolute', top: -80, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,106,0,0.18), transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -90, left: -50, width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)' }} />
        <div style={{ position: 'absolute', top: '50%', left: '30%', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,210,179,0.08), transparent 70%)' }} />

        <div style={{ position: 'relative' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 99, marginBottom: 16,
            background: 'rgba(255,106,0,0.08)', border: '1px solid rgba(255,106,0,0.2)',
          }}>
            <BookOpen size={14} color="#FF6A00" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#FF9A55' }}>الدليل الشامل</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900,
            lineHeight: 1.2, marginBottom: 12, letterSpacing: '-0.03em',
          }}>
            أتقن <span style={{ color: '#FF6A00' }}>SAHAR shop</span>
            <br />
            <span style={{ fontSize: '0.6em', color: '#999', fontWeight: 500 }}>كل ما تحتاج معرفته لتبيع أكثر</span>
          </h1>

          <p style={{ fontSize: 14, color: '#999', maxWidth: 560, lineHeight: 1.8, marginBottom: 20 }}>
            منصة متكاملة لبيع المنتجات والخدمات مع ذكاء اصطناعي وواتساب وتوصيل آلي.
            اختر قسماً للبدء أو ابحث في الأسئلة الشائعة.
          </p>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setView('sections')}
              style={{
                padding: '10px 22px', borderRadius: 12, fontFamily: 'inherit',
                background: view === 'sections' ? '#FF6A00' : 'rgba(255,255,255,0.04)',
                border: view === 'sections' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                color: view === 'sections' ? '#fff' : '#999',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
              📚 الأقسام ({SECTIONS.length})
            </button>
            <button onClick={() => setView('faq')}
              style={{
                padding: '10px 22px', borderRadius: 12, fontFamily: 'inherit',
                background: view === 'faq' ? '#FF6A00' : 'rgba(255,255,255,0.04)',
                border: view === 'faq' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                color: view === 'faq' ? '#fff' : '#999',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
              ❓ الأسئلة الشائعة ({FAQS.length})
            </button>
            <button onClick={() => setShowSearch(!showSearch)}
              style={{
                padding: '10px 22px', borderRadius: 12, fontFamily: 'inherit',
                background: showSearch ? 'rgba(255,106,0,0.1)' : 'rgba(255,255,255,0.04)',
                border: showSearch ? '1px solid rgba(255,106,0,0.2)' : '1px solid rgba(255,255,255,0.08)',
                color: showSearch ? '#FF6A00' : '#999',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
              <Search size={14} /> بحث
            </button>
          </div>

          {/* Search bar */}
          {showSearch && (
            <div style={{ position: 'relative', marginTop: 14, maxWidth: 400 }}>
              <Search size={14} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#777' }} />
              <input
                placeholder="ابحث في الدليل..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                style={{
                  width: '100%', padding: '12px 42px 12px 16px',
                  borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)', color: '#FAFAFA',
                  fontSize: 13, outline: 'none', fontFamily: 'Tajawal, sans-serif',
                }}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setShowSearch(false); }}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feature pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {['🤖 ذكاء اصطناعي', '💬 واتساب', '📘 فيسبوك', '📸 انستغرام', '🎵 تيكتوك', '🚚 توصيل', '👥 CRM', '🏪 متجر رقمي', '📊 تحليلات', '🎨 تصميم', '🔒 آمن', '⚡ سريع'].map(p => (
          <span key={p} style={{
            fontSize: 11, padding: '6px 13px', borderRadius: 99,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
            color: '#888', fontWeight: 600,
          }}>{p}</span>
        ))}
      </div>

      {/* Content */}
      {view === 'sections' ? (
        <>
          {searchQuery && filteredSections.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#999' }}>
              <Search size={40} style={{ marginBottom: 12, opacity: 0.2 }} />
              <p style={{ fontSize: 15, fontWeight: 600 }}>لم نجد نتائج لـ "{searchQuery}"</p>
              <button onClick={() => setSearchQuery('')} style={{ marginTop: 12, color: '#FF6A00', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>مسح البحث</button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filteredSections.map((section, i) => (
              <div key={section.id} className="guide-card">
                <SectionCard
                  section={section}
                  index={i}
                  onClick={() => setActiveSection(section.id)}
                />
              </div>
            ))}
          </div>
        </>
      ) : (
        <FAQSection faqs={FAQS} onSelectSection={setActiveSection} />
      )}

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 12, padding: '24px', borderRadius: 20,
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
      }}>
        {[
          { n: SECTIONS.length, l: 'قسم', icon: BookOpen },
          { n: FAQS.length, l: 'سؤال شائع', icon: HelpCircle },
          { n: SECTIONS.reduce((s, sec) => s + sec.steps.length, 0), l: 'خطوة', icon: CheckCircle2 },
          { n: SECTIONS.filter(s => s.pro).length, l: 'ميزة PRO', icon: Star },
        ].map(stat => (
          <div key={stat.l} style={{ textAlign: 'center' }}>
            <stat.icon size={20} style={{ color: '#FF6A00', marginBottom: 8 }} />
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stat.n}</div>
            <div style={{ fontSize: 11, color: '#777', marginTop: 3 }}>{stat.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}