'use strict';
// ============================================================
// Rules Engine — طبقة قواعد العمل بين Event Bus و Notification Engine
// الإشعارات لا تشترك في الـBus مباشرة؛ بل Rules Engine يقرّر:
//   أي حدث → أي إشعار، لمن، وبأي دمج (throttle/aggregate).
// إضافة سلوك = قاعدة جديدة، بلا لمس المُصدِرات ولا القنوات.
// ============================================================
const bus = require('./eventbus');

// دمج بسيط لمنع الإغراق: مفتاح (نوع+هدف) خلال نافذة زمنية
const _window = new Map(); // key → { count, first }
const WINDOW_MS = 60 * 1000;
function throttled(key, max) {
  const now = Date.now();
  const w = _window.get(key);
  if (!w || now - w.first > WINDOW_MS) { _window.set(key, { count: 1, first: now }); return false; }
  w.count++;
  return w.count > max;
}

// كل قاعدة: { on: نمط الحدث, notify: (event, notifier) => void }
function defineRules(notifier) {
  return [
    // حجز جديد → أشعر صاحب النشاط (بحدّ 3/دقيقة لكل نشاط لتفادي الإغراق)
    { on: 'booking.created', run: (e) => {
        if (throttled(`booking:${e.businessId}`, 3)) return;
        notifier.notify({ audience: 'owner', businessId: e.businessId, channel: ['in-app', 'whatsapp'], event: e,
          message: `📅 حجز جديد${e.payload?.provider ? ` — ${e.payload.provider}` : ''}` });
      } },
    // عرض جديد → أشعر المتابعين (in-app)
    { on: 'offer.created', run: (e) => {
        notifier.notify({ audience: 'followers', businessId: e.businessId, channel: ['in-app'], event: e,
          message: `🎁 عرض جديد${e.payload?.code ? `: ${e.payload.code}` : ''}` });
      } },
    // تقييم جديد → أشعر صاحب النشاط
    { on: 'review.created', run: (e) => {
        notifier.notify({ audience: 'owner', businessId: e.businessId, channel: ['in-app'], event: e, message: '⭐ تقييم جديد على نشاطك' });
      } },
    // اعتماد نشاط → أشعر صاحبه
    { on: 'business.verified', run: (e) => {
        notifier.notify({ audience: 'owner', businessId: e.businessId, channel: ['in-app'], event: e, message: '✅ تم اعتماد نشاطك — أصبح ظاهراً في الاكتشاف' });
      } },
    // مخزون منخفض → أشعر التاجر
    { on: 'product.stock.low', run: (e) => {
        notifier.notify({ audience: 'owner', businessId: e.businessId, channel: ['in-app', 'whatsapp'], event: e,
          message: `⚠️ مخزون منخفض: ${e.payload?.name || 'منتج'}` });
      } },
  ];
}

let _wired = false;
function init(notifier) {
  if (_wired) return; _wired = true;
  for (const rule of defineRules(notifier)) {
    bus.subscribe(rule.on, (e) => { try { rule.run(e); } catch (err) { console.error('[rules]', rule.on, err.message); } });
  }
}

module.exports = { init, throttled, _window };
