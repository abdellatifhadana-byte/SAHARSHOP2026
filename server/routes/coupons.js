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
    if (!code || !value) return res.status(400).json({ error: 'code and value required' });
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
router.get('/validate', async (req, res) => {
  const { code, userId, total } = req.query;
  if (!code || !userId) return res.status(400).json({ error: 'code and userId required' });
  const orderTotal = parseFloat(total) || 0;
  try {
    const result = await db.validateCoupon(userId, code, orderTotal);
    if (result.valid) {
      await db.incrementCouponUse(result.couponId);
    }
    res.json(result);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
