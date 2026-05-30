import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { ShoppingBag, Store, ArrowLeft, Sparkles, Bot, Truck, BarChart3, MessageCircle, Shield } from 'lucide-react';

export default function LandingPage() {
  const { token, user } = useStore();
  const [loaded, setLoaded] = useState(false);

  const userId = user?.id || (() => {
    try { const u = localStorage.getItem('ai_commerce_user'); return u ? JSON.parse(u)?.id : null; } catch { return null; }
  })();

  const storeUrl = userId ? `/store/${userId}` : null;
  const isAuthed = !!token || token === 'demo-token-local';

  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  return (
    <div dir="rtl" style={{ minHeight:'100dvh', position:'relative', overflow:'hidden', background:'#07080D' }}>

      {/* ══ HERO BACKGROUND IMAGE ══ */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'url(/sahar-banner-mobile.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        opacity: 0.18,
        filter: 'blur(2px)',
        transform: 'scale(1.05)',
      }} />

      {/* Dark overlay gradient */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'linear-gradient(180deg, rgba(7,8,13,.75) 0%, rgba(7,8,13,.55) 40%, rgba(7,8,13,.85) 80%, #07080D 100%)',
      }} />

      {/* Ember glow top */}
      <div style={{
        position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400, zIndex: 1,
        background: 'radial-gradient(ellipse, rgba(255,106,0,.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Mint glow bottom-right */}
      <div style={{
        position: 'absolute', bottom: 0, right: -100,
        width: 400, height: 300, zIndex: 1,
        background: 'radial-gradient(ellipse, rgba(0,200,150,.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Zellige top border */}
      <svg style={{ position:'absolute',top:0,left:0,width:'100%',height:44,zIndex:2,pointerEvents:'none' }}
        viewBox="0 0 800 44" preserveAspectRatio="xMidYMid slice">
        {Array.from({length:40},(_,i)=>(
          <polygon key={i} points={`${i*22-11},0 ${i*22},11 ${i*22-11},22 ${i*22-22},11`}
            fill={['#FF6A00','#C9954C','#00C896','#FF6A00','#C9954C'][i%5]} opacity={0.5}/>
        ))}
        <rect x={0} y={22} width={800} height={1} fill="rgba(255,255,255,.06)"/>
      </svg>

      {/* ══ CONTENT ══ */}
      <div style={{
        position: 'relative', zIndex: 3,
        minHeight: '100dvh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '56px 20px 40px',
      }}>

        {/* LOGO SECTION */}
        <div style={{
          textAlign: 'center', marginBottom: 36,
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'all .6s ease',
        }}>
          {/* Logo image */}
          <div style={{
            width: 130, height: 130, margin: '0 auto 18px',
            borderRadius: 30, overflow: 'hidden',
            background: 'rgba(7,8,13,.8)',
            boxShadow: '0 0 0 1px rgba(255,106,0,.3), 0 16px 64px rgba(255,106,0,.3), 0 4px 24px rgba(0,0,0,.6)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src="/sahar-logo-text.png" alt="SAHAR shop"
              style={{ width:'90%', height:'90%', objectFit:'contain' }}
              onError={e => {
                (e.currentTarget as HTMLImageElement).style.display='none';
                (e.currentTarget.parentElement as HTMLElement).innerHTML =
                  '<div style="font-size:52px;font-weight:900;color:#FF6A00">S</div>';
              }}
            />
          </div>

          {/* Title */}
          <h1 style={{ fontSize:'clamp(28px,7vw,52px)', fontWeight:900, margin:'0 0 6px', letterSpacing:'-0.03em', lineHeight:1.1 }}>
            <span style={{ color:'#FF6A00', textShadow:'0 0 30px rgba(255,106,0,.5)' }}>SAHAR</span>
            <span style={{ color:'#E8E4DC' }}> shop</span>
          </h1>
          <p style={{ fontSize:12, color:'rgba(255,255,255,.35)', letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:14, fontWeight:600 }}>
            AI commerce OS
          </p>
          <p style={{ fontSize:15, color:'rgba(255,255,255,.55)', maxWidth:400, margin:'0 auto 18px', lineHeight:1.8 }}>
            نظام تشغيل التجارة الإلكترونية بالذكاء الاصطناعي
            <br/>
            <span style={{ color:'#FF6A00', fontWeight:700 }}>مصنوع للسوق المغربي 🇲🇦</span>
          </p>

          {/* Live badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:99, background:'rgba(0,200,150,.1)', border:'1px solid rgba(0,200,150,.3)', backdropFilter:'blur(8px)' }}>
            <span style={{ width:7,height:7,borderRadius:'50%',background:'#00C896',boxShadow:'0 0 8px #00C896',display:'inline-block',animation:'pulse 2s infinite' }}/>
            <span style={{ fontSize:12, color:'#00C896', fontWeight:700 }}>AI نشط · يرد بالدارجة المغربية</span>
          </div>
        </div>

        {/* ACTION CARDS */}
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',
          gap:14, width:'100%', maxWidth:680, marginBottom:28,
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all .7s ease .1s',
        }}>

          {/* CUSTOMER */}
          <a href={storeUrl || '#'}
            onClick={e => { if (!storeUrl) { e.preventDefault(); window.alert('اطلب من التاجر مشاركة رابط متجره معك.'); }}}
            style={{ background:'rgba(0,200,150,.08)', border:'1.5px solid rgba(0,200,150,.25)', borderRadius:22, padding:'26px 22px', textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', backdropFilter:'blur(12px)', transition:'all .25s ease', cursor:'pointer' }}
            onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='rgba(0,200,150,.6)';el.style.transform='translateY(-5px)';el.style.background='rgba(0,200,150,.14)';el.style.boxShadow='0 12px 40px rgba(0,200,150,.15)';}}
            onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='rgba(0,200,150,.25)';el.style.transform='';el.style.background='rgba(0,200,150,.08)';el.style.boxShadow='';}}
          >
            <div style={{ width:56,height:56,borderRadius:16,background:'rgba(0,200,150,.15)',border:'1px solid rgba(0,200,150,.35)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14,color:'#00C896' }}>
              <ShoppingBag size={24}/>
            </div>
            <h2 style={{ fontSize:19,fontWeight:900,color:'#E8E4DC',marginBottom:8 }}>🛍️ تسوق الآن</h2>
            <p style={{ fontSize:13,color:'rgba(255,255,255,.45)',marginBottom:18,lineHeight:1.7,textAlign:'center' }}>
              تصفح المنتجات، أضف للسلة، واطلب مع توصيل سريع
            </p>
            <span style={{ display:'flex',alignItems:'center',gap:6,color:'#00C896',fontWeight:800,fontSize:13 }}>
              دخول كزبون <ArrowLeft size={14}/>
            </span>
          </a>

          {/* MERCHANT */}
          <a href={isAuthed ? '/dashboard' : '/login'}
            style={{ background:'rgba(255,106,0,.08)', border:'1.5px solid rgba(255,106,0,.25)', borderRadius:22, padding:'26px 22px', textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', backdropFilter:'blur(12px)', transition:'all .25s ease' }}
            onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='rgba(255,106,0,.6)';el.style.transform='translateY(-5px)';el.style.background='rgba(255,106,0,.14)';el.style.boxShadow='0 12px 40px rgba(255,106,0,.15)';}}
            onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='rgba(255,106,0,.25)';el.style.transform='';el.style.background='rgba(255,106,0,.08)';el.style.boxShadow='';}}
          >
            <div style={{ width:56,height:56,borderRadius:16,background:'rgba(255,106,0,.15)',border:'1px solid rgba(255,106,0,.35)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14,color:'#FF6A00' }}>
              <Store size={24}/>
            </div>
            <h2 style={{ fontSize:19,fontWeight:900,color:'#E8E4DC',marginBottom:8 }}>
              {isAuthed ? '🔥 لوحة التحكم' : '🏪 ابدأ متجرك'}
            </h2>
            <p style={{ fontSize:13,color:'rgba(255,255,255,.45)',marginBottom:18,lineHeight:1.7,textAlign:'center' }}>
              {isAuthed ? 'أدر منتجاتك وطلباتك بذكاء اصطناعي' : 'أضف منتجاتك وشارك رابط متجرك مجاناً'}
            </p>
            <span style={{ display:'flex',alignItems:'center',gap:6,color:'#FF6A00',fontWeight:800,fontSize:13 }}>
              {isAuthed ? 'الدخول للوحة' : 'دخول كتاجر'} <ArrowLeft size={14}/>
            </span>
          </a>
        </div>

        {/* FEATURES */}
        <div style={{ display:'flex',justifyContent:'center',gap:8,flexWrap:'wrap',marginBottom:24,opacity:loaded?1:0,transition:'opacity .8s ease .2s' }}>
          {[
            { icon:<Bot size={13}/>, label:'AI بالدارجة', color:'#FF6A00' },
            { icon:<MessageCircle size={13}/>, label:'واتساب', color:'#25D366' },
            { icon:<Truck size={13}/>, label:'توصيل ذكي', color:'#00C896' },
            { icon:<BarChart3 size={13}/>, label:'تحليلات', color:'#C9954C' },
            { icon:<Shield size={13}/>, label:'آمن 100%', color:'#a78bfa' },
            { icon:<Sparkles size={13}/>, label:'بنر AI', color:'#60a5fa' },
          ].map(f => (
            <div key={f.label} style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:99,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',backdropFilter:'blur(8px)',color:f.color,fontSize:11,fontWeight:600 }}>
              {f.icon} {f.label}
            </div>
          ))}
        </div>

        {/* CONTACT */}
        <div style={{ display:'flex',justifyContent:'center',gap:16,flexWrap:'wrap',padding:'14px 20px',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,backdropFilter:'blur(10px)',fontSize:12,opacity:loaded?1:0,transition:'opacity .9s ease .3s' }}>
          <a href="https://wa.me/212612265893" target="_blank" rel="noreferrer"
            style={{ display:'flex',alignItems:'center',gap:5,color:'#25D366',fontWeight:700,textDecoration:'none' }}>
            💬 +212612265893
          </a>
          <span style={{ color:'rgba(255,255,255,.1)' }}>|</span>
          <span style={{ color:'rgba(255,255,255,.35)' }}>📍 Casablanca, Maroc</span>
          <span style={{ color:'rgba(255,255,255,.1)' }}>|</span>
          <span style={{ color:'#C9954C', fontWeight:600 }}>✨ AI commerce OS</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }
      `}</style>
    </div>
  );
}
