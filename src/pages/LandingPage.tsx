import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { t, type Lang } from '../i18n/translations';
import { Bot, MessageCircle, Truck, BarChart3, ShieldCheck, Sparkles, ArrowRight, Check, Star, ChevronDown } from 'lucide-react';

const LANGS: { code: Lang; flag: string; label: string }[] = [
  { code: 'ar', flag: '🇸🇦', label: 'العربية' },
  { code: 'darija', flag: '🇲🇦', label: 'الدارجة' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
];

const FEATURES = [
  { Icon: Bot, key: 'landing.feature.ai', color: '#FF6A00' },
  { Icon: MessageCircle, key: 'landing.feature.whatsapp', color: '#25D366' },
  { Icon: Truck, key: 'landing.feature.delivery', color: '#00D2B3' },
  { Icon: BarChart3, key: 'landing.feature.analytics', color: '#FF8533' },
  { Icon: ShieldCheck, key: 'landing.feature.secure', color: '#a78bfa' },
  { Icon: Sparkles, key: 'landing.feature.banner', color: '#60a5fa' },
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

  const userId = user?.id || (() => { try { const u = localStorage.getItem('ai_commerce_user'); return u ? JSON.parse(u)?.id : null; } catch { return null; } })();
  const storeUrl = userId ? `/store/${userId}` : null;
  const isAuthed = !!token || token === 'demo-token-local';
  const isRtl = lang === 'ar' || lang === 'darija';

  useEffect(() => { setTimeout(() => setLoaded(true), 80); }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLangMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const switchLang = (code: Lang) => { setLang(code); setShowLangMenu(false); updateSettings('brand', { ...(settings.brand as any), language: code }); };
  const curLang = LANGS.find(l => l.code === lang) || LANGS[0];

  const GlassCard = 'rgba(255,255,255,0.04)';
  const GlassBorder = 'rgba(255,255,255,0.06)';
  const GlassHover = 'rgba(255,255,255,0.08)';

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{
      minHeight: '100dvh', background: '#0A0A0F', color: '#FAFAFA',
      fontFamily: 'Tajawal, system-ui, sans-serif',
      backgroundImage: `
        radial-gradient(ellipse 80% 60% at 20% 30%, rgba(124,58,237,0.06) 0%, transparent 50%),
        radial-gradient(ellipse 60% 70% at 75% 20%, rgba(255,106,0,0.04) 0%, transparent 45%),
        radial-gradient(ellipse 50% 50% at 50% 80%, rgba(0,210,179,0.03) 0%, transparent 50%)
      `,
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:1} }
        .hover-lift { transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease, border-color 0.3s ease; }
        .hover-lift:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.12) !important; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
        .glass-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; backdrop-filter: blur(20px); }
      `}</style>

      {/* ── TOP BAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        animation: loaded ? 'fadeIn 0.6s ease both' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, overflow: 'hidden',
            background: 'rgba(255,106,0,0.1)', border: '1.5px solid rgba(255,106,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(255,106,0,0.2)',
          }}>
            <img src="/sahar-logo-text.png" alt="S" style={{ width: '80%', height: '80%', objectFit: 'contain' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; (e.currentTarget.parentElement as HTMLElement).innerHTML='<span style="font-size:16px;font-weight:900;color:#FF6A00">S</span>'; }} />
          </div>
          <span style={{ fontWeight: 900, fontSize: 16, color: '#FAFAFA', letterSpacing: '-0.02em' }}>
            <span style={{ color: '#FF6A00' }}>SAHAR</span> shop
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div ref={langRef} style={{ position: 'relative' }}>
            <button onClick={() => setShowLangMenu(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#FAFAFA', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {curLang.flag} {curLang.label}
              <ChevronDown size={10} style={{ transform: showLangMenu ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>
            {showLangMenu && (
              <div style={{ position: 'absolute', top: '120%', right: 0, minWidth: 150, background: '#1A1A25', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', zIndex: 100 }}>
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => switchLang(l.code)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: l.code === lang ? 'rgba(255,106,0,0.1)' : 'transparent', border: 'none', color: l.code === lang ? '#FF6A00' : '#999', fontSize: 13, fontWeight: l.code === lang ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', textAlign: isRtl ? 'right' : 'left' }}>
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isAuthed ? (
            <a href="/dashboard" style={{ padding: '8px 18px', borderRadius: 8, background: 'linear-gradient(135deg, #FF6A00, #CC5500)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>لوحة التحكم</a>
          ) : (
            <a href="/login" style={{ padding: '8px 18px', borderRadius: 8, background: '#FAFAFA', color: '#0A0A0F', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>دخول</a>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        padding: '120px 24px 60px', textAlign: 'center', maxWidth: 800, margin: '0 auto',
        animation: loaded ? 'fadeUp 0.7s 0.1s ease both' : 'none',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 99, marginBottom: 20, background: 'rgba(255,106,0,0.08)', border: '1px solid rgba(255,106,0,0.2)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF6A00', boxShadow: '0 0 8px #FF6A00', animation: 'shimmer 2s ease infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#FF9A55', letterSpacing: '.04em' }}>{t(lang, 'landing.tagline')}</span>
        </div>

        <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 900, lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.03em' }}>
          <span style={{ background: 'linear-gradient(135deg, #FFFFFF, #E8E4DC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block' }}>
            {t(lang, 'landing.hero.title1')}
          </span>
          <span style={{ color: '#00D2B3', display: 'block' }}>{t(lang, 'landing.hero.title2')}</span>
        </h1>

        <p style={{ fontSize: 'clamp(13px, 2vw, 16px)', color: 'rgba(255,255,255,0.4)', maxWidth: 460, margin: '0 auto 0', lineHeight: 1.7 }}>
          {t(lang, lang === 'ar' ? 'landing.customer.desc' : 'landing.merchant.desc')}
        </p>
      </section>

      {/* ── WHO IS THIS FOR ── */}
      <section style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px 20px' }}>
        <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          مناسب لك إذا كنت
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { icon: '🛍️', label: 'تبيع منتجات' }, { icon: '🔧', label: 'تبيع خدمات' },
            { icon: '📱', label: 'تبيع رقمياً' }, { icon: '🏪', label: 'صاحب متجر' },
            { icon: '👗', label: 'بوتيك أزياء' }, { icon: '⚡', label: 'كهربائي / سباك' },
            { icon: '🎨', label: 'مصمم / مبرمج' }, { icon: '📦', label: 'تاجر جملة' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600,
            }}>
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── CARDS ── */}
      <section style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px 48px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* CUSTOMER */}
        <a href={storeUrl || '/auth'} className="hover-lift" style={{
          display: 'flex', flexDirection: 'column', padding: '32px 28px', textDecoration: 'none',
          background: 'rgba(0,210,179,0.04)', border: '1px solid rgba(0,210,179,0.15)',
          borderRadius: 24, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,210,179,0.1), transparent 70%)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, position: 'relative' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(0,210,179,0.1)', border: '1px solid rgba(0,210,179,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🛍️</div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: '#FAFAFA', margin: 0 }}>{t(lang, 'landing.customer.title')}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00D2B3' }} />
                <span style={{ fontSize: 11, color: '#00D2B3', fontWeight: 600 }}>{t(lang, 'landing.customer.f2')}</span>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 20, flex: 1 }}>{t(lang, 'landing.customer.desc')}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {(['landing.customer.f1', 'landing.customer.f2', 'landing.customer.f3'] as const).map(k => (
              <span key={k} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, background: 'rgba(0,210,179,0.08)', border: '1px solid rgba(0,210,179,0.15)', color: '#00D2B3', fontWeight: 600 }}>{t(lang, k)}</span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: 14, background: 'rgba(0,210,179,0.12)', border: '1px solid rgba(0,210,179,0.2)', fontSize: 13, fontWeight: 700, color: '#00D2B3', gap: 8 }}>
            {t(lang, 'landing.customer.cta')} <span>→</span>
          </div>
        </a>

        {/* MERCHANT */}
        <a href={isAuthed ? '/dashboard' : '/login'} className="hover-lift" style={{
          display: 'flex', flexDirection: 'column', padding: '32px 28px', textDecoration: 'none',
          background: 'rgba(255,106,0,0.04)', border: '1px solid rgba(255,106,0,0.15)',
          borderRadius: 24, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, left: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,106,0,0.1), transparent 70%)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, position: 'relative' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,106,0,0.1)', border: '1px solid rgba(255,106,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏪</div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: '#FAFAFA', margin: 0 }}>{t(lang, 'landing.merchant.title')}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF6A00', boxShadow: '0 0 6px rgba(255,106,0,0.6)', animation: 'shimmer 2s ease infinite' }} />
                <span style={{ fontSize: 11, color: '#FF9A55', fontWeight: 600 }}>{t(lang, 'landing.feature.ai')}</span>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 20, flex: 1 }}>{t(lang, 'landing.merchant.desc')}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {(['landing.merchant.f1', 'landing.merchant.f2', 'landing.merchant.f3'] as const).map(k => (
              <span key={k} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, background: 'rgba(255,106,0,0.08)', border: '1px solid rgba(255,106,0,0.15)', color: '#FF9A55', fontWeight: 600 }}>{t(lang, k)}</span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: 14, background: 'rgba(255,106,0,0.15)', border: '1px solid rgba(255,106,0,0.25)', fontSize: 13, fontWeight: 700, color: '#FF6A00', gap: 8 }}>
            {isAuthed ? t(lang, 'landing.merchant.ctaExisting') : t(lang, 'landing.merchant.ctaNew')} <span>→</span>
          </div>
          <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); localStorage.setItem('ai_commerce_token', 'demo-token-local'); window.location.href = '/dashboard'; }}
            style={{ marginTop: 10, width: '100%', padding: '10px', borderRadius: 12, background: 'rgba(255,106,0,0.05)', border: '1px solid rgba(255,106,0,0.12)', color: '#FF9A55', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {t(lang, 'landing.demo')}
          </button>
        </a>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px 48px' }}>
        <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>
          كيف يعمل؟
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {([
            { num: '01', key: 'landing.how.step1', color: '#FF6A00' },
            { num: '02', key: 'landing.how.step2', color: '#00D2B3' },
            { num: '03', key: 'landing.how.step3', color: '#FF8533' },
          ] as const).map(s => (
            <div key={s.num} style={{ padding: '18px 12px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color, marginBottom: 6, letterSpacing: '-0.03em' }}>{s.num}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, lineHeight: 1.5 }}>{t(lang, s.key)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px 48px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
        {FEATURES.map(f => { const FIcon = f.Icon;
          return (
            <div key={f.key} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 99,
              background: 'rgba(255,255,255,0.03)', border: `1px solid ${f.color}20`,
              color: f.color, fontSize: 12, fontWeight: 700, backdropFilter: 'blur(8px)',
              transition: 'transform 0.2s',
            }}>
              <FIcon size={14} /> {t(lang, f.key)}
            </div>
          );
        })}
      </section>

      {/* ── PRICING ── */}
      <section style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#FF6A00', background: 'rgba(255,106,0,0.08)', border: '1px solid rgba(255,106,0,0.15)', borderRadius: 99, padding: '4px 14px', letterSpacing: '.06em', textTransform: 'uppercase' }}>{t(lang, 'pricing.badge')}</span>
        </div>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: 900, color: '#FAFAFA', marginBottom: 6 }}>{t(lang, 'pricing.title')}</h2>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 28 }}>{t(lang, 'pricing.sub')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {/* Free */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#00C896', marginBottom: 4 }}>{t(lang, 'pricing.free.name')}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FAFAFA' }}>{t(lang, 'pricing.free.price')}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{t(lang, 'pricing.free.desc')}</div>
            </div>
            {(['pricing.free.f1', 'pricing.free.f2', 'pricing.free.f3'] as const).map(k => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                <Check size={12} color="#00C896" /> {t(lang, k)}
              </div>
            ))}
            <a href="/login" style={{ marginTop: 'auto', display: 'block', textAlign: 'center', padding: '10px', borderRadius: 12, background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)', color: '#00C896', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>{t(lang, 'pricing.free.cta')}</a>
          </div>
          {/* Pro */}
          <div style={{ background: 'linear-gradient(135deg, rgba(255,106,0,0.06), rgba(255,106,0,0.02))', border: '1px solid rgba(255,106,0,0.2)', borderRadius: 20, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 14, left: isRtl ? 'auto' : 14, right: isRtl ? 14 : 'auto' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: '#FF6A00', borderRadius: 99, padding: '3px 10px' }}>⭐ Pro</span>
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#FF6A00', marginBottom: 4 }}>{t(lang, 'pricing.pro.name')}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FAFAFA' }}>{t(lang, 'pricing.pro.price')}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{t(lang, 'pricing.pro.desc')}</div>
            </div>
            {(['pricing.pro.f1', 'pricing.pro.f2', 'pricing.pro.f3'] as const).map(k => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                <Check size={12} color="#FF6A00" /> {t(lang, k)}
              </div>
            ))}
            <a href="/login" style={{ marginTop: 'auto', display: 'block', textAlign: 'center', padding: '10px', borderRadius: 12, background: 'rgba(255,106,0,0.12)', border: '1px solid rgba(255,106,0,0.3)', color: '#FF6A00', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>{t(lang, 'pricing.pro.cta')}</a>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <button onClick={() => { localStorage.setItem('ai_commerce_token', 'demo-token-local'); window.location.href = '/dashboard'; }}
            style={{ padding: '11px 28px', borderRadius: 13, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {t(lang, 'pricing.demo.cta')}
          </button>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px 48px' }}>
        <h3 style={{ textAlign: 'center', fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>ماذا يقول التجار؟</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ padding: '20px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={11} fill="#F59E0B" color="#F59E0B" />)}
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 12 }}>"{t.text}"</p>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{t.name}</div>
                <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{t.city}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '28px 24px 36px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <a href="https://wa.me/212612265893" target="_blank" rel="noreferrer" style={{ color: '#25D366', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>💬 +212612265893</a>
          <span style={{ color: 'rgba(255,255,255,0.06)' }}>·</span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>📍 Casablanca, Maroc</span>
          <span style={{ color: 'rgba(255,255,255,0.06)' }}>·</span>
          <span style={{ color: '#C9954C', fontSize: 12, fontWeight: 600 }}>AI Commerce OS © 2026</span>
        </div>
      </footer>
    </div>
  );
}