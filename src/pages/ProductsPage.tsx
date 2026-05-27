import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Plus, Search, Edit3, Trash2, X, ChevronRight, ChevronLeft, Sparkles, Share2 } from 'lucide-react';
import type { Product, ProductStatus } from '../types';

const CATS = [
  { id: 'men',    icon: '👕', label: 'ملابس رجال',   color: '#3B82F6' },
  { id: 'women',  icon: '👗', label: 'ملابس نساء',   color: '#EC4899' },
  { id: 'kids',   icon: '🧒', label: 'أطفال',        color: '#F59E0B' },
  { id: 'shoes',  icon: '👟', label: 'أحذية',        color: '#8B5CF6' },
  { id: 'access', icon: '👜', label: 'أكسسوارات',   color: '#10B981' },
  { id: 'home',   icon: '🏠', label: 'ديكور ومنزل', color: '#F97316' },
  { id: 'other',  icon: '📦', label: 'أخرى',        color: '#6B7280' },
] as const;

const CAT_CFG: Record<string, {
  emoji: string;
  sizes: string[];
  colors: string[];
  fields: { id: string; label: string; options: string[] }[];
}> = {
  men: {
    emoji: '👕',
    sizes: ['XS','S','M','L','XL','XXL','XXXL'],
    colors: ['أسود','أبيض','رمادي','كحلي','بيج','أزرق','أحمر','زيتي'],
    fields: [
      { id: 'fabric',  label: 'نوع القماش',  options: ['قطن','جينز','صوف','كتان','بوليستر','حرير'] },
      { id: 'season',  label: 'الموسم',       options: ['صيف','شتاء','ربيع/خريف','كل الفصول'] },
      { id: 'subtype', label: 'نوع القطعة',   options: ['قميص','بنطال','جاكيت','تيشيرت','بوذي','سترة'] },
    ],
  },
  women: {
    emoji: '👗',
    sizes: ['XS','S','M','L','XL','XXL'],
    colors: ['أسود','أبيض','وردي','أحمر','بيج','نبيتي','تركواز','بنفسجي'],
    fields: [
      { id: 'fabric',  label: 'نوع القماش',  options: ['قطن','حرير','كريب','شيفون','جيرسي','قيفورة'] },
      { id: 'season',  label: 'الموسم',       options: ['صيف','شتاء','ربيع/خريف','كل الفصول'] },
      { id: 'subtype', label: 'نوع القطعة',   options: ['فستان','بلوزة','تيشيرت','بنطال','عباية','قفطان','تنورة'] },
    ],
  },
  kids: {
    emoji: '🧒',
    sizes: ['0-6m','6-12m','1-2Y','2-4Y','4-6Y','6-8Y','8-10Y','10-12Y'],
    colors: ['أزرق','وردي','أصفر','أبيض','أحمر','أخضر','برتقالي'],
    fields: [
      { id: 'ageRange', label: 'الفئة العمرية', options: ['حديث الولادة','0-6 أشهر','6-12 شهر','1-3 سنوات','3-6 سنوات','6-12 سنة','12-16 سنة'] },
      { id: 'gender',   label: 'الجنس',          options: ['ولد','بنت','للجنسين'] },
    ],
  },
  shoes: {
    emoji: '👟',
    sizes: ['35','36','37','38','39','40','41','42','43','44','45','46'],
    colors: ['أسود','أبيض','رمادي','بني','بيج','أزرق'],
    fields: [
      { id: 'material', label: 'المادة',        options: ['جلد طبيعي','جلد صناعي','قماش','رياضي','مطاط'] },
      { id: 'usage',    label: 'الاستخدام',     options: ['رياضي','رسمي','يومي','كلاسيكي','كاجوال'] },
    ],
  },
  access: {
    emoji: '👜',
    sizes: [],
    colors: ['أسود','بني','بيج','ذهبي','فضي','أحمر'],
    fields: [
      { id: 'subtype',  label: 'نوع الإكسسوار', options: ['حقيبة','ساعة','نظارات','مجوهرات','حزام','كاب','وشاح','محفظة'] },
      { id: 'material', label: 'المادة',         options: ['جلد','معدن','ذهب','فضة','قماش'] },
    ],
  },
  home: {
    emoji: '🏠',
    sizes: [],
    colors: ['أسود','أبيض','بيج','بني','رمادي','ذهبي'],
    fields: [
      { id: 'material', label: 'المادة',          options: ['خشب','معدن','زجاج','بلاستيك','سيراميك','نسيج'] },
      { id: 'room',     label: 'الغرفة المناسبة', options: ['غرفة نوم','صالون','مطبخ','حمام','مكتب'] },
    ],
  },
  other: { emoji: '📦', sizes: [], colors: [], fields: [] },
};

