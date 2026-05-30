import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../store';
import {
  Plus, Search, Edit3, Trash2, X, ChevronRight, ChevronLeft,
  Sparkles, Share2, Camera, Image, Download, Palette, Eye,
} from 'lucide-react';
import type { Product, ProductStatus, CustomFieldDef, CustomFieldType } from '../types';

// ── Category config ───────────────────────────────────────────

const CATS = [
  { id: 'men',     icon: '👕', label: 'ملابس رجال',   color: '#3B82F6', type: 'product' },
  { id: 'women',   icon: '👗', label: 'ملابس نساء',   color: '#EC4899', type: 'product' },
  { id: 'kids',    icon: '🧒', label: 'أطفال',        color: '#F59E0B', type: 'product' },
  { id: 'shoes',   icon: '👟', label: 'أحذية',        color: '#8B5CF6', type: 'product' },
  { id: 'access',  icon: '👜', label: 'أكسسوارات',   color: '#10B981', type: 'product' },
  { id: 'home',    icon: '🏠', label: 'ديكور ومنزل', color: '#F97316', type: 'product' },
  { id: 'service', icon: '🔧', label: 'خدمة',         color: '#8B5CF6', type: 'service' },
  { id: 'digital', icon: '💻', label: 'رقمي / دروس',  color: '#0EA5E9', type: 'digital' },
  { id: 'other',   icon: '📦', label: 'أخرى',         color: '#6B7280', type: 'product' },
] as const;

type CatId = typeof CATS[number]['id'];

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
      { id: 'fabric',  label: 'نوع القماش', options: ['قطن','جينز','صوف','كتان','بوليستر','حرير'] },
      { id: 'season',  label: 'الموسم',      options: ['صيف','شتاء','ربيع/خريف','كل الفصول'] },
      { id: 'subtype', label: 'نوع القطعة',  options: ['قميص','بنطال','جاكيت','تيشيرت','بوذي','سترة'] },
    ],
  },
  women: {
    emoji: '👗',
    sizes: ['XS','S','M','L','XL','XXL'],
    colors: ['أسود','أبيض','وردي','أحمر','بيج','نبيتي','تركواز','بنفسجي'],
    fields: [
      { id: 'fabric',  label: 'نوع القماش', options: ['قطن','حرير','كريب','شيفون','جيرسي','قيفورة'] },
      { id: 'season',  label: 'الموسم',      options: ['صيف','شتاء','ربيع/خريف','كل الفصول'] },
      { id: 'subtype', label: 'نوع القطعة',  options: ['فستان','بلوزة','تيشيرت','بنطال','عباية','قفطان','تنورة'] },
    ],
  },
  kids: {
    emoji: '🧒',
    sizes: ['0-6m','6-12m','1-2Y','2-4Y','4-6Y','6-8Y','8-10Y','10-12Y'],
    colors: ['أزرق','وردي','أصفر','أبيض','أحمر','أخضر','برتقالي'],
    fields: [
      { id: 'ageRange', label: 'الفئة العمرية', options: ['حديث الولادة','0-6 أشهر','6-12 شهر','1-3 سنوات','3-6 سنوات','6-12 سنة','12-16 سنة'] },
      { id: 'gender',   label: 'الجنس',         options: ['ولد','بنت','للجنسين'] },
    ],
  },
  shoes: {
    emoji: '👟',
    sizes: ['35','36','37','38','39','40','41','42','43','44','45','46'],
    colors: ['أسود','أبيض','رمادي','بني','بيج','أزرق'],
    fields: [
      { id: 'material', label: 'المادة',    options: ['جلد طبيعي','جلد صناعي','قماش','رياضي','مطاط'] },
      { id: 'usage',    label: 'الاستخدام', options: ['رياضي','رسمي','يومي','كلاسيكي','كاجوال'] },
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
      { id: 'material', label: 'المادة',           options: ['خشب','معدن','زجاج','بلاستيك','سيراميك','نسيج'] },
      { id: 'room',     label: 'الغرفة المناسبة',  options: ['غرفة نوم','صالون','مطبخ','حمام','مكتب'] },
    ],
  },
  other:   { emoji: '📦', sizes: [], colors: [], fields: [] },
  service: {
    emoji: '🔧', sizes: [], colors: [],
    fields: [
      { id: 'serviceType', label: 'نوع الخدمة', options: ['كهرباء','سباكة','نجارة','تصميم','تدريس','تنظيف','تصوير','برمجة','تسويق','أخرى'] },
      { id: 'workArea',    label: 'منطقة العمل', options: ['الدار البيضاء','الرباط','مراكش','فاس','طنجة','أكادير','جميع المدن'] },
    ],
  },
  digital: {
    emoji: '💻', sizes: [], colors: [],
    fields: [
      { id: 'format',   label: 'صيغة الملف',  options: ['PDF','MP4','ZIP','MP3','صورة','أخرى'] },
      { id: 'language', label: 'اللغة',        options: ['العربية','الفرنسية','الإنجليزية','دارجة','أمازيغية'] },
    ],
  },
};

// ── Variant types ─────────────────────────────────────────────

type SizeStock = { name: string; stock: number };
type ColorVariant = { id: string; color: string; hex: string; images: string[]; sizes: SizeStock[] };

// ── Custom field helpers ──────────────────────────────────────
const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: '📝 نص', number: '🔢 رقم', select: '📋 قائمة', boolean: '✅ نعم/لا', color: '🎨 لون',
};

// ── Wizard state ──────────────────────────────────────────────

type WizardData = {
  category: string;
  type: 'product' | 'service' | 'digital';
  name: string;
  description: string;
  price: string;
  cost: string;
  stock: string;
  duration: string;
  workArea: string;
  images: string[];
  imageUrl: string;
  status: ProductStatus;
  variants: ColorVariant[];
  customFields: CustomFieldDef[];
  designOpts: {
    showName: boolean;
    showPrice: boolean;
    watermark: boolean;
    textColor: string;
  };
  processedImages: string[];
  [key: string]: any;
};

const initData = (): WizardData => ({
  category: '', type: 'product', name: '', description: '',
  price: '', cost: '', stock: '', duration: '', workArea: '',
  images: [], imageUrl: '', status: 'draft',
  variants: [], customFields: [],
  designOpts: { showName: false, showPrice: false, watermark: false, textColor: '#ffffff' },
  processedImages: [],
});

type Filter = 'all' | 'published' | 'draft' | 'low' | 'out';
type Sort   = 'newest' | 'name' | 'price' | 'stock';

const FILTER_LABELS: Record<Filter, string> = {
  all: 'الكل', published: 'منشور', draft: 'مسودة',
  low: 'مخزون منخفض', out: 'نفذ',
};

