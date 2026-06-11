import { useState } from 'react';
import { useStore } from '../store';
import {
  LayoutDashboard, Package, Layers, ShoppingCart, MessageCircle,
  Users, Bot, Megaphone, Truck, Tag, Sparkles, ChevronLeft,
  PlayCircle, CheckCircle2, ArrowLeft,
} from 'lucide-react';

interface Section {
  id: string; icon: any; title: string; tagline: string; color: string;
  steps: { t: string; d: string }[]; page?: string;
}

const SECTIONS: Section[] = [
  { id: 'start', icon: Sparkles, title: 'البداية السريعة', tagline: 'من الصفر إلى أول عملية بيع', color: '#FF6A00', page: 'dashboard',
    steps: [
      { t: '1) أنشئ متجرك', d: 'سجّل حسابك وأدخل اسم نشاطك ونوعه (منتجات / خدمات / الاثنين).' },
      { t: '2) أضف عناصرك', d: 'اضغط زر (+) في الأسفل واختر "إضافة منتج" أو "إضافة خدمة".' },
      { t: '3) اربط واتساب', d: 'من صفحة الاتصالات اربط رقم واتساب لاستقبال الطلبات تلقائياً.' },
      { t: '4) شارك متجرك', d: 'انسخ رابط متجرك من زر "متجري" وشاركه مع زبائنك.' },
    ],
  },
  { id: 'dashboard', icon: LayoutDashboard, title: 'الرئيسية', tagline: 'نظرة شاملة على متجرك', color: '#FF6A00', page: 'dashboard',
    steps: [{ t: 'مؤشرات الأداء', d: 'تابع المبيعات، الطلبات الجديدة، عدد الزبائن.' }, { t: 'تقرير الصباح', d: 'ملخص يومي ذكي عن متجرك بمجرد الدخول.' }] },
  { id: 'products', icon: Package, title: 'المنتجات', tagline: 'أضف وعدّل منتجاتك باحترافية', color: '#a78bfa', page: 'products',
    steps: [{ t: 'حقول حسب الفئة', d: 'كل فئة لها حقول خاصة: مقاسات، ألوان، خامة.' }, { t: 'وصف بالذكاء الاصطناعي', d: 'اضغط "توليد وصف" ليكتب لك AI وصفاً تسويقياً.' }, { t: 'استوديو التصميم', d: 'اكتب برومبت لتوليد صورة احترافية.' }, { t: 'فيديو المنتج', d: 'ارفع فيديو ليظهر للزبون في معرض الصور.' }] },
  { id: 'services', icon: Layers, title: 'الخدمات', tagline: 'للحرفيين ومقدمي الخدمات', color: '#00D2B3', page: 'products',
    steps: [{ t: 'فئات مغربية', d: 'كهربائي، سباك، نجار، مصمم، مبرمج، مصور...' }, { t: 'معلومات الخدمة', d: 'الوصف، السعر، مدة التنفيذ، المدينة، التنقل.' }] },
  { id: 'orders', icon: ShoppingCart, title: 'الطلبات', tagline: 'من الطلب إلى التوصيل', color: '#F6C453', page: 'orders',
    steps: [{ t: 'لوحة المراحل', d: 'تابع الطلبات: قيد الانتظار ← مقبول ← مشحون ← تم التوصيل.' }, { t: 'طباعة الوصل', d: 'بعد الموافقة اطبع فاتورة احترافية.' }, { t: 'إرسال للزبون', d: 'أرسل الوصل عبر واتساب بضغطة زر.' }] },
  { id: 'messages', icon: MessageCircle, title: 'الرسائل', tagline: 'كل المحادثات في مكان واحد', color: '#25D366', page: 'conversations',
    steps: [{ t: 'صندوق موحّد', d: 'رسائل واتساب وفيسبوك وانستغرام في صندوق واحد.' }, { t: 'ردود ذكية', d: 'الذكاء الاصطناعي يرد على الزبائن تلقائياً بالدارجة.' }] },
  { id: 'customers', icon: Users, title: 'الزبائن', tagline: 'اعرف زبائنك أكثر', color: '#60a5fa', page: 'customers',
    steps: [{ t: 'سجل كامل', d: 'كل زبون وطلباته ونقاط الولاء ومستوى الثقة.' }, { t: 'تواصل مباشر', d: 'راسل أي زبون عبر واتساب من صفحته.' }] },
  { id: 'ai', icon: Bot, title: 'الذكاء الاصطناعي', tagline: 'مساعدك الذكي 24/7', color: '#7C6FFA', page: 'connections',
    steps: [{ t: 'ربط OpenAI / Gemini', d: 'أدخل مفتاح API من الإعدادات لتفعيل كل ميزات الذكاء.' }, { t: 'بائع آلي', d: 'يجاوب الزبناء، يقترح منتجات، ويجمع معلومات الطلب.' }] },
  { id: 'marketing', icon: Megaphone, title: 'التسويق', tagline: 'انشر على كل المنصات', color: '#f472b6', page: 'banner',
    steps: [{ t: 'استوديو البانرات', d: 'صمم إعلانات وبوستات جاهزة للنشر.' }, { t: 'نشر تلقائي', d: 'انشر منتجاتك على فيسبوك وانستغرام مباشرة.' }] },
  { id: 'delivery', icon: Truck, title: 'التوصيل', tagline: 'إدارة الشحن بسهولة', color: '#00D2B3', page: 'delivery',
    steps: [{ t: 'شركات التوصيل', d: 'اربط شركات الشحن وحدّد أسعار المدن.' }, { t: 'تتبع آلي', d: 'إشعار الزبون عند الشحن مع رقم التتبع.' }] },
  { id: 'coupons', icon: Tag, title: 'الكوبونات', tagline: 'خصومات تزيد مبيعاتك', color: '#FF8533', page: 'coupons',
    steps: [{ t: 'أنشئ كوبون', d: 'نسبة مئوية، مبلغ ثابت، أو شحن مجاني.' }, { t: 'شارك مع الزبون', d: 'أرسل الكود عبر واتساب ليستخدمه عند الطلب.' }] },
];