type WizardData = {
  category: string;
  name: string;
  description: string;
  price: string;
  cost: string;
  stock: string;
  sizes: string[];
  colors: string[];
  imageUrl: string;
  status: ProductStatus;
  [key: string]: any;
};

const initData = (): WizardData => ({
  category: '', name: '', description: '',
  price: '', cost: '', stock: '',
  sizes: [], colors: [], imageUrl: '', status: 'draft',
});

type Filter = 'all' | 'published' | 'draft' | 'low' | 'out';
type Sort   = 'newest' | 'name' | 'price' | 'stock';

const FILTER_LABELS: Record<Filter, string> = {
  all: 'الكل', published: 'منشور', draft: 'مسودة',
  low: 'مخزون منخفض', out: 'نفذ',
};

export default function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct, adjustStock, settings, token } = useStore();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort,   setSort]   = useState<Sort>('newest');

  const [showWizard, setShowWizard] = useState(false);
  const [editProd,   setEditProd]   = useState<Product | null>(null);
  const [step,       setStep]       = useState(1);
  const [data,       setData]       = useState<WizardData>(initData());
  const [aiLoading,  setAiLoading]  = useState(false);
  const [saving,     setSaving]     = useState(false);

  const cfg    = CAT_CFG[data.category] || CAT_CFG.other;
  const margin = data.price && data.cost
    ? Math.round(((Number(data.price) - Number(data.cost)) / Number(data.price)) * 100)
    : 0;

  const filtered = useMemo(() => {
    return products
      .filter(p => {
        const ms = !search || p.name.toLowerCase().includes(search.toLowerCase());
        const mf = filter === 'all' ? true
          : filter === 'published' ? p.status === 'published'
          : filter === 'draft'     ? p.status === 'draft'
          : filter === 'low'       ? p.stock > 0 && p.stock <= settings.products.lowStockAlert
          : p.stock === 0;
        return ms && mf;
      })
      .sort((a, b) => {
        if (sort === 'name')  return a.name.localeCompare(b.name, 'ar');
        if (sort === 'price') return b.price - a.price;
        if (sort === 'stock') return b.stock - a.stock;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [products, search, filter, sort, settings]);

  const countFor = (f: Filter) =>
    f === 'all'       ? products.length
    : f === 'published' ? products.filter(p => p.status === 'published').length
    : f === 'draft'     ? products.filter(p => p.status === 'draft').length
    : f === 'low'       ? products.filter(p => p.stock > 0 && p.stock <= settings.products.lowStockAlert).length
    : products.filter(p => p.stock === 0).length;

  const openAdd = () => {
    setData(initData()); setStep(1); setEditProd(null); setShowWizard(true);
  };
  const openEdit = (p: Product) => {
    const catId = Object.entries(CAT_CFG).find(([, v]) => v.emoji === p.emoji)?.[0] || 'other';
    setData({
      category: catId, name: p.name, description: p.description,
      price: String(p.price), cost: String(p.cost), stock: String(p.stock),
      sizes: p.sizes || [], colors: p.colors || [],
      imageUrl: p.imageUrl || '', status: p.status,
    });
    setStep(2); setEditProd(p); setShowWizard(true);
  };
  const closeWizard = () => { setShowWizard(false); setEditProd(null); };

  const toggle = (field: 'sizes' | 'colors', val: string) =>
    setData(d => ({ ...d, [field]: d[field].includes(val) ? d[field].filter((x: string) => x !== val) : [...d[field], val] }));

  const generateAI = async () => {
    if (!data.name) return;
    setAiLoading(true);
    try {
      const cat = CATS.find(c => c.id === data.category);
      const prompt = `اكتب وصفاً تسويقياً قصيراً (2-3 جمل) بالدارجة المغربية لمنتج: "${data.name}" من فئة "${cat?.label || 'ملابس'}". الوصف يكون جذاباً للشراء ومع ميزات المنتج.`;
      const r = await fetch('/api/ai/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: prompt }),
      });
      const j = await r.json();
      setData(d => ({ ...d, description: j.reply || j.message || d.description }));
    } catch { /* silent */ }
    setAiLoading(false);
  };

  const save = async (status: ProductStatus) => {
    if (!data.name || !data.price) return;
    setSaving(true);
    try {
      const catLabel = CATS.find(c => c.id === data.category)?.label || 'أخرى';
      const payload = {
        name: data.name, description: data.description,
        price: Number(data.price), cost: Number(data.cost) || 0,
        stock: Number(data.stock) || 0,
        sizes: data.sizes, colors: data.colors,
        imageUrl: data.imageUrl,
        images: data.imageUrl ? [data.imageUrl] : [],
        category: catLabel, emoji: cfg.emoji, status,
        isForChildren: data.category === 'kids',
        ageRange: data.ageRange || '',
      };
      if (editProd) {
        await updateProduct(editProd.id, payload as any);
      } else {
        await addProduct(payload as any);
      }
      closeWizard();
    } catch { /* error handled by store */ }
    setSaving(false);
  };

  const shareWA = (p: Product) => {
    const uid = (() => { try { return JSON.parse(localStorage.getItem('ai_commerce_user') || '{}')?.id; } catch { return ''; } })();
    const url = `${window.location.origin}/store/${uid}`;
    const msg = `✨ ${p.name}\n💰 ${p.price} ${settings.brand.currency}\n📦 متوفر الآن\n🛍️ للطلب: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const totalSteps = cfg.fields.length > 0 ? 5 : 4;
  const progress   = step <= 1 ? 0 : Math.round((step / totalSteps) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">المنتجات</h1>
          <p className="page-sub">
            {products.length} منتج · {products.filter(p => p.status === 'published').length} منشور
          </p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <Plus size={16} /> إضافة منتج
        </button>
      </div>

      {/* SEARCH + SORT */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink3)', pointerEvents: 'none' }} />
          <input className="input" style={{ paddingRight: 38 }} placeholder="بحث عن منتج..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select" style={{ width: 'auto' }} value={sort} onChange={e => setSort(e.target.value as Sort)}>
          <option value="newest">الأحدث</option>
          <option value="name">الاسم</option>
          <option value="price">السعر ↓</option>
          <option value="stock">المخزون</option>
        </select>
      </div>

      {/* FILTER CHIPS */}
      <div className="chips-row">
        {(Object.keys(FILTER_LABELS) as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`chip ${filter === f ? 'active' : ''}`}>
            {FILTER_LABELS[f]}
            {f !== 'all' && <span style={{ marginRight: 4, fontSize: 10, opacity: 0.6 }}>({countFor(f)})</span>}
          </button>
        ))}
      </div>

      {/* GRID */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div>
              <p className="empty-state-title">لا توجد منتجات</p>
              <p className="empty-state-sub">ابدأ بإضافة أول منتج لمتجرك</p>
            </div>
            <button onClick={openAdd} className="btn btn-primary" style={{ marginTop: 8 }}>
              <Plus size={15} /> إضافة منتج
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
          {filtered.map(p => (
            <div key={p.id} className="product-card">
              {/* Image */}
              <div style={{ position: 'relative', aspectRatio: '1', background: 'var(--void3)' }}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} className="product-card-img" alt={p.name} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, opacity: 0.6 }}>
                    {p.emoji}
                  </div>
                )}
                <span className={`status-${p.status}`} style={{ position: 'absolute', top: 8, right: 8 }}>
                  {p.status === 'published' ? 'منشور' : p.status === 'draft' ? 'مسودة' : 'مؤرشف'}
                </span>
                <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 5 }}>
                  <button onClick={() => openEdit(p)} className="icon-btn" style={{ background: 'rgba(7,7,10,.7)', backdropFilter: 'blur(8px)' }}>
                    <Edit3 size={13} />
                  </button>
                  <button onClick={() => deleteProduct(p.id)} className="icon-btn danger" style={{ background: 'rgba(7,7,10,.7)', backdropFilter: 'blur(8px)' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
                {p.stock > 0 && p.stock <= settings.products.lowStockAlert && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(245,158,11,.85)', backdropFilter: 'blur(4px)', padding: '4px 8px', fontSize: 10, fontWeight: 700, color: '#fff', textAlign: 'center' }}>
                    ⚠ آخر {p.stock} قطعة
                  </div>
                )}
                {p.stock === 0 && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ background: 'var(--ember)', color: '#fff', padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 800 }}>نفذ المخزون</span>
                  </div>
                )}
              </div>
              {/* Info */}
              <div style={{ padding: '11px 13px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink1)', lineHeight: 1.3, flex: 1 }}>{p.name}</h3>
                  <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--ember)', whiteSpace: 'nowrap' }}>
                    {p.price} <span style={{ fontSize: 10 }}>{settings.brand.currency}</span>
                  </span>
                </div>
                {p.category && <p style={{ fontSize: 10, color: 'var(--ink3)', marginBottom: 7 }}>{p.category}</p>}
                {p.colors.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                    {p.colors.slice(0, 3).map(c => (
                      <span key={c} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 99, background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', color: 'var(--ink3)' }}>{c}</span>
                    ))}
                    {p.colors.length > 3 && <span style={{ fontSize: 9, color: 'var(--ink3)' }}>+{p.colors.length - 3}</span>}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <button onClick={() => adjustStock(p.id, -1)} className="icon-btn" style={{ width: 24, height: 24, fontSize: 13, padding: 0 }}>−</button>
                    <span style={{ fontSize: 11, fontWeight: 700, minWidth: 26, textAlign: 'center', color: p.stock === 0 ? 'var(--ember)' : p.stock <= settings.products.lowStockAlert ? '#F59E0B' : 'var(--ink2)' }}>{p.stock}</span>
                    <button onClick={() => adjustStock(p.id, +1)} className="icon-btn" style={{ width: 24, height: 24, fontSize: 13, padding: 0 }}>+</button>
                  </div>
                  <button onClick={() => shareWA(p)} className="btn btn-ghost btn-xs" style={{ gap: 4, fontSize: 11 }}>
                    <Share2 size={11} /> واتساب
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════
          SMART PRODUCT WIZARD MODAL
         ══════════════════════════════ */}
      {showWizard && (
        <div className="modal-overlay" onClick={closeWizard}>
          <div className="modal" style={{ width: '100%', maxWidth: 520 }} onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--ink1)' }}>
                  {editProd ? '✏️ تعديل المنتج' : '✨ منتج جديد'}
                </h2>
                {step > 1 && data.category && (
                  <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 3 }}>
                    {CATS.find(c => c.id === data.category)?.icon} {CATS.find(c => c.id === data.category)?.label}
                    {' · '}الخطوة {step - 1} من {totalSteps - 1}
                  </p>
                )}
              </div>
              <button onClick={closeWizard} style={{ background: 'none', border: 'none', color: 'var(--ink3)', cursor: 'pointer', padding: 6 }}>
                <X size={20} />
              </button>
            </div>

            {/* Progress bar */}
            {step > 1 && (
              <div style={{ height: 3, background: 'var(--border2)' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg,var(--ember),var(--ember2))', width: `${progress}%`, transition: 'width .35s' }} />
              </div>
            )}

            <div className="modal-body">

              {/* ── STEP 1: Category ── */}
              {step === 1 && (
                <div>
                  <p style={{ fontSize: 14, color: 'var(--ink2)', fontWeight: 600, textAlign: 'center', marginBottom: 18 }}>
                    ما هو نوع المنتج؟
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                    {CATS.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setData(d => ({
                            ...d,
                            category: cat.id,
                            sizes: CAT_CFG[cat.id]?.sizes?.slice(0, 3) || [],
                            colors: [],
                          }));
                          setStep(2);
                        }}
                        style={{
                          padding: '18px 14px', borderRadius: 14,
                          border: '1.5px solid var(--border)',
                          background: 'var(--panel2)', cursor: 'pointer',
                          textAlign: 'center', fontFamily: 'inherit',
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', gap: 8,
                          transition: 'border-color .15s, background .15s',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = cat.color;
                          (e.currentTarget as HTMLButtonElement).style.background = `${cat.color}18`;
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                          (e.currentTarget as HTMLButtonElement).style.background = 'var(--panel2)';
                        }}
                      >
                        <span style={{ fontSize: 30 }}>{cat.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink1)' }}>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── STEP 2: Basic Info ── */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="label">اسم المنتج *</label>
                    <input
                      className="input" autoFocus
                      placeholder="مثال: قميص كتان أبيض..."
                      value={data.name}
                      onChange={e => setData(d => ({ ...d, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label className="label" style={{ margin: 0 }}>وصف المنتج</label>
                      <button
                        onClick={generateAI}
                        disabled={!data.name || aiLoading}
                        className="btn btn-ghost btn-xs"
                        style={{ gap: 5, color: 'var(--mint)', borderColor: 'rgba(0,210,179,.3)' }}
                      >
                        <Sparkles size={12} />
                        {aiLoading ? 'جارٍ التوليد...' : '✨ AI'}
                      </button>
                    </div>
                    <textarea
                      className="textarea" rows={3}
                      placeholder="وصف جذاب يشجع على الشراء..."
                      value={data.description}
                      onChange={e => setData(d => ({ ...d, description: e.target.value }))}
                      style={{ resize: 'none' }}
                    />
                  </div>
                  {cfg.fields.map(f => (
                    <div key={f.id}>
                      <label className="label">{f.label}</label>
                      <select className="select" value={data[f.id] || ''} onChange={e => setData(d => ({ ...d, [f.id]: e.target.value }))}>
                        <option value="">اختر...</option>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* ── STEP 3: Image & Variants ── */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label className="label">رابط صورة المنتج</label>
                    <input
                      className="input" dir="ltr"
                      placeholder="https://example.com/photo.jpg"
                      value={data.imageUrl}
                      onChange={e => setData(d => ({ ...d, imageUrl: e.target.value }))}
                    />
                    {data.imageUrl && (
                      <img
                        src={data.imageUrl} alt="preview"
                        style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 10, marginTop: 8, border: '1px solid var(--border)' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </div>
                  {cfg.sizes.length > 0 && (
                    <div>
                      <label className="label">المقاسات المتوفرة</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                        {cfg.sizes.map(s => (
                          <button key={s} onClick={() => toggle('sizes', s)} className={`chip ${data.sizes.includes(s) ? 'active' : ''}`} style={{ fontSize: 12 }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {cfg.colors.length > 0 && (
                    <div>
                      <label className="label">الألوان المتوفرة</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                        {cfg.colors.map(c => (
                          <button key={c} onClick={() => toggle('colors', c)} className={`chip ${data.colors.includes(c) ? 'active' : ''}`} style={{ fontSize: 12 }}>
                            {c}
                          </button>
                        ))}
                      </div>
                      <input
                        className="input" style={{ marginTop: 8 }}
                        placeholder="لون مخصص ← اضغط Enter للإضافة"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            toggle('colors', e.currentTarget.value.trim());
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 4: Pricing ── */}
              {step === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="label">سعر البيع ({settings.brand.currency}) *</label>
                      <input className="input" type="number" min="0" placeholder="0" value={data.price} onChange={e => setData(d => ({ ...d, price: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">سعر التكلفة ({settings.brand.currency})</label>
                      <input className="input" type="number" min="0" placeholder="0" value={data.cost} onChange={e => setData(d => ({ ...d, cost: e.target.value }))} />
                    </div>
                  </div>
                  {data.price && data.cost && Number(data.price) > 0 && (
                    <div style={{
                      padding: '14px 16px', borderRadius: 12,
                      background: margin >= 30 ? 'rgba(0,210,179,.08)' : margin >= 10 ? 'rgba(246,196,83,.08)' : 'rgba(255,77,26,.08)',
                      border: `1px solid ${margin >= 30 ? 'rgba(0,210,179,.25)' : margin >= 10 ? 'rgba(246,196,83,.25)' : 'rgba(255,77,26,.25)'}`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ fontSize: 13, color: 'var(--ink2)' }}>هامش الربح</span>
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ fontSize: 24, fontWeight: 900, color: margin >= 30 ? 'var(--mint)' : margin >= 10 ? 'var(--gold)' : 'var(--ember)' }}>
                          {margin}%
                        </span>
                        <p style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 1 }}>
                          ربح: {(Number(data.price) - Number(data.cost)).toLocaleString()} {settings.brand.currency}
                        </p>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="label">المخزون الأولي</label>
                    <input className="input" type="number" min="0" placeholder="0" value={data.stock} onChange={e => setData(d => ({ ...d, stock: e.target.value }))} />
                  </div>
                </div>
              )}

              {/* ── STEP 5: Preview & Publish ── */}
              {step === 5 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ borderRadius: 16, border: '1px solid var(--border2)', overflow: 'hidden', background: 'var(--panel2)' }}>
                    {data.imageUrl ? (
                      <img src={data.imageUrl} alt={data.name} style={{ width: '100%', height: 180, objectFit: 'cover' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>{cfg.emoji}</div>
                    )}
                    <div style={{ padding: '14px 16px' }}>
                      <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--ink1)', marginBottom: 4 }}>{data.name || 'اسم المنتج'}</h3>
                      {data.description && <p style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 10, lineHeight: 1.55 }}>{data.description}</p>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--ember)' }}>{data.price || '0'} <span style={{ fontSize: 12 }}>{settings.brand.currency}</span></span>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {data.sizes.slice(0, 3).map(s => (
                            <span key={s} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, border: '1px solid var(--border)', color: 'var(--ink3)' }}>{s}</span>
                          ))}
                        </div>
                      </div>
                      {margin > 0 && (
                        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink3)' }}>
                          هامش: <strong style={{ color: margin >= 30 ? 'var(--mint)' : 'var(--gold)' }}>{margin}%</strong>
                          {' · '}مخزون: {data.stock || 0}
                        </div>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--ink3)', textAlign: 'center' }}>
                    راجع البيانات قبل النشر
                  </p>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              {step > 1 ? (
                <button onClick={() => setStep(s => s - 1)} className="btn btn-ghost btn-sm">
                  <ChevronRight size={14} /> رجوع
                </button>
              ) : <div />}
              <div style={{ display: 'flex', gap: 8 }}>
                {step >= totalSteps ? (
                  <>
                    <button onClick={() => save('draft')} disabled={saving || !data.name || !data.price} className="btn btn-ghost">
                      💾 مسودة
                    </button>
                    <button onClick={() => save('published')} disabled={saving || !data.name || !data.price} className="btn btn-primary">
                      {saving ? '...' : '🚀 نشر الآن'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    disabled={step === 2 && !data.name}
                    className="btn btn-primary"
                  >
                    {step === totalSteps - 1 ? 'معاينة' : 'التالي'} <ChevronLeft size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
