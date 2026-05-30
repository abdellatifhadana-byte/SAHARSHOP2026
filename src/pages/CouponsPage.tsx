import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import * as api from '../services/api';
import { Plus, Copy, Trash2, RefreshCw, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed' | 'shipping';
  value: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
}

interface CouponForm {
  code: string;
  type: 'percent' | 'fixed' | 'shipping';
  value: string;
  minOrder: string;
  maxUses: string;
  expiresAt: string;
  active: boolean;
}

const EMPTY_FORM: CouponForm = {
  code: '',
  type: 'percent',
  value: '',
  minOrder: '',
  maxUses: '',
  expiresAt: '',
  active: true,
};

// ─── Helper: generate random coupon code ─────────────────────────────────────
function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// ─── Helper: build API base URL ───────────────────────────────────────────────
function apiBase(): string {
  if (typeof window !== 'undefined') {
    if (window.location.port === '5173' || window.location.port === '4173') {
      return 'http://localhost:3001/api';
    }
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:3001/api';
}

function authHeaders(): Record<string, string> {
  const token = api.getToken();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CouponsPage() {
  const { settings } = useStore();
  const currency = settings.brand?.currency || 'MAD';

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CouponForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  // ── Fetch coupons ──────────────────────────────────────────────────────────
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBase()}/coupons`, {
        headers: authHeaders(),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'فشل تحميل الكوبونات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  // ── Create coupon ──────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setFormError('');
    if (!form.code.trim()) { setFormError('الرجاء إدخال رمز الكوبون'); return; }
    if (form.type !== 'shipping' && (!form.value || isNaN(Number(form.value)) || Number(form.value) <= 0)) {
      setFormError('الرجاء إدخال قيمة صحيحة للخصم'); return;
    }
    setSaving(true);
    try {
      const body: any = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: form.type === 'shipping' ? 0 : Number(form.value),
        minOrder: Number(form.minOrder) || 0,
        maxUses: Number(form.maxUses) || 0,
        active: form.active,
      };
      if (form.expiresAt) body.expiresAt = form.expiresAt;

      const res = await fetch(`${apiBase()}/coupons`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const created = await res.json();
      setCoupons(prev => [created, ...prev]);
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch (e: any) {
      setFormError(e.message || 'فشل إنشاء الكوبون');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete coupon ──────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!window.confirm('هل تريد حذف هذا الكوبون؟')) return;
    try {
      const res = await fetch(`${apiBase()}/coupons/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch (e: any) {
      alert('فشل حذف الكوبون: ' + (e.message || ''));
    }
  };

  // ── Copy code ─────────────────────────────────────────────────────────────
  const handleCopy = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // fallback
    }
  };

  // ── WhatsApp share ────────────────────────────────────────────────────────
  const handleWhatsApp = (code: string) => {
    const text = encodeURIComponent(
      `مرحباً! استخدم كود الخصم: ${code}\nأدخله عند إتمام طلبك للحصول على خصمك.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatValue = (c: Coupon): string => {
    if (c.type === 'percent') return `${c.value}%`;
    if (c.type === 'fixed') return `${c.value} ${currency}`;
    return 'شحن مجاني';
  };

  const isExpired = (c: Coupon): boolean => {
    if (!c.expiresAt) return false;
    return new Date(c.expiresAt) < new Date();
  };

  const formatDate = (d: string): string => {
    try {
      return new Date(d).toLocaleDateString('ar-MA', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return d; }
  };

  const openModal = () => { setForm(EMPTY_FORM); setFormError(''); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setFormError(''); };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="page-title">الكوبونات</h1>
          <p className="page-sub">{coupons.length} كوبون</p>
        </div>
        <button onClick={openModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} strokeWidth={2.5} />
          إضافة كوبون
        </button>
      </div>

      {/* ── Explanation banner ── */}
      <div style={{
        padding: '12px 16px',
        borderRadius: 'var(--r)',
        background: 'rgba(0,210,179,0.08)',
        border: '1px solid rgba(0,210,179,0.2)',
        fontSize: 13.5,
        color: 'var(--ink2)',
        lineHeight: 1.6,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
        <span>
          <strong style={{ color: 'var(--ink)' }}>كيف تعمل الكوبونات؟</strong>{' '}
          الكوبون يُعطيه التاجر للزبون عبر واتساب، الزبون يدخله في المتجر عند الطلب للحصول على خصمه تلقائياً.
        </span>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 'var(--r)', background: 'var(--ember-soft)', border: '1px solid rgba(255,106,0,.25)', color: 'var(--ember)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚠️</span> {error}
          <button onClick={fetchCoupons} style={{ marginRight: 'auto', background: 'none', border: 'none', color: 'var(--ember)', cursor: 'pointer', padding: '2px 6px', fontSize: 12 }}>إعادة المحاولة</button>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', color: 'var(--ink3)', fontSize: 14 }}>
          جاري التحميل...
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && coupons.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 20px', color: 'var(--ink3)' }}>
          <span style={{ fontSize: 48 }}>🎟️</span>
          <p style={{ fontSize: 14, fontWeight: 600 }}>لا توجد كوبونات بعد</p>
          <p style={{ fontSize: 12.5, textAlign: 'center' }}>أنشئ أول كوبون خصم وشاركه مع زبائنك</p>
          <button onClick={openModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Plus size={15} /> إضافة كوبون
          </button>
        </div>
      )}

      {/* ── Coupons grid ── */}
      {!loading && coupons.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {coupons.map(coupon => {
            const expired = isExpired(coupon);
            const statusActive = coupon.active && !expired;
            const usageText = coupon.maxUses > 0
              ? `${coupon.usedCount}/${coupon.maxUses}`
              : `${coupon.usedCount}/∞`;
            const usageFull = coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses;

            return (
              <div key={coupon.id} className="card" style={{
                padding: '16px',
                position: 'relative',
                opacity: (!statusActive || usageFull) ? 0.7 : 1,
                border: statusActive && !usageFull
                  ? '1px solid rgba(0,210,179,0.2)'
                  : '1px solid var(--border)',
              }}>
                {/* Status pill */}
                <div style={{ position: 'absolute', top: 12, left: 14 }}>
                  {usageFull ? (
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(255,106,0,0.1)', color: 'var(--ember)', border: '1px solid rgba(255,106,0,0.2)' }}>نفدت</span>
                  ) : expired ? (
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(255,106,0,0.1)', color: 'var(--ember)', border: '1px solid rgba(255,106,0,0.2)' }}>منتهي</span>
                  ) : statusActive ? (
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(0,210,179,0.1)', color: 'var(--mint)', border: '1px solid rgba(0,210,179,0.2)' }}>نشط</span>
                  ) : (
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', color: 'var(--ink3)', border: '1px solid var(--border)' }}>معطل</span>
                  )}
                </div>

                {/* Code */}
                <div style={{ marginTop: 28, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: 20,
                    fontWeight: 900,
                    letterSpacing: 2,
                    color: 'var(--ink)',
                    background: 'rgba(255,255,255,0.06)',
                    padding: '4px 10px',
                    borderRadius: 7,
                    border: '1px dashed var(--border)',
                    flex: 1,
                    textAlign: 'center',
                  }}>
                    {coupon.code}
                  </span>
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--ink3)' }}>الخصم</span>
                    <span style={{ fontWeight: 800, color: 'var(--ink)', fontSize: 15 }}>{formatValue(coupon)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--ink3)' }}>الاستخدامات</span>
                    <span style={{ fontWeight: 700, color: usageFull ? 'var(--ember)' : 'var(--ink2)' }}>{usageText}</span>
                  </div>
                  {coupon.minOrder > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--ink3)' }}>الحد الأدنى</span>
                      <span style={{ fontWeight: 700, color: 'var(--ink2)' }}>{coupon.minOrder} {currency}</span>
                    </div>
                  )}
                  {coupon.expiresAt && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--ink3)' }}>الصلاحية</span>
                      <span style={{ fontWeight: 700, color: expired ? 'var(--ember)' : 'var(--ink2)', fontSize: 12 }}>
                        {formatDate(coupon.expiresAt)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleCopy(coupon.code)}
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12.5 }}
                    title="نسخ الرمز"
                  >
                    {copied === coupon.code
                      ? <><span style={{ color: 'var(--mint)' }}>✓</span> تم النسخ</>
                      : <><Copy size={13} strokeWidth={2} /> نسخ</>
                    }
                  </button>
                  <button
                    onClick={() => handleWhatsApp(coupon.code)}
                    style={{
                      flex: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      padding: '6px 10px', borderRadius: 'var(--r-sm)',
                      background: 'rgba(37,211,102,0.1)',
                      border: '1px solid rgba(37,211,102,0.25)',
                      color: '#25D366',
                      fontSize: 12.5, fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                    title="مشاركة عبر واتساب"
                  >
                    <span style={{ fontSize: 14 }}>💬</span> واتساب
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="btn btn-ghost btn-sm"
                    style={{ width: 34, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ember)', flexShrink: 0 }}
                    title="حذف"
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ MODAL ══ */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal} style={{ zIndex: 1100 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440 }}>
            {/* Modal header */}
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>إضافة كوبون جديد</h2>
              <button onClick={closeModal}
                style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--ink3)', cursor: 'pointer' }}>
                <X size={15} strokeWidth={2.2} />
              </button>
            </div>

            {/* Modal body */}
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Code field */}
              <div>
                <label className="label">رمز الكوبون</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input"
                    placeholder="مثال: SUMMER20"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    style={{ flex: 1, fontFamily: 'monospace', letterSpacing: 1, fontWeight: 700 }}
                    maxLength={20}
                  />
                  <button
                    onClick={() => setForm(f => ({ ...f, code: randomCode() }))}
                    className="btn btn-ghost"
                    style={{ padding: '0 12px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, flexShrink: 0 }}
                    title="توليد تلقائي"
                    type="button"
                  >
                    <RefreshCw size={13} strokeWidth={2} /> توليد
                  </button>
                </div>
              </div>

              {/* Type field */}
              <div>
                <label className="label">نوع الخصم</label>
                <select
                  className="select"
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as CouponForm['type'] }))}
                >
                  <option value="percent">نسبة مئوية (%)</option>
                  <option value="fixed">مبلغ ثابت ({currency})</option>
                  <option value="shipping">شحن مجاني</option>
                </select>
              </div>

              {/* Value field (hidden for shipping) */}
              {form.type !== 'shipping' && (
                <div>
                  <label className="label">
                    {form.type === 'percent' ? 'نسبة الخصم (%)' : `قيمة الخصم (${currency})`}
                  </label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={form.type === 'percent' ? 100 : undefined}
                    placeholder={form.type === 'percent' ? '20' : '50'}
                    value={form.value}
                    onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  />
                </div>
              )}

              {/* Min order */}
              <div>
                <label className="label">الحد الأدنى للطلب ({currency}) <span style={{ color: 'var(--ink3)', fontWeight: 400 }}>اختياري</span></label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.minOrder}
                  onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))}
                />
              </div>

              {/* Max uses */}
              <div>
                <label className="label">أقصى عدد استخدامات <span style={{ color: 'var(--ink3)', fontWeight: 400 }}>0 = غير محدود</span></label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.maxUses}
                  onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                />
              </div>

              {/* Expiry date */}
              <div>
                <label className="label">تاريخ الانتهاء <span style={{ color: 'var(--ink3)', fontWeight: 400 }}>اختياري</span></label>
                <input
                  className="input"
                  type="date"
                  value={form.expiresAt}
                  onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                />
              </div>

              {/* Active toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--r-sm)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>تفعيل الكوبون مباشرة</span>
                <button
                  onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                  style={{
                    width: 44, height: 24,
                    borderRadius: 99,
                    background: form.active ? 'var(--ember)' : 'var(--border)',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                  type="button"
                >
                  <span style={{
                    position: 'absolute',
                    top: 3, left: form.active ? 23 : 3,
                    width: 18, height: 18,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>

              {/* Form error */}
              {formError && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--ember-soft)', border: '1px solid rgba(255,106,0,0.2)', color: 'var(--ember)', fontSize: 12.5 }}>
                  ⚠️ {formError}
                </div>
              )}

              {/* Submit buttons */}
              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button onClick={closeModal} className="btn btn-ghost" style={{ flex: 1 }} type="button">
                  إلغاء
                </button>
                <button
                  onClick={handleCreate}
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  type="button"
                >
                  {saving ? 'جاري الحفظ...' : <><Plus size={15} strokeWidth={2.5} /> إنشاء الكوبون</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
