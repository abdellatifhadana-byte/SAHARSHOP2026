'use strict';
// ============================================================
// Marketplace listings — quick-seller submit → admin moderation
// → unified public catalog. Fully additive: does not touch the
// existing products/orders/storefront flows.
// ============================================================
const router    = require('express').Router();
const rateLimit = require('express-rate-limit');
const auth      = require('../middleware/auth');
const { db }    = require('../database');
const { sanitizeBody } = require('../middleware/validate');

// Platform-admin gate: if PLATFORM_ADMIN_EMAIL (or ADMIN_EMAIL) is set,
// only that account can moderate; otherwise any authenticated user can
// (keeps dev/MVP working without extra config).
function isPlatformAdmin(req) {
  const pa = process.env.PLATFORM_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  return !pa || (req.user && req.user.email === pa);
}

// Anti-spam: max 10 submissions/hour per IP for the public quick-seller form.
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 10,
  message: { error: 'إعلانات كثيرة من هذا الجهاز — حاول لاحقاً' },
  standardHeaders: true, legacyHeaders: false,
});

// POST /api/listings/public — quick seller submits a product/service (no account).
// Creates a PENDING listing; never visible until an admin approves.
router.post('/public', submitLimiter, sanitizeBody, async (req, res) => {
  try {
    const { type, name, price, description, category, city, images, duration, workArea, sellerName, sellerPhone } = req.body;
    if (!name || String(name).trim().length < 2) return res.status(400).json({ error: 'اسم الإعلان مطلوب' });
    if (!sellerName || !sellerPhone) return res.status(400).json({ error: 'اسمك ورقم هاتفك مطلوبان' });
    if (price != null && (isNaN(parseFloat(price)) || parseFloat(price) < 0)) return res.status(400).json({ error: 'السعر غير صحيح' });

    const listing = await db.createListing({
      type, name, price, description, category, city,
      images: Array.isArray(images) ? images.slice(0, 6) : [],
      duration, workArea, sellerName, sellerPhone,
    });
    if (!listing) return res.status(500).json({ error: 'تعذّر إنشاء الإعلان' });
    res.status(201).json({ ok: true, id: listing.id, status: listing.status, message: 'تم استلام إعلانك — سيظهر بعد مراجعة الإدارة ✅' });
  } catch (e) { console.error('[listings/public]', e.message); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/listings/public/catalog?city=&type=  — unified catalog (APPROVED only)
router.get('/public/catalog', async (req, res) => {
  try {
    const t = req.query.type;
    const listings = await db.getPublicListings({
      city: req.query.city || undefined,
      type: t === 'service' ? 'service' : t === 'product' ? 'product' : undefined,
    });
    res.json({ listings });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/listings/public/:id  — single approved listing (+view count)
router.get('/public/:id', async (req, res) => {
  try {
    const l = await db.getListing(req.params.id);
    if (!l || l.status !== 'approved') return res.status(404).json({ error: 'Not found' });
    db.incrementListingViews(l.id).catch(() => {});
    res.json(l);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ── Admin moderation (platform admin) ──────────────────────────
// GET /api/listings?status=pending — moderation queue
router.get('/', auth, async (req, res) => {
  if (!isPlatformAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const s = req.query.status;
    const status = s && ['pending', 'approved', 'rejected', 'suspended'].includes(s) ? s : undefined;
    res.json(await db.getListingsForModeration(status));
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

function moderate(status) {
  return async (req, res) => {
    if (!isPlatformAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    try {
      const l = await db.setListingStatus(req.params.id, status, (req.body && req.body.reason) || '');
      if (!l) return res.status(404).json({ error: 'Not found' });
      res.json(l);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
  };
}
router.put('/:id/approve', auth, moderate('approved'));
router.put('/:id/reject',  auth, moderate('rejected'));
router.put('/:id/suspend', auth, moderate('suspended'));

module.exports = router;
