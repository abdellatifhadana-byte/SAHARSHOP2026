'use strict';
// ============================================================
// /api/feed — timelines فوق Activity Engine (كلها استعلام واحد list())
//   ?type=local&city=  ·  ?type=category&category=  ·  ?type=trending
//   ?type=following&ids=a,b,c  ·  (افتراضي) أحدث الأنشطة العامة
// ============================================================
const router = require('express').Router();
const activity = require('../lib/engines/activity');

router.get('/', (req, res) => {
  const type = String(req.query.type || 'latest');
  const limit = Math.min(+req.query.limit || 30, 100);
  try {
    if (type === 'trending') return res.json({ type, trending: activity.trending(), items: activity.list({ limit }) });
    if (type === 'local')    return res.json({ type, items: activity.list({ city: req.query.city || undefined, limit }) });
    if (type === 'category') return res.json({ type, items: activity.list({ category: req.query.category || undefined, limit }) });
    if (type === 'following') {
      const ids = String(req.query.ids || '').split(',').map(s => s.trim()).filter(Boolean);
      return res.json({ type, items: activity.list({ businessIds: ids, limit }) });
    }
    res.json({ type: 'latest', items: activity.list({ limit }) });
  } catch (e) { console.error('[feed]', e.message); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
