'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { db } = require('../database');
const sync   = require('../sync');

// GET /api/customers?limit=50&offset=0&q=
// Paginated — default page size 50, max 200
router.get('/', auth, async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit)  || 50,  200);
    const offset = Math.max(parseInt(req.query.offset) || 0,   0);
    const q      = (req.query.q || '').toLowerCase().trim();

    const all      = await db.getCustomers(req.user.id);
    const filtered = q
      ? all.filter(c =>
          c.name?.toLowerCase().includes(q) ||
          c.phone?.includes(q)              ||
          c.city?.toLowerCase().includes(q)
        )
      : all;

    res.json({
      data:   filtered.slice(offset, offset + limit),
      total:  filtered.length,
      limit,
      offset,
      hasMore: offset + limit < filtered.length,
    });
  } catch (e) { console.error('[customers]', e.message); res.status(500).json({ error: 'Server error' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const c = await db.createCustomer({ ...req.body, userId: req.user.id });
    await db.addLog({ userId: req.user.id, user: 'Manager', action: `Customer added: ${c.name}`, details: c.phone, type: 'customer', severity: 'info' });
    sync.syncCustomer(req.user.id, c).catch(() => {});
    res.status(201).json(c);
  } catch (e) { console.error('[customers]', e.message); res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const c = await db.getCustomer(req.params.id);
    if (!c || c.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    res.json(c);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const c = await db.getCustomer(req.params.id);
    if (!c || c.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    res.json(await db.updateCustomer(req.params.id, req.body));
  } catch (e) { console.error('[customers]', e.message); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const c = await db.getCustomer(req.params.id);
    if (!c || c.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    await db.deleteCustomer(req.params.id, req.user.id);
    await db.addLog({ userId: req.user.id, user: 'Manager', action: `Customer removed: ${c.name}`, details: c.phone, type: 'customer', severity: 'warning' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/customers/public — self-registration (customer fills form)
router.post('/public', async (req, res) => {
  const { userId, name, phone, city, address, source, notes } = req.body;
  if (!userId || !name || !phone) return res.status(400).json({ error: 'userId, name, phone required' });
  try {
    const existing = (await db.getCustomers(userId)).find(c => c.phone === phone);
    if (existing) return res.json({ customer: existing, isNew: false });
    const customer = await db.createCustomer({ userId, name, phone, city: city||'', address: address||'', source: source||'Form', notes: notes||'', vip: false, trustScore: 80 });
    await db.addNotification({ userId, type: 'info', message: `👤 زبون جديد سجّل: ${name}` });
    res.status(201).json({ customer, isNew: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
