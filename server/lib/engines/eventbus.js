'use strict';
// ============================================================
// Event Bus — ناقل أحداث داخلي (in-process pub/sub)
// النواة التي تجعل Notifications/Feed/Analytics/Recommendation مجرد
// مشتركين (subscribers) بدل منطق مبعثر. بسيط الآن، وقابل للاستبدال
// لاحقاً بـ (Redis/Kafka) خلف نفس الواجهة publish/subscribe.
// ============================================================
const _subs = new Map(); // type-pattern → Set<handler>

// pattern: 'offer.created' أو 'offer.*' أو '*' (كل الأحداث)
function subscribe(pattern, handler) {
  if (!_subs.has(pattern)) _subs.set(pattern, new Set());
  _subs.get(pattern).add(handler);
  return () => _subs.get(pattern)?.delete(handler);
}

function _matches(pattern, type) {
  if (pattern === '*') return true;
  if (pattern === type) return true;
  if (pattern.endsWith('.*')) return type.startsWith(pattern.slice(0, -1)); // 'offer.' يطابق 'offer.created'
  return false;
}

// نشر غير حاجب: فشل مشترك لا يُسقط الناشر ولا بقية المشتركين
function publish(event) {
  for (const [pattern, handlers] of _subs) {
    if (!_matches(pattern, event.type)) continue;
    for (const h of handlers) {
      try { Promise.resolve(h(event)).catch(e => console.error('[eventbus]', event.type, e.message)); }
      catch (e) { console.error('[eventbus]', event.type, e.message); }
    }
  }
  return event;
}

module.exports = { subscribe, publish, _subs };
