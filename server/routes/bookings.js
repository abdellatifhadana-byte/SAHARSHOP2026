'use strict';
// ============================================================
// Services Marketplace (alloservix) — الحجوزات
// كشف تعارض المواعيد لكل مقدّم قبل التأكيد. الحجز العام (من واجهة
// المتجر) عبر /public مع تحقّق أن المقدّم يخصّ نفس المتجر (منع
// المراجع العابرة للمستأجرين — نفس مبدأ H-6).
// ============================================================
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { sanitizeBody } = require('../middleware/validate');
const { db } = require('../database');

const STATUS_AR = { pending: '⏳ بانتظار التأكيد', confirmed: '✅ مؤكّد', completed: '📦 منجز', cancelled: '❌ ملغى' };

// ── لوحة التاجر ──────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try { res.json(await db.getBookings(req.user.id, { providerId: req.query.providerId, status: req.query.status })); }
  catch (e) { console.error('[bookings]', e.message); res.status(500).json({ error: 'Server error' }); }
});

// إنشاء حجز من اللوحة (يحترم كشف التعارض أيضاً)
router.post('/', auth, sanitizeBody, async (req, res) => {
  try {
    const { providerId, customerName, customerPhone, scheduledAt } = req.body;
    if (!providerId || !customerName || !customerPhone || !scheduledAt)
      return res.status(400).json({ error: 'providerId, customerName, customerPhone, scheduledAt مطلوبة' });
    const provider = await db.getProvider(req.user.id, providerId);
    if (!provider) return res.status(404).json({ error: 'Provider not found' });

    const duration = Math.max(15, +req.body.durationMin || 60);
    const conflict = await db.findBookingConflict(providerId, scheduledAt, duration);
    if (conflict) return res.status(409).json({ error: 'الموعد يتعارض مع حجز آخر لهذا المقدّم', conflictAt: conflict.scheduledAt });

    const booking = await db.createBooking(req.user.id, { ...req.body, durationMin: duration, status: req.body.status || 'confirmed' });
    await db.addLog({ userId: req.user.id, user: 'Manager', action: `Booking created: ${provider.name}`, details: booking.scheduledAt, type: 'info', severity: 'info' });
    res.status(201).json(booking);
  } catch (e) { console.error('[bookings]', e.message); res.status(500).json({ error: 'Server error' }); }
});

// تغيير الحالة (تأكيد/إنجاز/إلغاء)
router.put('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const updated = await db.updateBookingStatus(req.user.id, req.params.id, status);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ── حجز عام من واجهة المتجر ──────────────────────────────────
// (rate-limit مطبّق في index.js على /api/bookings/public)
router.post('/public', sanitizeBody, async (req, res) => {
  try {
    const { userId, providerId, customerName, customerPhone, scheduledAt } = req.body;
    if (!userId || !providerId || !customerName || !customerPhone || !scheduledAt)
      return res.status(400).json({ error: 'userId, providerId, customerName, customerPhone, scheduledAt مطلوبة' });

    // العزل بين المتاجر: المقدّم يجب أن يخصّ نفس المتجر ويكون معتمداً
    const provider = await db.getProvider(userId, providerId);
    if (!provider || provider.status !== 'approved') return res.status(404).json({ error: 'مقدّم الخدمة غير متاح' });

    // السعر يُحسب من الخادم إن حُدّدت خدمة (لا ثقة بالمتصفح)
    let duration = Math.max(15, +req.body.durationMin || 60), price = 0;
    if (req.body.serviceId) {
      const svc = (await db.getProviderServices(providerId)).find(s => s.id === req.body.serviceId);
      if (svc) { duration = svc.durationMin || duration; price = svc.priceMin || 0; }
    }

    const conflict = await db.findBookingConflict(providerId, scheduledAt, duration);
    if (conflict) return res.status(409).json({ error: 'هذا الموعد محجوز — اختر وقتاً آخر' });

    const booking = await db.createBooking(userId, {
      providerId, serviceId: req.body.serviceId, customerName, customerPhone,
      scheduledAt, durationMin: duration, price, notes: req.body.notes, status: 'pending',
    });
    await db.addNotification({ userId, type: 'info', message: `📅 حجز جديد: ${customerName} مع ${provider.name}` });
    // Activity: حجز جديد → حدث خاص (private) يغذّي Notifications لا الـ Feed العام
    try { require('../lib/engines/activity').emit({ businessId: `provider:${providerId}`, actor: userId, type: 'booking.created', category: 'booking', visibility: 'private', payload: { provider: provider.name } }); } catch {}
    res.status(201).json({ id: booking.id, status: booking.status, statusAr: STATUS_AR[booking.status], scheduledAt: booking.scheduledAt });
  } catch (e) { console.error('[bookings/public]', e.message); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
