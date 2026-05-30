'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { db } = require('../database');

// GET /api/coupons — list all (merchant dashboard)
router.get('/', auth, (req, res) => {
  res.json(db.getCoupons(req.user.id));
});

// POST /api/coupons — create coupon
router.post('/', auth, (req, res) => {
  const { code, type, value, minOrder, maxUses, expiresAt } = req.body;
  if (!code || !value) return res.status(400).json({ error: 'code and value required' });
  const existing = db.getCouponByCode(req.user.id, code);
  if (existing) return res.status(409).json({ error: 'هذا الكود موجود بالفعل' });
  const coupon = db.createCoupon({ userId: req.user.id, code, type, value, minOrder, maxUses, expiresAt });
  db.addLog({ userId: req.user.id, user: 'Manager', action: `Coupon created: ${code}`, details: `${type} ${value}`, type: 'info', severity: 'info' });
  res.json(coupon);
});

// PUT /api/coupons/:id — update
router.put('/:id', auth, (req, res) => {
  db.updateCoupon(req.params.id, req.body);
  res.json({ ok: true });
});

// DELETE /api/coupons/:id — delete
router.delete('/:id', auth, (req, res) => {
  db.deleteCoupon(req.params.id);
  res.json({ ok: true });
});

// GET /api/coupons/validate?code=X&userId=Y&total=Z — public (called from storefront)
router.get('/validate', async (req, res) => {
  const { code, userId, total } = req.query;
  if (!code || !userId) return res.status(400).json({ error: 'code and userId required' });
  const orderTotal = parseFloat(total) || 0;
  const result = db.validateCoupon(userId, code, orderTotal);
  if (result.valid) {
    // Increment usage counter on successful validation
    db.incrementCouponUse(result.couponId);
  }
  res.json(result);
});

module.exports = router;
