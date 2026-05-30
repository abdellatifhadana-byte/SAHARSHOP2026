'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { db } = require('../database');

router.get('/', auth, (req, res) => {
  res.json(db.getLoyaltyAll(req.user.id));
});

router.get('/:customerId', auth, (req, res) => {
  const loyalty = db.getLoyalty(req.user.id, req.params.customerId);
  res.json(loyalty || { points: 0, totalEarned: 0, tier: 'silver' });
});

router.post('/add', auth, (req, res) => {
  const { customerId, amount } = req.body;
  const pts = parseFloat(amount);
  if (!customerId || !isFinite(pts) || pts <= 0) return res.status(400).json({ error: 'customerId and positive amount required' });
  db.addLoyaltyPoints(req.user.id, customerId, pts);
  const loyalty = db.getLoyalty(req.user.id, customerId);
  res.json(loyalty || { points: 0, totalEarned: 0, tier: 'silver' });
});

module.exports = router;
