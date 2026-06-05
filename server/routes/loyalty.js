'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { db } = require('../database');

router.get('/', auth, async (req, res) => {
  try { res.json(await db.getLoyaltyAll(req.user.id)); }
  catch (e) { console.error('[loyalty]', e.message); res.status(500).json({ error: 'Server error' }); }
});

router.get('/:customerId', auth, async (req, res) => {
  try {
    const loyalty = await db.getLoyalty(req.user.id, req.params.customerId);
    res.json(loyalty || { points: 0, totalEarned: 0, tier: 'silver' });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/add', auth, async (req, res) => {
  try {
    const { customerId, amount } = req.body;
    const pts = parseFloat(amount);
    if (!customerId || !isFinite(pts) || pts <= 0) return res.status(400).json({ error: 'customerId and positive amount required' });
    await db.addLoyaltyPoints(req.user.id, customerId, pts);
    const loyalty = await db.getLoyalty(req.user.id, customerId);
    res.json(loyalty || { points: 0, totalEarned: 0, tier: 'silver' });
  } catch (e) { console.error('[loyalty]', e.message); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
