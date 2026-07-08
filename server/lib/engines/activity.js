'use strict';
// ============================================================
// Activity Engine — كل ما يحدث في المنصّة = Event بعقد موحّد
//   { id, businessId, actor, type, category, visibility, city, createdAt, payload }
// emit() يبني الحدث، يخزّنه، وينشره على Event Bus → فتصبح
// Notifications / Feed / Analytics / Recommendation مجرّد مشتركين.
// التخزين الآن حلقة في الذاكرة (Facade)؛ يُستبدَل لاحقاً بجدول activities
// خلف نفس الواجهة دون تغيير المستهلكين.
// ============================================================
const crypto = require('crypto');
const bus = require('./eventbus');

const CAP = 1000;
const _ring = [];               // أحدث الأنشطة (حلقة مقيّدة)
const _trend = new Map();       // category → count (نافذة الجلسة)

function _push(ev) {
  _ring.unshift(ev);
  if (_ring.length > CAP) _ring.pop();
  _trend.set(ev.category, (_trend.get(ev.category) || 0) + 1);
}

const EVENT_VERSION = 1; // Event Versioning: تطوير صيغة الأحداث دون كسر المشتركين

// إصدار حدث موحّد
function emit({ businessId, actor = 'system', type, category, visibility = 'public', city = null, payload = {}, version = EVENT_VERSION }) {
  if (!type) throw new Error('activity type required');
  const ev = {
    version,                                 // نسخة صيغة الحدث
    id: crypto.randomUUID(),
    businessId: businessId || null,
    actor,
    type,                                    // مثال: 'offer.created'
    category: category || type.split('.')[0], // مثال: 'offer'
    visibility,
    city,
    createdAt: new Date().toISOString(),
    payload,
  };
  _push(ev);
  bus.publish(ev); // Notifications/Analytics/… تلتقطه كمشتركين
  return ev;
}

// استعلام موحّد (كل الـ timelines تُبنى فوقه)
function list({ city, category, businessId, businessIds, type, limit = 30 } = {}) {
  let out = _ring.filter(e => e.visibility === 'public');
  if (city)        out = out.filter(e => e.city === city);
  if (category)    out = out.filter(e => e.category === category);
  if (type)        out = out.filter(e => e.type === type);
  if (businessId)  out = out.filter(e => e.businessId === businessId);
  if (businessIds && businessIds.length) { const s = new Set(businessIds); out = out.filter(e => s.has(e.businessId)); }
  return out.slice(0, Math.min(limit, 100));
}

// أكثر الفئات نشاطاً (Trending)
function trending(limit = 8) {
  return [..._trend.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([category, count]) => ({ category, count }));
}

module.exports = { emit, list, trending, EVENT_VERSION, _ring };