export default function GuidePage() {
  const { setPage } = useStore();
  const [active, setActive] = useState<string | null>(null);
  const cur = SECTIONS.find(s => s.id === active);

  if (cur) {
    const Icon = cur.icon;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760, margin: '0 auto' }}>
        <button onClick={() => setActive(null)} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
          <ChevronLeft size={16} /> رجوع لكل الأقسام
        </button>
        <div style={{ padding: '28px 24px', borderRadius: 24, background: `${cur.color}10`, border: `1px solid ${cur.color}25`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, left: -30, width: 140, height: 140, borderRadius: '50%', background: `radial-gradient(circle, ${cur.color}20, transparent 70%)` }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: `${cur.color}15`, border: `2px solid ${cur.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cur.color }}><Icon size={30} /></div>
            <div><h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{cur.title}</h1><p style={{ fontSize: 13, color: '#999' }}>{cur.tagline}</p></div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cur.steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '18px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: `${cur.color}15`, color: cur.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 }}>{i + 1}</div>
              <div><p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{s.t}</p><p style={{ fontSize: 13, color: '#999', lineHeight: 1.7 }}>{s.d}</p></div>
            </div>
          ))}
        </div>
        {cur.page && (
          <button onClick={() => setPage(cur.page as any)} style={{ alignSelf: 'flex-start', padding: '12px 24px', borderRadius: 12, background: '#FF6A00', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowLeft size={16} /> اذهب إلى {cur.title}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 980, margin: '0 auto' }}>
      <div style={{ padding: 'clamp(28px,5vw,44px) clamp(20px,4vw,36px)', borderRadius: 28, background: 'linear-gradient(135deg, rgba(255,106,0,0.1), rgba(0,210,179,0.04))', border: '1px solid rgba(255,106,0,0.15)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,106,0,0.15), transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -70, left: -30, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,210,179,0.1), transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 99, background: 'rgba(255,106,0,0.08)', border: '1px solid rgba(255,106,0,0.2)', marginBottom: 14 }}>
            <PlayCircle size={14} color="#FF6A00" /><span style={{ fontSize: 12, fontWeight: 700, color: '#FF9A55' }}>دليل الاستخدام التفاعلي</span>
          </div>
          <h1 style={{ fontSize: 'clamp(24px,4vw,34px)', fontWeight: 900, lineHeight: 1.25, marginBottom: 10, letterSpacing: '-.02em' }}>
            تعلّم كل شيء عن <span style={{ color: '#FF6A00' }}>SAHAR shop</span>
          </h1>
          <p style={{ fontSize: 14, color: '#999', maxWidth: 540, lineHeight: 1.8 }}>منصة متكاملة لبيع المنتجات والخدمات — اختر قسماً للبدء.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {['🤖 ذكاء اصطناعي', '💬 واتساب', '📘 فيسبوك', '📸 انستغرام', '🎵 تيكتوك', '🚚 توصيل', '👥 CRM', '🏪 متجر رقمي'].map(p => (
          <span key={p} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#999', fontWeight: 600 }}>{p}</span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
        {SECTIONS.map(s => {
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setActive(s.id)}
              style={{ textAlign: 'right', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 10, padding: '20px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', transition: 'transform .18s, border-color .18s, box-shadow .18s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = `${s.color}40`; e.currentTarget.style.boxShadow = `0 16px 40px ${s.color}10`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${s.color}12`, border: `1.5px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}><Icon size={24} /></div>
              <div style={{ flex: 1 }}><p style={{ fontSize: 15, fontWeight: 800, marginBottom: 3 }}>{s.title}</p><p style={{ fontSize: 12, color: '#999', lineHeight: 1.6 }}>{s.tagline}</p></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: s.color, fontSize: 12, fontWeight: 700 }}><CheckCircle2 size={13} /> {s.steps.length} خطوات</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}