// ── Canvas design helper ──────────────────────────────────────

const applyDesign = (
  src: string,
  opts: { showName: boolean; showPrice: boolean; watermark: boolean; textColor: string; storeName?: string; price?: string; currency?: string },
): Promise<string> =>
  new Promise<string>(resolve => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const W = img.width || 800;
      const H = img.height || 800;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      if (opts.showName && opts.storeName) {
        const grd = ctx.createLinearGradient(0, H - 90, 0, H);
        grd.addColorStop(0, 'transparent');
        grd.addColorStop(1, 'rgba(0,0,0,.75)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, H - 90, W, 90);
        ctx.fillStyle = opts.textColor || '#fff';
        ctx.font = `bold ${Math.round(W * .055)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(opts.storeName, W / 2, H - 16);
      }

      if (opts.showPrice && opts.price) {
        const r = Math.round(W * .1);
        const bx = W - r - 16, by = r + 16;
        ctx.fillStyle = '#FF6A00';
        ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = opts.textColor || '#fff';
        ctx.font = `bold ${Math.round(W * .06)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(opts.price, bx, by + 5);
        ctx.font = `bold ${Math.round(W * .03)}px Arial`;
        ctx.fillText(opts.currency || 'MAD', bx, by + Math.round(W * .043));
      }

      if (opts.watermark) {
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = opts.textColor || '#fff';
        ctx.font = `bold ${Math.round(W * .04)}px Arial`;
        ctx.textAlign = 'center';
        ctx.translate(W / 2, H / 2);
        ctx.rotate(-Math.PI / 6);
        ctx.fillText(opts.storeName || 'متجري', 0, 0);
        ctx.restore();
      }

      resolve(canvas.toDataURL('image/jpeg', .92));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });

// ── FileReader helper ─────────────────────────────────────────

const readFile = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = e => res(e.target!.result as string);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });

// ── Color swatch circle ───────────────────────────────────────

const Swatch = ({ hex, size = 18 }: { hex: string; size?: number }) => (
  <span style={{
    width: size, height: size, borderRadius: '50%',
    background: hex || '#888', display: 'inline-block',
    border: '2px solid rgba(255,255,255,.25)', flexShrink: 0,
  }} />
);

// ── Unique ID helper ──────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

