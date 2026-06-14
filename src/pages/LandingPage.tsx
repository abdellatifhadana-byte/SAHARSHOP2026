import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { t, type Lang } from '../i18n/translations';
import { Bot, MessageCircle, Truck, BarChart3, ShieldCheck, Sparkles, Check, Star, ChevronDown, X } from 'lucide-react';

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

const PILLARS = [
  { icon: '🛍️', k: 'products', color: '#FF6A00' },
  { icon: '🛠️', k: 'services', color: '#00D2B3' },
  { icon: '📅', k: 'booking',  color: '#a78bfa' },
  { icon: '🚚', k: 'delivery', color: '#60a5fa' },
] as const;

const WHO_FOR = [
  { icon: '🛍️', label: 'تبيع منتجات' }, { icon: '🔧', label: 'تبيع خدمات' },
  { icon: '📱', label: 'تبيع رقمياً' }, { icon: '🏪', label: 'صاحب متجر' },
  { icon: '👗', label: 'بوتيك أزياء' }, { icon: '⚡', label: 'كهربائي / سباك' },
  { icon: '🎨', label: 'مصمم / مبرمج' }, { icon: '📦', label: 'تاجر جملة' },
];

export default function LandingPage() {
  const { token, user, settings, updateSettings } = useStore();
  const [lang, setLang] = useState<Lang>(() => ((settings.brand as any)?.language || 'ar') as Lang);
  const [loaded, setLoaded] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const userId = user?.id || (() => { try { const u = localStorage.getItem('ai_commerce_user'); return u ? JSON.parse(u)?.id : null; } catch { return null; } })();
  const storeUrl = userId ? `/store/${userId}` : null;
  const isAuthed = !!token || token === 'demo-token-local';
  const isRtl = lang === 'ar' || lang === 'darija';

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 60); return () => clearTimeout(t); }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLangMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // قفل تمرير الصفحة عند فتح النافذة المنبثقة فقط
  useEffect(() => {
    if (showDetails) { document.body.style.overflow = 'hidden'; }
    return () => { document.body.style.overflow = ''; };
  }, [showDetails]);

  const switchLang = (code: Lang) => { setLang(code); setShowLangMenu(false); updateSettings('brand', { ...(settings.brand as any), language: code }); };
  const curLang = LANGS.find(l => l.code === lang) || LANGS[0];
  const startDemo = () => { try { localStorage.setItem('ai_commerce_token', 'demo-token-local'); } catch {} window.location.href = '/dashboard'; };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{
      height: '100dvh', overflow: 'hidden', background: '#0A0A0F', color: '#FAFAFA',
      fontFamily: 'Tajawal, system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      backgroundImage: `
        radial-gradient(ellipse 80% 60% at 20% 25%, rgba(124,58,237,0.07) 0%, transparent 50%),
        radial-gradient(ellipse 60% 70% at 80% 15%, rgba(255,106,0,0.06) 0%, transparent 45%),
        radial-gradient(ellipse 60% 50% at 50% 95%, rgba(0,210,179,0.05) 0%, transparent 50%)
      `,
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:1} }
        .hover-lift { transition: transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s ease, border-color .3s ease; }
        .hover-lift:hover { transform: translateY(-3px); box-shadow: 0 18px 50px rgba(0,0,0,.45); }
        .lp-scroll::-webkit-scrollbar { width: 6px; } .lp-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 3px; }
      `}</style>

      {/* ── TOP BAR ── */}
      <header style={{
        flexShrink: 0, height: 54, padding: '0 clamp(14px,3vw,28px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        animation: loaded ? 'fadeIn .5s ease both' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,106,0,0.1)', border: '1.5px solid rgba(255,106,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px rgba(255,106,0,0.2)' }}>
            <img src="/sahar-logo-text.png" alt="S" style={{ width: '80%', height: '80%', objectFit: 'contain' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; (e.currentTarget.parentElement as HTMLElement).innerHTML='<span style="font-size:15px;font-weight:900;color:#FF6A00">S</span>'; }} />
          </div>
          <span style={{ fontWeight: 900, fontSize: 15, letterSpacing: '-0.02em' }}><span style={{ color: '#FF6A00' }}>SAHAR</span> shop</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div ref={langRef} style={{ position: 'relative' }}>
            <button onClick={() => setShowLangMenu(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#FAFAFA', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {curLang.flag} <span style={{ display: window.innerWidth < 380 ? 'none' : 'inline' }}>{curLang.label}</span>
              <ChevronDown size={10} style={{ transform: showLangMenu ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>
            {showLangMenu && (
              <div style={{ position: 'absolute', top: '120%', [isRtl ? 'right' : 'left']: 0, minWidth: 150, background: '#1A1A25', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', zIndex: 100 } as any}>
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
            <a href="/dashboard" style={{ padding: '7px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #FF6A00, #CC5500)', color: '#fff', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>لوحة التحكم</a>
          ) : (
            <a href="/login" style={{ padding: '7px 16px', borderRadius: 8, background: '#FAFAFA', color: '#0A0A0F', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>دخول</a>
          )}
        </div>
      </header>

      {/* ── ONE-VIEWPORT HERO (no scroll) ── */}
      <main style={{
        flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 'clamp(12px, 2.2vh, 22px)', padding: 'clamp(12px,2.5vh,26px) clamp(16px,4vw,24px)',
        textAlign: 'center', overflow: 'hidden',
        animation: loaded ? 'fadeUp .6s .05s ease both' : 'none',
      }}>
        {/* Tagline */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 13px', borderRadius: 99, background: 'rgba(255,106,0,0.08)', border: '1px solid rgba(255,106,0,0.2)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6A00', boxShadow: '0 0 8px #FF6A00', animation: 'shimmer 2s ease infinite' }} />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#FF9A55', letterSpacing: '.03em' }}>{t(lang, 'landing.tagline')}</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 46px)', fontWeight: 900, lineHeight: 1.12, margin: 0, letterSpacing: '-0.03em' }}>
          <span style={{ background: 'linear-gradient(135deg, #FFFFFF, #E8E4DC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block' }}>{t(lang, 'landing.hero.title1')}</span>
          <span style={{ color: '#00D2B3', display: 'block' }}>{t(lang, 'landing.hero.title2')}</span>
        </h1>

        {/* Subtitle */}
        <p style={{ fontSize: 'clamp(12px, 1.6vw, 15px)', color: 'rgba(255,255,255,0.45)', maxWidth: 540, margin: 0, lineHeight: 1.6 }}>{t(lang, 'landing.hero.sub')}</p>

        {/* Pillars row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          {PILLARS.map(p => (
            <div key={p.k} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 99, background: `${p.color}10`, border: `1px solid ${p.color}2e` }}>
              <span style={{ fontSize: 15 }}>{p.icon}</span>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: p.color }}>{t(lang, `landing.pillar.${p.k}`)}</span>
            </div>
          ))}
        </div>

        {/* Two entry cards */}
        <div style={{ width: '100%', maxWidth: 720, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,280px), 1fr))', gap: 'clamp(10px,1.5vw,16px)' }}>
          {/* CUSTOMER */}
          <a href={storeUrl || '/auth'} className="hover-lift" style={{
            display: 'flex', flexDirection: 'column', gap: 10, padding: 'clamp(16px,2vw,22px)', textDecoration: 'none',
            background: 'rgba(0,210,179,0.05)', border: '1px solid rgba(0,210,179,0.18)', borderRadius: 20, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, insetInlineEnd: -40, width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,210,179,0.1), transparent 70%)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(0,210,179,0.1)', border: '1px solid rgba(0,210,179,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, flexShrink: 0 }}>🛍️</div>
              <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>{t(lang, 'landing.customer.title')}</h2>
                <span style={{ fontSize: 11, color: '#00D2B3', fontWeight: 600 }}>{t(lang, 'landing.customer.f2')}</span>
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.42)', lineHeight: 1.6, margin: 0, textAlign: isRtl ? 'right' : 'left' }}>{t(lang, 'landing.customer.desc')}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: 12, background: 'rgba(0,210,179,0.12)', border: '1px solid rgba(0,210,179,0.22)', fontSize: 13, fontWeight: 700, color: '#00D2B3', gap: 8 }}>
              {t(lang, 'landing.customer.cta')} <span>←</span>
            </div>
          </a>

          {/* MERCHANT */}
          <a href={isAuthed ? '/dashboard' : '/login'} className="hover-lift" style={{
            display: 'flex', flexDirection: 'column', gap: 10, padding: 'clamp(16px,2vw,22px)', textDecoration: 'none',
            background: 'rgba(255,106,0,0.05)', border: '1px solid rgba(255,106,0,0.18)', borderRadius: 20, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, insetInlineStart: -40, width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,106,0,0.1), transparent 70%)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,106,0,0.1)', border: '1px solid rgba(255,106,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, flexShrink: 0 }}>🏪</div>
              <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>{t(lang, 'landing.merchant.title')}</h2>
                <span style={{ fontSize: 11, color: '#FF9A55', fontWeight: 600 }}>{t(lang, 'landing.feature.ai')}</span>
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.42)', lineHeight: 1.6, margin: 0, textAlign: isRtl ? 'right' : 'left' }}>{t(lang, 'landing.merchant.desc')}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: 12, background: 'rgba(255,106,0,0.15)', border: '1px solid rgba(255,106,0,0.25)', fontSize: 13, fontWeight: 700, color: '#FF6A00', gap: 8 }}>
              {isAuthed ? t(lang, 'landing.merchant.ctaExisting') : t(lang, 'landing.merchant.ctaNew')} <span>←</span>
            </div>
          </a>
        </div>

        {/* Actions: demo + details */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <button onClick={startDemo} style={{ padding: '9px 20px', borderRadius: 11, background: 'rgba(255,106,0,0.06)', border: '1px solid rgba(255,106,0,0.15)', color: '#FF9A55', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {t(lang, 'landing.demo')}
          </button>
          <button onClick={() => setShowDetails(true)} style={{ padding: '9px 20px', borderRadius: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            الأسعار والتفاصيل <ChevronDown size={12} />
          </button>
        </div>
      </main>

      {/* ── FOOTER (compact) ── */}
      <footer style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '10px 16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 11.5 }}>
          <a href="https://wa.me/212612265893" target="_blank" rel="noreferrer" style={{ color: '#25D366', fontWeight: 700, textDecoration: 'none' }}>💬 +212612265893</a>
          <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>📍 Casablanca, Maroc</span>
          <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
          <span style={{ color: '#C9954C', fontWeight: 600 }}>AI Commerce OS © 2026</span>
        </div>
      </footer>

      {/* ── DETAILS MODAL: الأسعار + المزايا + مناسب لك + الشهادات (محفوظة كاملة) ── */}
      {showDetails && (
        <div onClick={() => setShowDetails(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(12px,4vw,24px)' }}>
          <div onClick={e => e.stopPropagation()} className="lp-scroll" dir={isRtl ? 'rtl' : 'ltr'} style={{ width: '100%', maxWidth: 760, maxHeight: '88dvh', overflowY: 'auto', background: '#12121A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, padding: 'clamp(18px,3vw,28px)', position: 'relative' }}>
            <button onClick={() => setShowDetails(false)} style={{ position: 'absolute', top: 14, insetInlineEnd: 14, width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#FAFAFA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <X size={18} />
            </button>

            {/* PRICING */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#FF6A00', background: 'rgba(255,106,0,0.08)', border: '1px solid rgba(255,106,0,0.15)', borderRadius: 99, padding: '4px 14px', letterSpacing: '.05em', textTransform: 'uppercase' }}>{t(lang, 'pricing.badge')}</span>
            </div>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(18px,3vw,22px)', fontWeight: 900, marginBottom: 4 }}>{t(lang, 'pricing.title')}</h2>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>{t(lang, 'pricing.sub')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,230px), 1fr))', gap: 14, marginBottom: 26 }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '22px 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#00C896' }}>{t(lang, 'pricing.free.name')}</div>
                <div style={{ fontSize: 25, fontWeight: 900 }}>{t(lang, 'pricing.free.price')}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{t(lang, 'pricing.free.desc')}</div>
                {(['pricing.free.f1', 'pricing.free.f2', 'pricing.free.f3'] as const).map(k => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}><Check size={12} color="#00C896" /> {t(lang, k)}</div>
                ))}
                <a href="/login" style={{ marginTop: 'auto', textAlign: 'center', padding: '10px', borderRadius: 12, background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)', color: '#00C896', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>{t(lang, 'pricing.free.cta')}</a>
              </div>
              <div style={{ background: 'linear-gradient(135deg, rgba(255,106,0,0.06), rgba(255,106,0,0.02))', border: '1px solid rgba(255,106,0,0.2)', borderRadius: 18, padding: '22px 18px', display: 'flex', flexDirection: 'column', gap: 9, position: 'relative' }}>
                <span style={{ position: 'absolute', top: 12, insetInlineStart: 14, fontSize: 10, fontWeight: 800, color: '#fff', background: '#FF6A00', borderRadius: 99, padding: '3px 10px' } as any}>⭐ Pro</span>
                <div style={{ marginTop: 18, fontSize: 12, fontWeight: 800, color: '#FF6A00' }}>{t(lang, 'pricing.pro.name')}</div>
                <div style={{ fontSize: 25, fontWeight: 900 }}>{t(lang, 'pricing.pro.price')}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{t(lang, 'pricing.pro.desc')}</div>
                {(['pricing.pro.f1', 'pricing.pro.f2', 'pricing.pro.f3'] as const).map(k => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}><Check size={12} color="#FF6A00" /> {t(lang, k)}</div>
                ))}
                <a href="/login" style={{ marginTop: 'auto', textAlign: 'center', padding: '10px', borderRadius: 12, background: 'rgba(255,106,0,0.12)', border: '1px solid rgba(255,106,0,0.3)', color: '#FF6A00', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>{t(lang, 'pricing.pro.cta')}</a>
              </div>
            </div>

            {/* FEATURES */}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 26 }}>
              {FEATURES.map(f => { const FIcon = f.Icon; return (
                <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.03)', border: `1px solid ${f.color}20`, color: f.color, fontSize: 12, fontWeight: 700 }}>
                  <FIcon size={14} /> {t(lang, f.key)}
                </div>
              ); })}
            </div>

            {/* WHO IS THIS FOR */}
            <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>مناسب لك إذا كنت</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 26 }}>
              {WHO_FOR.map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 99, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }}>
                  <span>{item.icon}</span> {item.label}
                </div>
              ))}
            </div>

            {/* TESTIMONIALS */}
            <h3 style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>ماذا يقول التجار؟</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,210px), 1fr))', gap: 12 }}>
              {TESTIMONIALS.map(tm => (
                <div key={tm.name} style={{ padding: '18px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 9 }}>{[1,2,3,4,5].map(i => <Star key={i} size={11} fill="#F59E0B" color="#F59E0B" />)}</div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 10 }}>"{tm.text}"</p>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{tm.name}</div>
                  <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{tm.city}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
