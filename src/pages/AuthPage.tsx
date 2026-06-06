import { useState } from 'react';
import { useStore } from '../store';
import { authAPI } from '../services/api';
import { Eye, EyeOff, User, Mail, Lock, Store, ArrowRight, KeyRound } from 'lucide-react';

type View = 'login' | 'register' | 'forgot-email' | 'forgot-code' | 'forgot-done';

export default function AuthPage() {
  const { login, register } = useStore();
  const [view, setView]         = useState<View>('login');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [logoErr, setLogoErr]   = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', storeName:'', code:'', newPassword:'' });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (view === 'login') {
        await login(form.email, form.password);
      } else if (view === 'register') {
        if (!form.name || !form.storeName) { setError('الاسم واسم المتجر مطلوبان'); setLoading(false); return; }
        await register(form.name, form.email, form.password, form.storeName);
      } else if (view === 'forgot-email') {
        await authAPI.forgotPassword(form.email);
        setView('forgot-code');
      } else if (view === 'forgot-code') {
        if (!form.code || !form.newPassword) { setError('جميع الحقول مطلوبة'); setLoading(false); return; }
        if (form.newPassword.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); setLoading(false); return; }
        await authAPI.resetPassword(form.email, form.code, form.newPassword);
        setView('forgot-done');
      }
    } catch (err: any) {
      setError(err.message || (view === 'login' ? 'بيانات الدخول غير صحيحة' : 'حدث خطأ'));
    }
    setLoading(false);
  };

  const inputStyle = { width:'100%',padding:'13px 40px 13px 14px',borderRadius:12,background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',color:'#E8E4DC',fontSize:14,outline:'none',boxSizing:'border-box' as const,fontFamily:'inherit',direction:'rtl' as const,transition:'border-color .2s' };
  const focusOn  = (e: any) => (e.target.style.borderColor='rgba(255,106,0,.5)');
  const focusOff = (e: any) => (e.target.style.borderColor='rgba(255,255,255,.1)');

  return (
    <div dir="rtl" style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px', position:'relative', overflow:'hidden', background:'#07080D' }}>

      {/* Background image */}
      <div style={{ position:'absolute', inset:0, zIndex:0, backgroundImage:'url(/sahar-banner-wide.png)', backgroundSize:'cover', backgroundPosition:'center', opacity:.12, filter:'blur(3px)', transform:'scale(1.05)' }}/>

      {/* Overlay */}
      <div style={{ position:'absolute', inset:0, zIndex:1, background:'linear-gradient(135deg, rgba(7,8,13,.9) 0%, rgba(7,8,13,.7) 50%, rgba(7,8,13,.95) 100%)' }}/>

      {/* Ember glow */}
      <div style={{ position:'absolute', top:-150, left:'30%', width:400, height:300, zIndex:1, background:'radial-gradient(ellipse, rgba(255,106,0,.1) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-100, right:'20%', width:300, height:250, zIndex:1, background:'radial-gradient(ellipse, rgba(0,200,150,.08) 0%, transparent 70%)', pointerEvents:'none' }}/>

      {/* Zellige top */}
      <svg style={{ position:'absolute',top:0,left:0,width:'100%',height:36,zIndex:2,pointerEvents:'none' }} viewBox="0 0 800 36" preserveAspectRatio="xMidYMid slice">
        {Array.from({length:40},(_,i)=>(
          <polygon key={i} points={`${i*22-11},0 ${i*22},11 ${i*22-11},22 ${i*22-22},11`} fill={['#FF6A00','#C9954C','#00C896'][i%3]} opacity={0.45}/>
        ))}
      </svg>

      {/* Card */}
      <div style={{ position:'relative', zIndex:3, width:'100%', maxWidth:400 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ width:96, height:96, margin:'0 auto 14px', borderRadius:22, overflow:'hidden', background:'rgba(7,8,13,.85)', boxShadow:'0 0 0 1px rgba(255,106,0,.3), 0 12px 40px rgba(255,106,0,.25)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {logoErr
              ? <span style={{ fontSize:38, fontWeight:900, color:'#FF6A00' }}>S</span>
              : <img src="/sahar-logo-text.png" alt="SAHAR shop" style={{ width:'88%', height:'88%', objectFit:'contain' }} onError={() => setLogoErr(true)} />
            }
          </div>
          <h1 style={{ fontSize:22, fontWeight:900, color:'#E8E4DC', marginBottom:3, letterSpacing:'-.02em' }}>
            <span style={{ color:'#FF6A00', textShadow:'0 0 20px rgba(255,106,0,.4)' }}>SAHAR</span> shop
          </h1>
          <p style={{ color:'rgba(255,255,255,.3)', fontSize:10, letterSpacing:'.2em', textTransform:'uppercase', fontWeight:600 }}>AI commerce OS</p>
        </div>

        {/* Form card */}
        <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)', borderRadius:22, padding:'26px 22px', backdropFilter:'blur(16px)', boxShadow:'0 24px 64px rgba(0,0,0,.4)' }}>

          {/* ── FORGOT DONE ── */}
          {view === 'forgot-done' && (
            <div style={{ textAlign:'center', padding:'10px 0' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
              <h2 style={{ fontSize:18, fontWeight:900, color:'#E8E4DC', marginBottom:8 }}>تم إعادة التعيين</h2>
              <p style={{ fontSize:13, color:'rgba(255,255,255,.5)', marginBottom:20 }}>يمكنك الدخول الآن بكلمة المرور الجديدة</p>
              <button onClick={() => { setView('login'); setError(''); }}
                style={{ width:'100%',padding:'13px',borderRadius:12,background:'#FF6A00',border:'none',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer' }}>
                🔑 تسجيل الدخول
              </button>
            </div>
          )}

          {/* ── FORGOT CODE ── */}
          {view === 'forgot-code' && (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
                <button onClick={() => { setView('forgot-email'); setError(''); }} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.4)', display:'flex', padding:0 }}>
                  <ArrowRight size={18}/>
                </button>
                <h2 style={{ fontSize:16, fontWeight:900, color:'#E8E4DC' }}>أدخل رمز التحقق</h2>
              </div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginBottom:16 }}>تم إرسال رمز 6 أرقام إلى {form.email}</p>
              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ position:'relative' }}>
                  <KeyRound size={14} style={{ position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,.25)',pointerEvents:'none' }}/>
                  <input type="text" placeholder="رمز التحقق (6 أرقام)" required maxLength={6} value={form.code} onChange={e=>set('code',e.target.value)} style={{ ...inputStyle, letterSpacing:'4px', textAlign:'center' }} onFocus={focusOn} onBlur={focusOff} dir="ltr" />
                </div>
                <div style={{ position:'relative' }}>
                  <Lock size={14} style={{ position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,.25)',pointerEvents:'none' }}/>
                  <input type="password" placeholder="كلمة المرور الجديدة" required value={form.newPassword} onChange={e=>set('newPassword',e.target.value)} style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                </div>
                {error && <div style={{ background:'rgba(255,106,0,.1)',border:'1px solid rgba(255,106,0,.25)',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#FF6B47',textAlign:'center' }}>{error}</div>}
                <button type="submit" disabled={loading} style={{ width:'100%',padding:'14px',borderRadius:12,background:loading?'rgba(255,106,0,.5)':'#FF6A00',border:'none',color:'#fff',fontSize:15,fontWeight:700,cursor:loading?'not-allowed':'pointer' }}>
                  {loading ? '...' : '✅ تأكيد وإعادة التعيين'}
                </button>
              </form>
            </>
          )}

          {/* ── FORGOT EMAIL ── */}
          {view === 'forgot-email' && (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
                <button onClick={() => { setView('login'); setError(''); }} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.4)', display:'flex', padding:0 }}>
                  <ArrowRight size={18}/>
                </button>
                <h2 style={{ fontSize:16, fontWeight:900, color:'#E8E4DC' }}>استعادة كلمة المرور</h2>
              </div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginBottom:16 }}>أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق</p>
              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ position:'relative' }}>
                  <Mail size={14} style={{ position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,.25)',pointerEvents:'none' }}/>
                  <input type="email" placeholder="البريد الإلكتروني" required value={form.email} onChange={e=>set('email',e.target.value)} style={inputStyle} onFocus={focusOn} onBlur={focusOff} dir="ltr" />
                </div>
                {error && <div style={{ background:'rgba(255,106,0,.1)',border:'1px solid rgba(255,106,0,.25)',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#FF6B47',textAlign:'center' }}>{error}</div>}
                <button type="submit" disabled={loading} style={{ width:'100%',padding:'14px',borderRadius:12,background:loading?'rgba(255,106,0,.5)':'#FF6A00',border:'none',color:'#fff',fontSize:15,fontWeight:700,cursor:loading?'not-allowed':'pointer' }}>
                  {loading ? '...' : '📧 إرسال رمز التحقق'}
                </button>
              </form>
            </>
          )}

          {/* ── LOGIN / REGISTER ── */}
          {(view === 'login' || view === 'register') && (
            <>
              {/* Tabs */}
              <div style={{ display:'flex', background:'rgba(0,0,0,.35)', borderRadius:12, padding:3, marginBottom:22, gap:3 }}>
                {[['login','تسجيل الدخول'],['register','إنشاء حساب']].map(([v,label]) => (
                  <button key={v} onClick={() => { setView(v as View); setError(''); }}
                    style={{ flex:1, padding:'9px 0', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', border:'none', transition:'all .18s',
                      background: view===v ? '#FF6A00' : 'transparent',
                      color: view===v ? '#fff' : 'rgba(255,255,255,.35)',
                      boxShadow: view===v ? '0 3px 14px rgba(255,106,0,.35)' : 'none',
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>

                {view === 'register' && (
                  <>
                    <div style={{ position:'relative' }}>
                      <User size={14} style={{ position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,.25)',pointerEvents:'none' }}/>
                      <input type="text" placeholder="اسمك الكامل" required value={form.name} onChange={e=>set('name',e.target.value)} style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                    </div>
                    <div style={{ position:'relative' }}>
                      <Store size={14} style={{ position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,.25)',pointerEvents:'none' }}/>
                      <input type="text" placeholder="اسم متجرك" required value={form.storeName} onChange={e=>set('storeName',e.target.value)} style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                    </div>
                  </>
                )}

                <div style={{ position:'relative' }}>
                  <Mail size={14} style={{ position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,.25)',pointerEvents:'none' }}/>
                  <input type="email" placeholder="البريد الإلكتروني" required value={form.email} onChange={e=>set('email',e.target.value)}
                    style={{ ...inputStyle, direction:'ltr' }} onFocus={focusOn} onBlur={focusOff} />
                </div>

                <div style={{ position:'relative' }}>
                  <Lock size={14} style={{ position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,.25)',pointerEvents:'none' }}/>
                  <input type={showPwd?'text':'password'} placeholder="كلمة المرور" required value={form.password} onChange={e=>set('password',e.target.value)}
                    style={{ ...inputStyle, padding:'13px 40px 13px 40px', direction:'ltr' }} onFocus={focusOn} onBlur={focusOff} />
                  <button type="button" onClick={()=>setShowPwd(v=>!v)}
                    style={{ position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,.3)',padding:0,display:'flex' }}>
                    {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>

                {view === 'login' && (
                  <div style={{ textAlign:'left' }}>
                    <button type="button" onClick={() => { setView('forgot-email'); setError(''); }}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.35)', fontSize:12, padding:0 }}>
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
                  {loading ? '...' : view === 'login' ? '🔑 دخول' : '🚀 إنشاء الحساب'}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