// ─────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct, adjustStock, settings, token } = useStore();

  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState<Filter>('all');
  const [sort,    setSort]    = useState<Sort>('newest');

  const [showWizard, setShowWizard] = useState(false);
  const [editProd,   setEditProd]   = useState<Product | null>(null);
  const [step,       setStep]       = useState(1);
  const [data,       setData]       = useState<WizardData>(initData());
  const [aiLoading,  setAiLoading]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [designing,  setDesigning]  = useState(false);

  // Hidden file inputs
  const cameraRef  = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const variantCameraRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const variantGalleryRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Custom colour for variant builder
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex,  setCustomColorHex]  = useState('#000000');

  // Custom field builder
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState<{ label: string; type: CustomFieldType; options: string }>({
    label: '', type: 'text', options: '',
  });

  const resetNewField = () => { setNewField({ label: '', type: 'text', options: '' }); setShowAddField(false); };

  const confirmAddField = () => {
    if (!newField.label.trim()) return;
    const options = newField.type === 'select'
      ? newField.options.split(/[,،]/).map(o => o.trim()).filter(Boolean)
      : [];
    const defaultValue = newField.type === 'boolean' ? 'false' : newField.type === 'color' ? '#000000' : '';
    setData(d => ({
      ...d,
      customFields: [...d.customFields, { id: uid(), label: newField.label.trim(), type: newField.type, options, value: defaultValue }],
    }));
    resetNewField();
  };

  const updateCustomFieldValue = (id: string, value: string) =>
    setData(d => ({ ...d, customFields: d.customFields.map(f => f.id === id ? { ...f, value } : f) }));

  const removeCustomField = (id: string) =>
    setData(d => ({ ...d, customFields: d.customFields.filter(f => f.id !== id) }));

  // Listen for FAB quick-add action from mobile nav
  React.useEffect(() => {
    try {
      const pending = localStorage.getItem('pendingFab');
      if (pending === 'addProduct' || pending === 'addService') {
        localStorage.removeItem('pendingFab');
        // Pre-select type if service
        if (pending === 'addService') {
          setData(d => ({ ...d, category: 'service', type: 'service' }));
          setStep(2); // skip category selection
        }
        setShowWizard(true);
      }
    } catch {}
  }, []); // run once on mount

  const cfg    = CAT_CFG[data.category] || CAT_CFG.other;
  const margin = data.price && data.cost
    ? Math.round(((Number(data.price) - Number(data.cost)) / Number(data.price)) * 100)
    : 0;

  const totalVariantStock = data.variants.reduce(
    (acc, v) => acc + v.sizes.reduce((a, s) => a + (s.stock || 0), 0), 0,
  );

  // ── Filtered product list ────────────────────────────────────
  const filtered = useMemo(() =>
    products
      .filter(p => {
        const ms = !search || p.name.toLowerCase().includes(search.toLowerCase());
        const mf =
          filter === 'all'       ? true
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
      }),
    [products, search, filter, sort, settings],
  );

  const countFor = (f: Filter) =>
    f === 'all'        ? products.length
    : f === 'published' ? products.filter(p => p.status === 'published').length
    : f === 'draft'     ? products.filter(p => p.status === 'draft').length
    : f === 'low'       ? products.filter(p => p.stock > 0 && p.stock <= settings.products.lowStockAlert).length
    : products.filter(p => p.stock === 0).length;

  // ── Wizard open/close ────────────────────────────────────────
  const openAdd = () => {
    setData(initData()); setStep(1); setEditProd(null); setShowWizard(true);
    setCustomColorName(''); setCustomColorHex('#000000');
    setShowAddField(false); setNewField({ label: '', type: 'text', options: '' });
  };

  const openEdit = (p: Product) => {
    const catId = (Object.entries(CAT_CFG).find(([, v]) => v.emoji === p.emoji)?.[0]) || 'other';
    setData({
      ...initData(),
      category: catId, name: p.name, description: p.description,
      price: String(p.price), cost: String(p.cost), stock: String(p.stock),
      images: p.images || (p.imageUrl ? [p.imageUrl] : []),
      imageUrl: p.imageUrl || '',
      status: p.status,
      variants: (p as any).variants || [],
      customFields: (p as any).customFields || [],
    });
    setStep(2); setEditProd(p); setShowWizard(true);
  };

  const closeWizard = () => {
    const hasData = data.name || data.images.length > 0 || data.variants.length > 0;
    if (hasData && step > 1) {
      if (!window.confirm('هل تريد إغلاق المعالج؟ لن تحفظ البيانات.')) return;
    }
    setShowWizard(false);
    setEditProd(null);
  };

  // ── AI description ───────────────────────────────────────────
  const generateAI = async () => {
    if (!data.name) return;
    setAiLoading(true);
    try {
      const cat = CATS.find(c => c.id === data.category);
      const r = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: data.name,
          category: cat?.label || data.category,
          price: data.price,
          sizes: data.sizes,
          colors: data.colors,
        }),
      });
      const j = await r.json();
      if (j.description) setData(d => ({ ...d, description: j.description }));
    } catch { /* silent */ }
    setAiLoading(false);
  };

  // ── Image upload helpers ──────────────────────────────────────
  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const existing = data.images.length;
    const slots = Math.max(0, 10 - existing);
    const toRead = Array.from(files).slice(0, slots);
    const b64s = await Promise.all(toRead.map(readFile));
    setData(d => {
      const next = [...d.images, ...b64s];
      return { ...d, images: next, imageUrl: next[0] || d.imageUrl };
    });
  };

  const removeImage = (idx: number) =>
    setData(d => {
      const next = d.images.filter((_, i) => i !== idx);
      return { ...d, images: next, imageUrl: next[0] || '' };
    });

  const addImageUrl = (url: string) => {
    if (!url.trim() || data.images.length >= 10) return;
    setData(d => {
      const next = [...d.images, url.trim()];
      return { ...d, images: next, imageUrl: next[0] || d.imageUrl };
    });
  };

  // ── Variant helpers ───────────────────────────────────────────
  const addVariant = (colorName: string, hex: string) => {
    if (data.variants.find(v => v.color === colorName)) return;
    const sizesForVariant: SizeStock[] = cfg.sizes.length > 0
      ? cfg.sizes.map(s => ({ name: s, stock: 0 }))
      : [];
    setData(d => ({
      ...d,
      variants: [...d.variants, { id: uid(), color: colorName, hex, images: [], sizes: sizesForVariant }],
    }));
  };

  const removeVariant = (id: string) =>
    setData(d => ({ ...d, variants: d.variants.filter(v => v.id !== id) }));

  const updateVariantSizeStock = (variantId: string, sizeName: string, stock: number) =>
    setData(d => ({
      ...d,
      variants: d.variants.map(v =>
        v.id === variantId
          ? { ...v, sizes: v.sizes.map(s => s.name === sizeName ? { ...s, stock: Math.max(0, stock) } : s) }
          : v,
      ),
    }));

  const toggleVariantSize = (variantId: string, sizeName: string) =>
    setData(d => ({
      ...d,
      variants: d.variants.map(v => {
        if (v.id !== variantId) return v;
        const has = v.sizes.find(s => s.name === sizeName);
        return {
          ...v,
          sizes: has
            ? v.sizes.filter(s => s.name !== sizeName)
            : [...v.sizes, { name: sizeName, stock: 0 }],
        };
      }),
    }));

  const handleVariantFiles = async (variantId: string, files: FileList | null) => {
    if (!files) return;
    const b64s = await Promise.all(Array.from(files).slice(0, 5).map(readFile));
    setData(d => ({
      ...d,
      variants: d.variants.map(v =>
        v.id === variantId ? { ...v, images: [...v.images, ...b64s].slice(0, 5) } : v,
      ),
    }));
  };

  // ── Design studio ─────────────────────────────────────────────
  const applyToAll = async () => {
    if (data.images.length === 0) return;
    setDesigning(true);
    const opts = {
      ...data.designOpts,
      storeName: settings.brand.name,
      price: data.price,
      currency: settings.brand.currency,
    };
    const results = await Promise.all(data.images.map(src => applyDesign(src, opts)));
    setData(d => ({ ...d, processedImages: results }));
    setDesigning(false);
  };

  const downloadImage = (src: string, idx: number) => {
    const a = document.createElement('a');
    a.href = src;
    a.download = `${data.name || 'product'}-${idx + 1}.jpg`;
    a.click();
  };

  // ── Save ──────────────────────────────────────────────────────
  const save = async (status: ProductStatus) => {
    if (!data.name || !data.price) return;
    setSaving(true);
    try {
      const catLabel = CATS.find(c => c.id === data.category)?.label || 'أخرى';
      const allVariantImages = data.variants.flatMap(v => v.images);
      const finalImages = [...(data.processedImages.length ? data.processedImages : data.images), ...allVariantImages];
      const finalColors = data.variants.length > 0
        ? data.variants.map(v => v.color)
        : data.colors || [];
      const finalSizes = data.variants.length > 0
        ? [...new Set(data.variants.flatMap(v => v.sizes.map(s => s.name)))]
        : data.sizes || [];
      const finalStock = data.variants.length > 0 ? totalVariantStock : Number(data.stock) || 0;

      const payload: any = {
        name: data.name,
        description: data.description,
        price: Number(data.price),
        cost: Number(data.cost) || 0,
        stock: finalStock,
        sizes: finalSizes,
        colors: finalColors,
        images: finalImages,
        imageUrl: finalImages[0] || data.imageUrl || '',
        category: catLabel,
        emoji: cfg.emoji,
        status,
        type: data.type || 'product',
        duration: data.duration || '',
        workArea: data.workArea || '',
        isForChildren: data.category === 'kids',
        ageRange: data.ageRange || '',
        variants: data.variants,
        customFields: data.customFields,
      };

      if (editProd) {
        await updateProduct(editProd.id, payload);
      } else {
        await addProduct(payload);
      }
      setShowWizard(false);
      setEditProd(null);
    } catch { /* error handled by store */ }
    setSaving(false);
  };

  // ── WhatsApp share ────────────────────────────────────────────
  const shareWA = (p: Product) => {
    const uid2 = (() => { try { return JSON.parse(localStorage.getItem('ai_commerce_user') || '{}')?.id; } catch { return ''; } })();
    const url = `${window.location.origin}/store/${uid2}`;
    const msg = `✨ ${p.name}\n💰 ${p.price} ${settings.brand.currency}\n📦 متوفر الآن\n🛍️ للطلب: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // ── Hex lookup for known colour names ─────────────────────────
  const COLOR_HEX: Record<string, string> = {
    أسود: '#111111', أبيض: '#f5f5f5', رمادي: '#888888', كحلي: '#1a3a5c',
    بيج: '#e8d5b0', أزرق: '#2563eb', أحمر: '#dc2626', زيتي: '#4d6a1e',
    وردي: '#ec4899', نبيتي: '#7c2d5c', تركواز: '#0d9488', بنفسجي: '#7c3aed',
    أصفر: '#eab308', أخضر: '#16a34a', برتقالي: '#ea580c', بني: '#92400e',
    ذهبي: '#ca8a04', فضي: '#94a3b8',
  };
  const hexFor = (name: string) => COLOR_HEX[name] || '#888888';

  // ── Total wizard steps ────────────────────────────────────────
  const TOTAL_STEPS = 7;
  const progress = step <= 1 ? 0 : Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100);

  // ── Inline style helpers ──────────────────────────────────────
  const imgGrid: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 10,
  };

  // ══════════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">المنتجات</h1>
          <p className="page-sub">
            {products.length} منتج &middot; {products.filter(p => p.status === 'published').length} منشور
          </p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <Plus size={16} /> إضافة منتج
        </button>
      </div>

      {/* ── SEARCH + SORT ───────────────────────────────────────── */}
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

      {/* ── FILTER CHIPS ────────────────────────────────────────── */}
      <div className="chips-row">
        {(Object.keys(FILTER_LABELS) as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`chip ${filter === f ? 'active' : ''}`}>
            {FILTER_LABELS[f]}
            {f !== 'all' && <span style={{ marginRight: 4, fontSize: 10, opacity: .6 }}>({countFor(f)})</span>}
          </button>
        ))}
      </div>

      {/* ── PRODUCT GRID ────────────────────────────────────────── */}
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
          {filtered.map(p => {
            const thumb = (p.images && p.images[0]) || p.imageUrl || '';
            const variantColors: ColorVariant[] = (p as any).variants || [];
            return (
              <div key={p.id} className="product-card">
                {/* Image */}
                <div style={{ position: 'relative', aspectRatio: '1', background: 'var(--void3)' }}>
                  {thumb ? (
                    <img src={thumb} className="product-card-img" alt={p.name} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, opacity: .6 }}>
                      {p.emoji}
                    </div>
                  )}

                  {/* Status badge */}
                  <span className={`status-${p.status}`} style={{ position: 'absolute', top: 8, right: 8 }}>
                    {p.status === 'published' ? 'منشور' : p.status === 'draft' ? 'مسودة' : 'مؤرشف'}
                  </span>
                  {/* Type badge for service/digital */}
                  {(p as any).type === 'service' && (
                    <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(139,92,246,.9)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99 }}>🔧 خدمة</span>
                  )}
                  {(p as any).type === 'digital' && (
                    <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(14,165,233,.9)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99 }}>💻 رقمي</span>
                  )}

                  {/* Image count badge */}
                  {p.images?.length > 1 && (
                    <span style={{ position: 'absolute', top: 8, left: 44, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 9, padding: '2px 5px', borderRadius: 99, backdropFilter: 'blur(4px)' }}>
                      {p.images.length} صور
                    </span>
                  )}

                  {/* Action buttons */}
                  <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 5 }}>
                    <button onClick={() => openEdit(p)} className="icon-btn" style={{ background: 'rgba(7,7,10,.7)', backdropFilter: 'blur(8px)' }}>
                      <Edit3 size={13} />
                    </button>
                    <button onClick={() => { if (window.confirm(`حذف "${p.name}"؟`)) deleteProduct(p.id); }} className="icon-btn danger" style={{ background: 'rgba(7,7,10,.7)', backdropFilter: 'blur(8px)' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Low stock overlay — products only */}
                  {(!(p as any).type || (p as any).type === 'product') && p.stock > 0 && p.stock <= settings.products.lowStockAlert && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(245,158,11,.85)', padding: '4px 8px', fontSize: 10, fontWeight: 700, color: '#fff', textAlign: 'center' }}>
                      ⚠ آخر {p.stock} قطعة
                    </div>
                  )}
                  {(!(p as any).type || (p as any).type === 'product') && p.stock === 0 && (
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

                  {p.category && <p style={{ fontSize: 10, color: 'var(--ink3)', marginBottom: 6 }}>{p.category}</p>}

                  {/* Colour swatches row */}
                  {variantColors.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center', marginBottom: 7 }}>
                      {variantColors.slice(0, 6).map(v => (
                        <span key={v.id} title={v.color} style={{ width: 14, height: 14, borderRadius: '50%', background: v.hex || hexFor(v.color), border: '1.5px solid rgba(255,255,255,.2)', flexShrink: 0 }} />
                      ))}
                      {variantColors.length > 6 && <span style={{ fontSize: 9, color: 'var(--ink3)' }}>+{variantColors.length - 6}</span>}
                      {variantColors.length > 1 && (
                        <span style={{ fontSize: 9, color: 'var(--ink3)', marginRight: 2 }}>{variantColors.length} ألوان</span>
                      )}
                    </div>
                  )}
                  {variantColors.length === 0 && p.colors.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 7 }}>
                      {p.colors.slice(0, 4).map(c => (
                        <span key={c} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 99, background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', color: 'var(--ink3)' }}>{c}</span>
                      ))}
                      {p.colors.length > 4 && <span style={{ fontSize: 9, color: 'var(--ink3)' }}>+{p.colors.length - 4}</span>}
                    </div>
                  )}

                  {/* Stock controls + share */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {(!(p as any).type || (p as any).type === 'product') ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <button onClick={() => adjustStock(p.id, -1)} className="icon-btn" style={{ width: 24, height: 24, fontSize: 13, padding: 0 }}>−</button>
                        <span style={{
                          fontSize: 11, fontWeight: 700, minWidth: 26, textAlign: 'center',
                          color: p.stock === 0 ? 'var(--ember)' : p.stock <= settings.products.lowStockAlert ? '#F59E0B' : 'var(--ink2)',
                        }}>{p.stock}</span>
                        <button onClick={() => adjustStock(p.id, +1)} className="icon-btn" style={{ width: 24, height: 24, fontSize: 13, padding: 0 }}>+</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 10, color: 'var(--ink3)', fontWeight: 600 }}>
                        {(p as any).type === 'service' ? '🔧 خدمة' : '💻 رقمي'}
                        {(p as any).duration ? ` · ${(p as any).duration}` : ''}
                      </span>
                    )}
                    <button onClick={() => shareWA(p)} className="btn btn-ghost btn-xs" style={{ gap: 4, fontSize: 11 }}>
                      <Share2 size={11} /> واتساب
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          SMART PRODUCT WIZARD MODAL
         ════════════════════════════════════════════════════════ */}
      {showWizard && (
        <div className="modal-overlay" onClick={closeWizard}>
          <div
            className="modal"
            style={{ width: '100%', maxWidth: 540 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Hidden file inputs */}
            <input ref={cameraRef}  type="file" accept="image/*" capture="environment" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
            <input ref={galleryRef} type="file" accept="image/*"                        multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />

            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--ink1)' }}>
                  {editProd
                    ? (data.type === 'service' ? '✏️ تعديل الخدمة' : data.type === 'digital' ? '✏️ تعديل المنتج الرقمي' : '✏️ تعديل المنتج')
                    : (data.type === 'service' ? '🔧 خدمة جديدة' : data.type === 'digital' ? '💻 منتج رقمي' : '✨ منتج جديد')
                  }
                </h2>
                {step > 1 && data.category && (
                  <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 3 }}>
                    {CATS.find(c => c.id === data.category)?.icon} {CATS.find(c => c.id === data.category)?.label}
                    {' · '}الخطوة {step - 1} من {TOTAL_STEPS - 1}
                  </p>
                )}
              </div>
              <button onClick={closeWizard} style={{ background: 'none', border: 'none', color: 'var(--ink3)', cursor: 'pointer', padding: 6 }}>
                <X size={20} />
              </button>
            </div>

            {/* Progress bar */}
            {step > 1 && (
              <div className="progress-bar" style={{ height: 4, borderRadius: 0 }}>
                <div className="progress-fill" style={{ width: `${progress}%`, transition: 'width .35s', background: 'linear-gradient(90deg,var(--ember),var(--ember2))' }} />
              </div>
            )}

            <div className="modal-body">

              {/* ══ STEP 1: Category ═══════════════════════════════ */}
              {step === 1 && (
                <div>
                  <p style={{ fontSize: 14, color: 'var(--ink2)', fontWeight: 600, textAlign: 'center', marginBottom: 18 }}>
                    ما هو نوع ما تبيعه؟
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    {CATS.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setData(d => ({
                            ...d,
                            category: cat.id,
                            type: (cat.type || 'product') as 'product' | 'service' | 'digital',
                            sizes: CAT_CFG[cat.id]?.sizes?.slice(0, 3) || [],
                            colors: [],
                            variants: [],
                          }));
                          setStep(2);
                        }}
                        style={{
                          padding: '18px 14px', borderRadius: 14,
                          border: '1.5px solid var(--border)',
                          background: 'var(--panel2)', cursor: 'pointer',
                          textAlign: 'center', fontFamily: 'inherit',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                          transition: 'border-color .15s, background .15s',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget).style.borderColor = cat.color;
                          (e.currentTarget).style.background = `${cat.color}18`;
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget).style.borderColor = 'var(--border)';
                          (e.currentTarget).style.background = 'var(--panel2)';
                        }}
                      >
                        <span style={{ fontSize: 30 }}>{cat.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink1)' }}>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ══ STEP 2: Basic Info ═════════════════════════════ */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="label">{data.type === 'service' ? 'اسم الخدمة *' : data.type === 'digital' ? 'اسم المنتج الرقمي *' : 'اسم المنتج *'}</label>
                    <input
                      className="input" autoFocus
                      placeholder={data.type === 'service' ? 'مثال: تركيب كهرباء...' : data.type === 'digital' ? 'مثال: دورة تعلم البرمجة...' : 'مثال: قميص كتان أبيض...'}
                      value={data.name}
                      onChange={e => setData(d => ({ ...d, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label className="label" style={{ margin: 0 }}>{data.type === 'service' ? 'وصف الخدمة' : 'وصف المنتج'}</label>
                      <button
                        onClick={generateAI}
                        disabled={!data.name || aiLoading}
                        className="btn btn-ghost btn-xs"
                        style={{ gap: 5, color: 'var(--mint)', borderColor: 'rgba(0,210,179,.3)' }}
                      >
                        <Sparkles size={12} />
                        {aiLoading ? 'جارٍ التوليد...' : '✨ توليد AI'}
                      </button>
                    </div>
                    <textarea
                      className="textarea" rows={3}
                      placeholder={data.type === 'service' ? 'صف ما تقدمه من خدمات...' : 'وصف جذاب يشجع على الشراء...'}
                      value={data.description}
                      onChange={e => setData(d => ({ ...d, description: e.target.value }))}
                      style={{ resize: 'none' }}
                    />
                  </div>
                  {/* Service-specific fields */}
                  {data.type === 'service' && (
                    <>
                      <div>
                        <label className="label">مدة الخدمة</label>
                        <input
                          className="input"
                          placeholder="مثال: ساعتين، نصف يوم، يوم كامل..."
                          value={data.duration}
                          onChange={e => setData(d => ({ ...d, duration: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="label">منطقة العمل</label>
                        <input
                          className="input"
                          placeholder="مثال: الدار البيضاء، الرباط، جميع المدن..."
                          value={data.workArea}
                          onChange={e => setData(d => ({ ...d, workArea: e.target.value }))}
                        />
                      </div>
                    </>
                  )}
                  {/* Dynamic category fields */}
                  {cfg.fields.map(f => (
                    <div key={f.id}>
                      <label className="label">{f.label}</label>
                      <select className="select" value={data[f.id] || ''} onChange={e => setData(d => ({ ...d, [f.id]: e.target.value }))}>
                        <option value="">اختر...</option>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}

                  {/* ── Custom fields ────────────────────────────── */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink2)' }}>حقول مخصصة</span>
                      {!showAddField && (
                        <button onClick={() => setShowAddField(true)} className="btn btn-ghost btn-xs" style={{ gap: 4, fontSize: 11 }}>
                          <Plus size={11} /> إضافة حقل
                        </button>
                      )}
                    </div>

                    {/* Existing custom fields */}
                    {data.customFields.map(field => (
                      <div key={field.id} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <label className="label" style={{ margin: 0, fontSize: 11, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {field.label}
                            <span style={{ fontSize: 9, background: 'var(--panel2)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>
                              {FIELD_TYPE_LABELS[field.type]}
                            </span>
                          </label>
                          <button onClick={() => removeCustomField(field.id)} style={{ background: 'none', border: 'none', color: 'var(--ember)', cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: 1 }}>×</button>
                        </div>
                        {field.type === 'text' && (
                          <input className="input" value={field.value} placeholder={`أدخل ${field.label}...`}
                            onChange={e => updateCustomFieldValue(field.id, e.target.value)} />
                        )}
                        {field.type === 'number' && (
                          <input className="input" type="number" value={field.value} placeholder="0"
                            onChange={e => updateCustomFieldValue(field.id, e.target.value)} />
                        )}
                        {field.type === 'select' && (
                          <select className="select" value={field.value}
                            onChange={e => updateCustomFieldValue(field.id, e.target.value)}>
                            <option value="">اختر...</option>
                            {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        )}
                        {field.type === 'boolean' && (
                          <label style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 14px', background: 'var(--panel2)', borderRadius: 8, cursor: 'pointer' }}>
                            <input type="checkbox" checked={field.value === 'true'}
                              onChange={e => updateCustomFieldValue(field.id, String(e.target.checked))}
                              style={{ width: 18, height: 18 }} />
                            <span style={{ fontSize: 13, color: 'var(--ink2)' }}>{field.value === 'true' ? 'نعم' : 'لا'}</span>
                          </label>
                        )}
                        {field.type === 'color' && (
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <input type="color" value={field.value || '#000000'}
                              onChange={e => updateCustomFieldValue(field.id, e.target.value)}
                              style={{ width: 44, height: 44, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }} />
                            <span style={{ fontSize: 12, color: 'var(--ink3)', fontFamily: 'monospace' }}>{field.value || '#000000'}</span>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add field form */}
                    {showAddField && (
                      <div style={{ border: '1.5px dashed var(--border)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div>
                          <label className="label">اسم الحقل *</label>
                          <input className="input" autoFocus placeholder="مثال: نوع الياقة، مقاومة الماء..."
                            value={newField.label}
                            onChange={e => setNewField(f => ({ ...f, label: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') confirmAddField(); if (e.key === 'Escape') resetNewField(); }} />
                        </div>
                        <div>
                          <label className="label">نوع الحقل</label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                            {(Object.keys(FIELD_TYPE_LABELS) as CustomFieldType[]).map(type => (
                              <button key={type} onClick={() => setNewField(f => ({ ...f, type }))}
                                className={`chip ${newField.type === type ? 'active' : ''}`}
                                style={{ fontSize: 11, justifyContent: 'center' }}>
                                {FIELD_TYPE_LABELS[type]}
                              </button>
                            ))}
                          </div>
                        </div>
                        {newField.type === 'select' && (
                          <div>
                            <label className="label">الخيارات (افصل بفاصلة)</label>
                            <textarea className="textarea" rows={2}
                              placeholder="مثال: خيار 1، خيار 2، خيار 3"
                              value={newField.options}
                              onChange={e => setNewField(f => ({ ...f, options: e.target.value }))}
                              style={{ resize: 'none', fontSize: 12 }} />
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-primary btn-sm" style={{ flex: 1 }}
                            disabled={!newField.label.trim()}
                            onClick={confirmAddField}>
                            تأكيد
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={resetNewField}>إلغاء</button>
                        </div>
                      </div>
                    )}

                    {data.customFields.length === 0 && !showAddField && (
                      <p style={{ fontSize: 11, color: 'var(--ink3)', textAlign: 'center', padding: '8px 0' }}>
                        أضف حقولاً خاصة بمنتجك مثل "نوع الياقة" أو "مقاومة الماء"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ══ STEP 3: Media Upload ═══════════════════════════ */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink1)' }}>صور المنتج</p>

                  {/* Upload buttons */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="btn btn-ghost"
                      style={{ flex: 1, gap: 8, justifyContent: 'center' }}
                      onClick={() => cameraRef.current?.click()}
                      disabled={data.images.length >= 10}
                    >
                      <Camera size={16} /> 📸 تصوير الآن
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ flex: 1, gap: 8, justifyContent: 'center' }}
                      onClick={() => galleryRef.current?.click()}
                      disabled={data.images.length >= 10}
                    >
                      <Image size={16} /> 🖼️ من المعرض
                    </button>
                  </div>

                  {/* Image grid */}
                  {data.images.length > 0 && (
                    <div style={imgGrid}>
                      {data.images.map((src, i) => (
                        <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                          <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {i === 0 && (
                            <span style={{ position: 'absolute', bottom: 3, right: 3, background: 'var(--ember)', color: '#fff', fontSize: 8, padding: '2px 4px', borderRadius: 4 }}>رئيسية</span>
                          )}
                          <button
                            onClick={() => removeImage(i)}
                            style={{
                              position: 'absolute', top: 3, left: 3, width: 20, height: 20,
                              borderRadius: '50%', background: 'rgba(0,0,0,.7)', border: 'none',
                              color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: 11,
                            }}
                          >×</button>
                        </div>
                      ))}
                      {data.images.length < 10 && (
                        <button
                          onClick={() => galleryRef.current?.click()}
                          style={{
                            aspectRatio: '1', borderRadius: 10, border: '2px dashed var(--border)',
                            background: 'var(--panel2)', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', color: 'var(--ink3)', fontSize: 22,
                          }}
                        >+</button>
                      )}
                    </div>
                  )}

                  <p style={{ fontSize: 10, color: 'var(--ink3)', textAlign: 'center' }}>
                    {data.images.length}/10 صور
                  </p>

                  {/* URL fallback */}
                  <div>
                    <label className="label">أو أدخل رابط URL</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        ref={urlInputRef}
                        className="input" dir="ltr"
                        placeholder="https://example.com/photo.jpg"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            addImageUrl(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          if (urlInputRef.current) { addImageUrl(urlInputRef.current.value); urlInputRef.current.value = ''; }
                        }}
                      >إضافة</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ STEP 4: Colors & Variants ═════════════════════ */}
              {step === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink1)' }}>اختر الألوان المتوفرة</p>

                  {/* Category colour chips */}
                  {cfg.colors.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {cfg.colors.map(c => {
                        const selected = !!data.variants.find(v => v.color === c);
                        return (
                          <button
                            key={c}
                            onClick={() => selected ? removeVariant(data.variants.find(v => v.color === c)!.id) : addVariant(c, hexFor(c))}
                            className={`chip ${selected ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                          >
                            <Swatch hex={hexFor(c)} size={12} />
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Custom colour row */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={customColorHex}
                      onChange={e => setCustomColorHex(e.target.value)}
                      style={{ width: 38, height: 38, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }}
                    />
                    <input
                      className="input"
                      placeholder="اسم اللون بالعربي (مثال: نيلي)"
                      value={customColorName}
                      onChange={e => setCustomColorName(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={!customColorName.trim()}
                      onClick={() => {
                        addVariant(customColorName.trim(), customColorHex);
                        setCustomColorName('');
                      }}
                    >إضافة</button>
                  </div>

                  {/* Variant cards */}
                  {data.variants.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {data.variants.map(variant => {
                        const varCamRef = (el: HTMLInputElement | null) => { variantCameraRefs.current[variant.id] = el; };
                        const varGalRef = (el: HTMLInputElement | null) => { variantGalleryRefs.current[variant.id] = el; };
                        return (
                          <div key={variant.id} style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                            {/* Hidden inputs per variant */}
                            <input ref={varCamRef} type="file" accept="image/*" capture="environment" multiple style={{ display: 'none' }} onChange={e => handleVariantFiles(variant.id, e.target.files)} />
                            <input ref={varGalRef} type="file" accept="image/*"                        multiple style={{ display: 'none' }} onChange={e => handleVariantFiles(variant.id, e.target.files)} />

                            {/* Header row */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--panel2)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Swatch hex={variant.hex} size={20} />
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink1)' }}>{variant.color}</span>
                                <span style={{ fontSize: 10, color: 'var(--ink3)' }}>
                                  ({variant.sizes.reduce((a, s) => a + (s.stock || 0), 0)} قطعة)
                                </span>
                              </div>
                              <button
                                onClick={() => removeVariant(variant.id)}
                                className="icon-btn danger"
                                style={{ width: 24, height: 24, padding: 0 }}
                              ><X size={12} /></button>
                            </div>

                            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                              {/* Variant mini image uploader */}
                              <div>
                                <label className="label" style={{ marginBottom: 6 }}>صور هذا اللون</label>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  {variant.images.map((src, i) => (
                                    <div key={i} style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
                                      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      <button
                                        onClick={() => setData(d => ({
                                          ...d,
                                          variants: d.variants.map(v =>
                                            v.id === variant.id ? { ...v, images: v.images.filter((_, ii) => ii !== i) } : v,
                                          ),
                                        }))}
                                        style={{ position: 'absolute', top: 1, left: 1, width: 14, height: 14, borderRadius: '50%', background: 'rgba(0,0,0,.7)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                      >×</button>
                                    </div>
                                  ))}
                                  {variant.images.length < 5 && (
                                    <div style={{ display: 'flex', gap: 6 }}>
                                      <button
                                        className="icon-btn"
                                        style={{ width: 48, height: 48, borderRadius: 8, border: '1.5px dashed var(--border)', fontSize: 18 }}
                                        onClick={() => variantCameraRefs.current[variant.id]?.click()}
                                        title="تصوير"
                                      ><Camera size={16} /></button>
                                      <button
                                        className="icon-btn"
                                        style={{ width: 48, height: 48, borderRadius: 8, border: '1.5px dashed var(--border)', fontSize: 18 }}
                                        onClick={() => variantGalleryRefs.current[variant.id]?.click()}
                                        title="المعرض"
                                      ><Image size={16} /></button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Sizes with stock inputs */}
                              {cfg.sizes.length > 0 && (
                                <div>
                                  <label className="label" style={{ marginBottom: 6 }}>المقاسات والمخزون</label>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {cfg.sizes.map(sz => {
                                      const sizeEntry = variant.sizes.find(s => s.name === sz);
                                      const checked = !!sizeEntry;
                                      return (
                                        <div key={sz} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                          <button
                                            onClick={() => toggleVariantSize(variant.id, sz)}
                                            className={`chip ${checked ? 'active' : ''}`}
                                            style={{ fontSize: 11, minWidth: 38 }}
                                          >{sz}</button>
                                          {checked && (
                                            <input
                                              type="number" min="0"
                                              value={sizeEntry?.stock ?? 0}
                                              onChange={e => updateVariantSizeStock(variant.id, sz, Number(e.target.value))}
                                              style={{ width: 48, textAlign: 'center', fontSize: 11, padding: '4px 4px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--panel2)', color: 'var(--ink1)', fontFamily: 'inherit' }}
                                            />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {cfg.sizes.length === 0 && (
                                <div>
                                  <label className="label">المخزون</label>
                                  <input
                                    type="number" min="0"
                                    className="input"
                                    value={variant.sizes[0]?.stock ?? 0}
                                    onChange={e => {
                                      const val = Number(e.target.value);
                                      setData(d => ({
                                        ...d,
                                        variants: d.variants.map(v =>
                                          v.id === variant.id ? { ...v, sizes: [{ name: 'default', stock: val }] } : v,
                                        ),
                                      }));
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Variant total */}
                      <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--panel2)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--ink2)' }}>إجمالي المخزون</span>
                        <strong style={{ fontSize: 16, color: 'var(--mint)' }}>{totalVariantStock} قطعة</strong>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '18px', borderRadius: 12, border: '1px dashed var(--border)', textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>
                      لا ألوان محددة — سيحسب المخزون يدوياً
                    </div>
                  )}
                </div>
              )}

              {/* ══ STEP 5: Pricing ══════════════════════════════ */}
              {step === 5 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="label">سعر البيع ({settings.brand.currency}) *</label>
                      <input className="input" type="number" min="0" placeholder="0" value={data.price}
                        onChange={e => setData(d => ({ ...d, price: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">سعر التكلفة ({settings.brand.currency})</label>
                      <input className="input" type="number" min="0" placeholder="0" value={data.cost}
                        onChange={e => setData(d => ({ ...d, cost: e.target.value }))} />
                    </div>
                  </div>

                  {/* Margin display */}
                  {data.price && data.cost && Number(data.price) > 0 && (
                    <div style={{
                      padding: '14px 16px', borderRadius: 12,
                      background: margin >= 30 ? 'rgba(0,210,179,.08)' : margin >= 10 ? 'rgba(246,196,83,.08)' : 'rgba(255,106,0,.08)',
                      border: `1px solid ${margin >= 30 ? 'rgba(0,210,179,.25)' : margin >= 10 ? 'rgba(246,196,83,.25)' : 'rgba(255,106,0,.25)'}`,
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

                  {/* Stock — not applicable for services/digital */}
                  {data.type !== 'service' && data.type !== 'digital' && (
                    data.variants.length > 0 ? (
                      <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--panel2)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--ink2)' }}>المخزون (من الألوان)</span>
                        <strong style={{ fontSize: 16, color: 'var(--mint)' }}>{totalVariantStock} قطعة</strong>
                      </div>
                    ) : (
                      <div>
                        <label className="label">المخزون الأولي</label>
                        <input className="input" type="number" min="0" placeholder="0" value={data.stock}
                          onChange={e => setData(d => ({ ...d, stock: e.target.value }))} />
                      </div>
                    )
                  )}
                </div>
              )}

              {/* ══ STEP 6: Design Studio ════════════════════════ */}
              {step === 6 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink1)' }}>
                      <Palette size={15} style={{ display: 'inline', marginLeft: 6 }} />
                      استوديو التصميم
                    </p>
                    <span style={{ fontSize: 10, color: 'var(--ink3)' }}>اختياري</span>
                  </div>

                  {data.images.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 12, color: 'var(--ink3)', fontSize: 13 }}>
                      لا توجد صور مُضافة — أضف صوراً في الخطوة السابقة
                    </div>
                  ) : (
                    <>
                      {/* Options panel */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                          { key: 'showName',  label: 'اسم المتجر على الصورة' },
                          { key: 'showPrice', label: 'عرض السعر على الصورة' },
                          { key: 'watermark', label: 'علامة مائية خفية' },
                        ].map(opt => (
                          <label key={opt.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--panel2)', borderRadius: 10, cursor: 'pointer' }}>
                            <span style={{ fontSize: 13, color: 'var(--ink2)' }}>{opt.label}</span>
                            <input
                              type="checkbox"
                              checked={!!(data.designOpts as any)[opt.key]}
                              onChange={e => setData(d => ({ ...d, designOpts: { ...d.designOpts, [opt.key]: e.target.checked } }))}
                              style={{ width: 18, height: 18, cursor: 'pointer' }}
                            />
                          </label>
                        ))}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--panel2)', borderRadius: 10 }}>
                          <span style={{ fontSize: 13, color: 'var(--ink2)', flex: 1 }}>لون النص</span>
                          <input
                            type="color"
                            value={data.designOpts.textColor}
                            onChange={e => setData(d => ({ ...d, designOpts: { ...d.designOpts, textColor: e.target.value } }))}
                            style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }}
                          />
                        </div>
                      </div>

                      {/* Apply button */}
                      <button
                        className="btn btn-primary"
                        onClick={applyToAll}
                        disabled={designing || data.images.length === 0}
                        style={{ gap: 8 }}
                      >
                        {designing ? '⏳ جارٍ المعالجة...' : '✨ تطبيق على جميع الصور'}
                      </button>

                      {/* Preview grid */}
                      {(data.processedImages.length > 0 ? data.processedImages : data.images).map((src, i) => (
                        <div key={i} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                          <img src={src} alt="" style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 200 }} />
                          <button
                            onClick={() => downloadImage(src, i)}
                            className="btn btn-ghost btn-sm"
                            style={{ position: 'absolute', bottom: 8, left: 8, gap: 5 }}
                          >
                            <Download size={13} /> تحميل
                          </button>
                          {data.processedImages.length > 0 && (
                            <span style={{ position: 'absolute', top: 6, right: 6, background: 'var(--mint)', color: '#000', fontSize: 9, padding: '2px 6px', borderRadius: 99, fontWeight: 700 }}>
                              معالجة
                            </span>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* ══ STEP 7: Preview & Publish ════════════════════ */}
              {step === 7 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink1)', textAlign: 'center' }}>
                    <Eye size={15} style={{ display: 'inline', marginLeft: 6 }} />
                    معاينة المنتج
                  </p>

                  {/* Product preview card */}
                  <div style={{ borderRadius: 16, border: '1px solid var(--border2)', overflow: 'hidden', background: 'var(--panel2)' }}>
                    {(() => {
                      const allImgs = data.processedImages.length ? data.processedImages : data.images;
                      const thumb = allImgs[0] || '';
                      return thumb ? (
                        <img src={thumb} alt={data.name} style={{ width: '100%', height: 200, objectFit: 'cover' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>{cfg.emoji}</div>
                      );
                    })()}

                    <div style={{ padding: '14px 16px' }}>
                      <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--ink1)', marginBottom: 4 }}>{data.name || 'اسم المنتج'}</h3>
                      {data.description && (
                        <p style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 10, lineHeight: 1.55 }}>
                          {data.description.slice(0, 100)}{data.description.length > 100 ? '...' : ''}
                        </p>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--ember)' }}>
                          {data.price || '0'} <span style={{ fontSize: 12 }}>{settings.brand.currency}</span>
                        </span>
                        {margin > 0 && (
                          <span style={{ fontSize: 11, color: margin >= 30 ? 'var(--mint)' : margin >= 10 ? 'var(--gold)' : 'var(--ember)', fontWeight: 700 }}>
                            هامش {margin}%
                          </span>
                        )}
                      </div>

                      {/* Colour swatches preview */}
                      {data.variants.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
                          {data.variants.map(v => (
                            <span key={v.id} title={v.color} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ink3)' }}>
                              <Swatch hex={v.hex} size={16} />
                              {v.color}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Custom fields preview */}
                      {data.customFields.length > 0 && (
                        <div style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {data.customFields.map(f => (
                            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink3)' }}>
                              <span>{f.label}</span>
                              <span style={{ color: 'var(--ink2)', fontWeight: 600 }}>
                                {f.type === 'boolean' ? (f.value === 'true' ? 'نعم' : 'لا')
                                  : f.type === 'color' ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                      <span style={{ width: 12, height: 12, borderRadius: '50%', background: f.value, display: 'inline-block', border: '1px solid rgba(255,255,255,.3)' }} />
                                      {f.value}
                                    </span>
                                  ) : f.value || '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Summary row */}
                      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--ink3)', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                        <span>🖼️ {(data.processedImages.length ? data.processedImages : data.images).length} صورة</span>
                        <span>🎨 {data.variants.length} لون</span>
                        <span>📦 {data.variants.length > 0 ? totalVariantStock : (Number(data.stock) || 0)} قطعة</span>
                        {data.variants.length > 0 && (
                          <span>📐 {[...new Set(data.variants.flatMap(v => v.sizes.map(s => s.name)))].length} مقاس</span>
                        )}
                        {data.customFields.length > 0 && (
                          <span>🔧 {data.customFields.length} حقل</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--ink3)', textAlign: 'center' }}>
                    راجع البيانات جيداً قبل النشر
                  </p>
                </div>
              )}

            </div>{/* end modal-body */}

            {/* ── Modal Footer ────────────────────────────────── */}
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              {step > 1 ? (
                <button onClick={() => setStep(s => s - 1)} className="btn btn-ghost btn-sm">
                  <ChevronRight size={14} /> رجوع
                </button>
              ) : <div />}

              <div style={{ display: 'flex', gap: 8 }}>
                {step === TOTAL_STEPS ? (
                  <>
                    <button
                      onClick={() => save('draft')}
                      disabled={saving || !data.name || !data.price}
                      className="btn btn-ghost"
                    >
                      💾 مسودة
                    </button>
                    <button
                      onClick={() => save('published')}
                      disabled={saving || !data.name || !data.price}
                      className="btn btn-primary"
                    >
                      {saving ? '...' : '🚀 نشر الآن'}
                    </button>
                  </>
                ) : step === 6 ? (
                  <>
                    <button onClick={() => setStep(s => s + 1)} className="btn btn-ghost btn-sm">
                      تخطي
                    </button>
                    <button onClick={() => setStep(s => s + 1)} className="btn btn-primary">
                      التالي <ChevronLeft size={14} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    disabled={step === 2 && !data.name}
                    className="btn btn-primary"
                  >
                    {step === TOTAL_STEPS - 1 ? 'معاينة' : 'التالي'} <ChevronLeft size={14} />
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
