'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { db } = require('../database');

// GET /api/coupons — list all (merchant dashboard)
router.get('/', auth, async (req, res) => {
  try { res.json(await db.getCoupons(req.user.id)); }
  catch (e) { console.error('[coupons]', e.message); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/coupons — create coupon
router.post('/', auth, async (req, res) => {
  try {
    const { code, type, value, minOrder, maxUses, expiresAt } = req.body;
    // value == null (وليس !value): كوبون الشحن المجاني قيمته 0 وهو صحيح
    if (!code || value == null) return res.status(400).json({ error: 'code and value required' });
    if (type !== 'shipping' && +value <= 0) return res.status(400).json({ error: 'قيمة الخصم يجب أن تكون أكبر من صفر' });
    const existing = await db.getCouponByCode(req.user.id, code);
    if (existing) return res.status(409).json({ error: 'هذا الكود موجود بالفعل' });
    const coupon = await db.createCoupon({ userId: req.user.id, code, type, value, minOrder, maxUses, expiresAt });
    await db.addLog({ userId: req.user.id, user: 'Manager', action: `Coupon created: ${code}`, details: `${type} ${value}`, type: 'info', severity: 'info' });
    res.json(coupon);
  } catch (e) { console.error('[coupons]', e.message); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/coupons/:id — update
router.put('/:id', auth, async (req, res) => {
  try {
    await db.updateCoupon(req.params.id, req.body);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/coupons/:id — delete
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.deleteCoupon(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/coupons/validate?code=X&userId=Y&total=Z — public (called from storefront)
// حماية: التحقق لا يستهلك الاستخدام — الاستهلاك يتم عند إنشاء الطلب فعلياً
router.get('/validate', async (req, res) => {
  const { code, userId, total } = req.query;
  if (!code || !userId) return res.status(400).json({ error: 'code and userId required' });
  const orderTotal = parseFloat(total) || 0;
  try {
    const result = await db.validateCoupon(userId, code, orderTotal);
    res.json(result);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ── عجلة الحظ ────────────────────────────────────────────────────
// الجوائز ثابتة الترتيب (تطابق رسم العجلة في الواجهة) مع أوزان احتمالية
// محسوبة لصالح التاجر: أغلب النتائج خصومات صغيرة أو "حظ أوفر".
const WHEEL_PRIZES = [
  { label: 'خصم 5%',         type: 'percentage', value: 5,  weight: 28 },
  { label: 'حظ أوفر 🍀',     type: 'none',       value: 0,  weight: 22 },
  { label: 'خصم 8%',         type: 'percentage', value: 8,  weight: 18 },
  { label: 'توصيل مجاني 🚚', type: 'shipping',   value: 0,  weight: 14 },
  { label: 'خصم 10%',        type: 'percentage', value: 10, weight: 12 },
  { label: 'خصم 15% 🎉',     type: 'percentage', value: 15, weight: 6  },
];

// POST /api/coupons/public/spin — لف العجلة (عام، بدون auth)
// الحماية: جائزة واحدة صالحة 48 ساعة، استخدام واحد، حد أدنى للطلب،
// وسقف يومي لعدد أكواد العجلة لكل متجر.
router.post('/public/spin', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    const settings = await db.getSettings(userId) || {};
    const wheelCfg = settings.promotions?.wheel || {};
    if (wheelCfg.enabled === false) return res.status(403).json({ error: 'عجلة الحظ غير مفعّلة في هذا المتجر' });

    // سقف يومي يحمي التاجر من إغراق المتجر بأكواد خصم
    const todayCount = await db.countCouponsCreatedToday(userId, 'WHEEL-');
    const dailyCap = Math.min(+wheelCfg.dailyCap || 100, 500);
    if (todayCount >= dailyCap) return res.status(429).json({ error: 'انتهت جوائز اليوم — عُد غداً! 🍀' });

    // اختيار موزون
    const totalW = WHEEL_PRIZES.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * totalW, index = 0;
    for (let i = 0; i < WHEEL_PRIZES.length; i++) { r -= WHEEL_PRIZES[i].weight; if (r <= 0) { index = i; break; } }
    const prize = WHEEL_PRIZES[index];

    if (prize.type === 'none') {
      return res.json({ index, label: prize.label, type: 'none', code: null });
    }

    const code = 'WHEEL-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    const minOrder = Math.max(+wheelCfg.minOrder || 150, 0);
    await db.createCoupon({ userId, code, type: prize.type, value: prize.value, minOrder, maxUses: 1, expiresAt });
    res.json({ index, label: prize.label, type: prize.type, value: prize.value, code, expiresAt, minOrder });
  } catch (e) { console.error('[wheel]', e.message); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
