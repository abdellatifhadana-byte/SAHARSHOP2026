'use strict';
// ============================================================
// /api/recommend — توصيات فوق Business Graph
//   ?source=&id=  → أنشطة ذات صلة بنشاط مفتوح
//   ?q=&city=     → أنشطة مكمّلة لاستعلام (سباك → كهربائي/نجار…)
// ============================================================
const router = require('express').Router();
const recommend = require('../lib/engines/recommend');

router.get('/', async (req, res) => {
  const { source, id } = req.query;
  const q    = String(req.query.q || '').trim().slice(0, 80) || undefined;
  const city = String(req.query.city || '').trim() || undefined;
  try {
    if (source && id && ['store', 'provider', 'listing'].includes(source)) {
      return res.json(await recommend.forBusiness(source, id));
    }
    if (q) return res.json(await recommend.forQuery({ q, city }));
    res.json({ businesses: [] });
  } catch (e) { console.error('[recommend]', e.message); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
