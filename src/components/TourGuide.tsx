import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store';

interface TourStep {
  page: string;
  title: string;
  body: string;
  emoji: string;
}

const STEPS: TourStep[] = [
  { page: 'dashboard',     emoji: '🏠', title: 'لوحة التحكم',      body: 'نظرة شاملة على أداء متجرك — المبيعات، الطلبات، والزوار في لمحة واحدة.' },
  { page: 'products',      emoji: '📦', title: 'المنتجات',          body: 'أضف منتجاتك وخدماتك مع صور وأوصاف وأسعار. اضغط + لإضافة منتج جديد.' },
  { page: 'orders',        emoji: '🛒', title: 'الطلبات',            body: 'تابع طلبات زبائنك — اقبل، ارفض، أو أرسل للتوصيل بضغطة زر.' },
  { page: 'conversations', emoji: '💬', title: 'الرسائل',            body: 'تحدث مع زبائنك مباشرة. يمكن للذكاء الاصطناعي الرد بدلاً عنك تلقائياً.' },
  { page: 'customers',     emoji: '👥', title: 'الزبائن',            body: 'قاعدة بياناتك الكاملة للزبائن مع تاريخ الطلبات ومعلومات الاتصال.' },
  { page: 'delivery',      emoji: '🚚', title: 'التوصيل',            body: 'أضف شركات التوصيل — النظام يملأ الطلبات تلقائياً بدونك.' },
  { page: 'connections',   emoji: '🔗', title: 'الاتصالات',          body: 'اربط متجرك بـ WhatsApp وOpenAI وInstagram وغيرها لتفعيل كل الميزات.' },
  { page: 'settings',      emoji: '⚙️', title: 'الإعدادات',          body: 'خصص اسم متجرك، العملة، الألوان، والعلامة التجارية.' },
  { page: 'store',         emoji: '🌐', title: 'متجرك للزبائن',      body: 'زر متجرك من عين الزبون بالضغط على رابط "متجري" في الأعلى.' },
];

const TOUR_KEY = (userId: string) => `tour_done_${userId}`;

export default function TourGuide() {
  const { currentPage, setPage, user } = useStore();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  const userId = user?.id || 'guest';

  useEffect(() => {
    try {
      const done = localStorage.getItem(TOUR_KEY(userId));
      if (!done) { setTimeout(() => setActive(true), 1200); }
    } catch {}
  }, [userId]);

  const finish = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setActive(false);
      setExiting(false);
      try { localStorage.setItem(TOUR_KEY(userId), '1'); } catch {}
    }, 300);
  }, [userId]);

  const goStep = useCallback((idx: number) => {
    if (idx < 0 || idx >= STEPS.length) return;
    setStep(idx);
    const target = STEPS[idx].page;
    if (target !== 'store') setPage(target as any);
  }, [setPage]);

  const next = () => step < STEPS.length - 1 ? goStep(step + 1) : finish();
  const prev = () => step > 0 ? goStep(step - 1) : undefined;

  if (!active) return null;

  const cur = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={finish}
        style={{
          position: 'fixed', inset: 0, zIndex: 88888,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(3px)',
          opacity: exiting ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Card */}
      <div
        style={{
          position: 'fixed',
          bottom: 'clamp(80px, 12vh, 120px)',
          left: '50%',
          transform: `translateX(-50%) ${exiting ? 'translateY(20px) scale(0.96)' : 'translateY(0) scale(1)'}`,
          zIndex: 88889,
          width: 'min(92vw, 400px)',
          background: 'var(--panel, #111827)',
          border: '1px solid rgba(255,106,0,0.3)',
          borderRadius: 22,
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,106,0,0.15)',
          overflow: 'hidden',
          opacity: exiting ? 0 : 1,
          transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(.4,0,.2,1)',
        }}
      >
        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.07)' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg,#FF6A00,#F6C453)',
            width: `${progress}%`,
            transition: 'width 0.35s cubic-bezier(.4,0,.2,1)',
          }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>{cur.emoji}</span>
            <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--ink1, #e8e4dc)' }}>{cur.title}</p>
          </div>
          <button
            onClick={finish}
            style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--ink3,#6b7280)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '0 18px 16px' }}>
          <p style={{ fontSize: 13.5, color: 'var(--ink2, #b8b0a4)', lineHeight: 1.7 }}>{cur.body}</p>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '0 18px 14px' }}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => goStep(i)}
              style={{
                width: i === step ? 20 : 7, height: 7,
                borderRadius: 4,
                background: i < step ? 'rgba(255,106,0,0.5)' : i === step ? '#FF6A00' : 'rgba(255,255,255,0.15)',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'all 0.25s',
              }}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <span style={{ fontSize: 11.5, color: 'var(--ink3,#6b7280)', flex: 1 }}>
            {step + 1} / {STEPS.length}
          </span>
          {step > 0 && (
            <button onClick={prev} className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
              <ChevronLeft size={14} /> السابق
            </button>
          )}
          <button
            onClick={next}
            className="btn btn-primary btn-sm"
            style={{ gap: 4, paddingInline: 20 }}
          >
            {step < STEPS.length - 1 ? <><span>التالي</span><ChevronRight size={14} /></> : <span>ابدأ الآن ✨</span>}
          </button>
        </div>
      </div>
    </>
  );
}
