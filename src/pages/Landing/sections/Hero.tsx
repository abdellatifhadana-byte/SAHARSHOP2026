// Hero.tsx - Version avec vidéo intégrée
import { Zap, Check, ChevronDown, Bot, Shield, Headphones } from 'lucide-react';
import { t } from '../../../i18n/translations';
import { C } from '../theme';
import { useLanding } from '../context';
import { useMagnetic } from '../hooks';
import { CountUp, ProductCard } from '../components';
import HeroVideo from './HeroVideo';
import { SAMPLES } from '../data';

export default function Hero() {
  const { lang, isRtl, tx, isAuthed, storeUrl, stats, listings, established, Arrow, scrollTo } = useLanding();
  const magRef = useMagnetic<HTMLAnchorElement>(0.3);

  const realList = listings.slice(0, 8);
  const heroItems = realList.length >= 2 ? realList.slice(0, 4) : [...realList, ...SAMPLES].slice(0, 4);

  const btnPrimary: React.CSSProperties = { position: 'relative', overflow: 'hidden', display: 'inline-flex', alignItems: 'center', gap: 9, padding: '15px 30px', borderRadius: 14, background: `linear-gradient(135deg, ${C.orange}, ${C.orangeD})`, color: '#fff', fontSize: 15.5, fontWeight: 800, textDecoration: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 14px 30px ${C.orange}40`, transition: 'transform .15s ease, box-shadow .3s ease' };
  const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 9, padding: '15px 26px', borderRadius: 14, background: C.surface, color: C.ink, fontSize: 15.5, fontWeight: 800, textDecoration: 'none', border: `1px solid ${C.borderH}`, cursor: 'pointer', fontFamily: 'inherit' };

  const trust = [
    { Icon: Shield, k: 'trustSecure', c: C.green },
    { Icon: Zap, k: 'trustFast', c: C.orange },
    { Icon: Headphones, k: 'trustSupport', c: C.blue },
  ];

  return (
    <section style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(34px,6vh,68px) clamp(16px,5vw,40px) clamp(26px,5vh,52px)' }}>
      {/* ... gardez les dégradés d'arrière-plan ... */}
      <div style={{ position: 'absolute', top: '-18%', insetInlineEnd: '-8%', width: 460, height: 460, borderRadius: '50%', background: `radial-gradient(circle, ${C.orange}1f, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-26%', insetInlineStart: '-10%', width: 440, height: 440, borderRadius: '50%', background: `radial-gradient(circle, ${C.blue}1a, transparent 70%)`, pointerEvents: 'none' }} />
      
      <div style={{ position: 'relative', maxWidth: 1160, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,360px), 1fr))', gap: 'clamp(28px,5vw,56px)', alignItems: 'center' }}>
        {/* Texte - inchangé */}
        <div style={{ textAlign: isRtl ? 'right' : 'left', animation: 'lpUp .6s .05s ease both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 15px', borderRadius: 99, background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.blue, boxShadow: `0 0 0 4px ${C.blue}2e`, animation: 'lpShimmer 2s ease infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: C.ink2 }}>{tx('osBadge')}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 5.6vw, 58px)', fontWeight: 900, lineHeight: 1.06, margin: '16px 0 0', letterSpacing: '-0.03em', color: C.ink }}>
            {t(lang, 'landing.hero.title1')}
            <span style={{ display: 'block', background: `linear-gradient(90deg, ${C.orange}, ${C.purple}, ${C.blue}, ${C.orange})`, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'lpGrad 6s linear infinite' }}>{t(lang, 'landing.hero.title2')}</span>
          </h1>
          <p style={{ fontSize: 'clamp(14px,1.7vw,18px)', color: C.ink2, lineHeight: 1.7, margin: '16px 0 0', maxWidth: 540 }}>{t(lang, 'landing.hero.sub')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
            <a ref={magRef} href={isAuthed ? '/dashboard' : '/login'} className="lpbtn" style={btnPrimary}><span className="sh" /><Zap size={17} /> {isAuthed ? t(lang, 'landing.merchant.ctaExisting') : t(lang, 'landing.merchant.ctaNew')} <Arrow size={17} /></a>
            <a href={storeUrl || '/market'} style={btnGhost}>🛍️ {t(lang, 'landing.customer.cta')}</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 16, fontSize: 12.5, color: C.ink3, fontWeight: 600 }}>
            <Check size={14} color={C.green} /> {tx('heroNote')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 18 }}>
            {trust.map(({ Icon, k, c }) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: C.ink2, fontWeight: 700 }}><Icon size={15} color={c} /> {tx(k)}</div>
            ))}
          </div>
        </div>

        {/* REMPLACEMENT : Vidéo + aperçu du store */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'lpUp .7s .2s ease both' }}>
          {/* Vidéo de présentation */}
          <HeroVideo autoPlay muted loop />

          {/* Petit aperçu du store en dessous (optionnel) */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 8,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 8,
            boxShadow: C.shadow,
          }}>
            {heroItems.slice(0, 2).map(it => (
              <div key={it.id} style={{ 
                background: C.alt, 
                borderRadius: 8, 
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                fontWeight: 700,
                color: C.ink,
              }}>
                <span style={{ fontSize: 18 }}>{it.emoji || '🛍️'}</span>
                <div>
                  <div style={{ fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{it.name}</div>
                  <div style={{ fontSize: 10, color: C.orange, fontWeight: 900 }}>{it.price} DH</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ... reste du composant (stats, early-stage, scroll hint) inchangé ... */}
      <div style={{ position: 'relative', maxWidth: 1000, margin: 'clamp(26px,4vh,44px) auto 0', animation: 'lpUp .7s .3s ease both' }}>
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
  );
}
