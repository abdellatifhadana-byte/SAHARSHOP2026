import { useState, useCallback } from 'react';
import { useStore } from '../store';
import { Wifi, CheckCircle, Loader2, Eye, EyeOff, AlertTriangle, ExternalLink, RefreshCw, Zap } from 'lucide-react';
import { IconWhatsApp, IconFacebook, IconInstagram, IconTikTok } from '../components/icons';

const SERVICES = [
  {
    id: 'whatsapp', name: 'WhatsApp Business', Icon: IconWhatsApp, grad: 'linear-gradient(135deg,#25d366,#128C7E)', desc: 'استقبال وإرسال الرسائل تلقائياً',
    fields: [
      { key: 'phoneId', label: 'Phone Number ID', ph: '123456789012345', help: 'Meta for Developers → WhatsApp → Configuration' },
      { key: 'accessToken', label: 'Access Token', ph: 'EAAxxxxxxx...', help: 'Token الوصول الدائم من Meta Business Manager', secret: true },
    ],
    guide: ['اذهب لـ developers.facebook.com', 'أنشئ App من نوع Business', 'فعّل WhatsApp من المنتجات', 'انسخ Phone Number ID و Access Token'],
    url: 'https://business.whatsapp.com/products/business-platform',
  },
  {
    id: 'facebook', name: 'Facebook Page', Icon: IconFacebook, grad: 'linear-gradient(135deg,#1877f2,#0a4fa8)', desc: 'نشر المنتجات والرد على التعليقات',
    fields: [
      { key: 'pageId', label: 'Page ID', ph: '123456789', help: 'معرّف صفحتك من إعدادات الصفحة' },
      { key: 'accessToken', label: 'Page Access Token', ph: 'EAAxxxxxxx...', help: 'من Graph API Explorer باختيار الصفحة', secret: true },
    ],
    guide: ['اذهب لـ Graph API Explorer', 'اختر تطبيقك', 'اختر صفحتك', 'انسخ Page Access Token'],
    url: 'https://developers.facebook.com/tools/explorer',
  },
  {
    id: 'instagram', name: 'Instagram Business', Icon: IconInstagram, grad: 'linear-gradient(135deg,#e1306c,#833ab4)', desc: 'نشر Stories & Reels والرسائل المباشرة',
    fields: [
      { key: 'pageId', label: 'Instagram Account ID', ph: '17841400000000000', help: 'معرّف حساب Instagram Business' },
      { key: 'accessToken', label: 'Access Token', ph: 'EAAxxxxxxx...', help: 'نفس Token ديال Facebook', secret: true },
    ],
    guide: ['اربط Instagram بصفحة Facebook', 'اطلب Instagram Graph API', 'احصل على Account ID', 'نفس Token ديال Facebook'],
    url: 'https://developers.facebook.com/docs/instagram-api',
  },
  {
    id: 'openai', name: 'OpenAI (GPT)', icon: '🧠', grad: 'linear-gradient(135deg,#10b981,#059669)', desc: 'ردود ذكية حقيقية بدون محاكاة',
    fields: [
      { key: 'apiKey', label: 'API Key', ph: 'sk-proj-...', help: 'من platform.openai.com/api-keys', secret: true },
    ],
    guide: ['سجل على platform.openai.com', 'اذهب لـ API Keys', 'أنشئ مفتاحاً جديداً', 'انسخه هنا'],
    url: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'gemini', name: 'Google Gemini (مجاني)', icon: '🤖', grad: 'linear-gradient(135deg,#4285f4,#ea4335)', desc: 'بديل مجاني — 15 طلب/دقيقة',
    fields: [
      { key: 'geminiKey', label: 'Gemini API Key', ph: 'AIzaSy...', help: 'من aistudio.google.com/app/apikey', secret: true },
    ],
    guide: ['اذهب لـ aistudio.google.com', 'سجل بحساب Google', 'اضغط Get API Key', 'انسخه هنا'],
    url: 'https://aistudio.google.com/app/apikey',
  },
  {
    id: 'tiktok', name: 'TikTok for Business', Icon: IconTikTok, grad: 'linear-gradient(135deg,#000000,#25f4ee)', desc: 'نشر الفيديوهات وإدارة الإعلانات',
    fields: [
      { key: 'accessToken', label: 'Access Token', ph: 'act_xxxxx...', help: 'من TikTok Ads Manager', secret: true },
      { key: 'advertiserId', label: 'Advertiser ID', ph: '123456789', help: 'معرّف المعلن' },
    ],
    guide: ['اذهب لـ ads.tiktok.com', 'أنشئ حساب Ads Manager', 'اذهب إلى Tools > API', 'أنشئ Access Token'],
    url: 'https://ads.tiktok.com',
  },
  {
    id: 'supabase', name: 'Supabase', icon: '⚡', grad: 'linear-gradient(135deg,#3ecf8e,#1a7a4c)', desc: 'قاعدة بيانات سحابية — نسخة احتياطية تلقائية',
    fields: [
      { key: 'supabaseUrl', label: 'Project URL', ph: 'https://xxxx.supabase.co', help: 'من Settings → API في مشروعك', direct: true },
      { key: 'supabaseKey', label: 'Anon Key', ph: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', help: 'المفتاح العام (anon/public)', secret: true, direct: true },
    ],
    guide: ['اذهب لـ supabase.com وأنشئ مشروعاً', 'اذهب لـ Settings → API', 'انسخ Project URL', 'انسخ anon public key'],
    url: 'https://supabase.com',
  },
  {
    id: 'cloudinary', name: 'Cloudinary', icon: '☁️', grad: 'linear-gradient(135deg,#3448c5,#6875f5)', desc: 'رفع وتخزين الصور تلقائياً — CDN عالمي',
    fields: [
      { key: 'cloudinaryCloudName', label: 'Cloud Name', ph: 'my-store', help: 'من Dashboard → Cloud Name', direct: true },
      { key: 'cloudinaryApiKey', label: 'API Key', ph: '123456789012345', help: 'من Settings → Access Keys', direct: true },
      { key: 'cloudinaryApiSecret', label: 'API Secret', ph: 'xxxxxxxxxxxxxxxxxxxxxxxx', help: 'من Settings → Access Keys', secret: true, direct: true },
    ],
    guide: ['سجل على cloudinary.com', 'اذهب لـ Dashboard', 'انسخ Cloud Name', 'من Settings → Access Keys انسخ API Key و Secret'],
    url: 'https://cloudinary.com',
  },
];

// Service IDs that store directly in settings (not in settings.social)
const DIRECT_FIELDS = new Set(['supabase', 'cloudinary']);

const FIELD_KEY_MAP: Record<string, string> = {
  'supabase.supabaseUrl': 'supabaseUrl',
  'supabase.supabaseKey': 'supabaseKey',
  'cloudinary.cloudinaryCloudName': 'cloudinaryCloudName',
  'cloudinary.cloudinaryApiKey': 'cloudinaryApiKey',
  'cloudinary.cloudinaryApiSecret': 'cloudinaryApiSecret',
};

export default function ConnectionsPage() {
  const { settings, updateSettings, notify } = useStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; info?: string } | null>>({});
  const [testingAll, setTestingAll] = useState(false);

  const stored = (id: string, key: string): string => {
    if (id === 'openai') return settings.ai.apiKey || '';
    if (id === 'gemini') return settings.ai.geminiKey || '';
    if (id === 'supabase') return (settings as any)[key] || '';
    if (id === 'cloudinary') return (settings as any)[key] || '';
    const s = settings.social[id as keyof typeof settings.social];
    return !s ? '' : key === 'pageId' || key === 'phoneId' ? (s.pageId || '') : key === 'advertiserId' ? ((s as any).advertiserId || '') : (s.accessToken || '');
  };

  const val = (id: string, k: string) => values[id]?.[k] ?? stored(id, k);
  const setVal = (id: string, k: string, v: string) => setValues(p => ({ ...p, [id]: { ...(p[id] || {}), [k]: v } }));

  const isConnected = (id: string) => {
    if (id === 'openai') return !!settings.ai.apiKey;
    if (id === 'gemini') return !!settings.ai.geminiKey;
    if (id === 'supabase') return !!(settings as any).supabaseUrl && !!(settings as any).supabaseKey;
    if (id === 'cloudinary') return !!(settings as any).cloudinaryCloudName && !!(settings as any).cloudinaryApiKey;
    return settings.social[id as keyof typeof settings.social]?.connected || false;
  };

  const getToken = () => localStorage.getItem('ai_commerce_token') || '';

  const connect = useCallback(async (svc: typeof SERVICES[0]) => {
    const allFilled = svc.fields.every(f => val(svc.id, f.key).trim());
    if (!allFilled) { notify('error', 'يرجى ملء جميع الحقول'); return; }
    setLoading(p => ({ ...p, [svc.id]: true }));
    let ok = false;
    try {
      if (svc.id === 'openai') {
        const r = await fetch('/api/settings/verify-connection', {
          method: 'POST', signal: AbortSignal.timeout(12000),
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
          body: JSON.stringify({ service: 'openai', apiKey: val('openai', 'apiKey') }),
        });
        const d = await r.json();
        ok = d.ok;
        if (ok) { updateSettings('ai', { ...settings.ai, apiKey: val('openai', 'apiKey'), provider: 'openai' }); notify('success', `✅ OpenAI متصل! ${d.info || ''}`); }
        else notify('error', `❌ مفتاح OpenAI غير صحيح: ${d.error}`);

      } else if (svc.id === 'gemini') {
        const r = await fetch('/api/settings/verify-connection', {
          method: 'POST', signal: AbortSignal.timeout(12000),
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
          body: JSON.stringify({ service: 'gemini', apiKey: val('gemini', 'geminiKey') }),
        });
        const d = await r.json();
        ok = d.ok;
        if (ok) { updateSettings('ai', { ...settings.ai, geminiKey: val('gemini', 'geminiKey'), provider: 'gemini' }); notify('success', `✅ Gemini متصل! ${d.info || ''}`); }
        else notify('error', `❌ مفتاح Gemini غير صحيح: ${d.error}`);

      } else if (svc.id === 'supabase') {
        const url = val('supabase', 'supabaseUrl');
        const key = val('supabase', 'supabaseKey');
        try {
          const r = await fetch(`${url}/rest/v1/`, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }, signal: AbortSignal.timeout(8000) });
          ok = r.status < 400;
        } catch { ok = false; }
        if (ok) {
          updateSettings('supabaseUrl' as any, url);
          updateSettings('supabaseKey' as any, key);
          updateSettings('cloudEnabled' as any, true);
          notify('success', '✅ Supabase متصل!');
        } else notify('error', '❌ URL أو Key غير صحيح');

      } else if (svc.id === 'cloudinary') {
        const cn = val('cloudinary', 'cloudinaryCloudName');
        const ak = val('cloudinary', 'cloudinaryApiKey');
        const as_ = val('cloudinary', 'cloudinaryApiSecret');
        try {
          const auth64 = btoa(`${ak}:${as_}`);
          const r = await fetch(`/api/settings/verify-connection`, {
            method: 'POST', signal: AbortSignal.timeout(10000),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify({ service: 'cloudinary', cloudName: cn, apiKey: ak, apiSecret: as_ }),
          });
          const d = await r.json();
          ok = d.ok;
        } catch { ok = false; }
        if (ok) {
          updateSettings('cloudinaryCloudName' as any, cn);
          updateSettings('cloudinaryApiKey' as any, ak);
          updateSettings('cloudinaryApiSecret' as any, as_);
          notify('success', '✅ Cloudinary متصل!');
        } else notify('error', '❌ بيانات Cloudinary غير صحيحة');

      } else {
        const token2 = val(svc.id, 'accessToken');
        const pageId = val(svc.id, 'pageId') || val(svc.id, 'phoneId') || '';
        const r = await fetch('/api/settings/verify-connection', {
          method: 'POST', signal: AbortSignal.timeout(12000),
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
          body: JSON.stringify({ service: svc.id, token: token2, pageId }),
        });
        const d = await r.json();
        ok = d.ok;
        if (ok) {
          updateSettings('social', { ...settings.social, [svc.id]: { ...settings.social[svc.id as keyof typeof settings.social], connected: true, pageId, accessToken: token2, name: d.name || svc.name } });
          notify('success', `✅ ${svc.name} متصل${d.name ? ` — ${d.name}` : ''}!`);
        } else {
          notify('error', `❌ ${svc.name}: ${d.error || 'Token غير صحيح'}`);
        }
      }
    } catch (e: any) { notify('error', `❌ ${e.message || 'خطأ في الاتصال'}`); }
    setLoading(p => ({ ...p, [svc.id]: false }));
  }, [values, settings, updateSettings, notify]);

  const disconnect = (svc: typeof SERVICES[0]) => {
    if (svc.id === 'openai') updateSettings('ai', { ...settings.ai, apiKey: '' });
    else if (svc.id === 'gemini') updateSettings('ai', { ...settings.ai, geminiKey: '' });
    else if (svc.id === 'supabase') { updateSettings('supabaseUrl' as any, ''); updateSettings('supabaseKey' as any, ''); }
    else if (svc.id === 'cloudinary') { updateSettings('cloudinaryCloudName' as any, ''); updateSettings('cloudinaryApiKey' as any, ''); updateSettings('cloudinaryApiSecret' as any, ''); }
    else updateSettings('social', { ...settings.social, [svc.id]: { ...settings.social[svc.id as keyof typeof settings.social], connected: false, pageId: '', accessToken: '' } });
    setTestResults(p => ({ ...p, [svc.id]: null }));
    notify('warning', `🔌 تم قطع الاتصال بـ ${svc.name}`);
  };

  const testAll = async () => {
    setTestingAll(true);
    try {
      const r = await fetch('/api/settings/verify-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      });
      const results = await r.json();
      setTestResults(results);
      const ok = Object.values(results).filter((v: any) => v?.ok).length;
      const total = Object.keys(results).length;
      notify(ok === total ? 'success' : 'warning', `${ok === total ? '✅' : '⚠️'} ${ok}/${total} اتصالات تعمل`);
    } catch (e: any) {
      notify('error', `❌ خطأ في الاختبار: ${e.message}`);
    }
    setTestingAll(false);
  };

  const connected = SERVICES.filter(s => isConnected(s.id)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 className="page-title">ربط الخدمات</h1>
        <p className="page-sub">اربط حساباتك مرة واحدة — النظام يتكفل بالباقي</p>
      </div>

      {/* Progress + Test All */}
      <div className="card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--txt-1)' }}>حالة الاتصالات</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: connected === SERVICES.length ? '#34d399' : 'var(--clr-warn)' }}>{connected}/{SERVICES.length}</span>
            <button onClick={testAll} disabled={testingAll || connected === 0} className="btn btn-ghost btn-sm" style={{ gap: 6, opacity: connected === 0 ? 0.4 : 1 }}>
              {testingAll ? <Loader2 size={13} className="spin" /> : <Zap size={13} />}
              اختبار جميع الاتصالات
            </button>
          </div>
        </div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${(connected / SERVICES.length) * 100}%` }} /></div>
        {connected === 0 && <p style={{ fontSize: 12, color: 'var(--txt-3)', marginTop: 8, textAlign: 'center' }}>التطبيق يعمل بمحاكاة ذكية بدون ربط — الربط للنشر الحقيقي فقط</p>}
      </div>

      {/* Services */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SERVICES.map(svc => {
          const conn = isConnected(svc.id);
          const open = expanded === svc.id;
          const testResult = testResults[svc.id];
          return (
            <div key={svc.id} className="card" style={{ overflow: 'hidden', borderColor: conn ? (testResult === null ? 'var(--border)' : testResult?.ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)') : conn ? 'rgba(16,185,129,0.25)' : undefined }}>
              {/* Header */}
              <div onClick={() => setExpanded(open ? null : svc.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', cursor: 'pointer', transition: 'background .18s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: svc.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,0.3)', overflow: 'hidden', padding: 6 }}>
                  {(() => { const SvcIcon = (svc as any).Icon; return SvcIcon ? <SvcIcon /> : <span style={{ fontSize: 22 }}>{(svc as any).icon}</span>; })()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--txt-1)' }}>{svc.name}</p>
                    {conn && <CheckCircle size={15} color="#34d399" />}
                    {testResult && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 99, background: testResult.ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: testResult.ok ? '#34d399' : '#f87171' }}>
                        {testResult.ok ? `✅ يعمل${testResult.info ? ` · ${testResult.info}` : ''}` : '❌ لا يعمل'}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--txt-3)', marginTop: 2 }}>{svc.desc}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {conn && <button onClick={e => { e.stopPropagation(); disconnect(svc); }} className="btn btn-danger btn-sm" style={{ fontSize: 12 }}>قطع</button>}
                  {loading[svc.id] ? <Loader2 size={16} className="spin" style={{ color: 'var(--clr-pri-h)' }} /> : conn ? <CheckCircle size={16} color="#34d399" /> : <Wifi size={16} color="var(--txt-3)" />}
                </div>
              </div>

              {/* Body */}
              {open && (
                <div className="anim-fade-in" style={{ borderTop: '1px solid var(--clr-border)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Guide */}
                  <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--clr-pri-h)' }}>كيف تحصل على هذه المعلومات؟</p>
                      <a href={svc.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--clr-pri-h)', textDecoration: 'none', fontWeight: 700 }}>
                        الدليل الرسمي <ExternalLink size={12} />
                      </a>
                    </div>
                    <ol style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {svc.guide.map((step, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5 }}>
                          <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', color: 'var(--clr-pri-h)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>{i+1}</span>
                          <span style={{ color: 'rgba(165,180,252,0.75)' }}>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Fields */}
                  {svc.fields.map(f => {
                    const vk = `${svc.id}-${f.key}`;
                    return (
                      <div key={f.key}>
                        <label className="label">{f.label}</label>
                        <div style={{ position: 'relative' }}>
                          <input type={(f as any).secret && !visible[vk] ? 'password' : 'text'}
                            className="input" style={{ paddingLeft: (f as any).secret ? 42 : 14, fontFamily: 'monospace', fontSize: 13 }}
                            placeholder={f.ph} value={val(svc.id, f.key)} onChange={e => setVal(svc.id, f.key, e.target.value)} dir="ltr" />
                          {(f as any).secret && (
                            <button onClick={() => setVisible(p => ({ ...p, [vk]: !p[vk] }))}
                              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--txt-3)', cursor: 'pointer' }}>
                              {visible[vk] ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          )}
                        </div>
                        {f.help && <p style={{ fontSize: 11.5, color: 'var(--txt-3)', marginTop: 5 }}>{f.help}</p>}
                      </div>
                    );
                  })}

                  <button onClick={() => connect(svc)} disabled={loading[svc.id]} className={`btn ${conn ? 'btn-ghost' : 'btn-primary'}`} style={{ justifyContent: 'center' }}>
                    {loading[svc.id] ? <><Loader2 size={15} className="spin" /> جارٍ التحقق...</> : conn ? <><RefreshCw size={15} /> إعادة اختبار</> : <><Wifi size={15} /> اتصال وتحقق</>}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Security note */}
      <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12, borderColor: 'rgba(245,158,11,0.22)', background: 'rgba(245,158,11,0.04)' }}>
        <AlertTriangle size={18} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24', marginBottom: 3 }}>ملاحظة أمنية</p>
          <p style={{ fontSize: 12, color: 'var(--txt-3)', lineHeight: 1.6 }}>المفاتيح تُحفظ في متصفحك وترسل للخادم المحلي. لا تشاركها مع أحد. للاستخدام الاحترافي يُنصح بـ Backend + تشفير قاعدة البيانات.</p>
        </div>
      </div>
    </div>
  );
}
