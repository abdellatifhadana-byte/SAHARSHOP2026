import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { t, type Lang } from '../i18n/translations';
import { Bot, MessageCircle, Truck, BarChart3, ShieldCheck, Sparkles } from 'lucide-react';

const LANGS: { code: Lang; flag: string; label: string }[] = [
  { code: 'ar',     flag: '🇸🇦', label: 'العربية'   },
  { code: 'darija', flag: '🇲🇦', label: 'الدارجة'   },
  { code: 'fr',     flag: '🇫🇷', label: 'Français'  },
  { code: 'en',     flag: '🇬🇧', label: 'English'   },
];

const FEATURES = [
  { Icon: Bot,           key: 'landing.feature.ai',       color: '#FF6A00' },
  { Icon: MessageCircle, key: 'landing.feature.whatsapp',  color: '#25D366' },
  { Icon: Truck,         key: 'landing.feature.delivery',  color: '#00D2B3' },
  { Icon: BarChart3,     key: 'landing.feature.analytics', color: '#FF8533' },
  { Icon: ShieldCheck,   key: 'landing.feature.secure',    color: '#a78bfa' },
  { Icon: Sparkles,      key: 'landing.feature.banner',    color: '#60a5fa' },
];

export default function LandingPage() {
  const { token, user, settings, updateSettings } = useStore();
  const [lang, setLang] = useState<Lang>(() => ((settings.brand as any)?.language || 'ar') as Lang);
  const [loaded, setLoaded] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [hovered, setHovered] = useState<'customer' | 'merchant' | null>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const userId = user?.id || (() => {
    try { const u = localStorage.getItem('ai_commerce_user'); return u ? JSON.parse(u)?.id : null; } catch { return null; }
  })();
  const storeUrl = userId ? `/store/${userId}` : null;
  const isAuthed = !!token || token === 'demo-token-local';
  const isRtl = lang === 'ar' || lang === 'darija';

  useEffect(() => { setTimeout(() => setLoaded(true), 60); }, []);

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
      minHeight: '100dvh', position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(ellipse 120% 80% at 50% -20%, #0D1B2A 0%, #07080D 60%)',
      fontFamily: 'inherit',
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:1} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .land-card-customer { transition: transform .25s ease, box-shadow .25s ease; }
        .land-card-customer:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 32px 80px rgba(0,210,179,.2), 0 0 0 1px rgba(0,210,179,.35) !important; }
        .land-card-merchant { transition: transform .25s ease, box-shadow .25s ease; }
        .land-card-merchant:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 32px 80px rgba(255,106,0,.2), 0 0 0 1px rgba(255,106,0,.35) !important; }
        .feature-chip { transition: transform .2s, background .2s; }
        .feature-chip:hover { transform: translateY(-2px); }
        .lang-option { transition: background .15s; }
        .lang-option:hover { background: rgba(255,255,255,.08) !important; }
      `}</style>

      {/* Grid pattern */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        backgroundImage: 'linear-gradient(rgba(255,255,255,.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.01) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
      }} />

      {/* ── TOP BAR ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '32px 28px 0',
        animation: loaded ? 'fadeUp .6s ease both' : 'none',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11, overflow: 'hidden',
            background: 'rgba(255,106,0,.1)', border: '1.5px solid rgba(255,106,0,.3)',
            boxShadow: '0 0 20px rgba(255,106,0,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src="/sahar-logo-text.png" alt="S" style={{ width: '82%', height: '82%', objectFit: 'contain' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).innerHTML = '<span style="font-size:16px;font-weight:900;color:#FF6A00">S</span>'; }} />
          </div>
          <span style={{ fontWeight: 900, fontSize: 15, color: '#E8E4DC', letterSpacing: '-0.02em' }}>
            <span style={{ color: '#FF6A00' }}>SAHAR</span> shop
          </span>
        </div>

        {/* Language switcher */}
        <div ref={langRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowLangMenu(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 13px', borderRadius: 99,
              background: 'rgba(255,255,255,.07)',
              border: '1px solid rgba(255,255,255,.12)',
              color: '#E8E4DC', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', backdropFilter: 'blur(12px)',
              transition: 'background .15s',
              fontFamily: 'inherit',
            }}
          >
            <span style={{ fontSize: 16 }}>{curLang.flag}</span>
            <span>{curLang.label}</span>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ opacity: .6, transform: showLangMenu ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="M2 4l4 4 4-4" /></svg>
          </button>

          {showLangMenu && (
            <div style={{
              position: 'absolute',
              top: '110%',
              ...(isRtl ? { right: 0 } : { left: 0 }),
              minWidth: 150,
              background: '#111827',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 16px 48px rgba(0,0,0,.5)',
              zIndex: 100,
            }}>
              {LANGS.map(l => (
                <button key={l.code}
                  className="lang-option"
                  onClick={() => switchLang(l.code)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', background: l.code === lang ? 'rgba(255,106,0,.12)' : 'transparent',
                    border: 'none', color: l.code === lang ? '#FF6A00' : '#B8B0A4',
                    fontSize: 13, fontWeight: l.code === lang ? 800 : 500,
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: isRtl ? 'right' : 'left',
                  }}>
                  <span style={{ fontSize: 18 }}>{l.flag}</span>
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── HERO ── */}
      <div style={{
        position: 'relative', zIndex: 5,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: 'clamp(32px,6vh,64px) 24px clamp(24px,4vh,48px)',
        textAlign: 'center',
        animation: loaded ? 'fadeUp .7s .1s ease both' : 'none',
        opacity: 0,
        ...(loaded ? { animation: 'fadeUp .7s .1s ease both', animationFillMode: 'both' } : {}),
      }}>
        {/* Tagline chip */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 99, marginBottom: 18,
          background: 'rgba(255,106,0,.1)', border: '1px solid rgba(255,106,0,.25)',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF6A00', boxShadow: '0 0 8px #FF6A00', display: 'inline-block', animation: 'shimmer 2s ease infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#FF9A55', letterSpacing: '.04em' }}>
            {t(lang, 'landing.tagline')}
          </span>
        </div>

        {/* Main headline */}
        <h1 style={{
          fontSize: 'clamp(28px,6vw,56px)', fontWeight: 900,
          lineHeight: 1.2, marginBottom: 14,
          letterSpacing: '-0.03em',
          maxWidth: 700,
        }}>
          <span style={{ background: 'linear-gradient(135deg,#FFFFFF 0%,#E8E4DC 40%,#C9954C 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block' }}>
            {t(lang, 'landing.hero.title1')}
          </span>
          <span style={{ color: '#00D2B3', display: 'block' }}>
            {t(lang, 'landing.hero.title2')}
          </span>
        </h1>

        {/* Sub description */}
        <p style={{
          fontSize: 'clamp(13px,2vw,16px)', color: 'rgba(255,255,255,.45)',
          maxWidth: 460, lineHeight: 1.7, marginBottom: 0,
        }}>
          {t(lang, lang === 'ar' ? 'landing.customer.desc' : 'landing.merchant.desc')}
        </p>
      </div>

      {/* ── CARDS ── */}
      <div style={{
        position: 'relative', zIndex: 5,
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16, padding: '0 clamp(16px,4vw,48px)',
        maxWidth: 780, margin: '0 auto',
        animation: loaded ? 'fadeUp .7s .2s ease both' : 'none',
        animationFillMode: 'both',
      }}>

        {/* CUSTOMER CARD */}
        <a
          href={storeUrl || '#'}
          onClick={e => { if (!storeUrl) { e.preventDefault(); alert(t(lang, 'landing.customer.noLink') || 'اطلب من التاجر رابط متجره'); } }}
          className="land-card-customer"
          style={{
            display: 'flex', flexDirection: 'column',
            padding: 'clamp(22px,4vw,36px)',
            borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(0,210,179,.06) 0%, rgba(0,210,179,.02) 100%)',
            border: '1px solid rgba(0,210,179,.18)',
            boxShadow: '0 16px 48px rgba(0,210,179,.06)',
            textDecoration: 'none',
            backdropFilter: 'blur(16px)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Glow accent */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,210,179,.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, flexShrink: 0,
              background: 'rgba(0,210,179,.12)', border: '1.5px solid rgba(0,210,179,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>🛍️</div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: '#E8E4DC', margin: 0 }}>
                {t(lang, 'landing.customer.title')}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00D2B3', display: 'inline-block' }} />
                <span style={{ fontSize: 11, color: '#00D2B3', fontWeight: 600 }}>
                  {t(lang, 'landing.customer.f2')}
                </span>
              </div>
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', lineHeight: 1.7, marginBottom: 20, flex: 1 }}>
            {t(lang, 'landing.customer.desc')}
          </p>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
            {(['landing.customer.f1', 'landing.customer.f2', 'landing.customer.f3'] as const).map(k => (
              <span key={k} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, background: 'rgba(0,210,179,.1)', border: '1px solid rgba(0,210,179,.2)', color: '#00D2B3', fontWeight: 600 }}>
                {t(lang, k)}
              </span>
            ))}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '12px', borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(0,210,179,.18), rgba(0,210,179,.08))',
            border: '1px solid rgba(0,210,179,.25)',
            fontSize: 13, fontWeight: 800, color: '#00D2B3', gap: 8,
          }}>
            {t(lang, 'landing.customer.cta')} <span style={{ fontSize: 16 }}>→</span>
          </div>
        </a>

        {/* MERCHANT CARD */}
        <a
          href={isAuthed ? '/dashboard' : '/login'}
          className="land-card-merchant"
          style={{
            display: 'flex', flexDirection: 'column',
            padding: 'clamp(22px,4vw,36px)',
            borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(255,106,0,.07) 0%, rgba(255,106,0,.02) 100%)',
            border: '1px solid rgba(255,106,0,.2)',
            boxShadow: '0 16px 48px rgba(255,106,0,.07)',
            textDecoration: 'none',
            backdropFilter: 'blur(16px)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Glow accent */}
          <div style={{ position: 'absolute', top: -40, left: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,106,0,.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, flexShrink: 0,
              background: 'rgba(255,106,0,.12)', border: '1.5px solid rgba(255,106,0,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>🏪</div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: '#E8E4DC', margin: 0 }}>
                {t(lang, 'landing.merchant.title')}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF6A00', boxShadow: '0 0 6px rgba(255,106,0,.6)', display: 'inline-block', animation: 'shimmer 2s ease infinite' }} />
                <span style={{ fontSize: 11, color: '#FF9A55', fontWeight: 600 }}>
                  {t(lang, 'landing.feature.ai')}
                </span>
              </div>
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', lineHeight: 1.7, marginBottom: 20, flex: 1 }}>
            {t(lang, 'landing.merchant.desc')}
          </p>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
            {(['landing.merchant.f1', 'landing.merchant.f2', 'landing.merchant.f3'] as const).map(k => (
              <span key={k} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, background: 'rgba(255,106,0,.1)', border: '1px solid rgba(255,106,0,.2)', color: '#FF9A55', fontWeight: 600 }}>
                {t(lang, k)}
              </span>
            ))}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '12px', borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(255,106,0,.22), rgba(255,106,0,.1))',
            border: '1px solid rgba(255,106,0,.3)',
            fontSize: 13, fontWeight: 800, color: '#FF6A00', gap: 8,
          }}>
            {isAuthed ? t(lang, 'landing.merchant.ctaExisting') : t(lang, 'landing.merchant.ctaNew')}
            <span style={{ fontSize: 16 }}>→</span>
          </div>
        </a>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{
        position: 'relative', zIndex: 5,
        maxWidth: 780, margin: '0 auto',
        padding: '12px clamp(16px,4vw,48px) 0',
        animationFillMode: 'both',
        ...(loaded ? { animation: 'fadeUp .7s .3s ease both' } : {}),
      }}>
        <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          كيف يعمل؟
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {([
            { num: '01', key: 'landing.how.step1', color: '#FF6A00' },
            { num: '02', key: 'landing.how.step2', color: '#00D2B3' },
            { num: '03', key: 'landing.how.step3', color: '#FF8533' },
          ] as const).map(s => (
            <div key={s.num} style={{
              padding: '14px 10px', borderRadius: 14,
              background: 'rgba(255,255,255,.03)',
              border: '1px solid rgba(255,255,255,.07)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: s.color, marginBottom: 5, letterSpacing: '-0.03em' }}>{s.num}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 600, lineHeight: 1.5 }}>{t(lang, s.key)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={{
        position: 'relative', zIndex: 5,
        display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
        gap: 8, padding: 'clamp(20px,3vh,36px) clamp(16px,4vw,48px)',
        maxWidth: 700, margin: '0 auto',
        animation: loaded ? 'fadeUp .7s .35s ease both' : 'none',
        animationFillMode: 'both',
      }}>
        {FEATURES.map(f => {
          const FIcon = f.Icon;
          return (
            <div key={f.key} className="feature-chip" style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 14px', borderRadius: 99,
              background: 'rgba(255,255,255,.04)',
              border: `1px solid ${f.color}28`,
              color: f.color, fontSize: 12, fontWeight: 700,
              backdropFilter: 'blur(8px)',
            }}>
              <FIcon size={14} />
              {t(lang, f.key)}
            </div>
          );
        })}
      </div>

      {/* ── STATS ── */}
      <div style={{
        position: 'relative', zIndex: 5,
        display: 'flex', justifyContent: 'center', gap: 'clamp(16px,4vw,48px)',
        padding: '0 24px clamp(24px,4vh,48px)',
        animation: loaded ? 'fadeUp .7s .45s ease both' : 'none',
        animationFillMode: 'both',
        flexWrap: 'wrap',
      }}>
        {[
          { num: '500+', key: 'landing.stats.merchants', color: '#FF6A00' },
          { num: '10K+', key: 'landing.stats.products',  color: '#00D2B3' },
          { num: '1K+',  key: 'landing.stats.orders',    color: '#F6C453' },
        ].map(s => (
          <div key={s.key} style={{ textAlign: 'center', padding: '0 8px' }}>
            <div style={{ fontSize: 'clamp(22px,5vw,36px)', fontWeight: 900, color: s.color, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {s.num}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', fontWeight: 600, marginTop: 3 }}>
              {t(lang, s.key)}
            </div>
          </div>
        ))}
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        position: 'relative', zIndex: 5,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: 'clamp(12px,3vw,24px)', flexWrap: 'wrap',
        padding: 'clamp(12px,2vh,20px) 24px clamp(20px,3vh,36px)',
        borderTop: '1px solid rgba(255,255,255,.04)',
      }}>
        <a href="https://wa.me/212612265893" target="_blank" rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#25D366', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>
          💬 +212612265893
        </a>
        <span style={{ color: 'rgba(255,255,255,.08)' }}>·</span>
        <span style={{ color: 'rgba(255,255,255,.25)', fontSize: 12 }}>📍 Casablanca, Maroc</span>
        <span style={{ color: 'rgba(255,255,255,.08)' }}>·</span>
        <span style={{ color: '#C9954C', fontSize: 12, fontWeight: 600 }}>AI commerce OS © 2026</span>
      </div>
    </div>
  );
}
