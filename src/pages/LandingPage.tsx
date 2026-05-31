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

  useEffect(() => { setTimeout(() => setLoaded(true), 80); }, []);

  return (
    <div dir="rtl" style={{
      height: '100dvh', maxHeight: '100dvh',
      position: 'relative', overflow: 'hidden',
      background: '#07080D',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'url(/sahar-banner-mobile.png)',
        backgroundSize: 'cover', backgroundPosition: 'center top',
        opacity: 0.15, filter: 'blur(2px)', transform: 'scale(1.05)',
      }} />

      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'linear-gradient(180deg,rgba(7,8,13,.8) 0%,rgba(7,8,13,.5) 40%,rgba(7,8,13,.9) 100%)',
      }} />

      {/* Ember glow */}
      <div style={{ position:'absolute',top:-180,left:'50%',transform:'translateX(-50%)',width:500,height:300,zIndex:1,background:'radial-gradient(ellipse,rgba(255,106,0,.13) 0%,transparent 70%)',pointerEvents:'none' }} />

      {/* Zellige top strip */}
      <svg style={{ position:'absolute',top:0,left:0,width:'100%',height:32,zIndex:2,pointerEvents:'none' }}
        viewBox="0 0 800 32" preserveAspectRatio="xMidYMid slice">
        {Array.from({length:40},(_,i)=>(
          <polygon key={i} points={`${i*22-11},0 ${i*22},10 ${i*22-11},20 ${i*22-22},10`}
            fill={['#FF6A00','#C9954C','#00C896','#FF6A00','#C9954C'][i%5]} opacity={0.45}/>
        ))}
      </svg>

      {/* ══ CONTENT — fits 100dvh ══ */}
      <div style={{
        position: 'relative', zIndex: 3,
        flex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly',
        padding: '36px 20px 16px',
        opacity: loaded ? 1 : 0,
        transition: 'opacity .5s ease',
      }}>

        {/* LOGO */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, margin: '0 auto 10px',
            borderRadius: 22, overflow: 'hidden',
            background: 'rgba(7,8,13,.8)',
            boxShadow: '0 0 0 1px rgba(255,106,0,.3),0 12px 48px rgba(255,106,0,.28)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src="/sahar-logo-text.png" alt="SAHAR shop"
              style={{ width:'88%',height:'88%',objectFit:'contain' }}
              onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none';(e.currentTarget.parentElement as HTMLElement).innerHTML='<div style="font-size:34px;font-weight:900;color:#FF6A00">S</div>';}}
            />
          </div>
          <h1 style={{ fontSize:'clamp(24px,6vw,40px)',fontWeight:900,margin:'0 0 3px',letterSpacing:'-0.03em',lineHeight:1.1 }}>
            <span style={{ color:'#FF6A00',textShadow:'0 0 24px rgba(255,106,0,.5)' }}>SAHAR</span>
            <span style={{ color:'#E8E4DC' }}> shop</span>
          </h1>
          <p style={{ fontSize:11,color:'rgba(255,255,255,.3)',letterSpacing:'0.22em',textTransform:'uppercase',marginBottom:8,fontWeight:600 }}>
            AI commerce OS
          </p>
          <div style={{ display:'inline-flex',alignItems:'center',gap:7,padding:'5px 13px',borderRadius:99,background:'rgba(0,200,150,.1)',border:'1px solid rgba(0,200,150,.3)' }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:'#00C896',boxShadow:'0 0 7px #00C896',display:'inline-block',animation:'pulse 2s infinite' }}/>
            <span style={{ fontSize:11,color:'#00C896',fontWeight:700 }}>AI نشط · يرد بالدارجة المغربية</span>
          </div>
        </div>

        {/* ACTION CARDS */}
        <div style={{
          display:'grid', gridTemplateColumns:'1fr 1fr',
          gap:12, width:'100%', maxWidth:560,
        }}>
          {/* CUSTOMER */}
          <a href={storeUrl || '#'}
            onClick={e=>{ if(!storeUrl){e.preventDefault();alert('اطلب من التاجر مشاركة رابط متجره.');} }}
            style={{ background:'rgba(0,200,150,.08)',border:'1.5px solid rgba(0,200,150,.25)',borderRadius:18,padding:'18px 14px',textDecoration:'none',display:'flex',flexDirection:'column',alignItems:'center',backdropFilter:'blur(10px)',transition:'all .22s ease' }}
            onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='rgba(0,200,150,.6)';el.style.background='rgba(0,200,150,.14)';}}
            onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='rgba(0,200,150,.25)';el.style.background='rgba(0,200,150,.08)';}}
          >
            <div style={{ width:44,height:44,borderRadius:13,background:'rgba(0,200,150,.15)',border:'1px solid rgba(0,200,150,.35)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:10,color:'#00C896' }}>
              <ShoppingBag size={20}/>
            </div>
            <h2 style={{ fontSize:15,fontWeight:900,color:'#E8E4DC',marginBottom:5 }}>🛍️ تسوق الآن</h2>
            <p style={{ fontSize:11,color:'rgba(255,255,255,.4)',marginBottom:12,lineHeight:1.6,textAlign:'center' }}>
              تصفح المنتجات واطلب مع توصيل سريع
            </p>
            <span style={{ display:'flex',alignItems:'center',gap:5,color:'#00C896',fontWeight:800,fontSize:12 }}>
              دخول كزبون <ArrowLeft size={13}/>
            </span>
          </a>

          {/* MERCHANT */}
          <a href={isAuthed ? '/dashboard' : '/login'}
            style={{ background:'rgba(255,106,0,.08)',border:'1.5px solid rgba(255,106,0,.25)',borderRadius:18,padding:'18px 14px',textDecoration:'none',display:'flex',flexDirection:'column',alignItems:'center',backdropFilter:'blur(10px)',transition:'all .22s ease' }}
            onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='rgba(255,106,0,.6)';el.style.background='rgba(255,106,0,.14)';}}
            onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='rgba(255,106,0,.25)';el.style.background='rgba(255,106,0,.08)';}}
          >
            <div style={{ width:44,height:44,borderRadius:13,background:'rgba(255,106,0,.15)',border:'1px solid rgba(255,106,0,.35)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:10,color:'#FF6A00' }}>
              <Store size={20}/>
            </div>
            <h2 style={{ fontSize:15,fontWeight:900,color:'#E8E4DC',marginBottom:5 }}>
              {isAuthed ? '🔥 لوحة التحكم' : '🏪 ابدأ متجرك'}
            </h2>
            <p style={{ fontSize:11,color:'rgba(255,255,255,.4)',marginBottom:12,lineHeight:1.6,textAlign:'center' }}>
              {isAuthed ? 'أدر منتجاتك وطلباتك بذكاء اصطناعي' : 'أضف منتجاتك وشارك رابط متجرك مجاناً'}
            </p>
            <span style={{ display:'flex',alignItems:'center',gap:5,color:'#FF6A00',fontWeight:800,fontSize:12 }}>
              {isAuthed ? 'الدخول للوحة' : 'دخول كتاجر'} <ArrowLeft size={13}/>
            </span>
          </a>
        </div>

        {/* FEATURES chips */}
        <div style={{ display:'flex',justifyContent:'center',gap:6,flexWrap:'wrap',maxWidth:480 }}>
          {[
            { icon:<Bot size={11}/>,         label:'AI بالدارجة',   color:'#FF6A00' },
            { icon:<MessageCircle size={11}/>,label:'واتساب',         color:'#25D366' },
            { icon:<Truck size={11}/>,        label:'توصيل ذكي',     color:'#00C896' },
            { icon:<BarChart3 size={11}/>,    label:'تحليلات',       color:'#C9954C' },
            { icon:<Shield size={11}/>,       label:'آمن 100%',      color:'#a78bfa' },
            { icon:<Sparkles size={11}/>,     label:'بنر AI',        color:'#60a5fa' },
          ].map(f=>(
            <div key={f.label} style={{ display:'flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:99,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',backdropFilter:'blur(8px)',color:f.color,fontSize:10,fontWeight:600 }}>
              {f.icon} {f.label}
            </div>
          ))}
        </div>

        {/* CONTACT */}
        <div style={{ display:'flex',justifyContent:'center',gap:12,flexWrap:'wrap',padding:'10px 16px',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',borderRadius:12,backdropFilter:'blur(10px)',fontSize:11 }}>
          <a href="https://wa.me/212612265893" target="_blank" rel="noreferrer"
            style={{ display:'flex',alignItems:'center',gap:4,color:'#25D366',fontWeight:700,textDecoration:'none' }}>
            💬 +212612265893
          </a>
          <span style={{ color:'rgba(255,255,255,.1)' }}>|</span>
          <span style={{ color:'rgba(255,255,255,.3)' }}>📍 Casablanca</span>
          <span style={{ color:'rgba(255,255,255,.1)' }}>|</span>
          <span style={{ color:'#C9954C',fontWeight:600 }}>✨ AI commerce OS</span>
        </div>

      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }
      `}</style>
    </div>
  );
}
