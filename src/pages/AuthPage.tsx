import { useState } from 'react';
import { useStore } from '../store';
import { Eye, EyeOff, User, Mail, Lock, Store } from 'lucide-react';

export default function AuthPage() {
  const { login, register } = useStore();
  const [isLogin, setIsLogin]   = useState(true);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [logoErr, setLogoErr]   = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', storeName:'' });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        if (!form.name || !form.storeName) { setError('الاسم واسم المتجر مطلوبان'); setLoading(false); return; }
        await register(form.name, form.email, form.password, form.storeName);
      }
    } catch (err: any) {
      setError(err.message || (isLogin ? 'بيانات الدخول غير صحيحة' : 'حدث خطأ'));
    }
    setLoading(false);
  };

  return (
    <div dir="rtl" style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px', position:'relative', overflow:'hidden', background:'#07080D' }}>

      {/* Background image */}
      <div style={{
        position:'absolute', inset:0, zIndex:0,
        backgroundImage:'url(/sahar-banner-wide.png)',
        backgroundSize:'cover', backgroundPosition:'center',
        opacity:.12, filter:'blur(3px)', transform:'scale(1.05)',
      }}/>

      {/* Overlay */}
      <div style={{ position:'absolute', inset:0, zIndex:1, background:'linear-gradient(135deg, rgba(7,8,13,.9) 0%, rgba(7,8,13,.7) 50%, rgba(7,8,13,.95) 100%)' }}/>

      {/* Ember glow */}
      <div style={{ position:'absolute', top:-150, left:'30%', width:400, height:300, zIndex:1, background:'radial-gradient(ellipse, rgba(255,106,0,.1) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-100, right:'20%', width:300, height:250, zIndex:1, background:'radial-gradient(ellipse, rgba(0,200,150,.08) 0%, transparent 70%)', pointerEvents:'none' }}/>

      {/* Zellige top */}
      <svg style={{ position:'absolute',top:0,left:0,width:'100%',height:36,zIndex:2,pointerEvents:'none' }}
        viewBox="0 0 800 36" preserveAspectRatio="xMidYMid slice">
        {Array.from({length:40},(_,i)=>(
          <polygon key={i} points={`${i*22-11},0 ${i*22},11 ${i*22-11},22 ${i*22-22},11`}
            fill={['#FF6A00','#C9954C','#00C896'][i%3]} opacity={0.45}/>
        ))}
      </svg>

      {/* Card */}
      <div style={{ position:'relative', zIndex:3, width:'100%', maxWidth:400 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ width:96, height:96, margin:'0 auto 14px', borderRadius:22, overflow:'hidden', background:'rgba(7,8,13,.85)', boxShadow:'0 0 0 1px rgba(255,106,0,.3), 0 12px 40px rgba(255,106,0,.25)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {logoErr
              ? <span style={{ fontSize:38, fontWeight:900, color:'#FF6A00' }}>S</span>
              : <img src="/sahar-logo-text.png" alt="SAHAR shop"
                  style={{ width:'88%', height:'88%', objectFit:'contain' }}
                  onError={() => setLogoErr(true)}
                />
            }
          </div>
          <h1 style={{ fontSize:22, fontWeight:900, color:'#E8E4DC', marginBottom:3, letterSpacing:'-.02em' }}>
            <span style={{ color:'#FF6A00', textShadow:'0 0 20px rgba(255,106,0,.4)' }}>SAHAR</span> shop
          </h1>
          <p style={{ color:'rgba(255,255,255,.3)', fontSize:10, letterSpacing:'.2em', textTransform:'uppercase', fontWeight:600 }}>
            AI commerce OS
          </p>
        </div>

        {/* Form card */}
        <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)', borderRadius:22, padding:'26px 22px', backdropFilter:'blur(16px)', boxShadow:'0 24px 64px rgba(0,0,0,.4)' }}>

          {/* Tabs */}
          <div style={{ display:'flex', background:'rgba(0,0,0,.35)', borderRadius:12, padding:3, marginBottom:22, gap:3 }}>
            {[['true','تسجيل الدخول'],['false','إنشاء حساب']].map(([v,label]) => (
              <button key={v} onClick={() => { setIsLogin(v==='true'); setError(''); }}
                style={{ flex:1, padding:'9px 0', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', border:'none', transition:'all .18s',
                  background: String(isLogin)===v ? '#FF6A00' : 'transparent',
                  color: String(isLogin)===v ? '#fff' : 'rgba(255,255,255,.35)',
                  boxShadow: String(isLogin)===v ? '0 3px 14px rgba(255,106,0,.35)' : 'none',
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>

            {!isLogin && (
              <>
                <div style={{ position:'relative' }}>
                  <User size={14} style={{ position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,.25)',pointerEvents:'none' }}/>
                  <input type="text" placeholder="اسمك الكامل" required value={form.name} onChange={e=>set('name',e.target.value)}
                    style={{ width:'100%',padding:'13px 40px 13px 14px',borderRadius:12,background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',color:'#E8E4DC',fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'inherit',direction:'rtl',transition:'border-color .2s' }}
                    onFocus={e=>(e.target.style.borderColor='rgba(255,106,0,.5)')}
                    onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,.1)')}
                  />
                </div>
                <div style={{ position:'relative' }}>
                  <Store size={14} style={{ position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,.25)',pointerEvents:'none' }}/>
                  <input type="text" placeholder="اسم متجرك" required value={form.storeName} onChange={e=>set('storeName',e.target.value)}
                    style={{ width:'100%',padding:'13px 40px 13px 14px',borderRadius:12,background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',color:'#E8E4DC',fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'inherit',direction:'rtl',transition:'border-color .2s' }}
                    onFocus={e=>(e.target.style.borderColor='rgba(255,106,0,.5)')}
                    onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,.1)')}
                  />
                </div>
              </>
            )}

            <div style={{ position:'relative' }}>
              <Mail size={14} style={{ position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,.25)',pointerEvents:'none' }}/>
              <input type="email" placeholder="البريد الإلكتروني" required value={form.email} onChange={e=>set('email',e.target.value)}
                style={{ width:'100%',padding:'13px 40px 13px 14px',borderRadius:12,background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',color:'#E8E4DC',fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'inherit',transition:'border-color .2s' }}
                onFocus={e=>(e.target.style.borderColor='rgba(255,106,0,.5)')}
                onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,.1)')}
                dir="ltr"
              />
            </div>

            <div style={{ position:'relative' }}>
              <Lock size={14} style={{ position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,.25)',pointerEvents:'none' }}/>
              <input type={showPwd?'text':'password'} placeholder="كلمة المرور" required value={form.password} onChange={e=>set('password',e.target.value)}
                style={{ width:'100%',padding:'13px 40px 13px 40px',borderRadius:12,background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',color:'#E8E4DC',fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'inherit',direction:'ltr',transition:'border-color .2s' }}
                onFocus={e=>(e.target.style.borderColor='rgba(255,106,0,.5)')}
                onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,.1)')}
              />
              <button type="button" onClick={()=>setShowPwd(v=>!v)}
                style={{ position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,.3)',padding:0,display:'flex' }}>
                {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>

            {error && (
              <div style={{ background:'rgba(255,106,0,.1)',border:'1px solid rgba(255,106,0,.25)',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#FF6B47',textAlign:'center' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width:'100%',padding:'14px',borderRadius:12,background:loading?'rgba(255,106,0,.5)':'#FF6A00',border:'none',color:'#fff',fontSize:15,fontWeight:700,cursor:loading?'not-allowed':'pointer',marginTop:4,boxShadow:loading?'none':'0 4px 20px rgba(255,106,0,.4)',transition:'all .2s' }}>
              {loading ? '...' : isLogin ? '🔑 دخول' : '🚀 إنشاء الحساب'}
            </button>

            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              <button type="button" onClick={() => { localStorage.setItem('ai_commerce_token','demo-token-local'); window.location.href='/dashboard'; }}
                style={{ flex:1,padding:'10px',borderRadius:10,background:'rgba(255,106,0,.08)',border:'1px solid rgba(255,106,0,.2)',color:'#FF6A00',cursor:'pointer',fontWeight:700,fontSize:12 }}>
                👨‍💼 تاجر Demo
              </button>
              <a href="/" style={{ flex:1,padding:'10px',borderRadius:10,background:'rgba(0,200,150,.08)',border:'1px solid rgba(0,200,150,.2)',color:'#00C896',cursor:'pointer',fontWeight:700,fontSize:12,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center' }}>
                🛍️ للزبائن
              </a>
            </div>
          </form>

          <p style={{ textAlign:'center', marginTop:14, fontSize:12 }}>
            <a href="/" style={{ color:'rgba(255,255,255,.2)', textDecoration:'none' }}>← الصفحة الرئيسية</a>
          </p>
        </div>
      </div>
    </div>
  );
}
