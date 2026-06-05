import { useState } from 'react';
import { useStore } from '../store';
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

type Step = 'welcome' | 'type' | 'brand' | 'cloud' | 'connect' | 'ai' | 'done';
const ORDER: Step[] = ['welcome', 'type', 'brand', 'cloud', 'connect', 'ai', 'done'];

const BTYPE_OPTIONS = [
  { id: 'products',         icon: '📦', title: 'بائع منتجات',      sub: 'ملابس، أحذية، إلكترونيات...',       color: '#FF6A00' },
  { id: 'services',         icon: '🔧', title: 'مقدم خدمات',        sub: 'سباك، كهربائي، مصمم، مدرّس...',     color: '#8B5CF6' },
  { id: 'digital',          icon: '💻', title: 'منتجات رقمية',      sub: 'دروس، كتب، برامج، اشتراكات...',    color: '#0EA5E9' },
  { id: 'mixed',            icon: '🏪', title: 'متجر متكامل',       sub: 'منتجات + خدمات معاً',              color: '#00D2B3' },
];

export default function Onboarding() {
  const { settings, updateSettings, setOnboardingCompleted, setPage } = useStore();
  const [step, setStep] = useState<Step>('welcome');
  const [brand, setBrand] = useState({ name: '', currency: 'MAD', phone: '' });
  const [ai, setAi] = useState({ personality: 'Moroccan Seller', language: 'Darija', tone: 'Friendly' });
  const [businessType, setBusinessType] = useState('products');
  const [cloudStatus, setCloudStatus] = useState<{supabase: 'idle'|'testing'|'ok'|'fail'; cloudinary: 'idle'|'testing'|'ok'|'fail'}>({ supabase: 'idle', cloudinary: 'idle' });

  const idx = ORDER.indexOf(step);
  const pct = (idx / (ORDER.length - 1)) * 100;
  const next = () => { if (idx < ORDER.length - 1) setStep(ORDER[idx + 1]); };
  const prev = () => { if (idx > 0) setStep(ORDER[idx - 1]); };
  const finish = () => {
    if (brand.name) updateSettings('brand', { ...settings.brand, ...brand, name: brand.name || 'متجري' });
    updateSettings('ai', { ...settings.ai, ...ai });
    updateSettings('businessType' as any, businessType);
    updateSettings('onboardingDone', true as any);
    setOnboardingCompleted(true);
    setPage('dashboard');
  };
  const skip = () => {
    updateSettings('brand', { ...settings.brand, name: 'متجري' });
    updateSettings('onboardingDone', true as any);
    setOnboardingCompleted(true);
    setPage('dashboard');
  };
  const testCloud = async (service: 'supabase' | 'cloudinary') => {
    setCloudStatus(s => ({ ...s, [service]: 'testing' }));
    try {
      const r = await fetch('/api/settings/server-config');
      const data = await r.json();
      const ok = service === 'supabase' ? !!data.supabase : !!data.cloudinary;
      setCloudStatus(s => ({ ...s, [service]: ok ? 'ok' : 'fail' }));
    } catch {
      setCloudStatus(s => ({ ...s, [service]: 'fail' }));
    }
  };

  return (
    <div dir="rtl" style={{
      minHeight: '100dvh', 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px', position: 'relative', overflow: 'hidden',
      zIndex: 1, /* Sit above the global background */
    }}>
      {/* Subtle grid for tech feel */}
      <div className="bg-grid" style={{ opacity: 0.05, position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 460 }}>
        {/* Progress */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            {ORDER.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < ORDER.length - 1 ? 1 : 'none' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i < idx ? 'var(--clr-pri-g)' : i === idx ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.06)',
                  border: `2px solid ${i <= idx ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.1)'}`,
                  transition: 'all .3s',
                }}>
                  {i < idx ? <CheckCircle size={16} color="#fff" /> :
                   <span style={{ fontSize: 12, fontWeight: 900, color: i === idx ? 'var(--clr-pri-h)' : 'var(--txt-3)' }}>{i + 1}</span>}
                </div>
                {i < ORDER.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: i < idx ? 'rgba(99,102,241,0.5)' : 'var(--clr-border)', margin: '0 6px', transition: 'background .4s' }} />
                )}
              </div>
            ))}
          </div>
          <div className="progress-bar" style={{ height: 4 }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Card */}
        <div className="card card-lg anim-scale-in" key={step} style={{ padding: '32px 28px' }}>

          {/* WELCOME */}
          {step === 'welcome' && (
            <div style={{ textAlign: 'center' }}>
              <img src="/ai-bot.png" alt="AI Assistant" className="float" style={{ width: 100, height: 100, marginBottom: 12, display: 'block', margin: '0 auto 12px', filter: 'drop-shadow(0 0 20px rgba(99,102,241,0.5))' }} />
              <img src="/logo-sahar.png" alt="Sahar Shop" style={{ width: 80, height: 80, margin: '0 auto 8px', display: 'block', filter: 'drop-shadow(0 0 15px rgba(249,115,22,0.4))' }} />
              <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
                مرحباً في <span style={{ background: 'linear-gradient(135deg,#f97316,#ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sahar Shop</span>
              </h1>
              <p style={{ fontSize: 14, color: 'var(--txt-3)', lineHeight: 1.8, marginBottom: 28 }}>
                نظام ذكي للتجار المغاربة — أضف منتجاتك، وAI يبيع ويرد تلقائياً بالدارجة
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28 }}>
                {[
                  { e: '📸', t: 'أضف منتج' },
                  { e: '🤖', t: 'AI يبيع' },
                  { e: '🚚', t: 'توصيل تلقائي' },
                ].map((item, i) => (
                  <div key={i} className="card" style={{ padding: '14px 8px', textAlign: 'center' }}>
                    <span style={{ fontSize: 26, display: 'block', marginBottom: 5 }}>{item.e}</span>
                    <span style={{ fontSize: 11.5, color: 'var(--txt-3)', fontWeight: 700 }}>{item.t}</span>
                  </div>
                ))}
              </div>
              <button onClick={next} className="btn btn-primary btn-xl" style={{ width: '100%', justifyContent: 'center' }}>
                ابدأ الإعداد — 3 دقائق فقط
              </button>
              <button onClick={skip} style={{ marginTop: 14, color: 'var(--txt-3)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', display: 'block', width: '100%' }}>
                تخطي والدخول مباشرة
              </button>
            </div>
          )}

          {/* TYPE */}
          {step === 'type' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <span style={{ fontSize: 42, display: 'block', marginBottom: 8 }}>🏪</span>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--txt-1)' }}>ما نوع نشاطك التجاري؟</h2>
                <p style={{ fontSize: 13, color: 'var(--txt-3)', marginTop: 4 }}>سنضبط التطبيق حسب احتياجاتك</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                {BTYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setBusinessType(opt.id)}
                    style={{
                      padding: '16px 12px', borderRadius: 16, textAlign: 'center', cursor: 'pointer',
                      border: `2px solid ${businessType === opt.id ? opt.color : 'var(--clr-border)'}`,
                      background: businessType === opt.id ? `${opt.color}15` : 'rgba(255,255,255,0.04)',
                      transition: 'all .18s',
                    }}
                  >
                    <span style={{ fontSize: 30, display: 'block', marginBottom: 6 }}>{opt.icon}</span>
                    <p style={{ fontSize: 13, fontWeight: 900, color: businessType === opt.id ? opt.color : 'var(--txt-1)', marginBottom: 4 }}>{opt.title}</p>
                    <p style={{ fontSize: 10.5, color: 'var(--txt-3)', lineHeight: 1.4 }}>{opt.sub}</p>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={prev} className="btn btn-ghost" style={{ paddingInline: 14 }}><ChevronRight size={18} /></button>
                <button onClick={next} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  التالي <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          )}

          {/* BRAND */}
          {step === 'brand' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <span style={{ fontSize: 42, display: 'block', marginBottom: 8 }}>🏪</span>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--txt-1)' }}>معلومات متجرك</h2>
                <p style={{ fontSize: 13, color: 'var(--txt-3)', marginTop: 4 }}>سيظهر هذا لزبائنك</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                <div>
                  <label className="label">اسم المتجر *</label>
                  <input className="input" placeholder="مثال: متجر الأناقة" value={brand.name}
                    onChange={e => setBrand(p => ({ ...p, name: e.target.value }))} autoFocus />
                </div>
                <div>
                  <label className="label">رقم الهاتف</label>
                  <input className="input" placeholder="+212 6XX XXX XXX" value={brand.phone}
                    onChange={e => setBrand(p => ({ ...p, phone: e.target.value }))} dir="ltr" />
                </div>
                <div>
                  <label className="label">العملة</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {['MAD','EUR','USD','GBP'].map(c => (
                      <button key={c} onClick={() => setBrand(p => ({ ...p, currency: c }))}
                        style={{
                          padding: '10px 6px', borderRadius: 10, fontSize: 13, fontWeight: 800,
                          border: `1.5px solid ${brand.currency === c ? 'rgba(99,102,241,0.5)' : 'var(--clr-border)'}`,
                          background: brand.currency === c ? 'rgba(99,102,241,0.14)' : 'rgba(255,255,255,0.04)',
                          color: brand.currency === c ? 'var(--clr-pri-h)' : 'var(--txt-3)',
                          cursor: 'pointer', transition: 'all .18s',
                        }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={prev} className="btn btn-ghost" style={{ paddingInline: 14 }}><ChevronRight size={18} /></button>
                <button onClick={next} disabled={!brand.name.trim()} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  التالي <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          )}

          {/* CLOUD */}
          {step === 'cloud' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <span style={{ fontSize: 42, display: 'block', marginBottom: 8 }}>☁️</span>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--txt-1)' }}>إعداد السحابة</h2>
                <p style={{ fontSize: 13, color: 'var(--txt-3)', marginTop: 4 }}>لحفظ بياناتك بأمان وإتاحة صورك عبر الإنترنت</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {[
                  { key: 'supabase' as const, icon: '🗄️', name: 'Supabase', sub: 'قاعدة البيانات السحابية', desc: 'يحفظ طلباتك وزبائنك ومنتجاتك بأمان' },
                  { key: 'cloudinary' as const, icon: '🖼️', name: 'Cloudinary', sub: 'تخزين الصور السحابي', desc: 'صور المنتجات تُحفظ في السحابة وتُتاح بسرعة' },
                ].map(svc => {
                  const status = cloudStatus[svc.key];
                  return (
                    <div key={svc.key} style={{ padding: '16px', borderRadius: 14, border: `1px solid ${status === 'ok' ? 'rgba(16,185,129,.35)' : status === 'fail' ? 'rgba(239,68,68,.3)' : 'var(--clr-border)'}`, background: status === 'ok' ? 'rgba(16,185,129,.07)' : status === 'fail' ? 'rgba(239,68,68,.06)' : 'rgba(255,255,255,.03)', transition: 'all .3s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 28 }}>{svc.icon}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--txt-1)' }}>{svc.name}</p>
                          <p style={{ fontSize: 11.5, color: 'var(--txt-3)' }}>{svc.desc}</p>
                        </div>
                        <button
                          onClick={() => testCloud(svc.key)}
                          disabled={status === 'testing'}
                          style={{ padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, border: '1px solid var(--clr-border)', background: 'rgba(255,255,255,.06)', color: 'var(--txt-2)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                          {status === 'testing' ? '⏳ ...' : status === 'ok' ? '✅ متصل' : status === 'fail' ? '❌ فشل' : '🔍 اختبار'}
                        </button>
                      </div>
                      {status === 'ok' && (
                        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                          <p style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>
                            {svc.key === 'supabase' ? '✓ Database Connected · ✓ Backup Enabled' : '✓ Storage Connected · ✓ Images Upload Working'}
                          </p>
                        </div>
                      )}
                      {status === 'fail' && (
                        <p style={{ marginTop: 8, fontSize: 11, color: 'rgba(239,68,68,.8)' }}>
                          {svc.key === 'supabase' ? 'تأكد من إضافة SUPABASE_URL في إعدادات Railway' : 'تأكد من إضافة CLOUDINARY_URL في إعدادات Railway'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,106,0,.06)', border: '1px solid rgba(255,106,0,.15)', marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: 'rgba(255,106,0,.8)', fontWeight: 600 }}>
                  💡 إن لم تكن متصلاً بالسحابة، ستُحفظ بياناتك محلياً ولن تُفقد — يمكنك الربط لاحقاً من صفحة الاتصالات
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={prev} className="btn btn-ghost" style={{ paddingInline: 14 }}><ChevronRight size={18} /></button>
                <button onClick={next} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  التالي <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          )}

          {/* CONNECT */}
          {step === 'connect' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <span style={{ fontSize: 42, display: 'block', marginBottom: 8 }}>🔗</span>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--txt-1)' }}>ربط الحسابات</h2>
                <p style={{ fontSize: 13, color: 'var(--txt-3)', marginTop: 4 }}>يمكنك ربطها لاحقاً من إعدادات الربط</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {[
                  { icon: '💬', name: 'WhatsApp Business', color: 'rgba(37,211,102,0.12)', border: 'rgba(37,211,102,0.25)', guide: 'يحتاج Meta for Developers App' },
                  { icon: '📘', name: 'Facebook Page', color: 'rgba(24,119,242,0.10)', border: 'rgba(24,119,242,0.22)', guide: 'Page ID + Access Token' },
                  { icon: '📸', name: 'Instagram Business', color: 'rgba(225,48,108,0.10)', border: 'rgba(225,48,108,0.22)', guide: 'مرتبط بصفحة Facebook' },
                  { icon: '🧠', name: 'OpenAI / Gemini', color: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.22)', guide: 'للردود الذكية الحقيقية' },
                ].map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 14, background: p.color, border: `1px solid ${p.border}` }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{p.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--txt-1)' }}>{p.name}</p>
                      <p style={{ fontSize: 11.5, color: 'var(--txt-3)' }}>{p.guide}</p>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--txt-3)', background: 'rgba(255,255,255,0.07)', border: '1px solid var(--clr-border)', padding: '3px 9px', borderRadius: 7 }}>لاحقاً</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={prev} className="btn btn-ghost" style={{ paddingInline: 14 }}><ChevronRight size={18} /></button>
                <button onClick={next} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  التالي <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          )}

          {/* AI */}
          {step === 'ai' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <span style={{ fontSize: 42, display: 'block', marginBottom: 8 }}>🤖</span>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--txt-1)' }}>شخصية AI</h2>
                <p style={{ fontSize: 13, color: 'var(--txt-3)', marginTop: 4 }}>كيف يتحدث المساعد مع زبائنك؟</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                <div>
                  <label className="label">الشخصية</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {[
                      { val: 'Moroccan Seller', label: '🇲🇦 بائع مغربي', sub: 'دارجة + محلي' },
                      { val: 'Professional', label: '💼 احترافي', sub: 'رسمي وموثوق' },
                      { val: 'Friendly', label: '😊 ودود', sub: 'بسيط وقريب' },
                      { val: 'Luxury', label: '💎 فاخر', sub: 'راقٍ وأنيق' },
                    ].map(opt => (
                      <button key={opt.val} onClick={() => setAi(p => ({ ...p, personality: opt.val }))}
                        style={{
                          padding: '12px 10px', borderRadius: 12, textAlign: 'right',
                          border: `1.5px solid ${ai.personality === opt.val ? 'rgba(99,102,241,0.45)' : 'var(--clr-border)'}`,
                          background: ai.personality === opt.val ? 'rgba(99,102,241,0.13)' : 'rgba(255,255,255,0.04)',
                          cursor: 'pointer', transition: 'all .18s',
                        }}>
                        <p style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--txt-1)' }}>{opt.label}</p>
                        <p style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }}>{opt.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">لغة الردود</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[['Darija','🇲🇦 دارجة'],['Arabic','🌙 عربية'],['French','🇫🇷 فرنسية']].map(([val, label]) => (
                      <button key={val} onClick={() => setAi(p => ({ ...p, language: val }))}
                        style={{
                          padding: '10px 6px', borderRadius: 10, fontSize: 13, fontWeight: 800,
                          border: `1.5px solid ${ai.language === val ? 'rgba(249,115,22,0.4)' : 'var(--clr-border)'}`,
                          background: ai.language === val ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.04)',
                          color: ai.language === val ? 'var(--clr-accent-h)' : 'var(--txt-3)',
                          cursor: 'pointer', transition: 'all .18s',
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={prev} className="btn btn-ghost" style={{ paddingInline: 14 }}><ChevronRight size={18} /></button>
                <button onClick={next} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  التالي <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          )}

          {/* DONE */}
          {step === 'done' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                background: 'linear-gradient(135deg,#10b981,#06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: 36,
                boxShadow: '0 0 40px rgba(16,185,129,0.3)',
              }}>🚀</div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--txt-1)', marginBottom: 8 }}>كل شيء جاهز!</h2>
              <p style={{ fontSize: 13.5, color: 'var(--txt-3)', lineHeight: 1.8, marginBottom: 24 }}>
                متجر <strong style={{ color: 'var(--txt-1)' }}>{brand.name || 'متجرك'}</strong> جاهز للعمل
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, textAlign: 'right' }}>
                {[
                  `✅ نوع النشاط: ${BTYPE_OPTIONS.find(o => o.id === businessType)?.title || businessType}`,
                  `✅ اسم المتجر: ${brand.name || 'متجري'}`,
                  `✅ العملة: ${brand.currency}`,
                  `✅ مساعد AI: ${ai.personality} · ${ai.language}`,
                  `⏳ ربط الحسابات: من إعدادات الربط`,
                ].map((item, i) => (
                  <div key={i} className="card card-sm" style={{ padding: '10px 14px', fontSize: 13, color: 'var(--txt-2)' }}>{item}</div>
                ))}
              </div>
              <button onClick={finish} className="btn btn-accent btn-xl" style={{ width: '100%', justifyContent: 'center' }}>
                ادخل للوحة التحكم 🎉
              </button>
            </div>
          )}
        </div>

        {step !== 'welcome' && step !== 'done' && (
          <button onClick={skip} style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 14, color: 'var(--txt-3)', fontSize: 12.5, background: 'none', border: 'none', cursor: 'pointer' }}>
            تخطي الإعداد
          </button>
        )}
      </div>
    </div>
  );
}
