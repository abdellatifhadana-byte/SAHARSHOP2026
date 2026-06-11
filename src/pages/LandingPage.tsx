import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { t, type Lang } from '../i18n/translations';
import { Bot, MessageCircle, Truck, BarChart3, ShieldCheck, Sparkles, ArrowRight, Check, Star } from 'lucide-react';

const LANGS: { code: Lang; flag: string; label: string }[] = [
  { code: 'ar', flag: '🇸🇦', label: 'العربية' },
  { code: 'darija', flag: '🇲🇦', label: 'الدارجة' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
];

const HIGHLIGHTS = [
  { icon: '🤖', label: 'ذكاء اصطناعي', sub: 'ردود تلقائية بالدارجة' },
  { icon: '💬', label: 'واتساب', sub: 'طلب واستقبال مباشر' },
  { icon: '🚚', label: 'توصيل', sub: 'شحن لجميع المدن' },
  { icon: '📊', label: 'تحليلات', sub: 'إحصائيات آنية' },
];

const PRICING_PLANS = [
  {
    name: 'مجاني', price: '0', unit: 'درهم', period: 'للأبد',
    features: ['منتجات غير محدودة', 'محاكاة AI محلية', 'توصيل يدوي', 'دعم المجتمع'],
    cta: 'ابدأ مجاناً', href: '/login', highlight: false,
  },
  {
    name: 'برو', price: '99', unit: 'درهم', period: 'شهرياً',
    features: ['كل شيء في المجاني', 'AI حقيقي (GPT-4 + Gemini)', 'أتمتة التوصيل', 'نشر تلقائي على السوشل ميديا', 'دعم فني 24/7'],
    cta: 'جرب مجاناً 7 أيام', href: '/login', highlight: true,
  },
];

const TESTIMONIALS = [
  { text: 'ضاعف مبيعاتي في شهر واحد. الذكاء الاصطناعي يرد على الزبائن أفضل مني!', name: 'أحمد — بوتيك أزياء', city: 'الدار البيضاء' },
  { text: 'كنت أضيع وقتاً طويلاً في إدخال بيانات التوصيل. الآن كله تلقائي.', name: 'فاطمة — متجر إلكتروني', city: 'مراكش' },
  { text: 'الربط مع واتساب غيّر كل شيء. الزبون يطلب والطلب يصلني فوراً.', name: 'يوسف — خدمات منزلية', city: 'طنجة' },
];

export default function LandingPage() {
  const { token, user, settings, updateSettings } = useStore();
  const [lang, setLang] = useState<Lang>(() => ((settings.brand as any)?.language || 'ar') as Lang);
  const [loaded, setLoaded] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const userId = user?.id || (() => {
    try { const u = localStorage.getItem('ai_commerce_user'); return u ? JSON.parse(u)?.id : null; } catch { return null; }
  })();
  const storeUrl = userId ? `/store/${userId}` : null;
  const isAuthed = !!token || token === 'demo-token-local';
  const isRtl = lang === 'ar' || lang === 'darija';

  useEffect(() => { setTimeout(() => setLoaded(true), 80); }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLangMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const switchLang = (code: Lang) => {
    setLang(code);
    setShowLangMenu(false);
    updateSettings('brand', { ...(settings.brand as any), language: code });
  };

  const curLang = LANGS.find(l => l.code === lang) || LANGS[0];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{
      minHeight: '100dvh', background: '#050505', color: '#FAFAFA',
      fontFamily: 'Tajawal, system-ui, sans-serif',
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes glowPulse { 0%,100% { box-shadow: 0 0 20px rgba(124,58,237,0.2); } 50% { box-shadow: 0 0 40px rgba(124,58,237,0.4); } }
        .hover-lift { transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease; }
        .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        animation: loaded ? 'fadeIn 0.6s ease both' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #7C3AED, #FF7A00)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 900, color: '#fff',
          }}>S</div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>
            SAHAR <span style={{ color: '#A855F7' }}>shop</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div ref={langRef} style={{ position: 'relative' }}>
            <button onClick={() => setShowLangMenu(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#FAFAFA', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
              {curLang.flag} {curLang.label}
            </button>
            {showLangMenu && (
              <div style={{
                position: 'absolute', top: '120%', right: 0, minWidth: 140,
                background: '#111', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              }}>
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => switchLang(l.code)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 14px', background: l.code === lang ? 'rgba(124,58,237,0.1)' : 'transparent',
                      border: 'none', color: l.code === lang ? '#A855F7' : '#999',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isAuthed ? (
            <a href="/dashboard" style={{
              padding: '8px 18px', borderRadius: 8,
              background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
              color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none',
            }}>لوحة التحكم</a>
          ) : (
            <a href="/login" style={{
              padding: '8px 18px', borderRadius: 8,
              background: '#FAFAFA', color: '#050505',
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
            }}>تسجيل الدخول</a>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        padding: '120px 24px 80px', textAlign: 'center', maxWidth: 800, margin: '0 auto',
        animation: loaded ? 'fadeUp 0.7s 0.1s ease both' : 'none',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 99, marginBottom: 24,
          background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C3AED', animation: 'glowPulse 2s ease infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#A855F7' }}>الذكاء الاصطناعي لمتجرك</span>
        </div>

        <h1 style={{ fontSize: 'clamp(32px, 7vw, 64px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.03em' }}>
          <span style={{ background: 'linear-gradient(135deg, #FAFAFA, #A0A0A0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            متجرك الذكي
          </span>
          <br />
          <span style={{ background: 'linear-gradient(135deg, #7C3AED, #FF7A00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            يعمل 24/7
          </span>
        </h1>

        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.7 }}>
          منصة متكاملة للتجارة الإلكترونية. ذكاء اصطناعي يبيع نيابة عنك، واتساب مدمج، توصيل آلي، وإحصائيات آنية.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href={isAuthed ? '/dashboard' : '/login'} style={{
            padding: '14px 32px', borderRadius: 12,
            background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
            color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 8px 32px rgba(124,58,237,0.3)',
          }}>
            ابدأ الآن <ArrowRight size={16} />
          </a>
          <button onClick={() => { localStorage.setItem('ai_commerce_token', 'demo-token-local'); window.location.href = '/dashboard'; }}
            style={{
              padding: '14px 32px', borderRadius: 12,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#FAFAFA', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
            🚀 جرب العرض التوضيحي
          </button>
        </div>
      </section>

      {/* ── HIGHLIGHTS ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {HIGHLIGHTS.map(h => (
            <div key={h.label} style={{
              padding: '28px 20px', borderRadius: 16,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              textAlign: 'center', transition: 'all 0.2s ease',
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{h.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{h.label}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{h.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CARDS ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {/* Customer Card */}
          <a href={storeUrl || '/auth'} style={{
            display: 'flex', flexDirection: 'column', padding: '36px 28px',
            borderRadius: 20, textDecoration: 'none',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            transition: 'all 0.3s ease',
          }} className="hover-lift">
            <div style={{ fontSize: 36, marginBottom: 16 }}>🛍️</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#FAFAFA', marginBottom: 8 }}>تسوق الآن</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 20, flex: 1 }}>
              تصفح المنتجات والخدمات، اطلب مباشرة عبر واتساب، وتتبع طلبك بسهولة.
            </p>
            <span style={{ color: '#A855F7', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              استكشف المتجر <ArrowRight size={14} />
            </span>
          </a>

          {/* Merchant Card */}
          <a href={isAuthed ? '/dashboard' : '/login'} style={{
            display: 'flex', flexDirection: 'column', padding: '36px 28px',
            borderRadius: 20, textDecoration: 'none',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(255,122,0,0.03))',
            border: '1px solid rgba(124,58,237,0.15)',
            transition: 'all 0.3s ease',
          }} className="hover-lift">
            <div style={{ fontSize: 36, marginBottom: 16 }}>🏪</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#FAFAFA', marginBottom: 8 }}>ابدأ في البيع</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 20, flex: 1 }}>
              أضف منتجاتك وخدماتك، اربط واتساب، ودع الذكاء الاصطناعي يبيع نيابة عنك.
            </p>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 12,
              background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
              color: '#fff', fontWeight: 700, fontSize: 13,
            }}>
              {isAuthed ? 'لوحة التحكم' : 'أنشئ متجرك'} <ArrowRight size={14} />
            </span>
          </a>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, marginBottom: 8 }}>أسعار بسيطة</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>ابدأ مجاناً، وارتقِ عندما تكبر</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {PRICING_PLANS.map(plan => (
            <div key={plan.name} style={{
              padding: '32px 24px', borderRadius: 20,
              background: plan.highlight ? 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(255,122,0,0.04))' : 'rgba(255,255,255,0.02)',
              border: plan.highlight ? '1px solid rgba(124,58,237,0.2)' : '1px solid rgba(255,255,255,0.06)',
              display: 'flex', flexDirection: 'column',
              position: 'relative', overflow: 'hidden',
            }}>
              {plan.highlight && (
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  padding: '3px 10px', borderRadius: 99,
                  background: 'linear-gradient(135deg, #7C3AED, #FF7A00)',
                  fontSize: 10, fontWeight: 700, color: '#fff',
                }}>الأكثر شيوعاً</div>
              )}
              <div style={{ fontSize: 14, fontWeight: 700, color: '#999', marginBottom: 12, marginTop: plan.highlight ? 24 : 0 }}>
                {plan.name}
              </div>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 40, fontWeight: 900 }}>{plan.price}</span>
                <span style={{ fontSize: 14, color: '#999', marginRight: 4 }}>{plan.unit}</span>
                <span style={{ fontSize: 12, color: '#666', display: 'block', marginTop: 4 }}>{plan.period}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, flex: 1 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                    <Check size={14} color="#22C55E" /> {f}
                  </div>
                ))}
              </div>
              <a href={plan.href} style={{
                display: 'block', textAlign: 'center', padding: '12px',
                borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none',
                background: plan.highlight ? 'linear-gradient(135deg, #7C3AED, #A855F7)' : 'rgba(255,255,255,0.06)',
                color: plan.highlight ? '#fff' : '#FAFAFA',
                border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.08)',
              }}>
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>ماذا يقول التجار؟</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{
              padding: '24px 20px', borderRadius: 16,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} fill="#F59E0B" color="#F59E0B" />)}
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 14 }}>
                "{t.text}"
              </p>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{t.city}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.04)',
        padding: '32px 24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>SAHAR shop</div>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>AI Commerce OS © 2026 — Casablanca, Maroc</div>
        <a href="https://wa.me/212612265893" target="_blank" rel="noreferrer"
          style={{ color: '#22C55E', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          💬 +212 6 12 26 58 93
        </a>
      </footer>
    </div>
  );
}