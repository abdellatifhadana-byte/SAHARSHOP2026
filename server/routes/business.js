'use strict';
// ============================================================
// Universal Business Engine — المسارات العامة
//   GET /api/business/search?city=&q=&type=&limit=  → { businesses, products }
//   GET /api/business/:source/:id                    → { business, sections }
// عام، مجهَّل، للقراءة فقط، محدود المعدّل (index.js). لا يكشف إلا
// الأنشطة المعتمَدة والمحتوى المنشور — لا PII ولا أسرار.
// ============================================================
const router = require('express').Router();
const biz = require('../lib/business');
const searchEngine = require('../lib/engines/search');

// Search Engine Pipeline: Normalize → Intent → Engine → Ranking → Response
router.get('/search', async (req, res) => {
  const city  = String(req.query.city || '').trim() || undefined;
  const q     = String(req.query.q || '').trim().slice(0, 80) || undefined;
  const type  = ['store', 'service'].includes(req.query.type) ? req.query.type : undefined;
  const lat   = req.query.lat != null ? +req.query.lat : undefined;
  const lng   = req.query.lng != null ? +req.query.lng : undefined;
  const limit = Math.min(+req.query.limit || 24, 60);
  try {
    const result = await searchEngine.execute({ q, city, type, lat, lng, limit });
    res.json(result); // { intent, filters, weights, businesses, products }
  } catch (e) { console.error('[business/search]', e.message); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/business/nearby?lat=&lng=&radiusKm=&city=&q=&type=  → للخريطة
router.get('/nearby', async (req, res) => {
  const { lat, lng } = req.query;
  const radiusKm = Math.min(+req.query.radiusKm || 25, 100);
  const city = String(req.query.city || '').trim() || undefined;
  const q    = String(req.query.q || '').trim().slice(0, 80) || undefined;
  const type = ['store', 'service'].includes(req.query.type) ? req.query.type : undefined;
  try {
    const businesses = await biz.searchNearby({ lat, lng, radiusKm, city, q, type, limit: 60 });
    // Map-ready: viewport + markers جاهزة للخريطة مباشرة
    const markers = businesses.filter(b => b.location).map(b => ({
      id: b.id, source: b.source, name: b.name, lat: b.location.lat, lng: b.location.lng,
      type: b.type, verified: b.verified, rating: b.rating.avg, href: b.href, distanceKm: b.distanceKm,
    }));
    const center = (lat != null && lng != null) ? { lat: +lat, lng: +lng } : null;
    res.json({ businesses, viewport: { center, radiusKm, count: markers.length }, markers });
  } catch (e) { console.error('[business/nearby]', e.message); res.status(500).json({ error: 'Server error' }); }
});

router.get('/:source/:id', async (req, res) => {
  const { source, id } = req.params;
  if (!['store', 'provider', 'listing'].includes(source)) return res.status(400).json({ error: 'Unknown business type' });
  try {
    const profile = await biz.getProfile(source, id);
    if (!profile) return res.status(404).json({ error: 'النشاط غير موجود أو غير معتمد' });
    res.json(profile);
  } catch (e) { console.error('[business/profile]', e.message); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
