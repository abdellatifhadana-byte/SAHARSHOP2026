'use strict';
// ============================================================
// Services Marketplace (alloservix) — مقدّمو الخدمات
// كل المسارات مقيَّدة بالمستأجر (req.user.id) على نمط products/orders.
// ملاحظة عزل: الكتابة تتطلّب مصادقة؛ العرض العام يمرّ عبر /api/providers/public.
// ============================================================
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { sanitizeBody } = require('../middleware/validate');
const { db } = require('../database');

// ── لوحة التاجر: إدارة المقدّمين ─────────────────────────────
router.get('/', auth, async (req, res) => {
  try { res.json(await db.getProviders(req.user.id, { status: req.query.status, q: req.query.q })); }
  catch (e) { console.error('[providers]', e.message); res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const p = await db.getProvider(req.user.id, req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    p.services = await db.getProviderServices(p.id);
    p.availability = await db.getAvailabilityTemplates(p.id);
    res.json(p);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', auth, sanitizeBody, async (req, res) => {
  try {
    if (!req.body.name) return res.status(400).json({ error: 'الاسم مطلوب' });
    const p = await db.createProvider(req.user.id, req.body);
    res.status(201).json(p);
  } catch (e) { console.error('[providers]', e.message); res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', auth, sanitizeBody, async (req, res) => {
  try {
    const existing = await db.getProvider(req.user.id, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    res.json(await db.updateProvider(req.user.id, req.params.id, req.body));
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// موافقة/رفض/تعليق (لوحة الأدمن)
router.put('/:id/status', auth, async (req, res) => {
  const { status, adminNote } = req.body;
  if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const existing = await db.getProvider(req.user.id, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const p = await db.updateProvider(req.user.id, req.params.id, { status, adminNote });
    await db.addLog({ userId: req.user.id, user: 'Admin', action: `Provider ${status}: ${p.name}`, details: adminNote || '', type: 'info', severity: 'info' });
    // Activity: اعتماد مقدّم خدمة → حدث عام (business.verified)
    if (status === 'approved') {
      try { require('../lib/engines/activity').emit({ businessId: `provider:${p.id}`, actor: 'admin', type: 'business.verified', category: 'business', city: p.city || null, payload: { name: p.name } }); } catch {}
    }
    res.json(p);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const ok = await db.deleteProvider(req.user.id, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ── خدمات المقدّم ────────────────────────────────────────────
router.post('/:id/services', auth, sanitizeBody, async (req, res) => {
  try {
    const p = await db.getProvider(req.user.id, req.params.id);
    if (!p) return res.status(404).json({ error: 'Provider not found' });
    if (!req.body.serviceKey || !req.body.serviceLabel) return res.status(400).json({ error: 'serviceKey و serviceLabel مطلوبان' });
    const sid = await db.addProviderService(p.id, req.body);
    res.status(201).json({ id: sid });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id/services/:sid', auth, async (req, res) => {
  try {
    const p = await db.getProvider(req.user.id, req.params.id);
    if (!p) return res.status(404).json({ error: 'Provider not found' });
    await db.removeProviderService(p.id, req.params.sid);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ── التوفّر ──────────────────────────────────────────────────
router.put('/:id/availability', auth, async (req, res) => {
  try {
    const p = await db.getProvider(req.user.id, req.params.id);
    if (!p) return res.status(404).json({ error: 'Provider not found' });
    await db.setAvailabilityTemplates(p.id, req.body.templates || []);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ── العرض العام (Discover) — مقدّمون معتمدون فقط ─────────────
router.get('/public/:userId', async (req, res) => {
  try {
    const all = await db.getProviders(req.params.userId, { status: 'approved', q: req.query.q });
    // لا نكشف ملاحظات الأدمن أو الهاتف كاملاً في القائمة العامة
    const list = await Promise.all(all.map(async p => ({
      id: p.id, name: p.name, bio: p.bio, city: p.city, avatarUrl: p.avatarUrl,
      isVerified: p.isVerified, ratingAvg: p.ratingAvg, ratingCount: p.ratingCount,
      services: await db.getProviderServices(p.id),
    })));
    res.json(list);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
