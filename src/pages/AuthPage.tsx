import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Eye, EyeOff, User, Mail, Lock, Store } from 'lucide-react';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src; s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('script load failed'));
    document.head.appendChild(s);
  });
}

export default function AuthPage() {
  const { login, register } = useStore();
  const [isLogin, setIsLogin]   = useState(true);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [logoErr, setLogoErr]   = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', storeName:'' });
  const [socialCfg, setSocialCfg] = useState<{ googleClientId: string; facebookAppId: string }>({ googleClientId: '', facebookAppId: '' });
  const [socialBusy, setSocialBusy] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Load which social providers are configured on the server
  useEffect(() => {
    fetch('/api/auth/config').then(r => r.json()).then(c =>
      setSocialCfg({ googleClientId: c.googleClientId || '', facebookAppId: c.facebookAppId || '' })
    ).catch(() => {});
  }, []);

  const finishSocial = async (provider: string, payload: Record<string, string>) => {
    try {
      const r = await fetch('/api/auth/social', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, ...payload }),
      });
      const j = await r.json();
      if (j.token) {
        localStorage.setItem('ai_commerce_token', j.token);
        if (j.refreshToken) localStorage.setItem('ai_commerce_refresh', j.refreshToken);
        localStorage.setItem('ai_commerce_user', JSON.stringify(j.user));
        window.location.href = '/dashboard';
      } else {
        setError(j.error || 'فشل تسجيل الدخول');
      }
    } catch { setError('تعذّر الاتصال بالخادم'); }
    setSocialBusy(false);
  };

  const googleLogin = async () => {
    if (!socialCfg.googleClientId) { setError('تسجيل الدخول بـ Google يتطلب إعداد GOOGLE_CLIENT_ID في الخادم'); return; }
    setError(''); setSocialBusy(true);
    try {
      await loadScript('https://accounts.google.com/gsi/client');
      const g = (window as any).google;
      g.accounts.id.initialize({
        client_id: socialCfg.googleClientId,
        callback: (resp: any) => { if (resp?.credential) finishSocial('google', { credential: resp.credential }); else setSocialBusy(false); },
      });
      g.accounts.id.prompt();
    } catch { setError('تعذّر تحميل Google'); setSocialBusy(false); }
  };

  const facebookLogin = async () => {
    if (!socialCfg.facebookAppId) { setError('تسجيل الدخول بـ Facebook يتطلب إعداد FACEBOOK_APP_ID في الخادم'); return; }
    setError(''); setSocialBusy(true);
    try {
      await loadScript('https://connect.facebook.net/en_US/sdk.js');
      const FB = (window as any).FB;
      FB.init({ appId: socialCfg.facebookAppId, version: 'v19.0', cookie: true, xfbml: false });
      FB.login((resp: any) => {
        if (resp?.authResponse?.accessToken) finishSocial('facebook', { accessToken: resp.authResponse.accessToken });
        else setSocialBusy(false);
      }, { scope: 'email,public_profile' });
    } catch { setError('تعذّر تحميل Facebook'); setSocialBusy(false); }
  };

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
        opacity:.18, filter:'blur(2px)', transform:'scale(1.05)',
      }}/>

      {/* Overlay */}
      <div style={{ position:'absolute', inset:0, zIndex:1, background:'linear-gradient(135deg, rgba(7,8,13,.9) 0%, rgba(7,8,13,.7) 50%, rgba(7,8,13,.95) 100%)' }}/>

      {/* Ember glow */}
      <div style={{ position:'absolute', top:-150, left:'30%', width:400, height:300, zIndex:1, background:'radial-gradient(ellipse, rgba(255,106,0,.06) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-100, right:'20%', width:300, height:250, zIndex:1, background:'radial-gradient(ellipse, rgba(0,200,150,.05) 0%, transparent 70%)', pointerEvents:'none' }}/>

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

            {isLogin && (
              <div style={{ textAlign:'left', marginTop:-4 }}>
                <button type="button"
                  onClick={() => {
                    const email = form.email.trim();
                    if (!email) { setError('أدخل بريدك الإلكتروني أولاً'); return; }
                    setError('');
                    fetch('/api/auth/forgot-password', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) })
                      .then(r => r.json())
                      .then(() => setError('✅ تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني'))
                      .catch(() => setError('✅ إذا كان البريد مسجلاً سيصلك رابط إعادة التعيين'));
                  }}
                  style={{ background:'none',border:'none',color:'rgba(255,106,0,.7)',fontSize:12,cursor:'pointer',fontFamily:'inherit',padding:0,textDecoration:'underline' }}>
                  نسيت كلمة المرور؟
                </button>
              </div>
            )}

            {error && (
              <div style={{ background:'rgba(255,106,0,.1)',border:'1px solid rgba(255,106,0,.25)',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#FF6B47',textAlign:'center' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width:'100%',padding:'14px',borderRadius:12,background:loading?'rgba(255,106,0,.5)':'#FF6A00',border:'none',color:'#fff',fontSize:15,fontWeight:700,cursor:loading?'not-allowed':'pointer',marginTop:4,boxShadow:loading?'none':'0 4px 20px rgba(255,106,0,.4)',transition:'all .2s' }}>
              {loading ? '...' : isLogin ? '🔑 دخول' : '🚀 إنشاء الحساب'}
            </button>

            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:10, margin:'6px 0 2px' }}>
              <div style={{ flex:1, height:1, background:'rgba(255,255,255,.1)' }}/>
              <span style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>أو</span>
              <div style={{ flex:1, height:1, background:'rgba(255,255,255,.1)' }}/>
            </div>

            {/* Social login */}
            <div style={{ display:'flex', gap:8 }}>
              <button type="button" onClick={googleLogin} disabled={socialBusy}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px', borderRadius:12, background:'#fff', border:'none', color:'#3c4043', fontSize:13, fontWeight:700, cursor:socialBusy?'wait':'pointer', fontFamily:'inherit' }}>
                <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.6 2.4 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.3 13.2 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.8-9.9 6.8-17.4z"/><path fill="#FBBC05" d="M10.4 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.3-5.7c-2 1.4-4.7 2.3-8 2.3-6.3 0-11.7-3.7-13.6-9.4l-7.9 6.1C6.4 42.6 14.6 48 24 48z"/></svg>
                Google
              </button>
              <button type="button" onClick={facebookLogin} disabled={socialBusy}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px', borderRadius:12, background:'#1877f2', border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:socialBusy?'wait':'pointer', fontFamily:'inherit' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg>
                Facebook
              </button>
            </div>

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
